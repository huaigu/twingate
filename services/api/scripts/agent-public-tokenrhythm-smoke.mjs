import fs from 'node:fs';
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';
const ORIGIN='https://signalpass.coderbojack.space',BASE=ORIGIN+'/api';
const DIR='/opt/signalpass/test-tools/tokenrhythm',JP=DIR+'/public-session.json';
process.umask(0o077);fs.mkdirSync(DIR,{recursive:true,mode:0o700});
const check=(condition,message)=>{if(!condition)throw new Error(message);};
async function request(identity,path,body,expected=200,headers={}){
 const started=Date.now();
 const r=await fetch(BASE+path,{method:body===undefined?'GET':'POST',headers:{origin:ORIGIN,'content-type':'application/json',...(identity?{cookie:identity.cookie,'x-signalpass-csrf':identity.csrf}:{}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(65000),redirect:'error'});
 const data=await r.json();check((Array.isArray(expected)?expected:[expected]).includes(r.status),'Unexpected HTTP '+r.status+' for '+path);
 return {data,cookie:r.headers.get('set-cookie')?.split(';')[0],secureCookie:/;\s*Secure/i.test(r.headers.get('set-cookie')??''),httpOnly:/;\s*HttpOnly/i.test(r.headers.get('set-cookie')??''),ms:Date.now()-started};
}
function save(j){const tmp=JP+'.next';fs.writeFileSync(tmp,JSON.stringify(j),{mode:0o600});fs.renameSync(tmp,JP);}
function profile(role,handle){return {handle,profile:{name:'Fictional QA '+role,bio:role==='sender'?'Building a Monad wallet onboarding prototype.':'Testing how people get started with Monad wallets.',interests:'Monad, wallet onboarding',offer:role==='sender'?'Frontend prototyping and product feedback.':'Usability reviews and tests of Monad wallet onboarding prototypes.',meet:'People who exchange frontend and product feedback.'},agent:{visibility:role==='recipient'?'public':'private',matching:role==='recipient',sources:[],interests:['Monad','Wallet onboarding']},sourceLinks:{},avatar:'none'};}
async function cleanup(j){
 let restored=0;
 for(const role of ['sender','recipient']){
  const i=j.identities[role],p=j.profiles[role];if(!i)continue;
  j.cleanup??={};const done=j.cleanup[role]??={};
  try{
   if(p&&!done.hidden){await request(i,'/me/profile',{...p,agent:{...p.agent,visibility:'private',matching:false}});done.hidden=true;save(j);}
   if(!done.cleared){await request(i,'/agent/history/clear',{});done.cleared=true;save(j);}
   if(!done.loggedOut){await request(i,'/auth/logout',{},[200,401]);done.loggedOut=true;save(j);}
   if(!p||done.hidden)restored++;
  }catch{console.log(JSON.stringify({cleanupFailedFor:role,recoveryJournalRetained:true}));}
 }
 check(restored===Object.keys(j.identities).length&&Object.values(j.cleanup??{}).every(x=>x.cleared&&x.loggedOut),'Cleanup incomplete; protected recovery journal retained');
 fs.rmSync(JP,{force:true});console.log(JSON.stringify({cleanup:'complete',hiddenProfiles:restored}));
}
async function main(){
 const phase=process.argv[2]??'start';
 if(phase==='cleanup'){check(fs.existsSync(JP),'Missing protected cleanup session');await cleanup(JSON.parse(fs.readFileSync(JP,'utf8')));return;}
 if(phase==='verify'){
  check(fs.existsSync(JP),'Missing protected verification session');const j=JSON.parse(fs.readFileSync(JP,'utf8'));check(j.utcDay===new Date().toISOString().slice(0,10),'UTC day changed; run cleanup phase');
  try{
   const status=(await request(j.identities.sender,'/agent/status')).data;
   check(status.enabled&&status.provider==='tokenrhythm'&&status.model==='deepseek-v4-flash'&&status.limit===20&&status.remainingToday===j.remaining,'Provider or quota changed across service restart');
   check((await request(j.identities.sender,'/agent/drafts/'+j.draftId)).data.draft.id===j.draftId,'Draft lost across service restart');
   check((await request(j.identities.sender,'/agent/workspace')).data.runs.some(r=>r.id===j.refinedId),'Clarification history lost across restart');
   await request(j.identities.recipient,'/agent/drafts/'+j.draftId,undefined,404);
   for(const role of ['sender','recipient'])check((await request(j.identities[role],'/introductions')).data.introductions.length===0,'Test identity has an introduction');
   await request(j.identities.sender,'/agent/history/clear',{});await request(j.identities.sender,'/agent/drafts/'+j.draftId,undefined,404);
   check((await request(j.identities.sender,'/agent/status')).data.remainingToday===j.remaining,'History clear reset quota');
   console.log(JSON.stringify({phase:'public_acceptance_complete',provider:status.provider,model:status.model,remainingForTestAccount:j.remaining,providerCalls:3,serviceRestartPersistence:true,privateDraftOwnership:true,introductions:0,transactions:0,timings:j.timings}));
  }finally{await cleanup(j);}
  return;
 }
 check(!fs.existsSync(JP),'A previous test journal exists; do not run new inference');
 const j={utcDay:new Date().toISOString().slice(0,10),identities:{},profiles:{},timings:{}};save(j);
 try{
  await request(null,'/agent/status',undefined,401);
  for(const role of ['sender','recipient']){
   const account=privateKeyToAccount(generatePrivateKey());
   const challenge=(await request(null,'/auth/challenge',{address:account.address,chainId:143})).data;
   const verified=await request(null,'/auth/verify',{nonce:challenge.nonce,signature:await account.signMessage({message:challenge.message})});
   check(verified.cookie&&verified.secureCookie&&verified.httpOnly,'Public HTTPS session cookie attributes missing');
   j.identities[role]={cookie:verified.cookie,csrf:verified.data.session.csrf};save(j);
   const p=profile(role,'ai-qa-'+role+'-'+account.address.slice(-8).toLowerCase());j.profiles[role]=p;save(j);await request(j.identities[role],'/me/profile',p);
  }
  const sender=j.identities.sender,recipient=j.identities.recipient;
  const status=(await request(sender,'/agent/status')).data;
  check(status.enabled&&status.provider==='tokenrhythm'&&status.model==='deepseek-v4-flash'&&status.limit===20&&status.remainingToday>=3,'Public provider configuration mismatch');
  const goal='I am building a Monad wallet onboarding prototype and want a usability reviewer to test it. I can offer frontend prototyping and product feedback in return.';
  await request(sender,'/agent/discover',{goal,useProfile:true},403,{'x-signalpass-csrf':''});
  check((await request(sender,'/agent/status')).data.remainingToday===status.remainingToday,'Rejected CSRF request consumed inference');
  const discovered=await request(sender,'/agent/discover',{goal,useProfile:true});j.timings.discovery=discovered.ms;
  const original=discovered.data.run;check(original.modelCalled&&original.usedProfile,'Discovery did not call provider with consent');
  const answer='Prioritize usability testing of first-time wallet setup and confusing approval screens.';
  const refined=await request(sender,'/agent/discover',{parentRunId:original.id,answer,useProfile:true});j.timings.clarification=refined.ms;
  check(refined.data.run.goal===goal&&refined.data.run.clarifications[0].answer===answer,'Clarification did not preserve original goal');
  const match=refined.data.run.matches.find(x=>x.handle===j.profiles.recipient.handle);check(match&&match.evidence.length,'Known fictional recipient not recommended');
  const source=(await request(null,'/profiles/'+match.handle)).data.profile;
  for(const e of match.evidence)check((e.field==='interests'?source.interests.join(', '):source[e.field]).includes(e.quote),'Evidence mismatch');
  const drafted=await request(sender,'/agent/draft',{runId:refined.data.run.id,recipientHandle:match.handle,useProfile:true});j.timings.draft=drafted.ms;
  const draft=drafted.data.draft;check(Object.values(draft.intent).every(x=>typeof x==='string'&&x.trim()),'Draft incomplete');
  await request(recipient,'/agent/drafts/'+draft.id,undefined,404);
  j.draftId=draft.id;j.refinedId=refined.data.run.id;j.remaining=(await request(sender,'/agent/status')).data.remainingToday;
  check(j.remaining===status.remainingToday-3,'Expected exactly three consumed attempts');save(j);
  console.log(JSON.stringify({phase:'awaiting_service_restart',provider:status.provider,model:status.model,perAccountLimit:status.limit,remainingForTestAccount:j.remaining,providerCalls:3,secureCookies:true,privateDraftOwnership:true,timings:j.timings}));
 }catch(error){await cleanup(j);throw error;}
}
main().catch(error=>{console.error('FAIL '+error.message);process.exitCode=1;});
