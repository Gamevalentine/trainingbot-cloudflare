// Post-release LIC-04 acceptance: public GETs only, no D1/Worker writes.
import fs from "node:fs";
const origin="https://trainingbot-cloudflare.pages.dev";
const names=[
 ["battlegrounds-mo-rong-erangel-subzero-trong-pubg-mobile-bgmi-voi-ban-beta-4-7-2","erangel"],
 ["pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y","beta-47"],
 ["pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam-van-cho-thong-tin","m416-glacier"],
 ["pubg-mobile-4-6-chinh-thuc-cap-nhat-hom-nay-midnight-hunters-da-den-tay-nguoi-choi","midnight-hunters"],
 ["pubg-mobile-one-punch-man-chinh-thuc-duoc-cong-bo-saitama-do-bo-erangel-tu-ngay-20-9","one-punch-man"]
];
const nap=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const check=async()=>{
 const output=[];
 for(const [slug,id] of names){
  const prefix="/editorial-original-"+id;
  const r=await fetch(origin+"/bai-viet/"+slug,{cache:"no-store",signal:AbortSignal.timeout(14000)});
  if(r.status!==200)throw Error(slug+": public article HTTP "+r.status);
  const html=await r.text();
  if(!html.includes('class="tb-cover" src="'+prefix+'.svg"'))throw Error(slug+": original SVG not displayed");
  if(!html.includes('property="og:image" content="https://trainingbot.io.vn'+prefix+'.png"'))throw Error(slug+": original PNG not in OpenGraph");
  if(!html.includes('name="twitter:image" content="https://trainingbot.io.vn'+prefix+'.png"'))throw Error(slug+": original PNG not in Twitter card");
  if(!html.includes('href="https://trainingbot.io.vn/bai-viet/'+slug+'"'))throw Error(slug+": canonical changed");
  if(!html.includes('class="tb-source-verification"')&&!html.includes('tb-source-verification'))throw Error(slug+": source panel missing");
  if(/<img[^>]+src="\/user-posts\//i.test(html))throw Error(slug+": unverified old D1 image still displayed");
  const svg=await fetch(origin+prefix+".svg",{cache:"no-store",signal:AbortSignal.timeout(14000)});
  if(svg.status!==200||(svg.headers.get("content-type")||"").includes("html"))throw Error(id+": SVG not available");
  const png=await fetch(origin+prefix+".png",{cache:"no-store",signal:AbortSignal.timeout(14000)});
  if(png.status!==200||(png.headers.get("content-type")||"").includes("html"))throw Error(id+": PNG not available");
  const bytes=Buffer.from(await png.arrayBuffer());
  if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||
     bytes.readUInt32BE(16)!==1200||bytes.readUInt32BE(20)!==630)throw Error(id+": invalid PNG asset");
  output.push({id,slug,http:200,canonical:true,sourcePanel:true,svg:prefix+".svg",png:prefix+".png",
   imageWidth:1200,imageHeight:630,retiredImageShown:false});
 }
 return output;
};
let outcome;
for(let attempt=1;attempt<=18;attempt++){
 try{
  outcome=await check();
  console.log("LIC04_PRODUCTION_ARTWORK_VERIFIED",JSON.stringify({attempt,articles:outcome.length}));
  break;
 }catch(error){
  console.log("LIC04_WAIT_FOR_PAGES",JSON.stringify({attempt,error:String(error?.message||error).slice(0,180)}));
  if(attempt<18)await nap(7000);
 }
}
if(!outcome)throw Error("LIC-04 Production artwork acceptance failed; no data changed");
fs.mkdirSync("lic04-artifacts",{recursive:true});
fs.writeFileSync("lic04-artifacts/production.json",JSON.stringify({checkedAt:new Date().toISOString(),
 scope:"public Pages read-only",outcome,storedD1RowsUntouched:true,sourceMediaLicenseStatus:"unverified",
 note:"Five live article covers and share cards replaced by independently authored graphics; no claim of clearance for old stored assets."},null,2));
console.log("LIC04_PRODUCTION_5_ARTICLES_PASS; NO D1 OR R2 WRITES");
