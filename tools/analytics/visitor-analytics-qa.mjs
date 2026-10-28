import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const base="overrides/";
const js=await fs.readFile(base+"visitor_tracking_v177.js","utf8");
const clock={now:Date.now()};
const shared=new Map();
const makeStorage=map=>({
  getItem:key=>map.has(key)?map.get(key):null,
  setItem:(key,value)=>map.set(key,String(value)),
  removeItem:key=>map.delete(key)
});
let counter=1;
function openTab(path="/wiki"){
  const sent=[];
  const localStorage=makeStorage(shared);
  const sessionStorage=makeStorage(new Map());
  class TestDate extends Date{static now(){return clock.now;}}
  const context={
    globalThis:null,Date:TestDate,localStorage,sessionStorage,
    crypto:{randomUUID:()=>String(counter++).padStart(32,"a").replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/,"$1-$2-$3-$4-$5")},
    location:{pathname:path,origin:"https://trainingbot.io.vn",href:"https://trainingbot.io.vn"+path},
    document:{referrer:"",visibilityState:"visible",addEventListener(){}},
    addEventListener(){},setInterval(){return 1},clearInterval(){},
    fetch:async (url,opts)=>{sent.push({url,payload:JSON.parse(opts.body)});return {ok:true};}
  };
  context.globalThis=context;
  vm.runInNewContext(js,context,{timeout:1000});
  assert.equal(sent.length,1,"every tab emits a page view");
  return sent[0].payload;
}
const one=openTab("/"),two=openTab("/wiki");
assert.equal(one.visitorId,two.visitorId,"one browser uses one anonymous client ID");
assert.equal(one.sessionId,two.sessionId,"two tabs share a 30-minute visit");
clock.now+=31*60*1000;
const three=openTab("/news");
assert.equal(three.visitorId,one.visitorId,"visitor identity persists after inactivity");
assert.notEqual(three.sessionId,one.sessionId,"new visit after 30 inactive minutes");

async function loadModule(path){
  const source=await fs.readFile(path,"utf8");
  return import("data:text/javascript;charset=utf-8,"+encodeURIComponent(source));
}
const ingest=await loadModule("functions/api/visitor-events.js");
const batches=[];
const db={
  batch:async statements=>{batches.push(statements);return [];},
  prepare(sql){
    const value={sql,params:[],bind(...params){this.params=params;return this;},
      async all(){
        if(sql.startsWith("PRAGMA"))return {results:["city","region","country"].map(name=>({name}))};
        return {results:[]};
      },
      async first(){return null;},
      async run(){return {success:true};}
    };
    return value;
  }
};
const post=new Request("https://trainingbot.io.vn/api/visitor-events",{
  method:"POST",headers:{"content-type":"application/json","origin":"https://trainingbot.io.vn","User-Agent":"Mozilla/5.0 (Windows NT 10.0) Chrome/125"},
  body:JSON.stringify({visitorId:one.visitorId,sessionId:one.sessionId,path:"/",type:"page_view"})
});
const p=await ingest.onRequestPost({request:post,env:{DB:db}});
assert.equal(p.status,204);
assert.ok(batches[0].some(x=>x.sql.includes("CREATE TABLE IF NOT EXISTS tb_visitor_visits_v2")));
assert.ok(batches[1].some(x=>x.sql.includes("INSERT INTO tb_visitor_visits_v2")));
const blocked=await ingest.onRequestPost({request:new Request("https://trainingbot.io.vn/api/visitor-events",{
  method:"POST",headers:{"Origin":"https://attacker.invalid"},
  body:JSON.stringify({visitorId:one.visitorId,sessionId:one.sessionId})
}),env:{DB:db}});
assert.equal(blocked.status,204);
assert.equal(batches.length,2,"cross-origin request ignored");

const analytics=await loadModule("functions/api/v72/admin/visitor-summary.js");
const summaryDb={
  prepare(sql){
    return {sql,bind(){return this;},
      async all(){
        if(sql.includes("sqlite_master"))return {results:[{name:"tb_visitor_visits_v2"}]};
        if(sql.includes("SELECT * FROM profiles"))return {results:[{
          visitor_id:one.visitorId,visitor_type:"returning",visit_count:2,
          country:"VN",device:"Máy tính",os:"Windows",page_views:4,
          last_seen_at:new Date(clock.now).toISOString(),first_seen_at:new Date(clock.now-6000000).toISOString()
        }]};
        if(sql.includes("COUNT(*) AS total FROM ranked"))return {results:[{country:"VN",total:1}]};
        if(sql.includes("SELECT device,COUNT(*) AS total"))return {results:[{device:"Máy tính",total:1}]};
        return {results:[]};
      },
      async first(){
        if(sql.includes("FROM profiles"))return {total:1,new_visitors:0,returning_visitors:1,unknown_visitors:0};
        return {total_visitors:1,today_new:0,today_active:1,online_visitors:1};
      }
    };
  }
};
const path="https://trainingbot.io.vn/api/v72/admin/visitor-summary?audience=returning&country=VN&page=1";
const notAuthorized=await analytics.onRequestGet({request:new Request(path),env:{DB:summaryDb,ADMIN_TOKEN:"test-key"}});
assert.equal(notAuthorized.status,401);
const authorized=await analytics.onRequestGet({request:new Request(path,{headers:{Authorization:"Bearer test-key"}}),env:{DB:summaryDb,ADMIN_TOKEN:"test-key"}});
assert.equal(authorized.status,200);
const data=await authorized.json();
assert.equal(data.visitors.length,1);
assert.equal(data.visitors[0].visitor_type,"returning");
assert.equal(data.summary.total_visitors,1);
assert.equal(data.has_more,false);

const built=await fs.readFile("public/admin.html","utf8");
assert.ok(built.includes("admin_visitor_analytics_v2.js"),"analytics must be in genuine Admin loader");
assert.ok(!built.includes("admin-demo-runtime.js"),"no demo runtime in production build");
console.log("PASS visitor analytics: shared tabs, 30-minute reset, D1 v2 writes, cross-origin block, admin auth, filter payload, Admin build");
