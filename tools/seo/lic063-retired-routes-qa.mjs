// LIC-06.3: deterministic tests for five exact-path, reversible redirects.
// No R2/D1 mutations and no broader restriction of other images or articles.
import assert from "node:assert/strict";
import fs from "node:fs";
const source=fs.readFileSync("functions/_middleware.js","utf8");
const {onRequest}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));
const targets=[
 "/news-pubg-mobile-4-6-cover.webp",
 "/user-posts/pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay--1790303973793.jpg",
 "/user-posts/pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam--1790048495762.jpg",
 "/user-posts/pubg-mobile-4-6-chinh-thuc-cap-nhat-hom-nay-midnight-hunters-da-den-tay--1788837512881.png",
 "/user-posts/pubg-mobile-one-punch-man-chinh-thuc-duoc-cong-bo-saitama-do-bo-erangel--1788593701812.jpg"
];
const target="https://trainingbot.io.vn/editorial-original-trainingbot-share.png";
assert(!/\b(?:\.put\s*\(|\.delete\s*\(|\.write\s*\(|\.run\s*\()\b/.test(source),
 "Middleware must not write R2/D1 while handling retired image requests");
let bucketReads=0,nextCalls=0;
const env={VIDEO_BUCKET:{
 async get(){bucketReads++;return null},
 async head(){bucketReads++;return null}
}};
async function request(host,path,method="GET"){
 const url="https://"+host+path;
 const req=new Request(url,{method});
 const res=await onRequest({request:req,env,next:async()=>{nextCalls++;return new Response("unchanged",{status:200})}});
 return res;
}
for(const host of ["trainingbot.io.vn","trainingbot-cloudflare.pages.dev","lic063.trainingbot-cloudflare.pages.dev"]){
 for(const path of targets){
  for(const method of ["GET","HEAD"]){
   const res=await request(host,path,method);
   assert.equal(res.status,302,host+" "+method+" "+path);
   assert.equal(res.headers.get("location"),target);
   assert.equal(res.headers.get("cache-control"),"no-store");
   assert.match(res.headers.get("x-robots-tag")||"",/noindex/i);
   assert.equal((await res.arrayBuffer()).byteLength,0,"No old image body allowed");
  }
 }
}
const encoded=await request("trainingbot.io.vn",targets[1].replace("/user-posts","/%75ser-posts"));
assert.equal(encoded.status,302,"Encoded path variant must not bypass exact retirement");
for(const unscoped of [
 "/editorial-original-trainingbot-share.png",
 "/editorial-original-erangel.svg",
 "/user-posts/different-preserved.jpg",
 "/wiki",
 "/news"
]){
 const res=await request("trainingbot.io.vn",unscoped);
 assert.equal(res.status,200,"Unscoped path changed: "+unscoped);
 assert.equal(await res.text(),"unchanged");
}
assert.equal(bucketReads,0,"No media bucket access needed for retired redirects in mock");
assert.equal(nextCalls,5,"Only non-target routes may reach normal middleware");
console.log("LIC063_ROUTE_GATE_QA_PASS",JSON.stringify({
 retiredAssets:targets.length,origins:3,methods:["GET","HEAD"],
 imageBodyExposed:false,redirect:target,cache:"no-store",
 unscopedRoutesPreserved:5,d1Writes:0,r2Writes:0}));
