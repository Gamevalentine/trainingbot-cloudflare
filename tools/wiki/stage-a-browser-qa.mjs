// Wiki Stage A browser audit. Execute existing frontend on an isolated local
// server; never call live Worker, database or remote APIs.
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawn,execFileSync} from "node:child_process";
import {chromium} from "playwright";
const root="http://127.0.0.1:18997";
const kinds=["weapons","attachments","vehicles","maps"];
const expected={weapons:61,attachments:51,vehicles:26,maps:8};
const server=spawn("python3",["-m","http.server","18997","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
let browser;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
 await delay(700);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:"reduce"});
 const outside=[],writes=[],errors=[];
 await ctx.route("**/*",route=>{
  const req=route.request(),u=new URL(req.url());
  if(u.pathname.startsWith("/api/")){
   if(!["GET","HEAD"].includes(req.method()))writes.push(req.method()+" "+u.pathname);
   return route.fulfill({status:200,contentType:"application/json",body:'{"ok":true}'});
  }
  if(u.origin===root)return route.continue();
  outside.push(u.href);return route.abort();
 });
 const page=await ctx.newPage();
 page.on("pageerror",e=>errors.push(e.message));
 await page.goto(root+"/wiki.html",{waitUntil:"domcontentloaded",timeout:26000});
 await page.waitForFunction(()=>typeof DATA!=="undefined"&&DATA.weapons.length===61&&DATA.attachments.length===51&&DATA.vehicles.length===26&&
    DATA.vehicles.some(r=>r[0]==="Tracked Amphicarrier")&&DATA.weapons.some(r=>r[0]==="Dual MP7")&&DATA.weapons.find(r=>r[0]==="P90")?.[2]==="5.7mm",
    undefined,{timeout:21000});
 await page.waitForTimeout(700);
 const snapshot={data:await page.evaluate(()=>JSON.parse(JSON.stringify(DATA))),images:{}};
 for(const kind of kinds){
  const btn=page.locator('#tbWikiTabs .tb-wiki-tab[data-tab="'+kind+'"]');
  assert.equal(await btn.count(),1,"Wiki tab missing: "+kind);
  await btn.evaluate(el=>el.click());
  await page.waitForFunction(({kind,total})=>{
   const tab=document.querySelector('#tbWikiTabs .tb-wiki-tab[data-tab="'+kind+'"]');
   const grid=document.getElementById("tbWikiGrid");
   return !!tab?.classList.contains("active")&&grid?.querySelectorAll(".tb-wiki-card").length===total;
  },{kind,total:expected[kind]},{timeout:14000});
  const cards=await page.evaluate(()=>{
    return [...document.querySelectorAll("#tbWikiGrid .tb-wiki-card")].map(card=>({
     name:card.querySelector("h3")?.textContent.trim()||"",
     url:card.querySelector(".tb-card-visual img")?.getAttribute("src")||null,
     alt:card.querySelector(".tb-card-visual img")?.getAttribute("alt")||null,
     visualKind:card.querySelector(".tb-card-visual img")?"image":card.querySelector(".tb-card-visual svg")?"svg":"other"
    }));
  });
  const names=cards.map(x=>x.name),duplicates=names.filter((n,i)=>names.indexOf(n)!==i);
  assert.equal(duplicates.length,0,kind+" duplicate rendered cards: "+duplicates.join(", "));
  assert.equal(cards.length,expected[kind]);
  snapshot.images[kind]=Object.fromEntries(cards.map(x=>[x.name,{url:x.url,alt:x.alt,visualKind:x.visualKind}]));
  const aria=await btn.locator("small").innerText();
  assert.equal(Number(aria),expected[kind],kind+" count badge stale");
  console.log(kind+" PASS: "+cards.length+" rendered, counted and unique");
 }
 const p90=snapshot.data.weapons.find(r=>r[0]==="P90");
 const dual=snapshot.data.weapons.find(r=>r[0]==="Dual MP7");
 const tracked=snapshot.data.vehicles.find(r=>r[0]==="Tracked Amphicarrier");
 assert.equal(p90[2],"5.7mm");
 assert.equal(dual[3],"Loạt 2 viên/Tự động");
 assert.equal(tracked[2],"Chưa xác minh");
 assert(!snapshot.data.vehicles.some(r=>r[0]==="BRDM-2"),"Vehicle old renamed row still duplicated");
 const safeOutside=outside.filter(x=>!x.startsWith("https://fonts.googleapis.com")&&!x.startsWith("https://fonts.gstatic.com")&&!/\.(png|jpe?g|webp|svg)(\?|$)/i.test(x));
 assert.deepEqual(safeOutside,[],"Unexpected external non-image requests");
 assert(writes.every(x=>x==="POST /api/visitor-events"),"Unexpected API writes: "+JSON.stringify(writes)); // Existing site visit telemetry; mocked locally, no remote data written.
 assert.deepEqual(errors,[],"Runtime JS errors");
 fs.mkdirSync("wiki-stage-a-artifacts",{recursive:true});
 fs.writeFileSync("wiki-stage-a-artifacts/runtime-snapshot.json",JSON.stringify(snapshot,null,2));
 await page.screenshot({path:"wiki-stage-a-artifacts/wiki-runtime.png",animations:"disabled"});
 await ctx.close();
 console.log("STAGE A BROWSER: four catalogs, P90 final, Dual MP7 and tracked vehicle PASS");
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
execFileSync("node",["tools/wiki/stage-a-audit.mjs","--runtime","wiki-stage-a-artifacts/runtime-snapshot.json","--out","wiki-stage-a-artifacts"],{stdio:"inherit"});
