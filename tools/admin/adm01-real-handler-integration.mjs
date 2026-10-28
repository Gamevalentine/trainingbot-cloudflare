// ADM-01: the real Pages Functions and the original packed Admin login run
// with ONLY an in-process disposable D1 imitation and fake bearer credentials.
// No remote URL, no Production data, no persistent database.
import fs from "node:fs";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {chromium} from "playwright";
const ROOT="http://127.0.0.1:18849";
const TOKEN="LOCAL_STAGE_A_FAKE_TOKEN_ONLY";
const load=async file=>{
 const text=fs.readFileSync(file,"utf8");
 return import("data:text/javascript;base64,"+Buffer.from(text).toString("base64"));
};
const handlers={
 users:(await load("functions/api/v49/admin/users.js")).onRequestGet,
 beta:(await load("functions/api/v71/admin/beta-versions.js")).onRequestGet,
 posts:(await load("functions/api/v71/admin/posts.js")).onRequestGet,
 visitors:(await load("functions/api/v71/admin/visitor-events.js")).onRequestGet,
 studio:(await load("functions/api/v40/admin/[[path]].js")).onRequest
};
function fakeD1(){
 const db={statements:[],writes:0};
 db.prepare=sql=>{
  const st={sql,bind(){return this;},
   async run(){db.statements.push(sql);db.writes++;return {success:true,meta:{changes:1}};},
   async first(){
    db.statements.push(sql);
    if(sql.includes("COUNT(*) AS n FROM tb_beta_versions_v1"))return {n:1};
    if(sql.includes("COUNT(*) AS sessions"))return {sessions:0,visitors:0};
    return null;
   },
   async all(){
    db.statements.push(sql);
    if(sql.includes("PRAGMA table_info(tb_manual_posts_v1)"))return {results:[{name:"featured_at"},{name:"rich_content"}]};
    if(sql.includes("PRAGMA table_info(tb_visitor_sessions_v1)"))return {results:[{name:"city"},{name:"region"},{name:"country"}]};
    if(sql.includes("COUNT(*) AS count FROM users_v49"))return {results:[{count:3}]};
    if(sql.includes("FROM tb_beta_versions_v1"))return {results:[{id:"local-row",version:"V4.7.3",major:"V4.7",arch:"x64",status:"released",download_url:"https://example.invalid/test.apk"}]};
    return {results:[]};
   }
  };return st;
 };
 db.batch=async stmts=>{
  const rows=[];
  for(const st of stmts)rows.push(/^(CREATE|ALTER|INSERT|UPDATE|DELETE)\b/i.test(st.sql.trim())?await st.run():await st.all());
  return rows;
 };
 return db;
}
function context(path,env,auth){
 return {request:new Request(ROOT+path,{headers:auth?{Authorization:"Bearer "+auth}:{}}),env,params:{path:["content"]}};
}
const env={ADMIN_TOKEN:TOKEN,DB:fakeD1()};
for(const [name,path] of [
 ["users","/api/v49/admin/users?limit=1"],
 ["beta","/api/v71/admin/beta-versions"],
 ["posts","/api/v71/admin/posts"],
 ["visitors","/api/v71/admin/visitor-events?limit=150"],
 ["studio","/api/v40/admin/content?page=/index.html"]
]){
 for(const candidate of [undefined,"INCORRECT_FAKE_TOKEN"]){
  const isolated={ADMIN_TOKEN:TOKEN,DB:fakeD1()};
  const response=await handlers[name](context(path,isolated,candidate));
  assert.equal(response.status,401,name+" must reject missing/incorrect login");
  assert.equal(isolated.DB.statements.length,0,name+" must not query D1 if unauthorized");
 }
 const response=await handlers[name](context(path,env,TOKEN));
 assert.equal(response.status,200,name+" correct token should permit isolated GET");
 const data=await response.json();
 assert.equal(data.ok,true,name+" authorized response");
 if(name==="users")assert.equal(data.stats.total,3);
 if(name==="beta")assert.equal(data.versions[0].version,"V4.7.3");
 if(name==="posts")assert.deepEqual(data.posts,[]);
 if(name==="visitors")assert.equal(data.summary.today_visitors,0);
 if(name==="studio")assert.deepEqual(data.changes,[]);
 console.log("ADM-01 actual handler "+name+" unauthorized 401 / fake authorized 200: PASS");
}
assert(env.DB.writes>0,"Real GET handlers perform schema-init writes; isolated fake D1 must detect this.");
console.log("Schema-init SQL on GET was confined to in-memory fake D1: PASS");

const server=spawn("python3",["-m","http.server","18849","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let browser;
try{
 await sleep(900);
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
 const browserContext=await browser.newContext({viewport:{width:1280,height:900}});
 const page=await browserContext.newPage();
 let outsideRequests=0,networkWrites=0,authorized=0,denied=0;
 await page.route("**/*",async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname;
  if(request.method()!=="GET"&&request.method()!=="HEAD"){networkWrites++;return route.abort();}
  const name=path==="/api/v49/admin/users"?"users":
    path==="/api/v71/admin/beta-versions"?"beta":
    path==="/api/v71/admin/posts"?"posts":
    path==="/api/v71/admin/visitor-events"?"visitors":
    path.startsWith("/api/v40/admin/")?"studio":null;
  if(name){
   const authHeader=request.headers()["authorization"]||"";
   const candidate=authHeader.startsWith("Bearer ")?authHeader.slice(7):undefined;
   candidate===TOKEN?authorized++:denied++;
   const reqContext=context(path+url.search,env,candidate);
   reqContext.params={path:path.replace("/api/v40/admin/","").split("/")};
   const response=await handlers[name](reqContext);
   return route.fulfill({status:response.status,contentType:"application/json",body:await response.text()});
  }
  if(path.startsWith("/api/"))return route.fulfill({status:200,contentType:"application/json",body:'{"ok":true,"messages":[],"counts":{"total":0,"unread":0,"read":0,"replied":0}}'});
  if(request.url().startsWith(ROOT))return route.continue();
  outsideRequests++;return route.abort();
 });
 await page.goto(ROOT+"/admin.html",{waitUntil:"domcontentloaded",timeout:20000});
 await page.waitForSelector("#loginForm",{state:"visible",timeout:17000});
 await page.locator("#adminToken").fill("INVALID_LOCAL_TOKEN");
 await page.locator('#loginForm button[type="submit"]').click();
 await page.waitForFunction(()=>document.querySelector("#loginNotice")?.textContent?.length>0,undefined,{timeout:7000});
 assert.equal(await page.locator("#adminApp:not(.hidden)").count(),0,"Wrong token should not reveal Admin");
 await page.locator("#adminToken").fill(TOKEN);
 await page.locator('#loginForm button[type="submit"]').click();
 await page.waitForSelector("#adminApp:not(.hidden)",{timeout:14000});
 await page.waitForFunction(()=>document.getElementById("kpiUsers")?.textContent==="3",undefined,{timeout:11000});
 assert.equal(await page.locator("#kpiUsers").textContent(),"3");
 await page.locator("#tbBetaReload").evaluate(el=>el.click());
 await page.waitForFunction(()=>document.querySelector("#tbBetaStatus")?.dataset.state==="success",undefined,{timeout:7000});
 assert.equal(await page.locator("#tbBetaList .tb-beta-row").count(),1);
 assert(authorized>0&&denied>0,"Browser failed to exercise real 401 and 200 handlers");
 // External images/fonts may be requested by the historical Admin HTML.
 // The route handler aborts every such request before network transfer.
 assert.equal(networkWrites,0,"Attempted browser API mutation");
 console.log("External asset requests intercepted and blocked: "+outsideRequests);
 console.log("ADM-01 original login form + real users/Beta endpoints + Dashboard: PASS");
 console.log("All external network requests BLOCKED; HTTP mutation 0; schema writes only in-memory.");
 await browserContext.close();
}finally{
 if(browser)await browser.close();
 server.kill("SIGTERM");
}
