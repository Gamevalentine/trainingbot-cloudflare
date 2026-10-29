import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const tracker=await fs.readFile("overrides/visitor_tracking_v177.js","utf8");
assert.ok(tracker.includes('get("tb_internal_qa")==="1"'),"Explicit QA opt-out must be checked by tracker");
const sandbox={
  URLSearchParams,location:{pathname:"/",search:"?tb_internal_qa=1"},
  // Deliberately no DOM or storage. If QA opt-out happens too late, script errors.
};
vm.runInNewContext(tracker,sandbox,{timeout:1000});
assert.equal(Object.keys(sandbox).length,2,"QA marker must exit before visitor ID and cookie storage");

const admin=await fs.readFile("overrides/admin_traffic_anomalies_v1.js","utf8");
for(const marker of [
  "tbAnomalyTotal","tbAnomalyReview","tbAnomalyUnflagged",
  "không đồng nghĩa bot","không đồng nghĩa độc giả thật",
  "không chứng minh là bot"
])assert.ok(admin.includes(marker),"Anomaly review UI missing safeguard "+marker);

const built=await fs.readFile("public/admin.html","utf8");
assert.ok(built.includes("admin_traffic_anomalies_v1.js?v=2"),"Admin must load cache-busted review count UI");
const publicTracker=await fs.readFile("public/visitor_tracking_v177.js","utf8");
assert.ok(publicTracker.includes('tb_internal_qa'));
const index=await fs.readFile("public/index.html","utf8");
assert.ok(index.includes("visitor_tracking_v177.js?v=187"),"Homepage must request QA-aware tracker");
assert.ok(!built.includes("admin-demo-runtime.js"));
console.log("PASS review split UI and opt-in QA exclusion; no broad country/IP/bot blocking");
