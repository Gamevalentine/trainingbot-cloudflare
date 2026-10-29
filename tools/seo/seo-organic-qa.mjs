// SEO organic repair acceptance: read-only article crawler path + honest contextual links.
// This does not assert Google ranking, Search Console impressions, or content licenses.
import fs from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";
const read=p=>fs.readFileSync(p,"utf8");
const page=read("public/news-pubg-mobile-4-6-skins-events.html");
const beta="pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y";
assert(page.includes('href="/bai-viet/'+beta+'"'),"4.6 article must link to published Beta 4.7 article");
assert(page.includes('href="/ban-cap-nhat"'),"4.6 page needs the canonical updates route");
assert(page.includes("Lưu ý về thời điểm:"),"4.6 events must be labelled as older / unverified");
assert(page.includes('href="https://trainingbot.io.vn/news-pubg-mobile-4-6-skins-events"'),"4.6 canonical changed");
let legacy=0,scanned=0;
function visit(dir){
 for(const item of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,item.name);
  if(item.isDirectory()){visit(file);continue}
  if(!item.isFile()||!item.name.endsWith(".html"))continue;
  scanned++;
  const html=read(file);
  if(/\bhref=(["'])\/updates\/?\1/.test(html))legacy++;
 }
}
visit("public");
assert.equal(legacy,0,"Public HTML must not link to the duplicate /updates route");
const source=read("functions/bai-viet/[slug].js");
assert(!source.includes("await setup(env.DB)"),"Article GET must not trigger D1 migrations");
assert(!/\bCREATE TABLE\b|\bALTER TABLE\b/.test(source),"Article route should not run schema writes");
const {onRequestGet}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));
const expectedPost={slug:beta,title:"PUBG MOBILE 4.7 Beta 1 chính thức khởi động",summary:"Thông tin thử nghiệm Beta 1 có thể thay đổi.",
 content:"## Thông tin Beta\n\nCác thay đổi cần theo dõi.",rich_content:"",category:"Phiên bản thử nghiệm",cover_url:"",published_at:"2026-09-23",updated_at:"2026-10-28"};
let sqlReads=0,sqlWrites=0;
const DB={
 prepare(sql){
  if(/\bCREATE\b|\bALTER\b|\bUPDATE\b|\bDELETE\b/i.test(sql)){sqlWrites++;throw Error("Article GET attempted a D1 write: "+sql)}
  sqlReads++;
  return {bind(){return {
   first:async()=>expectedPost,
   all:async()=>({results:[]})
  }}}
 }
};
const result=await onRequestGet({env:{DB},params:{slug:beta}});
assert.equal(result.status,200);
const html=await result.text();
assert(html.includes('rel="canonical" href="https://trainingbot.io.vn/bai-viet/'+beta+'"'),"Broken dynamic canonical");
assert(html.includes('href="/news-pubg-mobile-4-6-skins-events"'),"No contextual 4.6 link in Beta 4.7");
assert(html.includes("giai đoạn Beta 1"),"Missing Beta caveat");
assert(html.includes('href="/ban-cap-nhat"'),"Missing canonical updates hub");
assert(!html.includes('<meta name="robots" content="noindex"'),"Published page inadvertently noindexed");
assert.equal(sqlWrites,0);
assert.equal(sqlReads,2);
const report={date:"2026-10-29",release:"code QA",staticHtmlPages:scanned,legacyNoindexInternalLinks:legacy,dynamicArticleSqlReads:sqlReads,dynamicArticleSqlWrites:sqlWrites,contextualBetaCrosslinks:true,notes:"No Google ranking inference; Beta content remains historically scoped."};
fs.mkdirSync("seo-organic-artifacts",{recursive:true});
fs.writeFileSync("seo-organic-artifacts/qa-report.json",JSON.stringify(report,null,2));
console.log("SEO ORGANIC QA PASS: "+scanned+" pages checked, 0 old links, read-only article GET, contextual version links");
