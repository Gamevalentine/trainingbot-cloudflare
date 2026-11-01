// LIC-06.2D — Production-only GET acceptance after Cloudflare Pages deployment.
// Checks generic site metadata AND preservation of five editorial-specific images.
import fs from "node:fs";
import crypto from "node:crypto";
const origin="https://trainingbot-cloudflare.pages.dev";
const site="https://trainingbot.io.vn";
const image="/editorial-original-trainingbot-share.png";
const pages=[
 ["/","/"],["/wiki","/wiki"],["/ban-cap-nhat","/ban-cap-nhat"],
 ["/news","/news"],["/community","/community"],["/contact","/contact"],
 ["/news-esports","/news-esports"],["/news-versions","/news-versions"]
];
const articles=[
 ["battlegrounds-mo-rong-erangel-subzero-trong-pubg-mobile-bgmi-voi-ban-beta-4-7-2","erangel"],
 ["pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y","beta-47"],
 ["pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam-van-cho-thong-tin","m416-glacier"],
 ["pubg-mobile-4-6-chinh-thuc-cap-nhat-hom-nay-midnight-hunters-da-den-tay-nguoi-choi","midnight-hunters"],
 ["pubg-mobile-one-punch-man-chinh-thuc-duoc-cong-bo-saitama-do-bo-erangel-tu-ngay-20-9","one-punch-man"]
];
const read=async path=>{
 const res=await fetch(origin+path,{method:"GET",cache:"no-store",signal:AbortSignal.timeout(12000)});
 if(!res.ok)throw Error(path+": HTTP "+res.status);
 return res;
};
const attr=(text,name,value)=>{
 const escaped=value.replace(/[.*+?^$()|[\]\\{}]/g,"\\$&");
 return new RegExp("<meta\\b[^>]*"+name+"=[\"']"+escaped+"[\"'][^>]*content=[\"']([^\"']+)","i").exec(text)?.[1]||"";
};
async function check(){
 const asset=await read(image),type=(asset.headers.get("content-type")||"").toLowerCase();
 if(!type.includes("image/png"))throw Error("Default share asset MIME is not PNG");
 const binary=Buffer.from(await asset.arrayBuffer());
 if(binary.length<15000||binary.subarray(0,8).toString("hex")!=="89504e470d0a1a0a"||
    binary.readUInt32BE(16)!==1200||binary.readUInt32BE(20)!==630)throw Error("Invalid 1200x630 branded share PNG");
 const imageHash=crypto.createHash("sha256").update(binary).digest("hex");
 const checkedPages=[];
 for(const [route,canonicalPath] of pages){
  const response=await read(route);
  const html=await response.text();
  if(attr(html,"property","og:image")!==site+image)throw Error(route+": OG missing new generic share");
  if(attr(html,"name","twitter:image")!==site+image)throw Error(route+": Twitter missing new generic share");
  if(html.includes("news-pubg-mobile-4-6-cover.webp"))throw Error(route+": old share URL still visible");
  const can=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1];
  if(can!==site+canonicalPath)throw Error(route+": canonical changed");
  if(!/<meta\b[^>]*name=["']robots["'][^>]*content=["']index,follow/i.test(html))
   throw Error(route+": expected main page to remain indexable");
  const jsonld=[...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
   .map(m=>{try{return JSON.parse(m[1])}catch{return null}}).filter(Boolean);
  if(!jsonld.some(x=>JSON.stringify(x).includes(site+image)))throw Error(route+": JSON-LD share not updated");
  checkedPages.push(route);
 }
 const checkedArticles=[];
 for(const [slug,id] of articles){
  const response=await read("/bai-viet/"+slug),html=await response.text();
  const expected=site+"/editorial-original-"+id+".png";
  const svg="/editorial-original-"+id+".svg";
  if(attr(html,"property","og:image")!==expected)throw Error(slug+": article-specific OG wrongly overwritten");
  if(attr(html,"name","twitter:image")!==expected)throw Error(slug+": article-specific Twitter wrongly overwritten");
  if(!html.includes('class="tb-cover" src="'+svg+'"'))throw Error(slug+": article-specific SVG cover changed");
  if(!html.includes('class="tb-source-verification"')&&!html.includes('tb-source-verification'))
   throw Error(slug+": source verification missing");
  checkedArticles.push(id);
 }
 return {checkedAt:new Date().toISOString(),image:image,hash:imageHash,bytes:binary.length,
  imageWidth:1200,imageHeight:630,metadataPages:checkedPages,d1ArticlesUnaffected:checkedArticles,
  claims:"GET-only verification; no D1/R2 mutation; historical media URLs remain unresolved"};
}
let outcome,errors=[];
for(let attempt=1;attempt<=18;attempt++){
 try{
  outcome=await check();
  console.log("LIC062_PRODUCTION_SHARE_PASS",JSON.stringify({attempt,...outcome}));
  break;
 }catch(e){
  const err=String(e?.message||e).slice(0,240);
  errors.push(err);
  console.log("LIC062_PRODUCTION_WAIT",JSON.stringify({attempt,error:err}));
  if(attempt<18)await new Promise(resolve=>setTimeout(resolve,7000));
 }
}
if(!outcome)throw Error("LIC06.2 Production acceptance failed: "+errors.at(-1));
fs.mkdirSync("lic062-audit-artifacts",{recursive:true});
fs.writeFileSync("lic062-audit-artifacts/production.json",JSON.stringify(outcome,null,2));
console.log("LIC062_PRODUCTION_FINAL_PASS; 8 metadata routes, 5 article covers unchanged, NO D1/R2 WRITES");
