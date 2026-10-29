import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {onRequestPost as track} from "../../functions/api/visitor-events.js";
import {onRequestGet as lookup} from "../../functions/api/v72/admin/traffic-ray-audit.js";
import {normalizeRay,rayAuditEnabled} from "../../functions/_lib/traffic-ray-audit.js";
const sqlite=new DatabaseSync(":memory:");
let statements=0;
const DB={
  prepare(sql){return {sql,args:[],bind(...args){this.args=args;return this;},
    async all(){statements++;return {results:sqlite.prepare(sql).all(...this.args)};},
    async first(){statements++;return sqlite.prepare(sql).get(...this.args)||null;},
    async run(){statements++;return sqlite.prepare(sql).run(...this.args);}};},
  async batch(items){return items.map(x=>{statements++;return sqlite.prepare(x.sql).run(...x.args);});}
};
const site="https://traffic06-staging.example.test",id="test_visitor_123456",visit="test_visit_123456",ray="123456abcdef1234-SJC";
const base={DB,ADMIN_TOKEN:"qa-secret-token"};
const send=async(env,rayHeader=ray,type="page_view")=>{
  const h={"content-type":"application/json",Origin:site,"User-Agent":"Mozilla/5.0 Chrome/140 (Windows NT 10.0)"};
  if(rayHeader)h["cf-ray"]=rayHeader;
  const r=new Request(site+"/api/visitor-events",{method:"POST",headers:h,
    body:JSON.stringify({visitorId:id,sessionId:visit,type,path:"/wiki",referrer:"https://google.com"})});
  r.cf={country:"US"};
  return track({request:r,env});
};
const get=async(env,rayParam,auth=true)=>{
 const r=new Request(site+"/api/v72/admin/traffic-ray-audit?ray="+encodeURIComponent(rayParam),
   {headers:auth?{Authorization:"Bearer qa-secret-token"}:{}});
 const result=await lookup({request:r,env});
 return {status:result.status,data:await result.json()};
};
assert.equal(normalizeRay(ray),ray);
assert.equal(normalizeRay("not a ray"),"");
assert.equal((await get(base,ray,false)).status,401,"never expose Ray mapping anonymously");
assert.equal((await get(base,ray)).status,404,"opt-in flag disabled");
assert.equal((await send(base)).status,204);
let table=sqlite.prepare("SELECT name FROM sqlite_master WHERE name='tb_traffic_ingest_ray_audit_v1'").get();
assert.equal(table,undefined,"Production/default tracking must NOT create debug table");
assert.equal((await get({...base,TRAFFIC_RAY_AUDIT_ENABLED:"1"},ray)).status,404,
  "no configured staging host must stay disabled");
const staging={...base,TRAFFIC_RAY_AUDIT_ENABLED:"1",TRAFFIC_RAY_AUDIT_STAGE_HOST:"traffic06-staging.example.test"};
assert.equal(rayAuditEnabled(staging,new Request(site+"/api/visitor-events")),true);
assert.equal(rayAuditEnabled(staging,new Request("https://trainingbot.io.vn/api/visitor-events")),false,
  "even a misconfigured Production flag MUST NOT activate");
assert.equal(rayAuditEnabled({...staging,TRAFFIC_RAY_AUDIT_STAGE_HOST:"trainingbot.io.vn"},
  new Request("https://trainingbot.io.vn/api/visitor-events")),false,"production host prohibited");
assert.equal((await send(staging,"invalid-ray")).status,204);
assert.equal(sqlite.prepare("SELECT name FROM sqlite_master WHERE name='tb_traffic_ingest_ray_audit_v1'").get(),undefined,
  "untrusted Ray does not trigger D1 debug write");
assert.equal((await send(staging)).status,204);
table=sqlite.prepare("SELECT name FROM sqlite_master WHERE name='tb_traffic_ingest_ray_audit_v1'").get();
assert.ok(table);
const rows=sqlite.prepare("SELECT * FROM tb_traffic_ingest_ray_audit_v1").all();
assert.equal(rows.length,1);
assert.equal(rows[0].visitor_id,id);
assert.equal(rows[0].visit_id,visit);
assert.equal(rows[0].ray_id,ray);
assert.equal(rows[0].request_path,"/api/visitor-events");
assert.equal((await get(staging,ray)).data.match,"single");
assert.equal((await get(staging,"not-ray")).status,400);
assert.equal((await send(staging,ray,"heartbeat")).status,204);
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM tb_traffic_ingest_ray_audit_v1").get().n,1,
  "heartbeats must not inflate Ray metadata");
// A different visitor can share one Ray ID. This must not become a false precise match.
sqlite.prepare(`INSERT INTO tb_traffic_ingest_ray_audit_v1
 (ray_id,visitor_id,visit_id,created_at,request_path) VALUES(?,?,?,?,?)`)
 .run(ray,"second_visitor_12345","second_visit_12345",new Date().toISOString(),"/api/visitor-events");
assert.equal((await get(staging,ray)).data.match,"ambiguous");
// Old debug rows should be pruned, and records should never grant a bot classification.
sqlite.prepare("UPDATE tb_traffic_ingest_ray_audit_v1 SET created_at=? WHERE visitor_id=?")
  .run(new Date(Date.now()-8*86400000).toISOString(),"second_visitor_12345");
assert.equal((await get(staging,ray)).data.match,"single","lookups only return last 7 days");
const health=sqlite.prepare("SELECT COUNT(*) AS n FROM tb_visitor_visits_v2").get().n;
assert.equal(health,1,"Ray audit must not change traffic counts");
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='tb_traffic_visit_reviews_v1'").get().n,0,
  "Ray tracking must not classify visitors automatically");
assert.ok(statements<120,"opt-in debug write must have a bounded small SQL operation count");
sqlite.close();
console.log("PASS T06 staging-only: flag default off, trusted-format Ray, GET auth, 7d TTL, duplicate Ray ambiguity, no bot auto-label, no impact on visits");
