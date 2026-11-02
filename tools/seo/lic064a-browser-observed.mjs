// LIC-06.4A: supplemental local browser evidence from Production-shaped build.
// All API calls are mocked to avoid D1 schema DDL or writing. External requests
// are blocked; rendered DOM counts do not guarantee visibility on real Production.
import fs from "node:fs";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
const origin="http://127.0.0.1:19041",site="https://trainingbot.io.vn";
const routes=["/","/wiki.html","/ban-cap-nhat.html","/news.html","/news-esports.html"];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn("python3",["-m","http.server","19041","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
let browser;
const pages=[],found=new Map();
const resolve=v=>{
 try{
  const u=new URL(v,site);
  if(!["http:","https:"].includes(u.protocol)||!/\.(png|jpe?g|webp|gif|svg|avif|bmp|ico)$/i.test(u.pathname))return null;
  u.hash="";u.search="";
  if(u.hostname==="127.0.0.1"||u.hostname==="localhost")u.hostname="trainingbot.io.vn";
  return u.href;
 }catch{return null}
};
try{
 await sleep(800);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:"reduce"});
 await context.route("**/*",async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.pathname.startsWith("/api/")){
   const mock=url.pathname==="/api/posts"?{ok:true,posts:[]}:{ok:true,results:[],versions:[],items:[]};
   return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(mock)});
  }
  if(url.origin===origin)return route.continue();
  return route.abort();
 });
 for(const route of routes){
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(String(e.message).slice(0,160)));
  try{
   const response=await page.goto(origin+route,{waitUntil:"domcontentloaded",timeout:27000});
   await sleep(900);
   await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight/2));await sleep(250);
   await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await sleep(250);
   const sample=await page.evaluate(()=>{
    const out=[];
    const all=[...document.querySelectorAll("img,picture source")];
    for(const e of all){
     const style=getComputedStyle(e),rect=e.getBoundingClientRect();
     const visible=style.display!=="none"&&style.visibility!=="hidden"&&
       rect.width>0&&rect.height>0;
     const src=e.getAttribute("src")||e.getAttribute("data-src")||e.currentSrc||"";
     if(src)out.push({value:src,role:e.tagName.toLowerCase(),alt:(e.getAttribute("alt")||"").slice(0,90),visible});
     for(const candidate of (e.getAttribute("srcset")||"").split(",")){
      const next=candidate.trim().split(/\s+/)[0];if(next)out.push({value:next,role:"srcset",visible});
     }
    }
    for(const e of [...document.querySelectorAll("body *")].slice(0,2500)){
     const bg=getComputedStyle(e).backgroundImage;
     if(bg&&bg!=="none"){
      for(const match of bg.matchAll(/url\(["']?([^)"']+)["']?\)/g)){
       out.push({value:match[1],role:"computed_background",visible:e.getBoundingClientRect().width>0});
      }
     }
    }
    return {observed:out,countElements:all.length,scrollHeight:document.body.scrollHeight};
   });
   for(const item of sample.observed){
    const normalized=resolve(item.value.startsWith("/")?site+item.value:item.value.replace(origin,site));
    if(!normalized)continue;
    const rec=found.get(normalized)||{url:normalized,pages:[],roles:[],visibleEvidence:false};
    if(!rec.pages.includes(route))rec.pages.push(route);
    if(!rec.roles.includes(item.role))rec.roles.push(item.role);
    if(item.visible)rec.visibleEvidence=true;
    found.set(normalized,rec);
   }
   pages.push({route,http:response?.status()||null,domImageElements:sample.countElements,
     observedImageReferences:sample.observed.length,scrollHeight:sample.scrollHeight,pageErrors:errors});
  }catch(e){pages.push({route,http:null,error:String(e.message||e).slice(0,200),pageErrors:errors})}
  finally{await page.close()}
 }
}finally{
 if(browser)await browser.close();
 server.kill("SIGTERM");
}
const report={checkedAt:new Date().toISOString(),method:"Chromium local Production-shaped build with public API mocked and all external traffic blocked; no D1/R2 writes",
 pages,uniqueObservedImages:found.size,images:[...found.values()],
 limitations:[
  "This is local runtime DOM (not an authoritative snapshot of dynamic Production with actual /api/posts data).",
  "All API endpoints were mocked to prevent accidental D1 schema creation on GET.",
  "Third-party image bytes were not downloaded. visibleEvidence is CSS/box geometry only, not proof of actual image load or license.",
  "Other interactive states and mobile viewports may reveal additional images."
 ]};
fs.mkdirSync("lic064a-audit-artifacts",{recursive:true});
fs.writeFileSync("lic064a-audit-artifacts/browser-observed.json",JSON.stringify(report,null,2));
console.log("LIC064A_BROWSER_OBSERVED",JSON.stringify({
 pages:pages.map(x=>({route:x.route,http:x.http,imgElements:x.domImageElements,refs:x.observedImageReferences,errors:x.pageErrors?.length||0})),
 uniqueImageUrls:found.size,visibleGeometryEvidence:[...found.values()].filter(x=>x.visibleEvidence).length}));
if(pages.filter(p=>p.http===200).length<4)throw Error("LIC064A local DOM lacks four working core routes");
console.log("LIC064A_BROWSER_SAMPLE_PASS; API MOCKED; NO PRODUCTION D1/R2 WRITES");
