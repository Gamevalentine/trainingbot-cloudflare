const headers={ "content-type":"application/json; charset=utf-8",
  "cache-control":"no-store, max-age=0","x-content-type-options":"nosniff","x-robots-tag":"noindex, nofollow"};
export async function onRequestGet({request}) {
  const url=new URL(request.url);
  if(!url.hostname.endsWith(".trainingbot-cloudflare.pages.dev")||url.search)
    return new Response(JSON.stringify({error:"NOT_FOUND"}),{status:404,headers});
  // Visitor does not require account login; anonymous abuse controls are not yet deployed.
  // Admin requires an individually authenticated account; shared ADMIN_TOKEN is insufficient.
  return new Response(JSON.stringify({preview:true,ready:false,identityVerified:false,
    anonymousVisitorReady:false,surfaces:{visitor:false,admin:false},reason:"ANONYMOUS_AND_ADMIN_GATES_NOT_READY"}),{status:200,headers});
}