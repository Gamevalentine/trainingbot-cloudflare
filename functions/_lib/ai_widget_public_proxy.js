// A narrowly scoped, first-party public-chat bridge for iOS Safari.
// Only the three anonymous Visitor AI Preview endpoints may be called, and
// only with bounded JSON. Production does not receive staging credentials,
// Admin access, or any general-purpose proxy capability.
//
// Why: Safari blocks third-party Pages Preview frames / cookies. On the public
// TrainingBot domain this bridge transports the SAME HMAC-authenticated guest
// session through a first-party, Secure, HttpOnly, SameSite=Strict cookie.
// Preview still owns all quota, D1 and model policies.
const PUBLIC_ORIGIN='https://trainingbot.io.vn';
const PREVIEW_ORIGIN='https://preview-ai-identity-bridge.trainingbot-cloudflare.pages.dev';
const VALID_ROUTES=new Set(['status','session','chat']);
const GUEST_COOKIES=new Set(['__Host-tb_ai_b1','__Host-tb_ai_last_v1']);
const HEADERS={
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store, max-age=0',
  'x-content-type-options':'nosniff',
  'x-robots-tag':'noindex, nofollow',
  'referrer-policy':'no-referrer'
};
const err=(code,status=503)=>new Response(JSON.stringify({error:{code}}),{status,headers:HEADERS});
function selectGuestCookies(cookieHeader){
  const selected=[];
  if(typeof cookieHeader!=='string'||cookieHeader.length>8192)return '';
  for(const raw of cookieHeader.split(';')){
    const part=raw.trim(),i=part.indexOf('=');
    if(i<0)continue;
    const name=part.slice(0,i),value=part.slice(i+1);
    if(!GUEST_COOKIES.has(name))continue;
    if(value.length>220||!/^[A-Za-z0-9_.-]+$/.test(value))return '';
    if(selected.some(x=>x.startsWith(name+'=')))return '';
    selected.push(name+'='+value);
  }
  return selected.join('; ');
}
function validCookieSet(value,route){
  if(!value)return true;
  if(value.length>510||/[\r\n,]/.test(value))return false;
  const name=value.split('=',1)[0];
  if(route==='session'&&name!=='__Host-tb_ai_b1')return false;
  if(route==='chat'&&name!=='__Host-tb_ai_last_v1'&&name!=='__Host-tb_ai_b1')return false;
  if(route==='status')return false;
  return /;\s*Path=\/(?:;|$)/i.test(value)&&
    /;\s*Secure(?:;|$)/i.test(value)&&
    /;\s*HttpOnly(?:;|$)/i.test(value)&&
    /;\s*SameSite=Strict(?:;|$)/i.test(value)&&
    !/;\s*Domain=/i.test(value);
}
async function limitedJson(request,route){
  const declared=Number(request.headers.get('content-length')||0);
  if(!Number.isFinite(declared)||declared>4096)return null;
  const raw=await request.text();
  if(new TextEncoder().encode(raw).length>4096)return null;
  let data;
  try{data=JSON.parse(raw)}catch{return null}
  if(!data||Array.isArray(data)||typeof data!=='object')return null;
  if(route==='session'){
    if(Object.keys(data).length!==0)return null;
  }else if(route==='chat'){
    if(data.surface!=='visitor'||typeof data.message!=='string'||
      !data.message.trim()||data.message.length>3000||
      Object.keys(data).some(k=>!['surface','message','conversationId'].includes(k))||
      (data.conversationId!==undefined&&
        (typeof data.conversationId!=='string'||!/^[A-Za-z0-9_-]{8,100}$/.test(data.conversationId))))
      return null;
  }
  return JSON.stringify(data);
}
export async function proxyPublicAi(request,route,{fetchImpl=fetch}={}){
  try{
    const url=new URL(request.url);
    if(!VALID_ROUTES.has(route)||url.origin!==PUBLIC_ORIGIN||url.search||url.hash)
      return err('NOT_FOUND',404);
    const method=route==='status'?'GET':'POST';
    if(request.method!==method)return err('METHOD_NOT_ALLOWED',405);
    if(method==='POST'){
      const origin=request.headers.get('origin');
      const site=request.headers.get('sec-fetch-site');
      if(origin&&origin!==PUBLIC_ORIGIN)return err('INVALID_ORIGIN',403);
      if(site&&site!=='same-origin')return err('INVALID_FETCH_SITE',403);
      if(!origin&&site!=='same-origin')return err('MISSING_BROWSER_PROOF',403);
      if(!/^application\/json(?:;\s*charset=utf-8)?$/i.test(request.headers.get('content-type')||''))
        return err('INVALID_CONTENT_TYPE',415);
    }
    const body=method==='POST'?await limitedJson(request,route):null;
    if(method==='POST'&&body===null)return err('INVALID_INPUT',400);
    const guest=selectGuestCookies(request.headers.get('cookie'));
    const headers=new Headers({accept:'application/json'});
    // Fixed backend peer: never use browser-provided Origin / Authorization
    // headers, cookies outside the two signed guest cookies, or arbitrary URL.
    if(method==='POST'){
      headers.set('content-type','application/json');
      headers.set('origin',PREVIEW_ORIGIN);
    }
    if(guest)headers.set('cookie',guest);
    const response=await fetchImpl(PREVIEW_ORIGIN+'/api/ai-preview/'+route,{
      method,headers,redirect:'manual',cache:'no-store',
      ...(body!==null?{body}:{})
    });
    if(![200,400,401,403,404,429,503].includes(response.status))
      return err('UPSTREAM_UNEXPECTED_STATUS');
    if(!(response.headers.get('content-type')||'').startsWith('application/json'))
      return err('UPSTREAM_INVALID_CONTENT_TYPE');
    const raw=await response.text();
    if(raw.length>20000)return err('UPSTREAM_TOO_LARGE');
    let data;
    try{data=JSON.parse(raw)}catch{return err('UPSTREAM_INVALID_JSON')}
    if(!data||typeof data!=='object'||Array.isArray(data))
      return err('UPSTREAM_INVALID_JSON');
    const outHeaders={...HEADERS};
    const issued=response.headers.get('set-cookie');
    if(!validCookieSet(issued,route))return err('UPSTREAM_INVALID_COOKIE');
    if(issued)outHeaders['set-cookie']=issued;
    return new Response(raw,{status:response.status,headers:outHeaders});
  }catch(e){
    console.error('TrainingBot public AI bridge unavailable',route,e?.name||'Error');
    return err('BRIDGE_UNAVAILABLE');
  }
}
