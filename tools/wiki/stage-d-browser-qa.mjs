// Wiki D: read-only integration test using the real full generated Wiki.
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
const root="http://127.0.0.1:18992";
const e=JSON.parse(fs.readFileSync("public/wiki-stage-d-evidence.json","utf8"));
assert.equal(e.schemaVersion,"wiki-d1");
assert.equal(e.coverage.attachments.total,51);
assert.equal(e.coverage.vehicles.total,26);
assert.equal(e.coverage.maps.total,8);
assert.equal(e.unlisted["Thuyền Cao Su"].seats,4);
assert.equal(Object.keys(e.maps).length,3);
const html=fs.readFileSync("public/wiki.html","utf8");
assert(html.includes("wiki-stage-d-v2.js")&&html.indexOf("wiki-stage-d-v2.js")>html.indexOf("wiki-stage-c-weapon.js"));
assert(!fs.readFileSync("public/admin.html","utf8").includes("wiki-stage-d-v2.js"));
const server=spawn("python3",["-m","http.server","18992","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
let browser;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const clickCard=(page,name)=>page.evaluate(name=>{
 const card=[...document.querySelectorAll("#tbWikiGrid .tb-wiki-card")].find(x=>x.querySelector("h3")?.textContent.trim()===name);
 if(!card)throw Error("No card named "+name);
 card.click();
},name);
try{
 await pause(700);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
  const errors=[],writes=[];
  await context.route("**/*",route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.pathname.startsWith("/api/")){
    if(!["GET","HEAD"].includes(req.method())&&!(req.method()==="POST"&&url.pathname==="/api/visitor-events"))writes.push(req.method()+" "+url.pathname);
    return route.fulfill({status:200,contentType:"application/json",body:'{"ok":true}'});
   }
   if(url.origin===root)return route.continue();
   return route.abort();
  });
  const page=await context.newPage();page.on("pageerror",err=>errors.push(err.message));
  try{
   await page.goto(root+"/wiki.html",{waitUntil:"domcontentloaded",timeout:24000});
   // H preflight: assert visible UI state before reading computed text or keyboard focus.
   await page.waitForFunction(()=>{const main=document.querySelector("main");return !!main&&getComputedStyle(main).visibility==="visible";},undefined,{timeout:9500});
   await page.waitForFunction(()=>window.__TB_WIKI_D__?.ready&&DATA.attachments.length===51&&DATA.vehicles.length===26&&DATA.maps.length===8,undefined,{timeout:17000});
   await page.locator('#tbWikiTabs .tb-wiki-tab[data-tab="attachments"]').evaluate(el=>el.click());
   await page.waitForFunction(()=>{const box=document.querySelector("#tbDSourceSummary");return !!box&&!box.hidden&&box.textContent.includes("51 phụ kiện")&&document.querySelectorAll("#tbWikiGrid .tb-wiki-card").length===51},undefined,{timeout:9000});
   assert((await page.locator("#tbDSourceSummary").innerText()).includes("51 phụ kiện"));
   const first=await page.locator("#tbWikiGrid .tb-wiki-card h3").first().textContent();
   await clickCard(page,first.trim());
   await page.waitForFunction(()=>!!document.querySelector("#tbWikiModal.open .tb-d-panel"),undefined,{timeout:7000});
   assert((await page.locator(".tb-d-panel").innerText()).includes("chưa có bảng tương thích chính thức"));
   assert.equal(await page.locator("#tbWikiModal .tb-d-source").count(),0,"Attachment must not invent source");
   await page.locator("#tbWikiModalClose").click();
   await page.locator('#tbWikiTabs .tb-wiki-tab[data-tab="vehicles"]').evaluate(el=>el.click());
   await page.waitForFunction(()=>{
    const box=document.querySelector("#tbDSourceSummary");
    return !box?.hidden&&document.querySelectorAll("#tbWikiGrid .tb-wiki-card").length===26&&box.textContent.includes("Thuyền Cao Su");
   },undefined,{timeout:7000});
   assert((await page.locator("#tbDSourceSummary").textContent()).includes("Thuyền Cao Su"));
   const name=await page.evaluate(()=>{
    const c=[...document.querySelectorAll("#tbWikiGrid .tb-wiki-card")].find(x=>x.querySelector("h3")?.textContent.includes("Tracked Amphicarrier"));
    return c?.querySelector("h3")?.textContent.trim()||null;
   });
   if(name){
    await clickCard(page,name);
    await page.waitForFunction(()=>!!document.querySelector("#tbWikiModal.open .tb-d-panel"),undefined,{timeout:7000});
    assert((await page.locator("#tbWikiModal .tb-d-release").innerText()).includes("BRDM-2"));
    await page.locator("#tbWikiModalClose").click();
   }
   await page.locator('#tbWikiTabs .tb-wiki-tab[data-tab="maps"]').evaluate(el=>el.click());
   await page.waitForFunction(()=>{
    const box=document.querySelector("#tbDSourceSummary");
    return !box?.hidden&&document.querySelectorAll("#tbWikiGrid .tb-wiki-card").length===8&&box.textContent.includes("3 ghi chú");
   },undefined,{timeout:7000});
   assert((await page.locator("#tbDSourceSummary").textContent()).includes("3 ghi chú"));
   await clickCard(page,"Erangel");
   await page.waitForFunction(()=>!!document.querySelector("#tbWikiModal.open .tb-d-release"),undefined,{timeout:7000});
   const section=await page.locator("#tbWikiModal .tb-d-release").innerText();
   assert(section.includes("Thợ Săn Huyết Dạ")&&section.includes("4.6"),"Map official mode note absent "+section);
   assert.equal(await page.locator("#tbWikiModal .tb-d-source").getAttribute("href"),e.sources["pubg-vi-4.6"].url);
   const box=await page.locator("#tbWikiModal .tb-d-panel").evaluate(el=>{const b=el.getBoundingClientRect();return {l:b.left,r:b.right}});
   assert(box.l>=-3&&box.r<=width+3,"D detail overflows width "+JSON.stringify({width,box}));
   if(width!==768){
    fs.mkdirSync("wiki-stage-d-screenshots",{recursive:true});
    await page.screenshot({path:"wiki-stage-d-screenshots/map-erangel-"+width+".png",animations:"disabled"});
   }
   await page.locator(".tb-d-switch").evaluate(el=>el.click());
   await page.waitForFunction(()=>document.querySelector('#tbWikiTabs .tb-wiki-tab.active')?.dataset.tab==="vehicles",undefined,{timeout:7000});
   assert.deepEqual(writes,[],"Unexpected real data-write attempts");
   assert.deepEqual(errors,[],"Unexpected runtime JavaScript errors");
   console.log("WIKI D "+width+" PASS: 51 attachments, 26 vehicles + 4.6 missing boat, 8 maps, official mode source, cross-navigation");
  }finally{await context.close();}
 }
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
