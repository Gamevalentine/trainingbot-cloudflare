// LIC-06.4B: read-only verification of exactly the 13 unverified media URLs
// observed in public article/site HTML by LIC-06.4A.
// Do not fetch /api/posts (legacy GET may initiate schema setup on D1).
import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
const inventory=JSON.parse(fs.readFileSync("lic064a-audit-artifacts/sitewide-assets.json","utf8"));
const candidates=inventory.assets.filter(a=>a.visibility==="live_html"&&a.rights==="UNVERIFIED");
assert.equal(candidates.length,13,"The 13-file LIC-06.4A observed HTML scope drifted; review BEFORE probing");
const maxBytes=8*1024*1024; // stop early on unusually large media
const previouslyRetiredImageHash="e80a02798aeb6098aa8d364e06ada9d948f119d7dae6a4c01860aa11663283ca";
const retryable=new Set([408,425,429,500,502,503,504]);
const allowedHost=new Set(["trainingbot.io.vn","trainingbot-cloudflare.pages.dev"]);
const safe=(url)=>{
 try{const u=new URL(url);
  if(u.protocol!=="https:"||!allowedHost.has(u.hostname)||u.username||u.password||u.port)return false;
  return true;
 }catch{return false}
};
const headerSubset=res=>Object.fromEntries(
 ["content-type","content-length","cache-control","etag","last-modified","cf-cache-status",
  "location","x-robots-tag","server","access-control-allow-origin"]
  .map(h=>[h,res.headers.get(h)]).filter(([,v])=>v!==null));
const dimension=(bytes,type)=>{
 if(bytes.length>25&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
  return {format:"png",width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
 if(bytes.length>30&&bytes.toString("ascii",0,4)==="RIFF"&&bytes.toString("ascii",8,12)==="WEBP"){
  if(bytes.toString("ascii",12,16)==="VP8X")
   return {format:"webp",width:bytes.readUIntLE(24,3)+1,height:bytes.readUIntLE(27,3)+1};
  return {format:"webp",width:null,height:null};
 }
 if(bytes.length>5&&bytes[0]===255&&bytes[1]===216)return {format:"jpeg",width:null,height:null};
 const prefix=bytes.subarray(0,512).toString("utf8").trimStart();
 if(type.includes("svg")||prefix.startsWith("<svg")||prefix.startsWith("<?xml"))
  return {format:"svg",width:null,height:null};
 return {format:"unrecognized",width:null,height:null};
};
async function limitedRead(res){
 const len=Number(res.headers.get("content-length"));
 if(Number.isFinite(len)&&len>maxBytes)return {skipped:"length_above_cap",headerBytes:len};
 const reader=res.body?.getReader();if(!reader)return {skipped:"missing_body"};
 let chunks=[],size=0;
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   size+=value.length;
   if(size>maxBytes){await reader.cancel();return {skipped:"stream_over_cap",minimumBytes:size}}
   chunks.push(Buffer.from(value));
  }
 }finally{try{reader.releaseLock()}catch{}}
 return {bytes:Buffer.concat(chunks)};
}
const results=[];
for(const item of candidates){
 const url=item.url,record={url,path:item.pathname,rightsStatus:"UNVERIFIED",
  observedFrom:item.uses.filter(u=>u.mode==="live_public_html").map(u=>({page:u.from,role:u.role})),
  referenceCount:item.uses.length,method:"public HTTP HEAD+GET, no body rewrite"};
 if(!safe(url)){record.status="not_probed_unsafe_endpoint";results.push(record);continue}
 let head;
 try{
  head=await fetch(url,{method:"HEAD",redirect:"manual",cache:"no-store",signal:AbortSignal.timeout(14000)});
  record.head={status:head.status,headers:headerSubset(head)};
 }catch(error){record.head={error:String(error?.name||"RequestError")}}
 try{
  const response=await fetch(url,{method:"GET",redirect:"manual",cache:"no-store",
   headers:{Accept:"image/avif,image/webp,image/png,image/jpeg,image/svg+xml,image/*"},
   signal:AbortSignal.timeout(18000)});
  record.get={status:response.status,headers:headerSubset(response)};
  if([301,302,303,307,308].includes(response.status)){
   const loc=response.headers.get("location");record.redirect={location:loc};
   record.status=loc?"redirect_not_downloaded":"redirect_without_location";
   record.hostOfFinalImage="not_confirmed_redirect_unfollowed";
  }else if(response.ok){
   const type=(response.headers.get("content-type")||"").toLowerCase().split(";")[0];
   if(!type.startsWith("image/")){
    record.status="non_image_content_type_no_body_download"; // HTML error/login should not be hashed as media
   }else{
    const read=await limitedRead(response);
    if(read.bytes){
     record.bytes=read.bytes.length;
     record.sha256=crypto.createHash("sha256").update(read.bytes).digest("hex");
     record.format=dimension(read.bytes,type);
     const extension=record.path.split(".").pop()?.toLowerCase();
     const extensionFormat=extension==="jpg"?"jpeg":extension;
     record.extensionContentMismatch=Boolean(extensionFormat&&record.format.format!=="unrecognized"&&
       record.format.format!==extensionFormat);
     record.duplicatesRetiredLegacyImage=record.sha256===previouslyRetiredImageHash;
     if(record.format.format==="svg"){
      const str=read.bytes.toString("utf8");
      record.svgExternalLinks=/\b(?:href|xlink:href)\s*=\s*["']https?:\/\//i.test(str)||
        /<image\b/i.test(str)||/@import\b/i.test(str);
     }
     record.status="retrieved_image_bytes";
    }else{record.status="body_skipped_"+read.skipped;record.byteLimit=maxBytes}
   }
  }else record.status=retryable.has(response.status)?"retryable_http_error":"http_error";
 }catch(error){record.status="request_error";record.error=String(error?.name||"RequestError")}
 record.originPath="first_party_pages_or_r2_override_unconfirmed";
 record.rightsEvidenceProvided=false;
 results.push(record);
 // Log each exact media URL with result, not contents or credentials.
 console.log("LIC064B_MEDIA",JSON.stringify({
  url:record.url,status:record.status,head:record.head?.status,get:record.get?.status,
  type:record.get?.headers?.["content-type"],bytes:record.bytes||null,
  sha256:record.sha256||null,redirect:record.redirect?.location||null,
  originPath:record.originPath,extensionContentMismatch:record.extensionContentMismatch||false,
  duplicatesRetiredLegacyImage:record.duplicatesRetiredLegacyImage||false}));
}
const issues=results.filter(r=>r.status==="request_error"||r.status==="non_image_content_type_no_body_download"||
 r.status==="http_error"||r.status==="retryable_http_error"||r.status.startsWith("body_skipped"));
const counts={retrieved:results.filter(r=>r.status==="retrieved_image_bytes").length,
 redirect:results.filter(r=>r.status==="redirect_not_downloaded").length,
 errorOrSkipped:issues.length,
 extensionMismatch:results.filter(r=>r.extensionContentMismatch).length,
 legacyDuplicatesStillPublic:results.filter(r=>r.duplicatesRetiredLegacyImage).length,
 licenseVerified:0};
const report={checkedAt:new Date().toISOString(),task:"LIC-06.4B/first_party_live_html",
 scope:"Exactly 13 live-public-HTML assets without licensing evidence from LIC-06.4A; public first-party HTTP only; no D1/R2 API",
 totals:{assets:results.length,...counts},
 results,limitations:[
  "A first-party URL/HTTP 200 does not establish the original author, permission, or provenance.",
  "HEAD and GET may differ under cache, region or Pages/R2 middleware; response headers cannot prove physical storage origin.",
  "No redirect followed, no unlisted CDN domains probed, no D1/R2 bucket list, no /api/posts GET, no data writes.",
  "Maximum GET body 8 MiB. Non-image responses are recorded as issues, not mistaken for JPEG/PNG.",
  "Original license and reuse terms must be audited in LIC-06.4C."
 ]};
fs.mkdirSync("lic064b-audit-artifacts",{recursive:true});
fs.writeFileSync("lic064b-audit-artifacts/13-live-media-technical.json",JSON.stringify(report,null,2));
const esc=x=>'"'+String(x??"").replace(/"/g,'""')+'"';
const rows=[["url","http_head","http_get","content_type","bytes","sha256","status","referenced_pages","redirect_to"],
 ...results.map(r=>[r.url,r.head?.status||r.head?.error||"",r.get?.status||"",r.get?.headers?.["content-type"]||"",
  r.bytes||"",r.sha256||"",r.status,r.observedFrom.map(x=>x.page).join("; "),r.redirect?.location||""])];
fs.writeFileSync("lic064b-audit-artifacts/13-live-media-technical.csv",rows.map(row=>row.map(esc).join(",")).join("\n")+"\n");
console.log("LIC064B_13_MEDIA_SUMMARY",JSON.stringify(report.totals));
console.log("LIC064B_FLAGGED_MEDIA",JSON.stringify(results.filter(r=>r.extensionContentMismatch||r.duplicatesRetiredLegacyImage)
 .map(r=>({url:r.url,sha256:r.sha256,mime:r.get?.headers?.["content-type"],format:r.format,
  extensionMismatch:r.extensionContentMismatch||false,retiredLegacyDuplicate:r.duplicatesRetiredLegacyImage||false}))));
assert.equal(results.length,13);
if(results.filter(r=>r.status==="request_error").length>5)throw Error("Too many first-party image request errors; incomplete media audit");
console.log("LIC064B_13_MEDIA_MEASURED_READ_ONLY; COPYRIGHT_STATUS_REMAINS_UNVERIFIED");
