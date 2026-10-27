import assert from "node:assert/strict";
import fs from "node:fs";
const src=fs.readFileSync("functions/_middleware.js","utf8");
const {onRequest}=await import("data:text/javascript;base64,"+Buffer.from(src).toString("base64"));
const preview="https://aion-trainingbot-public-p0-2.trainingbot-cloudflare.pages.dev";
let count=0, dbTouches=0, legacyFetches=0;
const env={
 DB:new Proxy({}, {get(){dbTouches++;throw Error("D1 touched unexpectedly")}}),
 VIDEO_BUCKET:new Proxy({}, {get(){dbTouches++;throw Error("R2 touched unexpectedly")}}),
 ADMIN_TOKEN:"preview-only-no-prod-token"
};
const original=globalThis.fetch;
try{
 globalThis.fetch=async url=>{
  const u=new URL(url);
  assert.equal(u.origin,"https://trainingbot.io.vn");
  legacyFetches++;
  return new Response('{"ok":true,"posts":[],"versions":[]}',{headers:{"content-type":"application/json"}});
 };
 async function request(path,method="GET",host=preview){
  return onRequest({request:new Request(host+path,{method}),env,next:async()=>{count++;return new Response("PASS THROUGH",{status:299});}});
 }
 for(const [path,method] of [
  ["/api/contact","POST"],
  ["/api/visitor-events","POST"],
  ["/api/v40/admin/page-content","POST"],
  ["/api/v49/admin/users","PATCH"],
  ["/api/v71/admin/posts","DELETE"],
  ["/api/team-finder","POST"],
  ["/api/v34/contact","POST"],
  ["/api/legacy-route","POST"],
  ["/admin.html","POST"],
  ["/contact","POST"],
  ["/api/v71/admin/posts","GET"],
  ["/api/v34/contact","GET"],
  ["/api/legacy-route","GET"],
  ["/api/visitor-events","GET"],
  ["/api/other","HEAD"]
 ]){
  const response=await request(path,method);
  assert.equal(response.status,403,method+" "+path);
  assert.equal((await response.json()).ok,false);
 }
 assert.equal(dbTouches,0);
 assert.equal(count,0);
 assert.equal(legacyFetches,0);
 for(const path of ["/api/beta-versions","/api/posts?limit=3","/api/flash-download-counts","/api/team-finder?rank=Crown"]){
  const response=await request(path);
  assert.equal(response.status,200);
 }
 assert.equal(legacyFetches,4);
 assert.equal(dbTouches,0);
 const download=await request("/download/beta/V4.7.3");
 assert.equal(download.status,307);
 assert.equal(download.headers.get("location"),"https://trainingbot.io.vn/download/beta/V4.7.3");
 assert.equal(dbTouches,0);
 const p=await request("/api/visitor-events","POST","https://trainingbot.io.vn");
 assert.equal(p.status,299,"Production should not be affected by preview-only lock");
 assert.equal(count,1);
 console.log("P3.1 preview writes/admin/legacy rejected, allowed public reads, production untouched: PASS");
}finally{globalThis.fetch=original;}
