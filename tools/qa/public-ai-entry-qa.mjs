// Offline generated-site acceptance gate. No AI/model or external requests.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const pages=["index.html","ban-cap-nhat.html","news.html","wiki.html","community.html","contact.html"];
for(const page of pages){
 const html=fs.readFileSync(path.join("public",page),"utf8");
 const head=html.match(/<header\b[^>]*>[\s\S]*?<\/header>/i)?.[0]??"";
 assert.equal((head.match(/class="nav-link tb-ai-nav-link"/g)||[]).length,1,page+" desktop");
 assert.equal((head.match(/class="tb-ai-nav-link"/g)||[]).length,1,page+" mobile");
 assert.equal((html.match(/class="tb-ai-widget-launch"/g)||[]).length,1,page+" floating robot");
 assert(html.includes('<button type="button" class="tb-ai-widget-launch"'),page+" native robot button");
 assert.equal((html.match(/data-tb-ai-toggle/g)||[]).length,3,page+" launch controls");
 assert.equal((html.match(/id="tb-ai-popup"/g)||[]).length,1,page+" dialog");
 assert.equal((html.match(/href="\/ai"/g)||[]).length,3,page+" menu and full-screen fallback links");
 assert(html.includes('visitor-ai-widget-v2.css?v=2'),page+" CSS");
 assert(html.includes('visitor-ai-widget-v2.js?v=4'),page+" client JS");
 assert(html.includes('tb-ai-frame-mount'),page+" iframe mount");
 assert(!html.includes('src="https://preview-ai-identity-bridge'),page+" lazy iframe only");
 assert(!/TRAININGBOT_AI_PREVIEW_BRIDGE_SECRET|__Host-tb_ai_b1/.test(html),page+" no API secrets/cookies");
}
const admin=fs.readFileSync("public/admin.html","utf8");
assert(!admin.includes("visitor-ai-widget-v2.css")&&!admin.includes('class="tb-ai-widget-launch"'),
 "Admin must stay unchanged");
const fallback=fs.readFileSync("functions/ai.js","utf8");
assert(fallback.includes("preview-ai-identity-bridge.trainingbot-cloudflare.pages.dev/ai-preview"));
assert(fallback.includes("status:302")&&fallback.includes("no-store"));
const widgetJS=fs.readFileSync("public/visitor-ai-widget-v2.js","utf8");
assert(widgetJS.includes("/ai-widget"));
assert(widgetJS.includes('event.origin!==ORIGIN'));
assert(!/localStorage|sessionStorage|TRAININGBOT_AI_PREVIEW_BRIDGE_SECRET/.test(widgetJS));
const css=fs.readFileSync("public/visitor-ai-widget-v2.css","utf8");
assert(css.includes(".tb-ai-popup[hidden]"));
assert(css.includes("max-width:700px"));
console.log("PASS: 6 inline AI widgets, safe lazy Preview frame, working /ai fallback, Admin unchanged");
