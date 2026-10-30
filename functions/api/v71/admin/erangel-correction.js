// Production-only authenticated, transactional D1 migration and guarded restore.
import {ERANGEL_D1_CORRECTION,isStoredErangelCorrection} from "../../../bai-viet/[slug].js";
const REVISION="erangel-pc39-2-to-mobile47-20261029";
const BACKUP_TABLE="tb_editorial_erangel_backup_v1";
const HEADERS={"content-type":"application/json; charset=UTF-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:HEADERS});
const FIELDS=["id","slug","title","summary","content","rich_content","category","cover_url","status","featured_at","created_at","updated_at","published_at"];
const createBackup="CREATE TABLE IF NOT EXISTS "+BACKUP_TABLE+" (slug TEXT PRIMARY KEY, revision TEXT NOT NULL, original_json TEXT NOT NULL, original_updated_at TEXT NOT NULL, correction_updated_at TEXT NOT NULL, created_at TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('applied','restored')), restored_at TEXT NOT NULL DEFAULT '')";
// GitHub Actions OIDC: a short-lived, signed workload identity for this single
// production editorial migration. No human Cloudflare login or shared API key.
const OIDC_ISSUER="https://token.actions.githubusercontent.com";
const OIDC_JWKS=OIDC_ISSUER+"/.well-known/jwks";
// Fetch GitHub's live public signing keys from the fixed issuer URL; never
// follow redirects to a different host. Cloudflare Workers supports "manual"
// but rejects "error" before any network request is made.
// A network/JWKS failure fails CLOSED; no hard-coded expiring fallback needed.
const OIDC_AUDIENCE="trainingbot-erangel-d1-migration-v1";
const OIDC_REPOSITORY="gamevalentine/trainingbot-cloudflare";
const OIDC_WORKFLOW=OIDC_REPOSITORY+"/.github/workflows/trainingbot-erangel-d1-migrate.yml@refs/heads/main";
// Additional signed main-branch identity may READ D2 status only; cannot write.
const OIDC_D2_READ_WORKFLOW=OIDC_REPOSITORY+"/.github/workflows/trainingbot-d2-audit.yml@refs/heads/main";
function decodeBase64Url(value){
 if(!/^[a-zA-Z0-9_-]+$/.test(value))throw new Error("Invalid base64url");
 const raw=atob(value.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(value.length/4)*4,"="));
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
async function verifiedGithubOidc(request){
 if(!isProduction(request))return false;
 const header=request.headers.get("Authorization")||"";
 if(!header.startsWith("Bearer ")||header.length>9000)return false;
 const token=header.slice(7),parts=token.split(".");
 if(parts.length!==3)return false;
 try{
  const jwtHeader=JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0])));
  if(jwtHeader.alg!=="RS256"||typeof jwtHeader.kid!=="string"||jwtHeader.kid.length>200)return false;
  // Runtime supports "manual" redirects; any 3xx is !ok and rejected.
  // No request-provided JWK/JWKS URL is ever trusted.
  if("jku" in jwtHeader||"x5u" in jwtHeader||"jwk" in jwtHeader)return false;
  const jwksResponse=await fetch(OIDC_JWKS,{headers:{Accept:"application/json"},redirect:"manual"});
  if(!jwksResponse.ok)return false;
  const jwks=await jwksResponse.json();
  if(!Array.isArray(jwks.keys)||jwks.keys.length===0)return false;
  const verifiedKeys=jwks.keys;
  const publicJwk=verifiedKeys.find(key=>key.kid===jwtHeader.kid&&key.kty==="RSA"&&
    (!key.alg||key.alg==="RS256")&&(!key.use||key.use==="sig"));
  if(!publicJwk)return false;
  const key=await crypto.subtle.importKey("jwk",publicJwk,
    {name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
  const signed=await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,
    decodeBase64Url(parts[2]),new TextEncoder().encode(parts[0]+"."+parts[1]));
  if(!signed)return false;
  const jwt=JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1])));
  const now=Math.floor(Date.now()/1000);
  return jwt.iss===OIDC_ISSUER&&jwt.aud===OIDC_AUDIENCE&&
   String(jwt.repository||"").toLowerCase()===OIDC_REPOSITORY&&
   (String(jwt.workflow_ref||"").toLowerCase()===OIDC_WORKFLOW||
    (request.method==="GET"&&String(jwt.workflow_ref||"").toLowerCase()===OIDC_D2_READ_WORKFLOW))&&
   jwt.ref==="refs/heads/main"&&jwt.event_name==="push"&&
   typeof jwt.sha==="string"&&/^[a-f0-9]{40}$/.test(jwt.sha)&&
   typeof jwt.jti==="string"&&jwt.jti.length>0&&
   Number.isInteger(jwt.iat)&&jwt.iat>=now-300&&jwt.iat<=now+30&&
   Number.isInteger(jwt.exp)&&jwt.exp>now&&jwt.exp<=now+600&&
   (jwt.nbf===undefined||(Number.isInteger(jwt.nbf)&&jwt.nbf<=now+30));
 }catch(error){
  console.warn("GitHub OIDC verification unavailable");
  return false;
 }
}
async function authorized(request,env){
 const expected=String(env.ADMIN_TOKEN||"");
 if(expected.length>=16&&request.headers.get("Authorization")==="Bearer "+expected)return true;
 return verifiedGithubOidc(request);
}
function isProduction(request){
 try{return ["trainingbot.io.vn","trainingbot-cloudflare.pages.dev"].includes(new URL(request.url).hostname)}catch{return false}
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
 if(!await authorized(request,env))return reply({ok:false,message:"Unauthorized"},401);
 if(!env.DB)return reply({ok:false,message:"D1 binding unavailable"},503);
 try{
  const [post,backup]=await Promise.all([getPost(env.DB),getBackup(env.DB)]);
  if(!post)return reply({ok:false,message:"Target post not found"},404);
  // Read-only D2 integrity verification: do not expose original_json, source
  // text, secret hashes, or personal fields in the public API response.
  let backupIntegrity=false,immutableFieldsMatch=false;
  if(backup){
   try{
    const original=JSON.parse(backup.original_json);
    const immutable=["id","slug","category","status","featured_at","created_at","published_at"];
    immutableFieldsMatch=immutable.every(field=>(original[field]??"")===(post[field]??""));
    backupIntegrity=backup.revision===REVISION && backup.state==="applied" &&
     validOriginal(original) && original.updated_at===backup.original_updated_at &&
     post.updated_at===backup.correction_updated_at &&
     immutableFieldsMatch && backup.slug===ERANGEL_D1_CORRECTION.slug &&
     isStoredErangelCorrection(post);
   }catch(error){backupIntegrity=false}
  }
  return reply({ok:true,revision:REVISION,slug:ERANGEL_D1_CORRECTION.slug,
   stored_correction:isStoredErangelCorrection(post),migration_state:backup?.state||"not_applied",
   backup_exists:!!backup,backup_integrity_ok:backupIntegrity,
   immutable_fields_match:backup?immutableFieldsMatch:null,
   maintenance_writes_locked:env.D1_ERANGEL_WRITE_ENABLED!=="true",
   public_fallback_required:!isStoredErangelCorrection(post),
   updated_at:post.updated_at||null,backup_created_at:backup?.created_at||null,
   restored_at:backup?.restored_at||null});
 }catch(error){console.error("Erangel D1 status",error);return reply({ok:false,message:"Could not read D1 state"},500)}
}
export async function onRequestPost({request,env}){
 if(!await authorized(request,env))return reply({ok:false,message:"Unauthorized"},401);
 if(!isProduction(request))return reply({ok:false,message:"Maintenance writes require the production hostname"},403);
 // D2.3: the one-time migration is complete. All maintenance writes are now
 // disabled unless the operator *explicitly* enables a separate environment
 // toggle after reviewing a verified backup and rollback plan. This gate is
 // enforced for BOTH GitHub OIDC and legacy ADMIN_TOKEN identities.
 if(env.D1_ERANGEL_WRITE_ENABLED!=="true")
  return reply({ok:false,message:"D1 maintenance writes locked after migration"},423);
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
   // D1.batch is transactional. The backup INSERT intentionally violates NOT NULL
   // if the compare-and-set UPDATE did not produce the expected article row.
   // This prevents a partially applied correction with no usable backup.
   // Compare-and-set prevents overwriting a concurrent Admin edit.
   const actions=[
    db.prepare("UPDATE tb_manual_posts_v1 SET title=?,summary=?,content=?,rich_content=?,cover_url=?,updated_at=? WHERE slug=? AND id=? AND updated_at=? AND title=? AND content=?")
     .bind(ERANGEL_D1_CORRECTION.title,ERANGEL_D1_CORRECTION.summary,ERANGEL_D1_CORRECTION.content,
       ERANGEL_D1_CORRECTION.rich_content,ERANGEL_D1_CORRECTION.cover_url,now,original.slug,
       original.id,original.updated_at,original.title,original.content),
    db.prepare("INSERT INTO "+BACKUP_TABLE+" (slug,revision,original_json,original_updated_at,correction_updated_at,created_at,state) VALUES (?,?,?,?,?,?,CASE WHEN EXISTS (SELECT 1 FROM tb_manual_posts_v1 WHERE slug=? AND id=? AND title=? AND content=? AND updated_at=?) THEN 'applied' ELSE NULL END)")
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
   db.prepare("UPDATE "+BACKUP_TABLE+" SET state=CASE WHEN EXISTS (SELECT 1 FROM tb_manual_posts_v1 WHERE slug=? AND id=? AND title=? AND updated_at=?) THEN 'restored' ELSE NULL END,restored_at=? WHERE slug=? AND revision=? AND state='applied'")
    .bind(original.slug,original.id,original.title,original.updated_at,new Date().toISOString(),original.slug,REVISION)
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
