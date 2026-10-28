// SEO-08 browser QA: new editorial hubs must remain readable/clickable at 390/768/1440.
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
const root="http://127.0.0.1:18998";
const server=spawn("python3",["-m","http.server","18998","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
let browser;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
 await delay(650);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:930},reducedMotion:"reduce"});
  await context.route("**/*",route=>{
   const u=new URL(route.request().url());
   if(u.origin===root)return route.continue();
   return route.abort();
  });
  for(const route of ["news-analysis","news-featured","news-update"]){
   const page=await context.newPage(),errors=[];
   page.on("pageerror",err=>errors.push(err.message));
   try{
    const response=await page.goto(root+"/"+route+".html",{waitUntil:"domcontentloaded",timeout:23000});
    assert.equal(response.status(),200);
    const cards=page.locator("#tb-seo-topic-section a.tb-seo-topic__card");
    assert.equal(await cards.count(),3);
    assert(await page.locator("#tb-seo-topic-title").isVisible());
    const data=await page.evaluate(()=>{
     const box=document.getElementById("tb-seo-topic-section");
     const rect=box.getBoundingClientRect();
     return {scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,
       rectX:rect.x,right:rect.right,visible:getComputedStyle(box).display!=="none",
       links:[...box.querySelectorAll("a")].map(x=>x.getAttribute("href"))};
    });
    assert(data.visible&&data.rectX>=-2&&data.right<=width+2&&data.scrollWidth<=width+6,
     "Horizontal overflow "+route+" "+width+": "+JSON.stringify(data));
    assert(data.links.length===3&&data.links.every(x=>x.startsWith("/")));
    await cards.first().focus();
    assert(await cards.first().evaluate(el=>el===document.activeElement),"Keyboard focus lost");
    assert.deepEqual(errors,[],"JS error "+JSON.stringify(errors));
    fs.mkdirSync("seo-06-10-artifacts/screenshots",{recursive:true});
    await page.locator("#tb-seo-topic-section").screenshot({
      path:"seo-06-10-artifacts/screenshots/"+route+"-"+width+".png",animations:"disabled"});
    console.log("SEO-08 "+route+" "+width+" PASS: cards keyboard readable, no horizontal overflow");
   }finally{await page.close()}
  }
  await context.close();
 }
}finally{if(browser)await browser.close();server.kill("SIGTERM")}
