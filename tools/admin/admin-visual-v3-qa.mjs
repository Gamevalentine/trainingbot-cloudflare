// TrainingBot V3 local visual acceptance, all admin API calls mocked.
// Do not connect to Production or use real tokens.
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
const ROOT="http://127.0.0.1:18982",TOKEN="LOCAL_V3_FAKE_TOKEN";
assert(fs.readFileSync("public/admin.html","utf8").includes("admin-visual-v3.js"));
assert(fs.existsSync("public/admin-visual-v3.css"));
assert(!fs.existsSync("public/admin-demo.html"));
const server=spawn("python3",["-m","http.server","18982","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
try{
 await sleep(800);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [390,768,1440]){
  const ctx=await browser.newContext({viewport:{width,height:930},reducedMotion:"reduce"});
  let outside=[],writes=0,errors=[];
  await ctx.route("**/*",route=>{
   const r=route.request(),u=new URL(r.url()),p=u.pathname,method=r.method();
   if(p.startsWith("/api/")){
    if(method!=="GET"&&method!=="HEAD")writes++;
    const respond=obj=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(obj)});
    if(p.includes("admin/users"))return respond({ok:true,users:[],stats:{total:2,active_24h:1,active_7d:1,new_today:0}});
    if(p.includes("admin-contacts"))return respond({ok:true,messages:[],counts:{total:0,unread:0,read:0,replied:0}});
    if(p.includes("posts"))return respond({ok:true,posts:[]});
    if(p.includes("beta-versions"))return respond({ok:true,versions:[]});
    if(p.includes("visitor-events"))return respond({ok:true,summary:{today_visitors:2,today_sessions:3,online_visitors:1,online_sessions:1},sessions:[],devices:[],oses:[],browsers:[]});
    return respond({ok:true,changes:[],page:"/index.html"});
   }
   if(u.origin===ROOT)return route.continue();
   outside.push(r.url());return route.abort();
  });
  const page=await ctx.newPage();
  page.on("pageerror",e=>errors.push(e.message));
  try {
   await page.goto(ROOT+"/admin.html",{waitUntil:"domcontentloaded",timeout:23000});
   await page.waitForFunction(()=>document.body.classList.contains("tb-admin-v3"),undefined,{timeout:20000});
   await page.waitForFunction(()=>!!document.getElementById("tb3DesignStyles")&&document.styleSheets.length>=1,undefined,{timeout:10000});
   await page.waitForFunction(()=>!!document.getElementById("tb3Hero"),undefined,{timeout:10000});
   assert.equal(await page.locator("#adminApp.hidden").count(),1);
   await page.locator("#adminToken").fill(TOKEN);
   await page.locator('#loginForm button[type="submit"]').click();
   await page.waitForFunction(()=>{const a=document.getElementById("adminApp");return a&&!a.classList.contains("hidden");},undefined,{timeout:15000});
   await page.waitForFunction(()=>document.querySelectorAll("#sidebar .nav-item").length===13,undefined,{timeout:10000});
   assert.equal(await page.locator("#tb3Hero .tb3-hero-stat").count(),2);
   assert.equal(await page.locator("#tb3Hero .tb3-hero-buttons button").count(),2);
   assert.equal(await page.locator("#tb3OverviewLabel").count(),1);
   assert.equal(await page.locator("#tb3ShortcutsLabel").count(),1);
   const style=await page.locator("#tb3Hero").evaluate(node=>({display:getComputedStyle(node).display,height:node.getBoundingClientRect().height,background:getComputedStyle(node).backgroundImage,flag:document.body.classList.contains("tb-admin-v3")}));
   assert.equal(style.display,"grid");
   assert(style.height>140,"Hero too small: "+JSON.stringify(style));
   assert(style.background.includes("gradient"),"Hero doesn't have visible new design");
   assert(style.flag);
   await page.locator("#tb3Hero .tb3-hero-buttons button").nth(1).evaluate(el=>el.click());
   await page.waitForFunction(()=>document.querySelector('[data-view-panel="beta"]')?.classList.contains("active"),undefined,{timeout:9000});
   await page.locator('#sidebar .nav-item[data-view="dashboard"]').evaluate(el=>el.click());
   await page.waitForFunction(()=>document.querySelector('[data-view-panel="dashboard"]')?.classList.contains("active"),undefined,{timeout:7000});
   await page.locator("#tb3Hero .tb3-hero-buttons button").first().evaluate(el=>el.click());
   await page.waitForFunction(()=>document.querySelector('[data-view-panel="posts"]')?.classList.contains("active"),undefined,{timeout:8000});
   await page.locator('#sidebar .nav-item[data-view="dashboard"]').evaluate(el=>el.click());
   if(width===390||width===1440){fs.mkdirSync("admin-qa-screenshots",{recursive:true});await page.screenshot({path:"admin-qa-screenshots/admin-visual-v3-"+width+".png",animations:"disabled"});}
   const dims=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
   assert(dims.scroll<=width+8,"Horizontal overflow "+JSON.stringify(dims));
   assert.equal(writes,0,"V3 generated an unexpected write request");
   assert.deepEqual(outside,[],"V3 external network requests: "+JSON.stringify(outside));
   assert.deepEqual(errors,[],"Uncaught script errors");
   console.log("Visual V3 "+width+"px PASS — new hero, responsive design, 13 original routes, Beta/Posts navigation, no writes");
  }finally{await ctx.close();}
 }
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
