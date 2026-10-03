#!/usr/bin/env node
/** Opt-in live public rehearsal: fictional identities, at most 3 inference attempts, 1 no-bond introduction. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { hexToString } from 'viem';
const ORIGIN='https://signalpass.coderbojack.space';
const DIR=path.resolve(process.env.SIGNALPASS_REHEARSAL_DIR||'.run/public-journey');
const JOURNAL=path.join(DIR,'private-session.json');
process.umask(0o077);fs.mkdirSync(DIR,{recursive:true,mode:0o700});
function save(j){fs.writeFileSync(JOURNAL+'.next',JSON.stringify(j),{mode:0o600});fs.renameSync(JOURNAL+'.next',JOURNAL);}
async function request(i,route,body,expected=200){
 const r=await fetch(ORIGIN+'/api'+route,{method:body===undefined?'GET':'POST',headers:{origin:ORIGIN,'content-type':'application/json',...(i?{cookie:i.cookie,'x-signalpass-csrf':i.csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),redirect:'error',signal:AbortSignal.timeout(65000)});
 assert((Array.isArray(expected)?expected:[expected]).includes(r.status),'Unexpected HTTP '+r.status+' '+route);return await r.json();
}
function profile(role,handle){return {handle,profile:{name:role==='sender'?'Rehearsal Alice (test)':'Rehearsal Bob (test)',bio:role==='sender'?'Building a Monad wallet onboarding prototype.':'Testing how people get started with Monad wallets.',interests:'Monad, wallet onboarding',offer:role==='sender'?'Frontend prototyping and product feedback.':'Usability reviews and tests of Monad wallet onboarding prototypes.',meet:'People who exchange frontend and product feedback.'},agent:{visibility:role==='recipient'?'public':'private',matching:role==='recipient',sources:[],interests:['Monad','Wallet onboarding']},sourceLinks:{},avatar:'none'};}
async function cleanup(j){
 const failures=[];j.cleanup??={};
 for(const role of ['sender','recipient']){
  const i=j.identities[role];if(!i)continue;const done=j.cleanup[role]??={};
  try{
   if(j.profiles[role]&&!done.hidden){const p=j.profiles[role];await request(i,'/me/profile',{...p,agent:{...p.agent,visibility:'private',matching:false}});done.hidden=true;save(j);}
   if(j.introductionId&&!done.contactRemoved){const removed=await request(i,'/introductions/'+j.introductionId+'/connection/remove',{},[200,409]);assert(!removed.error||removed.error==='introduction_not_accepted');done.contactRemoved=true;save(j);}
   if(!done.cleared){await request(i,'/agent/history/clear',{});done.cleared=true;save(j);}
   if(!done.loggedOut){await request(i,'/auth/logout',{},[200,401]);done.loggedOut=true;save(j);}
  }catch{failures.push(role);}
 }
 assert.equal(failures.length,0,'Cleanup incomplete; protected journal retained for recovery');fs.rmSync(JOURNAL,{force:true});console.log(JSON.stringify({cleanup:'complete',hiddenTestProfiles:Object.keys(j.profiles).length,contactsRemoved:!!j.introductionId,sessionsLoggedOut:Object.keys(j.identities).length}));
}
async function main(){
 if(process.argv.includes('--cleanup')){await cleanup(JSON.parse(fs.readFileSync(JOURNAL,'utf8')));return;}
 assert(process.argv.includes('--live-public'),'Pass --live-public to explicitly run the public rehearsal');
 assert(!fs.existsSync(JOURNAL),'Previous journal exists; run --cleanup before any new rehearsal');
 const j={identities:{},profiles:{},createdAt:new Date().toISOString()};save(j);
 const result={origin:ORIGIN,startedAt:j.createdAt,syntheticParticipants:true,settlement:'offchain',providerCalls:0,introductionsSubmitted:0,walletTransactions:0,timings:{},screenshots:[]};
 const errors=[],contexts=[],pages=[];let browser;let step='launch';
 const shot=async(page,name)=>{await page.screenshot({path:path.join(DIR,name+'.png'),fullPage:true});result.screenshots.push(name+'.png');};
 const uiCall=async(page,route,click)=>{const began=Date.now();const response=page.waitForResponse(r=>new URL(r.url()).pathname==='/api'+route&&r.request().method()==='POST',{timeout:70000});await click();const r=await response;assert.equal(r.status(),200,'Live operation failed: '+route+' HTTP '+r.status());return {body:await r.json(),ms:Date.now()-began};};
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});result.browser=browser.version();
  for(const role of ['sender','recipient']){
   step='sign-in-'+role;const account=privateKeyToAccount(generatePrivateKey());
   const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',recordVideo:{dir:path.join(DIR,'video'),size:{width:1440,height:1000}}});contexts.push(context);
   await context.exposeBinding('signRehearsalLogin',async(_source,hex)=>{const message=hexToString(hex);assert(message.includes('signalpass.coderbojack.space')&&message.includes('Sign in to SignalPass.'));return account.signMessage({message});});
   await context.addInitScript(({address})=>{window.ethereum={request:async({method,params})=>{if(method==='eth_requestAccounts'||method==='eth_accounts')return[address];if(method==='eth_chainId')return'0x8f';if(method==='personal_sign')return window.signRehearsalLogin(params[0]);throw new Error('Rehearsal wallet supports sign-in only');},on(){},removeListener(){}};},{address:account.address});
   const page=await context.newPage();pages.push(page);page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
   await page.goto(ORIGIN+'/profile/import',{waitUntil:'networkidle'});await page.locator('#session-action').click();await page.getByRole('button',{name:'Sign out',exact:true}).waitFor();
   const csrf=await page.evaluate(()=>window.SignalPass.me.session.csrf);const cookies=await context.cookies(ORIGIN);const session=cookies.find(c=>c.name==='signalpass_session');assert(session?.httpOnly&&session.secure,'Secure HttpOnly signed session missing');
   j.identities[role]={cookie:session.name+'='+session.value,csrf};save(j);
   const p=profile(role,'rehearsal-'+role+'-'+account.address.slice(-8).toLowerCase());j.profiles[role]=p;save(j);await request(j.identities[role],'/me/profile',p);
  }
  const [sender,recipient]=pages;const target=j.profiles.recipient.handle;
  await sender.route('**/api/introductions',async route=>{if(route.request().method()==='POST'){const body=route.request().postDataJSON();if(result.introductionsSubmitted>=1||body.recipientHandle!==target||body.settlement!=='offchain'){await route.abort();throw new Error('Unexpected rehearsal recipient or settlement');}result.introductionsSubmitted++;}await route.continue();});
  sender.on('request',r=>{if(r.method()==='POST'&&['/api/agent/discover','/api/agent/draft'].includes(new URL(r.url()).pathname))result.providerCalls++;});
  step='discovery';await sender.goto(ORIGIN+'/assistant',{waitUntil:'networkidle'});await sender.waitForFunction(()=>document.querySelector('#agent-state')?.textContent==='Live agent');
  const before=await request(j.identities.sender,'/agent/status');assert.equal(before.provider,'tokenrhythm');assert.equal(before.model,'deepseek-v4-flash');assert(before.remainingToday>=3);result.provider=before.provider;result.model=before.model;
  const goal='I am building a Monad wallet onboarding prototype and want a usability reviewer to test it. I can offer frontend prototyping and product feedback in return.';
  await sender.locator('#agent-goal').fill(goal);await sender.locator('#agent-use-profile').check();await shot(sender,'01-goal-and-consent');
  const discovery=await uiCall(sender,'/agent/discover',()=>sender.locator('#agent-submit').click());assert(discovery.body.run.modelCalled);result.timings.discovery=discovery.ms;
  let selectedRun=discovery.body.run;result.clarificationUsed=false;
  if(discovery.body.run.nextQuestion){step='clarification';await sender.locator('#agent-refine-answer').fill('Prioritize usability testing of first-time wallet setup and confusing approval screens.');const refined=await uiCall(sender,'/agent/discover',()=>sender.locator('#agent-refine-submit').click());result.timings.clarification=refined.ms;assert.equal(refined.body.run.goal,goal);selectedRun=refined.body.run;result.clarificationUsed=true;}
  const match=selectedRun.matches.find(m=>m.handle===target);assert(match,'Fictional recipient was not recommended');const source=(await request(null,'/profiles/'+target)).profile;
  for(const e of match.evidence)assert((e.field==='interests'?source.interests.join(', '):source[e.field]).includes(e.quote));result.exactSourceQuotes=match.evidence.length;
  await sender.locator('.assistant-select-match[data-handle="'+target+'"]').click();await shot(sender,'02-recommendation-and-evidence');
  step='draft';await sender.locator('#agent-draft-consent').check();const drafted=await uiCall(sender,'/agent/draft',()=>sender.locator('#agent-prepare-selected').click());result.timings.draft=drafted.ms;assert.equal(drafted.body.draft.recipientHandle,target);await sender.locator('#agent-draft-panel').waitFor();await shot(sender,'03-private-draft');
  assert.equal((await request(j.identities.sender,'/introductions')).introductions.length,0);assert.equal(result.introductionsSubmitted,0);
  step='edit-and-review';await sender.locator('#agent-draft-handoff').click();await sender.waitForURL('**/introductions/new/'+target+'?agentDraft=*');await sender.waitForFunction(()=>document.querySelector('#intro-field-1')?.value.length>0);
  const editedNextStep='Would you review the first-time wallet setup and confusing approval screens in a short written exchange? This is a clearly labeled product rehearsal.';
  await sender.locator('#intro-field-4').fill(editedNextStep);const approvedFields=await sender.locator('.intro-field textarea').evaluateAll(nodes=>nodes.map(n=>n.value.trim()));assert.equal(approvedFields.length,4);assert.equal(approvedFields[3],editedNextStep);
  await sender.locator('[data-action=approve-introduction]').click();await sender.locator('[name=settlement][value=offchain]').check();assert((await sender.locator('.draft-message').innerText()).includes(editedNextStep));await shot(sender,'04-reviewed-send-without-bond');assert.equal(result.introductionsSubmitted,0);
  step='confirmed-delivery';const delivery=sender.waitForResponse(r=>new URL(r.url()).pathname==='/api/introductions'&&r.request().method()==='POST');await sender.locator('#dialog-confirm').click();const sent=await delivery;assert.equal(sent.status(),201);const record=(await sent.json()).introduction;j.introductionId=record.id;save(j);assert.equal(record.settlement,'offchain');assert.deepEqual(Object.values(record.intent),approvedFields);assert.equal(result.introductionsSubmitted,1);
  await sender.waitForURL('**/introductions/'+record.id+'/receipt');await sender.locator('#receipt-body').waitFor();assert.equal(await sender.locator('#receipt-status').innerText(),'Awaiting a response');await shot(sender,'05-sender-receipt');
  step='recipient-review';await recipient.goto(ORIGIN+'/inbox/'+record.id,{waitUntil:'networkidle'});assert((await recipient.locator('.v4-result-message').innerText()).includes(editedNextStep));await shot(recipient,'06-recipient-review');await recipient.locator('[data-action=accept-introduction]').click();const accepted=recipient.waitForResponse(r=>new URL(r.url()).pathname==='/api/introductions/'+record.id+'/transition'&&r.request().method()==='POST');await recipient.locator('#dialog-confirm').click();assert.equal((await accepted).status(),200);
  await sender.reload({waitUntil:'networkidle'});assert.equal(await sender.locator('#receipt-status').innerText(),'Accepted');const receipt=ORIGIN+'/introductions/'+record.id+'/receipt';await recipient.goto(receipt,{waitUntil:'networkidle'});
  step='contact-consent';for(const page of pages){await page.locator('#connection-details').waitFor();assert((await page.locator('#connection-own').innerText()).includes('not shared'));}
  const contacts=[{type:'email',label:'Fictional rehearsal email',value:'alice@example.com'},{type:'contact_url',label:'Fictional rehearsal contact page',value:'https://example.com/rehearsal-bob'}];
  for(let n=0;n<pages.length;n++){const page=pages[n],other=pages[1-n],contact=contacts[n];await page.locator('#connection-edit').click();await page.locator('#connection-type').selectOption(contact.type);await page.locator('#connection-label').fill(contact.label);await page.locator('#connection-value').fill(contact.value);await page.locator('#connection-review').click();assert.equal(await page.locator('#connection-preview-value').innerText(),contact.value);const beforeShare=await request(j.identities[n===0?'sender':'recipient'],'/introductions/'+record.id+'/connection');assert.equal(beforeShare.connection.ownContact,null);await shot(page,n===0?'07-contact-consent-preview':'08-recipient-contact-consent');const shared=await uiCall(page,'/introductions/'+record.id+'/connection',()=>page.locator('#connection-share').click());assert.equal(shared.body.connection.ownContact.value,contact.value);await other.locator('#connection-refresh').click();await other.waitForFunction(value=>document.querySelector('#connection-other')?.textContent.includes(value),contact.value);}
  step='refresh-and-mobile';await sender.reload({waitUntil:'networkidle'});assert.equal(await sender.locator('#receipt-status').innerText(),'Accepted');await sender.locator('#connection-details').waitFor();assert((await sender.locator('#connection-other').innerText()).includes(contacts[1].value));await shot(sender,'09-mutual-contact-handoff');
  await sender.setViewportSize({width:390,height:844});assert(await sender.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile receipt overflow');await shot(sender,'10-mobile-accepted-receipt');
  await request(null,'/introductions/'+record.id,undefined,401);await request(null,'/introductions/'+record.id+'/connection',undefined,401);
  const after=await request(j.identities.sender,'/agent/status');const expectedCalls=result.clarificationUsed?3:2;assert.equal(before.remainingToday-after.remainingToday,expectedCalls);assert.equal(result.providerCalls,expectedCalls);assert.deepEqual(errors,[],'Browser runtime errors');
  result.passed=true;result.introductionId=record.id;result.draftEditedBeforeSend=true;result.exactEditedTextDelivered=true;result.recipientAccepted=true;result.bothContactsExplicitlyShared=true;result.persistedAfterRefresh=true;result.mobileReceiptNoOverflow=true;result.completedAt=new Date().toISOString();
  fs.writeFileSync(path.join(DIR,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }catch(error){for(let n=0;n<pages.length;n++)await pages[n].screenshot({path:path.join(DIR,'failure-'+n+'.png'),fullPage:true}).catch(()=>{});console.error(JSON.stringify({failedStep:step,error:String(error.message).slice(0,500)}));throw new Error('Public browser rehearsal failed at '+step);}
 finally{let cleanupError;try{await cleanup(j);}catch(error){cleanupError=error;}for(const context of contexts)await context.close().catch(()=>{});await browser?.close();if(cleanupError)throw cleanupError;}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
