// Browser QA of real A-D Admin UI with demo-only in-memory APIs.
// Every real /api or cross-origin HTTP request fails the test.
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
assert(fs.existsSync("public/admin-demo.html"),"Missing generated demo HTML");
assert(fs.existsSync("public/admin.html"),"Missing original Admin");
assert(!fs.readFileSync("public/admin.html","utf8").includes("admin-demo-runtime.js"),"Demo leaked into original Admin");
assert(fs.readFileSync("public/admin-demo.html","utf8").includes("admin-demo-runtime.js"),"Demo bootstrap not injected");
const ROOT="http://127.0.0.1:18971";
const server=spawn("python3",["-m","http.server","18971","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
const routes=["dashboard","posts","content","wiki","studio","beta","media","users","inbox","analytics","visitor-tracking","security","system"];
async function test(width){
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
 const attempts=[],errors=[];
 await context.route("**/*",r=>{
   const u=new URL(r.request().url());
   if(u.origin!==ROOT || u.pathname.startsWith("/api/")){
     attempts.push(r.request().method()+" "+r.request().url());
     return r.abort();
   }
   return r.continue();
 });
 const page=await context.newPage();
 page.on("pageerror",e=>errors.push(e.message));
 page.on("dialog",d=>d.accept());
 try {
  await page.goto(ROOT+"/admin-demo.html",{waitUntil:"domcontentloaded",timeout:25000});
  try {
   await page.waitForFunction(()=>{const app=document.getElementById("adminApp");return app&&!app.classList.contains("hidden");},undefined,{timeout:18000});
  } catch(e) {
   console.log("DEMO INIT DIAGNOSTIC",JSON.stringify(await page.evaluate(()=>({
    href:location.href,title:document.title,ready:document.readyState,
    body:document.body?.innerText.slice(0,1200),
    app:!!document.getElementById("adminApp"),
    appClass:document.getElementById("adminApp")?.className,
    login:!!document.getElementById("loginForm"),
    demo:!!window.__TRAININGBOT_DEMO__,
    scripts:[...document.scripts].map(x=>x.src||"inline").slice(0,15)
   })).catch(err=>({error:String(err)}))));
   console.log("DEMO PAGE ERRORS",JSON.stringify(errors));
   console.log("DEMO REAL NETWORK",JSON.stringify(attempts));
   throw e;
  }
  await page.waitForSelector("body.tb-admin-stage-d",{timeout:20000});
  await page.waitForSelector("#tbDemoBanner",{timeout:9000});
  await page.waitForFunction(()=>document.querySelectorAll("#sidebar .nav-item").length===13,undefined,{timeout:9000});
  assert.equal(await page.locator("#adminApp.hidden").count(),0);
  const names=await page.locator("#sidebar .nav-item").evaluateAll(nodes=>nodes.map(n=>n.id==="tbVisitorNav"?"visitor-tracking":n.dataset.view));
  assert.deepEqual(names,routes);
  const saved=await page.evaluate(()=>["tb-admin-center-token-v2","tb-admin-center-token-v1"].map(k=>sessionStorage.getItem(k)));
  assert(saved.every(x=>!x||x==="TRAININGBOT-DEMO-FAKE-NOT-A-CREDENTIAL"),"Unexpected persisted token");
  const testCtx=await page.evaluate(()=>window.__TRAININGBOT_DEMO__&&window.__TRAININGBOT_DEMO__.getPosts());
  assert.equal(testCtx.length,2);
  for(const name of routes){
    const nav=name==="visitor-tracking"?"#tbVisitorNav":'#sidebar .nav-item[data-view="'+name+'"]';
    await page.locator(nav).evaluate(el=>el.click());
    await page.waitForFunction(key=>document.querySelector('[data-view-panel="'+key+'"]')?.classList.contains("active"),name,{timeout:8500});
  }
  await page.locator('#sidebar .nav-item[data-view="posts"]').evaluate(el=>el.click());
  await page.waitForFunction(()=>document.querySelectorAll("#tbPostPublishedList .tb-post-row").length===2,undefined,{timeout:8000});
  await page.locator("#tbManualPostCreate").evaluate(el=>el.click());
  await page.locator("#tbPostTitle").fill("Bài Demo vừa lưu");
  await page.locator("#tbPostContent").fill("Nội dung giả để kiểm tra nút lưu nháp trong bản Preview Admin.");
  await page.locator("#tbPostDraftSubmit").evaluate(el=>el.click());
  await page.waitForFunction(()=>window.__TRAININGBOT_DEMO__.getPosts().length===3,undefined,{timeout:6000});
  const p=await page.evaluate(()=>window.__TRAININGBOT_DEMO__.getPosts()[0]);
  assert.equal(p.status,"draft");
  assert.equal(p.title,"Bài Demo vừa lưu");
  await page.locator('#sidebar .nav-item[data-view="beta"]').evaluate(el=>el.click());
  await page.waitForFunction(()=>document.querySelectorAll("#tbBetaList .tb-beta-row").length===2,undefined,{timeout:8500});
  await page.locator("#tbCBetaEditor summary").evaluate(el=>el.click());
  await page.locator("#tbBetaVersion").fill("V4.9.1");
  await page.locator("#tbBetaArch").fill("x64");
  await page.locator("#tbBetaSave").evaluate(el=>el.click());
  await page.waitForFunction(()=>window.__TRAININGBOT_DEMO__.getBetas().length===3,undefined,{timeout:9000});
  assert.equal((await page.evaluate(()=>window.__TRAININGBOT_DEMO__.getBetas()))[0].version,"V4.9.1");
  assert.equal(await page.locator("#tbDemoBanner").count(),1);
  const writes=await page.evaluate(()=>window.__TRAININGBOT_DEMO__.getWrites());
  assert(writes.some(x=>x.scope==="posts"&&x.method==="POST"),"Demo post write missing");
  assert(writes.some(x=>x.scope==="beta"&&x.method==="POST"),"Demo Beta write missing");
  assert.equal(attempts.length,0,"Actual HTTP API or external requests detected: "+attempts.join(" | "));
  assert.equal(errors.length,0,"Uncaught JS errors: "+errors.join(" | "));
  if(width===390||width===1440){
   fs.mkdirSync("admin-qa-screenshots",{recursive:true});
   await page.screenshot({path:"admin-qa-screenshots/admin-demo-"+width+".png",animations:"disabled"});
  }
  const dimensions=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  assert(dimensions.document<=width+8,"Demo horizontal overflow "+JSON.stringify(dimensions));
  await page.reload({waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>{const app=document.getElementById("adminApp");return app&&!app.classList.contains("hidden");},undefined,{timeout:22000});
  await page.waitForFunction(()=>!!window.__TRAININGBOT_DEMO__,undefined,{timeout:9000});
  assert.equal(await page.evaluate(()=>window.__TRAININGBOT_DEMO__.getPosts().length),2,"Demo data persisted after reload");
  assert.equal(attempts.length,0,"Actual network detected after reload: "+attempts.join(" | "));
  console.log("TRAININGBOT DEMO QA "+width+"px: 13 routes, auto-login, post draft, Beta update, reload reset, zero real API calls PASS");
 } finally {await context.close();}
}
try {
 await wait(800);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [390,1440])await test(width);
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
