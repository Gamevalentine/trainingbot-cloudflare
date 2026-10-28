import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {onRequest} from "../../functions/_middleware.js";
import {onRequestGet} from "../../functions/api/ai-preview/status.js";
const url="https://ai-identity-preview.trainingbot-cloudflare.pages.dev";
let nextCalls=0;
const run=async(path,method="GET")=>onRequest({
  request:new Request(url+path,{method}),
  env:{},
  next:async()=>{nextCalls++;return new Response("next",{status:209});}
});
const ok=await run("/api/ai-preview/status");
assert.equal(ok.status,209);assert.equal(nextCalls,1,"Status GET must reach its Preview function");
for(const [path,method] of [["/api/ai-preview/chat","POST"],["/api/admin/users","GET"],["/api/ai-preview/status","POST"]]){
 const denied=await run(path,method);assert.equal(denied.status,403,"Preview must block "+method+" "+path);
}
const live=await onRequestGet({request:new Request(url+"/api/ai-preview/status")});
assert.equal(live.status,200);
const status=await live.json();
assert.equal(status.ready,false);assert.equal(status.identityVerified,false);
assert.deepEqual(status.surfaces,{visitor:false,admin:false});
assert.equal((await onRequestGet({request:new Request("https://trainingbot.io.vn/api/ai-preview/status")})).status,404);
for(const file of ["overrides/ai-preview.html","overrides/ai-admin-preview.html"]){
 const html=readFileSync(file,"utf8");assert.match(html,/noindex,nofollow/);
 assert.match(html,/ai-preview.js/);assert.match(html,/id="chat-form"/);
 assert.match(html,/textarea[^>]+disabled/);
}
const js=readFileSync("overrides/ai-preview.js","utf8");
assert.doesNotMatch(js,/localStorage|sessionStorage|innerHTML|trainingbot-ai-staging\.ai-vn\.workers\.dev/);
assert.match(js,/status\?\.identityVerified === true/);
assert.match(js,/status\?\.surfaces\?\.\[surface\] === true/);
console.log("Preview identity/chat isolation PASS: disabled until verified per-person server auth; Production untouched.");
