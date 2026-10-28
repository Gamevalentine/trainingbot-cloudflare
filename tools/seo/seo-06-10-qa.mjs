// SEO-06–10: technical acceptance + honest, reproducible Search Console tracking baseline.
// Google indexing/rank data cannot be fabricated from page HTML or a public site: Search Console owner data required.
import assert from "node:assert/strict";
import fs from "node:fs";
const base="https://trainingbot.io.vn";
const read=p=>fs.readFileSync(p,"utf8");
const canonicalOf=h=>(h.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)||[])[1]||
  (h.match(/<link\b[^>]*href="([^"]+)"[^>]*rel="canonical"/i)||[])[1]||"";
const targets=["news-analysis","news-featured","news-update"];
let count=0;
for(const route of targets){
 const html=read("public/"+route+".html");
 const expected=base+"/"+route;
 assert.equal(canonicalOf(html),expected,"Canonical broken "+route);
 assert(!/name="robots" content="noindex/i.test(html),"Unexpected noindex "+route);
 assert(html.includes('id="tb-seo-topic-section"')&&html.includes('id="tb-seo-topic-title"'),"Missing semantic topic section "+route);
 assert(html.includes('id="tb-seo-topic-v1"'),"Missing responsive category styling "+route);
 assert(!html.includes("Nội dung của chuyên mục này đang được gom lại"),"Old placeholder remains "+route);
 const section=html.split('id="tb-seo-topic-section"')[1]?.split("</section>")[0]||"";
 const links=[...section.matchAll(/class="tb-seo-topic__card" href="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(links.length,3,"Need three genuine article/related links "+route);
 assert.equal(new Set(links).size,links.length,"Duplicate links in "+route);
 for(const link of links){
  assert(link.startsWith("/")&&!link.startsWith("//")&&!link.includes("?"),"Unexpected noncanonical href "+link);
  if(!link.startsWith("/bai-viet/")){
   const page="public/"+link.slice(1)+(link==="/"? "index": "")+".html";
   assert(fs.existsSync(page),"Internal category link is missing "+link);
  }
 }
 if(route==="news-update")assert(html.includes("chưa có bài phỏng vấn đã kiểm chứng"),"Must not invent interviews");
 count+=links.length;
}
const home=read("public/index.html"),wiki=read("public/wiki.html"),blogCode=read("functions/sitemap-posts.xml.js");
assert.equal(canonicalOf(home),base+"/");
assert.equal(canonicalOf(wiki),base+"/wiki");
assert(home.includes("TrainingBot:"),"Preserve branded homepage H1");
assert(blogCode.includes("SELECT"),"Dynamic sitemap source must query existing posts");
assert(!blogCode.includes("async function setup(db)"),"Crawler GET cannot mutate D1");
const staticSitemap=read("public/sitemap.xml");
const locs=[...staticSitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
assert.equal(new Set(locs).size,locs.length,"Duplicate sitemap URLs");
for(const url of [base+"/",base+"/wiki",...targets.map(x=>base+"/"+x)]){
 assert(locs.includes(url),"Missing sitemap route "+url);
}
for(const url of locs)assert(url.startsWith(base+"/")&&!url.includes("?"),"Noncanonical sitemap URL "+url);
assert(read("public/robots.txt").includes("Sitemap: "+base+"/sitemap-posts.xml"));
const report={
  date:"2026-10-29",property:"sc-domain:trainingbot.io.vn",
  SEO06:{state:"PENDING_OWNER_GSC",reason:"Connected GSC Wizard subscription expired; neither URL Inspection nor Pages indexing report can be read",googleIndexed:null,googleExcluded:null},
  SEO07:{state:"TECHNICAL_PASS_GOOGLE_INDEX_UNKNOWN",urls:[base+"/",base+"/wiki",base+"/bai-viet/pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y"]},
  SEO08:{state:"IMPLEMENTED_AND_TESTED",enhancedRoutes:targets,internalLinks:count,editorialInterviewClaimsInvented:0},
  SEO09:{state:"SITEMAP_TECHNICAL_CHECKED_SUBMISSION_UNVERIFIED",staticUrls:locs.length,dynamicSitemapRoute:"/sitemap-posts.xml",submittedToGoogle:null},
  SEO10:{state:"TRACKING_TEMPLATE_READY_NO_NEW_OWNER_METRICS",
    screenshotBaseline:{clicks:35,impressions:null,ctr:null,position:null,period:"Search Console overview screenshot, displayed time range not independently verified",alert:{url:"/bai-viet/pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y",impressionsChangePercent:-87}},
    checkpoints:[
      {date:"2026-11-05",days:7,clicks:null,impressions:null,ctr:null,position:null},
      {date:"2026-11-12",days:14,clicks:null,impressions:null,ctr:null,position:null},
      {date:"2026-11-26",days:28,clicks:null,impressions:null,ctr:null,position:null}
    ],
    dimensions:["query=trainingbot","query=trainingbot.io.vn","query=pubg mobile trainingbot","page=/","page=/wiki","page=/bai-viet/pubg-mobile-4-7-beta-1-..."],
    caution:"Use matching comparison windows, confirm Search Console finalization delay; the screenshot overview clicks are not sufficient for CTR or position"}
};
fs.mkdirSync("seo-06-10-artifacts",{recursive:true});
fs.writeFileSync("seo-06-10-artifacts/technical-and-gsc-baseline.json",JSON.stringify(report,null,2));
console.log("SEO-06–10 technical QA PASS: "+targets.length+" restored categories, "+count+" related links, "+locs.length+" canonical static sitemap URLs; GSC indexing UNVERIFIED");
