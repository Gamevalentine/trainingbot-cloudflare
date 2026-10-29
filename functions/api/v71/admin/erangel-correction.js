// Production-only authenticated, transactional D1 migration and guarded restore.
import {ERANGEL_D1_CORRECTION,isStoredErangelCorrection} from "../../../bai-viet/[slug].js";
const REVISION="erangel-pc39-2-to-mobile47-20261029";
const BACKUP_TABLE="tb_editorial_erangel_backup_v1";
const HEADERS={"content-type":"application/json; charset=UTF-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:HEADERS});
const FIELDS=["id","slug","title","summary","content","rich_content","category","cover_url","status","featured_at","created_at","updated_at","published_at"];
const createBackup="CREATE TABLE IF NOT EXISTS "+BACKUP_TABLE+" (slug TEXT PRIMARY KEY, revision TEXT NOT NULL, original_json TEXT NOT NULL, original_updated_at TEXT NOT NULL, correction_updated_at TEXT NOT NULL, created_at TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('applied','restored')), restored_at TEXT NOT NULL DEFAULT '')";
function authorized(request,env){
 const expected=String(env.ADMIN_TOKEN||"");
 return expected.length>=16 && request.headers.get("Authorization")==="Bearer "+expected;
}
function isProduction(request){
 try{return new URL(request.url).hostname==="trainingbot.io.vn"}catch{return false}
}
function validOriginal(row){
 return !!row && row.slug===ERANGEL_D1_CORRECTION.slug && row.status==="published" &&
 /^BATTLEGROUNDS mở rộng Erangel/i.test(String(row.title||"")) &&
 String(row.content||"").includes("Satellite Crash") && String(row.content||"").includes("Frost Zone Bomb");
}
function snapshot(row){
 const out={};for(const field of FIELDS)out[field]=row[field]??"";return out;
}
async function getPost(db){
 return db.prepare("SELECT * FROM tb_manual_posts_v1 WHERE slug=? LIMIT 1").bind(ERANGEL_D1_CORRECTION.slug).first();
}
async function getBackup(db){
 try{
  return await db.prepare("SELECT slug,revision,original_json,original_updated_at,correction_updated_at,created_at,state,restored_at FROM "+BACKUP_TABLE+" WHERE slug=? LIMIT 1").bind(ERANGEL_D1_CORRECTION.slug).first();
 }catch(error){
  if(/no such table/i.test(String(error?.message||error)))return null;
  throw error;
 }
}
const changed=result=>Number(result?.meta?.changes??-1)===1;
export async function onRequestGet({request,env}){
 if(!authorized(request,env))return reply({ok:false,message:"Unauthorized"},401);
 if(!env.DB)return reply({ok:false,message:"D1 binding unavailable"},503);
 try{
  const [post,backup]=await Promise.all([getPost(env.DB),getBackup(env.DB)]);
  if(!post)return reply({ok:false,message:"Target post not found"},404);
  return reply({ok:true,revision:REVISION,slug:ERANGEL_D1_CORRECTION.slug,
   stored_correction:isStoredErangelCorrection(post),migration_state:backup?.state||"not_applied",
   backup_exists:!!backup,public_fallback_required:!isStoredErangelCorrection(post),
   updated_at:post.updated_at||null,backup_created_at:backup?.created_at||null,
   restored_at:backup?.restored_at||null});
 }catch(error){console.error("Erangel D1 status",error);return reply({ok:false,message:"Could not read D1 state"},500)}
}
export async function onRequestPost({request,env}){
 if(!authorized(request,env))return reply({ok:false,message:"Unauthorized"},401);
 if(!isProduction(request))return reply({ok:false,message:"Maintenance writes require the production hostname"},403);
 if(!env.DB || typeof env.DB.batch!=="function")return reply({ok:false,message:"Transactional D1 binding unavailable"},503);
 let input;
 try{input=await request.json()}catch{return reply({ok:false,message:"Malformed JSON"},400)}
 if(input?.confirm!==REVISION || !["apply","rollback"].includes(input?.action))
  return reply({ok:false,message:"Exact revision confirmation and action required"},400);
 const db=env.DB;
 try{
  await db.prepare(createBackup).run();
  const [post,backup]=await Promise.all([getPost(db),getBackup(db)]);
  if(!post)return reply({ok:false,message:"Target post not found"},404);
  if(input.action==="apply"){
   if(backup){
    if(backup.revision===REVISION && backup.state==="applied" && isStoredErangelCorrection(post))
     return reply({ok:true,result:"already_applied",revision:REVISION,backup_exists:true,stored_correction:true});
    return reply({ok:false,message:"Existing backup or newer edit: refusing to overwrite"},409);
   }
   if(!validOriginal(post))return reply({ok:false,message:"Unexpected source version; no article write"},409);
   const original=snapshot(post),now=new Date().toISOString();
   // D1.batch guarantees a transactional group; if INSERT fails, UPDATE rolls back.
   // Compare-and-set prevents overwriting a concurrent Admin edit.
   const actions=[
    db.prepare("UPDATE tb_manual_posts_v1 SET title=?,summary=?,content=?,rich_content=?,cover_url=?,updated_at=? WHERE slug=? AND id=? AND updated_at=? AND title=? AND content=?")
     .bind(ERANGEL_D1_CORRECTION.title,ERANGEL_D1_CORRECTION.summary,ERANGEL_D1_CORRECTION.content,
       ERANGEL_D1_CORRECTION.rich_content,ERANGEL_D1_CORRECTION.cover_url,now,original.slug,
       original.id,original.updated_at,original.title,original.content),
    db.prepare("INSERT INTO "+BACKUP_TABLE+" (slug,revision,original_json,original_updated_at,correction_updated_at,created_at,state) SELECT ?,?,?,?,?,?,'applied' WHERE EXISTS (SELECT 1 FROM tb_manual_posts_v1 WHERE slug=? AND id=? AND title=? AND content=? AND updated_at=?)")
     .bind(original.slug,REVISION,JSON.stringify(original),original.updated_at,now,now,
       original.slug,original.id,ERANGEL_D1_CORRECTION.title,ERANGEL_D1_CORRECTION.content,now)
   ];
   const results=await db.batch(actions);
   if(!changed(results[0])||!changed(results[1]))
    return reply({ok:false,message:"Concurrent edit prevented migration; inspect D1 before retry"},409);
   const [verified,stored]=await Promise.all([getPost(db),getBackup(db)]);
   if(!isStoredErangelCorrection(verified)||stored?.state!=="applied")
    return reply({ok:false,message:"Verification failed; public safety fallback remains enabled"},500);
   return reply({ok:true,result:"applied",revision:REVISION,backup_exists:true,stored_correction:true,
    public_fallback_required:false});
  }
  if(!backup || backup.revision!==REVISION || backup.state!=="applied")
   return reply({ok:false,message:"No active backup to restore"},409);
  if(!isStoredErangelCorrection(post) || post.updated_at!==backup.correction_updated_at)
   return reply({ok:false,message:"Post changed since correction; refusing destructive rollback"},409);
  let original;
  try{original=JSON.parse(backup.original_json)}catch{return reply({ok:false,message:"Stored snapshot unreadable"},500)}
  if(original.slug!==ERANGEL_D1_CORRECTION.slug || original.id!==post.id ||
     original.updated_at!==backup.original_updated_at || !validOriginal(original))
   return reply({ok:false,message:"Stored snapshot failed integrity checks"},500);
  const actions=[
   db.prepare("UPDATE tb_manual_posts_v1 SET title=?,summary=?,content=?,rich_content=?,cover_url=?,updated_at=? WHERE slug=? AND id=? AND title=? AND content=? AND updated_at=?")
    .bind(original.title,original.summary,original.content,original.rich_content,original.cover_url,
      original.updated_at,original.slug,original.id,ERANGEL_D1_CORRECTION.title,
      ERANGEL_D1_CORRECTION.content,backup.correction_updated_at),
   db.prepare("UPDATE "+BACKUP_TABLE+" SET state='restored',restored_at=? WHERE slug=? AND revision=? AND state='applied' AND EXISTS (SELECT 1 FROM tb_manual_posts_v1 WHERE slug=? AND id=? AND title=? AND updated_at=?)")
    .bind(new Date().toISOString(),original.slug,REVISION,original.slug,original.id,original.title,original.updated_at)
  ];
  const results=await db.batch(actions);
  if(!changed(results[0])||!changed(results[1]))
   return reply({ok:false,message:"Rollback compare-and-set blocked; review D1 state"},409);
  const [verified,record]=await Promise.all([getPost(db),getBackup(db)]);
  if(verified?.title!==original.title||record?.state!=="restored")
   return reply({ok:false,message:"Rollback verification failed; public safety fallback remains enabled"},500);
  return reply({ok:true,result:"restored_original_in_D1",revision:REVISION,backup_exists:true,
   public_fallback_required:true,public_article_retains_correction:true});
 }catch(error){
  console.error("Erangel D1 maintenance failed",error);
  return reply({ok:false,message:"Maintenance failed; inspect D1 state before retry"},500);
 }
}
