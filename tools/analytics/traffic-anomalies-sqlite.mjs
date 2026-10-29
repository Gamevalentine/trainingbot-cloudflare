import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {DatabaseSync} from "node:sqlite";
import {onRequestPost as track} from "../../functions/api/visitor-events.js";
import {onRequestGet as anomalies} from "../../functions/api/v72/admin/traffic-anomalies.js";
import {onRequestPost as enroll} from "../../functions/api/v72/admin/browser-label.js";

const db0=new DatabaseSync(":memory:");
const db={
  prepare(sql){return {sql,args:[],bind(...args){this.args=args;return this;},
    async first(){return db0.prepare(sql).get(...this.args)||null;},
    async all(){return {results:db0.prepare(sql).all(...this.args)};},
    async run(){return db0.prepare(sql).run(...this.args);}
  };},
  async batch(queries){return queries.map(q=>db0.prepare(q.sql).run(...q.args));}
};
const site="https://trainingbot.io.vn",adminId="admin_visit_1234567";
const env={DB:db,ADMIN_TOKEN:"local-qa-token"};
const now=new Date(),fresh=now.toISOString();
const old=new Date(now.getTime()-3*86400000).toISOString();
const first=new Request(site+"/api/visitor-events",{
  method:"POST",headers:{Origin:site,"Content-Type":"application/json","User-Agent":"Mozilla/5.0 Chrome/140 (Windows NT 10.0)"},
  body:JSON.stringify({visitorId:"seed_visitor_123456",sessionId:"seed_session_123456",type:"page_view",path:"/wiki",referrer:"https://google.com"})
});
first.cf={country:"GB"};
assert.equal((await track({request:first,env})).status,204,"ingestion must prepare real production schema");

const add=(id,{date=fresh,country="US",path="/",device="Máy tính",os="Windows",browser="Chrome",source="unknown",legacy=0}={})=>{
  db0.prepare(`INSERT INTO tb_visitor_visits_v2
    (visitor_id,visit_id,first_seen_at,last_seen_at,entry_path,current_path,country,device,os,browser,source_key,attribution_version)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,"visit_"+id,date,date,path,path,country,device,os,browser,source,legacy?0:1);
};
const pageview=id=>{
  const visit="visit_"+id;
  db0.prepare(`INSERT INTO tb_visitor_events_v1
    (session_id,visitor_id,event_type,path,label,target,created_at)
    VALUES(?,?,'page_view','/wiki','','/wiki',?)`).run(visit,id,fresh);
};
for(let i=0;i<10;i++)add("burst_visitor_"+i,{country:"US"});
add(adminId,{country:"US"});
for(let i=0;i<4;i++){
  const id="human_visit_"+i;
  add(id,{country:"VN",path:"/wiki",source:"google"});
  pageview(id);pageview(id);
}
for(let i=0;i<3;i++)add("historical_"+i,{date:old,country:"NL",source:"",legacy:1});
const labelReq=new Request(site+"/api/v72/admin/browser-label",{
  method:"POST",headers:{Authorization:"Bearer local-qa-token",Origin:site,"Content-Type":"application/json"},
  body:JSON.stringify({visitorId:adminId})
});
assert.equal((await enroll({request:labelReq,env})).status,200,"enroll Admin browser");

const request=(parameters="",auth=true)=>new Request(site+"/api/v72/admin/traffic-anomalies?"+parameters,
  {headers:auth?{Authorization:"Bearer local-qa-token"}:{}});
async function get(parameters=""){
  const response=await anomalies({request:request(parameters),env});
  assert.equal(response.status,200,"authorized report must load");
  return response.json();
}
assert.equal((await anomalies({request:request("",false),env})).status,401);
const before=db0.prepare("SELECT COUNT(*) AS n FROM tb_visitor_visits_v2").get().n;
const data=await get();
assert.equal(data.ready,true);
assert.equal(data.bot_score_available,false,"never fabricate Cloudflare scores");
assert.equal(data.review_summary?.basis,"visit_not_human");
assert.equal(data.review_summary.total_visits,15,"total visits are not visitor headcount");
assert.equal(data.review_summary.review_visits,10,"only suspicious US burst visits are separated");
assert.equal(data.review_summary.unflagged_visits,5,"unflagged count is NOT verified human");
assert.ok(data.method_note.includes("không phải xác suất bot"),"explain limited evidence");
const us=data.groups.find(g=>g.country==="US"&&g.entry_path==="/");
assert.ok(us,"burst must appear");
assert.equal(us.visitors,10,"Admin excluded from burst");
assert.equal(us.visits,10);
assert.equal(us.single_page_visits,10);
assert.equal(us.missing_source_visits,10);
assert.equal(us.priority,"priority","priority is a review queue, not bot verdict");
assert.ok(us.reasons.length>=2);
const vn=data.groups.find(g=>g.country==="VN"&&g.entry_path==="/wiki"&&g.visitors===4);
assert.ok(vn,"human-like reference group included");
assert.equal(vn.priority,"observe","known source/multiple pages should not be flagged just for group size");
assert.equal(vn.single_page_visits,0);
assert.equal((await get("country=US")).groups.every(g=>g.country==="US"),true);
assert.equal((await get("country=NL")).groups.length,0,"1-day window excludes old visits");
const historical=await get("days=7&country=NL");
assert.equal(historical.review_summary.total_visits,3);
assert.equal(historical.review_summary.review_visits,3);
assert.equal(historical.review_summary.unflagged_visits,0);
assert.ok(historical.groups.some(g=>g.visitors===3&&g.legacy_visits===3),"7-day window includes flagged legacy data");
const strict=await get("min_visitors=20");
assert.equal(strict.groups.length,0);
const after=db0.prepare("SELECT COUNT(*) AS n FROM tb_visitor_visits_v2").get().n;
assert.equal(after,before,"read-only anomaly API must not modify data");
const adminRows=db0.prepare("SELECT COUNT(*) AS n FROM tb_admin_browsers_v1").get().n;
assert.equal(adminRows,1,"Admin designation retained");
const html=await fs.readFile("public/admin.html","utf8");
assert.ok(html.includes("admin_traffic_anomalies_v1.js?v=3"),"real Admin includes anomaly panel");
assert.ok(html.includes("admin_traffic_sources_v1.js?v=3"),"source report remains");
assert.ok(html.includes("admin_visitor_analytics_v2.js?v=4"),"online badges remain");
const frontend=await fs.readFile("overrides/admin_traffic_anomalies_v1.js","utf8");
assert.ok(frontend.includes("không chứng minh là bot"));
assert.ok(frontend.includes("tbAnomalyRows"));
assert.ok(frontend.includes("tbAnomalyReview"),"Admin must show review count separately");
assert.ok(frontend.includes("tbAnomalyUnflagged"),"Admin must label remaining as unflagged, not humans");
assert.ok(frontend.includes("không đồng nghĩa độc giả thật"),"Do not misrepresent human traffic");
assert.ok(!frontend.includes("automaticallyBlock"));
db0.close();
console.log("PASS anomaly audit: 5-min bursts, single-page/missing source signals, legitimate traffic control, Admin exclusion, 24h/7d, auth, non-destructive data, production Admin");
