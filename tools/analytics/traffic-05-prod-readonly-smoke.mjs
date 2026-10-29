/* Scheduled read-only canary: GET static assets and unauthorized Admin APIs.
 * Never loads HTML or runs client JS, never creates a synthetic tracked visitor.
 * A Cloudflare 403 means "inconclusive due to WAF", not "website down".
 */
const BASE="https://trainingbot.io.vn";
const targets=[
  {path:"/admin_traffic_quality_v1.js?v=1",marker:"tbQualityChecks",kind:"asset"},
  {path:"/admin_traffic_sources_v1.js?v=3",marker:"tbTrafficLegacyVisits",kind:"asset"},
  {path:"/admin_traffic_anomalies_v1.js?v=3",marker:"tbAnomalyReviewed",kind:"asset"},
  {path:"/api/v72/admin/traffic-health",kind:"protected"},
  {path:"/api/v72/admin/traffic-sources",kind:"protected"},
  {path:"/api/v72/admin/traffic-anomalies",kind:"protected"},
  {path:"/api/v72/admin/traffic-visit-review",kind:"protected"}
];
const outcomes=[];
for(const target of targets){
  const started=Date.now(),controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch(BASE+target.path,{method:"GET",headers:{"Accept":"text/plain,application/json"},
      redirect:"manual",signal:controller.signal,cache:"no-store"});
    const ms=Date.now()-started;
    if(response.status===403||response.status===429){
      outcomes.push({path:target.path,result:"INCONCLUSIVE_WAF",http:response.status,elapsed_ms:ms});
      continue;
    }
    if(target.kind==="protected"){
      const result=response.status===401?"PASS":response.status===200?"FAIL_UNAUTHENTICATED_READ":"FAIL_UNEXPECTED_STATUS";
      outcomes.push({path:target.path,result,http:response.status,elapsed_ms:ms});
      continue;
    }
    if(response.status!==200){
      outcomes.push({path:target.path,result:"FAIL_ASSET_STATUS",http:response.status,elapsed_ms:ms});
      continue;
    }
    const text=(await response.text()).slice(0,200000);
    outcomes.push({path:target.path,
      result:text.includes(target.marker)?"PASS":"FAIL_MISSING_BUNDLE_MARKER",
      http:response.status,elapsed_ms:ms});
  }catch(error){
    outcomes.push({path:target.path,result:"INCONCLUSIVE_NETWORK",error:String(error?.name||"network error"),
      elapsed_ms:Date.now()-started});
  }finally{clearTimeout(timeout);}
}
for(const outcome of outcomes)console.log(JSON.stringify(outcome));
const fails=outcomes.filter(o=>o.result.startsWith("FAIL"));
const inconclusive=outcomes.filter(o=>o.result.startsWith("INCONCLUSIVE"));
console.log(JSON.stringify({checked:outcomes.length,failed:fails.length,inconclusive:inconclusive.length,
  note:"Read-only smoke checks; no synthetic visits or proof of D1 query speed"}));
if(fails.length)process.exitCode=1;
