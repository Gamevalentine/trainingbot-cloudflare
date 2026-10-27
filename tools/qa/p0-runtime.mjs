// P0 non-production tests: public contact -> D1 -> authenticated inbox, validated download flow.
import assert from "node:assert/strict";
import fs from "node:fs";
import {pathToFileURL} from "node:url";
const mod=async path=>import("data:text/javascript;base64,"+Buffer.from(fs.readFileSync(path,"utf8")).toString("base64"));
const {onRequestPost}=await mod("functions/api/contact.js");
const {onRequestGet}=await mod("functions/api/v71/admin/contact-messages.js");
const {onRequest:betaDownload}=await import(pathToFileURL(process.cwd()+"/functions/download/beta/[version].js").href);
const {onRequest:flash461}=await import(pathToFileURL(process.cwd()+"/functions/download/flash-v4-6-1.js").href);
const {onRequest:flash470}=await import(pathToFileURL(process.cwd()+"/functions/download/flash-v4-7-0.js").href);
const messages=[],counting={beta:0,flash461:0,flash470:0};
let persistFails=false;
const db={prepare(sql){return {values:[],bind(...x){this.values=x;return this;},
 async run(){
  if(sql.includes("INSERT INTO tb_contact_messages_v202")){
   if(persistFails)return {success:false};
   messages.push({id:this.values[0],name:this.values[1],email:this.values[2],subject:this.values[3],message:this.values[4],received_at:this.values[6]});
  }
  if(sql.includes("INSERT INTO tb_beta_download_counts_v1"))counting.beta++;
  if(sql.includes("INSERT INTO tb_flash_download_counts_v1")){
   if(this.values[0]==="v4.6.1")counting.flash461++;
   if(this.values[0]==="v4.7.0")counting.flash470++;
  }
  return {success:true};
 },
 async first(){
  if(sql.includes("SELECT COUNT(*) AS n FROM tb_contact"))return {n:messages.length};
  if(sql.includes("SELECT version,arch,status,download_url"))return {version:"V4.7.3",arch:"x64",status:"released",download_url:"https://files.example.invalid/test.apk"};
  return null;
 },
 async all(){return {results:messages};}
};}};
const body={name:"QA Guest",email:"qa@example.invalid",subject:"Báo lỗi website",message:"Kiểm tra giả lập không gửi thật."};
const post=(value=body,origin="https://preview.trainingbot-cloudflare.pages.dev")=>new Request("https://preview.trainingbot-cloudflare.pages.dev/api/contact",{
 method:"POST",headers:{"Origin":origin,"Content-Type":"application/json","CF-Connecting-IP":"192.0.2.25"},body:JSON.stringify(value)});
const inbox=(token)=>new Request("https://trainingbot.io.vn/api/v71/admin/contact-messages",{
 headers:token?{Authorization:"Bearer "+token}:{}});
let response=await onRequestPost({request:post(),env:{}});assert.equal(response.status,503);assert.equal(messages.length,0);
response=await onRequestPost({request:post({...body,email:"bad"}),env:{DB:db}});assert.equal(response.status,400);
response=await onRequestPost({request:post(body,"https://attacker.invalid"),env:{DB:db}});assert.equal(response.status,403);
response=await onRequestPost({request:post({...body,website:"spam.example"}),env:{DB:db}});assert.equal(response.status,400);
persistFails=true;response=await onRequestPost({request:post(),env:{DB:db}});assert.equal(response.status,503);assert.equal(messages.length,0);
persistFails=false;response=await onRequestPost({request:post(),env:{DB:db}});assert.equal(response.status,201);
assert.equal((await response.json()).received,true);assert.equal(messages.length,1);
response=await onRequestGet({request:inbox(),env:{DB:db,ADMIN_TOKEN:"mock-secret"}});assert.equal(response.status,401);
response=await onRequestGet({request:inbox("wrong"),env:{DB:db,ADMIN_TOKEN:"mock-secret"}});assert.equal(response.status,401);
response=await onRequestGet({request:inbox("mock-secret"),env:{DB:db,ADMIN_TOKEN:"mock-secret"}});assert.equal(response.status,200);
let data=await response.json();assert.equal(data.messages.length,1);assert.equal(data.messages[0].email,body.email);
for(let i=0;i<2;i++)assert.equal((await onRequestPost({request:post(),env:{DB:db}})).status,201);
assert.equal((await onRequestPost({request:post(),env:{DB:db}})).status,429);
const originalFetch=globalThis.fetch;
try{
 globalThis.fetch=async(_url,{method})=>new Response(method==="HEAD"?null:new Uint8Array([0x50]),{status:200,headers:{"Content-Type":"application/vnd.android.package-archive","Content-Length":"1"}});
 const url="https://trainingbot.io.vn/download/beta/V4.7.3";
 response=await betaDownload({request:new Request(url,{method:"HEAD"}),env:{DB:db},params:{version:"V4.7.3"}});
 assert.equal(response.status,200);assert.equal(counting.beta,0);
 response=await betaDownload({request:new Request(url,{headers:{Range:"bytes=0-0"}}),env:{DB:db},params:{version:"V4.7.3"}});
 assert.equal(response.status,200);assert.equal(counting.beta,0);
 response=await betaDownload({request:new Request(url),env:{DB:db},params:{version:"V4.7.3"}});
 assert.equal(response.status,200);assert.equal(counting.beta,1);
 response=await flash461({request:new Request("https://trainingbot.io.vn/download/flash-v4-6-1",{method:"HEAD"}),env:{DB:db}});
 assert.equal(response.status,302);assert.equal(counting.flash461,0);
 response=await flash470({request:new Request("https://trainingbot.io.vn/download/flash-v4-7-0",{method:"HEAD"}),env:{DB:db}});
 assert.equal(response.status,200);assert.equal(counting.flash470,0);
 globalThis.fetch=async()=>new Response("<html>expired</html>",{headers:{"Content-Type":"text/html"}});
 response=await betaDownload({request:new Request(url),env:{DB:db},params:{version:"V4.7.3"}});
 assert.equal(response.status,502);assert.equal(counting.beta,1);
 response=await flash470({request:new Request("https://trainingbot.io.vn/download/flash-v4-7-0"),env:{DB:db}});
 assert.equal(response.status,502);assert.equal(counting.flash470,0);
}finally{globalThis.fetch=originalFetch;}
console.log("P0 contact persistence and authorized inbox: PASS");
console.log("P0 download counters, HEAD/Range, non-APK rejection: PASS");
