import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {DatabaseSync} from "node:sqlite";
import {classifyAttribution} from "../../functions/_lib/traffic-attribution.js";
import {onRequestPost} from "../../functions/api/visitor-events.js";
import {onRequestGet} from "../../functions/api/v72/admin/traffic-sources.js";
import {onRequestPost as enroll} from "../../functions/api/v72/admin/browser-label.js";

const site="https://trainingbot.io.vn";
const sqlite=new DatabaseSync(":memory:");
const db={
  prepare(sql){
    return {sql,args:[],
      bind(...args){this.args=args;return this;},
      async all(){return {results:sqlite.prepare(sql).all(...this.args)};},
      async first(){return sqlite.prepare(sql).get(...this.args)||null;},
      async run(){return sqlite.prepare(sql).run(...this.args);}
    };
  },
  async batch(statements){return statements.map(x=>sqlite.prepare(x.sql).run(...x.args));}
};
const env={DB:db,ADMIN_TOKEN:"synthetic_secret_token"};
const A="firstvisitor_123456",B="secondvisitor_123456",C="thirdvisitor_123456",D="fourthvisitor_123456";
async function post({id,session,path="/",country="VN",referrer="",utmSource="",utmMedium="",utmCampaign="",utmTerm="",utmContent=""}){
  const request=new Request(site+"/api/visitor-events",{
    method:"POST",headers:{"content-type":"application/json","origin":site,"User-Agent":"Mozilla/5.0 (Windows NT 10.0) Chrome/140"},
    body:JSON.stringify({visitorId:id,sessionId:session,path,referrer,type:"page_view",utmSource,utmMedium,utmCampaign,utmTerm,utmContent})
  });
  request.cf={country};
  assert.equal((await onRequestPost({request,env})).status,204);
}
async function report(params=""){
  const req=new Request(site+"/api/v72/admin/traffic-sources?"+params,{headers:{Authorization:"Bearer synthetic_secret_token"}});
  const response=await onRequestGet({request:req,env});
  assert.equal(response.status,200,"traffic API must succeed");
  return response.json();
}
assert.equal(classifyAttribution({referrer:"https://www.google.com/search?q=pubg",siteOrigin:site}).source,"google");
assert.equal(classifyAttribution({referrer:"https://m.facebook.com/post",siteOrigin:site}).source,"facebook");
assert.equal(classifyAttribution({referrer:"https://other.example/post",siteOrigin:site}).channel,"Website giới thiệu");
assert.equal(classifyAttribution({siteOrigin:site}).source,"unknown","do not assert Direct with missing evidence");
assert.equal(classifyAttribution({referrer:site+"/wiki",siteOrigin:site}).source,"unknown","internal referrer does not prove origin");
assert.equal(classifyAttribution({referrer:"https://google.com",siteOrigin:site,utmSource:"telegram",utmMedium:"social"}).source,"telegram","UTM takes precedence and is labelled unverified");

await post({id:A,session:"session_a_12345",path:"/wiki",referrer:"https://www.google.com/search?token=SECRET",country:"VN"});
await post({id:A,session:"session_a_12345",path:"/news",referrer:site+"/wiki",country:"VN"});
let first=sqlite.prepare("SELECT * FROM tb_visitor_visits_v2 WHERE visitor_id=?").get(A);
assert.equal(first.entry_path,"/wiki","landing page is immutable in visit");
assert.equal(first.source_key,"google","later page does not erase first-touch attribution");
assert.equal(first.source_evidence,"referrer");
assert.equal(first.referrer,"https://www.google.com","referrer query must never be persisted");
assert.equal(first.current_path,"/news");
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM tb_visitor_visits_v2 WHERE visitor_id=?").get(A).n,1);

await post({id:B,session:"session_b_12345",path:"/ban-cap-nhat",country:"US",
  referrer:"https://www.google.com/search?q=foo",utmSource:"telegram",utmMedium:"social",
  utmCampaign:"pubg_47",utmTerm:"test",utmContent:"beta"});
let second=sqlite.prepare("SELECT * FROM tb_visitor_visits_v2 WHERE visitor_id=?").get(B);
assert.equal(second.source_key,"telegram");
assert.equal(second.source_evidence,"utm");
assert.equal(second.utm_campaign,"pubg_47");
await post({id:C,session:"session_c_12345",path:"/",country:"US"});
let third=sqlite.prepare("SELECT * FROM tb_visitor_visits_v2 WHERE visitor_id=?").get(C);
assert.equal(third.source_key,"unknown","missing referrer must not become Direct");
await post({id:D,session:"session_d_12345",path:"/wiki",country:"NL",referrer:"https://m.facebook.com/post/1"});
assert.equal(sqlite.prepare("SELECT source_key FROM tb_visitor_visits_v2 WHERE visitor_id=?").get(D).source_key,"facebook");
let data=await report();
assert.equal(data.ready,true);
assert.equal(data.total,4);
assert.equal(data.sources.find(x=>x.source_key==="google")?.visitors,1);
assert.equal(data.sources.find(x=>x.source_key==="telegram")?.visits,1);
assert.equal(data.sources.find(x=>x.source_key==="unknown")?.visits,1);
assert.equal(data.countries.find(x=>x.country==="US")?.visits,2);
assert.equal((await report("source=google")).visits.length,1);
assert.equal((await report("source=telegram&country=US")).visits[0].utm_campaign,"pubg_47");
assert.equal((await report("source=telegram&country=NL")).visits.length,0);
assert.equal((await report("activity=single_page")).total,3,"one page views filter is descriptive, never a bot verdict");

const enrollment=new Request(site+"/api/v72/admin/browser-label",{
  method:"POST",headers:{authorization:"Bearer synthetic_secret_token",origin:site,"content-type":"application/json"},
  body:JSON.stringify({visitorId:A})
});
assert.equal((await enroll({request:enrollment,env})).status,200);
data=await report();
assert.equal(data.total,3,"Admin visit excluded from public sources");
assert.ok(!data.sources.some(x=>x.source_key==="google"));
const unauthorized=await onRequestGet({request:new Request(site+"/api/v72/admin/traffic-sources"),env});
assert.equal(unauthorized.status,401);
const invalid=await onRequestGet({request:new Request(site+"/api/v72/admin/traffic-sources?source=%27%3BDROP+TABLE"),env});
assert.equal(invalid.status,401);

// Legacy visits and original session referrer remain; no guessed UTM backfill.
sqlite.prepare("UPDATE tb_visitor_visits_v2 SET attribution_version=0 WHERE visitor_id=?").run(C);
data=await report();
assert.equal(data.legacy_visit_count,1);
assert.equal(data.total,2);
assert.ok(data.legacy_referrers.some(x=>x.referrer==="https://m.facebook.com"));

const built=await fs.readFile("public/admin.html","utf8");
assert.ok(built.includes("admin_traffic_sources_v1.js?v=2"),"production build includes sources panel");
assert.ok(built.includes("admin_browser_label_v1.js"),"Admin label retained");
assert.ok(built.includes("admin_visitor_analytics_v2.js?v=4"),"online and visitor analytics retained");
const client=await fs.readFile("public/visitor_tracking_v177.js","utf8");
assert.ok(client.includes('utmCampaign:take("utm_campaign")'));
assert.ok(!built.includes("admin-demo-runtime.js"));
sqlite.close();
console.log("PASS traffic attribution: first touch, safe referrer, UTM, no false Direct, source-country filters, Admin exclusion, legacy and Production bundle");
