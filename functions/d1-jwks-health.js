// Temporary PREVIEW-ONLY diagnostic; does not accept credentials or touch D1.
const HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-robots-tag":"noindex, nofollow"};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:HEADERS});
export async function onRequestGet({request}){
  const host=new URL(request.url).hostname;
  // Never provide this diagnostic on the Production hostname or canonical Pages alias.
  if(!host.endsWith(".trainingbot-cloudflare.pages.dev"))
    return reply({ok:false,message:"Preview only"},404);
  const url="https://token.actions.githubusercontent.com/.well-known/jwks";
  try{
    const response=await fetch(url,{headers:{Accept:"application/json"},redirect:"error"});
    if(!response.ok)return reply({ok:false,jwks_http:response.status,crypto_import_ok:false},503);
    const doc=await response.json();
    const key=Array.isArray(doc.keys)?doc.keys.find(x=>x.kty==="RSA"&&x.alg==="RS256"&&x.use==="sig"&&typeof x.kid==="string"):null;
    if(!key)return reply({ok:false,jwks_http:200,rsa_key_present:false,crypto_import_ok:false},503);
    const imported=await crypto.subtle.importKey("jwk",key,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
    return reply({ok:imported.type==="public",jwks_http:200,rsa_key_present:true,crypto_import_ok:imported.type==="public"});
  }catch(error){
    return reply({ok:false,jwks_http:null,crypto_import_ok:false,error_class:String(error?.name||"Error").slice(0,64)},503);
  }
}
