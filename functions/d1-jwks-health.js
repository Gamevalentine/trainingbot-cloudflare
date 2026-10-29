// Temporary PREVIEW-ONLY diagnostic; does not accept credentials or touch D1.
const HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-robots-tag":"noindex, nofollow"};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:HEADERS});
export async function onRequestGet({request}){
  const host=new URL(request.url).hostname;
  // Never provide this diagnostic on the Production hostname or canonical Pages alias.
  if(!host.endsWith(".trainingbot-cloudflare.pages.dev"))
    return reply({ok:false,message:"Preview only"},404);
  const endpoint=new URL(request.url);
  // Public-key import test ONLY: the supplied key never authenticates a request.
  if(endpoint.searchParams.get("mode")==="import"){
    try{
      const encoded=endpoint.searchParams.get("jwk")||"";
      if(encoded.length<100||encoded.length>1500||!/^[A-Za-z0-9_-]+$/.test(encoded))
        return reply({ok:false,stage:"input_validation"},400);
      const json=atob(encoded.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(encoded.length/4)*4,"="));
      const key=JSON.parse(json);
      if(key.kty!=="RSA"||key.alg!=="RS256"||key.use!=="sig"||typeof key.n!=="string"||typeof key.e!=="string")
        return reply({ok:false,stage:"key_validation"},400);
      const imported=await crypto.subtle.importKey("jwk",key,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
      return reply({ok:imported.type==="public",stage:"import-rsa",crypto_import_ok:imported.type==="public",diagnostic_version:"d1-20261030-import"});
    }catch(error){return reply({ok:false,stage:"import-rsa",error_class:String(error?.name||"Error")},503)}
  }
  if(endpoint.searchParams.get("mode")==="control"){
    const targets={
      github_api:"https://api.github.com",
      cloudflare_docs:"https://developers.cloudflare.com",
      oidc_discovery:"https://token.actions.githubusercontent.com/.well-known/openid-configuration",
      oidc_jwks:"https://token.actions.githubusercontent.com/.well-known/jwks"
    };
    const checks={};
    for(const [name,target] of Object.entries(targets)){
      try{const response=await fetch(target,{redirect:"error"});checks[name]={status:response.status};}
      catch(error){checks[name]={error_class:String(error?.name||"Error")};}
    }
    return reply({ok:true,diagnostic_version:"d1-20261030-control",checks});
  }
  const url="https://token.actions.githubusercontent.com/.well-known/jwks";
  let stage="fetch-jwks";
  try{
    const response=await fetch(url,{headers:{Accept:"application/json"},redirect:"error"});
    if(!response.ok)return reply({ok:false,jwks_http:response.status,crypto_import_ok:false},503);
    stage="parse-jwks";
    const doc=await response.json();
    const key=Array.isArray(doc.keys)?doc.keys.find(x=>x.kty==="RSA"&&x.alg==="RS256"&&x.use==="sig"&&typeof x.kid==="string"):null;
    if(!key)return reply({ok:false,jwks_http:200,rsa_key_present:false,crypto_import_ok:false},503);
    stage="import-rsa";
    const imported=await crypto.subtle.importKey("jwk",key,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
    return reply({ok:imported.type==="public",jwks_http:200,rsa_key_present:true,crypto_import_ok:imported.type==="public"});
  }catch(error){
    return reply({ok:false,jwks_http:null,crypto_import_ok:false,failed_stage:stage,error_class:String(error?.name||"Error").slice(0,64)},503);
  }
}
