#!/usr/bin/env node
/** Browser-level guided-sample checks. Run with node scripts/walkthrough-test.mjs.
 *  Set PLAYWRIGHT_MODULE_PATH if Playwright is installed outside this repository.
 *  Set WALKTHROUGH_URL to check an already running site; otherwise serves local public/.
 *  Optional WALKTHROUGH_SCREENSHOT_DIR writes review screenshots.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const publicPath = resolve(fileURLToPath(new URL('../apps/web/public/', import.meta.url)));
let server;
let url = process.env.WALKTHROUGH_URL;
if (!url) {
  server = createServer(async (request, response) => {
    const relative = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const path = resolve(publicPath, `.${relative}`);
    if (!path.startsWith(`${publicPath}/`)) {response.writeHead(403).end(); return;}
    try {
      const data = await readFile(path);
      response.writeHead(200, {'Content-Type': ({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[extname(path)] || 'application/octet-stream'}).end(data);
    } catch {response.writeHead(404).end();}
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}/v4/walkthrough.html`;
}
const browser = await chromium.launch({headless: true, args: ['--no-sandbox']});
let passed = 0;
const screenshotDir = process.env.WALKTHROUGH_SCREENSHOT_DIR;
if (screenshotDir) await mkdir(screenshotDir, {recursive:true});
async function check(label, fn) {await fn(); passed++; console.log(`PASS ${label}`);}
async function step(page, expected) {assert.equal(await page.locator('#walk-scene').getAttribute('data-step'), String(expected));}
async function next(page) {await page.locator('[data-action="next"]').click();}
async function toContacts(page) {
  await page.goto(url); await next(page);
  await page.locator('#sample-select-bob').check(); await next(page);
  await page.locator('#sample-reviewed').check(); await next(page); await next(page);
  await next(page); await next(page); await next(page); await step(page, 7);
}
async function noOverflow(page) {
  const overflow = await page.evaluate(() => ({width: innerWidth, scroll: document.documentElement.scrollWidth, step: document.getElementById('walk-scene').dataset.step, elements: [...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width && (r.right>innerWidth+1 || r.left < -1)}).map(e=>({tag:e.tagName,id:e.id,cls:e.className,box:{left:e.getBoundingClientRect().left,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right}}))}));
  assert.ok(overflow.scroll <= overflow.width + 1, `No page-wide horizontal overflow: ${JSON.stringify(overflow)}`);
}
try {
  const context = await browser.newContext({viewport:{width:1280,height:900}});
  const page = await context.newPage();
  const errors = [], external = [], mutations = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (!request.url().startsWith(new URL(url).origin)) external.push(request.url());
    if (request.method() !== 'GET' || ['fetch','xhr','websocket'].includes(request.resourceType())) mutations.push(request.url());
  });
  await page.addInitScript(() => {localStorage.setItem('signalpass-existing-session-test', 'untouched');sessionStorage.setItem('signalpass-existing-draft-test', 'untouched');});
  await check('Explicit match selection, review and send; edited text survives handoff', async () => {
    await page.goto(url); await step(page,0); await next(page); await step(page,1);
    assert.equal(await page.locator('[data-action="next"]').isDisabled(),true);
    await page.locator('#sample-select-bob').check();
    if (screenshotDir) {await page.evaluate(()=>window.scrollTo(0,0)); await page.waitForTimeout(200); await page.screenshot({path:resolve(screenshotDir,'walkthrough-desktop-match.png'),fullPage:true});}
    await next(page); await step(page,2);
    assert.equal(await page.locator('[data-action="next"]').isDisabled(),true);
    await page.locator('#sample-reviewed').check();
    const edited = 'Hi Bob — please review this clickable wallet prototype for 15 minutes. Focus on the first approval. <img src=x onerror="window.injectionRan=true">';
    await page.locator('#sample-draft').fill(edited);
    assert.equal(await page.locator('#sample-reviewed').isChecked(),false,'Editing invalidates earlier review');
    assert.equal(await page.locator('[data-action="next"]').isDisabled(),true);
    await page.locator('#sample-reviewed').check(); await next(page); await step(page,3);
    assert.equal(await page.locator('.walk-message p').textContent(),edited);
    assert.equal(await page.locator('.walk-message img').count(),0,'Draft rendered as text, not HTML');
    await next(page); await step(page,4);
    assert.equal(await page.locator('.walk-message p').textContent(),edited);
    assert.equal(await page.locator('#walk-role').textContent(),'BOB’S VIEW');
    assert.equal(await page.evaluate(() => document.activeElement.id),'step-title');
    await page.locator('#sample-question').fill('');
    assert.equal(await page.locator('[data-action="next"]').isDisabled(),true);
    await page.locator('#sample-question').fill('Live app?');
    assert.equal(await page.locator('[data-action="next"]').isDisabled(),false,'A short question is accepted');
    await page.locator('#sample-question').fill('Which wallet approval would you like me to review first?'); await next(page);
    assert.equal(await page.locator('.walk-message p').textContent(),'Which wallet approval would you like me to review first?');
    await page.locator('#sample-answer').fill('Prototype.');
    assert.equal(await page.locator('[data-action="next"]').isDisabled(),false,'A short answer is accepted');
    await page.locator('#sample-answer').fill('The first ERC-20 token approval is what I would like you to review.'); await next(page);
    assert.equal(await page.locator('.walk-message p').textContent(),'The first ERC-20 token approval is what I would like you to review.');
    await next(page); await step(page,7);
    assert.equal(await page.locator('body').textContent().then(text=>text.includes('bob@example.test')),false,'Alice cannot see Bob’s contact before sharing');
  });
  for (const [alice,bob] of [[false,false],[true,false],[false,true],[true,true]]) {
    await check(`Independent contact consent: Alice=${alice}, Bob=${bob}`, async () => {
      await toContacts(page);
      await page.locator(`[data-action="${alice?'share':'skip'}"]`).click();
      assert.equal(await page.locator('.walk-reassurance .walk-contact-email').count(),alice?1:0);
      await page.locator(`[data-action="${bob?'share':'skip'}"]`).click(); await step(page,9);
      const result = await page.locator('.walk-outcome').textContent();
      assert.equal(result.includes('alice@example.test'),alice);
      assert.equal(result.includes('bob@example.test'),bob);
      assert.ok((await page.locator('.walk-receipt').textContent()).includes('accepted'));
      if (alice && bob && screenshotDir) {await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:resolve(screenshotDir,'walkthrough-desktop-complete.png'),fullPage:true});}
    });
  }
  await check('Back rewinds consent; restart and reload clear sample only', async () => {
    await page.locator('#walk-back').click(); await step(page,8);
    await page.locator('[data-action="skip"]').click();
    assert.equal((await page.locator('.walk-outcome').textContent()).includes('bob@example.test'),false);
    await page.locator('#walk-restart').click(); await step(page,0);
    await next(page); assert.equal(await page.locator('#sample-select-bob').isChecked(),false);
    await page.locator('#sample-select-bob').check(); await next(page);
    await page.locator('#sample-draft').fill('This is an edited draft that must disappear on reload.');
    await page.reload(); await step(page,0);
    await next(page); await page.locator('#sample-select-bob').check(); await next(page);
    assert.ok((await page.locator('#sample-draft').inputValue()).startsWith('Hi Bob — I’m building'));
    assert.equal(await page.evaluate(()=>localStorage.getItem('signalpass-existing-session-test')),'untouched');
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('signalpass-existing-draft-test')),'untouched');
  });
  for (const width of [320,390,768,1280]) {
    await check(`Every sample scene fits ${width}px viewport`, async () => {
      await page.setViewportSize({width,height:844}); await page.goto(url); await noOverflow(page); await next(page); await noOverflow(page);
      if (width===390 && screenshotDir) {await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:resolve(screenshotDir,'walkthrough-mobile-match.png'),fullPage:true});}
      await page.locator('#sample-select-bob').check(); await next(page); await noOverflow(page);
      await page.locator('#sample-reviewed').check(); await next(page); await noOverflow(page);
      for(let i=0;i<4;i++){await next(page);await noOverflow(page);}
      await page.locator('[data-action="share"]').click();await noOverflow(page);
      await page.locator('[data-action="share"]').click();await noOverflow(page);
    });
  }
  await check('No browser errors, network mutations or third-party requests', async () => {
    assert.deepEqual(errors,[]); assert.deepEqual(mutations,[]); assert.deepEqual(external,[]);
  });
  console.log(`${passed} guided walkthrough checks passed.`);
} finally {await browser.close(); if(server) await new Promise(resolve=>server.close(resolve));}
