// H.2/H.3 local Chrome laboratory audit (NOT CrUX / not real-user CWV).
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
const root="http://127.0.0.1:18997";
const server=spawn("python3",["-m","http.server","18997","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let browser;
const report={method:"Chromium headless local build, no throttling, remote assets blocked, cache disabled per context; informational lab metrics, not field CWV",viewports:[],checkedAt:new Date().toISOString()};
try{
 await sleep(750);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:950},reducedMotion:"reduce"});
  const failures=[],attemptedRemote=[];
  await context.route("**/*",route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.pathname.startsWith("/api/"))return route.fulfill({status:200,contentType:"application/json",body:'{"ok":true}'});
   if(url.origin===root)return route.continue();
   attemptedRemote.push(url.hostname);return route.abort();
  });
  const page=await context.newPage();
  await page.addInitScript(()=>{
   window.__H_SHIFTS__=[];
   try{new PerformanceObserver(list=>{
    for(const e of list.getEntries()){
     if(e.hadRecentInput)continue;
     window.__H_SHIFTS__.push({value:Number(e.value.toFixed(4)),time:Math.round(e.startTime),
       sources:(e.sources||[]).slice(0,4).map(x=>({tag:x.node?.tagName||"",id:x.node?.id||"",className:typeof x.node?.className==="string"?x.node.className.slice(0,100):"",
         previous:{x:Math.round(x.previousRect.x),y:Math.round(x.previousRect.y),h:Math.round(x.previousRect.height)},
         current:{x:Math.round(x.currentRect.x),y:Math.round(x.currentRect.y),h:Math.round(x.currentRect.height)}}))});
    }
   }).observe({type:"layout-shift",buffered:true})}catch(_){}
  });
  page.on("pageerror",e=>failures.push(e.message));
  try{
   const response=await page.goto(root+"/wiki.html",{waitUntil:"domcontentloaded",timeout:29000});
   assert.equal(response.status(),200);
   await page.waitForFunction(()=>window.__TB_WIKI_H__?.ready&&window.__TB_WIKI_F__?.ready&&window.__TB_WIKI_E__?.ready,undefined,{timeout:25000});
   await sleep(500);
   const before=await page.evaluate(()=>{
    const h=window.__TB_WIKI_H__;
    const nav=performance.getEntriesByType("navigation")[0];
    return {fcp:h.metrics.fcp,lcp:h.metrics.lcp,cls:h.metrics.cls,longTasks:h.metrics.longTasks,
      domContentLoaded:Math.round(nav.domContentLoadedEventEnd),load:Math.round(nav.loadEventEnd),
      resourceCount:performance.getEntriesByType("resource").length,
      cards:document.querySelectorAll("#tbWikiGrid .tb-wiki-card").length,
      imagesPrepared:h.imagesPrepared,
      documentWidth:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth};
   });
   assert(before.documentWidth<=width+7,"Horizontal overflow "+width+" "+JSON.stringify(before));
   assert(before.cards>=8&&before.imagesPrepared>=0,"Wiki baseline not rendered");
   assert(before.fcp!==null&&before.fcp>=0,"First contentful paint missing");
   assert(before.cls<=0.1,"H quality gate: lab CLS must be <=0.1 at "+width+"px, got "+before.cls);
   assert(before.domContentLoaded>=0&&before.load>=0);
   // H.3 keyboard/interaction sample is a scripted local response time, NOT INP.
   const t0=Date.now();
   await page.locator("#tbFGuides .tb-f-toggle").click();
   await page.waitForFunction(()=>document.getElementById("tbFContent")?.hidden===false);
   const responseMs=Date.now()-t0;
   await page.locator('#tbFGuides .tb-f-category[data-category="maps"]').click();
   assert.equal(await page.locator("#tbFGuides .tb-f-card:visible").count(),4);
   await page.waitForFunction(()=>{
    const imgs=[...document.querySelectorAll("#tbWikiGrid .tb-wiki-card img")];
    return imgs.every((x,i)=>x.dataset.tbHImage==="1"&&x.loading===(i<4?"eager":"lazy"));
   },undefined,{timeout:8000});
   const f=await page.evaluate(()=>{
    window.__TB_WIKI_H__.reconcile(); // same JavaScript task as the snapshot
    const active=document.querySelector('#tbFGuides .tb-f-category[data-category="maps"]');
    const label=document.querySelector("#tbFGuides .tb-f-search");
    const img=[...document.querySelectorAll("#tbWikiGrid .tb-wiki-card img")];
    return {selection:active?.getAttribute("aria-pressed"),searchLabel:label?.getAttribute("aria-label"),
      eager:img.filter(x=>x.loading==="eager").length,lazy:img.filter(x=>x.loading==="lazy").length,
      hinted:img.filter(x=>x.dataset.tbHImage==="1").length,imagesNow:img.length,
      missingAlt:[...document.querySelectorAll("#tbFGuides img")].filter(x=>!x.hasAttribute("alt")).length};
   });
   assert.equal(f.selection,"true");
   assert(f.searchLabel&&f.missingAlt===0);
   assert(f.eager<=4,"More than four eager card images");
   assert.equal(f.eager+f.lazy,f.imagesNow,"Each current image must have a loading strategy");
   assert.equal(f.hinted,f.imagesNow,"All current images must be processed by H");
   assert(before.imagesPrepared>=f.imagesNow,"Cumulative image processing must cover current render");
   assert.deepEqual(failures,[],"Unexpected runtime errors");
   const shifts=await page.evaluate(()=>window.__H_SHIFTS__||[]);
   console.log("WIKI H "+width+" layout-shift attribution "+JSON.stringify(shifts.sort((a,b)=>b.value-a.value).slice(0,8)));
   const row={width,...before,interactionResponseMs:responseMs,images:f,remoteAssetAttemptCount:attemptedRemote.length,largestShifts:shifts.slice(0,8)};
   report.viewports.push(row);
   console.log("WIKI H "+width+" PASS: FCP="+before.fcp+"ms LCP="+before.lcp+"ms CLS="+before.cls+"; image hints "+f.lazy+" lazy/"+f.eager+" eager; no overflow");
   fs.mkdirSync("wiki-stage-h-artifacts",{recursive:true});
   await page.screenshot({path:"wiki-stage-h-artifacts/wiki-"+width+".png",animations:"disabled"});
  }finally{await context.close()}
 }
}finally{
 if(browser)await browser.close();
 server.kill("SIGTERM");
 fs.mkdirSync("wiki-stage-h-artifacts",{recursive:true});
 fs.writeFileSync("wiki-stage-h-artifacts/lab-metrics.json",JSON.stringify(report,null,2));
}
