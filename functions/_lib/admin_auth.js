const encoder = new TextEncoder();

export const ADMIN_USERNAME = "admin";
const PASSWORD_SALT_HEX = "dee195c7292c3999baa2819843244334";
const PASSWORD_HASH_HEX = "7cfec1da2b649f474ccc9959ba9c1691ee865f3ab44dcf294bffd05eea1643b0";
const PASSWORD_ITERATIONS = 210000;
const TOTP_SALT = "8f4de04bf9061fa007b1b89960d0dd5a";
const UPSTREAM_ORIGIN = "https://trainingbot-cloud.ai-vn.workers.dev";
const LINK_COOKIE = "tb_admin_upstream_v23";
const SESSION_COOKIE = "tb_admin_session_v23";
const SESSION_TTL = 60 * 60 * 8;
const LINK_TTL = 60 * 60 * 24 * 30;

function bytesToHex(bytes){return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("")}
function hexToBytes(hex){const out=new Uint8Array(hex.length/2);for(let i=0;i<out.length;i++)out[i]=parseInt(hex.slice(i*2,i*2+2),16);return out}
function safeEqual(a,b){a=String(a||"");b=String(b||"");if(a.length!==b.length)return false;let v=0;for(let i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);return v===0}
function b64url(bytes){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replaceAll("+","-").replaceAll("/","_").replace(/=+$/g,"")}
function parseCookies(request){const raw=request.headers.get("Cookie")||"";const map={};for(const part of raw.split(";")){const i=part.indexOf("=");if(i<0)continue;map[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim())}return map}
function cookie(name,value,maxAge){return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`}
export function clearCookie(name){return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`}
export function linkCookie(token){return cookie(LINK_COOKIE,token,LINK_TTL)}
export function sessionCookie(value){return cookie(SESSION_COOKIE,value,SESSION_TTL)}

export async function verifyAccount(username,password){
  if(!safeEqual(String(username||"").trim(),ADMIN_USERNAME))return false;
  const material=await crypto.subtle.importKey("raw",encoder.encode(String(password||"")),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:hexToBytes(PASSWORD_SALT_HEX),iterations:PASSWORD_ITERATIONS,hash:"SHA-256"},material,256);
  return safeEqual(bytesToHex(new Uint8Array(bits)),PASSWORD_HASH_HEX);
}

async function hmac(keyBytes,data,hash="SHA-256"){
  const key=await crypto.subtle.importKey("raw",keyBytes,{name:"HMAC",hash},false,["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC",key,typeof data==="string"?encoder.encode(data):data));
}

async function totpSecretBytes(token){
  const sig=await hmac(encoder.encode(token),`TrainingBot Admin TOTP v23|${TOTP_SALT}`,"SHA-256");
  return sig.slice(0,20);
}

export function base32(bytes){
  const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";let bits=0,value=0,out="";
  for(const b of bytes){value=(value<<8)|b;bits+=8;while(bits>=5){out+=alphabet[(value>>>(bits-5))&31];bits-=5}}
  if(bits>0)out+=alphabet[(value<<(5-bits))&31];return out;
}

async function hotp(secret,counter){
  const msg=new Uint8Array(8);let n=BigInt(counter);for(let i=7;i>=0;i--){msg[i]=Number(n&255n);n>>=8n}
  const mac=await hmac(secret,msg,"SHA-1");const off=mac[mac.length-1]&15;
  const code=((mac[off]&127)<<24)|((mac[off+1]&255)<<16)|((mac[off+2]&255)<<8)|(mac[off+3]&255);
  return String(code%1000000).padStart(6,"0");
}

export async function verifyTotp(token,code){
  code=String(code||"").replace(/\s/g,"");if(!/^\d{6}$/.test(code))return false;
  const secret=await totpSecretBytes(token);const step=Math.floor(Date.now()/30000);
  for(const delta of [-1,0,1])if(safeEqual(await hotp(secret,step+delta),code))return true;
  return false;
}

export async function totpSetup(token){
  const secret=base32(await totpSecretBytes(token));
  const label=encodeURIComponent(`TrainingBot:${ADMIN_USERNAME}`);const issuer=encodeURIComponent("TrainingBot");
  return {secret,issuer:"TrainingBot",account:ADMIN_USERNAME,otpauth:`otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`};
}

export async function validateUpstreamToken(token){
  if(!token||token.length<8)return false;
  try{
    const r=await fetch(`${UPSTREAM_ORIGIN}/api/v49/admin/users?limit=1`,{headers:{Authorization:`Bearer ${token}`,Accept:"application/json"}});
    if(r.ok)return true;
    const r2=await fetch(`${UPSTREAM_ORIGIN}/api/v40/admin/content?page=%2Findex.html`,{headers:{Authorization:`Bearer ${token}`,Accept:"application/json"}});
    return r2.ok;
  }catch{return false}
}

export function linkedToken(request){return parseCookies(request)[LINK_COOKIE]||""}

export async function makeSession(token){
  const exp=Math.floor(Date.now()/1000)+SESSION_TTL;const nonce=b64url(crypto.getRandomValues(new Uint8Array(12)));const body=`v1.${exp}.${nonce}`;
  const sig=b64url(await hmac(encoder.encode(token),body,"SHA-256"));return `${body}.${sig}`;
}

export async function readSession(request){
  const cookies=parseCookies(request);const token=cookies[LINK_COOKIE]||"";const value=cookies[SESSION_COOKIE]||"";
  if(!token||!value)return {authenticated:false,linked:!!token,token:""};
  const parts=value.split(".");if(parts.length!==4||parts[0]!=="v1")return {authenticated:false,linked:true,token:""};
  const exp=Number(parts[1]);if(!Number.isFinite(exp)||exp<Math.floor(Date.now()/1000))return {authenticated:false,linked:true,token:""};
  const body=parts.slice(0,3).join(".");const expected=b64url(await hmac(encoder.encode(token),body,"SHA-256"));
  return {authenticated:safeEqual(expected,parts[3]),linked:true,token:safeEqual(expected,parts[3])?token:""};
}

export function json(data,status=200,extraHeaders={}){
  return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...extraHeaders}})
}
