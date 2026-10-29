import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {DatabaseSync} from "node:sqlite";
import {onRequestPost as track} from "../../functions/api/visitor-events.js";
import {onRequestGet as anomalyReport} from "../../functions/api/v72/admin/traffic-anomalies.js";
import {onRequestGet as sourceReport} from "../../functions/api/v72/admin/traffic-sources.js";
import {onRequestGet as reviewList,onRequestPost as reviewPost} from "../../functions/api/v72/admin/traffic-visit-review.js";

const site="https://trainingbot.io.vn",token="qa-admin-token";
const sqlite=new DatabaseSync(":memory:");
const db={
  prepare(sql){return {sql,args:[],
    bind(...args){this.args=args;return this;},
    async all(){return {results:sqlite.prepare(sql).all(...this.args)};},
    async first(){return sqlite.prepare(sql).get(...this.args)||null;},
    async run(){return sqlite.prepare(sql).run(...this.args);}
  };},
  async batch(queries){return queries.map(q=>sqlite.prepare(q.sql).run(...q.args));}
};
const env={DB:db,ADMIN_TOKEN:token};
const make=(path,body,auth=true,origin=site)=>new Request(site+path,{method:"POST",
  headers:{"Content-Type":"application/json",Origin:origin,...(auth?{Authorization:"Bearer "+token}:{})},
  body:JSON.stringify(body)
});
const read=async(method,path)=>{const response=await method({request:new Request(site+path,{headers:{Authorization:"Bearer "+token}}),env});
  assert.equal(response.status,200);return response.json();};
const ingested=new Request(site+"/api/visitor-events",{method:"POST",
  headers:{"content-type":"application/json",origin:site,"User-Agent":"Mozilla/5.0 (Windows NT 10.0) Chrome/140"},
  body:JSON.stringify({visitorId:"normal_visitor_12345",sessionId:"normal_visit_12345",path:"/wiki",
    referrer:"https://www.google.com/search",type:"page_view"})});
ingested.cf={country:"VN"};
assert.equal((await track({request:ingested,env})).status,204);

const ids=Array.from({length:5},(_,i)=>({visitor_id:"review_visitor_"+i,visit_id:"review_visit_"+i}));
const now=new Date().toISOString();
for(const item of ids){
 sqlite.prepare(`INSERT INTO tb_visitor_visits_v2
  (visitor_id,visit_id,first_seen_at,last_seen_at,entry_path,current_path,country,device,os,browser,
    source_key,source_label,source_channel,source_evidence,attribution_version)
  VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`)
  .run(item.visitor_id,item.visit_id,now,now,"/","/","US","Máy tính","Windows","Chrome",
    "unknown","Không rõ nguồn","Không rõ nguồn","none");
}
const rawCount=sqlite.prepare("SELECT COUNT(*) AS n FROM tb_visitor_visits_v2").get().n;
let result=await read(anomalyReport,"/api/v72/admin/traffic-anomalies?days=1");
assert.equal(result.review_summary.total_visits,6);
assert.equal(result.review_summary.review_visits,5);
assert.equal(result.review_summary.unflagged_visits,1);
assert.equal(result.review_summary.verified_automated_visits,0);
const note="Đã đối chiếu mốc giờ và request ID chính xác với bản ghi lượt ghé này.";
const evidence={evidence_kind:"controlled_test_run",evidence_ref:"QA-RUN-20261029-EXACT-001",reason:note};
const reviewBody=(item,status)=>({...item,status,...evidence});
assert.equal((await reviewPost({request:make("/api/v72/admin/traffic-visit-review",reviewBody(ids[0],"verified_automated"),false),env})).status,401);
assert.equal((await reviewPost({request:make("/api/v72/admin/traffic-visit-review",reviewBody(ids[0],"verified_automated"),true,"https://attacker.example"),env})).status,403);
assert.equal((await reviewPost({request:make("/api/v72/admin/traffic-visit-review",{...reviewBody(ids[0],"verified_automated"),evidence_ref:"x"}),env})).status,400);
assert.equal((await reviewPost({request:make("/api/v72/admin/traffic-visit-review",{...reviewBody(ids[0],"unknown_status")}),env})).status,400);
assert.equal((await reviewPost({request:make("/api/v72/admin/traffic-visit-review",{...reviewBody(ids[0],"verified_test"),visit_id:"nonexistent_visit_123"}),env})).status,404);
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='tb_traffic_visit_reviews_v1'").get().n,0,
  "unverified or invalid request must not mutate D1");
for(const [i,status] of [[0,"verified_automated"],[1,"verified_test"],[2,"cleared"]]){
 const r=await reviewPost({request:make("/api/v72/admin/traffic-visit-review",reviewBody(ids[i],status)),env});
 assert.equal(r.status,200,await r.text().catch(()=>"" ));
}
result=await read(anomalyReport,"/api/v72/admin/traffic-anomalies?days=1");
const summary=result.review_summary;
assert.equal(summary.total_visits,6);
assert.equal(summary.review_visits,2,"only two unresolved flagged visits remain");
assert.equal(summary.verified_automated_visits,1);
assert.equal(summary.verified_test_visits,1);
assert.equal(summary.cleared_visits,1);
assert.equal(summary.unflagged_visits,1,"unflagged is not verified human");
for(const type of ["verified_automated","verified_test","cleared","needs_review"]){
 const filtered=await read(anomalyReport,"/api/v72/admin/traffic-anomalies?days=1&review_filter="+type);
 assert.equal(filtered.groups.length,1,"evidence group shown with selected status: "+type);
}
const sources=await read(sourceReport,"/api/v72/admin/traffic-sources?country=US");
assert.equal(sources.total,5);
assert.equal(sources.visits.filter(x=>x.review_status==="verified_automated").length,1);
assert.equal(sources.visits.filter(x=>x.review_status==="verified_test").length,1);
assert.equal(sources.visits.filter(x=>x.review_status==="cleared").length,1);
const reviewed=await read(reviewList,"/api/v72/admin/traffic-visit-review");
assert.equal(reviewed.reviews.length,3);
const updated=await reviewPost({request:make("/api/v72/admin/traffic-visit-review",reviewBody(ids[0],"unresolved")),env});
assert.equal(updated.status,200);
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM tb_traffic_visit_review_audit_v1").get().n,4,
  "audit log retains prior classification despite re-review");
assert.equal(sqlite.prepare("SELECT status FROM tb_traffic_visit_reviews_v1 WHERE visit_id=?").get(ids[0].visit_id).status,"unresolved");
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM tb_visitor_visits_v2").get().n,rawCount,"raw visit count unchanged");
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM tb_visitor_events_v1").get().n,1,"original events remain");

// Historical V2 attribution_version=0 visits MUST remain inspectable in the Admin UI.
sqlite.prepare("UPDATE tb_visitor_visits_v2 SET attribution_version=0 WHERE visit_id=?").run(ids[4].visit_id);
let historic=await read(sourceReport,"/api/v72/admin/traffic-sources?country=US");
assert.ok(historic.legacy_review_candidates.some(x=>x.visit_id===ids[4].visit_id),
  "old V2 visit with no UTM must be available for exact evidence matching");
assert.equal(historic.legacy_review_candidates.find(x=>x.visit_id===ids[4].visit_id).review_status,"unresolved");
const savedHistoric=await reviewPost({
  request:make("/api/v72/admin/traffic-visit-review",reviewBody(ids[4],"verified_test")),env
});
assert.equal(savedHistoric.status,200);
historic=await read(sourceReport,"/api/v72/admin/traffic-sources");
assert.equal(historic.legacy_review_candidates.find(x=>x.visit_id===ids[4].visit_id).review_status,"verified_test",
  "legacy V2 status reflects the exact visit review");
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM tb_traffic_visit_review_audit_v1").get().n,5);
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM tb_visitor_visits_v2").get().n,rawCount);
const built=await fs.readFile("public/admin.html","utf8");
assert.ok(built.includes("admin_traffic_anomalies_v1.js?v=3"));
assert.ok(built.includes("admin_traffic_sources_v1.js?v=3"));
assert.ok(built.includes("admin_browser_label_v1.js"),"existing Admin label preserved");
const reviewUI=await fs.readFile("overrides/admin_traffic_sources_v1.js","utf8");
assert.ok(reviewUI.includes("evidence_ref")&&reviewUI.includes("tb-traffic-mark"));
console.log("PASS TRAFFIC-04: D1 exact-visit evidence, auth/Origin checks, audit, aggregate review split, verified filters, raw traffic preserved, production Admin modules");
sqlite.close();
