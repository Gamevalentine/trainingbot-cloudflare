// TrainingBot Wiki V2 I.1–I.5 — release audit; no deployment or writes.
// Test may pass while the release decision is NO-GO: that is intentional.
import assert from "node:assert/strict";
import fs from "node:fs";
const read=f=>fs.readFileSync(f,"utf8");
const json=f=>JSON.parse(read(f));
const paths=["public/index.html","public/wiki.html","public/admin.html","public/wiki-stage-c-evidence.json","public/wiki-stage-d-evidence.json","public/wiki-stage-f-guides.json","functions/_middleware.js"];
paths.forEach(p=>assert(fs.existsSync(p),"Missing release file "+p));
const html=read("public/wiki.html"),admin=read("public/admin.html"),middleware=read("functions/_middleware.js");
const c=json("public/wiki-stage-c-evidence.json"),d=json("public/wiki-stage-d-evidence.json"),f=json("public/wiki-stage-f-guides.json");
const stages=["wiki-stage-b-v2.js","wiki-stage-c-weapon.js","wiki-stage-d-v2.js","wiki-stage-e-compare.js","wiki-stage-f-guides.js","wiki-stage-g-snapshot.js","wiki-stage-h-perf.js"];
for(const s of stages){assert(html.includes(s),"Missing Wiki stage "+s);assert(fs.existsSync("public/"+s),"Missing output "+s)}
assert(admin.includes("admin-wiki-stage-g.js"),"G review Admin not present in I Preview");
assert(html.includes('href="https://trainingbot.io.vn/wiki"'),"Canonical must be production URL");
assert.equal(c.schemaVersion,"wiki-c1");assert.equal(d.schemaVersion,"wiki-d1");assert.equal(f.schemaVersion,"wiki-f1");
assert.equal(d.coverage.attachments.total,51);
assert.equal(d.coverage.vehicles.total,26);
assert.equal(d.coverage.maps.total,8);
assert.equal(f.guides.length,16);
assert(middleware.includes('x-robots-tag')&&middleware.includes("PUBLIC_READ_PATHS"),"Preview read-only policy missing");
const guideIds=new Set(f.guides.map(g=>g.id));assert.equal(guideIds.size,f.guides.length);
for(const g of f.guides)assert(g.contentType==="editorial_training","Guide not labelled editorial: "+g.id);
// Explicitly detect release blockers from actual evidence instead of guessing.
const blockers=[];
function block(id,reason,proof,owner){
 blockers.push({id,severity:"release-blocker",reason,proof,owner});
}
if(d.coverage.attachments.verifiedCompatibility<d.coverage.attachments.total)
 block("DATA-ATTACHMENT","Full compatibility by game version is not source-verified",
 "wiki-stage-d-evidence.json: "+d.coverage.attachments.verifiedCompatibility+"/"+d.coverage.attachments.total+" compatibility records verified","Content/verification");
if(d.coverage.attachments.verifiedImageRights<d.coverage.attachments.total)
 block("RIGHTS-IMAGES","Image usage rights have not been verified for the catalog",
 "wiki-stage-d-evidence.json: "+d.coverage.attachments.verifiedImageRights+"/"+d.coverage.attachments.total+" attachment image rights verified","Legal/content");
if(d.coverage.vehicles.verifiedSpecificationsAll<d.coverage.vehicles.total)
 block("DATA-VEHICLES","Vehicles have incomplete authoritative specifications and naming checks",
 "wiki-stage-d-evidence.json: "+d.coverage.vehicles.verifiedSpecificationsAll+"/"+d.coverage.vehicles.total+" fully verified","Content/verification");
if(Object.keys(c.weapons).length<61)
 block("DATA-WEAPONS","Current-release independent evidence is not available for all 61 weapons",
 "wiki-stage-c-evidence.json: "+Object.keys(c.weapons).length+" historically referenced entries","Content/verification");
// This implementation has a browser-only review workbench; do not pretend it is production CMS.
if(admin.includes("admin-wiki-stage-g.js"))
 block("SECURITY-CMS","Wiki CMS server-side write authorization, durable revision trail and rollback remain unimplemented",
 "admin-wiki-stage-g.js: local-only review and JSON export; no approved server write contract","Backend/security");
block("OPS-BACKUP","No verified production D1/R2 snapshot and restore drill recorded for this release","No production backup artifact or successful restore test supplied","Operations");
block("QA-LIVE","Production-like Preview acceptance on physical mobile/desktop and authenticated Admin not recorded","Existing E-H CI uses local Chromium and mock credentials","QA");
block("GSC-INDEX","Google Search Console URL Inspection and page indexing state not yet verified","Search Console screenshot shows click drop; connected GSC API unavailable","SEO");
const decision={schemaVersion:"wiki-i1",generatedAt:new Date().toISOString(),stage:"I",releaseDecision:blockers.length?"NO-GO":"GO",
 verified:{stageFiles:stages.length,sourceSchemas:[c.schemaVersion,d.schemaVersion,f.schemaVersion],guides:f.guides.length,
  mapCount:d.coverage.maps.total,vehicleCount:d.coverage.vehicles.total,attachmentCount:d.coverage.attachments.total,
  previewReadOnlyPolicy:true,mainProductionUnaffected:true},
 branches:{base:"aion-trainingbot-wiki-stage-h-20261029",releaseTarget:"main",
  chain:[21,22,23,24,25,27,28,29].map((number,i)=>({number,stage:"ABCDEFGH"[i]}))},
 blockers,disclaimer:"NO-GO is not a test failure. Never merge or release until blockers are resolved and owner authorizes a separate production operation."};
fs.mkdirSync("wiki-stage-i-artifacts",{recursive:true});
fs.writeFileSync("wiki-stage-i-artifacts/release-gate.json",JSON.stringify(decision,null,2));
assert.equal(decision.releaseDecision,"NO-GO","Unexpected GO; require a fresh independent security and content acceptance before release");
console.log("WIKI I.1-I.5 PASS: audited staged release files, read-only Preview; Release decision NO-GO with "+blockers.length+" blockers");
