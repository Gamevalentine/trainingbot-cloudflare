// ADM-07: Real connected Pages handler contracts, in-process disposable DB/R2.
// Does not read/write Cloudflare or any external service.
import fs from "node:fs";
import assert from "node:assert/strict";
const load=async path=>import("data:text/javascript;base64,"+Buffer.from(fs.readFileSync(path,"utf8")).toString("base64"));
const inbox=(await load("functions/api/v71/admin/contact-messages.js")).onRequestGet;
const replace=(await load("functions/api/v71/admin/image-replace.js")).onRequestPost;
const restore=(await load("functions/api/v71/admin/image-restore.js")).onRequestPost;
const TOKEN="LOCAL_D_TEST_TOKEN";
let dbReads=0,dbWrites=0,r2Writes=0,r2Deletes=0;
const env={ADMIN_TOKEN:TOKEN,
 DB:{prepare(sql){return {async run(){dbWrites++;return {success:true}},async all(){dbReads++;return {results:[{id:"fake-contact",name:"Thử nghiệm",email:"user@example.invalid",subject:"Test",message:"Local only",received_at:"2026-10-28T00:00:00Z"}]}}}},
 VIDEO_BUCKET:{async put(key,data){r2Writes++;assert(key.includes("qa-test.png"));assert(data);},async delete(key){r2Deletes++;assert(key.includes("qa-test.png"));}}
};
const request=(method,path,token,body,headers={})=>new Request("http://local.test"+path,{
 method,headers:{...(token?{Authorization:"Bearer "+token}:{}),...headers},body
});
for(const [name,handler,method,path] of [
 ["inbox",inbox,"GET","/api/v71/admin/contact-messages"],
 ["image-replace",replace,"POST","/api/v71/admin/image-replace"],
 ["image-restore",restore,"POST","/api/v71/admin/image-restore"]
]){
 for(const auth of [undefined,"incorrect"]){
  const response=await handler({request:request(method,path,auth),env});
  assert.equal(response.status,401,name+" should reject missing/wrong token");
 }
}
assert.equal(dbReads,0);assert.equal(dbWrites,0);assert.equal(r2Writes,0);assert.equal(r2Deletes,0);
const accepted=await inbox({request:request("GET","/api/v71/admin/contact-messages",TOKEN),env});
assert.equal(accepted.status,200);
const data=await accepted.json();assert.equal(data.messages.length,1);
assert.equal(dbWrites,1,"Inbox GET triggers table initialization; isolated DB only");
const invalidForm=new FormData();invalidForm.set("target","/invalid.exe");invalidForm.set("file",new File(["text"],"invalid.txt",{type:"text/plain"}));
const invalidReplace=await replace({request:request("POST","/api/v71/admin/image-replace",TOKEN,invalidForm),env});
assert.equal(invalidReplace.status,400);
const goodForm=new FormData();
goodForm.set("target","/images/qa-test.png");
goodForm.set("file",new File([new Uint8Array([137,80,78,71])],"qa-test.png",{type:"image/png"}));
const okPut=await replace({request:request("POST","/api/v71/admin/image-replace",TOKEN,goodForm),env});
assert.equal(okPut.status,200);
assert.equal((await okPut.json()).target,"/images/qa-test.png");
const badRestore=await restore({request:request("POST","/api/v71/admin/image-restore",TOKEN,JSON.stringify({target:"https://other.test/evil.png"}),{"Content-Type":"application/json"}),env});
assert.equal(badRestore.status,400);
const okRestore=await restore({request:request("POST","/api/v71/admin/image-restore",TOKEN,JSON.stringify({target:"/images/qa-test.png"}),{"Content-Type":"application/json"}),env});
assert.equal(okRestore.status,200);
assert.equal(r2Writes,1);assert.equal(r2Deletes,1);
console.log("ADM-07 real Pages handlers: Inbox GET 401/200, image replace & restore 401/400/200, fake R2 PASS");
console.log("Isolated side effects: fake DB schema-init="+dbWrites+", fake R2 put/delete="+r2Writes+"/"+r2Deletes+"; Production 0");
