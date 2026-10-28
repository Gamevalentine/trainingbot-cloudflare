// ADM-01 — four data-state modes plus auth and transport errors.
// Runs entirely against local static Admin and fully mocked APIs. No production D1.
import fs from "node:fs";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {chromium} from "playwright";

const root="http://127.0.0.1:18841";
for(const path of ["public/admin.html","public/admin_beta_versions_v175.js",
"public/admin_posts_manual_v171.js","public/admin_visitor_tracking_v177.js"]){
 assert(fs.existsSync(path),"Missing build asset: "+path);
}
assert(!fs.existsSync(".github/workflows/trainingbot-d1-encrypted-backup.yml"),
 "Stopped backup workflow must never be revived");
const server=spawn("python3",["-m","http.server","18841","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser,readCount=0,writes=0;
try{
 await sleep(900);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 const context=await browser.newContext({viewport:{width:390,height:840}});
 const page=await context.newPage();
 const mode={beta:"empty",posts:"empty",visitor:"empty"};
 const counts={beta:0,posts:0,visitor:0};
 await page.route("**/*",async route=>{
  const req=route.request(),url=req.url(),path=new URL(url).pathname;
  if(req.method()!=="GET"&&req.method()!=="HEAD"){writes++;return route.abort();}
  if(path==="/api/v71/admin/beta-versions")return mock("beta",route);
  if(path==="/api/v71/admin/posts")return mock("posts",route);
  if(path==="/api/v71/admin/visitor-events")return mock("visitor",route);
  if(path.startsWith("/api/"))return route.fulfill({status:401,contentType:"application/json",body:'{"ok":false,"message":"Unauthorized"}'});
  if(url.startsWith(root))return route.continue();
  return route.abort();
 });
 async function mock(type,route){
  readCount++;counts[type]++;
  if(mode[type]==="offline")return route.abort("internetdisconnected");
  const status=({badAuth:401,forbidden:403,failure:503})[mode[type]]||200;
  let value={ok:true};
  if(type==="beta")value.versions=mode.beta==="withData"
    ?[{id:"qa-beta",version:"V4.7.3",arch:"x64",status:"released",download_url:"https://example.invalid/never-download.apk"}]:[];
  if(type==="posts")value.posts=mode.posts==="withData"
    ?[{id:"qa-post",title:"Bài thử nghiệm",published_at:"2026-10-28T00:00:00Z",url:"/bai-viet/qa",category:"Tin mới"}]:[];
  if(type==="visitor")value={ok:true,summary:mode.visitor==="withData"?{
    today_visitors:12,today_sessions:16,online_visitors:0
  }:{today_visitors:0,today_sessions:0,online_visitors:0},sessions:[],devices:[],oses:[]};
  if(status!==200)value={ok:false,message:"Lỗi giả lập"};
  if(mode[type]==="malformed")value={ok:true};
  return route.fulfill({status,contentType:"application/json",body:JSON.stringify(value)});
 }
 async function requestOn(id,type,next,assertion){
  mode[type]=next;
  const prior=counts[type];
  await page.locator("#"+id).evaluate(el=>el.click());
  for(let i=0;i<80&&counts[type]===prior;i++)await sleep(30);
  assert(counts[type]>prior,"No mocked request from "+type+" "+next);
  await sleep(100);
  await assertion();
 }
 await page.goto(root+"/admin.html",{waitUntil:"domcontentloaded"});
 await page.waitForSelector("#tbBetaAdmin",{state:"attached",timeout:18000});
 const initial=await page.locator("#tbBetaStatus").textContent();
 assert(initial.toLowerCase().includes("chưa đăng nhập"),"Beta no-login state is wrong");
 assert.equal(counts.beta,0,"Beta should not call admin API without a token");
 assert.equal(await page.locator("#tbBetaList .tb-beta-row").count(),0);
 const noData=await page.locator("#tbBetaList").textContent();
 assert(noData.includes("Chưa có dữ liệu"),"Beta should not show authenticated 0 while logged out");

 // Fake token exists ONLY in local browser storage. No real credentials or API.
 await page.evaluate(()=>sessionStorage.setItem("tb-admin-center-token-v2","LOCAL-FAKE-TEST-TOKEN"));
 await requestOn("tbBetaReload","beta","badAuth",async()=>{
   const msg=(await page.locator("#tbBetaStatus").textContent()).toLowerCase();
   assert(msg.includes("hết hạn")||msg.includes("không hợp lệ"));
   assert(!msg.includes("phiên bản beta đang được quản lý"));
 });
 await requestOn("tbBetaReload","beta","forbidden",async()=>{
   assert((await page.locator("#tbBetaStatus").textContent()).includes("Không đủ quyền"));
 });
 await requestOn("tbBetaReload","beta","failure",async()=>{
   assert.equal(await page.locator("#tbBetaList .tb-beta-row").count(),0);
   assert(!(await page.locator("#tbBetaStatus").textContent()).includes("0 phiên bản"));
 });
 await requestOn("tbBetaReload","beta","empty",async()=>{
   assert.equal(await page.locator("#tbBetaStatus").getAttribute("data-state"),"empty");
   assert((await page.locator("#tbBetaList").textContent()).includes("Tải thành công"));
 });
 await requestOn("tbBetaReload","beta","withData",async()=>{
   assert.equal(await page.locator("#tbBetaList .tb-beta-row").count(),1);
 });
 await requestOn("tbBetaReload","beta","offline",async()=>{
   assert.equal(await page.locator("#tbBetaList .tb-beta-row").count(),0,"Stale beta rows hidden on failure");
   assert((await page.locator("#tbBetaStatus").getAttribute("data-state"))==="error");
 });
 await requestOn("tbBetaReload","beta","malformed",async()=>{
   assert((await page.locator("#tbBetaStatus").textContent()).includes("không trả danh sách"));
 });
 console.log("ADM-01 Beta missing session / 401 / 403 / 503 / empty / data / offline / malformed: PASS");

 await page.waitForSelector("#tbPostManager",{state:"attached",timeout:15000});
 const pbtn="#tbPostManager .tb-post-refresh";
 // Exact manager button may not have an ID in the legacy script.
 async function postsLoad(next,assertion){
  mode.posts=next;const n=counts.posts;
  await page.locator(pbtn).evaluate(el=>el.click());
  for(let i=0;i<80&&counts.posts===n;i++)await sleep(30);
  assert(counts.posts>n,"Posts request missing");
  await sleep(90);await assertion();
 }
 await postsLoad("empty",async()=>{
  assert((await page.locator("#tbPostPublishedList").textContent()).toLowerCase().includes("chưa có bài"));
 });
 await postsLoad("withData",async()=>{
  assert((await page.locator("#tbPostPublishedList").textContent()).includes("Bài thử nghiệm"));
 });
 for(const err of ["badAuth","forbidden","failure","offline","malformed"]){
  await postsLoad(err,async()=>{
   assert(!(await page.locator("#tbPostPublishedList").textContent()).includes("Bài thử nghiệm"),"Stale posts leaked");
   assert((await page.locator("#tbPostManagerStatus").getAttribute("data-state"))==="error");
   assert((await page.locator("#tbPostPublishedList").textContent()).includes("Không tải được"));
  });
 }
 console.log("ADM-01 posts 0/data/401/403/503/offline/malformed: PASS");

 await page.locator("#tbVisitorNav").waitFor({state:"attached",timeout:10000});
 mode.visitor="offline";
 await page.locator("#tbVisitorNav").evaluate(el=>el.click());
 await page.waitForSelector("#tbVisitorPanel",{state:"attached",timeout:7000});
 const ids=["tbVisitorTodayPeople","tbVisitorTodaySessions","tbVisitorOnline","tbVisitorRecent"];
 async function values(){return Promise.all(ids.map(id=>page.locator("#"+id).textContent()));}
 // Never infer zero from absent or unauthorized initial data.
 assert((await values()).every(v=>v==="—"));
 async function visitorLoad(next,assertion){
  mode.visitor=next;const n=counts.visitor;
  await page.locator("#tbVisitorRefresh").evaluate(el=>el.click());
  for(let i=0;i<80&&counts.visitor===n;i++)await sleep(30);
  assert(counts.visitor>n,"Visitor request missing");
  await sleep(90);await assertion();
 }
 await visitorLoad("empty",async()=>assert.deepEqual(await values(),["0","0","0","0"]));
 await visitorLoad("withData",async()=>assert.deepEqual(await values(),["12","16","0","0"]));
 for(const err of ["badAuth","forbidden","failure","offline","malformed"]){
  await visitorLoad(err,async()=>{
   assert((await values()).every(v=>v==="—"),"Error replaced with false 0");
   assert((await page.locator("#tbVisitorStatus").getAttribute("class")).includes("error"));
  });
 }
 console.log("ADM-01 visitor KPI unknown/0/data/401/403/503/offline/malformed: PASS");
 assert.equal(writes,0,"Mock test issued a non-GET request");
 console.log("ADM-01 entire local Stage A UI test: PASS, reads="+readCount+", writes="+writes);
 await context.close();

 // Complete ADM-01 by using the original login form with strictly mocked GETs.
 // The fake password is never sent to a real host. These tests exercise the
 // decoded Admin runtime, not just the readable Beta/visitor scripts.
 for(const scenario of ["zero","data","partialFailure"]){
  const ctx=await browser.newContext({viewport:{width:1280,height:860}});
  const p=await ctx.newPage();
  let usersSeen=0,inboxSeen=0,validationSeen=0,localWrites=0;
  const payload=(status,data)=>({status,contentType:"application/json",body:JSON.stringify(data)});
  await p.route("**/*",route=>{
   const req=route.request(),u=new URL(req.url()),path=u.pathname;
   if(req.method()!=="GET"&&req.method()!=="HEAD"){localWrites++;return route.abort();}
   if(path==="/api/v49/admin/users"){
    const limit=u.searchParams.get("limit");
    if(limit==="1"){validationSeen++;return route.fulfill(payload(200,{ok:true,users:[],stats:{total:0}}));}
    usersSeen++;
    if(scenario==="partialFailure")return route.fulfill(payload(503,{ok:false,message:"API người dùng tạm lỗi"}));
    const n=scenario==="data"?5:0;
    return route.fulfill(payload(200,{ok:true,users:[],stats:{total:n,active_24h:n,new_today:n,active_7d:n}}));
   }
   if(path.endsWith("/admin-contacts")||path.endsWith("/admin-contacts/")){
    inboxSeen++;
    if(scenario==="partialFailure")return route.fulfill(payload(503,{ok:false,message:"API hộp thư tạm lỗi"}));
    const n=scenario==="data"?2:0;
    return route.fulfill(payload(200,{ok:true,messages:[],counts:{total:n,unread:n,read:0,replied:0}}));
   }
   if(path.startsWith("/api/v40/"))return route.fulfill(payload(200,{ok:true,changes:[],page:"/index.html"}));
   if(path.startsWith("/api/"))return route.fulfill(payload(401,{ok:false,message:"Unauthorized"}));
   if(req.url().startsWith(root))return route.continue();
   return route.abort();
  });
  await p.goto(root+"/admin.html",{waitUntil:"domcontentloaded",timeout:20000});
  await p.waitForSelector("#loginForm",{state:"visible",timeout:12000});
  await p.locator("#adminToken").fill("LOCAL-FAKE-LOGIN");
  await p.locator('#loginForm button[type="submit"]').click();
  await p.waitForSelector("#adminApp:not(.hidden)",{timeout:12000});
  for(let i=0;i<130&&(usersSeen===0||inboxSeen===0);i++)await sleep(35);
  assert(validationSeen>0,"Real Admin login form did not validate with mocked API");
  assert(usersSeen>0&&inboxSeen>0,"Dashboard did not call both mock backends");
  await p.waitForFunction(()=>document.querySelector("#healthScore")?.textContent!=="—",undefined,{timeout:9000});
  await sleep(120);
  const dashboard=await p.evaluate(()=>Object.fromEntries(
   ["kpiUsers","kpiActive24","kpiUnread","kpiNewToday","healthScore","kpiUsersSub","kpiInboxTotal","actionCenter"]
    .map(id=>[id,document.getElementById(id)?.textContent||""])));
  if(scenario==="zero"){
   assert.equal(dashboard.kpiUsers,"0");
   assert.equal(dashboard.kpiUnread,"0");
   assert.equal(dashboard.healthScore,"3/3");
   assert(!dashboard.actionCenter.includes("chưa tải được"));
  }else if(scenario==="data"){
   assert.equal(dashboard.kpiUsers,"5");
   assert.equal(dashboard.kpiUnread,"2");
   assert.equal(dashboard.healthScore,"3/3");
  }else{
   assert.equal(dashboard.kpiUsers,"—");
   assert.equal(dashboard.kpiUnread,"—");
   assert(dashboard.kpiUsersSub.includes("chưa")||dashboard.kpiUsersSub.includes("Chưa"));
   assert(dashboard.kpiInboxTotal.includes("chưa")||dashboard.kpiInboxTotal.includes("Chưa"));
   assert(dashboard.actionCenter.toLowerCase().includes("chưa tải được"),"Action center claimed no work when data failed");
   assert.notEqual(dashboard.healthScore,"3/3","Health claimed all 3 probes passed with failing API");
  }
  assert.equal(localWrites,0,"Dashboard mock tried to mutate data");
  console.log("ADM-01 protected Dashboard login+data scenario "+scenario+": PASS (reads only)");
  await ctx.close();
 }
}finally{
 if(browser)await browser.close();
 server.kill("SIGTERM");
}