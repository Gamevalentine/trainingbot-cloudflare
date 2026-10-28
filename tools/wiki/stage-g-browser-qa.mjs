// Wiki G.1–G.6 — real generated Admin V5 with synthetic login/API read mocks.
// Tests in-memory draft review only. NEVER uses real tokens or writes live APIs.
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
const root="http://127.0.0.1:18996",TOKEN="G_FAKE_QA_TOKEN";
const admin=fs.readFileSync("public/admin.html","utf8"),wiki=fs.readFileSync("public/wiki.html","utf8");
assert(admin.includes("admin-wiki-stage-g.js")&&admin.includes("admin-six-groups-v5.js"));
assert(wiki.includes("wiki-stage-g-snapshot.js")&&!wiki.includes("admin-wiki-stage-g.js"));
assert(!fs.existsSync("public/admin-demo.html"),"Synthetic Admin demo must not ship to stage G Preview");
for(const a of ["admin-wiki-stage-g.js","admin-wiki-stage-g.css","wiki-stage-g-snapshot.js"])assert(fs.existsSync("public/"+a));
const server=spawn("python3",["-m","http.server","18996","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const pause=n=>new Promise(r=>setTimeout(r,n));
let browser;
try{
 await pause(700);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:950},reducedMotion:"reduce",acceptDownloads:true});
  const errors=[],outside=[],writes=[];
  await context.route("**/*",route=>{
   const req=route.request(),url=new URL(req.url()),path=url.pathname;
   const json=data=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(data)});
   if(path.startsWith("/api/")){
    if(!["GET","HEAD"].includes(req.method())&&!(req.method()==="POST"&&path==="/api/visitor-events"))writes.push(req.method()+" "+path);
    if(path==="/api/v49/admin/users")return json({ok:true,users:[],stats:{total:2,active_24h:1,active_7d:2,new_today:0}});
    if(path.endsWith("/admin-contacts"))return json({ok:true,messages:[],counts:{total:0,unread:0,read:0,replied:0}});
    if(path.includes("/posts"))return json({ok:true,posts:[]});
    if(path.includes("beta-versions"))return json({ok:true,versions:[]});
    if(path.includes("visitor-events"))return json({ok:true,summary:{today_visitors:0,today_sessions:0,online_visitors:0,online_sessions:0},sessions:[]});
    return json({ok:true,page:"/index.html",changes:[]});
   }
   if(url.origin===root)return route.continue();
   outside.push(url.href);return route.abort();
  });
  const page=await context.newPage();
  page.on("pageerror",err=>errors.push(err.message));
  const click=selector=>page.evaluate(sel=>{const el=document.querySelector(sel);if(!el)throw Error("Missing "+sel);el.click()},selector);
  try{
   await page.goto(root+"/admin.html",{waitUntil:"domcontentloaded",timeout:28000});
   await page.waitForFunction(()=>window.__TB_ADMIN_WIKI_G__?.ready&&!!document.getElementById("tb5Categories"),undefined,{timeout:15000});
   assert.equal(await page.locator("#adminApp.hidden").count(),1,"Protected Admin unexpectedly open without login");
   assert.equal(await page.locator("#tbGWorkbench:not([hidden])").count(),0,"Workbench visible before authentication");
   await page.locator("#adminToken").fill(TOKEN);
   await click('#loginForm button[type="submit"]');
   await page.waitForFunction(()=>!document.getElementById("adminApp")?.classList.contains("hidden"),undefined,{timeout:16000});
   await click('#tb5Categories button[data-tb5-group="content"]');
   await page.waitForFunction(()=>document.getElementById("tb5GroupHome")?.querySelectorAll(".tb5-function-card").length===5,undefined,{timeout:9000});
   await click('#tb5GroupHome [data-tb5-route="wiki"]');
   await page.waitForFunction(()=>!!document.querySelector('[data-view-panel="wiki"].active')&&!document.getElementById("tbGWorkbench")?.hidden,undefined,{timeout:9000});
   assert.equal(await page.locator("#tbGWorkbench .tb-g-head h2").innerText(),"Quản trị dữ liệu Wiki");
   assert.equal(await page.locator("#tbGList .tb-g-row").count(),0);
   await page.locator("#tbGLoad").click();
   await page.waitForFunction(()=>window.__TB_ADMIN_WIKI_G__?.loaded,undefined,{timeout:28000});
   const counts=await page.evaluate(()=>window.__TB_ADMIN_WIKI_G__.counts);
   assert.deepEqual(counts,{weapons:61,attachments:51,vehicles:26,maps:8});
   assert.equal(await page.locator("#tbGList .tb-g-row").count(),162);
   const info=await page.locator("#tbGStatus").innerText();assert(info.includes("146 kho + 16 hướng dẫn"));
   // G.2 filter all 4 catalogs and guides without manufactured counts.
   for(const [kind,n] of [["weapons",61],["attachments",51],["vehicles",26],["maps",8],["guides",16]]){
    await page.locator("#tbGKind").selectOption(kind);
    assert.equal(await page.locator("#tbGList .tb-g-row").count(),n,"Category "+kind);
   }
   await page.locator("#tbGKind").selectOption("all");
   await page.locator("#tbGSearch").fill("erangel");
   assert.equal(await page.locator("#tbGList .tb-g-row").count(),1);
   await page.locator("#tbGSearch").fill("");
   // G.3 approval must be flagged when URL/version/date and image license missing.
   await page.locator("#tbGKind").selectOption("weapons");
   await page.locator("#tbGSearch").fill("QBZ");
   await page.locator("#tbGList .tb-g-row").first().click();
   const status=page.locator('#tbGDetail [data-field="status"]');
   await status.selectOption("approved");
   assert((await page.locator("#tbGValidation").innerText()).includes("Chưa đủ URL/phiên bản/ngày"));
   await page.locator('#tbGDetail [data-field="sourceUrl"]').fill("http://bad.example");
   await page.locator('#tbGDetail [data-field="sourceUrl"]').blur();
   assert((await page.locator("#tbGValidation").innerText()).includes("HTTPS"));
   await page.locator('#tbGDetail [data-field="sourceUrl"]').fill("https://www.pubgmobile.com/");
   await page.locator('#tbGDetail [data-field="sourceUrl"]').blur();
   await page.locator('#tbGDetail [data-field="sourceVersion"]').fill("2.4");
   await page.locator('#tbGDetail [data-field="sourceVersion"]').blur();
   await page.locator('#tbGDetail [data-field="sourceDate"]').fill("2023-01-04");
   await page.locator('#tbGDetail [data-field="sourceDate"]').blur();
   assert((await page.locator("#tbGValidation").innerText()).includes("không có lỗi cấu trúc"));
   // G.4 undo one edit, import validation and export without server save.
   await page.locator("#tbGUndo").click();
   assert((await page.locator("#tbGValidation").innerText()).includes("Chưa đủ URL/phiên bản/ngày"));
   const original=await page.evaluate(()=>window.__TB_ADMIN_WIKI_G__.getDraft());
   assert.equal(original.published,false);assert(original.records.length>=1);
   const bad={...original,records:[{id:"fake-id",kind:"weapons",name:"Fake",review:{status:"approved"}}]};
   await page.locator("#tbGImport").setInputFiles({name:"bad.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(bad))});
   await page.waitForFunction(()=>document.getElementById("tbGStatus")?.textContent.includes("Nhập thất bại"),undefined,{timeout:8000});
   assert.equal((await page.evaluate(()=>window.__TB_ADMIN_WIKI_G__.getDraft())).records.length,original.records.length);
   const downloadPromise=page.waitForEvent("download");
   await page.locator("#tbGExport").click();
   const download=await downloadPromise;
   assert.equal(download.suggestedFilename(),"trainingbot-wiki-draft.json");
   assert.deepEqual(writes,[],"Admin G caused real API writes");
   const bounds=await page.locator("#tbGWorkbench").evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,w:innerWidth}});
   assert(bounds.left>=-2&&bounds.right<=width+2,"G workbench overflows "+width+" "+JSON.stringify(bounds));
   fs.mkdirSync("wiki-stage-g-screenshots",{recursive:true});
   await page.locator("#tbGWorkbench").screenshot({path:"wiki-stage-g-screenshots/admin-wiki-"+width+".png",animations:"disabled"});
   await page.locator("#tbGReset").click();
   assert.equal((await page.evaluate(()=>window.__TB_ADMIN_WIKI_G__.getDraft())).records.length,0);
   assert.deepEqual(errors,[],"Page JS errors "+JSON.stringify(errors));
   assert(outside.every(x=>x.startsWith("https://fonts.googleapis.com/")),"Unwanted remote requests "+JSON.stringify(outside.slice(0,4)));
   console.log("WIKI G "+width+" PASS: authenticated Admin, 61/51/26/8 +16, filter, validate, undo, JSON import/export, zero data writes");
  }finally{await context.close()}
 }
}finally{if(browser)await browser.close();server.kill("SIGTERM")}
