import assert from 'node:assert/strict';
import {proxyPublicAi} from '../../functions/_lib/ai_widget_public_proxy.js';

const site='https://trainingbot.io.vn';
const preview='https://preview-ai-identity-bridge.trainingbot-cloudflare.pages.dev';
const ip='203.0.113.12';
const guest='__Host-tb_ai_b1=b_'+'a'.repeat(32)+'.1731320000000.'+'b'.repeat(43);
const admin='TRAININGBOT_ADMIN_TOKEN=do-not-forward';
const headers={origin:site,'sec-fetch-site':'same-origin',
 'content-type':'application/json','CF-Connecting-IP':ip,
 cookie:'site_pref=dark; '+guest+'; '+admin};
const make=(route,{method='POST',body={},path='',extra={},cookie=undefined}={})=>
 new Request(site+'/api/ai-preview/'+route+path,{method,
  headers:{...headers,...extra,...(cookie!==undefined?{cookie}:{})},
  ...(method==='POST'?{body:JSON.stringify(body)}:{})});

let calls=[];
const fetchImpl=async (url,opts)=>{
 assert.equal(opts.redirect,'manual');
 assert.equal(opts.cache,'no-store');
 assert(url.startsWith(preview+'/api/ai-preview/'));
 assert(!opts.headers.has('authorization'));
 assert(!opts.headers.has('CF-Connecting-IP'));
 assert(!opts.headers.has('TRAININGBOT_ADMIN_TOKEN'));
 assert(!opts.headers.get('cookie')?.includes('site_pref'));
 assert(!opts.headers.get('cookie')?.includes('ADMIN'));
 calls.push({url,method:opts.method,cookie:opts.headers.get('cookie'),body:opts.body});
 const step=url.slice((preview+'/api/ai-preview/').length);
 if(step==='status')return new Response(JSON.stringify({
  ready:true,anonymousVisitorReady:true,surfaces:{visitor:true,admin:false}}),{
  headers:{'content-type':'application/json'}});
 if(step==='session')return new Response(JSON.stringify({ok:true}),{
  headers:{'content-type':'application/json','set-cookie':guest+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=3600'}});
 return new Response(JSON.stringify({reply:'M416 sử dụng đạn 5.56mm.',
  conversationId:'conv_preview_12345678'}),{
  headers:{'content-type':'application/json','set-cookie':'__Host-tb_ai_last_v1=official47.1731320000000.'+'c'.repeat(43)+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=1200'}});
};
const status=await proxyPublicAi(make('status',{method:'GET'}),'status',{fetchImpl});
assert.equal(status.status,200);
assert.equal((await status.json()).anonymousVisitorReady,true);
const session=await proxyPublicAi(make('session',{body:{}}),'session',{fetchImpl});
assert.equal(session.status,200);
assert(session.headers.get('set-cookie').startsWith(guest));
assert(!session.headers.get('set-cookie').includes('Partitioned'));
const chat=await proxyPublicAi(make('chat',{body:{surface:'visitor',message:'M416 dùng đạn gì?'}}),'chat',{fetchImpl});
assert.equal(chat.status,200);
assert.match((await chat.json()).reply,/5\.56mm/);
assert.match(chat.headers.get('set-cookie'),/^__Host-tb_ai_last_v1/);
assert.equal(calls.length,3);

 // The same site can be reached through its Cloudflare project alias.
 // This was returning a raw "Not found" on iPhone due to host checks.
const alias='https://trainingbot-cloudflare.pages.dev';
const aliasStatus=await proxyPublicAi(new Request(alias+'/api/ai-preview/status',{
 method:'GET',headers:{'sec-fetch-site':'same-origin'}
}),'status',{fetchImpl});
assert.equal(aliasStatus.status,200,'Pages project hostname must work when first-party');
const aliasSession=await proxyPublicAi(new Request(alias+'/api/ai-preview/session',{
 method:'POST',
 headers:{origin:alias,'sec-fetch-site':'same-origin','content-type':'application/json'},
 body:'{}'
}),'session',{fetchImpl});
assert.equal(aliasSession.status,200,'Alias must issue first-party guest cookie');
const aliasChat=await proxyPublicAi(new Request(alias+'/api/ai-preview/chat',{
 method:'POST',headers:{origin:alias,'sec-fetch-site':'same-origin','content-type':'application/json',
 cookie:guest},body:JSON.stringify({surface:'visitor',message:'M416 dùng đạn gì?'})
}),'chat',{fetchImpl});
assert.equal(aliasChat.status,200);
assert.match((await aliasChat.json()).reply,/5\.56mm/);
const forgedOrigin=await proxyPublicAi(new Request(alias+'/api/ai-preview/session',{
 method:'POST',headers:{origin:site,'sec-fetch-site':'same-origin','content-type':'application/json'},
 body:'{}'
}),'session',{fetchImpl});
assert.equal(forgedOrigin.status,403,'Alias page must reject mismatching canonical Origin');
assert.equal((await proxyPublicAi(new Request('https://attacker.invalid/api/ai-preview/status',{
 method:'GET'
}),'status',{fetchImpl})).status,404,'No arbitrary hostname allowed');
assert.equal((await proxyPublicAi(new Request('http://trainingbot.io.vn/api/ai-preview/status',{
 method:'GET'
}),'status',{fetchImpl})).status,404,'HTTPS required');

assert.equal(calls[0].cookie,guest);
assert.equal(calls[1].cookie,guest);
assert.equal(calls[2].cookie,guest);
assert.equal(calls[1].body,'{}');
assert.equal(calls[2].body,JSON.stringify({surface:'visitor',message:'M416 dùng đạn gì?'}));
assert.equal((await proxyPublicAi(make('session',{extra:{origin:'https://evil.invalid'}}),'session',{fetchImpl})).status,403);
assert.equal((await proxyPublicAi(make('session',{extra:{'sec-fetch-site':'cross-site'}}),'session',{fetchImpl})).status,403);
assert.equal((await proxyPublicAi(make('chat',{body:{surface:'admin',message:'hi'}}),'chat',{fetchImpl})).status,400);
assert.equal((await proxyPublicAi(make('chat',{body:{surface:'visitor',message:'hi',admin:true}}),'chat',{fetchImpl})).status,400);
assert.equal((await proxyPublicAi(make('session',{body:{role:'admin'}}),'session',{fetchImpl})).status,400);
assert.equal((await proxyPublicAi(make('session',{path:'?embed=1'}),'session',{fetchImpl})).status,404);
assert.equal((await proxyPublicAi(make('chat',{method:'GET'}),'chat',{fetchImpl})).status,405);
assert.equal((await proxyPublicAi(make('admin-chat'),'admin-chat',{fetchImpl})).status,404);
assert.equal((await proxyPublicAi(make('chat',{cookie:'my_admin=x; '+admin,body:{surface:'visitor',message:'hi'}}),'chat',{fetchImpl})).status,200);
assert.equal(calls.at(-1).cookie,null);
assert(calls.every(c=>c.url.startsWith(preview+'/api/ai-preview/')));
// Never return a forged Set-Cookie or any non-JSON arbitrary response.
const cookieAttack=async()=>new Response(JSON.stringify({ok:true}),{headers:{
 'content-type':'application/json','set-cookie':'admin=evil; Path=/; Secure; HttpOnly; SameSite=Strict'}});
assert.equal((await proxyPublicAi(make('session'),'session',{fetchImpl:cookieAttack})).status,503);
const redirectAttack=async()=>new Response(null,{status:302,headers:{location:'https://evil.invalid'}});
assert.equal((await proxyPublicAi(make('status',{method:'GET'}),'status',{fetchImpl:redirectAttack})).status,503);
console.log('PASS: iOS first-party chat bridge, 5.56mm reply, strict guest cookies, no Admin leaks, bounded route and CSRF checks');
