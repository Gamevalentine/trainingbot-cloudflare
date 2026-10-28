// Anonymous, GET-only health/profile reachability; no account data, cookies, tokens or response bodies.
const urls=[
 'https://trainingbot.io.vn/account.html',
 'https://trainingbot.io.vn/api/v49/profile',
 'https://trainingbot-cloud.ai-vn.workers.dev/',
 'https://trainingbot-cloud.ai-vn.workers.dev/healthz'
];
for(const url of urls){
 try{
  const r=await fetch(url,{method:'GET',redirect:'manual',
   headers:{Accept:'application/json,text/html;q=0.5'},signal:AbortSignal.timeout(10000)});
  console.log('ANONYMOUS_GET_REACHABILITY '+JSON.stringify({
   url,status:r.status,contentType:(r.headers.get('content-type')||'').slice(0,90),
   locationHost:r.headers.has('location')?(()=>{try{return new URL(r.headers.get('location'),url).hostname}catch{return 'invalid'}})():null
  }));
  try{await r.body?.cancel();}catch{}
 }catch(e){console.log('ANONYMOUS_GET_REACHABILITY '+JSON.stringify({url,status:'UNREACHABLE',reason:e.name==='TimeoutError'?'TIMEOUT':'FETCH_FAILED'}));}
}
