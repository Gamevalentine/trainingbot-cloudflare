const headers={ "content-type":"application/json; charset=utf-8",
  "cache-control":"no-store, max-age=0","x-content-type-options":"nosniff","x-robots-tag":"noindex, nofollow"};
export async function onRequestGet({request}) {
  const url=new URL(request.url);
  if(!url.hostname.endsWith(".trainingbot-cloudflare.pages.dev")||url.search)
    return new Response(JSON.stringify({error:"NOT_FOUND"}),{status:404,headers});
  // No source for authoritative website personal login has been supplied.
  // Do not infer Admin identity from the existing shared ADMIN_TOKEN.
  return new Response(JSON.stringify({preview:true,ready:false,identityVerified:false,
    surfaces:{visitor:false,admin:false},reason:"UPSTREAM_IDENTITY_NOT_VERIFIED"}),{status:200,headers});
}