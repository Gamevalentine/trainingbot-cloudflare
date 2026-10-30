// LIC-04 QA. Five self-authored graphic banners, no external bitmaps,
// and view-only cover substitutions, including cards returned by public API.
import assert from "node:assert/strict";
import fs from "node:fs";
const names=[
 ["battlegrounds-mo-rong-erangel-subzero-trong-pubg-mobile-bgmi-voi-ban-beta-4-7-2","erangel"],
 ["pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y","beta-47"],
 ["pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam-van-cho-thong-tin","m416-glacier"],
 ["pubg-mobile-4-6-chinh-thuc-cap-nhat-hom-nay-midnight-hunters-da-den-tay-nguoi-choi","midnight-hunters"],
 ["pubg-mobile-one-punch-man-chinh-thuc-duoc-cong-bo-saitama-do-bo-erangel-tu-ngay-20-9","one-punch-man"]
];
const getModule=async path=>import("data:text/javascript;base64,"+Buffer.from(fs.readFileSync(path,"utf8")).toString("base64"));
const {onRequestGet:articleGet}=await getModule("functions/bai-viet/[slug].js");
const {onRequestGet:postsGet}=await getModule("functions/api/posts.js");
const items=names.map(([slug,id])=>({
 slug,title:"An independent test article",summary:"Public news summary",
 content:"## Topic\nA source-backed editorial article.",rich_content:"",
 category:"Tin tức",cover_url:"/user-posts/old-copyright-unverified-image.jpg",
 published_at:"2026-10-31T00:00:00.000Z",updated_at:"2026-10-31T00:00:00.000Z",
 status:"published",featured_at:"",created_at:"2026-10-31T00:00:00.000Z",id
}));
items.push({...items[0],slug:"non-audited-independent-post",cover_url:"/user-posts/other-user-cover.jpg",id:"other"});
const sourceSnapshot=JSON.stringify(items);
let articleSelects=0;
const articleDb={prepare(sql){return {bind(slug){return {
 first:async()=>{articleSelects++;return items.find(x=>x.slug===slug)||null},
 all:async()=>({results:[]})}}}}};
for(const [slug,id] of names){
 const svg="/editorial-original-"+id+".svg";
 const s=fs.readFileSync("overrides"+svg,"utf8");
 assert(s.startsWith('<?xml version="1.0"'),"SVG needs XML header");
 for(const re of [/<image\b/i,/<script\b/i,/<foreignObject\b/i,/\b(?:href|xlink:href)\s*=/i,/@import/i,/url\(\s*https?:/i,
   /data:image\//i,/<iframe\b/i]){
  assert(!re.test(s),"SVG must not embed third-party image or active/external resource: "+svg+" "+re);
 }
 assert(s.includes("KHÔNG PHẢI ARTWORK CHÍNH THỨC"),"Do not misrepresent SVG as publisher artwork");
 assert(fs.existsSync("public"+svg),"Build must publish safe SVG: "+svg);
 const res=await articleGet({env:{DB:articleDb},params:{slug}});
 assert.equal(res.status,200);
 const html=await res.text();
 assert(html.includes('class="tb-cover" src="'+svg+'"'),"Displayed article must use original SVG, not old D1 cover: "+slug);
 assert(html.includes('property="og:image" content="https://trainingbot.io.vn'+svg+'"'),"OpenGraph must be owned SVG");
 assert(html.includes('name="twitter:image" content="https://trainingbot.io.vn'+svg+'"'),"Twitter media must use owned SVG");
 assert(!html.includes("old-copyright-unverified-image.jpg"),"Old D1 cover must not appear publicly");
}
const other=await articleGet({env:{DB:articleDb},params:{slug:"non-audited-independent-post"}});
assert.equal(other.status,200);
assert((await other.text()).includes('/user-posts/other-user-cover.jpg'),"Non-target article must remain unchanged");
const apiRows=items.map(x=>({...x})),sqlWrites=[];
const listDb={prepare(sql){
 if(/\b(?:CREATE|ALTER|DELETE|INSERT|UPDATE|DROP)\b/i.test(sql))sqlWrites.push(sql);
 return {
  async run(){return {meta:{changes:0}}},
  async all(){
   if(sql.startsWith("PRAGMA table_info"))return {results:[{name:"featured_at"}]};
   return {results:apiRows}
  },
  bind(){return {async all(){return {results:apiRows}}}}
 }
}};
const apiRes=await postsGet({env:{DB:listDb},request:new Request("https://trainingbot-cloudflare.pages.dev/api/posts?limit=20")});
assert.equal(apiRes.status,200);
const parsed=await apiRes.json();
assert(parsed.ok && parsed.posts.length===6);
for(const [slug,id] of names){
 const p=parsed.posts.find(p=>p.slug===slug);
 assert.equal(p.cover_url,"/editorial-original-"+id+".svg","Home/news public feed must use original SVG");
}
assert.equal(parsed.posts.find(p=>p.slug==="non-audited-independent-post").cover_url,"/user-posts/other-user-cover.jpg");
assert.equal(JSON.stringify(items),sourceSnapshot,"D1 original records must not change");
assert.equal(JSON.stringify(apiRows),sourceSnapshot,"Feed must not mutate original D1 rows");
assert(!sqlWrites.some(x=>/\b(?:ALTER|DELETE|INSERT|UPDATE|DROP)\b/i.test(x)),
 "No new schema/data writes allowed; existing CREATE IF NOT EXISTS is unchanged");
fs.mkdirSync("lic04-artifacts",{recursive:true});
fs.writeFileSync("lic04-artifacts/acceptance.json",JSON.stringify({
 scope:"Five original SVG article/OG/feed substitutions without D1/R2 modifications",
 slugs:names.map(([slug,id])=>({slug,illustration:"/editorial-original-"+id+".svg",source:"overrides/editorial-original-"+id+".svg",
  externalMediaEmbedded:false,originalD1CoverRetained:true})),
 articleSelects,publicCards:parsed.posts.length,rightsScope:"Self-authored geometric-only SVGs. Legacy stored assets remain unverified.",qa:"PASS"
},null,2));
console.log("LIC04_ARTWORK_VIEW_ONLY_PASS; five article covers, OG and feeds are original SVGs; D1/R2 intact");
