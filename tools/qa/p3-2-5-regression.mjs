// P3.2–P3.5 integrated tests on local build with mocked APIs.
// No production requests, no D1 writes, no real downloads.
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
assert(!fs.existsSync(".github/workflows/trainingbot-d1-encrypted-backup.yml"),
  "Stopped backup workflow must not reappear in website branch");
assert(!fs.existsSync("scripts/backup_d1_to_github.py"),
  "Stopped backup script must not reappear in website branch");
for(const path of ["public/index.html","public/contact.html","public/ban-cap-nhat.html",
 "public/wiki.html","public/news.html","public/contact_public_v202.js","public/beta_versions_public_v175.js"]){
 assert(fs.existsSync(path),"Missing build output "+path);
}
// Test article security without D1, Admin or production.
const source=fs.readFileSync("functions/bai-viet/[slug].js","utf8");
const {onRequestGet:renderArticle}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));
const post={
 slug:"qa-sanitizer",title:"Bài kiểm thử",summary:"Nội dung kiểm thử an toàn",
 content:"## Giới thiệu\nBài viết thử nghiệm",
 rich_content:'<p><a href="//attacker.invalid/track">URL lạ</a> '+
 '<a href="javascript:alert(1)">Mã không hợp lệ</a> '+
 '<a href="/wiki">Wiki hợp lệ</a> '+
 '<img src="//attacker.invalid/track.png" onerror="alert(1)" alt="bad"> '+
 '<img src="/pubg-game-avatar.webp" alt="good"></p>',
 category:"Tin mới",cover_url:"//attacker.invalid/cover.webp",status:"published",featured_at:"",
 published_at:"2026-10-21T00:00:00Z",updated_at:"2026-10-22T00:00:00Z"
};
const db={prepare(sql){return{
 bind(){return this},
 async run(){return {success:true}},
 async all(){return {results:sql.includes("PRAGMA")?[{name:"featured_at"},{name:"rich_content"}]:[]}},
 async first(){return post}
}}};
const articleResponse=await renderArticle({env:{DB:db},params:{slug:post.slug}});
assert.equal(articleResponse.status,200);
const html=await articleResponse.text();
assert(!html.includes("attacker.invalid"),"Editorial URL escaped origin");
assert(!html.includes('href="javascript:'),"Script URL accepted");
assert(!html.includes("onerror="),"Event handler accepted");
assert(html.includes('href="/wiki"'),"Safe internal Wiki link rejected");
assert(html.includes('src="/pubg-game-avatar.webp"'),"Safe local image rejected");
assert(html.includes('rel="canonical" href="https://trainingbot.io.vn/bai-viet/qa-sanitizer"'));
console.log("P3.4 article link sanitizer and canonical: PASS");

const port=18863,root="http://127.0.0.1:"+port;
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const versions=[
 {version:"V4.7.3",major:"V4.7",arch:"x64",status:"released",download_url:"https://origin.example.test/beta.apk",updated_at:"2026-10-20T00:00:00Z"},
 {version:"V4.7.4",major:"V4.7",arch:"x64",status:"coming_soon",download_url:"",updated_at:"2026-10-21T00:00:00Z"}
];
let browser;
try{
 await sleep(850);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [375,430,768,1280]){
  const context=await browser.newContext({viewport:{width,height:820}});
  let mode="failure",sent=0,downloads=0;
  await context.route("**/*",async route=>{
   const url=route.request().url(),path=new URL(url).pathname;
   if(path==="/api/contact"){
    sent++;
    if(mode==="success")return route.fulfill({status:201,contentType:"application/json",body:'{"ok":true,"received":true,"id":"qa123456"}'});
    return route.fulfill({status:503,contentType:"application/json",body:'{"ok":false,"message":"Không lưu được"}'});
   }
   if(path==="/api/beta-versions")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ok:true,versions})});
   if(path==="/api/beta-download-counts")return route.fulfill({status:200,contentType:"application/json",body:'{"ok":true,"counts":{"V4.7.3":12}}'});
   if(path==="/api/flash-download-counts")return route.fulfill({status:200,contentType:"application/json",body:'{"ok":true,"counts":{"v4.6.1":14,"v4.7.0":18}}'});
   if(path==="/api/posts")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ok:true,posts:[{slug:"qa-article",url:"/bai-viet/qa-article",title:"Tin thử nghiệm",summary:"Chỉ dùng cho QA",cover_url:"/pubg-game-avatar.webp",published_at:"2026-10-20T00:00:00Z"}]})});
   if(path==="/api/home-videos")return route.fulfill({status:200,contentType:"application/json",body:'{"ok":true,"videos":[]}'});
   if(path==="/api/team-finder")return route.fulfill({status:200,contentType:"application/json",body:'{"ok":true,"posts":[]}'});
   if(path.startsWith("/download/")){downloads++;return route.abort();}
   if(!url.startsWith(root))return route.abort();
   return route.continue();
  });
  const open=async path=>{
   const p=await context.newPage();
   await p.goto(root+path,{waitUntil:"domcontentloaded",timeout:18000});
   return p;
  };
  const contact=await open("/contact.html");
  const form=contact.locator("#tbContactForm"),status=contact.locator("#tbContactStatus");
  assert.equal(await form.count(),1);
  assert.equal(await status.getAttribute("aria-live"),"polite");
  await form.locator('[name="name"]').fill("Nguyen Van QA");
  await form.locator('[name="email"]').fill("qa@example.test");
  await form.locator('[name="subject"]').selectOption({label:"Báo lỗi website"});
  await form.locator('[name="message"]').fill("Đây là tin nhắn kiểm thử, không ghi vào D1.");
  await form.locator('button[type="submit"]').click();
  await contact.waitForFunction(()=>document.querySelector("#tbContactStatus")?.dataset.state==="error",{timeout:7000});
  assert.equal(sent,1,"Mocked contact failure did not submit once");
  assert.equal(await form.locator('button[type="submit"]').isEnabled(),true);
  mode="success";
  await form.locator('button[type="submit"]').click();
  await contact.waitForFunction(()=>document.querySelector("#tbContactStatus")?.dataset.state==="success",{timeout:7000});
  assert((await status.innerText()).includes("Đã lưu yêu cầu"));
  assert.equal(await form.locator('[name="message"]').inputValue(),"");
  assert.equal(sent,2);
  await contact.close();

  const updates=await open("/ban-cap-nhat.html");
  await updates.waitForFunction(()=>document.querySelector(".release-hero .version-row h1")?.textContent?.includes("V4.7.3"),{timeout:9000});
  assert.equal(await updates.locator(".release-hero .hero-actions .btn.primary").first().getAttribute("href"),"/download/beta/V4.7.3");
  await updates.locator('.beta-version-item[data-beta-major="4.7"]').click();
  const coming=updates.locator(".beta-build-card").filter({hasText:"V4.7.4"});
  assert.equal(await coming.locator('a[href^="/download/"]').count(),0,"Coming soon linked to download");
  assert.equal(await updates.locator(".beta-build-card").filter({hasText:"V4.7.3"}).locator('a[href="/download/beta/V4.7.3"]').count(),1);
  const layout=await updates.evaluate(()=>({viewport:document.documentElement.clientWidth,width:document.documentElement.scrollWidth}));
  assert(layout.width<=width+4,"Update page overflow at "+width+": "+JSON.stringify(layout));
  await updates.close();

  const wiki=await open("/wiki.html");
  await wiki.waitForFunction(()=>document.querySelectorAll("#tbP1First option").length>10,undefined,{timeout:9000});
  await wiki.locator("#tbP1First").selectOption("M416");
  await wiki.locator("#tbP1Second").selectOption("AKM");
  const comparison=await wiki.locator("#tbP1Result").innerText();
  assert(comparison.includes("M416")&&comparison.includes("AKM")&&comparison.includes("Ngày kiểm chứng: chưa có"));
  await wiki.close();

  const news=await open("/news.html");
  assert(await news.locator('a[href="/news-versions"]').count()>0,"News topics missing");
  await news.close();
  assert.equal(downloads,0,"QA must not initiate a real download");
  console.log("P3.2 contact UI, P3.3 beta links/counters, P3.4 Wiki/news, P3.5 viewport "+width+"px: PASS");
  await context.close();
 }
}finally{
 if(browser)await browser.close();
 server.kill("SIGTERM");
}
console.log("P3.2–P3.5 consolidated local QA: PASS (no D1 write, no APK GET)");
