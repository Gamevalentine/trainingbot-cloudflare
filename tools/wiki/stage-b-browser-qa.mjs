// TrainingBot Wiki Stage B.1–B.6 browser acceptance
// All backend requests mocked locally. Never contact Production Worker or D1.
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
const ROOT="http://127.0.0.1:18994";
const totals={weapons:61,attachments:51,vehicles:26,maps:8};
const server=spawn("python3",["-m","http.server","18994","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
let browser;const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const click=async(page,selector)=>page.evaluate(s=>{const el=document.querySelector(s);if(!el)throw Error("Missing "+s);el.click();},selector);
try{
 const html=fs.readFileSync("public/wiki.html","utf8");
 assert(html.includes("wiki-stage-b-v2.js")&&html.includes("wiki-stage-b-v2.css"));
 assert(html.indexOf("wiki-stage-b-v2.js")>html.indexOf("wiki_audit_v149.js"),"Presentation must load after final patch");
 await sleep(800);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [390,768,1440]){
  const ctx=await browser.newContext({viewport:{width,height:860},reducedMotion:"reduce"});
  const errors=[],unexpectedWrites=[],external=[];
  await ctx.route("**/*",route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.pathname.startsWith("/api/")){
    if(req.method()!=="GET"&&!(req.method()==="POST"&&url.pathname==="/api/visitor-events"))unexpectedWrites.push(req.method()+" "+url.pathname);
    return route.fulfill({status:200,contentType:"application/json",body:'{"ok":true}'});
   }
   if(url.origin===ROOT)return route.continue();
   external.push(url.href);return route.abort();
  });
  const page=await ctx.newPage();
  page.on("pageerror",e=>errors.push(e.stack||e.message));
  try{
   await page.goto(ROOT+"/wiki.html",{waitUntil:"domcontentloaded",timeout:25000});
   try{
    await page.waitForFunction(()=>document.body.classList.contains("tb-wiki-stage-b")&&DATA.weapons.length===61&&document.querySelectorAll("#tbWikiGrid .tb-wiki-card").length===61,undefined,{timeout:14000});
   }catch(error){
    const diagnostic=await page.evaluate(()=>({
      title:document.title,stageB:document.body.className,
      data:typeof DATA==="undefined"?"missing":Object.fromEntries(Object.entries(DATA).map(([key,value])=>[key,value.length])),
      grid:document.querySelectorAll("#tbWikiGrid .tb-wiki-card").length,
      errorText:document.querySelector("main")?.textContent?.slice(0,240),
      assets:[...performance.getEntriesByType("resource")].filter(x=>/wiki-stage-b-v2|wiki_catalog_verified_v147|wiki_audit_v149/.test(x.name)).map(x=>({name:x.name,status:x.responseStatus})),
      bIntro:!!document.querySelector(".tb-b-intro")
    }));
    console.log("B INITIALIZATION DIAGNOSTIC",JSON.stringify({diagnostic,errors,external:external.slice(0,6)}));
    throw error;
   }
   await page.waitForTimeout(1100);
   assert.equal(await page.locator(".tb-b-intro").count(),1);
   assert.equal(await page.locator(".tb-b-controls").count(),1);
   assert.equal(await page.locator("#tbBSort").count(),1);
   assert((await page.locator(".tb-b-total").innerText()).includes("146"),"Total data count must be derived from DATA");
   const badges=await page.evaluate(()=>Object.fromEntries([...document.querySelectorAll("#tbWikiTabs .tb-wiki-tab")].map(x=>[x.dataset.tab,Number(x.querySelector("small")?.textContent)])));
   assert.deepEqual(badges,totals,"Rendered counts should match effective DATA (not 56/49)");
   const styles=await page.evaluate(()=>({css:[...document.styleSheets].some(s=>s.href?.includes("wiki-stage-b-v2.css")),
    font:getComputedStyle(document.querySelector("#tbWikiGrid .tb-wiki-card h3")).fontFamily,
    cards:getComputedStyle(document.getElementById("tbWikiGrid")).gridTemplateColumns}));
   assert(styles.css&&styles.font.includes("Segoe UI"),"Wiki typography and stylesheet missing "+JSON.stringify(styles));
   let facts=await page.locator("#tbWikiGrid .tb-wiki-card .tb-b-card-facts").count();
   assert.equal(facts,61,"Each weapon card needs readable, source-derived facts");

   // Non-diacritic and Unicode-Đ-aware search; no cards or handlers removed.
   await page.locator("#tbWikiSearch").fill("akm");
   await page.waitForFunction(()=>document.querySelectorAll("#tbWikiGrid .tb-wiki-card:not([hidden])").length===1,undefined,{timeout:5000});
   assert.equal(await page.locator("#tbWikiGrid .tb-wiki-card:not([hidden]) h3").innerText(),"AKM");
   assert((await page.locator("#tbBResultCount").innerText()).includes("1 / 61"));
   await page.locator("#tbWikiSearch").fill("sung truong");
   await page.waitForFunction(()=>document.querySelectorAll("#tbWikiGrid .tb-wiki-card:not([hidden])").length>3,undefined,{timeout:5000});
   await page.locator("#tbWikiSearch").fill("zzz-no-such-gun");
   await page.waitForFunction(()=>!document.querySelector(".tb-b-empty").hidden,undefined,{timeout:5000});
   assert.equal(await page.locator("#tbWikiGrid .tb-wiki-card:not([hidden])").count(),0);
   await click(page,".tb-b-empty .tb-b-reset");
   await page.waitForFunction(()=>document.querySelectorAll("#tbWikiGrid .tb-wiki-card:not([hidden])").length===61,undefined,{timeout:5000});

   // Sorting moves original DOM nodes, original detail/card handlers preserved.
   await page.locator("#tbBSort").selectOption("name-asc");
   await page.waitForFunction(()=>{
    const names=[...document.querySelectorAll("#tbWikiGrid .tb-wiki-card")].map(x=>x.querySelector("h3")?.textContent.trim());
    return names.length===61&&names[0]!=="AKM";
   },undefined,{timeout:5000});
   const sorted=(await page.locator("#tbWikiGrid .tb-wiki-card h3").allTextContents()).map(x=>x.trim()); // content-visibility:auto skips off-screen innerText
   assert.deepEqual(sorted,sorted.slice().sort((a,b)=>a.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().localeCompare(b.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(),"vi")),"Alphabetic sorted grid order");
   await page.locator("#tbBSort").selectOption("default");

   // Legacy filter still drives grid; unknown numbers are not fabricated.
   await click(page,'#tbWikiFilters button[data-filter="DMR"]');
   await page.waitForFunction(()=>document.querySelectorAll("#tbWikiGrid .tb-wiki-card").length>1&&document.querySelectorAll("#tbWikiGrid .tb-wiki-card").length<30,undefined,{timeout:5000});
   assert((await page.locator("#tbBResultCount").innerText()).includes("DMR")===false);
   await click(page,'#tbWikiFilters button[data-filter="Tất cả"]');
   await page.waitForFunction(()=>document.querySelectorAll("#tbWikiGrid .tb-wiki-card").length===61,undefined,{timeout:5000});

   // Four collections: badges, record preservation, category-specific fields.
   for(const [kind,total] of Object.entries(totals)){
    await click(page,'#tbWikiTabs button[data-tab="'+kind+'"]');
    await page.waitForFunction(({kind,total})=>
      document.querySelector('#tbWikiTabs button[data-tab="'+kind+'"]')?.classList.contains("active")&&
      document.querySelectorAll("#tbWikiGrid .tb-wiki-card").length===total&&
      document.querySelectorAll("#tbWikiGrid .tb-wiki-card .tb-b-card-facts").length===total,
      {kind,total},{timeout:7000});
    assert.equal(await page.locator("#tbWikiGrid .tb-wiki-card:not([hidden])").count(),total);
    assert.equal(await page.locator("#tbWikiTabs button[data-tab='"+kind+"'] small").innerText(),String(total));
    const first=page.locator("#tbWikiGrid .tb-wiki-card").first();
    assert(await first.getAttribute("aria-label"),kind+" card lacks accessible action label");
    assert(await first.locator(".tb-b-card-fact").count()>=1,kind+" card facts missing");
   }
   await click(page,'#tbWikiTabs button[data-tab="weapons"]');
   await page.waitForFunction(()=>document.querySelectorAll("#tbWikiGrid .tb-wiki-card .tb-b-card-facts").length===61,undefined,{timeout:7000});
   // Open the original detailed weapon overlay: Stage B must not replace it.
   await click(page,'#tbWikiGrid .tb-wiki-card');
   await page.waitForFunction(()=>document.querySelector(".tb-v145.open, #tbWikiModal.open"),undefined,{timeout:7000});
   const detail=await page.evaluate(()=>({weapon:!!document.querySelector(".tb-v145.open"),modal:!!document.querySelector("#tbWikiModal.open")}));
   assert(detail.weapon,"Existing v145 detailed weapon view must remain active");
   await page.keyboard.press("Escape");
   await page.waitForFunction(()=>!document.querySelector(".tb-v145.open"),undefined,{timeout:6000});
   // Compare mode still selects original cards.
   await click(page,"#tbCompareBtn");
   await page.waitForFunction(()=>document.querySelector(".tb-wiki-shell.compare-mode"),undefined,{timeout:5000});
   await click(page,'#tbWikiGrid .tb-wiki-card:nth-child(1)');
   await click(page,'#tbWikiGrid .tb-wiki-card:nth-child(2)');
   assert((await page.locator("#tbCompareBtn").innerText()).includes("2"),"Comparison counter not updated");
   await click(page,"#tbCompareBtn");
   await page.waitForFunction(()=>document.querySelector(".tb-v145.open, #tbWikiModal.open"),undefined,{timeout:6500});

   if(width===390||width===1440){
    // Capture the polished default Wiki, not the modal overlay.
    await page.keyboard.press("Escape");
    await click(page,"#tbCompareBtn");
    await page.waitForTimeout(250);
    fs.mkdirSync("wiki-stage-b-screenshots",{recursive:true});
    await page.screenshot({path:"wiki-stage-b-screenshots/wiki-b-"+width+".png",animations:"disabled"});
   }
   const overflow=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
   assert(overflow.page<=width+9,"Horizontal overflow on "+width+": "+JSON.stringify(overflow));
   assert.deepEqual(unexpectedWrites,[],"Unexpected backend write");
   assert.deepEqual(errors,[],"Uncaught frontend error");
   console.log("Wiki B "+width+"px PASS: 146 source records, four tabs, unicode search, sort, filters, original detail/compare, no writes");
  }finally{await ctx.close();}
 }
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
