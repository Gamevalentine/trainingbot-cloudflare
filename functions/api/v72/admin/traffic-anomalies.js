/* Read-only, evidence-led review of traffic bursts. NOT a bot detector or a security verdict.
 * Uses only anonymous existing D1 visit/event metadata; never stores IP/fingerprints.
 */
const HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const respond=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:HEADERS});
const int=(value,fallback,min,max)=>{
  const parsed=Number(value);
  return Number.isInteger(parsed)?Math.max(min,Math.min(max,parsed)):fallback;
};
function reviewGroup(group){
  const visits=Number(group.visits||0);
  const visitors=Number(group.visitors||0);
  const single=Number(group.single_page_visits||0);
  const unknown=Number(group.missing_source_visits||0);
  const historical=Number(group.legacy_visits||0);
  const noEvidence=Math.min(visits,unknown+historical);
  const singleRatio=visits?single/visits:0;
  const unknownRatio=visits?noEvidence/visits:0;
  const flags=[];
  if(visitors>=3)flags.push(`${visitors} mã khách trong cùng cửa sổ 5 phút`);
  if(singleRatio>=0.7)flags.push(`${single}/${visits} lượt gắn với mã khách chỉ có ≤1 lần xem trang`);
  if(unknownRatio>=0.7)flags.push(`${noEvidence}/${visits} lượt thiếu bằng chứng nguồn (gồm dữ liệu cũ)`);
  if(historical)flags.push(`${historical} lượt cũ chưa đo nguồn theo V3`);
  // "priority" refers to investigation priority, NEVER bot probability.
  const priority=visitors>=10&&singleRatio>=0.8&&unknownRatio>=0.8?"priority":
    visitors>=3&&singleRatio>=0.7&&unknownRatio>=0.7?"review":"observe";
  return {
    ...group,visits,visitors,single_page_visits:single,
    missing_source_visits:unknown,legacy_visits:historical,
    priority,reasons:flags
  };
}

export async function onRequestGet({request,env}){
  const secret=String(env.ADMIN_TOKEN||"");
  if(!secret||request.headers.get("Authorization")!==`Bearer ${secret}`)
    return respond({ok:false,message:"Unauthorized"},401);
  if(!env.DB)return respond({ok:false,message:"Cloudflare D1 chưa kết nối."},503);
  try{
    const u=new URL(request.url);
    const days=[1,7].includes(Number(u.searchParams.get("days")))?Number(u.searchParams.get("days")):1;
    const threshold=int(u.searchParams.get("min_visitors"),3,3,20);
    const desired=String(u.searchParams.get("country")||"ALL").toUpperCase();
    const country=/^(ALL|[A-Z]{2})$/.test(desired)?desired:"ALL";
    const schema=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tb_visitor_visits_v2'").all();
    if(!schema.results?.length){
      return respond({ok:true,ready:false,groups:[],scanned_window_days:days,bot_score_available:false,
        message:"Chưa có bảng thống kê lượt ghé."});
    }
    const adminSchema=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tb_admin_browsers_v1'").all();
    const noAdmin=adminSchema.results?.length
      ?" AND NOT EXISTS (SELECT 1 FROM tb_admin_browsers_v1 a WHERE a.visitor_id=v.visitor_id)":"";
    const attr=await env.DB.prepare("PRAGMA table_info(tb_visitor_visits_v2)").all();
    const cols=new Set((attr.results||[]).map(x=>x.name));
    const sourceLegacy=cols.has("attribution_version")
      ?"SUM(CASE WHEN v.attribution_version=0 THEN 1 ELSE 0 END)"
      :"COUNT(*)";
    const missingSource=cols.has("source_key")
      ?"SUM(CASE WHEN v.attribution_version=1 AND v.source_key='unknown' THEN 1 ELSE 0 END)"
      :"0";
    const sql=`
      WITH recent AS (
        SELECT v.visitor_id,v.visit_id,v.first_seen_at,
          COALESCE(NULLIF(v.country,''),'ZZ') AS country,
          COALESCE(NULLIF(v.device,''),'Khác') AS device,
          COALESCE(NULLIF(v.os,''),'Khác') AS os,
          COALESCE(NULLIF(v.browser,''),'Khác') AS browser,
          COALESCE(NULLIF(v.entry_path,''),'/') AS entry_path,
          (strftime('%Y-%m-%dT%H:',v.first_seen_at) ||
            printf('%02d',(CAST(strftime('%M',v.first_seen_at) AS INTEGER)/5)*5) || ':00Z') AS window_start,
          (SELECT COUNT(*) FROM tb_visitor_events_v1 e
             WHERE e.visitor_id=v.visitor_id AND e.event_type='page_view') AS visitor_page_views,
          ${cols.has("attribution_version")?"v.attribution_version AS attribution_version":"0 AS attribution_version"},
          ${cols.has("source_key")?"v.source_key AS source_key":"'' AS source_key"}
        FROM tb_visitor_visits_v2 v
        WHERE julianday(v.first_seen_at)>=julianday('now',?)
          AND (?='ALL' OR v.country=?) ${noAdmin}
      )
      SELECT window_start,country,device,os,browser,entry_path,
        COUNT(*) AS visits,COUNT(DISTINCT visitor_id) AS visitors,
        SUM(CASE WHEN visitor_page_views<=1 THEN 1 ELSE 0 END) AS single_page_visits,
        ${sourceLegacy.replaceAll("v.","")} AS legacy_visits,
        ${missingSource.replaceAll("v.","")} AS missing_source_visits
      FROM recent
      WHERE window_start IS NOT NULL
      GROUP BY window_start,country,device,os,browser,entry_path
      HAVING COUNT(DISTINCT visitor_id)>=?
      ORDER BY visitors DESC,window_start DESC
      LIMIT 40`;
    // All visit buckets are counted, not only the 40 shown in the table.
    // This is a provisional review split, NOT a human-vs-bot classification.
    const groupSQL=sql.slice(0,sql.lastIndexOf("      HAVING COUNT(DISTINCT visitor_id)>=?"));
    const reviewCase=`visitors>=${threshold} AND
      single_page_visits*10>=visits*7 AND
      (missing_source_visits+legacy_visits)*10>=visits*7`;
    const summarySQL=`SELECT
      COALESCE(SUM(visits),0) AS total_visits,
      COALESCE(SUM(CASE WHEN ${reviewCase} THEN visits ELSE 0 END),0) AS review_visits
      FROM (${groupSQL})`;
    const [result,rollup]=await Promise.all([
      env.DB.prepare(sql).bind(`-${days} day`,country,country,threshold).all(),
      env.DB.prepare(summarySQL).bind(`-${days} day`,country,country).first()
    ]);
    const groups=(result.results||[]).map(reviewGroup);
    const totalVisits=Number(rollup?.total_visits||0);
    const reviewVisits=Number(rollup?.review_visits||0);
    return respond({
      ok:true,ready:true,generated_at:new Date().toISOString(),
      scanned_window_days:days,window_minutes:5,min_visitors:threshold,country,
      groups,returned_groups:groups.length,limited_to:40,
      review_summary:{
        total_visits:totalVisits,
        review_visits:reviewVisits,
        unflagged_visits:Math.max(0,totalVisits-reviewVisits),
        basis:"visit_not_human",
        explanation:"Chỉ là lượt ghé trong khoảng thời gian đã chọn. Cần kiểm tra không có nghĩa bot; chưa bị gắn cờ không có nghĩa người thật."
      },
      bot_score_available:false,
      bot_score_note:"D1 hiện không có Cloudflare Bot Score hoặc kết quả WAF đối chiếu. Chưa thể xác nhận đây là bot.",
      method_note:"Nhóm các mã khách ẩn danh có chung quốc gia, thiết bị, hệ điều hành, trình duyệt, trang đầu và khoảng thời gian 5 phút. Mức ưu tiên là gợi ý điều tra, không phải xác suất bot. Không tự động chặn hoặc xóa dữ liệu."
    });
  }catch(error){
    console.error("traffic anomaly audit",error);
    return respond({ok:false,message:"Không đọc được dữ liệu phân tích bất thường, không hiển thị kết quả giả."},500);
  }
}
