// ADM-10: read-only release preflight. Does not access production or run deploy commands.
// A PASS here means the reviewed *source/build* is consistent, never production approval.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const read=p=>fs.readFileSync(p,"utf8");
const exists=p=>fs.existsSync(p);
const checks=[];
const check=(name,ok,detail="")=>{
 checks.push({name,result:ok?"PASS":"FAIL",detail});
 if(!ok)throw Error("ADM-10 preflight: "+name+(detail?" — "+detail:""));
};
const admin=read("public/admin.html");
const builtScripts=["admin-stage-b-ui.js","admin-stage-c-ui.js","admin-stage-d-ui.js"];
check("Generated Admin exists",admin.includes("TrainingBot Admin Center V2"));
for(const script of builtScripts){
 check("Stage script linked: "+script,admin.includes(script)&&exists("public/"+script));
}
const marker="document.open();document.write(h);document.close()";
check("Protected original loader retained",admin.includes(marker));
const parts=[...new Set([...admin.matchAll(/['"](\/admin-v2-runtime\/admin\.[^'"]+)['"]/g)].map(m=>m[1]))];
check("Expected 16 historical packed runtime parts",parts.length===16,
 "Observed "+parts.length);
check("Admin path canonical",!exists("public/admin")&&exists("public/admin.html"));
for(const p of ["public/index.html","public/news.html","public/wiki.html","public/contact.html","public/ban-cap-nhat.html","public/community.html"]){
 check("Public page retained: "+p,exists(p));
}
for(const p of ["functions/api/posts.js","functions/bai-viet/[slug].js"]){
 check("Public page only shows published posts: "+p,/status\s*=\s*['"`]published['"`]/.test(read(p)));
}
const adminPosts=read("functions/api/v71/admin/posts.js");
check("Admin posts require token",adminPosts.includes("ADMIN_TOKEN")&&adminPosts.includes("Authorization"));
check("Draft/publish API contract present",adminPosts.includes("draft")&&adminPosts.includes("published"));
check("Beta API retained",exists("functions/api/v71/admin/beta-versions.js"));
check("Contact inbox and media routes retained",["functions/api/v71/admin/contact-messages.js","functions/api/v71/admin/image-replace.js","functions/api/v71/admin/image-restore.js"].every(exists));
check("No prohibited backup job reintroduced",!exists(".github/workflows/trainingbot-d1-encrypted-backup.yml")&&!exists("scripts/backup_d1_to_github.py"));
check("Operations guide present",exists("docs/operations/trainingbot-admin-adm10-operator-guide.md"));
check("Release and rollback runbook present",exists("docs/qa/admin-stage-e-adm10-release-readiness.md"));
const proxy=read("functions/api/[[path]].js");
const previewProxyUnsafe=/trainingbot-cloud\.ai-vn\.workers\.dev/.test(proxy);
const outstanding=[
 "Preview binding isolation for D1/R2 and proxy Worker not proven",
 "Authorized test account and staging write-read flows not observed",
 "Preview review/owner approval for exact commit not recorded",
 "Production deployment and post-release monitoring not performed",
 "Backup/restore prerequisites for any data-affecting release not proven"
];
if(previewProxyUnsafe)outstanding.unshift("Generic Pages API proxy targets the existing shared Worker; do not send authenticated test writes");
const result={
 schema:"trainingbot.admin.adm10.preflight.v1",
 checkedAt:new Date().toISOString(),
 sourceBuildChecks:checks,
 checkedScope:"source and local generated build only; no external API, DB, R2 or deployed Preview requests",
 releaseDecision:"HOLD",
 productionApproved:false,
 stagingDataIsolationConfirmed:false,
 previewProxyToSharedWorker:previewProxyUnsafe,
 blockers:outstanding,
 observedProductionBehavior:"NOT_TESTED",
 safety:"No mutation / no deployment / no backup execution"
};
fs.mkdirSync("admin-qa-artifacts",{recursive:true});
fs.writeFileSync(path.join("admin-qa-artifacts","adm10-preflight.json"),JSON.stringify(result,null,2)+"\n");
console.log("ADM-10 source/build preflight PASS ("+checks.length+" checks); RELEASE GATE = HOLD");
for(const why of outstanding)console.log("HOLD: "+why);
if(process.argv.includes("--require-production-ready")){
 console.error("BLOCKED: Production authorization and staging evidence absent. Never infer readiness from CI PASS.");
 process.exitCode=2;
}
