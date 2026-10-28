/* Authenticated, read-only attribution. No guesses about Direct, bot or real human identity. */
const H={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:H});
const int=(v,defaultValue,lo,hi)=>{const n=Number(v);return Number.isInteger(n)?Math.max(lo,Math.min(hi,n)):defaultValue;};
export async function onRequestGet({request,env}){
  const secret=String(env.ADMIN_TOKEN||"");
  if(!secret||request.headers.get("Authorization")!==`Bearer ${secret}`)return reply({ok:false,message:"Unauthorized"},401);
  if(!env.DB)return reply({ok:false,message:"Chưa có D1."},503);
  try{
    const schema=await env.DB.prepare("PRAGMA table_info(tb_visitor_visits_v2)").all();
    const fields=new Set((schema.results||[]).map(x=>x.name));
    if(!fields.has("source_key")||!fields.has("attribution_version")){
      return reply({ok:true,ready:false,message:"Chưa ghi lượt ghé nào với cơ chế nguồn truy cập mới.",sources:[],visits:[],legacy_referrers:[],total:0,page:1,has_more:false});
    }
    const uri=new URL(request.url);
    const wantedSource=String(uri.searchParams.get("source")||"all").toLowerCase();
    const source=/^[a-z0-9._-]{1,64}$/.test(wantedSource)?wantedSource:"all";
    const wantedCountry=String(uri.searchParams.get("country")||"ALL").toUpperCase();
    const country=/^(?:ALL|[A-Z]{2})$/.test(wantedCountry)?wantedCountry:"ALL";
    const activity=["all","single_page"].includes(uri.searchParams.get("activity"))?uri.searchParams.get("activity"):"all";
    const page=int(uri.searchParams.get("page"),1,1,10000);
    const limit=int(uri.searchParams.get("limit"),30,10,50);
    const admin=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tb_admin_browsers_v1'").all();
    const adminExclude=admin.results?.length
      ?" AND NOT EXISTS (SELECT 1 FROM tb_admin_browsers_v1 a WHERE a.visitor_id=v.visitor_id)"
      :"";
    const visitorPages=`(SELECT COUNT(*) FROM tb_visitor_events_v1 e WHERE e.visitor_id=v.visitor_id AND e.event_type='page_view')`;
    const cte=`WITH attributed AS (
      SELECT v.visitor_id,v.visit_id,v.first_seen_at,v.last_seen_at,v.entry_path,v.current_path,
        v.country,v.device,v.os,v.browser,v.referrer,
        v.source_key,v.source_label,v.source_channel,v.source_evidence,
        v.utm_source,v.utm_medium,v.utm_campaign,v.utm_term,v.utm_content,
        ${visitorPages} AS visitor_page_views
      FROM tb_visitor_visits_v2 v WHERE v.attribution_version=1${adminExclude}
    )`;
    const where=` WHERE (?='all' OR source_key=?) AND (?='ALL' OR country=?)
      AND (?='all' OR visitor_page_views<=1)`;
    const args=[source,source,country,country,activity];
    const [sources,rows,count,legacy,legacyReferrers,countries]=await Promise.all([
      env.DB.prepare(cte+` SELECT source_key,source_label,source_channel,source_evidence,
         COUNT(*) AS visits,COUNT(DISTINCT visitor_id) AS visitors
         FROM attributed GROUP BY source_key,source_label,source_channel,source_evidence
         ORDER BY visits DESC,source_label LIMIT 80`).all(),
      env.DB.prepare(cte+` SELECT * FROM attributed ${where}
         ORDER BY first_seen_at DESC,visit_id DESC LIMIT ? OFFSET ?`).bind(...args,limit,(page-1)*limit).all(),
      env.DB.prepare(cte+` SELECT COUNT(*) AS total FROM attributed ${where}`).bind(...args).first(),
      env.DB.prepare(`SELECT COUNT(*) AS total FROM tb_visitor_visits_v2 WHERE attribution_version=0`).first(),
      env.DB.prepare(`SELECT s.referrer,COUNT(DISTINCT s.visitor_id) AS visitors
         FROM tb_visitor_sessions_v1 s
         WHERE s.referrer LIKE 'http%' ${admin.results?.length?"AND NOT EXISTS (SELECT 1 FROM tb_admin_browsers_v1 a WHERE a.visitor_id=s.visitor_id)":""}
         GROUP BY s.referrer ORDER BY visitors DESC LIMIT 20`).all(),
      env.DB.prepare(cte+` SELECT country,COUNT(*) AS visits FROM attributed
        GROUP BY country ORDER BY visits DESC,country LIMIT 100`).all()
    ]);
    return reply({
      ok:true,ready:true,generated_at:new Date().toISOString(),
      note:"Nguồn UTM là thông tin do URL khai báo; referrer có thể bị trình duyệt ẩn. Không rõ nguồn không đồng nghĩa truy cập trực tiếp.",
      sources:sources.results||[],visits:rows.results||[],countries:countries.results||[],legacy_referrers:legacyReferrers.results||[],
      legacy_visit_count:Number(legacy?.total||0),
      total:Number(count?.total||0),page,has_more:page*limit<Number(count?.total||0)
    });
  }catch(error){
    console.error("traffic sources admin",error);
    return reply({ok:false,message:"Không đọc được nguồn truy cập; không suy diễn thành số 0."},500);
  }
}
