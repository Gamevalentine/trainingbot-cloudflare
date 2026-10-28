// Admin V5 synthetic Preview QA, no credentials, no backend network or mutations.
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
const root="http://127.0.0.1:18998";
assert(fs.readFileSync("public/admin-demo.html","utf8").includes("admin-six-groups-v5.js"));
assert(!fs.readFileSync("public/admin.html","utf8").includes("admin-demo-runtime.js"));
const server=spawn("python3",["-m","http.server","18998","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let browser;
try{
 await sleep(850);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
  const requests=[],errors=[];
  await ctx.route("**/*",route=>{
   const url=new URL(route.request().url());
   if(url.origin!==root||url.pathname.startsWith("/api/")){
    if(!url.href.startsWith("https://fonts.googleapis.com/"))requests.push(route.request().method()+" "+url.href);
    return route.abort();
   }
   return route.continue();
  });
  const page=await ctx.newPage();page.on("pageerror",e=>errors.push(e.stack||e.message));
  try{
   await page.goto(root+"/admin-demo.html",{waitUntil:"domcontentloaded",timeout:27000});
   try{
    await page.waitForFunction(()=>{
      const a=document.getElementById("adminApp");
      return !!a&&!a.classList.contains("hidden")&&document.querySelectorAll("#tb5Categories button").length===6;
    },undefined,{timeout:12000});
   }catch(error){
    const state=await page.evaluate(()=>({
      title:document.title,body:document.body?.innerText.slice(0,600),classes:document.body?.className,
      app:document.getElementById("adminApp")?.className,
      nav:document.querySelectorAll("#tb5Categories button").length,
      demo:!!window.__TRAININGBOT_DEMO__,
      storage:sessionStorage.getItem("tb-admin-center-token-v2"),
      scripts:[...document.scripts].map(x=>x.src||"inline").slice(-12)
    })).catch(e=>({error:String(e)}));
    console.log("V5 DEMO DIAG",JSON.stringify({state,requests,errors}));
    throw error;
   }
   assert.equal(await page.locator("#tb5Categories .tb5-category").count(),6);
   assert.equal(await page.locator("#tbDemoBanner").count(),1,"Missing synthetic-only notice");
   await page.evaluate(()=>document.querySelector('#tb5Categories [data-tb5-group="content"]').click());
   await page.waitForFunction(()=>document.body.classList.contains("tb-admin-group-home")&&document.querySelectorAll(".tb5-function-card").length===5,undefined,{timeout:7000});
   if(width===390||width===1440){
    fs.mkdirSync("admin-qa-screenshots",{recursive:true});
    await page.screenshot({path:"admin-qa-screenshots/admin-v5-demo-"+width+".png",animations:"disabled"});
   }
   await page.evaluate(()=>document.querySelector('[data-tb5-route="posts"]').click());
   await page.waitForFunction(()=>document.querySelector('[data-view-panel="posts"]')?.classList.contains("active")&&!document.body.classList.contains("tb-admin-group-home"),undefined,{timeout:9000});
   const demo=await page.evaluate(()=>window.__TRAININGBOT_DEMO__&&({
    posts:window.__TRAININGBOT_DEMO__.getPosts().length,
    writes:window.__TRAININGBOT_DEMO__.getWrites().length
   }));
   assert.equal(demo.posts,2);
   assert.equal(demo.writes,0,"Demo mutated itself during navigation");
   assert.deepEqual(requests,[],"Real Admin API or external request attempted");
   assert.deepEqual(errors,[],"JavaScript error");
   console.log("Admin V5 synthetic Preview "+width+"px PASS: auto login, six groups, main area cards, zero API requests");
  }finally{await ctx.close();}
 }
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
