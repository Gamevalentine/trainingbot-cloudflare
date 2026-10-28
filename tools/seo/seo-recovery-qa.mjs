// SEO Recovery: verify branded origin, indexability and read-only sitemaps.
// Static checks do NOT substitute for Google URL Inspection or Search Console.
import assert from "node:assert/strict";
import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const home=read("public/index.html"),wiki=read("public/wiki.html"),robots=read("public/robots.txt"),sitemap=read("public/sitemap.xml");
const name="TrainingBot",origin="https://trainingbot.io.vn";
assert(/<title>TrainingBot\b/i.test(home),"Homepage title must lead with TrainingBot");
assert(home.includes("TrainingBot là trang thông tin và cẩm nang PUBG Mobile"),"Distinctive branded homepage text missing");
assert(home.includes("PUBG Mobile"),"Homepage game topic missing");
const h1=(home.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]||"";
assert(h1.includes("TrainingBot:"),"Homepage heading should identify TrainingBot");
const newsNav=(home.match(/<nav class="tb-seo-article-shortcuts"[\s\S]*?<\/nav>/)||[])[0]||"";
const articleHrefs=[...newsNav.matchAll(/href="(\/bai-viet\/[a-z0-9-]+)"/g)].map(x=>x[1]);
assert.equal(articleHrefs.length,3,"Three crawlable editorial links expected");
assert.equal(new Set(articleHrefs).size,articleHrefs.length,"Duplicate article links");
assert(articleHrefs.some(x=>x.includes("4-7-beta-1")),"GSC affected 4.7 Beta article must have an internal link");

for(const [name,markup] of [["home",home],["wiki",wiki]]){
 assert(markup.includes('<meta name="robots" content="index,follow'),name+" canonical pages must be indexable");
 const canonical=[...markup.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/gi)];
 assert.equal(canonical.length,1,name+" must have exactly one canonical");
 assert(canonical[0][0].includes('href="'+origin+(name==="home"?"/":"/wiki")+'"'));
}
const script=[...home.matchAll(/<script\b[^>]*id="tb-seo-jsonld"[^>]*>([\s\S]*?)<\/script>/g)];
assert.equal(script.length,1);
const json=JSON.parse(script[0][1]);
assert(json["@graph"].some(n=>n["@type"]==="Organization"&&n.name==="TrainingBot"&&n.url===origin+"/"));
assert(json["@graph"].some(n=>n["@type"]==="WebSite"&&n.name==="TrainingBot"));
assert(robots.includes("Allow: /")&&robots.includes("Disallow: /admin"));
assert(robots.includes("Sitemap: "+origin+"/sitemap.xml")&&robots.includes("Sitemap: "+origin+"/sitemap-posts.xml"));
const locs=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
assert(locs.includes(origin+"/")&&locs.includes(origin+"/wiki"));
assert.equal(locs.length,new Set(locs).size);
for(const x of locs)assert(new URL(x).origin===origin,"Foreign sitemap domain "+x);
const runSource=async(path)=>import("data:text/javascript;base64,"+Buffer.from(read(path)).toString("base64"));
const {onRequest}=await runSource("functions/_middleware.js");
let nextCalls=0;
const context=(url,method="GET")=>({request:new Request(url,{method}),env:{},next:async()=>{nextCalls++;return new Response("rendered page",{status:200,headers:{"content-type":"text/html"}})}});
for(const path of ["/","/wiki","/news","/admin.html","/sitemap.xml","/robots.txt"]){
 const preview=await onRequest(context("https://aion-trainingbot-seo-recovery-20261029.trainingbot-cloudflare.pages.dev"+path));
 assert.equal(preview.status,200);
 assert.equal(preview.headers.get("x-robots-tag"),"noindex, nofollow","Preview index leak: "+path);
}
const blocked=await onRequest(context("https://aion-trainingbot-seo-recovery-20261029.trainingbot-cloudflare.pages.dev/api/v71/admin/posts","POST"));
assert.equal(blocked.status,403);
assert.equal(blocked.headers.get("x-robots-tag"),"noindex, nofollow");
const canonical=await onRequest(context(origin+"/"));
assert.equal(canonical.status,200);
assert.equal(canonical.headers.get("x-robots-tag"),null,"Production must NOT be noindexed");
const www=await onRequest(context("https://trainingbot-cloudflare.pages.dev/"));
assert.equal(www.headers.get("x-robots-tag"),null,"Canonical Pages host remains unchanged by the branch-only policy");
assert.equal(nextCalls,8);
const {onRequestGet}=await runSource("functions/sitemap-posts.xml.js");
let allCalls=0,writeCalls=0;
const DB={prepare(sql){if(/\bCREATE\b|\bALTER\b|\bUPDATE\b|\bDELETE\b/i.test(sql))throw Error("Schema/data mutation in sitemap SQL");
 return {all:async()=>{allCalls++;return {results:[{slug:"pubg-mobile-4-7-beta-1",updated_at:"2026-10-20T00:00:00Z",published_at:"2026-09-25"},
 {slug:"invalid/path",updated_at:"2026-10-21"},{slug:"erangel-subzero",updated_at:"2026-10-22"}]}} ,
 run:async()=>{writeCalls++;throw Error("GET sitemap must not write D1")}}}};
const res=await onRequestGet({env:{DB}});
const xml=await res.text();
assert.equal(res.status,200);
assert(xml.includes(origin+"/bai-viet/pubg-mobile-4-7-beta-1"));
assert(xml.includes("<lastmod>2026-10-20</lastmod>"));
assert(xml.includes(origin+"/bai-viet/erangel-subzero"));
assert(!xml.includes("invalid/path"));
assert.equal(allCalls,1);assert.equal(writeCalls,0);
const report={checkedAt:new Date().toISOString(),release:"Preview only",production:"not modified",
 brandTitle:true,brandDescription:true,canonicalHome:true,canonicalWiki:true,
 staticSitemapUrls:locs.length,sitemapPostsReadOnly:true,previewNoindexPaths:6,productionNoindexInjected:false,
 searchConsole:{urlInspection:"UNAVAILABLE: GSC Wizard subscription expired; Google indexing verdict unknown",observed:"User-provided Search Console screenshot: 35 clicks in shown window, near-zero recent clicks, one article impressions alert -87%"},
 warning:"Technical SEO validation does not prove Google ranking recovery or any particular indexed URL state."};
fs.mkdirSync("seo-recovery-artifacts",{recursive:true});
fs.writeFileSync("seo-recovery-artifacts/technical-audit.json",JSON.stringify(report,null,2));
console.log("SEO RECOVERY PASS: homepage brand, canonical, static sitemap, preview noindex, read-only article sitemap, Production unaffected");
