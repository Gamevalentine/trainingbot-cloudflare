/* TRAFFIC-04: evidence annotations only, NEVER blocks traffic or alters visit/event data.
 * "Verified" means an Admin explicitly reviewed an exact visit with a cited source.
 * D1 visitor ID is NOT a Cloudflare Ray ID: aggregate WAF data cannot auto-confirm it.
 */
const HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:HEADERS});
const ID=/^[A-Za-z0-9_-]{8,80}$/;
const statuses=new Set(["verified_automated","verified_test","cleared","unresolved"]);
const methods=new Set(["cloudflare_request_log","controlled_test_run","server_request_log","other_document"]);
const baseAuth=(request,env)=>{
  const token=String(env.ADMIN_TOKEN||"");
  return token&&request.headers.get("Authorization")===`Bearer ${token}`;
};
const trim=(value,max)=>String(value??"").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,max);
async function exists(db){
  const q=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tb_traffic_visit_reviews_v1'").all();
  return Boolean(q.results?.length);
}
export async function onRequestGet({request,env}){
  if(!baseAuth(request,env))return reply({ok:false,message:"Unauthorized"},401);
  if(!env.DB)return reply({ok:false,message:"D1 unavailable"},503);
  try{
    if(!await exists(env.DB))return reply({ok:true,reviews:[],reviewed_visits:0});
    const rows=await env.DB.prepare(`SELECT r.visit_id,r.visitor_id,r.status,r.evidence_kind,
      r.evidence_ref,r.reason,r.reviewed_at FROM tb_traffic_visit_reviews_v1 r
      ORDER BY reviewed_at DESC LIMIT 200`).all();
    return reply({ok:true,reviews:rows.results||[]});
  }catch(error){console.error("review read",error);return reply({ok:false,message:"Không thể đọc bằng chứng điều tra."},500);}
}
export async function onRequestPost({request,env}){
  if(!baseAuth(request,env))return reply({ok:false,message:"Unauthorized"},401);
  const origin=new URL(request.url).origin;
  const suppliedOrigin=request.headers.get("Origin");
  if(suppliedOrigin&&suppliedOrigin!==origin)return reply({ok:false,message:"Cross-origin denied"},403);
  const fetchSite=(request.headers.get("Sec-Fetch-Site")||"").toLowerCase();
  if(fetchSite&&!["same-origin","none"].includes(fetchSite))return reply({ok:false,message:"Cross-site denied"},403);
  if(!env.DB)return reply({ok:false,message:"D1 unavailable"},503);
  if(Number(request.headers.get("content-length")||0)>4096)return reply({ok:false,message:"Too large"},413);
  if(!/application\/json/i.test(request.headers.get("content-type")||""))return reply({ok:false,message:"Expected JSON"},415);
  const body=await request.json().catch(()=>null);
  const visitorId=trim(body?.visitor_id,80),visitId=trim(body?.visit_id,80);
  const status=trim(body?.status,40),kind=trim(body?.evidence_kind,40);
  const reference=trim(body?.evidence_ref,240),reason=trim(body?.reason,500);
  if(!ID.test(visitorId)||!ID.test(visitId)||!statuses.has(status)||!methods.has(kind)
      ||reference.length<12||reason.length<20)return reply({ok:false,message:"Thiếu ID, nhãn hoặc bằng chứng cụ thể; không thể xác nhận hàng loạt."},400);
  try{
    const target=await env.DB.prepare("SELECT visitor_id FROM tb_visitor_visits_v2 WHERE visitor_id=? AND visit_id=?")
      .bind(visitorId,visitId).first();
    if(!target)return reply({ok:false,message:"Không tìm thấy đúng lượt ghé cần xác minh."},404);
    const admin=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tb_admin_browsers_v1'").all();
    if(admin.results?.length){
      const adminRow=await env.DB.prepare("SELECT visitor_id FROM tb_admin_browsers_v1 WHERE visitor_id=?").bind(visitorId).first();
      if(adminRow)return reply({ok:false,message:"Lượt ghé Admin phải giữ nhãn Admin."},409);
    }
    const now=new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS tb_traffic_visit_reviews_v1(
        visit_id TEXT PRIMARY KEY,visitor_id TEXT NOT NULL,status TEXT NOT NULL,
        evidence_kind TEXT NOT NULL,evidence_ref TEXT NOT NULL,reason TEXT NOT NULL,reviewed_at TEXT NOT NULL)`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS tb_traffic_visit_review_audit_v1(
        id INTEGER PRIMARY KEY AUTOINCREMENT,visit_id TEXT NOT NULL,visitor_id TEXT NOT NULL,status TEXT NOT NULL,
        evidence_kind TEXT NOT NULL,evidence_ref TEXT NOT NULL,reason TEXT NOT NULL,reviewed_at TEXT NOT NULL)`)
    ]);
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO tb_traffic_visit_reviews_v1
        (visit_id,visitor_id,status,evidence_kind,evidence_ref,reason,reviewed_at)
        VALUES(?,?,?,?,?,?,?) ON CONFLICT(visit_id) DO UPDATE SET
        visitor_id=excluded.visitor_id,status=excluded.status,evidence_kind=excluded.evidence_kind,
        evidence_ref=excluded.evidence_ref,reason=excluded.reason,reviewed_at=excluded.reviewed_at`)
        .bind(visitId,visitorId,status,kind,reference,reason,now),
      env.DB.prepare(`INSERT INTO tb_traffic_visit_review_audit_v1
        (visit_id,visitor_id,status,evidence_kind,evidence_ref,reason,reviewed_at)
        VALUES(?,?,?,?,?,?,?)`).bind(visitId,visitorId,status,kind,reference,reason,now)
    ]);
    return reply({ok:true,visit_id:visitId,status,reviewed_at:now});
  }catch(error){console.error("review write",error);return reply({ok:false,message:"Không thể lưu nhận xét; lịch sử gốc không bị thay đổi."},500);}
}
