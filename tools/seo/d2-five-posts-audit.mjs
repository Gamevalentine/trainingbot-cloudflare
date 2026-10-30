// D2.2 read-only audit of the five already-published editorial pages.
// Runs with public HTTP GET only; never accesses private D1 data or credentials.
import assert from "node:assert/strict";
import fs from "node:fs";
const host="https://trainingbot-cloudflare.pages.dev";
const branded="https://trainingbot.io.vn";
const posts=[
 {id:"erangel",slug:"battlegrounds-mo-rong-erangel-subzero-trong-pubg-mobile-bgmi-voi-ban-beta-4-7-2",sourceDomains:["www.pubg.com","www.pubgmobile.com"]},
 {id:"beta_47",slug:"pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y",sourceDomains:["www.pubgmobile.com"]},
 {id:"m416",slug:"pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam-van-cho-thong-tin",sourceDomains:["www.dearplayers.com"]},
 {id:"midnight_46",slug:"pubg-mobile-4-6-chinh-thuc-cap-nhat-hom-nay-midnight-hunters-da-den-tay-nguoi-choi",sourceDomains:["pubgm.vnggames.com"]},
 {id:"one_punch_man",slug:"pubg-mobile-one-punch-man-chinh-thuc-duoc-cong-bo-saitama-do-bo-erangel-tu-ngay-20-9",sourceDomains:["onepunchman-anime.net"]}
];
const extract=(html,rx)=>String(html.match(rx)?.[1]||"");
const decode=s=>s.replaceAll("&amp;","&").replaceAll("&quot;",'"').replaceAll("&#039;","'");
const results=[];
for(const p of posts){
 const path="/bai-viet/"+p.slug;
 let result={id:p.id,slug:p.slug,publicUrl:branded+path,httpStatus:null,
  canonicalCorrect:false,sourcePanelPresent:false,expectedSourceDomains:[],sourceDomainsMissing:[],
  metadataTitle:null,coverImage:null,shareImage:null,imageLicenseStatus:"unverified",
  imageOriginStatus:"unverified",notes:[]};
 try{
  const response=await fetch(host+path,{method:"GET",headers:{Accept:"text/html"},signal:AbortSignal.timeout(20000)});
  result.httpStatus=response.status;
  if(!response.ok){result.notes.push("Public Pages origin not HTTP 200");results.push(result);continue}
  const html=await response.text();
  const canonical=decode(extract(html,/<link\s+rel="canonical"\s+href="([^"]+)"/i));
  result.canonicalCorrect=canonical===result.publicUrl;
  result.metadataTitle=decode(extract(html,/<meta\s+property="og:title"\s+content="([^"]+)"/i));
  result.sourcePanelPresent=html.includes("tb-source-verification");
  result.coverImage=decode(extract(html,/<img\s+class="tb-cover"\s+src="([^"]+)"/i))||null;
  result.shareImage=decode(extract(html,/<meta\s+property="og:image"\s+content="([^"]+)"/i))||null;
  result.expectedSourceDomains=p.sourceDomains;
  result.sourceDomainsMissing=p.sourceDomains.filter(domain=>!html.includes(domain));
  if(p.id==="erangel")result.correctedHeading=html.includes("ĐÍNH CHÍNH: Erangel Subzero của PUBG Mobile Beta 4.7 khác PUBG PC Update 39.2");
  if(result.coverImage)result.notes.push("Cover image has not been mapped to an explicit rights/license record");
  if(result.shareImage)result.notes.push("OpenGraph image is not proof of reuse permission");
  if(!result.sourcePanelPresent)result.notes.push("No visible verified-source panel");
 }catch(error){result.notes.push("Request failed: "+String(error?.name||"Error"))}
 results.push(result);
}
const technicalPass=results.every(p=>p.httpStatus===200&&p.canonicalCorrect&&p.sourcePanelPresent&&
 p.sourceDomainsMissing.length===0&&p.metadataTitle?.length>8&&
 (p.id!=="erangel"||p.correctedHeading===true));
const rightsVerified=results.every(p=>p.imageLicenseStatus==="verified");
const report={checkedAt:new Date().toISOString(),scope:"Public Pages GET only",technicalPass,rightsVerified,
 rightsReviewRequired:!rightsVerified,posts:results};
fs.mkdirSync("d2-audit-artifacts",{recursive:true});
fs.writeFileSync("d2-audit-artifacts/five-posts.json",JSON.stringify(report,null,2));
console.log("D2_FIVE_POSTS_PUBLIC_AUDIT",JSON.stringify(report));
if(!technicalPass)throw Error("D2 five-post technical or source evidence QA failed");
console.log("D2_FIVE_POST_TECHNICAL_PASS; IMAGE_LICENSE_UNVERIFIED (not a rights clearance)");
