import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {DatabaseSync} from "node:sqlite";

async function moduleFrom(path){
  const text=await fs.readFile(path,"utf8");
  return import("data:text/javascript;charset=utf-8,"+encodeURIComponent(text));
}
const ing=await moduleFrom("functions/api/visitor-events.js");
const adm=await moduleFrom("functions/api/v72/admin/visitor-summary.js");
const sql=new DatabaseSync(":memory:");
const queries=[];
const db={
  prepare(statement){
    const params=[];
    return {sql:statement,params,
      bind(...values){this.params=values;return this;},
      async all(){queries.push(statement);return {results:sql.prepare(statement).all(...this.params)};},
      async first(){queries.push(statement);return sql.prepare(statement).get(...this.params)||null;},
      async run(){queries.push(statement);sql.prepare(statement).run(...this.params);return {success:true};}
    };
  },
  async batch(statements){
    for(const x of statements){queries.push(x.sql);sql.prepare(x.sql).run(...(x.params||[]));}
    return statements.map(()=>({success:true}));
  }
};
const visitor="visitor_12345678";
let index=0;
async function post(sessionId,path="/",country="VN"){
  const request=new Request("https://trainingbot.io.vn/api/visitor-events",{
    method:"POST",headers:{"content-type":"application/json","origin":"https://trainingbot.io.vn","User-Agent":"Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/140"},
    body:JSON.stringify({visitorId:visitor,sessionId,type:"page_view",path,referrer:""})
  });
  request.cf={country};
  const response=await ing.onRequestPost({request,env:{DB:db}});
  assert.equal(response.status,204);
  index++;
}
async function api(audience="all",country="ALL"){
  const request=new Request("https://trainingbot.io.vn/api/v72/admin/visitor-summary?audience="+audience+"&country="+country+"&page=1&limit=50",{
    headers:{Authorization:"Bearer topsecret"}});
  const response=await adm.onRequestGet({request,env:{DB:db,ADMIN_TOKEN:"topsecret"}});
  assert.equal(response.status,200,"analytics API should succeed in SQLite test");
  return response.json();
}
await post("session_12345678","/");
await post("session_abcdefgh","/wiki");
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM tb_visitor_sessions_v1").get().n,2,"two tabs are still captured in legacy history");
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM tb_visitor_visits_v2").get().n,1,"server combines two tab requests into one visit");
let data=await api("new");
assert.equal(data.visitors.length,1,"one visitor, not two devices");
assert.equal(data.visitors[0].visit_count,1);
assert.equal(data.visitors[0].visitor_type,"new");
assert.equal(data.countries.find(x=>x.country==="VN")?.total,1);
assert.equal(data.devices.find(x=>x.device==="Máy tính")?.total,1);
assert.equal(data.visitors[0].page_views,2,"page views include both tabs");

// Simulate 31 minutes of genuine inactivity before another session ID arrives.
sql.prepare("UPDATE tb_visitor_visits_v2 SET last_seen_at=datetime('now','-31 minutes')").run();
sql.prepare("UPDATE tb_visitor_sessions_v1 SET first_seen_at=datetime('now','-31 minutes'),last_seen_at=datetime('now','-31 minutes')").run();
await post("session_87654321","/news");
assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM tb_visitor_visits_v2").get().n,2,"new visit created after inactivity");
data=await api("returning","VN");
assert.equal(data.visitors.length,1);
assert.equal(data.visitors[0].visitor_type,"returning");
assert.equal(data.visitors[0].visit_count,2);
assert.equal(data.visitors[0].page_views,3);
assert.equal(data.summary.total_visitors,1);

// Historic v1-only records are retained, not guessed to have made multiple visits.
sql.prepare(`INSERT INTO tb_visitor_sessions_v1
(session_id,visitor_id,first_seen_at,last_seen_at,entry_path,current_path,referrer,device,os,browser,gender,city,region,country)
VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run("old_session_123","historic_user_123",new Date(Date.now()-86400000).toISOString(),new Date(Date.now()-86400000).toISOString(),"/","/wiki","","iPhone","iOS","Safari","unknown","","","US");
data=await api("unknown");
assert.equal(data.visitors.length,1);
assert.equal(data.visitors[0].visit_count,0);
assert.equal(data.visitors[0].visitor_type,"unknown");
assert.equal(data.summary.total_visitors,2);
assert.equal(data.countries.find(x=>x.country==="US")?.total,1);
assert.equal((await api("returning","US")).visitors.length,0,"country filter works");

const unauthorized=await adm.onRequestGet({request:new Request("https://trainingbot.io.vn/api/v72/admin/visitor-summary"),env:{DB:db,ADMIN_TOKEN:"topsecret"}});
assert.equal(unauthorized.status,401);
sql.close();
console.log("PASS real SQLite: 2-tab coalescing, new visit at 31m, unique device/country, filter, old data, privacy and auth");
