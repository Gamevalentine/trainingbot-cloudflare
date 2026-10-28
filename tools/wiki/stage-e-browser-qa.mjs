// Wiki E1–E6 acceptance: full real build; isolated local browser, no live API writes.
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
const root="http://127.0.0.1:18991",port="18991";
const site=fs.readFileSync("public/wiki.html","utf8");
assert(site.includes("wiki-stage-e-compare.js")&&site.indexOf("wiki-stage-e-compare.js")>site.indexOf("wiki-stage-d-v2.js"));
for(const n of ["wiki-stage-e-compare.js","wiki-stage-e-compare.css","wiki-stage-c-evidence.json"])assert(fs.existsSync("public/"+n));
assert(!fs.readFileSync("public/admin.html","utf8").includes("wiki-stage-e-compare.js"));
assert(fs.readFileSync("public/wiki_verified_data_v145.js","utf8").includes("window.__TB_WIKI_E__?.selecting"));
const source=JSON.parse(fs.readFileSync("public/wiki-stage-c-evidence.json","utf8"));
assert(Object.keys(source.weapons).length>=11);
const server=spawn("python3",["-m","http.server",port,"--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const sleep=n=>new Promise(r=>setTimeout(r,n));
let browser;
async function clickWeapon(page,name){
 const loc=page.locator("#tbWikiGrid .tb-wiki-card").filter({has:page.locator("h3", {hasText:name})}).first();
 assert(await loc.count(),"missing weapon card "+name);
 await loc.evaluate(el=>el.click());
}
try{
 await sleep(800);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
  const errors=[],writes=[],remote=[];
  await context.route("**/*",route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.pathname.startsWith("/api/")){
    if(!["GET","HEAD"].includes(req.method())&&!(req.method()==="POST"&&url.pathname==="/api/visitor-events"))writes.push(req.method()+" "+url.pathname);
    return route.fulfill({status:200,contentType:"application/json",body:'{"ok":true}'});
   }
   if(url.origin===root)return route.continue();
   remote.push(url.href);return route.abort();
  });
  const page=await context.newPage();
  page.on("pageerror",err=>errors.push(err.message));
  try{
   await page.goto(root+"/wiki.html",{waitUntil:"domcontentloaded",timeout:28000});
   await page.waitForFunction(()=>window.__TB_WIKI_E__?.ready&&DATA.weapons.length===61,undefined,{timeout:19000});
   await page.locator("#tbCompareBtn").click();
   assert.equal(await page.evaluate(()=>window.__TB_WIKI_E__.selecting),true);
   await clickWeapon(page,"M416");
   await clickWeapon(page,"AKM");
   await page.waitForFunction(()=>window.__TB_WIKI_E__.selected.length===2,undefined,{timeout:9000});
   assert.equal(await page.locator(".tb-v145.open").count(),0,"Legacy v145 intercepted compare selections");
   assert.equal(await page.locator("#tbWikiModal.open").count(),0,"Legacy dialog opened in picker mode");
   await page.waitForFunction(()=>document.querySelectorAll("#tbETray .tb-e-chip").length===2&&!document.querySelector("#tbETray .tb-e-open")?.disabled,undefined,{timeout:8000});
   await page.locator("#tbETray .tb-e-open").click();
   await page.waitForFunction(()=>window.__TB_WIKI_E__.open&&document.querySelector("#tbECompareModal")?.open,undefined,{timeout:8500});
   assert.equal(await page.locator("#tbECompareModal .tb-e-weapon-head").count(),2);
   // E.8: check the actual comparison modal and share controls fit the viewport.
   // The metrics table may legitimately scroll inside its dedicated region.
   const responsive=await page.evaluate(()=>{
    const dialog=document.getElementById("tbECompareModal");
    const share=dialog.querySelector(".tb-e-share");
    const table=dialog.querySelector(".tb-e-scroll");
    const bounds=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}};
    return {viewport:innerWidth,dialog:bounds(dialog),share:bounds(share),table:bounds(table),
      tableOverflow:table.scrollWidth>table.clientWidth+1};
   });
   for(const [key,rect] of Object.entries({dialog:responsive.dialog,share:responsive.share,table:responsive.table})){
    assert(rect.left>=-2&&rect.right<=responsive.viewport+2,
      "E.8 "+width+"px: "+key+" overflows viewport "+JSON.stringify(responsive));
   }
   if(width===390)assert(responsive.tableOverflow,"E.8: mobile table should have its own horizontal scroll");
   const noFake=await page.locator("#tbECompareModal .tb-e-empty-chart").innerText();
   assert(noFake.includes("Chưa đủ ít nhất 2 giá trị"),"Invented chart for unsourced M416 AKM");
   assert((await page.locator("#tbECompareModal .tb-e-warning").innerText()).includes("Chưa xác minh"));
   const link=await page.locator("#tbEShareLink").inputValue();
   assert(new URL(link).searchParams.get("compare")==="M416,AKM","Share link incorrect "+link);
   await page.locator("#tbECompareModal .tb-e-close").click();
   assert.equal(await page.locator("#tbECompareModal[open]").count(),0);
   // Native card selection must still work after return from the dialog.
   await clickWeapon(page,"QBZ");
   await page.waitForFunction(()=>document.querySelectorAll("#tbETray .tb-e-chip").length===3,undefined,{timeout:8000});
   await clickWeapon(page,"FAMAS");
   assert.deepEqual(await page.evaluate(()=>window.__TB_WIKI_E__.selected),["M416","AKM","QBZ"],"Maximum three weapons exceeded");
   await page.locator("#tbETray .tb-e-chip").filter({hasText:"M416"}).click();
   await page.locator("#tbETray .tb-e-chip").filter({hasText:"AKM"}).click();
   await page.waitForFunction(()=>window.__TB_WIKI_E__.selected.length===1&&document.querySelector("#tbETray .tb-e-open")?.disabled,undefined,{timeout:9000});
   assert((await page.locator("#tbETray .tb-e-open").isDisabled()),"Compare allowed one weapon");
   await clickWeapon(page,"PP-19 Bizon");
   await page.waitForFunction(()=>document.querySelectorAll("#tbETray .tb-e-chip").length===2&&!document.querySelector("#tbETray .tb-e-open")?.disabled,undefined,{timeout:8000});
   await page.locator("#tbETray .tb-e-open").click();
   await page.waitForFunction(()=>window.__TB_WIKI_E__.open&&document.querySelector("#tbECompareModal")?.open,undefined,{timeout:9000});
   assert.equal(await page.locator("#tbECompareModal .tb-e-weapon-head").count(),2);
   const chart=await page.locator("#tbECompareModal .tb-e-chart").innerText();
   assert(chart.includes("Sát thương cơ bản")&&chart.includes("42")&&chart.includes("37"),"Same-release 2.4 sourced chart missing "+chart);
   assert.equal(await page.locator("#tbECompareModal .tb-e-chart-row").count(),2,"Unverifiable comparisons in bar chart");
   assert.equal(await page.locator("#tbECompareModal .tb-e-source[href*='pubgmobile.com']").count()>0,true);
   const url=await page.locator("#tbEShareLink").inputValue();
   const raw=new URL(url).searchParams.get("compare");
   assert.equal(raw,"QBZ,PP-19 Bizon");
   if([390,768,1440].includes(width)){
    fs.mkdirSync("wiki-stage-e-screenshots",{recursive:true});
    await page.screenshot({path:"wiki-stage-e-screenshots/qbz-pp19-"+width+".png",animations:"disabled"});
   }
   // E.7: Escape must close the native dialog without discarding selections.
   if(width===768){
    await page.keyboard.press("Escape");
    await page.waitForFunction(()=>!document.getElementById("tbECompareModal")?.open);
    assert.equal(await page.evaluate(()=>window.__TB_WIKI_E__.selected.length),2);
   }else await page.locator("#tbECompareModal .tb-e-close").click();
   await page.locator("#tbETray .tb-e-exit").click();
   assert.equal(await page.evaluate(()=>window.__TB_WIKI_E__.selecting),false);
   await page.waitForFunction(()=>document.getElementById("tbETray")?.hidden===true,undefined,{timeout:8000});
   await clickWeapon(page,"M416");
   await page.waitForFunction(()=>document.querySelector(".tb-v145.open")?.querySelector("h2")?.textContent==="M416",undefined,{timeout:9000});
   await page.locator(".tb-v145-close").click();
   // Restore link without third-party storage, safely and without auto-popup.
   await page.goto(root+"/wiki.html?compare=QBZ%2CPP-19+Bizon",{waitUntil:"domcontentloaded",timeout:25000});
   await page.waitForFunction(()=>window.__TB_WIKI_E__?.ready&&window.__TB_WIKI_E__.selected.length===2,undefined,{timeout:18000});
   await page.waitForFunction(()=>document.querySelectorAll("#tbETray .tb-e-chip").length===2,undefined,{timeout:9000});
   assert.equal(await page.locator("#tbECompareModal[open]").count(),0);
   if(width===1440){
    const button=page.locator("#tbWikiGrid .tb-wiki-card").filter({has:page.locator("h3",{hasText:"M416"})}).first();
    await button.focus();await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(()=>window.__TB_WIKI_E__.selected.length),3,"Keyboard selection failed");
   }
   await page.locator('#tbWikiTabs .tb-wiki-tab[data-tab="attachments"]').evaluate(el=>el.click());
   await page.waitForFunction(()=>document.querySelector("#tbWikiTabs .tb-wiki-tab.active")?.dataset.tab==="attachments"&&!window.__TB_WIKI_E__.selecting,undefined,{timeout:9000});
   await page.waitForFunction(()=>document.getElementById("tbETray")?.hidden===true,undefined,{timeout:8000});
   // E.7: invalid, duplicate and oversized shared selections must be rejected.
   if(width===1440){
    for(const invalid of ["QBZ,QBZ","QBZ,INVALID","QBZ,M416,AKM,FAMAS"]){
     await page.goto(root+"/wiki.html?compare="+encodeURIComponent(invalid),{waitUntil:"domcontentloaded",timeout:25000});
     await page.waitForFunction(()=>window.__TB_WIKI_E__?.ready,undefined,{timeout:18000});
     assert.equal(await page.evaluate(()=>new URL(location.href).searchParams.has("compare")),false,
       "Invalid shared selection not removed: "+invalid);
     assert.deepEqual(await page.evaluate(()=>window.__TB_WIKI_E__.selected),[],
       "Invalid shared selection was restored: "+invalid);
    }
   }
   assert.deepEqual(writes,[],"Unexpected API writes");
   assert.deepEqual(errors,[],"JS errors "+errors.join("; "));
   console.log("WIKI E "+width+" PASS: 2/3 selection, v145 guard, no fake scores, 2.4 chart, share/restore, navigation");
  }finally{await context.close();}
 }
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
