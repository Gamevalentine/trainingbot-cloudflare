// Self-contained Cloudflare D1 contract test: no real secrets and no Production writes.
import assert from "node:assert/strict";
import fs from "node:fs";
import {generateKeyPairSync,createSign} from "node:crypto";
const articleSource=fs.readFileSync("functions/bai-viet/[slug].js","utf8");
const articleUrl="data:text/javascript;base64,"+Buffer.from(articleSource).toString("base64");
const article=await import(articleUrl);
let controller=fs.readFileSync("functions/api/v71/admin/erangel-correction.js","utf8");
const importLine='import {ERANGEL_D1_CORRECTION,isStoredErangelCorrection} from "../../../bai-viet/[slug].js";';
assert(controller.includes(importLine));
controller=controller.replace(importLine,'import {ERANGEL_D1_CORRECTION,isStoredErangelCorrection} from "'+articleUrl+'";');
const {onRequestGet,onRequestPost}=await import("data:text/javascript;base64,"+Buffer.from(controller).toString("base64"));
const correction=article.ERANGEL_D1_CORRECTION;
const slug=correction.slug,revision="erangel-pc39-2-to-mobile47-20261029";
const old={
 id:"tb-post-original-2026",slug,title:"BATTLEGROUNDS mở rộng Erangel: Subzero trong PUBG Mobile & BGMI với bản Beta 4.7.2",
 summary:"Old misleading PUBG Mobile 4.7.2 blurb",
 content:"## Satellite Crash\nThe Frost Zone Bomb in an old PUBG PC patch.",rich_content:"<p>Original body</p>",
 category:"Tin mới",cover_url:"/user-posts/erangel-original.webp",
 status:"published",featured_at:"",created_at:"2026-10-06T00:00:00.000Z",
 updated_at:"2026-10-06T00:00:00.000Z",published_at:"2026-10-06T00:00:00.000Z"
};
const clone=x=>JSON.parse(JSON.stringify(x));
class MockD1{
 constructor(row){this.post=clone(row);this.backup=null;this.table=false;this.sql=[];this.failAfterFirstAction=false;this.concurrentEditBeforeBatch=false}
 prepare(sql){
  const db=this;
  function wrap(vals=[]){
   return {
    bind(...newVals){return wrap(newVals)},
    async first(){
     db.sql.push(["first",sql]);
     if(sql.startsWith("SELECT * FROM tb_manual_posts_v1"))return db.post?.slug===vals[0]?clone(db.post):null;
     if(sql.startsWith("SELECT slug,revision,original_json")) {
      if(!db.table)throw new Error("D1_ERROR: no such table: tb_editorial_erangel_backup_v1");
      return db.backup?.slug===vals[0]?clone(db.backup):null;
     }
     throw Error("Unexpected SELECT "+sql);
    },
    async run(){
     db.sql.push(["run",sql]);
     if(sql.startsWith("CREATE TABLE IF NOT EXISTS tb_editorial_erangel_backup_v1")){
      db.table=true;return {meta:{changes:0}};
     }
     if(sql.startsWith("UPDATE tb_manual_posts_v1 SET title=?")){
      const [title,summary,content,rich_content,cover_url,updated_at,recordSlug,id,a,b,c]=vals;
      const isRestore=sql.includes("WHERE slug=? AND id=? AND title=? AND content=? AND updated_at=?");
      const [prevUpdated,prevTitle,prevContent]=isRestore?[c,a,b]:[a,b,c];
      const p=db.post;
      if(!p||p.slug!==recordSlug||p.id!==id||p.updated_at!==prevUpdated||p.title!==prevTitle||p.content!==prevContent)
       return {meta:{changes:0}};
      Object.assign(p,{title,summary,content,rich_content,cover_url,updated_at});
      return {meta:{changes:1}};
     }
     if(sql.startsWith("INSERT INTO tb_editorial_erangel_backup_v1")){
      const [savedSlug,rev,original_json,original_updated_at,correction_updated_at,created_at,
       rowSlug,id,title,content,updated_at]=vals;
      if(db.backup)throw Error("UNIQUE constraint failed: backup slug");
      const p=db.post;
      if(!p||p.slug!==rowSlug||p.id!==id||p.title!==title||p.content!==content||p.updated_at!==updated_at)
       throw Error("NOT NULL constraint failed: tb_editorial_erangel_backup_v1.state");
      db.backup={slug:savedSlug,revision:rev,original_json,original_updated_at,correction_updated_at,
        created_at,state:"applied",restored_at:""};
      return {meta:{changes:1}};
     }
     if(sql.startsWith("UPDATE tb_editorial_erangel_backup_v1 SET state=CASE WHEN EXISTS")){
      const [rowSlug,id,title,updated_at,restored_at,backupSlug,rev]=vals;
      const b=db.backup,p=db.post;
      if(!b||b.slug!==backupSlug||b.revision!==rev||b.state!=="applied")return {meta:{changes:0}};
      if(!p||p.slug!==rowSlug||p.id!==id||p.title!==title||p.updated_at!==updated_at)
       throw Error("NOT NULL constraint failed: tb_editorial_erangel_backup_v1.state");
      Object.assign(b,{state:"restored",restored_at});
      return {meta:{changes:1}};
     }
     throw Error("Unexpected D1 write "+sql);
    }
   };
  }
  return wrap();
 }
 async batch(actions){
  if(this.concurrentEditBeforeBatch){
   this.post.title="Concurrent Admin edit while migration was being prepared";
   this.post.updated_at="2026-10-29T18:55:00.000Z";
  }
  const before={post:clone(this.post),backup:clone(this.backup),table:this.table},results=[];
  try{
   for(let i=0;i<actions.length;i++){
    results.push(await actions[i].run());
    if(i===0 && this.failAfterFirstAction)throw Error("Simulated D1 transaction failure");
   }
   return results;
  }catch(e){Object.assign(this,before);throw e}
 }
}
const token="a-valid-private-ops-token-at-least-16-chars";
const env={ADMIN_TOKEN:token,DB:new MockD1(old)};
function req(method,action,authorized=true,host="trainingbot.io.vn"){
 return new Request("https://"+host+"/api/v71/admin/erangel-correction",{
  method,headers:{"content-type":"application/json",...(authorized?{"Authorization":"Bearer "+token}:{})},
  ...(method==="POST"?{body:JSON.stringify({action,confirm:revision})}:{})
 });
}
async function body(response){return {status:response.status,...await response.json()}}
const beforeStatus=await body(await onRequestGet({request:req("GET"),env}));
assert.equal(beforeStatus.status,200);
assert.equal(beforeStatus.migration_state,"not_applied");
assert.equal(beforeStatus.stored_correction,false);
assert.equal((await body(await onRequestGet({request:req("GET",null,false),env}))).status,401);
assert.equal((await body(await onRequestPost({request:req("POST","apply",false),env}))).status,401);
assert.equal((await body(await onRequestPost({request:req("POST","apply",true,"preview.pages.dev"),env}))).status,403);
assert.equal(env.DB.sql.filter(([op])=>op==="run").length,0,"Unauthorized or preview attempt wrote D1");
const corrected=await body(await onRequestPost({request:req("POST","apply"),env}));
assert.equal(corrected.status,200);
assert.equal(corrected.result,"applied");
assert.equal(corrected.public_fallback_required,false);
assert.deepEqual(env.DB.post.title,correction.title);
assert.equal(env.DB.post.content,correction.content);
assert.equal(env.DB.backup.state,"applied");
assert.deepEqual(JSON.parse(env.DB.backup.original_json),old);
assert.equal((await body(await onRequestPost({request:req("POST","apply"),env}))).result,"already_applied");
const readStatus=await body(await onRequestGet({request:req("GET"),env}));
assert.equal(readStatus.backup_exists,true);
assert.equal(readStatus.stored_correction,true);
assert.equal(readStatus.migration_state,"applied");

const newer=env.DB.post.updated_at;
env.DB.post.updated_at="2026-10-30T00:00:00.000Z";
assert.equal((await body(await onRequestPost({request:req("POST","rollback"),env}))).status,409,
 "Refuse rollback over later editor changes");
env.DB.post.updated_at=newer;
const rolled=await body(await onRequestPost({request:req("POST","rollback"),env}));
assert.equal(rolled.status,200);
assert.equal(rolled.result,"restored_original_in_D1");
assert.equal(rolled.public_article_retains_correction,true);
assert.equal(env.DB.backup.state,"restored");
assert.deepEqual(env.DB.post,old,"Original D1 row must be fully restored");
assert.equal((await body(await onRequestPost({request:req("POST","rollback"),env}))).status,409);
assert.equal((await body(await onRequestPost({request:req("POST","apply"),env}))).status,409,
 "No new migration may overwrite archived original");
const restoredPublic=await article.onRequestGet({env:{DB:{
 prepare(sql){return {bind(){return {first:async()=>env.DB.post,all:async()=>({results:[]})}}}}
}},params:{slug}});
const safeHtml=await restoredPublic.text();
assert(safeHtml.includes(correction.title),"Public fallback must prevent misinformation returning after rollback");
assert(!safeHtml.includes(old.title),"Original incorrect title must not become public");

const atomicDb=new MockD1(old);
atomicDb.failAfterFirstAction=true;
const failed=await body(await onRequestPost({request:req("POST","apply"),env:{ADMIN_TOKEN:token,DB:atomicDb}}));
assert.equal(failed.status,500);
assert.deepEqual(atomicDb.post,old,"Failed transaction must not partially overwrite article");
assert.equal(atomicDb.backup,null);
const conflictDb=new MockD1({...old,title:"Someone already re-edited this article"});
assert.equal((await body(await onRequestPost({request:req("POST","apply"),env:{ADMIN_TOKEN:token,DB:conflictDb}}))).status,409);
assert.equal(conflictDb.backup,null);
const concurrencyDb=new MockD1(old);
concurrencyDb.concurrentEditBeforeBatch=true;
const concurrencyResponse=await body(await onRequestPost({request:req("POST","apply"),env:{ADMIN_TOKEN:token,DB:concurrencyDb}}));
assert.equal(concurrencyResponse.status,500,"Concurrent optimistic-lock conflict must abort batch");
assert.equal(concurrencyDb.post.title,"Concurrent Admin edit while migration was being prepared");
assert.equal(concurrencyDb.backup,null,"No backup can claim success after an aborted write");
assert.equal(concurrencyDb.post.content,old.content,"Concurrent update must not be overwritten");


// GitHub OIDC authentication contract: fake key pair, no real tokens or network.
const {publicKey,privateKey}=generateKeyPairSync("rsa",{modulusLength:2048});
const publicJwk={...publicKey.export({format:"jwk"}),kid:"trainingbot-qa-key",alg:"RS256",use:"sig"};
const githubJwks="https://token.actions.githubusercontent.com/.well-known/jwks";
const beforeFetch=globalThis.fetch;
globalThis.fetch=async uri=>{
 if(String(uri)!==githubJwks)throw Error("Unexpected OIDC key source");
 return Response.json({keys:[publicJwk]});
};
const now=Math.floor(Date.now()/1000);
const signedJwt=(claims={})=>{
 const header=Buffer.from(JSON.stringify({alg:"RS256",typ:"JWT",kid:publicJwk.kid})).toString("base64url");
 const payload=Buffer.from(JSON.stringify({
  iss:"https://token.actions.githubusercontent.com",
  aud:"trainingbot-erangel-d1-migration-v1",
  repository:"Gamevalentine/trainingbot-cloudflare",
  workflow_ref:"Gamevalentine/trainingbot-cloudflare/.github/workflows/trainingbot-erangel-d1-migrate.yml@refs/heads/main",
  ref:"refs/heads/main",event_name:"push",sha:"a".repeat(40),jti:"qa-test",
  iat:now,nbf:now-1,exp:now+240,...claims
 })).toString("base64url");
 const signed=header+"."+payload;
 return signed+"."+createSign("RSA-SHA256").update(signed).sign(privateKey).toString("base64url");
};
const oidcReq=(method,jwt,action,host="trainingbot.io.vn")=>new Request(
 "https://"+host+"/api/v71/admin/erangel-correction",{
 method,headers:{"authorization":"Bearer "+jwt,"content-type":"application/json"},
 ...(method==="POST"?{body:JSON.stringify({action,confirm:revision})}:{})
 });
try{
 const oidcDB=new MockD1(old),oidcEnv={DB:oidcDB};
 const valid=signedJwt();
 const st=await body(await onRequestGet({request:oidcReq("GET",valid),env:oidcEnv}));
 assert.equal(st.status,200,"Signed, correct GitHub OIDC workflow can read D1 migration status");
 const badCases=[
  signedJwt({aud:"wrong-audience"}),
  signedJwt({workflow_ref:"OtherOwner/other/.github/workflows/trainingbot-erangel-d1-migrate.yml@refs/heads/main"}),
  signedJwt({event_name:"pull_request"}),
  signedJwt({ref:"refs/heads/feature"}),
  signedJwt({exp:now-1}),
  signedJwt({repository:"attacker/repository"}),
  valid.slice(0,-4)+"zzzz"
 ];
 for(const bad of badCases){
  const rejected=await body(await onRequestPost({request:oidcReq("POST",bad,"apply"),env:oidcEnv}));
  assert.equal(rejected.status,401,"Reject non-matching or tampered OIDC identity");
 }
 assert.equal(oidcDB.backup,null,"Bad OIDC tokens never write D1 backup");
 const blockedPreview=await body(await onRequestPost({
  request:oidcReq("POST",valid,"apply","preview.trainingbot-cloudflare.pages.dev"),env:oidcEnv}));
 assert.equal(blockedPreview.status,401,"Reject GitHub OIDC on Pages Preview");
 const applied=await body(await onRequestPost({request:oidcReq("POST",valid,"apply"),env:oidcEnv}));
 assert.equal(applied.status,200);
 assert.equal(applied.result,"applied");
 assert.equal(oidcDB.backup.state,"applied");
 assert.deepEqual(JSON.parse(oidcDB.backup.original_json),old);
 const prodAliasDB=new MockD1(old);
 const prodAlias=await body(await onRequestPost({
  request:oidcReq("POST",valid,"apply","trainingbot-cloudflare.pages.dev"),
  env:{DB:prodAliasDB}
 }));
 assert.equal(prodAlias.status,200,"Canonical Pages production hostname must be permitted for signed OIDC migration");
 assert.equal(prodAliasDB.backup.state,"applied");
 assert.deepEqual(JSON.parse(prodAliasDB.backup.original_json),old);

 // The Cloudflare runtime may have no outbound fetch. Prove pinned keys still
 // validate RSA signatures, while rejecting wrong claims and expired pins.
 const injectPinned=controller.replace(
  /const OIDC_PINNED_KEYS=Object\.freeze\(\[[^\n]*\]\);/,
  "const OIDC_PINNED_KEYS=Object.freeze(["+JSON.stringify(publicJwk)+"]);"
 );
 assert.notEqual(injectPinned,controller,"Expected to inject QA RSA key into pin fixture");
 globalThis.fetch=async()=>{throw new TypeError("Outbound JWKS blocked in QA")};
 const offline=await import("data:text/javascript;base64,"+Buffer.from(injectPinned).toString("base64"));
 const offlineStatus=await body(await offline.onRequestGet({
  request:oidcReq("GET",valid,"", "trainingbot-cloudflare.pages.dev"),env:{DB:new MockD1(old)}
 }));
 assert.equal(offlineStatus.status,200,"Valid signed JWT with previously pinned key passes offline");
 const offlineBad=await body(await offline.onRequestGet({
  request:oidcReq("GET",signedJwt({repository:"attacker/repository"})),env:{DB:new MockD1(old)}
 }));
 assert.equal(offlineBad.status,401,"Offline verifier must still reject wrong repository");
 const expiredSource=injectPinned.replace('Date.parse("2026-10-31T20:20:00Z")','Date.parse("1970-01-01T00:00:00Z")');
 assert.notEqual(expiredSource,injectPinned,"Offline pin must have explicit expiry");
 const expired=await import("data:text/javascript;base64,"+Buffer.from(expiredSource).toString("base64"));
 const expiredStatus=await body(await expired.onRequestGet({
  request:oidcReq("GET",valid),env:{DB:new MockD1(old)}
 }));
 assert.equal(expiredStatus.status,401,"Expired pinned key must fail closed");
 globalThis.fetch=async uri=>{
  if(String(uri)!==githubJwks)throw Error("Unexpected OIDC key source");
  return Response.json({keys:[publicJwk]});
 };

}finally{
 globalThis.fetch=beforeFetch;
}

fs.mkdirSync("seo-erangel-migration-artifacts",{recursive:true});
fs.writeFileSync("seo-erangel-migration-artifacts/qa-report.json",JSON.stringify({
 checked:"2026-10-29",scope:"Mock D1 only",operations:[
  "unauthorized GET/POST rejected","preview writes rejected","original backup saved",
  "apply idempotent","restore exact row","refuse edited-record rollback",
  "restored original not served publicly","transaction failure atomicity",
  "unexpected existing title rejected","concurrent Admin edit aborts D1 batch","signed GitHub OIDC workflow can apply migration on canonical Pages Production hostname","OIDC wrong audience/repo/workflow/branch/event/expiry/signature rejected","offline pinned JWT verification","offline wrong repository denied","expired pin denied"
 ],productionD1Migrated:false},null,2));
console.log("ERANGEL D1 MIGRATION QA PASS: private backup, D1 transaction, exact rollback, public fail-closed fallback; remote Production migration NOT executed");
