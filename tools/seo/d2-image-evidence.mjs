// D2.9-LIC: read-only evidence for every image currently rendered in 5 D1 articles.
// EXIF, file names, and metadata cannot prove license rights. No D1/R2 writes.
import fs from "node:fs";
import crypto from "node:crypto";
const root="https://trainingbot-cloudflare.pages.dev";
const slugs=[
 "battlegrounds-mo-rong-erangel-subzero-trong-pubg-mobile-bgmi-voi-ban-beta-4-7-2",
 "pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y",
 "pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam-van-cho-thong-tin",
 "pubg-mobile-4-6-chinh-thuc-cap-nhat-hom-nay-midnight-hunters-da-den-tay-nguoi-choi",
 "pubg-mobile-one-punch-man-chinh-thuc-duoc-cong-bo-saitama-do-bo-erangel-tu-ngay-20-9"
];
const decode=s=>String(s).replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#039;/g,"'");
const getAttr=(tag,attr)=>decode(tag.match(new RegExp("(?:^|\\s)"+attr+"\\s*=\\s*[\\\"']([^\\\"']*)[\\\"']","i"))?.[1]||"");
function dimensions(data){
 if(data.length>24&&data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
   return {type:"png",width:data.readUInt32BE(16),height:data.readUInt32BE(20)};
 if(data.length>30&&data.toString("ascii",0,4)==="RIFF"&&data.toString("ascii",8,12)==="WEBP"){
   if(data.toString("ascii",12,16)==="VP8X")
     return {type:"webp",width:1+data.readUIntLE(24,3),height:1+data.readUIntLE(27,3)};
   return {type:"webp",width:null,height:null};
 }
 if(data.length>4&&data[0]===0xFF&&data[1]===0xD8){
   let pos=2;
   while(pos<data.length-10){
     if(data[pos]!==0xFF){pos++;continue}
     let marker=data[pos+1],size=data.readUInt16BE(pos+2);
     if([0xC0,0xC1,0xC2,0xC3,0xC5,0xC6,0xC7,0xC9,0xCA,0xCB].includes(marker))
       return {type:"jpeg",width:data.readUInt16BE(pos+7),height:data.readUInt16BE(pos+5)};
     if(size<2)break; pos+=2+size;
   }
   return {type:"jpeg",width:null,height:null};
 }
 return {type:"unknown",width:null,height:null};
}
const articles=[],assets=new Map();
for(const slug of slugs){
 const url=root+"/bai-viet/"+slug;
 const response=await fetch(url,{method:"GET",headers:{Accept:"text/html"},signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error("Cannot verify article "+slug+": HTTP "+response.status);
 const html=await response.text(),uses=[];
 const add=(raw,role,alt="")=>{
  if(!raw)return;
  let resolved;try{resolved=new URL(raw,root)}catch{return}
  if(!["https:","http:"].includes(resolved.protocol))return;
  const full=resolved.href;
  uses.push({role,asset:full,alt:alt.slice(0,200)});
  if(!assets.has(full))assets.set(full,{url:full,usedBy:[],status:"not_checked"});
  assets.get(full).usedBy.push({slug,role});
 };
 const og=html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1]||"";
 add(decode(og),"open_graph");
 for(const match of html.matchAll(/<img\b[^>]*>/gi)){
  const tag=match[0];add(getAttr(tag,"src"),tag.includes('class="tb-cover"')?"cover":"inline",getAttr(tag,"alt"));
 }
 articles.push({slug,url,uses});
}
for(const a of assets.values()){
 try{
  const response=await fetch(a.url,{method:"GET",signal:AbortSignal.timeout(20000)});
  a.http=response.status;
  a.contentType=(response.headers.get("content-type")||"").split(";")[0];
  a.copyrightEvidence="none_supplied";
  a.licenseStatus="unverified";
  if(!response.ok){a.status="http_error";continue}
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length>12*1024*1024){a.status="too_large";continue}
  a.bytes=bytes.length;
  a.sha256=crypto.createHash("sha256").update(bytes).digest("hex");
  a.dimensions=dimensions(bytes);
  a.status=a.contentType.startsWith("image/")&&a.dimensions.type!=="unknown"?"image_confirmed":"review_type";
 }catch(error){a.status="request_error";a.errorClass=String(error?.name||"Error")}
}
const inventory=[...assets.values()];
const duplicateContent=inventory.flatMap((a,i)=>inventory.slice(i+1).filter(b=>a.sha256&&a.sha256===b.sha256).map(b=>({a:a.url,b:b.url,sha256:a.sha256})));
const report={checkedAt:new Date().toISOString(),scope:"Public HTTP GET of five article pages and observed images; no private data",
  articles,assets:inventory,duplicateContent,
  imageRightsVerified:false,legalStatus:"UNVERIFIED: a working image URL or a matching hash is not proof of right to publish"};
fs.mkdirSync("d2-audit-artifacts",{recursive:true});
fs.writeFileSync("d2-audit-artifacts/image-evidence.json",JSON.stringify(report,null,2));
console.log("D2_LIC_EVIDENCE",JSON.stringify({articleCount:articles.length,uniqueAssets:inventory.length,
  statuses:inventory.map(a=>({url:a.url,http:a.http||null,status:a.status,type:a.contentType||null,
    sha256:a.sha256||null,dimensions:a.dimensions||null})),
  imageRightsVerified:false}));
if(articles.length!==5||inventory.length<5)throw Error("Incomplete article image evidence, do not claim rights review");
console.log("D2_LIC_INVENTORY_CREATED; RIGHTS_NOT_VERIFIED, NO D1/R2 WRITES");
