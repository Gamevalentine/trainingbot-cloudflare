// Self-contained Cloudflare D1 contract test: no real secrets and no Production writes.
import assert from "node:assert/strict";
import fs from "node:fs";
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
 constructor(row){this.post=clone(row);this.backup=null;this.table=false;this.sql=[];this.failAfterFirstAction=false}
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
       return {meta:{changes:0}};
      db.backup={slug:savedSlug,revision:rev,original_json,original_updated_at,correction_updated_at,
        created_at,state:"applied",restored_at:""};
      return {meta:{changes:1}};
     }
     if(sql.startsWith("UPDATE tb_editorial_erangel_backup_v1 SET state='restored'")){
      const [restored_at,backupSlug,rev,rowSlug,id,title,updated_at]=vals;
      const b=db.backup,p=db.post;
      if(!b||b.slug!==backupSlug||b.revision!==rev||b.state!=="applied"||
       !p||p.slug!==rowSlug||p.id!==id||p.title!==title||p.updated_at!==updated_at)
       return {meta:{changes:0}};
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

fs.mkdirSync("seo-erangel-migration-artifacts",{recursive:true});
fs.writeFileSync("seo-erangel-migration-artifacts/qa-report.json",JSON.stringify({
 checked:"2026-10-29",scope:"Mock D1 only",operations:[
  "unauthorized GET/POST rejected","preview writes rejected","original backup saved",
  "apply idempotent","restore exact row","refuse edited-record rollback",
  "restored original not served publicly","transaction failure atomicity",
  "unexpected existing title rejected"
 ],productionD1Migrated:false},null,2));
console.log("ERANGEL D1 MIGRATION QA PASS: private backup, D1 transaction, exact rollback, public fail-closed fallback; remote Production migration NOT executed");
