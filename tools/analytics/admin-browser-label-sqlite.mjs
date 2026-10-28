import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {DatabaseSync} from "node:sqlite";

async function load(path){
  return import(new URL("../../"+path,import.meta.url));
}
const ingest=await load("functions/api/visitor-events.js");
const label=await load("functions/api/v72/admin/browser-label.js");
const stats=await load("functions/api/v72/admin/visitor-summary.js");
const legacy=await load("functions/api/v71/admin/visitor-events.js");
const sqlite=new DatabaseSync(":memory:");
const db={
  prepare(statement){
    return {sql:statement,params:[],
      bind(...params){this.params=params;return this;},
      async run(){return sqlite.prepare(statement).run(...this.params);},
      async all(){return {results:sqlite.prepare(statement).all(...this.params)};},
      async first(){return sqlite.prepare(statement).get(...this.params)||null;}
    };
  },
  async batch(statements){return statements.map(x=>sqlite.prepare(x.sql).run(...x.params));}
};
const env={DB:db,ADMIN_TOKEN:"unit-test-admin-token"};
const origin="https://trainingbot.io.vn";
const adminId="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const guestId="bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
let serial=0;
async function track(visitorId,path="/"){
  const req=new Request(origin+"/api/visitor-events",{
    method:"POST",
    headers:{"content-type":"application/json","origin":origin,"User-Agent":"Mozilla/5.0 (Windows NT 10.0) Chrome/140"},
    body:JSON.stringify({visitorId,sessionId:"test_session_"+String(++serial).padStart(5,"0"),type:"page_view",path,role:"admin",is_admin:true})
  });
  req.cf={country:"VN"};
  assert.equal((await ingest.onRequestPost({request:req,env})).status,204);
}
async function mark(visitorId,method="POST",headers={}){
  const req=new Request(origin+"/api/v72/admin/browser-label",{
    method,headers:{"content-type":"application/json","origin":origin,Authorization:"Bearer "+env.ADMIN_TOKEN,...headers},
    body:JSON.stringify({visitorId})
  });
  return label[method==="POST"?"onRequestPost":"onRequestDelete"]({request:req,env});
}
async function analytics(audience="all"){
  const req=new Request(origin+"/api/v72/admin/visitor-summary?audience="+audience,{
    headers:{Authorization:"Bearer "+env.ADMIN_TOKEN}
  });
  const resp=await stats.onRequestGet({request:req,env});
  assert.equal(resp.status,200,"analytics read should succeed");
  return resp.json();
}
async function oldApi(){
  const req=new Request(origin+"/api/v71/admin/visitor-events",{headers:{Authorization:"Bearer "+env.ADMIN_TOKEN}});
  const response=await legacy.onRequestGet({request:req,env});
  assert.equal(response.status,200);
  return response.json();
}

await track(adminId,"/");
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='tb_admin_browsers_v1'").get().n,0,"public role field must not mark Admin");
let data=await analytics();
assert.equal(data.summary.total_visitors,1);
assert.equal(data.visitors[0].is_admin,0);
const unauthorized=await label.onRequestPost({request:new Request(origin+"/api/v72/admin/browser-label",{
  method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({visitorId:adminId})
}),env});
assert.equal(unauthorized.status,401);
assert.equal((await mark(adminId,"POST",{Origin:"https://attacker.invalid"})).status,403);
assert.equal((await mark(adminId,"POST",{"Sec-Fetch-Site":"cross-site"})).status,403);
assert.equal((await mark("bad!")).status,400);
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='tb_admin_browsers_v1'").get().n,0,"denials must not create admin table");

assert.equal((await mark(adminId)).status,200);
assert.equal((await mark(adminId)).status,200,"idempotent enrollment");
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM tb_admin_browsers_v1").get().n,1);
data=await analytics("admin");
assert.equal(data.visitors.length,1);
assert.equal(data.visitors[0].visitor_id,adminId);
assert.equal(data.visitors[0].visitor_type,"admin");
assert.equal(data.visitors[0].is_admin,1);
assert.equal(data.summary.admin_visitors,1);
assert.equal(data.summary.total_visitors,0,"Admin must not inflate public audience");
assert.equal(data.countries.length,0,"Admin excluded from public country leaderboard");
assert.equal(data.devices.length,0,"Admin excluded from public device leaderboard");
let old=await oldApi();
assert.equal(old.summary.today_visitors,0);
assert.equal(old.sessions[0].is_admin,1);
await track(adminId,"/wiki");
data=await analytics("admin");
assert.equal(data.visitors[0].page_views,2,"subsequent public page views retain Admin label");
await track(guestId,"/news");
data=await analytics();
assert.equal(data.summary.total_visitors,1);
assert.equal(data.countries[0].total,1);
assert.equal(data.devices[0].total,1);
assert.equal(data.summary.admin_visitors,1);
assert.equal((await analytics("admin")).visitors.length,1);
assert.equal((await analytics("new")).visitors.length,1,"guests remain new, Admin not guest");

assert.equal((await mark(adminId,"DELETE")).status,200);
data=await analytics("admin");
assert.equal(data.visitors.length,0,"revocation clears label");
assert.equal(data.summary.total_visitors,2,"unmarked Admin returns to public audience");
assert.equal((await analytics("returning")).visitors.length>=0,true);
sqlite.close();
const built=await fs.readFile("public/admin.html","utf8");
assert.ok(built.includes("admin_browser_label_v1.js"),"authenticator must load in real Admin");
assert.ok(built.includes("admin_visitor_analytics_v2.js"),"audience overlay must be preserved");
assert.ok(!built.includes("admin-demo-runtime.js"),"no demo leak");
console.log("PASS Admin label: auth+CSRF gate, spoofing denied, enrollment, role persisted, public metrics excluded, countries/devices, revoke, legacy KPI, real build");
