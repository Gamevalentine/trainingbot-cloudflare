import assert from 'node:assert/strict';
import {status,session,chat} from '../../functions/_lib/ai_preview_bff.js';
import {onRequest} from '../../functions/_middleware.js';
const preview='https://preview-ai-identity-bridge.trainingbot-cloudflare.pages.dev';
const secret='ab'.repeat(32);
const addr='203.0.113.51';
const responses=[];
const key=await crypto.subtle.importKey('raw',Uint8Array.from(secret.match(/../g),x=>parseInt(x,16)),
  {name:'HMAC',hash:'SHA-256'},false,['sign']);
const b64=x=>Buffer.from(x).toString('base64url');
async function sign(v){return b64(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(v)));}
let visitors=new Set(),lastGuest=null;
const svc={
 async fetch(req){
  const url=new URL(req.url),method=req.method;
  assert.equal(url.origin,'https://trainingbot-ai-staging.ai-vn.workers.dev');
  assert.equal(req.redirect,'manual','Cloudflare workerd rejects redirect:error; manual must stay fail-closed');
  assert.match(url.pathname,/^\/__preview_b1\/(?:status|session|chat)$/);
  assert.equal(req.headers.get('authorization'),null);
  assert.equal(req.headers.get('cookie'),null);
  const raw=method==='GET'?'':await req.text();
  const ts=req.headers.get('x-tb-b1-time'),nonce=req.headers.get('x-tb-b1-nonce');
  const ip=req.headers.get('x-tb-b1-ip');
  const sig=req.headers.get('x-tb-b1-signature');
  const digest=await sign('body:'+raw);
  const calc=await sign(['TRAININGBOT_B1',method,url.pathname,ts,nonce,ip,digest].join('\n'));
  assert.equal(sig,calc,'Service request must be HMAC-authenticated');
  assert.match(ip,/^[A-Za-z0-9_-]{43}$/);
  const data=raw?JSON.parse(raw):{};
  responses.push({route:url.pathname,guest:data.visitorId,ip});
  if(url.pathname.endsWith('status'))return new Response(JSON.stringify({ok:true,visitor:true}),{headers:{'content-type':'application/json'}});
  if(url.pathname.endsWith('session')){visitors.add(data.visitorId);lastGuest=data.visitorId;return new Response(JSON.stringify({ok:true}),{headers:{'content-type':'application/json'}});}
  assert(visitors.has(data.visitorId),'No session for AI request');
  assert.equal(data.message,'Xin chào');
  return new Response(JSON.stringify({reply:'Xin chào từ Staging',conversationId:'conv_preview_12345678',revision:1}),
    {headers:{'content-type':'application/json'}});
 }
};
const env={TRAININGBOT_AI_STAGE_WORKER:svc,TRAININGBOT_AI_PREVIEW_BRIDGE_SECRET:secret};
const headers={'CF-Connecting-IP':addr,'origin':preview,'sec-fetch-site':'same-origin','content-type':'application/json'};
const req=(path,{method='POST',body={},cookie,host=preview,headers:additional={}}={})=>
 new Request(host+path,{method,headers:{...headers,...(cookie?{cookie}:{}),...additional},
  ...(method==='POST'?{body:JSON.stringify(body)}:{})});
const next=async()=>new Response('next',{status:209});
const mid=async request=>onRequest({request,env,next});
assert.equal((await mid(req('/api/ai-preview/session'))).status,209,'Only named session POST passes middleware');
assert.equal((await mid(req('/api/ai-preview/chat'))).status,209,'Only named chat POST passes middleware');
assert.equal((await mid(req('/api/ai-preview/chat',{method:'DELETE'}))).status,403);
assert.equal((await mid(req('/api/v49/login'))).status,403);
assert.equal((await mid(req('/api/v71/admin/posts'))).status,403);
assert.equal((await mid(req('/api/ai-preview/admin-chat'))).status,403);
assert.equal((await mid(req('/api/ai-preview/session',{method:'GET'}))).status,403);
assert.equal((await mid(req('/api/ai-preview/status',{method:'GET'}))).status,209);
const disabled=await status(req('/api/ai-preview/status',{method:'GET'}),{});
assert.equal((await disabled.json()).ready,false,'Fail closed without service binding');
const noSecret=await session(req('/api/ai-preview/session'),{TRAININGBOT_AI_STAGE_WORKER:svc});
assert.equal(noSecret.status,503);
assert.equal((await status(req('/api/ai-preview/status',{method:'GET'}),env)).status,200);
const statusBody=await (await status(req('/api/ai-preview/status',{method:'GET'}),env)).json();
assert.equal(statusBody.anonymousVisitorReady,true);
assert.equal(statusBody.identityVerified,false);
assert.deepEqual(statusBody.surfaces,{visitor:true,admin:false});
assert.equal((await session(req('/api/ai-preview/session',{headers:{origin:'https://evil.example'}}),env)).status,403);
assert.equal((await session(req('/api/ai-preview/session',{body:{role:'admin'}}),env)).status,400);
assert.equal((await chat(req('/api/ai-preview/chat',{body:{surface:'visitor',message:'Xin chào'}}),env)).status,401);
const issued=await session(req('/api/ai-preview/session'),env);
assert.equal(issued.status,200);
const cookie=issued.headers.get('set-cookie');
assert.match(cookie,/^__Host-tb_ai_b1=b_[A-Za-z0-9_-]{32}\.\d{13}\.[A-Za-z0-9_-]{43}/);
assert.match(cookie,/Secure; HttpOnly; SameSite=Strict/);
const rawCookie=cookie.split(';')[0];
const reused=await session(req('/api/ai-preview/session',{cookie:rawCookie}),env);
assert.equal((await reused.json()).reused,true);
assert.equal(visitors.size,1,'Session reused; no new Staging cost');
const badRole=await chat(req('/api/ai-preview/chat',{cookie:rawCookie,body:{surface:'admin',message:'Xin chào'}}),env);
assert.equal(badRole.status,400);
const injected=await chat(req('/api/ai-preview/chat',{cookie:rawCookie,body:{surface:'visitor',message:'Xin chào',role:'admin'}}),env);
assert.equal(injected.status,400);
const good=await chat(req('/api/ai-preview/chat',{cookie:rawCookie,body:{surface:'visitor',message:'Xin chào'}}),env);
assert.equal(good.status,200);
assert.equal((await good.json()).reply,'Xin chào từ Staging');
assert.equal(lastGuest,responses.at(-1).guest);
assert.equal((await chat(req('/api/ai-preview/chat',{cookie:rawCookie,headers:{'CF-Connecting-IP':'203.0.113.52'},body:{surface:'visitor',message:'Xin chào'}}),env)).status,401,'Guest cookie bound to IP');
const prod='https://trainingbot.io.vn';
for(const action of [status,session,chat]){
 const res=await action(req('/api/ai-preview/chat',{host:prod}),env);
 assert.equal(res.status,404,'Production forbidden independent of binding');
}
assert.equal((await session(req('/api/ai-preview/session',{headers:{'CF-Connecting-IP':''}}),env)).status,503);
console.log('B.1 Preview BFF QA PASS: signed isolated service binding, anonymous HttpOnly guest, protected chat, production 404, admin forbidden');
