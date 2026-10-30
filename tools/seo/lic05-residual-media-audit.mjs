// LIC-05 read-only post-replacement check: original binary assets should NOT
// be claimed as licensed merely because articles now use self-authored SVG/PNG.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const origin="https://trainingbot-cloudflare.pages.dev";
const assets=[
 {id:"erangel_og_old",path:"/news-pubg-mobile-4-6-cover.webp",sha:"e80a02798aeb6098aa8d364e06ada9d948f119d7dae6a4c01860aa11663283ca"},
 {id:"beta_47_old",path:"/user-posts/pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay--1790303973793.jpg",sha:"744ef11ed78510019a5e6196790c7e41608772d668ca351e3cdd2bb3ef47cafa"},
 {id:"m416_old",path:"/user-posts/pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam--1790048495762.jpg",sha:"1f0720ab754e1a1285bb1bb9d0dfa436f11c3c2d615efbab688aa4eb0d8af5a5"},
 {id:"midnight_46_old",path:"/user-posts/pubg-mobile-4-6-chinh-thuc-cap-nhat-hom-nay-midnight-hunters-da-den-tay--1788837512881.png",sha:"72a274d093734c273aed7bcb8ac8b8b865873366b1baf014ad8c3d2a640b9859"},
 {id:"one_punch_man_old",path:"/user-posts/pubg-mobile-one-punch-man-chinh-thuc-duoc-cong-bo-saitama-do-bo-erangel--1788593701812.jpg",sha:"6eb70dd77d128130e4643806b9f34afea4519ad3273568960a6c5158506d315f"}
];
const slugs=[
 "battlegrounds-mo-rong-erangel-subzero-trong-pubg-mobile-bgmi-voi-ban-beta-4-7-2",
 "pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y",
 "pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam-van-cho-thong-tin",
 "pubg-mobile-4-6-chinh-thuc-cap-nhat-hom-nay-midnight-hunters-da-den-tay-nguoi-choi",
 "pubg-mobile-one-punch-man-chinh-thuc-duoc-cong-bo-saitama-do-bo-erangel-tu-ngay-20-9"
];
function walk(folder){
 return fs.readdirSync(folder,{withFileTypes:true}).flatMap(e=>{
  const full=path.join(folder,e.name);return e.isDirectory()?walk(full):[full]});
}
const compiled=walk("public").filter(f=>/\.(html|css|js|json|svg|xml|txt)$/i.test(f)&&fs.statSync(f).size<=3*1024*1024)
 .map(f=>({f,body:fs.readFileSync(f,"utf8")}));
for(const a of assets){
 a.publicTextReferences=compiled.filter(({body})=>body.includes(a.path)||body.includes(a.path.slice(1)))
   .map(({f})=>f.replace(/^public\//,"")).slice(0,60);
 try{
  const res=await fetch(origin+a.path,{method:"GET",signal:AbortSignal.timeout(18000)});
  a.http=res.status;a.mime=res.headers.get("content-type")||null;
  if(res.ok){
   const data=Buffer.from(await res.arrayBuffer());
   a.bytes=data.length;
   a.sha256=crypto.createHash("sha256").update(data).digest("hex");
   a.unchanged=a.sha256===a.sha;
  }else a.unchanged=false;
 }catch(e){a.http=null;a.error=String(e?.name||"Error");a.unchanged=false}
 a.rightsConfirmed=false;
}
const pageResults=[];
for(const slug of slugs){
 try{
  const res=await fetch(origin+"/bai-viet/"+slug,{signal:AbortSignal.timeout(18000)});
  const html=res.ok?await res.text():"";
  pageResults.push({slug,status:res.status,legacyAssetReferences:assets
   .filter(a=>html.includes(a.path)).map(a=>a.id),
   safeCoverShown:html.includes('/editorial-original-'),
   safeSocialPng:html.includes('.png"')&&html.includes("editorial-original-")});
 }catch(e){pageResults.push({slug,error:String(e?.name||"Error"),safeCoverShown:false})}
}
const report={checkedAt:new Date().toISOString(),method:"Read-only HTTP GET and built static source scan; no API /api/posts or D1/R2 writes",
 assets,articles:pageResults,originalBinaryUrlsStillPublic:assets.filter(a=>a.http===200).length,
 liveFiveArticlesClear:pageResults.every(a=>a.status===200&&!a.legacyAssetReferences?.length&&a.safeCoverShown&&a.safeSocialPng),
 rightsEvidenceFound:false,
 conclusion:"Legacy assets may remain directly accessible even after five displayed article covers and social images are replaced. Copyright permission must not be invented."};
fs.mkdirSync("lic05-audit-artifacts",{recursive:true});
fs.writeFileSync("lic05-audit-artifacts/residual.json",JSON.stringify(report,null,2));
console.log("LIC05_RESIDUAL_OLD_MEDIA",JSON.stringify({assets:assets.map(a=>({id:a.id,http:a.http,unchanged:a.unchanged,publicTextReferences:a.publicTextReferences})),
 liveFiveArticlesClear:report.liveFiveArticlesClear,oldUrlsAccessible:report.originalBinaryUrlsStillPublic}));
if(!report.liveFiveArticlesClear)throw Error("Five D1 pages still reference legacy unverified media or new SVG/PNG absent");
if(assets.some(a=>a.http===200&&!a.unchanged))throw Error("Legacy binary hash differs from verified preservation snapshot; investigate");
console.log("LIC05_READ_ONLY_RESIDUAL_CHECK_PASS; legacy asset rights remain unverified");
