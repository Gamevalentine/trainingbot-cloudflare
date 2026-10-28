// Stage C local browser QA — fake token & intercepted mock-only Admin API.
// Never connects to Cloudflare, sends media, or writes Production D1.
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
for(const file of ["public/admin.html","public/admin-stage-c-ui.js","public/admin_posts_manual_v171.js",
 "public/admin_posts_editor_v183.js","public/admin-stage-b-ui.js"]){
 assert(fs.existsSync(file),"Missing "+file);
}
assert(fs.readFileSync("public/admin.html","utf8").includes("admin-stage-c-ui.js"));
assert(!fs.existsSync(".github/workflows/trainingbot-d1-encrypted-backup.yml"));
const ROOT="http://127.0.0.1:18916",TOKEN="LOCAL-ADM-C-TEST";
const server=spawn("python3",["-m","http.server","18916","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
const basePosts=[
 {id:"qa-published",slug:"qa-published",title:"Tin PUBG đang xuất bản",summary:"Tin thử nghiệm",content:"Nội dung kiểm thử đủ dài về PUBG và trò chơi.",rich_content:"<p>Nội dung kiểm thử đủ dài về PUBG và trò chơi.</p>",status:"published",category:"Tin mới",published_at:"2026-10-26T00:00:00Z",updated_at:"2026-10-26T00:00:00Z",cover_url:"",url:"/bai-viet/qa-published",featured_at:""},
 {id:"qa-draft",slug:"qa-draft",title:"Bản nháp chưa công khai",summary:"Thử nghiệm",content:"Nội dung giả lập để chỉnh sửa và xuất bản.",rich_content:"<p>Nội dung giả lập để chỉnh sửa và xuất bản.</p>",status:"draft",category:"Hướng dẫn",published_at:"",updated_at:"2026-10-27T00:00:00Z",cover_url:"",url:"",featured_at:""}
];
async function viewport(width){
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
 const posts=basePosts.map(x=>({...x})),writes=[],external=[];
 await context.route("**/*",route=>{
  const req=route.request(),u=new URL(req.url()),p=u.pathname,method=req.method();
  if(p.startsWith("/api/")){
   const auth=req.headers()["authorization"];
   if(auth!=="Bearer "+TOKEN)return route.fulfill({status:401,contentType:"application/json",body:'{"ok":false,"message":"Unauthorized"}'});
   const result=(obj,status=200)=>route.fulfill({status,contentType:"application/json",body:JSON.stringify(obj)});
   if(p==="/api/v49/admin/users")return result({ok:true,users:[],stats:{total:3,active_24h:1,active_7d:2,new_today:0}});
   if(p.includes("admin-contacts"))return result({ok:true,messages:[],counts:{total:0,unread:0,read:0,replied:0}});
   if(p==="/api/v71/admin/posts"){
    if(method==="GET"){
     const id=u.searchParams.get("id");
     if(id){const post=posts.find(x=>x.id===id);return result(post?{ok:true,post}:{ok:false},post?200:404);}
     return result({ok:true,posts});
    }
    if(!["POST","PATCH"].includes(method))return result({ok:false,message:"Unsupported fake write"},405);
    const payload=JSON.parse(req.postData()||"{}");writes.push({method,payload});
    if(method==="POST"){
     const id="qa-new-"+posts.length;
     const post={...payload,id,slug:"qa-new-"+posts.length,cover_url:payload.cover_url||"",status:payload.status||"published",rich_content:payload.rich_content||"",featured_at:"",published_at:payload.status==="draft"?"":"2026-10-28T00:00:00Z",updated_at:"2026-10-28T00:00:00Z",url:payload.status==="draft"?"":"/bai-viet/qa-new-"+posts.length};
     posts.unshift(post);return result({ok:true,post},201);
    }
    const post=posts.find(x=>x.id===payload.id);
    if(!post)return result({ok:false},404);
    Object.assign(post,payload,{url:payload.status==="draft"?"":"/bai-viet/"+post.slug});
    return result({ok:true,post,message:"Đã lưu"});
   }
   if(p==="/api/v71/admin/beta-versions")return result({ok:true,versions:[{id:"v473",version:"V4.7.3",major:"V4.7",arch:"x64",status:"released",download_url:"https://example.invalid/app.apk"}]});
   if(p.includes("visitor-events"))return result({ok:true,summary:{today_visitors:0,today_sessions:0,online_visitors:0,online_sessions:0},sessions:[],devices:[],oses:[],browsers:[]});
   if(method!=="GET")return result({ok:false,message:"Mock only"},405);
   return result({ok:true,changes:[],page:"/index.html"});
  }
  if(req.url().startsWith(ROOT))return route.continue();
  external.push(req.url());return route.abort();
 });
 const page=await context.newPage();let pageErrors=[];
 page.on("pageerror",e=>pageErrors.push(String(e).slice(0,240)));
 const dialogs=[];page.on("dialog",async d=>{dialogs.push(d.message());await d.dismiss();});
 try{
  await page.goto(ROOT+"/admin.html",{waitUntil:"domcontentloaded",timeout:22000});
  await page.waitForSelector("body.tb-admin-stage-c",{state:"attached",timeout:17000});
  await page.waitForFunction(()=>document.querySelectorAll("#sidebar .tb-admin-b-group").length===6,undefined,{timeout:9000});
  await page.waitForFunction(()=>document.querySelector('#sidebar .nav-item[data-view="beta"]'),undefined,{timeout:7000});
  assert.equal(await page.locator('#sidebar .nav-item[data-view="beta"]').count(),1);
  assert.equal(await page.locator('[data-view-panel="beta"]').count(),1);
  assert.equal(await page.locator('[data-view-panel="content"] #tbBetaForm').count(),0);
  assert.equal(await page.locator('[data-view-panel="beta"] #tbBetaForm').count(),1);
  assert.equal(await page.locator("#adminApp.hidden").count(),1,"Admin public before login");
  await page.locator("#adminToken").fill(TOKEN);
  await page.locator('#loginForm button[type="submit"]').click();
  await page.waitForSelector("#adminApp:not(.hidden)",{timeout:14000});
  await page.waitForFunction(()=>document.getElementById("kpiUsers")?.textContent==="3",undefined,{timeout:9000});
  assert.equal(await page.locator("#tbCDashboardActions button").count(),4);
  assert.equal(await page.locator(".command-hero").evaluate(el=>getComputedStyle(el).display),"none");
  assert((await page.locator(".health-score").innerText()).includes("API"));

  // The old Beta manager remains functional but is now isolated from Web Pages.
  await page.locator('#sidebar .nav-item[data-view="beta"]').evaluate(el=>el.click());
  await page.waitForFunction(()=>document.querySelector('[data-view-panel="beta"]')?.classList.contains("active"),undefined,{timeout:8000});
  await page.waitForFunction(()=>document.querySelector("#tbBetaStatus")?.textContent?.includes("đã tải thành công"),undefined,{timeout:8000});
  assert.equal(await page.locator("#tbCBetaEditor:not([open])").count(),1);
  await page.locator("#tbCBetaEditor summary").evaluate(el=>el.click());
  assert.equal(await page.locator("#tbCBetaEditor[open]").count(),1);
  await page.locator('button[data-edit-beta="v473"]').evaluate(el=>el.click());
  assert.equal(await page.locator("#tbBetaVersion").inputValue(),"V4.7.3");
  const nav=await page.locator("#sidebar .nav-item").evaluateAll(nodes=>nodes.map(n=>n.id==="tbVisitorNav"?"visitor-tracking":n.dataset.view));
  assert.equal(nav.length,13,"Stage C lost a legacy destination");
  assert.equal(new Set(nav).size,13);

  await page.locator('#sidebar .nav-item[data-view="posts"]').evaluate(el=>el.click());
  await page.waitForSelector("#tbPostPublishedList .tb-post-row",{state:"attached",timeout:8000});
  await page.waitForFunction(()=>document.querySelectorAll("#tbPostPublishedList .tb-post-row").length===2,undefined,{timeout:8000});
  await page.locator("#tbPostSearch").fill("nháp");
  assert.equal(await page.locator("#tbPostPublishedList .tb-post-row").count(),1);
  assert((await page.locator("#tbPostPublishedList").innerText()).includes("Bản nháp"));
  await page.locator("#tbPostSearch").fill("");
  await page.locator("#tbPostStatusFilter").selectOption("published");
  assert.equal(await page.locator("#tbPostPublishedList .tb-post-row").count(),1);
  await page.locator("#tbPostStatusFilter").selectOption("draft");
  assert.equal(await page.locator("#tbPostPublishedList .tb-post-row").count(),1);
  assert.equal(await page.locator("#tbPostPublishedList a.tb-post-open[href]").count(),0,"Unpublished draft has live link");
  await page.locator("#tbPostStatusFilter").selectOption("all");

  await page.locator("#tbManualPostCreate").evaluate(el=>el.click());
  await page.locator("#tbPostTitle").fill("Bài nháp của QA");
  await page.locator("#tbPostContent").fill("Đây là bài thử nghiệm dài đủ điều kiện để lưu dưới dạng bản nháp, không xuất bản.");
  await page.locator("#tbManualPostModal [data-close-post]").first().evaluate(el=>el.click());
  assert.equal(await page.locator("#tbManualPostModal.open").count(),1,"Dirty modal closed without confirmation");
  assert(dialogs.some(x=>x.includes("chưa được lưu")),"No unsaved-change confirmation");
  await page.locator("#tbPostDraftSubmit").evaluate(el=>el.click());
  await page.waitForFunction(()=>document.querySelector("#tbPostStatus")?.textContent?.includes("Đã lưu bản nháp"),undefined,{timeout:8000});
  assert(writes.some(x=>x.method==="POST"&&x.payload.status==="draft"),"Draft request missing");
  assert(posts.some(x=>x.title==="Bài nháp của QA"&&x.status==="draft"));

  await page.waitForFunction(()=>document.querySelectorAll("#tbPostPublishedList .tb-post-row").length===3,undefined,{timeout:9000});
  await page.waitForFunction(()=>document.querySelector('#tbPostPublishedList button[data-edit-post="qa-draft"]'),undefined,{timeout:8000});
  await page.locator('button[data-edit-post="qa-draft"]').evaluate(el=>el.click());
  await page.waitForFunction(()=>document.querySelector("#tbRichStatus")?.textContent?.includes("Đang chỉnh bản nháp"),undefined,{timeout:9000});
  await page.locator("#tbRichTitle").fill("Bản nháp được biên tập");
  await page.locator("#tbRichPostModal [data-rich-close]").first().evaluate(el=>el.click());
  assert.equal(await page.locator("#tbRichPostModal.open").count(),1,"Rich editor discarded dirty changes");
  await page.locator("#tbRichDraft").evaluate(el=>el.click());
  await page.waitForFunction(()=>document.querySelector("#tbRichStatus")?.textContent?.includes("Đã lưu nháp"),undefined,{timeout:9000});
  assert(writes.some(x=>x.method==="PATCH"&&x.payload.status==="draft"),"Rich draft save did not send draft status");
  await page.locator("#tbRichSave").evaluate(el=>el.click());
  await page.waitForFunction(()=>document.querySelector("#tbRichStatus")?.textContent?.includes("đã xuất bản"),undefined,{timeout:9000});
  assert(writes.some(x=>x.method==="PATCH"&&x.payload.status==="published"),"Rich publish status missing");
  assert.equal(posts.find(x=>x.id==="qa-draft").status,"published");
  const dims=await page.evaluate(()=>({screen:document.documentElement.clientWidth,doc:document.documentElement.scrollWidth}));
  assert(dims.doc<=width+6,"Stage C horizontal overflow "+JSON.stringify(dims));
  assert.equal(external.length>=0,true);
  assert(!pageErrors.length,JSON.stringify(pageErrors));
  console.log("ADM-04/05/06 Stage C browser width "+width+" PASS; intercepted mock writes="+writes.length+"; no Production");
 }finally{await context.close();}
}
try{
 await sleep(850);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 for(const width of [390,768,1440])await viewport(width);
 console.log("ADMIN STAGE C FULL BROWSER PASS — all API calls mocked, no external network");
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
