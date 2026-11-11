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
let visitors=new Set(),lastGuest=null,sessionFailure=null;
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
  if(url.pathname.endsWith('session')){
    if(sessionFailure)return new Response(JSON.stringify({error:{code:sessionFailure}}),{
      status:sessionFailure==='RATE_LIMITED'?429:503,headers:{'content-type':'application/json'}});
    visitors.add(data.visitorId);lastGuest=data.visitorId;
    return new Response(JSON.stringify({ok:true}),{headers:{'content-type':'application/json'}});
  }
  assert(visitors.has(data.visitorId),'No session for AI request');
  assert(['Xin chào','bao giờ có bản update 4.7','Beta 4.7 bản nào mới nhất?','Beta 4.7 đã có chưa?','bao giờ có bản update 4.6','tin PUBG mới nhất','khi nào có bản update mới',
  'trả lời dở thế','thế ở Việt Nam thì sao','mấy giờ cập nhật'].includes(data.message));
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
// Browser fetch() may omit Origin, but must provide a same-origin Fetch Metadata signal.
const originOmitted=await session(req('/api/ai-preview/session',{headers:{origin:'','sec-fetch-site':'same-origin'}}),env);
assert.equal(originOmitted.status,200,'Origin omission permitted only with browser same-origin metadata');
visitors.clear();lastGuest=null; // Isolate the extra positive probe from the primary guest reuse test.
assert.equal((await session(req('/api/ai-preview/session',{headers:{origin:'','sec-fetch-site':'cross-site'}}),env)).status,403,'No cross-site guest creation');
assert.equal((await session(req('/api/ai-preview/session',{headers:{origin:'','sec-fetch-site':''}}),env)).status,403,'No unverified request with absent Origin and Fetch Metadata');
assert.equal((await session(req('/api/ai-preview/session',{headers:{origin:'https://evil.example','sec-fetch-site':'same-origin'}}),env)).status,403,'Explicit Origin mismatch wins');
assert.equal((await session(req('/api/ai-preview/session',{headers:{'content-type':'text/plain'}}),env)).status,403,'Only JSON POST allowed');

assert.equal((await session(req('/api/ai-preview/session',{body:{role:'admin'}}),env)).status,400);
assert.equal((await chat(req('/api/ai-preview/chat',{body:{surface:'visitor',message:'Xin chào'}}),env)).status,401);
// Staging failures must remain closed while the public Preview exposes only
// allowlisted diagnostic codes, never secrets, SQL or raw upstream payloads.
for (const [upstream,publicCode,expectedStatus] of [
  ['POLICY_STORE_UNAVAILABLE','SESSION_RATE_STORE_UNAVAILABLE',503],
  ['MEMORY_UNAVAILABLE','SESSION_DATABASE_UNAVAILABLE',503],
  ['UNAUTHORIZED','SESSION_BRIDGE_AUTH_FAILURE',503],
  ['INVALID_INPUT','SESSION_BRIDGE_PROTOCOL_FAILURE',503],
  ['RATE_LIMITED','RATE_LIMITED',429]
]) {
  sessionFailure=upstream;
  const failed=await session(req('/api/ai-preview/session'),env);
  assert.equal(failed.status,expectedStatus);
  assert.equal((await failed.json()).error.code,publicCode);
  assert(!failed.headers.has('set-cookie'),'No guest cookie on failed session');
}
sessionFailure=null;
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
// The public feed is served by a FIXED anonymous JSON API, never a writable
// Production resource. Inject a synthetic response for full offline QA.
const dynamicVersions=[
  {version:'V4.7.5',status:'coming_soon',arch:'x64',updated_at:'2026-11-10T10:00:00Z'},
  {version:'V4.7.4',status:'released',arch:'x64',updated_at:'2026-10-30T10:00:00Z'}
];
const dynamicPosts=[
  {title:'PUBG MOBILE FLASH dự kiến ra mắt 13/11/2026',
   url:'/bai-viet/pubg-mobile-flash-du-kien-ra-mat',published_at:'2026-11-11T10:00:00Z',summary:'Tin về Flash.'},
  {title:'PUBG MOBILE 4.7 chính thức ra mắt ngày 12/11/2026',
   url:'/bai-viet/pubg-mobile-4-7-cap-nhat',published_at:'2026-11-10T10:00:00Z',summary:'Bài viết được cập nhật.'}
];
const publicCalls=[];
const publicFetch=async (url,options)=>{
  assert.equal(options.method,'GET');
  assert.equal(options.redirect,'manual');
  assert.equal(options.credentials,'omit');
  assert(!options.headers.cookie&&!options.headers.authorization);
  publicCalls.push(url);
  const data=url==='https://trainingbot.io.vn/api/beta-versions'
    ?{ok:true,versions:dynamicVersions}
    :url==='https://trainingbot.io.vn/api/posts?limit=12'
      ?{ok:true,posts:dynamicPosts}:null;
  assert(data,'Cannot fetch arbitrary URL');
  return new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json'}});
};
const releaseQuery=req('/api/ai-preview/chat',{cookie:rawCookie,
  body:{surface:'visitor',message:'bao giờ có bản update 4.7'}});
const release=await chat(releaseQuery,env,{publicFetch});
assert.equal(release.status,200);
const announced=await release.json();
assert.match(announced.reply,/12\/11\/2026/);
assert(!announced.reply.includes('V4.7.5'),'Do not dump Beta status into official date answer');
assert(!announced.reply.includes('Bài viết liên quan'),'No news list for a direct date question');
assert.equal(announced.sources.length,1);
assert(announced.sources.some(x=>x.type==='official_claim'&&
  x.url==='https://www.pubgmobile.jp/version-4-7-0-update-notice-20261105/'));
assert.equal(publicCalls.length,0,'Official date needs no unrelated public API calls');

// Exactly what was displayed must be the basis for a reaction, not the raw
// model output saved in Staging D1. No PII or plain chat text in the cookie.
const signedContextHeader=release.headers.get('set-cookie');
assert.match(signedContextHeader,
  /^__Host-tb_ai_last_v1=official47\.\d{13}\.[A-Za-z0-9_-]{43}; Path=\/; Secure; HttpOnly; SameSite=Strict; Max-Age=1200$/);
assert(!signedContextHeader.includes('12/11/2026'));
assert(!signedContextHeader.includes('bao giờ'));
const signedContext=signedContextHeader.split(';')[0];
const remembered=await chat(req('/api/ai-preview/chat',{cookie:rawCookie+'; '+signedContext,
  body:{surface:'visitor',message:'trả lời dở thế',conversationId:'conv_preview_12345678'}}),env,{publicFetch});
assert.equal(remembered.status,200);
const rememberedReply=await remembered.json();
assert.match(rememberedReply.reply,/câu trước chưa giải đáp đúng ý/);
assert.match(rememberedReply.reply,/12\/11\/2026/);
assert.match(rememberedReply.reply,/Việt Nam/);
assert(!rememberedReply.reply.includes('Xin chào từ Staging'),
  'Never use stale raw model answer for source-backed follow-ups');
assert.equal(rememberedReply.sources.length,1);
assert.equal(rememberedReply.sources[0].type,'official_claim');

const vnFollowup=await chat(req('/api/ai-preview/chat',{cookie:rawCookie+'; '+signedContext,
  body:{surface:'visitor',message:'thế ở Việt Nam thì sao',conversationId:'conv_preview_12345678'}}),env,{publicFetch});
assert.equal(vnFollowup.status,200);
assert.match((await vnFollowup.json()).reply,/chưa xác minh được giờ mở cập nhật riêng tại Việt Nam/);

const tampered=signedContext.replace(/.$/,'X');
const forged=await chat(req('/api/ai-preview/chat',{cookie:rawCookie+'; '+tampered,
  body:{surface:'visitor',message:'trả lời dở thế',conversationId:'conv_preview_12345678'}}),env,{publicFetch});
assert.equal(forged.status,200);
assert.equal((await forged.json()).reply,'Xin chào từ Staging',
  'Forged topic must not be accepted');

const otherConversation=await chat(req('/api/ai-preview/chat',{cookie:rawCookie+'; '+signedContext,
  body:{surface:'visitor',message:'trả lời dở thế',conversationId:'conv_other_12345678'}}),env,{publicFetch});
assert.equal(otherConversation.status,200);
assert.equal((await otherConversation.json()).reply,'Xin chào từ Staging',
  'Never replay context into a different conversation');


const betaBefore=await chat(req('/api/ai-preview/chat',{cookie:rawCookie,
  body:{surface:'visitor',message:'Beta 4.7 bản nào mới nhất?'}}),env,{publicFetch});
assert.equal(betaBefore.status,200);
const beforeBeta=await betaBefore.json();
assert.match(beforeBeta.reply,/V4\.7\.5.*chưa mở tải/);
assert.equal(beforeBeta.sources.length,1,'Only Beta catalog source for Beta status');
assert.equal(beforeBeta.sources[0].type,'site_release');
assert.equal(publicCalls.length,1,'Beta-only question should fetch Beta endpoint, not posts');

dynamicVersions[0].status='released';
const updated=await chat(req('/api/ai-preview/chat',{cookie:rawCookie,
  body:{surface:'visitor',message:'Beta 4.7 bản nào mới nhất?'}}),env,{publicFetch});
assert.equal(updated.status,200);
assert.match((await updated.json()).reply,/V4\.7\.5.*được đánh dấu đã phát hành/,
 'A Beta API change must affect the next answer without a code change');
const beta=await chat(req('/api/ai-preview/chat',{cookie:rawCookie,
  body:{surface:'visitor',message:'Beta 4.7 đã có chưa?'}}),env,{publicFetch});
assert.equal(beta.status,200);
assert.match((await beta.json()).reply,/V4\.7\.5/);
const news=await chat(req('/api/ai-preview/chat',{cookie:rawCookie,
  body:{surface:'visitor',message:'tin PUBG mới nhất'}}),env,{publicFetch});
assert.equal(news.status,200);
const newsBody=await news.json();
assert.match(newsBody.reply,/PUBG MOBILE FLASH/);
assert(newsBody.sources?.some(x=>x.type==='site_news'));
const generic=await chat(req('/api/ai-preview/chat',{cookie:rawCookie,
  body:{surface:'visitor',message:'khi nào có bản update mới'}}),env,{publicFetch});
assert.equal(generic.status,200);
const nextSchedule=await generic.json();
assert.match(nextSchedule.reply,/PUBG MOBILE 4\.7.*12\/11\/2026/);
assert(!nextSchedule.reply.includes('V4.7.5'));
assert.equal(nextSchedule.sources.length,1,'One official citation, not a list of Beta/news');
assert.equal(nextSchedule.sources[0].type,'official_claim');
assert.equal(nextSchedule.sources[0].url,
  'https://www.pubgmobile.jp/version-4-7-0-update-notice-20261105/');

const other=await chat(req('/api/ai-preview/chat',{cookie:rawCookie,
  body:{surface:'visitor',message:'bao giờ có bản update 4.6'}}),env,{publicFetch});
assert.equal(other.status,200);
assert.match((await other.json()).reply,/Chưa đủ căn cứ/i,
 'Do not invent dates for absent versions');
assert(publicCalls.every(x=>[
  'https://trainingbot.io.vn/api/beta-versions',
  'https://trainingbot.io.vn/api/posts?limit=12'
].includes(x)),'Only fixed allowlisted public endpoints');
assert.equal(lastGuest,responses.at(-1).guest);
assert.equal((await chat(req('/api/ai-preview/chat',{cookie:rawCookie,headers:{'CF-Connecting-IP':'203.0.113.52'},body:{surface:'visitor',message:'Xin chào'}}),env)).status,401,'Guest cookie bound to IP');
const prod='https://trainingbot.io.vn';
for(const action of [status,session,chat]){
 const res=await action(req('/api/ai-preview/chat',{host:prod}),env);
 assert.equal(res.status,404,'Production forbidden independent of binding');
}
assert.equal((await session(req('/api/ai-preview/session',{headers:{'CF-Connecting-IP':''}}),env)).status,503);
console.log('B.1 Preview BFF QA PASS: signed isolated service binding, anonymous HttpOnly guest, protected chat, production 404, admin forbidden');
