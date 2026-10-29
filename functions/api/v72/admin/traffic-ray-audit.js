import {normalizeRay,rayAuditEnabled} from "../../../_lib/traffic-ray-audit.js";
const HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:HEADERS});
/* Admin-only Staging proof, never auto-labels bot / test or updates visitor records. */
export async function onRequestGet({request,env}){
  const token=String(env.ADMIN_TOKEN||"");
  if(!token||request.headers.get("Authorization")!==`Bearer ${token}`)
    return json({ok:false,message:"Unauthorized"},401);
  if(!rayAuditEnabled(env,request))return json({ok:false,message:"Ray debug is disabled in this deployment."},404);
  if(!env.DB)return json({ok:false,message:"D1 unavailable"},503);
  const ray=normalizeRay(new URL(request.url).searchParams.get("ray"));
  if(!ray)return json({ok:false,message:"Invalid Ray ID"},400);
  try{
    const exists=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tb_traffic_ingest_ray_audit_v1'").all();
    if(!exists.results?.length)return json({ok:true,match:"none",records:[],note:"No enabled staging ingestion has written this Ray."});
    const cutoff=new Date(Date.now()-7*86400000).toISOString();
    const result=await env.DB.prepare(`SELECT ray_id,visitor_id,visit_id,created_at,request_path
      FROM tb_traffic_ingest_ray_audit_v1 WHERE ray_id=? AND created_at>=?
      ORDER BY created_at DESC LIMIT 10`).bind(ray,cutoff).all();
    const records=result.results||[];
    return json({ok:true,match:records.length===0?"none":records.length===1?"single":"ambiguous",
      records,
      warning:"Ray ID of /api/visitor-events POST. Not the page-view GET, not a bot verdict. Ray IDs can be reused; Security Events may be sampled.",
      scope:"staging_enabled_only",retention_days:7});
  }catch(error){
    console.error("staging Ray lookup",error?.name||"D1 read error");
    return json({ok:false,message:"Không đọc được đối chiếu Ray từ môi trường thử nghiệm."},500);
  }
}
