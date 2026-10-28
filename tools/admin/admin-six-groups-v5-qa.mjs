// Admin V5 visual/function acceptance on the genuine A–E Admin with mock APIs.
// All URLs outside local server are blocked. No Cloudflare or real credentials.
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
const ROOT="http://127.0.0.1:18995",TOKEN="V5_SAFE_FAKE_LOGIN";
const groups=["dashboard","content","library","community","analytics","settings"];
const routes=["dashboard","posts","content","wiki","studio","beta","media","users","inbox","analytics","visitor-tracking","security","system"];
const panelGroups={dashboard:["dashboard"],content:["posts","content","wiki","studio","beta"],library:["media"],community:["users","inbox"],analytics:["analytics","visitor-tracking"],settings:["security","system"]};
assert(fs.readFileSync("public/admin.html","utf8").includes("admin-six-groups-v5.js"));
assert(fs.existsSync("public/admin-six-groups-v5.css"));
assert(!fs.existsSync("public/admin-demo.html"));
const server=spawn("python3",["-m","http.server","18995","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
try{
 await delay(750);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [390,768,1440]){
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
  const writes=[],outside=[],errors=[],consoleErrors=[],assetResponses=[];
  await ctx.route("**/*",r=>{
   const req=r.request(),url=new URL(req.url()),path=url.pathname;
   const json=data=>r.fulfill({status:200,contentType:"application/json",body:JSON.stringify(data)});
   if(path.startsWith("/api/")){
    if(!["GET","HEAD"].includes(req.method()))writes.push(req.method()+" "+path);
    if(path==="/api/v49/admin/users")return json({ok:true,users:[],stats:{total:2,active_24h:1,active_7d:2,new_today:0}});
    if(path.endsWith("/admin-contacts"))return json({ok:true,messages:[],counts:{total:0,unread:0,read:0,replied:0}});
    if(path.includes("/posts"))return json({ok:true,posts:[]});
    if(path.includes("beta-versions"))return json({ok:true,versions:[]});
    if(path.includes("visitor-events"))return json({ok:true,summary:{today_visitors:0,today_sessions:0,online_visitors:0,online_sessions:0},sessions:[]});
    return json({ok:true,page:"/index.html",changes:[]});
   }
   if(url.origin===ROOT)return r.continue();
   outside.push(req.url());return r.abort();
  });
  const page=await ctx.newPage();
  page.on("pageerror",e=>errors.push(e.message));
  page.on("console",m=>{if(m.type()==="error"||m.type()==="warning")consoleErrors.push(m.text().slice(0,500))});
  page.on("response",res=>{if(res.url().includes("six-groups"))assetResponses.push({status:res.status(),headers:res.headers()["content-type"],url:res.url()});});
  const click=selector=>page.evaluate(s=>{
   const el=document.querySelector(s);
   if(!el)throw Error("V5 button missing "+s);
   el.click();
  },selector);
  try{
   await page.goto(ROOT+"/admin.html",{waitUntil:"domcontentloaded",timeout:23000});
   try{
    await page.waitForFunction(()=>document.body.classList.contains("tb-admin-six-groups")&&!!document.getElementById("tb5Categories"),undefined,{timeout:12500});
   }catch(error){
    const state=await page.evaluate(()=>({title:document.title,body:document.body?.innerText.slice(0,400),
      app:!!document.getElementById("adminApp"),stageB:document.body?.className,
      scripts:[...document.scripts].map(x=>x.src||"inline").slice(-17),
      nav:!!document.querySelector("#sidebar .side-nav"),
      v5script:!!document.querySelector('script[src*="admin-six-groups"]'),
      elements:{
        app:!!document.getElementById("adminApp"),
        sidebar:!!document.getElementById("adminApp")?.querySelector("#sidebar"),
        nav:!!document.getElementById("adminApp")?.querySelector("#sidebar .side-nav"),
        area:!!document.getElementById("adminApp")?.querySelector(".content-area"),
        hasCategories:!!document.getElementById("tb5Categories")
      },
      resource:[...performance.getEntriesByType("resource")].filter(x=>x.name.includes("six-groups")).map(x=>({name:x.name,transfer:x.transferSize})),
      v5Css:!!document.getElementById("tb5CategoryStyle")
    })).catch(e=>({error:String(e)}));
    console.log("V5 INIT DIAG",JSON.stringify({state,errors,consoleErrors,outside,assetResponses}));
    throw error;
   }
   assert.equal(await page.locator("#adminApp.hidden").count(),1,"Admin must require login");
   await page.locator("#adminToken").fill(TOKEN);
   await click('#loginForm button[type="submit"]');
   await page.waitForFunction(()=>!!document.getElementById("adminApp")&&!document.getElementById("adminApp").classList.contains("hidden"),undefined,{timeout:16000});
   await page.waitForFunction(()=>document.querySelectorAll("#sidebar .nav-item").length===13,undefined,{timeout:13000});
   const keys=await page.evaluate(()=>[...document.querySelectorAll("#sidebar .nav-item")].map(n=>n.id==="tbVisitorNav"?"visitor-tracking":n.dataset.view));
   assert.deepEqual(keys,routes,"Legacy route handlers missing");
   assert.equal(await page.locator("#tb5Categories .tb5-category").count(),6);
   assert.deepEqual(await page.locator("#tb5Categories .tb5-category").evaluateAll(xs=>xs.map(x=>x.dataset.tb5Group)),groups);
   assert.equal(await page.locator("#sidebar .side-nav").evaluate(el=>getComputedStyle(el).display),"none","Old long sidebar must be hidden");
   const categorySizes=await page.locator("#tb5Categories").evaluate(el=>({
    css:getComputedStyle(el).display,height:el.getBoundingClientRect().height,
    sheet:[...document.styleSheets].some(s=>s.href?.includes("admin-six-groups-v5.css"))
   }));
   assert(categorySizes.sheet&&categorySizes.css==="flex");
   assert(categorySizes.height<650,"Six category buttons should not create a long sidebar");

   // Clicking sidebar category MUST NOT open a legacy panel directly.
   await click('#tb5Categories button[data-tb5-group="content"]');
   await page.waitForFunction(()=>document.body.classList.contains("tb-admin-group-home")&&document.getElementById("tb5GroupHome")?.querySelectorAll(".tb5-function-card").length===5,undefined,{timeout:6500});
   assert.equal(await page.locator("#pageTitle").innerText(),"Nội dung");
   assert.equal(await page.locator("#tb5GroupHome .tb5-function-card").count(),5);
   await page.waitForFunction(()=>[...document.styleSheets].some(s=>s.href?.includes("admin-workspace-polish-v5.css")),undefined,{timeout:6500});
   assert.equal(await page.locator("#tb5GroupHome .tb6-function-card").count(),5);
   assert.equal(await page.locator("#tb5GroupHome .tb6-function-card .tb5-function-icon svg").count(),5,"Distinct inline icons must render");
   assert.equal(await page.locator("#tb5GroupHome .tb6-hub-glyph svg").count(),1);
   assert.equal(await page.locator("#tb5GroupHome .tb6-section-heading h3").innerText(),"Công cụ quản lý");
   assert.equal(await page.locator("#tb5GroupHome .tb6-card-feature-label").innerText(),"BIÊN TẬP NỘI DUNG");
   assert.equal(await page.locator("#tb5GroupHome .tb6-card-footer").count(),5);
   // Vietnamese typography: compare real computed styles, not merely a CSS
   // file being present. All buttons/labels use the same known font stack.
   await page.waitForFunction(()=>[...document.styleSheets].some(s=>s.href?.includes("admin-typography-v5.css")),undefined,{timeout:6000});
   const fonts=await page.evaluate(()=>{
    const targets={
      app:"#adminApp",
      headline:"#pageTitle",
      sidebar:"#tb5Categories .tb5-category-label",
      workspace:"#tb5GroupHome .tb5-hub-head h2",
      content:"#tb5GroupHome .tb5-function-card strong",
      desc:"#tb5GroupHome .tb5-card-description",
      button:"#tb5GroupHome .tb5-function-card"
    };
    const computed={};
    for(const [id,selector] of Object.entries(targets)){
      const el=document.querySelector(selector);
      if(!el)throw Error("Missing typography target "+selector);
      const s=getComputedStyle(el);
      computed[id]={family:s.fontFamily,weight:s.fontWeight,spacing:s.letterSpacing,text:el.textContent.trim().slice(0,38)};
    }
    return computed;
   });
   const family=fonts.app.family;
   assert(family.includes("Segoe UI")&&family.includes("Noto Sans"),"Expected Vietnamese-safe system font stack "+JSON.stringify(fonts));
   for(const [name,info] of Object.entries(fonts)){
     assert.equal(info.family,family,"Mixed font family at "+name+" "+JSON.stringify(fonts));
   }
   assert.equal(fonts.content.weight,"700","Card heading should use normal 700 bold instead of synthetic ultra-heavy weights");
   assert.equal(fonts.content.spacing,"normal","Card heading Vietnamese marks should not use negative letter spacing");
   assert(fonts.content.text.includes("Bài viết"),"Vietnamese card label corrupted");
   assert(fonts.workspace.text.includes("Nội dung"),"Vietnamese heading corrupted");
   const polished=await page.evaluate(()=>{
    const group=document.getElementById("tb5GroupHome");
    const banner=group.querySelector(".tb5-hub-head").getBoundingClientRect();
    const grid=group.querySelector(".tb5-function-grid");
    const cards=[...grid.querySelectorAll(".tb6-function-card")];
    const bounds=cards.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});
    const feature=cards[0];
    return {
     bannerHeight:banner.height,
     count:group.querySelector(".tb6-count-number")?.textContent,
     gridColumns:getComputedStyle(grid).gridTemplateColumns,
     featureColumns:getComputedStyle(feature).gridColumnEnd,
     distinctColors:[...new Set(cards.map(n=>getComputedStyle(n).getPropertyValue("--tb6-accent").trim()))].length,
     cardHeight:bounds[0].h,
     bounds,
     cyber:!!document.getElementById("tb5CyberCardStyle"),
     glitch:!!document.getElementById("tb5SidebarGlitchStyle")
    };
   });
   assert(polished.bannerHeight<170,"Old oversized banner is still visible "+JSON.stringify(polished));
   assert.equal(polished.count,"05");
   assert.equal(polished.distinctColors,5,"All cards still share one accent color");
   assert(!polished.cyber&&!polished.glitch,"Previously reverted Glitch/Cyber styles returned");
   assert(polished.cardHeight<215,"Card height is too large");
   if(width===1440){
    assert(polished.bounds[0].w>polished.bounds[1].w*1.85,"Feature card is not actually two columns wide "+JSON.stringify(polished));
    assert(Math.abs(polished.bounds[1].y-polished.bounds[0].y)<3,"First row geometry incorrect");
    assert(Math.abs(polished.bounds[2].y-polished.bounds[3].y)<3,"Second row geometry incorrect");
    assert(Math.abs(polished.bounds[3].y-polished.bounds[4].y)<3,"Third card missing in second row");
   }

   assert.equal(await page.locator("#tb5GroupHome").evaluate(x=>getComputedStyle(x).display)!=="none",true);
   assert.equal(await page.locator(".view.active").first().evaluate(x=>getComputedStyle(x).display),"none","Legacy panel still showing behind category hub");
   if(width===390||width===1440){
    fs.mkdirSync("admin-qa-screenshots",{recursive:true});
    await page.screenshot({path:"admin-qa-screenshots/admin-v5-content-"+width+".png",animations:"disabled"});
   }
   await click('#tb5GroupHome button[data-tb5-route="posts"]');
   await page.waitForFunction(()=>document.querySelector('[data-view-panel="posts"]')?.classList.contains("active")&&!document.body.classList.contains("tb-admin-group-home"),undefined,{timeout:7000});
   assert.equal(await page.locator("#tb5Breadcrumb").evaluate(x=>getComputedStyle(x).display)!=="none",true);
   assert.equal(await page.locator("#tb5CrumbPage").innerText(),"Bài viết");
   // Return to category from inside original function, keeping its handlers.
   await click(".tb5-crumb-back");
   await page.waitForFunction(()=>document.body.classList.contains("tb-admin-group-home")&&document.getElementById("tb5GroupHome")?.querySelectorAll(".tb5-function-card").length===5,undefined,{timeout:7000});
   await click('#tb5GroupHome button[data-tb5-route="beta"]');
   await page.waitForFunction(()=>document.querySelector('[data-view-panel="beta"]')?.classList.contains("active")&&!document.body.classList.contains("tb-admin-group-home"),undefined,{timeout:7000});
   assert.equal(await page.locator('#tb5Categories button[data-tb5-group="content"].active').count(),1);

   for(const [group,children] of Object.entries(panelGroups)){
    if(group==="dashboard"){
     await click('#tb5Categories button[data-tb5-group="dashboard"]');
     await page.waitForFunction(()=>document.querySelector('[data-view-panel="dashboard"]')?.classList.contains("active")&&!document.body.classList.contains("tb-admin-group-home"),undefined,{timeout:7000});
     continue;
    }
    await click('#tb5Categories button[data-tb5-group="'+group+'"]');
    await page.waitForFunction(n=>document.getElementById("tb5GroupHome")?.querySelectorAll(".tb5-function-card").length===n&&document.body.classList.contains("tb-admin-group-home"),children.length,{timeout:7000});
    const items=await page.locator("#tb5GroupHome [data-tb5-route]").evaluateAll(xs=>xs.map(x=>x.dataset.tb5Route));
    assert.deepEqual(items,children,"Missing function card for "+group);
    // All original function destinations remain reachable from hub.
    for(const id of children){
     await click('#tb5GroupHome [data-tb5-route="'+id+'"]');
     await page.waitForFunction(key=>document.querySelector('[data-view-panel="'+key+'"]')?.classList.contains("active")&&!document.body.classList.contains("tb-admin-group-home"),id,{timeout:7500});
     if(id!==children[children.length-1]){
      await click('#tb5Categories button[data-tb5-group="'+group+'"]');
      await page.waitForFunction(()=>document.body.classList.contains("tb-admin-group-home"),undefined,{timeout:5000});
     }
    }
   }
   await click('#tb5Categories button[data-tb5-group="content"]');
   assert.equal((await page.locator("#tb5GroupHome .tb5-function-card").count()),5);
   const scroll=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,w:document.documentElement.clientWidth}));
   assert(scroll.doc<=width+7,"V5 caused horizontal overflow "+JSON.stringify(scroll));
   assert.deepEqual(writes,[],"Unexpected Admin write during navigation");
   assert(outside.every(s=>s.startsWith("https://fonts.googleapis.com/")),"Unexpected external network "+JSON.stringify(outside));
   assert.deepEqual(errors,[],"Uncaught JS errors");
   console.log("Admin V5 "+width+"px PASS — exactly 6 sidebar groups, 13 reachable original routes, main-area cards, breadcrumbs, no API writes");
  }finally{await ctx.close();}
 }
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
