// Preview-only B.1 first-party BFF. No global fetch, direct upstream URL, or Production resource.
const encoder=new TextEncoder();
const JSON_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store, max-age=0',
  'x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow','referrer-policy':'no-referrer'};
const cookieName='__Host-tb_ai_b1';
const safe=(status,data,headers={})=>new Response(JSON.stringify(data),{status,headers:{...JSON_HEADERS,...headers}});
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/g,'');
const proof=async(secret,s)=>b64(new Uint8Array(await crypto.subtle.sign('HMAC',secret,encoder.encode(s))));
async function keyFrom(env){
 const value=env?.TRAININGBOT_AI_PREVIEW_BRIDGE_SECRET;
 if(typeof value!=='string'||!/^[0-9a-f]{64}$/.test(value))return null;
 const bin=Uint8Array.from(value.match(/../g).map(x=>parseInt(x,16)));
 return crypto.subtle.importKey('raw',bin,{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
const equals=(a,b)=>{let difference=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)difference|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return difference===0;};
function previewHost(url){
 return url.hostname!=='trainingbot-cloudflare.pages.dev' &&
  url.hostname.endsWith('.trainingbot-cloudflare.pages.dev') && url.protocol==='https:';
}
const ipFrom=req=>{
 const ip=req.headers.get('CF-Connecting-IP')||'';
 return /^[a-f0-9:.]{3,45}$/i.test(ip)?ip.toLowerCase():null;
};
async function context(request,env){
 const u=new URL(request.url);
 if(!previewHost(u)||u.search||u.hash)return null;
 // Only service binding. Never proxy to public website or arbitrary user-supplied URL.
 if(!env?.TRAININGBOT_AI_STAGE_WORKER?.fetch)return null;
 const key=await keyFrom(env);if(!key)return null;
 const ip=ipFrom(request);if(!ip)return null;
 return {u,key,ipHash:await proof(key,'preview-ip:'+ip),binding:env.TRAININGBOT_AI_STAGE_WORKER};
}
async function stage(ctx,route,method,data){
 let step='INIT';
 try{
 const raw=method==='GET'?'':JSON.stringify(data);
 step='NONCE';
 const timestamp=String(Date.now()),nonce=crypto.randomUUID();
 step='DIGEST';
 const digest=await proof(ctx.key,'body:'+raw);
 step='SIGN';
 const signature=await proof(ctx.key,['TRAININGBOT_B1',method,route,timestamp,nonce,ctx.ipHash,digest].join('\n'));
 step='REQUEST';
 const init={method,redirect:'manual',headers:{'accept':'application/json',
   'x-tb-b1-time':timestamp,'x-tb-b1-nonce':nonce,'x-tb-b1-ip':ctx.ipHash,
   'x-tb-b1-signature':signature,
   ...(method==='POST'?{'content-type':'application/json'}:{})},
   ...(method==='POST'?{body:raw}:{})};
 // Scoped subrequest only to named Worker binding; Staging verifies the HMAC before D1/model access.
 step='FETCH';
 const res=await ctx.binding.fetch(new Request('https://trainingbot-ai-staging.ai-vn.workers.dev'+route,init));
 step='RESPONSE';
  if(![200,400,401,403,404,429,503].includes(res.status))return {status:503,category:'UNEXPECTED_UPSTREAM_STATUS'};
  if(!(res.headers.get('content-type')||'').startsWith('application/json'))return {status:503,category:'UPSTREAM_CONTENT_TYPE'};
  const body=await res.text();
  if(body.length>20000)return {status:503,category:'UPSTREAM_BODY_LIMIT'};
  return {status:res.status,json:JSON.parse(body),category:'UPSTREAM_HTTP'};
 }catch(e){
  const type=['TypeError','RangeError','NotSupportedError','Error','DOMException'].includes(e?.name)?e.name:'Other';
  return {status:503,category:'EXCEPTION_'+step+'_'+type};
 }
}
function goodPost(req,ctx){
 if(req.method!=='POST'||req.headers.get('origin')!==ctx.u.origin)return false;
 const site=req.headers.get('sec-fetch-site');
 if(site&&site!=='same-origin')return false;
 return /^application\/json(?:;\s*charset=utf-8)?$/i.test(req.headers.get('content-type')||'');
}
async function boundedJson(req,bytes=4096){
 const declared=Number(req.headers.get('content-length')||0);
 if(declared>bytes)return null;
 const text=await req.text();
 if(encoder.encode(text).length>bytes)return null;
 try{const obj=JSON.parse(text);return obj&&typeof obj==='object'&&!Array.isArray(obj)?obj:null;}catch{return null;}
}
function cookieValue(request){
 const found=(request.headers.get('cookie')||'').split(';').map(x=>x.trim())
   .filter(s=>s.startsWith(cookieName+'='));
 return found.length===1?found[0].slice(cookieName.length+1):'';
}
async function validateCookie(req,ctx){
 const raw=cookieValue(req);
 const matches=/^(b_[a-zA-Z0-9_-]{32})\.(\d{13})\.([A-Za-z0-9_-]{43})$/.exec(raw);
 if(!matches)return null;
 const [,id,expires,signature]=matches;
 if(Number(expires)<=Date.now()||Number(expires)>Date.now()+3600000)return null;
 const expected=await proof(ctx.key,['cookie',id,expires,ctx.ipHash,ctx.u.hostname].join(':'));
 return equals(expected,signature)?id:null;
}
function expiresCookie(){return cookieName+'=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0';}
export async function status(request,env){
 if(!previewHost(new URL(request.url)))return safe(404,{error:{code:'NOT_FOUND'}});
 const ctx=await context(request,env);
 if(!ctx||request.method!=='GET')return safe(200,{preview:true,ready:false,identityVerified:false,
  anonymousVisitorReady:false,surfaces:{visitor:false,admin:false},reason:'PREVIEW_BFF_NOT_CONFIGURED'});
 const r=await stage(ctx,'/__preview_b1/status','GET');
 const isReady=r.status===200&&r.json?.ok===true&&r.json?.visitor===true;
 return safe(200,{preview:true,ready:isReady,identityVerified:false,
   anonymousVisitorReady:isReady,surfaces:{visitor:isReady,admin:false},
   ...(!isReady?{reason:'STAGING_BRIDGE_UNAVAILABLE'}:{})});
}
export async function session(request,env){
 if(!previewHost(new URL(request.url)))return safe(404,{error:{code:'NOT_FOUND'}});
 const ctx=await context(request,env);
 if(!ctx)return safe(503,{error:{code:'PREVIEW_BFF_NOT_CONFIGURED'}});
 if(!goodPost(request,ctx))return safe(403,{error:{code:'FORBIDDEN'}});
 const body=await boundedJson(request,128);
 if(!body||Object.keys(body).length!==0)return safe(400,{error:{code:'INVALID_INPUT'}});
 const prior=await validateCookie(request,ctx);
 if(prior)return safe(200,{ok:true,reused:true});
 const id='b_'+b64(crypto.getRandomValues(new Uint8Array(24)));
 const resp=await stage(ctx,'/__preview_b1/session','POST',{visitorId:id});
 if(resp.status!==200||resp.json?.ok!==true)
  return safe([429,403].includes(resp.status)?resp.status:503,{error:{code:resp.status===429?'RATE_LIMITED':'SESSION_UNAVAILABLE'}});
 const expires=String(Date.now()+3600000);
 const signature=await proof(ctx.key,['cookie',id,expires,ctx.ipHash,ctx.u.hostname].join(':'));
 return safe(200,{ok:true,expiresInSeconds:3600},{'set-cookie':cookieName+'='+id+'.'+expires+'.'+signature+
  '; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=3600'});
}
export async function chat(request,env){
 if(!previewHost(new URL(request.url)))return safe(404,{error:{code:'NOT_FOUND'}});
 const ctx=await context(request,env);
 if(!ctx)return safe(503,{error:{code:'PREVIEW_BFF_NOT_CONFIGURED'}});
 if(!goodPost(request,ctx))return safe(403,{error:{code:'FORBIDDEN'}});
 const visitorId=await validateCookie(request,ctx);
 if(!visitorId)return safe(401,{error:{code:'UNAUTHORIZED'}},{'set-cookie':expiresCookie()});
 const body=await boundedJson(request,4096);
 if(!body||body.surface!=='visitor'||typeof body.message!=='string'||!body.message.trim()||
    body.message.length>3000||Object.keys(body).some(k=>!['surface','message','conversationId'].includes(k))||
    (body.conversationId!==undefined&&!/^[A-Za-z0-9_-]{8,100}$/.test(body.conversationId)))
   return safe(400,{error:{code:'INVALID_INPUT'}});
 const forwarded={visitorId,message:body.message.trim()};
 if(body.conversationId!==undefined)forwarded.conversationId=body.conversationId;
 const result=await stage(ctx,'/__preview_b1/chat','POST',forwarded);
 if(result.status===429)return safe(429,{error:{code:'RATE_LIMITED'}});
 if(result.status!==200||typeof result.json?.reply!=='string'||result.json.reply.length>16000)
  return safe(result.status===401?401:503,{error:{code:'AI_UNAVAILABLE'}});
 return safe(200,{reply:result.json.reply,conversationId:result.json.conversationId,
   revision:result.json.revision});
}
