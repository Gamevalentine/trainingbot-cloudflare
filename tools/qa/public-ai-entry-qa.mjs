// Zero-cost build assertion for public AI discovery. This tests only generated
// static markup and the fixed redirect; it NEVER invokes the model/Worker.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const pages=["index.html","ban-cap-nhat.html","news.html","wiki.html","community.html","contact.html"];
for(const page of pages){
 const html=fs.readFileSync(path.join("public",page),"utf8");
 const head=html.match(/<header\b[^>]*>[\s\S]*?<\/header>/i)?.[0]??"";
 assert.equal((head.match(/class="nav-link tb-ai-nav-link"/g)||[]).length,1,page+" desktop");
 assert.equal((head.match(/class="tb-ai-nav-link"/g)||[]).length,1,page+" mobile mount");
 assert.equal((html.match(/class="tb-ai-floating"/g)||[]).length,1,page+" launcher");
 assert.equal((html.match(/href="\/ai"/g)||[]).length,3,page+" links");
 assert(html.includes('visitor-ai-entry-v1.css?v=1'),page+" CSS");
 assert(html.includes('target="_blank" rel="noopener noreferrer"'),page+" isolated tab");
 assert(!/TRAININGBOT_AI_PREVIEW_BRIDGE_SECRET|__Host-tb_ai_b1/.test(html),page+" no API secrets or cookies");
}
const admin=fs.readFileSync("public/admin.html","utf8");
assert(!admin.includes("visitor-ai-entry-v1.css")&&!admin.includes('class="tb-ai-floating"'),
 "Admin must stay unchanged");
const redirect=fs.readFileSync("functions/ai.js","utf8");
assert(redirect.includes("preview-ai-identity-bridge.trainingbot-cloudflare.pages.dev/ai-preview"));
assert(redirect.includes("status:302")&&redirect.includes("no-store"));
assert(!redirect.includes("TRAININGBOT_AI_PREVIEW_BRIDGE_SECRET"));
console.log("PASS: 6 public AI entries, redirect isolated, Admin/Production secrets unchanged");
