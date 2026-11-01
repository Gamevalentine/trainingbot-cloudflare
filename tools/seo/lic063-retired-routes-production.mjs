// LIC-06.3 post-release test, public GET/HEAD only. No D1/R2 mutations.
import fs from "node:fs";
const origins=["https://trainingbot-cloudflare.pages.dev","https://trainingbot.io.vn"];
const replacements="https://trainingbot.io.vn/editorial-original-trainingbot-share.png";
const originals=[
 "/news-pubg-mobile-4-6-cover.webp",
 "/user-posts/pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay--1790303973793.jpg",
 "/user-posts/pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam--1790048495762.jpg",
 "/user-posts/pubg-mobile-4-6-chinh-thuc-cap-nhat-hom-nay-midnight-hunters-da-den-tay--1788837512881.png",
 "/user-posts/pubg-mobile-one-punch-man-chinh-thuc-duoc-cong-bo-saitama-do-bo-erangel--1788593701812.jpg"
];
const articleSlugs=[
 "battlegrounds-mo-rong-erangel-subzero-trong-pubg-mobile-bgmi-voi-ban-beta-4-7-2",
 "pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y",
 "pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam-van-cho-thong-tin",
 "pubg-mobile-4-6-chinh-thuc-cap-nhat-hom-nay-midnight-hunters-da-den-tay-nguoi-choi",
 "pubg-mobile-one-punch-man-chinh-thuc-duoc-cong-bo-saitama-do-bo-erangel-tu-ngay-20-9"
];
const req=(url,method="GET",redirect="manual")=>fetch(url,{method,redirect,cache:"no-store",signal:AbortSignal.timeout(13000)});
async function inspect(){
 const checked=[];
 for(const origin of origins){
  for(const path of originals){
   for(const method of ["GET","HEAD"]){
    const response=await req(origin+path,method);
    const loc=response.headers.get("location");
    if(response.status!==302||loc!==replacements)
     throw Error(origin+path+" "+method+": expected 302 to owned PNG, got "+response.status+" "+loc);
    if(!/no-store/.test(response.headers.get("cache-control")||""))
     throw Error(origin+path+" "+method+": response cached unexpectedly");
    if(!/noindex/.test(response.headers.get("x-robots-tag")||""))
     throw Error(origin+path+" "+method+": retirement should not be indexed");
   }
   checked.push(origin+path);
  }
 }
 const safe=await req(replacements,"GET","follow");
 if(!safe.ok||!(safe.headers.get("content-type")||"").includes("image/png"))
  throw Error("Original branded fallback PNG failed");
 const image=Buffer.from(await safe.arrayBuffer());
 if(image.subarray(0,8).toString("hex")!=="89504e470d0a1a0a"||
    image.readUInt32BE(16)!==1200||image.readUInt32BE(20)!==630)
   throw Error("Fallback branded PNG is invalid");
 const articleChecks=[];
 for(const slug of articleSlugs){
  const res=await req(origins[0]+"/bai-viet/"+slug,"GET","follow");
  if(!res.ok)throw Error("Article inaccessible: "+slug);
  const html=await res.text();
  if(!html.includes("editorial-original-")||html.includes('class="tb-cover" src="/user-posts/'))
   throw Error("Article old cover resurfaced: "+slug);
  if(!html.includes("tb-source-verification"))throw Error("Source pane lost: "+slug);
  articleChecks.push(slug);
 }
 return {checkedAt:new Date().toISOString(),redirectedOldMedia:checked.length,
  origins,methodCoverage:["GET","HEAD"],fallbackPng:replacements,mediaBytes:image.length,
  d1ArticlesPreserved:articleChecks.length,oldR2ObjectsDeleted:false,d1DataMutated:false,
  warning:"This blocks normal public delivery of 5 old URLs but does not prove private R2 deletion or ownership rights."};
}
let result,errors=[];
for(let attempt=1;attempt<=18;attempt++){
 try{
  result=await inspect();console.log("LIC063_PRODUCTION_GATE_PASS",JSON.stringify({attempt,...result}));break;
 }catch(error){
  const msg=String(error?.message||error).slice(0,230);errors.push(msg);
  console.log("LIC063_WAIT_FOR_PAGES",JSON.stringify({attempt,error:msg}));
  if(attempt<18)await new Promise(r=>setTimeout(r,7000));
 }
}
if(!result)throw Error("LIC06.3 post-release acceptance failed: "+errors.at(-1));
fs.mkdirSync("lic063-audit-artifacts",{recursive:true});
fs.writeFileSync("lic063-audit-artifacts/production.json",JSON.stringify(result,null,2));
console.log("LIC063_PUBLIC_DELIVERY_RETIRED_PASS; reversible redirect only, NO D1/R2 WRITES");
