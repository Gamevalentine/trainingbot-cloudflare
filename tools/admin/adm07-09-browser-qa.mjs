// ADM-07/08/09: E2E acceptance of every secondary screen, mobile/desktop and A-C.
// Local HTML only, mocked network, no Production credentials, no D1 writes.
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
const ROOT="http://127.0.0.1:18928",TOKEN="LOCAL_ADMIN_STAGE_D_FAKE_TOKEN";
const names=["dashboard","posts","content","wiki","studio","beta","media","users","inbox","analytics","visitor-tracking","security","system"];
assert(fs.readFileSync("public/admin.html","utf8").includes("admin-stage-d-ui.js"));
assert(!fs.existsSync(".github/workflows/trainingbot-d1-encrypted-backup.yml"));
assert(!fs.existsSync("scripts/backup_d1_to_github.py"));
const server=spawn("python3",["-m","http.server","18928","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
async function testViewport(width){
 const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
 const mode={users:"valid",inbox:"valid"};
 const traffic={reads:0,writes:0,outsideBlocked:0,mailStatusWrites:0};
 await ctx.route("**/*",route=>{
  const req=route.request(),u=new URL(req.url()),p=u.pathname,method=req.method();
  const json=(obj,status=200)=>route.fulfill({status,contentType:"application/json",body:JSON.stringify(obj)});
  if(p.startsWith("/api/")){
   traffic.reads++;
   if(method!=="GET"&&method!=="HEAD"){
    traffic.writes++;if(p.includes("contact-status"))traffic.mailStatusWrites++;
    return json({ok:false,message:"Mutations blocked in Stage-D QA"},403);
   }
   if(req.headers()["authorization"]!=="Bearer "+TOKEN)return json({ok:false,message:"Unauthorized"},401);
   if(p==="/api/v49/admin/users"){
    if(mode.users==="error")return json({ok:false,message:"Users service intentionally unavailable"},503);
    return json({ok:true,users:[{id:"synthetic-user-1",username:"qa",display_name:"QA User",email:"fake@example.invalid",registration_method:"email",created_at:"2026-10-28T00:00:00Z",status:"active"}],stats:{total:1,active_24h:1,active_7d:1,new_today:0}});
   }
   if(p.endsWith("/admin-contacts")){
    if(mode.inbox==="error")return json({ok:false,message:"Inbox service intentionally unavailable"},503);
    const mail={id:"fake-mail-1",name:"Người thử",email:"qa@example.invalid",message:"Thư hỏi thử nghiệm",status:"new",page:"/contact",created_at:"2026-10-28T00:00:00Z"};
    return json({ok:true,messages:[mail],counts:{total:1,unread:1,read:0,replied:0}});
   }
   if(p.includes("beta-versions"))return json({ok:true,versions:[]});
   if(p.includes("/posts"))return json({ok:true,posts:[]});
   if(p.includes("visitor-events"))return json({ok:true,summary:{today_visitors:0,today_sessions:0,online_visitors:0,online_sessions:0},sessions:[],devices:[],oses:[],browsers:[]});
   return json({ok:true,changes:[],page:"/index.html"});
  }
  if(req.url().startsWith(ROOT))return route.continue();
  traffic.outsideBlocked++;return route.abort();
 });
 const page=await ctx.newPage(),errors=[];
 page.on("pageerror",e=>errors.push(e.message.slice(0,260)));
 try{
  await page.goto(ROOT+"/admin.html",{waitUntil:"domcontentloaded",timeout:18000});
  await page.waitForSelector("body.tb-admin-stage-d",{state:"attached",timeout:20000});
  assert.equal(await page.locator("#adminApp.hidden").count(),1);
  await page.locator("#adminToken").fill(TOKEN);
  await page.locator('#loginForm button[type="submit"]').click();
  await page.waitForSelector("#adminApp:not(.hidden)",{timeout:16000});
  await page.waitForFunction(()=>document.querySelectorAll("#sidebar .nav-item").length===13,undefined,{timeout:12000});
  await page.waitForFunction(()=>document.getElementById("usersNotice")&&document.getElementById("inboxNotice"),undefined,{timeout:5000});
  const buttons=await page.locator("#sidebar .nav-item").evaluateAll(items=>items.map(x=>x.id==="tbVisitorNav"?"visitor-tracking":x.dataset.view));
  assert.deepEqual(buttons,names,"Stage D lost a legacy or dynamic panel");
  const labels=await page.locator(".side-nav>.tb-admin-b-group").allTextContents();
  assert.deepEqual(labels,["TỔNG QUAN","NỘI DUNG","THƯ VIỆN","CỘNG ĐỒNG","THỐNG KÊ","CÀI ĐẶT"]);
  for(const name of names){
   const target=name==="visitor-tracking"?"#tbVisitorNav":'#sidebar .nav-item[data-view="'+name+'"]';
   await page.locator(target).evaluate(el=>el.click());
   await page.waitForFunction(n=>document.querySelector('.view[data-view-panel="'+n+'"]')?.classList.contains("active"),name,{timeout:7500});
  }
  for(const name of ["media","users","inbox","analytics","security","system"]){
   assert.equal(await page.locator('[data-admin-stage-d="'+name+'"]').count(),1,"Missing contextual status "+name);
  }
  assert((await page.locator('[data-admin-stage-d="media"]').innerText()).includes("trình duyệt"));
  assert((await page.locator('[data-admin-stage-d="inbox"]').innerText()).includes("Gmail"));
  assert((await page.locator('[data-admin-stage-d="system"]').innerText()).includes("ba API"));
  assert.equal(await page.locator("#tbDRefreshAnalytics").count(),1);
  assert.equal(await page.locator("#usersTable").count(),1);
  assert.equal(await page.locator(".tb-d-table-scroll").count(),1);

  // Trigger an actual GET failure from the original refresh control. No stale
  // data may be exportable or graphed as a verified zero.
  mode.users="error";
  await page.locator("#reloadUsers").evaluate(el=>el.click());
  await page.waitForFunction(()=>document.getElementById("usersNotice")?.classList.contains("error"),undefined,{timeout:5000});
  assert.equal(await page.locator("#exportUsers").isDisabled(),true,"Exported stale users after API error");
  await page.waitForFunction(()=>document.getElementById("analyticsUsers")?.textContent==="—",undefined,{timeout:6000});
  assert((await page.locator("#userActivityChart").innerText()).includes("Chưa có dữ liệu"));
  assert((await page.locator("#usersTable").innerText()).includes("Không tải được người dùng"));
  mode.users="valid";
  await page.locator("#reloadUsers").evaluate(el=>el.click());
  await page.waitForFunction(()=>document.getElementById("usersNotice")?.classList.contains("ok"),undefined,{timeout:5500});
  assert.equal(await page.locator("#exportUsers").isDisabled(),false);
  assert.equal(await page.locator("#analyticsUsers").textContent(),"1");

  // The legacy inbox is a Worker API. Here all responses are intercepted,
  // including Gmail composer, and no status write should occur on Reply.
  mode.inbox="error";
  await page.locator("#reloadInbox").evaluate(el=>el.click());
  await page.waitForFunction(()=>document.getElementById("inboxNotice")?.classList.contains("error"),undefined,{timeout:6000});
  assert.equal(await page.locator("#clearInbox").isDisabled(),true);
  assert((await page.locator("#mailList").innerText()).includes("Không tải được"));
  assert((await page.locator("#mailLegend").innerText()).includes("Chưa có dữ liệu"));
  mode.inbox="valid";
  await page.locator("#reloadInbox").evaluate(el=>el.click());
  await page.waitForFunction(()=>document.getElementById("inboxNotice")?.classList.contains("ok"),undefined,{timeout:6000});
  assert.equal(await page.locator("#clearInbox").isDisabled(),false);
  assert((await page.locator("#mailList").innerText()).includes("Thư hỏi thử nghiệm"));

  await page.evaluate(()=>{window.__qaComposer=null;window.open=(url)=>{window.__qaComposer=url;return null;};});
  const count=traffic.mailStatusWrites;
  await page.locator('.mail-card [data-action="reply"]').first().evaluate(el=>el.click());
  await page.waitForFunction(()=>!!window.__qaComposer,undefined,{timeout:5000});
  assert.equal(traffic.mailStatusWrites,count,"Reply should not mark read before email is sent");
  assert((await page.evaluate(()=>window.__qaComposer)).startsWith("https://mail.google.com/mail/"));

  const before=traffic.reads;
  await page.locator("#tbDRefreshAnalytics").evaluate(el=>el.click());
  for(let i=0;i<40&&traffic.reads<before+2;i++)await sleep(25);
  assert(traffic.reads>=before+2,"Refresh did not use both legacy source GET handlers");

  if(width===390||width===1440){
   fs.mkdirSync("admin-qa-screenshots",{recursive:true});
   await page.locator('#sidebar .nav-item[data-view="analytics"]').evaluate(el=>el.click());
   await page.screenshot({path:"admin-qa-screenshots/stage-d-analytics-"+width+".png",animations:"disabled"});
  }
  const dims=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,pageWidth:document.documentElement.scrollWidth}));
  assert(dims.pageWidth<=width+6,"Horizontal overflow "+width+" "+JSON.stringify(dims));
  assert.equal(traffic.writes,0,"Unexpected HTTP write from secondary panel test");
  assert(!errors.length,"Uncaught UI errors: "+errors.join(" | "));
  console.log("ADM-07/08 six screens, 13 routes, states, Gmail no-status-write, analytics, responsive "+width+"px: PASS");
 }finally{await ctx.close();}
}
try{
 await sleep(800);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [360,390,768,1024,1440])await testViewport(width);
 console.log("STAGE D browser QA PASS: five sizes, all API calls intercepted, Production untouched");
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
