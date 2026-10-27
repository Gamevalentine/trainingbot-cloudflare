// Read-only HTTP header probes against the latest stable Preview branch.
// Non-gating: Cloudflare and GitHub deploy asynchronously; transient propagation
// cannot turn an otherwise passing source-code CI build red.
const origin="https://aion-trainingbot-public-p0-2.trainingbot-cloudflare.pages.dev";
const endpoints=["/","/search-index-v152.json","/wiki","/contact"];
for(const path of endpoints){
 try{
  const response=await fetch(origin+path,{method:"HEAD",redirect:"manual",signal:AbortSignal.timeout(15000)});
  console.log("P2 live header probe",path,JSON.stringify({
   status:response.status,
   csp:response.headers.get("content-security-policy"),
   xframe:response.headers.get("x-frame-options"),
   hsts:response.headers.get("strict-transport-security"),
   nosniff:response.headers.get("x-content-type-options"),
   cache:response.headers.get("cache-control"),
   contentType:response.headers.get("content-type"),
   robots:response.headers.get("x-robots-tag")
  }));
  if(!response.ok)console.log("QA NOTE: non-200 HEAD, investigate before release",path);
 }catch(e){console.log("QA NOTE: live header probe unavailable",path,String(e));}
}
