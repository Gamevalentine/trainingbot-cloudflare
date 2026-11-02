// LIC-06.4A: read-only, source-backed media inventory across built public files
// and live public HTML including all D1 articles in public article sitemap.
// A source-code literal does not prove its image is visibly rendered.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const domain="https://trainingbot.io.vn",runtime="https://trainingbot-cloudflare.pages.dev";
const imageExt=/\.(png|jpe?g|webp|gif|svg|avif|bmp|ico)$/i;
const ownArt=["erangel","beta-47","m416-glacier","midnight-hunters","one-punch-man","trainingbot-share"];
const retiredPaths=new Set([
"/news-pubg-mobile-4-6-cover.webp",
"/user-posts/pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay--1790303973793.jpg",
"/user-posts/pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam--1790048495762.jpg",
"/user-posts/pubg-mobile-4-6-chinh-thuc-cap-nhat-hom-nay-midnight-hunters-da-den-tay--1788837512881.png",
"/user-posts/pubg-mobile-one-punch-man-chinh-thuc-duoc-cong-bo-saitama-do-bo-erangel--1788593701812.jpg"
]);
const media=new Map(),pages=[],warnings=[];
const stats={files:0,html:0,css:0,js:0,legacyFiles:0,privateFilesExcluded:0};
const attr=(tag,name)=>tag.match(new RegExp("(?:^|\\s)"+name+"\\s*=\\s*([\"'])(.*?)\\1","is"))?.[2]||"";
function urlFor(raw,base=domain+"/"){
 let s=String(raw||"").trim().replace(/&amp;/g,"&");
 if(!s||s.startsWith("data:")||s.startsWith("blob:")||s.includes("$"+"{")||s.includes("{"+ "{"))return null;
 if(s.startsWith("//"))s="https:"+s;
 try{
  const u=new URL(s,base);
  if(!["http:","https:"].includes(u.protocol)||!imageExt.test(u.pathname))return null;
  u.search="";u.hash="";
  if(u.hostname==="trainingbot-cloudflare.pages.dev")u.hostname="trainingbot.io.vn";
  return u.href;
 }catch{return null}
}
function add(raw,role,from,mode,base=domain+"/"){
 const url=urlFor(raw,base);if(!url)return;
 const u=new URL(url);
 let rec=media.get(url);
 if(!rec)rec={url,hostname:u.hostname,pathname:u.pathname,uses:[],modes:[],rights:"UNVERIFIED",provenance:"unverified"};
 if(rec.uses.length<100)rec.uses.push({role,from,mode});
 if(!rec.modes.includes(mode))rec.modes.push(mode);
 if(ownArt.some(id=>u.pathname==="/editorial-original-"+id+".png"||u.pathname==="/editorial-original-"+id+".svg")){
  rec.provenance="self_authored_in_repo_code";rec.rights="ORIGINAL_CREATION_EVIDENCE_NEEDS_REVIEW";
 }else if(retiredPaths.has(u.pathname)&&u.hostname==="trainingbot.io.vn"){
  rec.provenance="legacy_retired_public_redirect";rec.rights="UNVERIFIED";
 }
 media.set(url,rec);
}
function inspectHtml(html,where,mode,base){
 for(const m of html.matchAll(/<(img|source)\b[^>]*>/gi)){
  const tag=m[0],el=m[1].toLowerCase();
  for(const key of ["src","data-src","data-original"])add(attr(tag,key),el+"_"+key,where,mode,base);
  for(const srcset of [attr(tag,"srcset"),attr(tag,"data-srcset")]){
   if(srcset)for(const v of srcset.split(","))add(v.trim().split(/\s+/)[0],el+"_srcset",where,mode,base);
  }
 }
 for(const m of html.matchAll(/<meta\b[^>]*>/gi)){
  const prop=(attr(m[0],"property")||attr(m[0],"name")).toLowerCase();
  if(["og:image","twitter:image","og:image:secure_url"].includes(prop))
   add(attr(m[0],"content"),"seo_"+prop,where,mode,base);
 }
 for(const m of html.matchAll(/<link\b[^>]*>/gi)){
  const rel=attr(m[0],"rel").toLowerCase();
  if(/icon|preload/.test(rel))add(attr(m[0],"href"),"linked_"+rel,where,mode,base);
 }
 for(const m of html.matchAll(/url\(\s*["']?([^)"']+)["']?\s*\)/gi))
  add(m[1],"css_url",where,mode,base);
 for(const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  let j;try{j=JSON.parse(m[1])}catch{warnings.push({where,reason:"invalid_jsonld"});continue}
  const walkVal=(v,depth=0)=>{
   if(depth>12)return;
   if(typeof v==="string")add(v,"jsonld_image_candidate",where,mode,base);
   else if(Array.isArray(v))for(const x of v)walkVal(x,depth+1);
   else if(v&&typeof v==="object")for(const x of Object.values(v))walkVal(x,depth+1);
  };walkVal(j);
 }
}
function inspectSource(source,where,mode){
 // Literal paths in JavaScript and CSS are CANDIDATES, not runtime proof.
 const pattern=/(https?:\/\/[^\s"'<>()[\]]+|(?:\/|\.\/|\.\.\/)[a-z0-9_./%-]+)\.(?:png|jpe?g|webp|gif|svg|avif|bmp|ico)(?:\?[a-z0-9=&%._-]+)?/gi;
 for(const m of source.matchAll(pattern))add(m[0],"literal_image_candidate",where,mode);
 for(const m of source.matchAll(/url\(\s*["']?([^)"']+)["']?\s*\)/gi))
  add(m[1],"css_url_candidate",where,mode);
}
const walkFiles=folder=>fs.readdirSync(folder,{withFileTypes:true}).flatMap(e=>{
 const p=path.join(folder,e.name);return e.isDirectory()?walkFiles(p):[p]});
for(const file of walkFiles("public")){
 if(!/\.(html|css|js|json)$/i.test(file)||fs.statSync(file).size>3*1024*1024)continue;
 const rel=path.relative("public",file).split(path.sep).join("/");
 if(/^(admin(?:\/|[-._])|contact-inbox|account(?:\.|\/))/i.test(rel)){stats.privateFilesExcluded++;continue}
 const isLegacy=/^(mobile\/|mobile_recovered_v79\/|wiki_recovered\/)/.test(rel);
 const ext=path.extname(rel).slice(1),text=fs.readFileSync(file,"utf8");
 stats.files++;stats[ext]=(stats[ext]||0)+1;if(isLegacy)stats.legacyFiles++;
 if(ext==="html")inspectHtml(text,rel,isLegacy?"legacy_built_html":"built_html",domain+"/"+rel);
 else if(ext==="css"||ext==="js")inspectSource(text,rel,isLegacy?"legacy_source_candidate":"source_candidate");
}
const routes=["/","/wiki","/ban-cap-nhat","/news","/news-versions","/news-esports","/news-community","/community","/contact"];
const get=async url=>{
 const r=await fetch(url,{method:"GET",headers:{Accept:"text/html"},cache:"no-store",signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error("HTTP "+r.status+" "+url);
 return r.text();
};
let articleRoutes=[];
try{
 const xml=await get(runtime+"/sitemap-posts.xml");
 articleRoutes=[...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m=>{
  try{return new URL(m[1].replace(/&amp;/g,"&")).pathname}catch{return null}
 }).filter(x=>x&&/^\/bai-viet\/[a-z0-9-]+$/i.test(x)))];
 if(articleRoutes.length===0)warnings.push({where:"/sitemap-posts.xml",reason:"empty"});
}catch(e){warnings.push({where:"/sitemap-posts.xml",reason:String(e.message||e).slice(0,150)})}
for(const route of [...routes,...articleRoutes.slice(0,100)]){
 try{
  const html=await get(runtime+route);
  inspectHtml(html,route,"live_public_html",domain+route);
  pages.push({route,http:200,imgTags:[...html.matchAll(/<img\b/gi)].length,
   potentiallyAsync:["/","/wiki","/news","/ban-cap-nhat"].includes(route)});
 }catch(e){pages.push({route,http:null,error:String(e.message||e).slice(0,150)})}
}
const assets=[...media.values()].sort((a,b)=>a.url.localeCompare(b.url));
const roles={};
for(const a of assets){
 for(const u of a.uses)roles[u.role]=(roles[u.role]||0)+1;
 a.visibility=a.modes.includes("live_public_html")?"live_html":
  a.modes.some(x=>x.includes("built_html"))?"built_html_only":"source_candidate_only";
}
const summary={
 checkedAt:new Date().toISOString(),scope:"LIC-06.4A static Production build + public GET nine core routes and sitemap-listed D1 HTML",
 coverage:{...stats,livePages:pages.length,liveOk:pages.filter(x=>x.http===200).length,articleRoutes:articleRoutes.length},
 uniqueMedia:assets.length,uses:assets.reduce((n,a)=>n+a.uses.length,0),
 liveHtmlMedia:assets.filter(x=>x.visibility==="live_html").length,
 sourceOnlyCandidates:assets.filter(x=>x.visibility==="source_candidate_only").length,
 newOriginalArt:assets.filter(x=>x.provenance==="self_authored_in_repo_code").length,
 unverifiedRights:assets.filter(x=>x.rights==="UNVERIFIED").length,
 hosts:[...new Set(assets.map(x=>x.hostname))].sort(),roles,
 warnings,limitations:[
 "Dynamic JavaScript and image API feeds can render additional assets; literal references are candidates, not proof of actual display.",
 "No GET /api/posts because it may run compatibility CREATE TABLE even on GET; use sitemap/article HTML instead.",
 "Public HTML does not prove images were painted or visible above the fold; browser-rendered QA is a separate pass.",
 "No D1/R2/Cloudflare private API writes or raw bucket inventory; a public URL/hash is never copyright permission.",
 "Restricted Admin/private pages deliberately excluded, legacy public pages retained as separate candidates.",
 "This is a bounded inventory, not a claim to have audited every user-generated/private or external CDN asset."
 ]};
fs.mkdirSync("lic064a-audit-artifacts",{recursive:true});
fs.writeFileSync("lic064a-audit-artifacts/sitewide-assets.json",JSON.stringify({summary,pages,assets},null,2));
const csv=s=>'"'+String(s??"").replace(/"/g,'""')+'"';
fs.writeFileSync("lic064a-audit-artifacts/sitewide-assets.csv",
 ["url,visibility,host,provenance,rights,occurrences,sample_paths",
 ...assets.map(a=>[a.url,a.visibility,a.hostname,a.provenance,a.rights,a.uses.length,
   a.uses.slice(0,5).map(x=>x.from+" ["+x.role+"]").join("; ")].map(csv).join(","))].join("\n")+"\n");
console.log("LIC064A_IMAGE_INVENTORY",JSON.stringify(summary));
console.log("LIC064A_TOP_20",JSON.stringify(assets.slice().sort((a,b)=>b.uses.length-a.uses.length).slice(0,20).map(a=>({url:a.url,uses:a.uses.length,origin:a.provenance}))));
assert(pages.filter(x=>x.http===200).length>=9,"Must verify at least 9 public routes via HTTP 200");
assert(assets.length>0,"No media assets found: inventory failed");
console.log("LIC064A_STATIC_LIVE_PASS; CANDIDATES_NOT_AUTOMATICALLY_LICENSED; NO_D1_R2_WRITES");
