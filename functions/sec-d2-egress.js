// SEC-D2 diagnostic: preview-only, GET, fixed allowlist, NO credentials/D1.
const HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-robots-tag":"noindex, nofollow","x-content-type-options":"nosniff"};
const reply=(data,status)=>new Response(JSON.stringify(data),{status,headers:HEADERS});
const TARGETS=Object.freeze({
  github_jwks:"https://token.actions.githubusercontent.com/.well-known/jwks",
  github_oidc_discovery:"https://token.actions.githubusercontent.com/.well-known/openid-configuration",
  public_example:"https://example.com/",
  cloudflare_docs:"https://developers.cloudflare.com/workers/runtime-apis/fetch/"
});
export async function onRequestGet({request}){
  const host=new URL(request.url).hostname;
  if(!host.endsWith(".trainingbot-cloudflare.pages.dev"))return reply({ok:false},404);
  const checks={};
  for(const [name,url] of Object.entries(TARGETS)){
    try{
      const response=await fetch(url,{method:"GET",redirect:"error",signal:AbortSignal.timeout(6000)});
      checks[name]={ok:response.ok,http:response.status};
    }catch(error){
      // Diagnostic shows stable exception class/code, never remote URLs in errors,
      // private request values, tokens, or stack traces.
      checks[name]={ok:false,error_name:String(error?.name||"Error").slice(0,50),
        error_message:String(error?.message||"").slice(0,110),
        error_cause:String(error?.cause?.code||error?.cause?.name||"").slice(0,50)};
    }
  }
  return reply({ok:true,scope:"preview-fixed-targets-read-only",checks},200);
}
