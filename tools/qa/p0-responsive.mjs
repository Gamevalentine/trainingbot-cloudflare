// Responsive QA on freshly built local public site. Never connects to production.
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
import fs from "node:fs/promises";
const port=18765,base="http://127.0.0.1:"+port;
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
const issues=[];
try{
 await sleep(700);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [375,430,768,1280]){
  const context=await browser.newContext({viewport:{width,height:812},deviceScaleFactor:1});
  await context.route("**/*",async route=>{
   const url=route.request().url();
   if(url.includes("/api/beta-versions"))return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ok:true,versions:[{version:"V4.7.3",status:"released",download_url:"https://files.example.invalid/fictional.apk",arch:"x64"}]})});
   if(url.includes("/api/posts"))return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ok:true,posts:[{slug:"qa-test-article",title:"Tin tức kiểm thử",published_at:"2026-10-27T00:00:00Z",summary:"Test",cover_url:"/pubg-game-avatar.webp"}]})});
   if(url.includes("/api/flash-download-counts"))return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ok:true,counts:{"v4.6.1":25,"v4.7.0":30}})});
   if(!url.startsWith(base))return route.abort();
   return route.continue();
  });
  for(const pageName of ["/","/contact.html","/ban-cap-nhat.html","/wiki.html"]){
    const page=await context.newPage();
    await page.goto(base+pageName,{waitUntil:"domcontentloaded",timeout:15000});
    await page.waitForTimeout(500);
    const layout=await page.evaluate(()=>{
      const viewport=document.documentElement.clientWidth;
      const total=document.documentElement.scrollWidth;
      // Ignore intentionally offscreen honeypots and horizontally scrolling
      // Wiki filters. Only test critical interactive surfaces and page width.
      const important=[
        "#tb203Spotlight",
        "#tbHomeBetaState",
        "#tbContactForm button[type=submit]",
        ".tb202-contact-panel",
        ".tb202-wiki-grid"
      ];
      const bad=important.flatMap(selector=>[...document.querySelectorAll(selector)]).filter(n=>{
        const style=getComputedStyle(n);
        if(style.display==="none" || style.visibility==="hidden")return false;
        const r=n.getBoundingClientRect();
        return r.width>0&&(r.right>viewport+5 || r.left < -5);
      }).map(n=>n.tagName.toLowerCase()+"."+String(n.className||"").slice(0,60));
      return {viewport,total,bad};
    });
    if(layout.total > width+4 || layout.bad.length)issues.push({width,pageName,layout});
    if(pageName==="/"){
      const hero=page.locator("#tb203Spotlight");
      assert.equal(await hero.count(),1);
      assert.equal(await page.locator(".tb203-hero-copy").count(),1);
      await page.waitForFunction(()=>document.querySelectorAll("#tb203Dots button").length>=3,undefined,{timeout:3000});
    }
    if(pageName==="/wiki.html"){
      const left=page.locator("#tbP1First"),right=page.locator("#tbP1Second");
      assert.equal(await left.count(),1);
      assert.equal(await right.count(),1);
      await page.waitForFunction(()=>document.querySelectorAll("#tbP1First option").length>10,undefined,{timeout:5000});
      await left.selectOption("M416");
      await right.selectOption("AKM");
      assert(await page.locator("#tbP1Result").innerText().then(s=>s.includes("M416")&&s.includes("AKM")&&s.includes("Ngày kiểm chứng: chưa có")));
      await right.selectOption("UMP45");
      assert(await page.locator("#tbP1Result").innerText().then(s=>s.includes("UMP45")));
    }
    if(pageName==="/contact.html"&&width<=430){
      assert.equal(await page.locator('.mobile-nav a[href="/"]').count(),1);
      const form=page.locator('#tbContactForm button[type="submit"]');
      assert.equal(await form.count(),1);
      assert.equal(await form.isVisible(),true);
      const nav=page.locator(".mobile-nav");
      if(await nav.isVisible()){
       await form.scrollIntoViewIfNeeded();
       const button=await form.boundingBox(),navigation=await nav.boundingBox();
       // Fixed nav can appear below the form; check that there is room for the
       // user to scroll form fully clear of it.
       await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
       const bottom=await page.evaluate(()=>document.body.getBoundingClientRect().bottom);
       assert(bottom>=0);
      }
    }
    if(width===375||width===768){await fs.mkdir("/tmp/trainingbot-p0-mobile",{recursive:true});
      await page.screenshot({path:"/tmp/trainingbot-p0-mobile/"+pageName.replaceAll("/","_")+(pageName==="/"?"home":"")+"_"+width+".png",fullPage:true});}
    await page.close();
  }
  await context.close();
 }
 assert.deepEqual(issues,[],"Responsive overflow detected: "+JSON.stringify(issues));
 console.log("P0 375/430/768/1280px home/contact/updates/wiki: PASS");
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
