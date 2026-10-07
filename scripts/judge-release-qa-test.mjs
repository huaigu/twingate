#!/usr/bin/env node
/* Read-only staged-release QA. API routes and wallet interactions are browser
   stubs: this script never signs in, sends messages or invokes hosted AI. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const base = process.env.SIGNALPASS_QA_BASE;
if (!base) throw new Error('Set SIGNALPASS_QA_BASE to the staged server URL.');
const out = process.env.SIGNALPASS_QA_OUTPUT;
if (out) await mkdir(out, {recursive:true});
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
const result = {base, startedAt:new Date().toISOString(), checks:[], failures:[], api:'Wallet/session API routes stubbed. Media checks include read-only health/ready GETs. No hosted AI or mutations.'};
async function check(name, fn) {
  if (process.env.SIGNALPASS_QA_FILTER && !new RegExp(process.env.SIGNALPASS_QA_FILTER).test(name)) return;
  try {await fn(); result.checks.push(name); console.log('PASS '+name);}
  catch(error){result.failures.push({name,error:error.message});console.log('FAIL '+name+': '+error.message);}
}
async function noOverflow(page) {
  const size = await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,10).map(e=>({tag:e.tagName,id:e.id,cls:e.className,right:e.getBoundingClientRect().right}))}));
  assert.ok(size.scroll<=size.width+1,`Horizontal overflow: ${JSON.stringify(size)}`);
}
async function twoLines(locator, expected) {
  const value=await locator.evaluate(el=>({text:[...el.children].map(n=>n.textContent),boxes:[...el.children].map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,bottom:r.bottom,width:r.width}})}));
  assert.deepEqual(value.text,expected);
  assert.equal(value.boxes.length,2);
  assert.ok(value.boxes[1].y>=value.boxes[0].bottom-1,'Second status line begins below first');
}
async function screenshot(page,name) {if(out){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:resolve(out,name+'.png'),fullPage:true});}}
const contexts=[];
try {
  for(const width of [320,390,1280]) {
    await check(`Two-line session/wallet pending and rejection retry at ${width}px`,async()=>{
      const context=await browser.newContext({viewport:{width,height:900}});contexts.push(context);
      const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
      let releaseChain;const gate=new Promise(resolve=>{releaseChain=resolve;});
      const intercepted=[];
      await page.route('**/api/**',async route=>{
        const path=new URL(route.request().url()).pathname;intercepted.push(path);
        if(path==='/api/chain/config'){await gate;await route.fulfill({json:{enabled:false}});}
        else if(path==='/api/me')await route.fulfill({status:401,json:{error:'authentication_required'}});
        else if(path==='/api/profiles')await route.fulfill({json:{profiles:[]}});
        else await route.fulfill({status:500,json:{error:'unexpected_test_route'}});
      });
      await page.addInitScript(()=>{
        window.__testWalletCalls=0;
        window.ethereum={on:()=>{},request:async({method})=>{
          if(method!=='eth_requestAccounts')throw new Error('Unexpected wallet method: '+method);
          window.__testWalletCalls++;
          return new Promise((resolve,reject)=>{window.__rejectTestWallet=()=>reject(new Error('Wallet request rejected for this UI test.'));});
        }};
      });
      await page.goto(base+'/?demo=0',{waitUntil:'domcontentloaded'});
      await page.locator('.session-loading').waitFor();
      await twoLines(page.locator('.session-loading'),['Loading…','Checking your session']);
      await noOverflow(page);await screenshot(page,`loading-${width}`);
      releaseChain();await page.locator('#session-action').waitFor();
      const button=page.locator('#session-action');assert.equal(await button.textContent(),'Connect wallet');
      await button.click();await page.waitForFunction(()=>typeof window.__rejectTestWallet==='function');
      assert.equal(await button.isDisabled(),true);assert.equal(await button.getAttribute('aria-busy'),'true');
      await twoLines(button.locator('.session-busy-label'),['Connecting…','Check your wallet']);
      await noOverflow(page);await screenshot(page,`wallet-pending-${width}`);
      await page.evaluate(()=>window.__rejectTestWallet());await page.waitForFunction(()=>!document.getElementById('session-action').disabled);
      assert.equal(await button.textContent(),'Connect wallet');assert.equal(await button.getAttribute('aria-busy'),null);
      assert.match(await page.locator('.v4-session-copy').textContent(),/Wallet request rejected/);
      await button.click();await page.waitForFunction(()=>window.__testWalletCalls===2);
      assert.equal(await button.isDisabled(),true);assert.equal(await button.getAttribute('aria-busy'),'true');
      await page.evaluate(()=>window.__rejectTestWallet());
      await page.waitForFunction(()=>!document.getElementById('session-action').disabled);
      assert.ok(intercepted.every(path=>['/api/chain/config','/api/me','/api/profiles'].includes(path)),JSON.stringify(intercepted));
      assert.deepEqual(errors,[]);
      await context.close();
    });
  }
  await check('Evidence CTA contrast and mobile layout at 320/390/1280px',async()=>{
    const context=await browser.newContext();contexts.push(context);const page=await context.newPage();
    for(const width of [320,390,1280]) {
      await page.setViewportSize({width,height:900});await page.goto(base+'/v4/evidence.html');await noOverflow(page);
      const colors=await page.locator('.btn-primary').evaluate(el=>{const s=getComputedStyle(el);return{color:s.color,background:s.backgroundColor};});
      function lum(text){const rgb=text.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];}
      const l=[lum(colors.color),lum(colors.background)].sort((a,b)=>b-a);const contrast=(l[0]+.05)/(l[1]+.05);
      assert.ok(contrast>=4.5,`Primary CTA contrast ${contrast}: ${JSON.stringify(colors)}`);
      assert.ok((await page.locator('body').textContent()).includes('fictional'));
      await screenshot(page,`evidence-${width}`);
    }
    for(const path of ['/v4/evaluation-results.json','/v4/evaluation-methodology.md','/v4/evaluation-claim-review.md','/v4/walkthrough.html']) {
      const response=await page.evaluate(async path=>{const r=await fetch(path,{credentials:'same-origin'});return{status:r.status,data:path.endsWith('evaluation-results.json')?await r.json():null};},path);assert.equal(response.status,200,path);
      if(path.endsWith('evaluation-results.json')) {
        const data=response.data;
        assert.equal(data.mode,'live');assert.equal(data.complete,true);assert.equal(data.providerCalls,20);assert.equal(data.cases.length,20);
        assert.equal(data.hosted.strictCaseSuccess.numerator,14);assert.equal(data.baseline.strictCaseSuccess.numerator,15);
        assert.equal(data.hosted.correctAbstention.numerator,4);assert.equal(data.hosted.failures,0);
      }
    }
    await context.close();
  });
  await check('Watch tabs select playable V3 films, correct durations and captions',async()=>{
    const context=await browser.newContext();contexts.push(context);const page=await context.newPage();
    await page.goto(base+'/media/signalpass-demo-20261003.html');
    await page.waitForFunction(()=>Number.isFinite(document.getElementById('film').duration),null,{timeout:30000});
    const demo=await page.locator('#film').evaluate(v=>({src:v.currentSrc,duration:v.duration,error:v.error?.message}));
    assert.ok(demo.src.endsWith('/media/signalpass-live-demo-20261007-v3.mp4'));assert.ok(Math.abs(demo.duration-173)<1,JSON.stringify(demo));assert.ok(!demo.error);
    await page.locator('#film').evaluate(v=>{v.muted=true;return v.play();});
    await page.waitForFunction(()=>document.getElementById('film').currentTime>=.35&&!document.getElementById('film').error,null,{timeout:10000});
    await page.locator('#film').evaluate(v=>v.pause());
    assert.match(await page.locator('[data-film="demo"]').textContent(),/2:53/);
    await page.locator('[data-film="pitch"]').click();
    await page.waitForFunction(()=>document.getElementById('film').currentSrc.endsWith('signalpass-product-pitch-20261007-v3.mp4')&&Number.isFinite(document.getElementById('film').duration),null,{timeout:30000});
    const pitch=await page.locator('#film').evaluate(v=>({src:v.currentSrc,duration:v.duration,error:v.error?.message}));
    assert.ok(Math.abs(pitch.duration-111)<1,JSON.stringify(pitch));assert.ok(!pitch.error);
    await page.locator('#film').evaluate(v=>{v.muted=true;return v.play();});
    await page.waitForFunction(()=>document.getElementById('film').currentTime>=.35&&!document.getElementById('film').error,null,{timeout:10000});
    await page.locator('#film').evaluate(v=>v.pause());
    assert.equal(await page.locator('[data-film="pitch"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('[data-film="demo"]').getAttribute('aria-pressed'),'false');
    assert.match(await page.locator('[data-film="pitch"]').textContent(),/1:51/);
    assert.equal(await page.locator('#captions').getAttribute('href'),'/media/signalpass-product-pitch-20261007-v3.en.srt');
    await page.locator('[data-film="demo"]').click();
    assert.equal(await page.locator('#captions').getAttribute('href'),'/media/signalpass-live-demo-20261007-v3.en.srt');
    for(const width of [320,390,1280]) {await page.setViewportSize({width,height:900});await noOverflow(page);await screenshot(page,`watch-${width}`);}
    for(const path of ['/media/signalpass-live-demo-20261007-v3.en.srt','/media/signalpass-product-pitch-20261007-v3.en.srt','/media/signalpass-demo-20261007-v3.png']) {const status=await page.evaluate(async path=>(await fetch(path,{credentials:'same-origin'})).status,path);assert.equal(status,200,path);}
    result.videos=[{...demo,playbackAdvanced:true},{...pitch,playbackAdvanced:true}];
    result.publicProxy=[];
    for(const path of ['/api/health','/api/ready']) {
      const status=await page.evaluate(async path=>(await fetch(path,{credentials:'same-origin'})).status,path);
      assert.equal(status,200,path);result.publicProxy.push({path,status});
    }
    const range=await page.evaluate(async()=>{const r=await fetch('/media/signalpass-live-demo-20261007-v3.mp4',{headers:{Range:'bytes=0-1023'}});return{status:r.status,contentRange:r.headers.get('Content-Range'),bytes:(await r.arrayBuffer()).byteLength};});
    assert.equal(range.status,206);assert.equal(range.bytes,1024);assert.match(range.contentRange,/^bytes 0-1023\/\d+$/);
    result.publicProxy.push({path:'/media/signalpass-live-demo-20261007-v3.mp4',...range});
    await context.close();
  });
} finally {
  await browser.close();result.finishedAt=new Date().toISOString();
  if(out)await writeFile(resolve(out,'qa-results.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({passed:result.checks.length,failed:result.failures.length}));
  if(result.failures.length)process.exitCode=1;
}
