// ADM-02–05 local smoke test. No admin login, API write or production call.
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawn} from "node:child_process";
import {chromium} from "playwright";

const html=fs.readFileSync("public/admin.html","utf8");
assert(html.includes("admin-rework-v1.js"),"Generated Admin loader missed enhancement");
assert(!fs.existsSync(".github/workflows/trainingbot-d1-encrypted-backup.yml"),
  "Stopped backup workflow must never be restored");
const base="http://127.0.0.1:18794";
const server=spawn("python3",["-m","http.server","18794","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let browser;
try{
 await sleep(850);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}});
  const page=await context.newPage();
  let writes=0;
  await page.route("**/*",route=>{
   const url=route.request().url();
   if(route.request().method()!=="GET"&&route.request().method()!=="HEAD")writes++;
   if(url.startsWith(base)&&!url.includes("/api/"))return route.continue();
   if(url.includes("/api/"))return route.fulfill({status:401,contentType:"application/json",body:'{"ok":false,"message":"Unauthorized"}'});
   return route.abort();
  });
  await page.goto(base+"/admin.html",{waitUntil:"domcontentloaded",timeout:20000});
  await page.waitForSelector("body.tb-admin-reworked",{state:"attached",timeout:20000});
  const nav=await page.locator("#sidebar .nav-item").evaluateAll(items=>items.map(x=>x.dataset.view));
  assert.deepEqual(nav,["dashboard","posts","content","wiki","beta","media","users","inbox","analytics","security","system"],
   "Navigation omitted a legacy destination");
  const labels=await page.locator(".side-nav>.tb-admin-group-title").allTextContents();
  assert.deepEqual(labels,["TỔNG QUAN","NỘI DUNG","THƯ VIỆN","CỘNG ĐỒNG","THỐNG KÊ","CÀI ĐẶT"]);
  assert.equal(await page.locator('#sidebar .nav-item[data-view="studio"]').count(),0);
  assert.equal(await page.locator('[data-view-panel="studio"]').count(),1,"Studio legacy editor route must remain intact");
  assert.equal(await page.locator(".command-hero").count()>0,true,"Legacy source unexpectedly changed");
  assert.equal(await page.locator(".tb-admin-beta-panel").count(),1);
  await page.waitForSelector(".tb-admin-beta-panel #tbBetaForm",{state:"attached",timeout:12000});
  assert.equal(await page.locator('[data-view-panel="content"] #tbBetaForm').count(),0,"Beta form still on page content");
  assert.equal(await page.locator(".tb-admin-beta-editor:not([open])").count(),1,"Beta editor should start collapsed");
  const betaStatus=await page.locator("#tbBetaStatus").innerText();
  assert(betaStatus.includes("Chưa đăng nhập"),"Missing session should not be described as expired");
  await page.evaluate(()=>{
   document.getElementById("adminApp")?.classList.remove("hidden");
   document.getElementById("loginScreen")?.classList.add("hidden");
  });
  await page.evaluate(()=>document.querySelector('#sidebar [data-view="beta"]')?.click());
  assert.equal(await page.locator('[data-view-panel="beta"].active').count(),1);
  assert.equal(await page.locator("#pageTitle").innerText(),"Phiên bản Beta");
  assert.equal(await page.locator('[data-view-panel="content"] #tbBetaForm').count(),0);
  assert.equal(writes,0,"Audit tried a real write");
  await context.close();
  console.log("ADM-02–05 local readonly nav, preserved Studio, Beta isolation and no-session UI: PASS "+width+"px");
 }
}finally{if(browser)await browser.close();server.kill("SIGTERM");}