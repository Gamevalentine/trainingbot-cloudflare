// TrainingBot Stage B (ADM-02+03): full local browser acceptance.
// Runs against the original protected Admin runtime, fake GET-only API responses,
// original dynamic Posts and Visitor Tracking menu injections, without real data.
import fs from "node:fs";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {chromium} from "playwright";

const HOST="http://127.0.0.1:18871";
const UI="public/admin-stage-b-ui.js";
for(const path of ["public/admin.html",UI,"public/admin_posts_manual_v171.js",
 "public/admin_visitor_tracking_v177.js","public/admin_beta_versions_v175.js"])
 assert(fs.existsSync(path),"Missing Admin build artifact "+path);
const html=fs.readFileSync("public/admin.html","utf8");
assert(html.includes("admin-stage-b-ui.js"),"Admin loader missing Stage B UI script");
assert(!html.includes("admin-rework-v1.js"),"Stage B must not reintroduce PR #8 out-of-scope changes");
assert(!fs.existsSync(".github/workflows/trainingbot-d1-encrypted-backup.yml"),
 "Owner stopped D1 backups; forbidden workflow present");
const server=spawn("python3",["-m","http.server","18871","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
const expected=["dashboard","posts","content","wiki","studio","media",
 "users","inbox","analytics","visitor-tracking","security","system"];
const groups=["TỔNG QUAN","NỘI DUNG","THƯ VIỆN","CỘNG ĐỒNG","THỐNG KÊ","CÀI ĐẶT"];
async function viewportCheck(width){
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
 const page=await context.newPage();
 const bad=[],actions={apiReads:0,networkWrites:0,externalBlocked:0};
 page.on("pageerror",error=>bad.push(String(error).slice(0,280)));
 await context.route("**/*",route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname;
  if(req.method()!=="GET"&&req.method()!=="HEAD"){
   actions.networkWrites++;return route.abort();
  }
  if(path.startsWith("/api/")){
   actions.apiReads++;
   const token=req.headers()["authorization"];
   if(token!=="Bearer LOCAL-ADMIN-B-STAGE-TEST")return route.fulfill({
    status:401,contentType:"application/json",body:'{"ok":false,"message":"Unauthorized"}'});
   if(path.includes("/users"))return route.fulfill({status:200,contentType:"application/json",
    body:'{"ok":true,"users":[],"stats":{"total":8,"active_24h":2,"active_7d":4,"new_today":1}}'});
   if(path.includes("admin-contacts"))return route.fulfill({status:200,contentType:"application/json",
    body:'{"ok":true,"messages":[],"counts":{"total":0,"unread":0,"read":0,"replied":0}}'});
   if(path.includes("beta-versions"))return route.fulfill({status:200,contentType:"application/json",body:'{"ok":true,"versions":[]}'});
   if(path.includes("posts"))return route.fulfill({status:200,contentType:"application/json",body:'{"ok":true,"posts":[]}'});
   if(path.includes("visitor-events"))return route.fulfill({status:200,contentType:"application/json",
    body:'{"ok":true,"summary":{"today_visitors":0,"today_sessions":0,"online_visitors":0},"sessions":[],"devices":[],"oses":[]}'});
   return route.fulfill({status:200,contentType:"application/json",
    body:'{"ok":true,"changes":[],"page":"/index.html"}'});
  }
  if(req.url().startsWith(HOST))return route.continue();
  actions.externalBlocked++;return route.abort();
 });
 try{
  await page.goto(HOST+"/admin.html",{waitUntil:"domcontentloaded",timeout:18000});
  await page.waitForSelector("body.tb-admin-stage-b",{state:"attached",timeout:20000});
  await page.waitForFunction(()=>document.querySelectorAll("#sidebar .tb-admin-b-group").length===6,undefined,{timeout:9000});
  await page.waitForFunction(()=>document.getElementById("tbVisitorNav")&&document.querySelector('#sidebar .nav-item[data-view="posts"]'),undefined,{timeout:9000});
  const actual=await page.locator("#sidebar .nav-item").evaluateAll(nodes=>nodes.map(node=>node.id==="tbVisitorNav"?"visitor-tracking":node.dataset.view));
  assert.deepEqual(actual,expected,"Missing/reordered Admin destinations: "+width);
  assert.deepEqual(await page.locator("#sidebar .tb-admin-b-group").allTextContents(),groups);
  assert.equal(await page.locator("#sidebar .nav-item").count(),new Set(actual).size,"Duplicate navigation buttons");
  for(const key of expected){
   assert.equal(await page.locator('.view[data-view-panel="'+key+'"]').count(),1,"Legacy view removed "+key);
  }
  // Beta stays in Content in Stage B (separate Beta page belongs to Stage C).
  assert.equal(await page.locator('[data-view-panel="content"] #tbBetaForm').count(),1);
  assert.equal(await page.locator('.view[data-view-panel="beta"]').count(),0);

  // Protected state is retained — never render Admin as logged-in before login.
  assert.equal(await page.locator("#adminApp.hidden").count(),1,"Admin became public before authorization");
  await page.locator("#adminToken").fill("LOCAL-ADMIN-B-STAGE-TEST");
  await page.locator('#loginForm button[type="submit"]').click();
  await page.waitForSelector("#adminApp:not(.hidden)",{timeout:13000});
  await page.waitForFunction(()=>document.getElementById("kpiUsers")?.textContent==="8",undefined,{timeout:9000});
  if(width===390||width===1440){
   fs.mkdirSync("admin-qa-screenshots",{recursive:true});
   await page.screenshot({path:"admin-qa-screenshots/stage-b-dashboard-"+width+".png",animations:"disabled"});
  }

  const menuToggle=page.locator("#openSidebar");
  if(await menuToggle.isVisible())await menuToggle.click();
  await page.locator('#sidebar .nav-item[data-view="content"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-view-panel="content"]')?.classList.contains("active"),undefined,{timeout:6000});
  await page.waitForFunction(()=>document.getElementById("pageEyebrow")?.textContent==="NỘI DUNG",undefined,{timeout:5000});
  assert.equal(await page.locator("#pageEyebrow").textContent(),"NỘI DUNG");
  assert.equal(await page.locator('#sidebar .nav-item[data-view="content"]').getAttribute("aria-current"),"page");

  // Preserve original Studio route with functional edit actions.
  await page.locator('#sidebar .nav-item[data-view="studio"]').evaluate(node=>node.click());
  await page.waitForFunction(()=>document.querySelector('[data-view-panel="studio"]')?.classList.contains("active"),undefined,{timeout:5000});
  await page.waitForFunction(()=>document.getElementById("pageEyebrow")?.textContent==="NỘI DUNG",undefined,{timeout:5000});
  assert.equal(await page.locator("#pageEyebrow").textContent(),"NỘI DUNG");

  // Legacy Visitor Tracking custom click handler must survive DOM moving.
  await page.locator("#tbVisitorNav").evaluate(node=>node.click());
  await page.waitForFunction(()=>document.querySelector('[data-view-panel="visitor-tracking"]')?.classList.contains("active"),undefined,{timeout:5000});
  await page.waitForFunction(()=>document.getElementById("pageEyebrow")?.textContent==="THỐNG KÊ",undefined,{timeout:5000});
  assert.equal(await page.locator("#pageEyebrow").textContent(),"THỐNG KÊ");
  assert.equal(new URL(page.url()).hash,"#visitor-tracking");

  // Browser Back and Forward should restore an actual active panel, not just URL.
  await page.evaluate(()=>history.back());
  await page.waitForFunction(()=>location.hash==="#studio"&&document.querySelector('[data-view-panel="studio"]')?.classList.contains("active"),undefined,{timeout:7000});
  await page.evaluate(()=>history.forward());
  await page.waitForFunction(()=>location.hash==="#visitor-tracking"&&document.querySelector('[data-view-panel="visitor-tracking"]')?.classList.contains("active"),undefined,{timeout:7000});

  // Keyboard navigation through the same original button.
  if(await page.locator("#openSidebar").isVisible())await page.locator("#openSidebar").click();
  await page.locator('#sidebar .nav-item[data-view="users"]').focus();
  assert.equal(await page.locator('#sidebar .nav-item[data-view="users"]').evaluate(el=>document.activeElement===el),true,"Keyboard focus did not reach Users");
  await page.keyboard.press("Enter");
  await page.waitForFunction(()=>document.querySelector('[data-view-panel="users"]')?.classList.contains("active"),undefined,{timeout:7000});
  await page.waitForFunction(()=>document.getElementById("pageEyebrow")?.textContent==="CỘNG ĐỒNG",undefined,{timeout:5000});
  assert.equal(await page.locator("#pageEyebrow").textContent(),"CỘNG ĐỒNG");

  // Exhaustively activate all 12 retained destinations (incl. two injected
  // by legacy modules) using their ORIGINAL buttons and handlers.
  for(const key of expected){
   const selector=key==="visitor-tracking"?"#tbVisitorNav":'#sidebar .nav-item[data-view="'+key+'"]';
   await page.locator(selector).evaluate(el=>el.click());
   await page.waitForFunction(k=>document.querySelector('.view[data-view-panel="'+k+'"]')?.classList.contains("active"),key,{timeout:7000});
   assert.equal(new URL(page.url()).hash,"#"+key,"Wrong hash for "+key);
  }
  await page.waitForFunction(()=>document.getElementById("pageTitle")?.textContent==="Hệ thống",undefined,{timeout:5000});

  // The accessible skip control moves focus without corrupting route hash.
  const oldHash=new URL(page.url()).hash;
  await page.locator("#tbAdminStageBSkip").evaluate(el=>el.click());
  assert.equal(await page.locator("#tbAdminStageBMain").evaluate(el=>document.activeElement===el),true);
  assert.equal(new URL(page.url()).hash,oldHash);

  if(await page.locator("#openSidebar").isVisible()){
   await page.locator("#openSidebar").click();
   await page.keyboard.press("Escape");
   const sidebarState=await page.evaluate(()=>({
    cls:document.getElementById("sidebar").className,
    backdrop:document.getElementById("sidebarBackdrop").className
   }));
   assert(!/\bopen\b/.test(sidebarState.cls),"Escape did not close mobile sidebar "+JSON.stringify(sidebarState));
  }
  const dims=await page.evaluate(()=>({
   viewport:document.documentElement.clientWidth,
   document:document.documentElement.scrollWidth,
   body:document.body.scrollWidth
  }));
  assert(dims.document<=width+5,"Horizontal overflow "+width+": "+JSON.stringify(dims));
  if(width===1440){
   const direct=await context.newPage();
   await direct.goto(HOST+"/admin.html#posts",{waitUntil:"domcontentloaded",timeout:18000});
   await direct.waitForSelector("#loginForm",{state:"visible",timeout:15000});
   await direct.locator("#adminToken").fill("LOCAL-ADMIN-B-STAGE-TEST");
   await direct.locator('#loginForm button[type="submit"]').click();
   await direct.waitForFunction(()=>document.querySelector('[data-view-panel="posts"]')?.classList.contains("active"),undefined,{timeout:6500}).catch(async error=>{
    const detail=await direct.evaluate(()=>({hash:location.hash,adminVisible:!document.getElementById("adminApp")?.classList.contains("hidden"),active:[...document.querySelectorAll(".view.active")].map(x=>x.dataset.viewPanel),postsPanel:!!document.querySelector('[data-view-panel="posts"]'),postsNav:!!document.querySelector('[data-view="posts"]'),title:document.getElementById("pageTitle")?.textContent,stageB:document.body.classList.contains("tb-admin-stage-b"),navReady:document.querySelector("#sidebar .side-nav")?.dataset.stageB,loginNotice:document.getElementById("loginNotice")?.textContent}));
    throw new Error("ADM-B deep-link diagnostics: "+JSON.stringify(detail)+"; "+String(error));
   });
   await direct.waitForFunction(()=>document.getElementById("pageTitle")?.textContent==="Bài viết",undefined,{timeout:7000});
   assert.equal(await direct.locator("#pageEyebrow").textContent(),"NỘI DUNG");
   await direct.close();
  }
  assert.equal(actions.networkWrites,0,"Stage B QA attempted a real mutation");
  assert(actions.apiReads>0,"Admin login did not use mocked GET");
  assert(!bad.length,"Browser errors "+JSON.stringify(bad));
  console.log("ADM-02/03 six groups, 12 routes, history, keyboard, login, responsive "+width+"px PASS; no mutations");
 }finally{await context.close();}
}
try{
 await sleep(800);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [360,390,768,1024,1440])await viewportCheck(width);
 console.log("ADMIN STAGE B: FULL LOCAL QA PASS — no production request or D1 write");
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
