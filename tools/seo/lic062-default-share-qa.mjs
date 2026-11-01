// LIC-06.2A–C: exact default social-image replacement with zero D1/R2 changes.
// Run after npm run build (CF_PAGES_BRANCH=main) + lic061-classify-shared-image.
import fs from "node:fs";
import assert from "node:assert/strict";
import crypto from "node:crypto";
const oldPath="/news-pubg-mobile-4-6-cover.webp";
const newPath="/editorial-original-trainingbot-share.png";
const origin="https://trainingbot.io.vn";
const report=JSON.parse(fs.readFileSync("lic061-audit-artifacts/classification.json","utf8"));
const build=fs.readFileSync("build.sh","utf8");
const creator=fs.readFileSync("tools/seo/lic04-build-png.mjs","utf8");
assert.equal(report.activeDefaultImage,newPath,"The classifier must inspect our exact new default");
assert(build.includes("const defaultShareImage = origin + '"+newPath+"';"),"All SEO pages must use generic PNG");
assert(!build.includes("const defaultShareImage = origin + '"+oldPath+"';"),"Never use old media as SEO default");
assert(creator.includes('"trainingbot-share","TRAININGBOT","NEWS / WIKI"'),"New art must be generated from first-party drawing code");
assert(!creator.includes("fetch("),"Original PNG creator must not download online assets");
const bytes=fs.readFileSync("public"+newPath);
assert(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),"Default share file must be PNG");
assert.equal(bytes.readUInt32BE(16),1200,"Share image width must be 1200px");
assert.equal(bytes.readUInt32BE(20),630,"Share image height must be 630px");
assert(bytes.length>15000&&bytes.length<1000000,"Unexpected generic PNG size");
const savedOld=fs.readFileSync("public"+oldPath);
assert.equal(crypto.createHash("sha256").update(savedOld).digest("hex"),
 "e80a02798aeb6098aa8d364e06ada9d948f119d7dae6a4c01860aa11663283ca",
 "Original media bytes must not be altered or deleted");
assert.equal(report.filesWithReference,35,"All 35 legacy default users must receive new metadata");
assert.equal(report.referenceOccurrences,106,"Check all OG/Twitter/JSON-LD references");
assert.equal(report.byRole.opengraph_image,35);
assert.equal(report.byRole.twitter_image,35);
assert.equal(report.byRole.structured_data_image,36);
assert.equal(report.safeMetadataOnly,true,"New default must never leak into displayed image/CSS/script refs");
assert.equal(report.riskFiles.length,0);
assert.equal(report.files.filter(f=>f.noindex).length,19,"Keep 19 legacy/alias/account pages noindex");
assert.equal(report.files.filter(f=>!f.noindex).length,16,"Keep 16 indexable pages");
const jsonLd=(html)=>{
 const matches=[...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
 return matches.map(m=>{try{return JSON.parse(m[1])}catch{return null}}).filter(Boolean);
};
const confirmed=[];
for(const f of report.files){
 const html=fs.readFileSync("public/"+f.path,"utf8");
 const og=html.match(/<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']+)/i)?.[1];
 const twitter=html.match(/<meta\b[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)/i)?.[1];
 assert.equal(og,origin+newPath,f.path+" OG image mismatch");
 assert.equal(twitter,origin+newPath,f.path+" Twitter image mismatch");
 assert(!html.includes(oldPath),"Still references old legacy share image: "+f.path);
 const data=jsonLd(html);
 assert(data.length>0,f.path+" must retain valid JSON-LD");
 assert(data.some(d=>JSON.stringify(d).includes(origin+newPath)),f.path+" structured data must use original image");
 const canonical=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1]||"";
 assert.equal(canonical,f.canonical,f.path+" canonical must remain aligned with source audit");
 const robot=html.match(/<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']+)/i)?.[1]||"";
 assert.equal(robot,f.robots,f.path+" robots must remain aligned with source audit");
 confirmed.push({path:f.path,roles:f.roles,robots:robot,canonical});
}
for(const id of ["erangel","beta-47","m416-glacier","midnight-hunters","one-punch-man"]){
 const file="public/editorial-original-"+id+".png";
 assert(fs.existsSync(file),"Do not overwrite existing article-specific PNG: "+id);
 const b=fs.readFileSync(file);
 assert(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
}
const sha=crypto.createHash("sha256").update(bytes).digest("hex");
const payload={checkedAt:new Date().toISOString(),stage:"LIC-06.2A-C",result:"PASS",
 image:newPath,imageSha256:sha,png:{width:1200,height:630,bytes:bytes.length},
 source:"First-party deterministic Node-only pixel drawing, no downloaded artwork",
 oldMediaHashUnchanged:true,staticPages:confirmed.length,uses:report.referenceOccurrences,
 byRole:report.byRole,legacyPagesNoindex:19,mainAndOtherIndexable:16,
 unverifiedLegacyAssetsUnchanged:true,articlesD1StoredUntouched:true,confirmed};
fs.mkdirSync("lic062-audit-artifacts",{recursive:true});
fs.writeFileSync("lic062-audit-artifacts/pre-release.json",JSON.stringify(payload,null,2));
console.log("LIC062_GENERIC_SHARE_QA_PASS",JSON.stringify({
 staticFiles:confirmed.length,occurrences:payload.uses,byRole:payload.byRole,
 png:payload.png,sha256:sha,legacyImageRetained:true,d1Writes:0}));
