/* Optional Stage-only diagnostic of a Cloudflare REQUEST to /api/visitor-events.
 * This does not prove which request loaded the HTML page or that a visitor is a bot.
 * Disabled without an explicit environment flag. No IP/UA/GPS/fingerprint stored.
 */
export const ENABLE_FLAG="TRAFFIC_RAY_AUDIT_ENABLED";
const RAY=/^[a-f0-9]{16,32}(?:-[A-Z]{3})?$/i;
export const normalizeRay=value=>{
  const ray=String(value??"").trim();
  if(!RAY.test(ray))return "";
  const [id,pop]=ray.split("-");
  return id.toLowerCase()+(pop?"-"+pop.toUpperCase():"");
};
export const rayAuditEnabled=(env,request)=>{
  if(env?.[ENABLE_FLAG]!=="1"||!request)return false;
  const expected=String(env.TRAFFIC_RAY_AUDIT_STAGE_HOST||"").trim().toLowerCase();
  let actual;
  try{actual=new URL(request.url).hostname.toLowerCase();}catch{return false;}
  // Require a distinct, expressly configured Staging host. A flag alone
  // must never accidentally activate D1 diagnostics on Production/Pages.
  return Boolean(expected)&&actual===expected&&
    actual!=="trainingbot.io.vn"&&actual!=="trainingbot-cloudflare.pages.dev"&&
    !actual.endsWith(".trainingbot-cloudflare.pages.dev");
};
export const rayAuditSQL={
  create:`CREATE TABLE IF NOT EXISTS tb_traffic_ingest_ray_audit_v1(
    ray_id TEXT NOT NULL,visitor_id TEXT NOT NULL,visit_id TEXT NOT NULL,
    created_at TEXT NOT NULL,request_path TEXT NOT NULL,
    PRIMARY KEY(ray_id,visitor_id,visit_id)
  )`,
  index:"CREATE INDEX IF NOT EXISTS idx_tb_ingest_ray_created ON tb_traffic_ingest_ray_audit_v1(created_at)",
  insert:`INSERT OR IGNORE INTO tb_traffic_ingest_ray_audit_v1
    (ray_id,visitor_id,visit_id,created_at,request_path) VALUES(?,?,?,?,?)`,
  prune:"DELETE FROM tb_traffic_ingest_ray_audit_v1 WHERE created_at<?"
};
export async function recordIngestRay({db,env,request,eventType,visitorId,visitId,now}){
  if(!rayAuditEnabled(env,request)||eventType!=="page_view"||!db)return {recorded:false,reason:"disabled_or_not_pageview"};
  const ray=normalizeRay(request.headers.get("cf-ray"));
  if(!ray)return {recorded:false,reason:"no_valid_edge_ray"};
  // The Cf-Ray here belongs to the tracking POST, not necessarily the page GET.
  await db.batch([db.prepare(rayAuditSQL.create),db.prepare(rayAuditSQL.index)]);
  await db.prepare(rayAuditSQL.insert).bind(ray,visitorId,visitId,now,"/api/visitor-events").run();
  // Opportunistic time-based retention in a staging-only debug table. Calls outside the
  // feature flag cannot create, query, or prune it. A disabled deployment writes nothing.
  const cutoff=new Date(Date.parse(now)-7*86400000).toISOString();
  await db.prepare(rayAuditSQL.prune).bind(cutoff).run();
  return {recorded:true,ray};
}
