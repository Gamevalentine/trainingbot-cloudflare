// Wiki C1–C6: browser acceptance on REAL built Wiki and existing v144 detail.
// Fetches only same-origin evidence JSON. All Production APIs mocked, blocked.
import fs from "node:fs";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
const root="http://127.0.0.1:18993",port=18993;
const html=fs.readFileSync("public/wiki.html","utf8");
assert(html.includes("wiki-stage-c-weapon.js"));
assert(html.indexOf("wiki-stage-c-weapon.js")>html.indexOf("wiki-stage-b-v2.js"));
for(const name of ["wiki-stage-c-weapon.js","wiki-stage-c-weapon.css","wiki-stage-c-evidence.json"]){
 assert(fs.existsSync("public/"+name),"Missing C runtime asset: "+name);
}
assert(!fs.readFileSync("public/admin.html","utf8").includes("wiki-stage-c"));
const e=JSON.parse(fs.readFileSync("public/wiki-stage-c-evidence.json","utf8"));
assert.equal(e.schemaVersion,"wiki-c1");
assert.equal(Object.keys(e.weapons).length,6);
for(const [name,record] of Object.entries(e.weapons)){
 assert(name&&record.history.length>0);
 for(const item of record.history){
  const src=e.sources[item.sourceId];
  assert(src&&src.url.startsWith("https://www.pubgmobile.com/"));
  assert.equal(src.isCurrent,false,"Never claim v2.4 is current");
  assert(src.version==="2.4"&&src.checkedAt&&src.publishedAt);
  for(const fact of item.facts)assert(fact.label&&fact.value!==undefined&&fact.unit!==undefined);
 }
}
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let browser;
try{
 await pause(700);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
  const errors=[],writes=[],outside=[];
  await context.route("**/*",route=>{
   const req=route.request(),u=new URL(req.url());
   if(u.pathname.startsWith("/api/")){
    if(!["GET","HEAD"].includes(req.method())&&!(req.method()==="POST"&&u.pathname==="/api/visitor-events")){
     writes.push(req.method()+" "+u.pathname);
    }
    return route.fulfill({status:200,contentType:"application/json",body:'{"ok":true}'});
   }
   if(u.origin===root)return route.continue();
   outside.push(u.href);
   return route.abort();
  });
  const page=await context.newPage();
  page.on("pageerror",err=>errors.push(err.message));
  const click=async name=>page.evaluate(name=>{
   const card=[...document.querySelectorAll("#tbWikiGrid .tb-wiki-card")].find(el=>el.querySelector("h3")?.textContent.trim()===name);
   if(!card)throw Error("C test weapon card not found "+name);
   card.click();
  },name);
  try{
   await page.goto(root+"/wiki.html",{waitUntil:"domcontentloaded",timeout:25000});
   await page.waitForFunction(()=>window.__TB_WIKI_C__?.ready&&document.body.classList.contains("tb-wiki-stage-c")&&DATA.weapons.length===61,
    undefined,{timeout:24000});
   await click("M416");
   await page.waitForFunction(()=>document.querySelector('.tb-v145.open .tb-c-sheet')?.dataset.tbCName==="M416",
    undefined,{timeout:16000});
   assert.equal(await page.locator(".tb-v145.open .tb-c-source").count(),0,
    "M416 has no verified release evidence and must not invent a source");
   assert((await page.locator(".tb-v145.open .tb-c-unverified").innerText()).includes("Chưa có thông số nâng cao"));
   assert.equal(await page.locator(".tb-v145.open .tb-v145-score-title").evaluate(el=>getComputedStyle(el).display),"none",
    "Generic v144 scores must not masquerade as actual damage/recoil");
   assert((await page.locator(".tb-v145.open .tb-c-legacy-note").innerText()).includes("chưa có bằng chứng"));
   await page.locator(".tb-v145-close").click();
   await click("QBZ");
   await page.waitForFunction(()=>document.querySelector('.tb-v145.open .tb-c-sheet')?.dataset.tbCName==="QBZ",
     undefined,{timeout:13000});
   assert.equal(await page.locator(".tb-v145.open .tb-c-source").count(),1);
   assert((await page.locator(".tb-v145.open .tb-c-release").innerText()).includes("3.1 giây"),
     "QBZ official historical reload note absent");
   assert((await page.locator(".tb-v145.open .tb-c-release").innerText()).includes("2023"),
     "Historical version release must be clearly dated");
   assert((await page.locator(".tb-v145.open .tb-c-disclaimer").innerText()).includes("không xác nhận"));
   const href=await page.locator(".tb-v145.open .tb-c-source").getAttribute("href");
   assert.equal(href,e.sources["pubg-official-2.4"].url);
   if(width===1440||width===390){
    fs.mkdirSync("wiki-stage-c-screenshots",{recursive:true});
    await page.screenshot({path:"wiki-stage-c-screenshots/weapon-qbz-"+width+".png",animations:"disabled"});
   }
   const box=await page.locator(".tb-v145.open .tb-c-sheet").evaluate(el=>{
    const b=el.getBoundingClientRect();return {left:b.left,right:b.right,inner:window.innerWidth};
   });
   assert(box.left>=-3&&box.right<=width+3,"C evidence panel horizontal overflow "+JSON.stringify(box));
   if(width===1440){
    for(const name of ["FAMAS","UZI","UMP45","PP-19 Bizon","Honey Badger","AKM"]){
     await page.locator(".tb-v145-close").click();
     await click(name);
     await page.waitForFunction(n=>document.querySelector('.tb-v145.open .tb-c-sheet')?.dataset.tbCName===n,name,{timeout:9000});
     assert.equal(await page.locator(".tb-v145.open .tb-c-source").count(),name==="AKM"?0:1,"Incorrect evidence for "+name);
    }
   }
   assert.deepEqual(writes,[],"Unexpected API writes");
   assert.deepEqual(errors,[],"Browser JS errors: "+errors.join("; "));
   console.log("WIKI C "+width+" PASS — data 61, no false 0–100 score, source-linked QBZ v2.4, unverified M416, legacy details preserved");
  }finally{await context.close();}
 }
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
