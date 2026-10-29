// SEO editorial QA: 22 static sitemap routes and 5 current published stories.
// Preserve old article URLs; keep all safety claims limited to what can be tested.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root="https://trainingbot.io.vn";
const read=f=>fs.readFileSync(f,"utf8");
const staticSitemap=read("public/sitemap.xml");
const staticUrls=[...staticSitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
assert(staticUrls.length>=20&&new Set(staticUrls).size===staticUrls.length,"Canonical sitemap URL list invalid");
const canonical=html=>(html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)||[])[1]||"";
let htmlPages=0,unresolved=[],noindexCanonical=[];
for(const url of staticUrls){
 const p=new URL(url).pathname;
 const file=p==="/"?"public/index.html":"public"+p+".html";
 assert(fs.existsSync(file),"Static sitemap missing HTML "+url);
 const h=read(file);htmlPages++;
 assert.equal(canonical(h),url,"Canonical mismatches sitemap "+url);
 if(/<meta\s+name="robots"\s+content="noindex/i.test(h))noindexCanonical.push(url);
 assert(/<title>[\s\S]*?<\/title>/i.test(h),"Missing document title "+url);
 const links=[...h.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map(x=>x[1]);
 for(const href of links){
  if(!href.startsWith("/")||href.startsWith("//")||href.startsWith("/cdn-cgi/"))continue;
  const pathname=new URL(href,root).pathname;
  if(pathname.startsWith("/download/")||pathname.startsWith("/api/")||pathname.startsWith("/bai-viet/"))continue;
  if(pathname==="/admin"||pathname==="/account")continue;
  if(pathname==="/")continue;
  if(fs.existsSync("public"+pathname)||fs.existsSync("public"+pathname+".html"))continue;
  unresolved.push({from:p,to:pathname});
 }
}
assert.equal(noindexCanonical.length,0,"Indexable sitemap includes noindex page: "+noindexCanonical.join(", "));
const critical=["/news-pubg-mobile-4-6","/news-pubg-mobile-light","/news-pubg-mobile-4-6-skins-events","/news-analysis","/news-featured"];
assert.equal(unresolved.filter(x=>critical.includes(x.from)).length,0,"Critical article links broken: "+JSON.stringify(unresolved.filter(x=>critical.includes(x.from))));
const testedOld=["news-pubg-mobile-4-6","news-pubg-mobile-light"];
for(const p of testedOld){
 const h=read("public/"+p+".html");
 assert(h.includes('role="note"'),"Missing historical context "+p);
 assert(h.includes('href="/ban-cap-nhat"'),"Missing canonical updates destination "+p);
}
const dynamicSlugs=[
 "battlegrounds-mo-rong-erangel-subzero-trong-pubg-mobile-bgmi-voi-ban-beta-4-7-2",
 "pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y",
 "pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam-van-cho-thong-tin",
 "pubg-mobile-4-6-chinh-thuc-cap-nhat-hom-nay-midnight-hunters-da-den-tay-nguoi-choi",
 "pubg-mobile-one-punch-man-chinh-thuc-duoc-cong-bo-saitama-do-bo-erangel-tu-ngay-20-9"
];
const articleCode=read("functions/bai-viet/[slug].js");
assert(!/\bCREATE TABLE\b|\bALTER TABLE\b/.test(articleCode),"GET article module can mutate database schema");
const {onRequestGet}=await import("data:text/javascript;base64,"+Buffer.from(articleCode).toString("base64"));
let sqlReads=0,sqlWrites=0;
for(const slug of dynamicSlugs){
 const post={slug,title:"Bài thử nghiệm "+slug,summary:"Bài viết đã xuất bản theo thông tin tại thời điểm đăng.",
  content:"Bài viết cần đối chiếu nguồn và mốc thời gian.",rich_content:"",
  category:"Tin tức",cover_url:"",published_at:"2026-09-20",updated_at:"2026-10-28"};
 const DB={prepare(sql){
  if(/\bCREATE\b|\bALTER\b|\bUPDATE\b|\bDELETE\b/i.test(sql)){sqlWrites++;throw new Error("D1 writes on GET "+sql)}
  sqlReads++;
  return {bind(){return {first:async()=>post,all:async()=>({results:[]})}}}
 }};
 const res=await onRequestGet({env:{DB},params:{slug}});
 assert.equal(res.status,200,"Dynamic article not rendered "+slug);
 const h=await res.text(),expected=root+"/bai-viet/"+slug;
 assert.equal(canonical(h),expected,"Broken dynamic canonical "+slug);
 assert(h.includes('name="robots" content="index,follow'),"Unexpected dynamic noindex "+slug);
 assert(h.includes('href="/privacy"')&&h.includes('href="/terms"'),"Misleading legal footer "+slug);
 assert(!h.includes('<a href="/contact">Điều khoản</a>'),"Legal footer incorrectly links Contact "+slug);
 if(slug.includes("beta-1"))assert(h.includes("Đọc tiếp theo phiên bản"),"Beta 1 lacks linked version context");
 else {
  assert(h.includes("Bối cảnh bài viết"),"Historical story lacks dated editorial caveat "+slug);
  assert(h.includes('href="/ban-cap-nhat"')||h.includes('href="/wiki"'),"Missing useful internal context "+slug);
 }
}
assert.equal(sqlWrites,0);
const report={
 auditedAt:"2026-10-29",scope:"static canonical sitemap + five live published story slugs",
 staticPages:htmlPages,dynamicPosts:dynamicSlugs.length,
 unresolvedStaticLinks:unresolved.slice(0,100),noindexCanonical,
 articleRequestSQLReads:sqlReads,articleRequestSQLWrites:sqlWrites,
 historicalNotesVerified:true,
 searchPerformance:{
  dateIntervals:[{name:"previous",from:"2026-10-13",to:"2026-10-19"},{name:"current",from:"2026-10-20",to:"2026-10-26"}],
  site:{previous:{clicks:2,impressions:99,position:6.4},current:{clicks:0,impressions:51,position:8.7}},
  pages:[
   {url:root+"/bai-viet/pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y",previous:{impressions:39,position:6.9},current:{impressions:9,position:7.1}},
   {url:root+"/news-pubg-mobile-4-6-skins-events",previous:{impressions:16,position:5.6},current:{impressions:5,position:5.2}}
  ],
  subsequentSevenDays:{from:"2026-10-29",impressions:null,clicks:null,position:null},
  checkpointDates:["2026-11-05","2026-11-12","2026-11-26"],
  warning:"Search Console 7/14/28-day future metrics are not yet available. No claim of restored Google visibility."
 },
 sourceNotes:"Live dynamic stories that lack original source links remain unverified; this QA does not authenticate PUBG claims."
};
fs.mkdirSync("seo-editorial-artifacts",{recursive:true});
fs.writeFileSync("seo-editorial-artifacts/audit.json",JSON.stringify(report,null,2));
console.log("SEO EDITORIAL QA PASS: "+htmlPages+" static canonicals; "+dynamicSlugs.length+" published article renderers; "+unresolved.length+" unresolved site links recorded; D1 writes: 0");
