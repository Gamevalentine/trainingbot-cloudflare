// Evidence acceptance for the five published D1 articles; no API writes, no invented sources.
import assert from "node:assert/strict";
import fs from "node:fs";
const source=fs.readFileSync("functions/bai-viet/[slug].js","utf8");
assert(!/\bCREATE TABLE\b|\bALTER TABLE\b/.test(source),"A public GET must remain D1 read-only");
const {onRequestGet}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));
const slugs={
 er:"battlegrounds-mo-rong-erangel-subzero-trong-pubg-mobile-bgmi-voi-ban-beta-4-7-2",
 beta:"pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y",
 m416:"pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam-van-cho-thong-tin",
 v46:"pubg-mobile-4-6-chinh-thuc-cap-nhat-hom-nay-midnight-hunters-da-den-tay-nguoi-choi",
 opm:"pubg-mobile-one-punch-man-chinh-thuc-duoc-cong-bo-saitama-do-bo-erangel-tu-ngay-20-9"
};
const expectedSources={
 [slugs.er]:["https://www.pubg.com/en/news/9635","https://www.pubgmobile.com/en-US/news-detail.shtml"],
 [slugs.beta]:["https://www.pubgmobile.com/en-US/news.shtml","https://event.bittopup.com/news/v4-7-beta-test-1-update-announcement"],
 [slugs.m416]:["https://www.dearplayers.com/en-US/updates/pubg-mobile-global/2102005997917417884"],
 [slugs.v46]:["https://pubgm.vnggames.com/tin-tuc/thong-bao-cap-nhat/thong-bao-cap-nhat-phien-ban-4-6.html"],
 [slugs.opm]:["https://onepunchman-anime.net/news/archives/7790"]
};
let reads=0,writes=0;
const cases=[];
for(const [kind,slug] of Object.entries(slugs)){
 const rawPost={
  slug,title:"Original archived title "+kind,summary:"Raw user article summary",content:"## Test old article\nThis body must not mutate the database.",
  rich_content:"<p>Raw D1 user content with old details</p>",category:"PUBG",cover_url:"",
  published_at:"2026-10-10",updated_at:"2026-10-21"
 };
 const snapshot=JSON.stringify(rawPost);
 const db={prepare(sql){
  if(/\bINSERT\b|\bCREATE\b|\bALTER\b|\bUPDATE\b|\bDELETE\b|\bDROP\b/i.test(sql)){writes++;throw Error("Forbidden D1 mutation "+sql)}
  reads++;
  return {bind(){return {first:async()=>rawPost,all:async()=>({results:[]})}}}
 }};
 const response=await onRequestGet({env:{DB:db},params:{slug}});
 assert.equal(response.status,200,"Article should remain indexable "+slug);
 const html=await response.text();
 assert(html.includes("href=\"https://trainingbot.io.vn/bai-viet/"+slug+"\""),"Slug/canonical changed "+slug);
 assert(html.includes("Nguồn đối chiếu &amp; trạng thái kiểm chứng"),"Vetted citation panel absent "+slug);
 for(const expected of expectedSources[slug])assert(html.includes(expected.replace(/&/g,"&amp;")),"Evidence link missing "+slug+" -> "+expected);
 assert(html.includes('rel="noopener noreferrer"'),"Source links need no-opener protection");
 assert(!html.includes("Chưa có liên kết nguồn trực tiếp để đối chiếu"),"Unhelpful empty-source text still present "+slug);
 assert.equal(JSON.stringify(rawPost),snapshot,"Must not mutate original D1 object "+slug);
 assert(!/<meta name="robots" content="noindex/i.test(html),"Published article wrongly noindexed "+slug);
 if(kind==="er"){
  assert(html.includes("ĐÍNH CHÍNH"),"Correction notice missing");
  assert(html.includes("PUBG PC Update 39.2"),"Correction title must distinguish PC and Mobile");
  assert(html.includes("##")===false,"Corrected Markdown should be rendered to HTML");
  assert(html.includes("10 sát thương/giây")&&html.includes("14 sát thương/giây"),"PC attribution must remain explicit");
  assert(!html.includes("Original archived title"),"Old false title must not be shown");
  assert(!html.includes("Raw user article summary"),"Old false summary must not be shown");
  assert(html.includes('property="article:modified_time" content="2026-10-29T00:00:00.000Z"'),"Editorial correction date should be recorded");
 }else{
  assert(html.includes("Original archived title"),"Other published titles must be preserved");
  assert(html.includes("Raw D1 user content with old details"),"Other D1 body must not be overwritten");
 }
 cases.push({slug,status:kind==="er"?"corrected-public-view":"provenance-added",sourceLinks:expectedSources[slug].length});
}
assert.equal(writes,0);
assert.equal(reads,10,"Expected two SELECTs per article");
const report={checkedAt:"2026-10-29",policy:"Keep canonical & original D1 data; explicitly retract the misattributed PUBG PC 39.2 article",
 cases,readOnlyD1:true,totalDBReads:reads,totalDBWrites:writes,
 outstanding:["Verify original publisher source of M416 post directly, if official URL becomes publicly available","Independently validate legacy 4.6 Android/iOS package sizes and exact hours; not supported by cited official release"],
 warning:"No proof that Google has indexed updates or that organic traffic has recovered. External sources are not mirrored or copyrighted text copied in full."};
fs.mkdirSync("seo-sources-evidence",{recursive:true});
fs.writeFileSync("seo-sources-evidence/source-verification-qa.json",JSON.stringify(report,null,2));
console.log("SEO SOURCES QA PASS: 5 D1 articles, 1 PC/Mobile retraction, original D1 preserved, 0 D1 writes");
