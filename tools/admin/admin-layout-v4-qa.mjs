// Structural Admin V4 browser QA — local site, synthetic Admin API only.
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
const root="http://127.0.0.1:18993";
const names=["dashboard","posts","content","wiki","studio","beta","media","users","inbox","analytics","visitor-tracking","security","system"];
assert(fs.readFileSync("public/admin.html","utf8").includes("admin-layout-v4.js"));
assert(fs.existsSync("public/admin-layout-v4.css")&&!fs.existsSync("public/admin-demo.html"));
const server=spawn("python3",["-m","http.server","18993","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
try{
 await delay(900);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [390,768,1440]){
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
  let writes=0;const external=[],errors=[];
  await ctx.route("**/*",route=>{
   const req=route.request(),url=new URL(req.url()),path=url.pathname;
   const respond=data=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(data)});
   if(path.startsWith("/api/")){
    if(!["GET","HEAD"].includes(req.method()))writes++;
    if(path.includes("admin/users"))return respond({ok:true,users:[],stats:{total:2,active_24h:1,active_7d:1,new_today:0}});
    if(path.includes("admin-contacts"))return respond({ok:true,messages:[],counts:{total:0,unread:0,read:0,replied:0}});
    if(path.includes("posts"))return respond({ok:true,posts:[]});
    if(path.includes("beta-versions"))return respond({ok:true,versions:[]});
    if(path.includes("visitor-events"))return respond({ok:true,summary:{today_visitors:0,today_sessions:0,online_visitors:0,online_sessions:0},sessions:[]});
    return respond({ok:true,changes:[],page:"/index.html"});
   }
   if(url.origin===root)return route.continue();
   external.push(req.url());return route.abort();
  });
  const p=await ctx.newPage();
  p.on("pageerror",e=>errors.push(e.message));
  const press=selector=>p.evaluate(s=>{const n=document.querySelector(s);if(!n)throw Error("Missing "+s);n.click();},selector);
  try{
   await p.goto(root+"/admin.html",{waitUntil:"domcontentloaded",timeout:25000});
   await p.waitForFunction(()=>document.body.classList.contains("tb-admin-v4")&&!!document.getElementById("tb4Home"),undefined,{timeout:20000});
   assert.equal(await p.locator("#adminApp.hidden").count(),1);
   await p.locator("#adminToken").fill("V4_MOCK_AUTH");
   await press('#loginForm button[type="submit"]');
   await p.waitForFunction(()=>!document.getElementById("adminApp")?.classList.contains("hidden"),undefined,{timeout:16000});
   await p.waitForFunction(()=>document.querySelectorAll("#sidebar .nav-item").length===13,undefined,{timeout:8500});
   const keys=await p.evaluate(()=>[...document.querySelectorAll("#sidebar .nav-item")].map(n=>n.id==="tbVisitorNav"?"visitor-tracking":n.dataset.view));
   assert.deepEqual(keys,names);
   assert.equal(await p.locator("#tb4GroupNav button").count(),6);
   assert.equal(await p.locator("#tb4Modules button").count(),6);
   assert.equal(await p.locator("#tb4Home .kpi").count(),4);
   assert.equal(await p.locator("#tb4Home .dash-grid").count(),2);
   assert.equal(await p.locator("#tb3Hero").count(),0);
   const geometry=await p.evaluate(()=>{
    const home=document.getElementById("tb4Home");
    return {grid:getComputedStyle(home).display,main:home.querySelector(".tb4-home-main").getBoundingClientRect().width,rail:home.querySelector(".tb4-home-rail").getBoundingClientRect().width,css:[...document.styleSheets].some(s=>s.href?.includes("admin-layout-v4.css"))};
   });
   assert(geometry.css&&geometry.grid==="grid","V4 stylesheet/layout missing");
   if(width===1440)assert(geometry.main>geometry.rail*1.2,"Not a two column desktop workbench "+JSON.stringify(geometry));
   await p.locator("#tb4SearchInput").fill("beta");
   await p.waitForFunction(()=>document.querySelectorAll("#sidebar .nav-item:not(.tb4-filter-hidden)").length===1,undefined,{timeout:6000});
   await p.locator("#tb4SearchInput").fill("");
   await p.waitForFunction(()=>document.querySelectorAll("#sidebar .nav-item:not(.tb4-filter-hidden)").length===13,undefined,{timeout:5500});
   await press('#tb4GroupNav button[data-tb4-group="content"]');
   await p.waitForFunction(()=>document.querySelector('[data-view-panel="posts"]')?.classList.contains("active"),undefined,{timeout:8500});
   await p.waitForFunction(()=>document.getElementById("tb4CurrentTitle")?.textContent==="Bài viết",undefined,{timeout:7500});
   assert.equal(await p.locator("#tb4RouteTabs button").count(),5);
   await press('#tb4RouteTabs button[data-tb4-route="beta"]');
   await p.waitForFunction(()=>document.querySelector('[data-view-panel="beta"]')?.classList.contains("active"),undefined,{timeout:8500});
   await press(".tb4-return");
   await p.waitForFunction(()=>document.querySelector('[data-view-panel="dashboard"]')?.classList.contains("active"),undefined,{timeout:8500});
   await press('#tb4Modules button[data-tb4-route="inbox"]');
   await p.waitForFunction(()=>document.querySelector('[data-view-panel="inbox"]')?.classList.contains("active"),undefined,{timeout:8500});
   await press(".tb4-return");
   await p.waitForFunction(()=>document.querySelector('[data-view-panel="dashboard"]')?.classList.contains("active"),undefined,{timeout:8500});
   if(width===390||width===1440){
    fs.mkdirSync("admin-qa-screenshots",{recursive:true});
    await p.screenshot({path:"admin-qa-screenshots/admin-layout-v4-"+width+".png",animations:"disabled"});
   }
   const dims=await p.evaluate(()=>({screen:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
   assert(dims.scroll<=width+8,"Page overflow "+JSON.stringify(dims));
   assert.equal(writes,0,"V4 triggered API write");
   assert(external.every(x=>x.startsWith("https://fonts.googleapis.com/css2?")),"Unexpected outside request "+JSON.stringify(external));
   assert.deepEqual(errors,[],"Uncaught JS");
   console.log("LAYOUT V4 "+width+" PASS: 6 workspace groups, 13 legacy destinations, dashboard relocated, search and route tabs");
  }finally{await ctx.close();}
 }
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
