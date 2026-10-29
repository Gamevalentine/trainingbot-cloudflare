import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {DatabaseSync} from "node:sqlite";
import {onRequestPost as track} from "../../functions/api/visitor-events.js";
import {onRequestGet as health} from "../../functions/api/v72/admin/traffic-health.js";
import {onRequestPost as review} from "../../functions/api/v72/admin/traffic-visit-review.js";
import {onRequestPost as enroll} from "../../functions/api/v72/admin/browser-label.js";

const sqlite=new DatabaseSync(":memory:");
const db={prepare(sql){return {sql,args:[],bind(...args){this.args=args;return this;},
  async all(){return {results:sqlite.prepare(sql).all(...this.args)};},
  async first(){return sqlite.prepare(sql).get(...this.args)||null;},
  async run(){return sqlite.prepare(sql).run(...this.args);}
};},async batch(items){return items.map(x=>sqlite.prepare(x.sql).run(...x.args));}};
const site="https://trainingbot.io.vn",token="health_qa_secret";
const env={DB:db,ADMIN_TOKEN:token};
const age=h=>new Date(Date.now()-h*3600000).toISOString();
const get=async(headers={Authorization:"Bearer "+token},settings=env)=>{
  const r=await health({request:new Request(site+"/api/v72/admin/traffic-health",{headers}),env:settings});
  return {status:r.status,data:await r.json()};
};
assert.equal((await get({})).status,401,"read-only health must be admin-protected");
assert.equal((await get(undefined,{ADMIN_TOKEN:token})).status,503,"missing D1 explicit");
const empty=await get();
assert.equal(empty.status,200);
assert.equal(empty.data.ready,false,"missing visits table not fake zero");

const ingest=new Request(site+"/api/visitor-events",{method:"POST",
  headers:{"content-type":"application/json",Origin:site,"User-Agent":"Mozilla/5.0 Chrome/140 (Windows NT 10.0)"},
  body:JSON.stringify({visitorId:"seed_visitor_12345",sessionId:"seed_session_12345",
    type:"page_view",path:"/wiki",referrer:"https://www.google.com"})});
ingest.cf={country:"VN"};
assert.equal((await track({request:ingest,env})).status,204);
const add=(id,h,country="US")=>{
  const visit="visit_"+id,t=age(h);
  sqlite.prepare(`INSERT INTO tb_visitor_visits_v2
    (visitor_id,visit_id,first_seen_at,last_seen_at,entry_path,current_path,country,device,os,browser,source_key,attribution_version)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,1)`).run(id,visit,t,t,"/","/",country,"Máy tính","Windows","Chrome","unknown");
  return {visitor_id:id,visit_id:visit};
};
const A=add("unknown_visitor_1",1),B=add("tested_visitor_1",2),C=add("automation_visit_1",3),
      D=add("cleared_visitor_1",4),E=add("previous_visitor_1",30),F=add("archived_visitor_1",72,"NL"),
      G=add("admin_visitor_123",1.5);
const mark=async(item,status)=>{
  const req=new Request(site+"/api/v72/admin/traffic-visit-review",{method:"POST",
    headers:{Origin:site,Authorization:"Bearer "+token,"Content-Type":"application/json"},
    body:JSON.stringify({...item,status,evidence_kind:"controlled_test_run",
      evidence_ref:"QA-TRAFFIC-05-EXACT-001",reason:"Reference to explicitly matched synthetic test visit."})});
  assert.equal((await review({request:req,env})).status,200);
};
await mark(B,"verified_test");
await mark(C,"verified_automated");
await mark(D,"cleared");
const adminReq=new Request(site+"/api/v72/admin/browser-label",{method:"POST",
  headers:{Origin:site,Authorization:"Bearer "+token,"Content-Type":"application/json"},
  body:JSON.stringify({visitorId:G.visitor_id})});
assert.equal((await enroll({request:adminReq,env})).status,200);
const before=sqlite.prepare("SELECT COUNT(*) AS n FROM tb_visitor_visits_v2").get().n;
const report=await get();
assert.equal(report.status,200,JSON.stringify(report.data));
assert.equal(report.data.ok,true);
assert.equal(report.data.ready,true);
assert.equal(report.data.db_query_success,true);
assert.equal(report.data.data_origin,"Cloudflare D1");
const x=report.data.counters;
assert.equal(x.visits_24h,5);
assert.equal(x.visits_previous_24h,1);
assert.equal(x.visits_7d,7);
assert.equal(x.anonymous_ids_24h,5);
assert.equal(x.verified_test_24h,1);
assert.equal(x.verified_automated_24h,1);
assert.equal(x.cleared_24h,1);
assert.equal(x.unresolved_24h,2);
assert.equal(x.visits_24h,x.verified_test_24h+x.verified_automated_24h+x.cleared_24h+x.unresolved_24h);
assert.equal(typeof report.data.query_duration_ms,"number");
assert.ok(report.data.last_seen_at,"recent activity detected");
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM tb_visitor_visits_v2").get().n,before,"health must never mutate raw visits");
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM tb_traffic_visit_review_audit_v1").get().n,3,"no review mutations");
const built=await fs.readFile("public/admin.html","utf8");
assert.ok(built.includes("admin_traffic_quality_v1.js?v=1"),"Admin must bundle diagnostic UI");
assert.ok(built.includes("admin_traffic_sources_v1.js?v=3"),"legacy evidence UI retained");
assert.ok(built.includes("admin_traffic_anomalies_v1.js?v=3"),"5-minute review retained");
const ui=await fs.readFile("overrides/admin_traffic_quality_v1.js","utf8");
for(const text of ["tbQualityToday","tbQualityYesterday","tbQualityUnknown","tbQualityChecks",
  "/api/v72/admin/traffic-sources","/api/v72/admin/traffic-visit-review","query_duration_ms",
  "không đồng nghĩa bot"])assert.ok(ui.includes(text),"Missing QA/false-positive requirement: "+text);
console.log("PASS TRAFFIC-05: Admin-only health, D1 read, 24h comparison, evidence categories, Admin excluded, 7d, no writes and Admin build");
sqlite.close();
