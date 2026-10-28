// TrainingBot /ban-cap-nhat: real content + responsive browser verification.
// Static local build, synthetic API responses; never touches production.
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
const root="http://127.0.0.1:18985";
const html=fs.readFileSync("public/ban-cap-nhat.html","utf8");
const update=fs.readFileSync("public/updates.html","utf8");
assert(update.includes("updates-content-v204.css"),"updates source lost the new content stylesheet");
for(const id of ["tb-game-release-help","tb-site-changelog","tb-beta-faq-title","tb-beta-versions","updates-content-v204.css"]){
 assert(html.includes(id),"Missing "+id);
}
for(const text of ["Kho Wiki và tra cứu","Kiểm tra trước khi tải</h3>","Nguồn tệp và tính toàn vẹn</h3>","Thống kê lượt tải</h3>"]){
 assert(!html.includes(text),"Irrelevant old text remains: "+text);
}
const versions=[
 {id:"r1",version:"V4.6.1",major:"V4.6",arch:"x64",status:"released",download_url:"https://example.invalid/a.apk"},
 {id:"r2",version:"V4.7.3",major:"V4.7",arch:"x64",status:"released",download_url:"https://example.invalid/b.apk"},
 {id:"r3",version:"V4.7.4",major:"V4.7",arch:"x64",status:"coming_soon",download_url:""}
];
const server=spawn("python3",["-m","http.server","18985","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let browser;
try{
 await delay(850);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [390,768,1440]){
  const ctx=await browser.newContext({viewport:{width,height:880},reducedMotion:"reduce"});
  let apiReads=0;const apiWrites=[],errors=[],external=[];
  await ctx.route("**/*",route=>{
   const req=route.request(),url=new URL(req.url()),p=url.pathname;
   if(p.startsWith("/api/")){
    if(req.method()!=="GET")apiWrites.push({method:req.method(),path:p});
    apiReads++;
    if(p==="/api/beta-versions")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ok:true,versions})});
    if(p==="/api/beta-download-counts")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ok:true,counts:{"V4.7.3":28,"V4.6.1":17}})});
    return route.fulfill({status:200,contentType:"application/json",body:'{"ok":true}'});
   }
   if(url.origin===root)return route.continue();
   external.push(req.url());return route.abort();
  });
  const page=await ctx.newPage();page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.goto(root+"/ban-cap-nhat.html",{waitUntil:"domcontentloaded",timeout:20000});
   await page.waitForFunction(()=>document.querySelector(".release-hero .version-row h1")?.textContent==="V4.7.3",undefined,{timeout:10000});
   const hero=page.locator(".release-hero .hero-actions .btn.primary");
   assert.equal(await hero.getAttribute("href"),"/download/beta/V4.7.3");
   const majors=await page.locator(".beta-version-list button[data-beta-major]").count();
   assert(majors>=2,"Version selector missing");
   assert.equal(await page.locator("#tb-game-release-help .tb-update-step").count(),3);
   assert.equal(await page.locator("#tb-site-changelog .tb-site-log-entry").count(),1);
   assert.equal(await page.locator("#tb-game-release-help .tb-update-sidecard").count(),2);
   assert.equal(await page.locator("#tb-game-release-help details:not([open])").count(),1,"Hash proof should be collapsed by default");
   assert.equal(await page.locator("#tb-site-changelog details:not([open])").count(),1);
   const guide=page.locator("#tb-game-release-help");
   await guide.scrollIntoViewIfNeeded();
   const display=await guide.evaluate(el=>({head:getComputedStyle(el.querySelector(".tb-update-grid")).display,font:getComputedStyle(el.querySelector(".tb-update-step p")).fontSize,loaded:[...document.styleSheets].some(s=>s.href?.includes("updates-content-v204.css"))}));
   assert(display.loaded&&display.head==="grid","Guide is not new responsive layout "+JSON.stringify(display));
   assert(parseFloat(display.font)>=12,"Guide text unreadable "+JSON.stringify(display));
   const disclosure=page.locator("#tb-game-release-help .tb-update-sidecard details");
   await disclosure.locator("summary").evaluate(el=>el.click());
   assert.equal(await disclosure.getAttribute("open"),"");
   assert((await disclosure.innerText()).includes("ed378dbb55351d9d7ce627aa160e8682e502562a97d6b9810385a7099e6f56c3"));
   await page.locator("#tb-site-changelog summary").evaluate(el=>el.click());
   assert.equal(await page.locator("#tb-site-changelog details").getAttribute("open"),"");
   assert((await page.locator("#tb-site-changelog").innerText()).includes("28/10/2026"));
   await page.locator('.beta-version-list button[data-beta-major="4.7"]').evaluate(el=>el.click());
   const shown=await page.locator(".beta-build-group:not([hidden]) .beta-build-card").count();
   assert(shown>=2,"Current version list unavailable");
   assert.equal(await page.locator('.beta-build-group:not([hidden]) a[href="/download/beta/V4.7.3"]').count(),1);
   await page.locator("#tb-game-release-help").scrollIntoViewIfNeeded();
   const widthStatus=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
   assert(widthStatus.doc<=width+5,"Horizontal overflow "+JSON.stringify(widthStatus));
   if(width===390||width===1440){
    fs.mkdirSync("update-qa-screenshots",{recursive:true});
    await page.screenshot({path:"update-qa-screenshots/updates-guide-"+width+".png",animations:"disabled"});
   }
   assert(apiWrites.every(x=>x.method==="POST"&&x.path==="/api/visitor-events"),"Unexpected public write requests "+JSON.stringify(apiWrites)); // Pre-existing anonymous visit telemetry is mocked locally.
   assert(apiReads>=2,"API data not loaded");
   assert(external.every(url=>url.startsWith("https://fonts.googleapis.com/")||url.startsWith("https://fonts.gstatic.com/")),"Unexpected cross-origin "+JSON.stringify(external));
   assert.deepEqual(errors,[],"JS errors");
   console.log("Updates content "+width+"px: real steps, hash disclosure, factual website log, latest downloadable version, no write PASS");
  }finally{await ctx.close();}
 }
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
