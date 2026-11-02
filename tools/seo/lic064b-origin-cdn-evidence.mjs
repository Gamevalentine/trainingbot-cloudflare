// LIC-06.4B hosting lineage: repository-evidenced routes only.
// Do not guess or probe R2 bucket names, private endpoints or unlisted domains.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const inventory=JSON.parse(fs.readFileSync("lic064a-audit-artifacts/sitewide-assets.json","utf8"));
const all=inventory.assets;
const live=all.filter(a=>a.visibility==="live_html"&&a.rights==="UNVERIFIED");
assert.equal(live.length,13);
const external=all.filter(a=>a.hostname!=="trainingbot.io.vn");
const sourceOnlyExternal=external.filter(a=>a.visibility==="source_candidate_only");
const domains=[...new Set(external.map(x=>x.hostname))].sort();
const anchors=["functions/_middleware.js","functions/api/posts.js","build.sh","postbuild.sh",
 ".github/workflows/trainingbot-lic063-retired-media.yml","docs/seo/lic063-reversible-media-retirement-20261102.md"];
const content=Object.fromEntries(anchors.map(file=>[file,fs.existsSync(file)?fs.readFileSync(file,"utf8"):""]));
const middleware=content["functions/_middleware.js"];
const verifiedLogic={
 middlewareExists:Boolean(middleware),
 imageMethodGate:/IMAGE_PATH/.test(middleware)&&/request\.method/.test(middleware),
 r2BindingName:/env\.VIDEO_BUCKET/.test(middleware)?"VIDEO_BUCKET":null,
 r2ObjectKeyPrefix:/site-overrides\//.test(middleware)?"site-overrides/":null,
 sourceOfImagePath:"functions/_middleware.js",
 previewReadThroughSource:"functions/_middleware.js",
 previewReadThroughSupported:/PUBLIC_POST_IMAGE/.test(middleware)&&/previewPublicReadOnly/.test(middleware),
 retiredMediaSource:"functions/_middleware.js",
 retiredMediaCheckedBeforeR2:/const retired=retiredPublicImage/.test(middleware)&&
  middleware.indexOf("const retired=retiredPublicImage")<middleware.indexOf("env.VIDEO_BUCKET"),
 hasPublicR2CustomDomainConfiguredInRepo:null
};
assert(verifiedLogic.middlewareExists&&verifiedLogic.r2BindingName&&verifiedLogic.r2ObjectKeyPrefix,
 "Could not trace R2 route to exact code; must not assert storage path");
const safeExtensions=new Set([".toml",".json",".jsonc",".js",".mjs",".yml",".yaml",".md",".sh",".txt"]);
const skip=/^(?:\.git|node_modules|public|source_parts|\.cf_unpack|lic\d+.*artifacts|wiki-.*artifacts|seo-.*artifacts)$/;
const walk=folder=>fs.readdirSync(folder,{withFileTypes:true}).flatMap(e=>{
 if(e.isDirectory()){
  if(skip.test(e.name))return [];
  return walk(path.join(folder,e.name));
 }
 return [path.join(folder,e.name)];
});
const inspected=[],r2DomainMentions=[];
for(const file of walk(".")){
 const rel=file.replace(/^\.\//,""),ext=path.extname(file);
 if(!safeExtensions.has(ext)||fs.statSync(file).size>1500000)continue;
 if(/(?:\.env|secret|token|credential|private-key|node_modules|package-lock)/i.test(rel))continue;
 inspected.push(rel);
 const text=fs.readFileSync(file,"utf8");
 const urls=[...text.matchAll(/https?:\/\/[a-z0-9.-]+\.(?:r2\.dev|cloudflarestorage\.com|pages\.dev)(?:\/[^\s"'<>]*)?/gi)];
 const domainsFound=[...new Set(urls.map(m=>{try{return new URL(m[0]).hostname}catch{return null}}).filter(Boolean))];
 if(domainsFound.length)r2DomainMentions.push({file:rel,hosts:domainsFound});
}
const candidatesByDomain=domains.map(host=>({
 host,pathsFound:external.filter(x=>x.hostname===host).length,
 onlySourceCandidates:external.filter(x=>x.hostname===host).every(x=>x.visibility==="source_candidate_only"),
 directlyObservedInLiveHtml:external.filter(x=>x.hostname===host&&x.visibility==="live_html").length
}));
const report={checkedAt:new Date().toISOString(),scope:"Repo config / Cloudflare Pages middleware review, no external probing",
 routing:verifiedLogic,repositoryEvidenceFiles:inspected.length,externalImageCandidates:candidatesByDomain,
 externalTotal:external.length,sourceOnlyExternalCandidates:sourceOnlyExternal.length,
 explicitlyReferencedR2OrPagesHosts:r2DomainMentions,
 assessment:{
  canonicalImagesMayBeServedByR2Override:true,
  locationOfR2ObjectProved:"keyFor(path) => site-overrides/<encoded path>, ONLY WHEN VIDEO_BUCKET binding exists at runtime",
  publicR2CustomDomainConfirmed:false,
  publicR2DomainAbsenceConfirmed:false,
  reason:"A source-level R2 binding does not expose public bucket settings or independently hosted custom domains. Account-side verification is required to resolve unknowns.",
  noUnlistedHostProbed:true
 },limitations:[
  "No Cloudflare account or R2 bucket-list access. An absent endpoint in repository does not rule out a custom CDN in account settings.",
  "External domains found only in JS/CSS source are candidates; no hotlink traffic proof.",
  "Could not use image file bytes or HEAD headers to prove which storage backend served the response.",
  "No guessing or testing private bucket names, credentials or custom endpoint candidates."
 ]};
fs.mkdirSync("lic064b-audit-artifacts",{recursive:true});
fs.writeFileSync("lic064b-audit-artifacts/routing-and-external-domains.json",JSON.stringify(report,null,2));
console.log("LIC064B_ORIGIN_EVIDENCE",JSON.stringify({
 r2Binding:report.routing.r2BindingName,keyPrefix:report.routing.r2ObjectKeyPrefix,
 previewReadThrough:report.routing.previewReadThroughSupported,
 retiredBeforeR2:report.routing.retiredMediaCheckedBeforeR2,
 externalDomains:report.externalImageCandidates,independentR2PublicDomainConfirmed:false,
 sourceFilesInspected:report.repositoryEvidenceFiles
}));
console.log("LIC064B_CDN_CONFIG_REVIEW_PASS; NO ENDPOINT GUESSES; NO D1_R2_WRITES");
