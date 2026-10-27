import assert from "node:assert/strict";
import fs from "node:fs";
import {chromium} from "playwright";
import {spawn} from "node:child_process";
const headers=fs.readFileSync("public/_headers","utf8");
assert(headers.includes("Content-Security-Policy: base-uri 'self'; object-src 'none'; frame-ancestors 'self'"));
assert(headers.includes("/search-index-v152.json"));
assert(headers.includes("max-age=300"));
const source=fs.readFileSync("public/header_search_v152.js","utf8");
assert(source.includes("safeRoute(value)"));
assert(source.includes("Promise.allSettled"));
assert(source.includes("searchIndexPromise=null"));
assert(fs.existsSync("public/hero_spotlight_v203.js"));
const port=18779,root="http://127.0.0.1:"+port;
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
let browser;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await sleep(750);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [375,1280]){
  const context=await browser.newContext({viewport:{width,height:812}});
  let offline=false;
  await context.route("**/api/posts?*",route=>{
   if(offline)return route.fulfill({status:503,contentType:"application/json",body:'{"ok":false}'});
   return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ok:true,posts:[
    {title:"P2 Search Result",slug:"p2-safe",url:"/bai-viet/p2-safe",summary:"Mẫu kiểm thử kết quả",category:"Tin tức"},
    {title:"P2 Malicious Result",slug:"bad",url:"javascript:alert(1)",summary:"Không được nhấp",category:"Tin tức"},
    {title:"P2 External Result",url:"//attacker.invalid/fake",summary:"Không được nhấp"}
   ]})});
  });
  await context.route("**/api/beta-versions",route=>route.fulfill({status:200,contentType:"application/json",body:'{"ok":true,"versions":[]}'}));
  await context.route("**/api/flash-download-counts",route=>route.fulfill({status:200,contentType:"application/json",body:'{"ok":true,"counts":{}}'}));
  const page=await context.newPage();
  await page.goto(root+"/",{waitUntil:"domcontentloaded"});
  const trigger=page.locator('.header-actions button[aria-label="Tìm kiếm"]').first();
  await trigger.click();
  const panel=page.locator(".tb-search-overlay");
  await assert.equal(await panel.isVisible(),true);
  const input=page.locator(".tb-search-panel input[type=search]");
  await input.fill("P2");
  await page.waitForSelector('.tb-search-result[href="/bai-viet/p2-safe"]');
  const rendered=await page.locator(".tb-search-results a").evaluateAll(links=>links.map(n=>n.getAttribute("href")));
  assert(rendered.includes("/bai-viet/p2-safe"));
  assert(!rendered.some(h=>h?.startsWith("javascript:")||h?.startsWith("//attacker.invalid")));
  await input.fill("zzzzzz-no-results-unique");
  await page.getByText("Không tìm thấy kết quả", {exact:false}).first().waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await panel.isHidden(),true);
  assert.equal(await trigger.evaluate(el=>document.activeElement===el),true);
  // Failed sources are distinguishable from an empty result and retry can recover.
  offline=true;
  await context.route("**/search-index-v152.json",route=>offline?route.fulfill({status:503,body:"unavailable"}):route.continue());
  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator('.header-actions button[aria-label="Tìm kiếm"]').first().click();
  await page.locator(".tb-search-panel input[type=search]").fill("P2");
  await page.waitForSelector(".tb-search-retry",{timeout:8000});
  assert((await page.locator(".tb-search-status").innerText()).includes("Không thể tải"));
  offline=false;
  await page.locator(".tb-search-retry").click();
  await page.waitForSelector('.tb-search-result[href="/bai-viet/p2-safe"]',{timeout:8000});
  const dimensions=await page.evaluate(()=>({client:document.documentElement.clientWidth,total:document.documentElement.scrollWidth}));
  assert(dimensions.total<=width+4,"Search popup caused horizontal overflow at "+width);
  const performance=await page.evaluate(()=>{
   const nav=performance.getEntriesByType("navigation")[0];
   return {domContentLoadedMs:Math.round(nav?.domContentLoadedEventEnd||0),staticEntries:performance.getEntriesByType("resource").length};
  });
  console.log("P2 search "+width+"px safe URLs, error/retry, keyboard, no-overflow PASS",performance);
  await context.close();
 }
 console.log("P2 static CSP/frame restriction and search-index revalidation: PASS");
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
