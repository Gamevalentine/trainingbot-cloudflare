// Wiki F.1–F.6 browser acceptance: built integrated page, offline mocks, no live writes.
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
const root="http://127.0.0.1:18993",port="18993";
const html=fs.readFileSync("public/wiki.html","utf8"),admin=fs.readFileSync("public/admin.html","utf8");
assert(html.includes("wiki-stage-f-guides.js")&&html.indexOf("wiki-stage-f-guides.js")>html.indexOf("wiki-stage-e-compare.js"),"F must load after E");
assert(!admin.includes("wiki-stage-f-guides.js"),"Stage F leaked into Admin");
for(const asset of ["wiki-stage-f-guides.js","wiki-stage-f-guides.css","wiki-stage-f-guides.json","wiki-stage-c-evidence.json","wiki-stage-d-evidence.json"]){
 assert(fs.existsSync("public/"+asset),"Missing "+asset);
}
const data=JSON.parse(fs.readFileSync("public/wiki-stage-f-guides.json","utf8"));
const c=JSON.parse(fs.readFileSync("public/wiki-stage-c-evidence.json","utf8"));
const d=JSON.parse(fs.readFileSync("public/wiki-stage-d-evidence.json","utf8"));
assert.equal(data.schemaVersion,"wiki-f1");
assert.equal(data.guides.length,16);
assert.equal(new Set(data.guides.map(x=>x.id)).size,16);
assert.deepEqual(["weapons","attachments","maps","mobility"].map(category=>data.guides.filter(x=>x.category===category).length),[6,3,4,3]);
for(const guide of data.guides){
 assert(guide.contentType==="editorial_training"&&guide.steps.length>=3,"Unlabelled editorial guide "+guide.id);
 for(const ref of guide.evidence){
  const entity=ref.registry==="c"?c.weapons[ref.entity]?.history.find(x=>x.sourceId===ref.sourceId):
   d.maps[ref.entity]||d.vehicles[ref.entity]||d.unlisted[ref.entity];
  const source=ref.registry==="c"?c.sources[ref.sourceId]:d.sources[ref.sourceId];
  assert(entity&&source,"Unresolved source pointer "+guide.id+" "+JSON.stringify(ref));
  if(ref.registry==="d")assert.equal(entity.sourceId,ref.sourceId);
  const url=new URL(source.url);
  assert(url.protocol==="https:"&&["www.pubgmobile.com","pubgm.vnggames.com"].includes(url.hostname),"Unapproved source URL "+source.url);
 }
}
const server=spawn("python3",["-m","http.server",port,"--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
try{
 await pause(800);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:950},reducedMotion:"reduce"});
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
   await page.goto(root+"/wiki.html",{waitUntil:"domcontentloaded",timeout:29000});
   await page.waitForFunction(()=>window.__TB_WIKI_F__?.ready&&window.__TB_WIKI_E__?.ready&&window.__TB_WIKI_D__?.ready,undefined,{timeout:23000});
   assert.equal(await page.locator("#tbFGuide-w-qbz").count(),1);
   assert.equal(await page.locator("#tbFGuides .tb-f-content[hidden]").count(),1,"F default should not push catalog down");
   assert.equal(await page.locator("#tbFGuides .tb-f-card").count(),16);
   await page.locator(".tb-f-toggle").click();
   await page.waitForFunction(()=>window.__TB_WIKI_F__.expanded&&document.querySelector("#tbFContent")?.hidden===false);
   assert.equal(await page.locator(".tb-f-card:visible").count(),16);
   const rects=await page.evaluate(()=>{
    const root=document.getElementById("tbFGuides"),first=root.querySelector(".tb-f-card"),bar=root.querySelector(".tb-f-toolbar");
    const measure=el=>{const b=el.getBoundingClientRect();return {left:b.left,right:b.right}};
    return {root:measure(root),first:measure(first),toolbar:measure(bar),width:innerWidth};
   });
   for(const [kind,bounds] of Object.entries(rects)){
    if(kind==="width")continue;
    assert(bounds.left>=-2&&bounds.right<=width+2,"F overflow "+width+" "+kind+" "+JSON.stringify(rects));
   }
   // F.1/F.3: categories and accent-insensitive search.
   await page.locator('.tb-f-category[data-category="attachments"]').click();
   assert.equal(await page.locator(".tb-f-card:visible").count(),3);
   await page.locator(".tb-f-search").fill("kiem chung");
   assert.equal(await page.locator(".tb-f-card:visible").count(),1,"No accent-insensitive search");
   assert.equal(await page.locator("#tbFGuide-a-validation:visible").count(),1);
   await page.locator(".tb-f-search").fill("");
   for(const [kind,expected] of [["weapons",6],["maps",4],["mobility",3],["all",16]]){
    await page.locator('.tb-f-category[data-category="'+kind+'"]').click();
    assert.equal(await page.locator(".tb-f-card:visible").count(),expected,"Category "+kind);
   }
   // F.2: source-linked *historical* release, clearly different from editorial recommendations.
   await page.locator("#tbFGuide-w-qbz summary").click();
   const qbz=page.locator("#tbFGuide-w-qbz");
   assert((await qbz.innerText()).includes("Gợi ý luyện tập · biên tập TrainingBot"));
   assert((await qbz.innerText()).includes("Bản 2.4"));
   assert.equal(await qbz.locator(".tb-f-steps li").count(),3);
   assert((await qbz.locator(".tb-f-source-link").getAttribute("href")).includes("pubgmobile.com"));
   // F.4 mode guard for maps (4.6 historical feature, not Classic assertion).
   await page.locator("#tbFGuide-m-erangel summary").click();
   const erangel=page.locator("#tbFGuide-m-erangel");
   assert((await erangel.innerText()).includes("chế độ chủ đề"));
   assert((await erangel.innerText()).includes("Bản 4.6"));
   assert.equal(await erangel.locator(".tb-f-source-link").count(),1);
   // F.5: link to Wiki legacy weapon detail and D map panel (not a fake duplicate).
   await qbz.locator(".tb-f-nav").click();
   await page.waitForFunction(()=>document.querySelector(".tb-v145.open")?.querySelector("h2")?.textContent==="QBZ",undefined,{timeout:10000});
   await page.locator(".tb-v145-close").click();
   await erangel.locator(".tb-f-nav").click();
   await page.waitForFunction(()=>document.querySelector("#tbWikiModal.open .tb-d-release")?.textContent.includes("4.6"),undefined,{timeout:9000});
   await page.locator("#tbWikiModalClose").click();
   await page.locator("#tbFGuide-a-role summary").click();
   await page.locator("#tbFGuide-a-role .tb-f-nav").click();
   await page.waitForFunction(()=>document.querySelector("#tbWikiTabs .tb-wiki-tab.active")?.dataset.tab==="attachments",undefined,{timeout:9000});
   // F.5: permalink must restore only whitelisted guide and not auto-open old Wiki modals.
   await page.goto(root+"/wiki.html?guide=m-erangel",{waitUntil:"domcontentloaded",timeout:28000});
   await page.waitForFunction(()=>window.__TB_WIKI_F__?.ready&&window.__TB_WIKI_F__.expanded&&window.__TB_WIKI_F__.category==="maps",undefined,{timeout:23000});
   assert.equal(await page.locator("#tbFGuide-m-erangel details[open]").count(),1);
   assert.equal(await page.locator("#tbWikiModal.open,.tb-v145.open,#tbECompareModal[open]").count(),0,"Guide link opened unrelated modal");
   await page.goto(root+"/wiki.html?guide=invalid-guide",{waitUntil:"domcontentloaded",timeout:28000});
   await page.waitForFunction(()=>window.__TB_WIKI_F__?.ready,undefined,{timeout:23000});
   assert.equal(await page.evaluate(()=>new URL(location.href).searchParams.has("guide")),false);
   if([390,768,1440].includes(width)){
    fs.mkdirSync("wiki-stage-f-screenshots",{recursive:true});
    await page.locator(".tb-f-toggle").click();
    await page.locator('.tb-f-category[data-category="weapons"]').click();
    await page.locator("#tbFGuide-w-qbz summary").click();
    await page.locator("#tbFGuides").screenshot({path:"wiki-stage-f-screenshots/practice-"+width+".png",animations:"disabled"}).catch(async err=>{
     fs.mkdirSync("wiki-stage-f-screenshots",{recursive:true});
     await page.locator("#tbFGuides").screenshot({path:"wiki-stage-f-screenshots/practice-"+width+".png",animations:"disabled"});
    });
   }
   assert.deepEqual(writes,[],"Unexpected write requests "+writes);
   assert.deepEqual(errors,[],"Page script failures: "+errors.join("; "));
   console.log("WIKI F "+width+" PASS: 16 guides, 4 topics, accent search, release source, actual Wiki navigation, permalinks, responsive, no writes");
  }finally{await context.close()}
 }
}finally{if(browser)await browser.close();server.kill("SIGTERM")}
