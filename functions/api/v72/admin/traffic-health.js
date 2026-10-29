/* TRAFFIC-05: read-only D1 visitor data health report.
 * Counters are anonymous visits, not people or confirmed bot traffic.
 * No sampling of personal IPs, no writes, no account/server secrets in output.
 */
const HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:HEADERS});
export async function onRequestGet({request,env}){
  const token=String(env.ADMIN_TOKEN||"");
  if(!token||request.headers.get("Authorization")!==`Bearer ${token}`)
    return json({ok:false,message:"Unauthorized"},401);
  if(!env.DB)return json({ok:false,message:"Cloudflare D1 unavailable"},503);
  const started=Date.now();
  try{
    const tables=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('tb_visitor_visits_v2','tb_admin_browsers_v1','tb_traffic_visit_reviews_v1','tb_visitor_events_v1')").all();
    const names=new Set((tables.results||[]).map(x=>x.name));
    if(!names.has("tb_visitor_visits_v2"))return json({ok:true,ready:false,message:"Không có bảng lượt ghé V2.",db_query_success:true,query_duration_ms:Date.now()-started},200);
    const now=Date.now();
    const iso=ms=>new Date(ms).toISOString();
    const t24=iso(now-24*60*60*1000),t48=iso(now-48*60*60*1000),t7=iso(now-7*24*60*60*1000);
    const excludeAdmin=names.has("tb_admin_browsers_v1")
      ?" AND NOT EXISTS (SELECT 1 FROM tb_admin_browsers_v1 a WHERE a.visitor_id=v.visitor_id)":"";
    const reviewJoin=names.has("tb_traffic_visit_reviews_v1")
      ?" LEFT JOIN tb_traffic_visit_reviews_v1 r ON r.visit_id=v.visit_id AND r.visitor_id=v.visitor_id":"";
    const status=names.has("tb_traffic_visit_reviews_v1")?"COALESCE(r.status,'unresolved')":"'unresolved'";
    const sql=`SELECT
      COUNT(*) AS visits_7d,
      SUM(CASE WHEN v.first_seen_at>=? THEN 1 ELSE 0 END) AS visits_24h,
      SUM(CASE WHEN v.first_seen_at>=? AND v.first_seen_at<? THEN 1 ELSE 0 END) AS visits_previous_24h,
      COUNT(DISTINCT CASE WHEN v.first_seen_at>=? THEN v.visitor_id END) AS anonymous_ids_24h,
      SUM(CASE WHEN v.first_seen_at>=? AND ${status}='verified_test' THEN 1 ELSE 0 END) AS verified_test_24h,
      SUM(CASE WHEN v.first_seen_at>=? AND ${status}='verified_automated' THEN 1 ELSE 0 END) AS verified_automated_24h,
      SUM(CASE WHEN v.first_seen_at>=? AND ${status}='cleared' THEN 1 ELSE 0 END) AS cleared_24h,
      SUM(CASE WHEN v.first_seen_at>=? AND ${status}='unresolved' THEN 1 ELSE 0 END) AS unresolved_24h,
      MAX(v.last_seen_at) AS last_seen_at
      FROM tb_visitor_visits_v2 v${reviewJoin}
      WHERE v.first_seen_at>=? ${excludeAdmin}`;
    const row=await env.DB.prepare(sql).bind(t24,t48,t24,t24,t24,t24,t24,t24,t7).first();
    const n=x=>Number(row?.[x]||0);
    const total=n("visits_24h");
    const tested=n("verified_test_24h"),automated=n("verified_automated_24h"),
      cleared=n("cleared_24h"),unresolved=n("unresolved_24h");
    if(tested+automated+cleared+unresolved!==total){
      return json({ok:false,message:"Số liệu phân loại không khớp với tổng lượt ghé; báo cáo chưa đáng tin."},500);
    }
    return json({
      ok:true,ready:true,generated_at:new Date().toISOString(),
      data_origin:"Cloudflare D1",window:"rolling_24h",db_query_success:true,
      query_duration_ms:Date.now()-started,
      counters:{
        visits_24h:total,visits_previous_24h:n("visits_previous_24h"),
        visits_7d:n("visits_7d"),anonymous_ids_24h:n("anonymous_ids_24h"),
        verified_test_24h:tested,verified_automated_24h:automated,
        cleared_24h:cleared,unresolved_24h:unresolved
      },
      last_seen_at:row?.last_seen_at||null,
      identity_note:"Mã ẩn danh không chứng minh là một người. Chưa xác minh không đồng nghĩa bot; đã bỏ nghi vấn không chứng minh là người thật.",
      performance_note:"query_duration_ms chỉ đo thời gian xử lý API/D1 của lần đọc này, không phải độ trễ người dùng hoặc Core Web Vitals.",
      security_note:"Truy vấn chỉ đọc; không chặn truy cập, không thay đổi sự kiện, lượt ghé hoặc nhãn hiện có."
    });
  }catch(error){
    console.error("traffic health read error",error);
    return json({ok:false,message:"Không đọc được thống kê D1; không sử dụng số liệu 0 để thay thế."},500);
  }
}
