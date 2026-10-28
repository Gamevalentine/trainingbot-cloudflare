/* TrainingBot anonymous audience analytics. Admin only; no IP/fingerprinting. */
const HEADERS={"content-type":"application/json; charset=UTF-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:HEADERS});
const LIMIT=50;
function permitted(request,env){
  const secret=String(env.ADMIN_TOKEN||"");
  return Boolean(secret)&&request.headers.get("Authorization")===`Bearer ${secret}`;
}
const safeInt=(value,min,max,fallback)=>{
  const n=Number(value);
  return Number.isInteger(n)?Math.max(min,Math.min(max,n)):fallback;
};

export async function onRequestGet({request,env}){
  if(!permitted(request,env))return json({ok:false,message:"Unauthorized"},401);
  if(!env.DB)return json({ok:false,message:"D1 chưa liên kết."},503);
  const url=new URL(request.url);
  const audience=["all","new","returning","unknown","admin"].includes(url.searchParams.get("audience"))?url.searchParams.get("audience"):"all";
  const rawCountry=String(url.searchParams.get("country")||"ALL").toUpperCase();
  const country=/^(?:[A-Z]{2}|ALL)$/.test(rawCountry)?rawCountry:"ALL";
  const page=safeInt(url.searchParams.get("page")||1,1,100000,1);
  const limit=safeInt(url.searchParams.get("limit")||LIMIT,10,100,LIMIT);
  try{
    // The ingestion endpoint creates v2 on the first visitor POST. Admin GET is read-only.
    const tables=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tb_visitor_visits_v2'").all();
    const tracked=Boolean(tables.results?.length);
    const adminTables=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tb_admin_browsers_v1'").all();
    const hasAdmins=Boolean(adminTables.results?.length);
    const adminSource=hasAdmins
      ? "SELECT visitor_id FROM tb_admin_browsers_v1"
      : "SELECT CAST(NULL AS TEXT) AS visitor_id WHERE 0";
    const nonAdminWhere=hasAdmins
      ? " WHERE NOT EXISTS (SELECT 1 FROM tb_admin_browsers_v1 ab WHERE ab.visitor_id=s.visitor_id)"
      : "";
    const nonAdminAnd=hasAdmins
      ? " AND NOT EXISTS (SELECT 1 FROM tb_admin_browsers_v1 ab WHERE ab.visitor_id=s.visitor_id)"
      : "";
    const visits=tracked
      ?`SELECT visitor_id,COUNT(*) AS visits,MIN(first_seen_at) AS first_tracked_at
           FROM tb_visitor_visits_v2 GROUP BY visitor_id`
      :`SELECT NULL AS visitor_id,0 AS visits,NULL AS first_tracked_at WHERE 0`;
    const grouped=`
      WITH session_groups AS (
        SELECT visitor_id,MIN(first_seen_at) AS first_seen_at,
          MAX(last_seen_at) AS last_seen_at
        FROM tb_visitor_sessions_v1 GROUP BY visitor_id
      ),
      latest AS (
        SELECT visitor_id,session_id,device,os,browser,city,region,country,current_path,
          ROW_NUMBER() OVER(PARTITION BY visitor_id ORDER BY last_seen_at DESC,session_id) AS rn
        FROM tb_visitor_sessions_v1
      ),
      country_preferred AS (
        SELECT visitor_id,country,
          ROW_NUMBER() OVER(PARTITION BY visitor_id
            ORDER BY CASE WHEN country<>'' THEN 0 ELSE 1 END,last_seen_at DESC) AS rn
        FROM tb_visitor_sessions_v1
      ),
      visit_stats AS (${visits}),
      admin_browsers AS (${adminSource}),
      profiles AS (
        SELECT g.visitor_id,g.first_seen_at,g.last_seen_at,
          l.device,l.os,l.browser,l.city,l.region,
          COALESCE(NULLIF(cp.country,''),'ZZ') AS country,
          l.current_path,l.session_id,
          COALESCE(v.visits,0) AS visit_count,
          CASE WHEN a.visitor_id IS NOT NULL THEN 1 ELSE 0 END AS is_admin,
          (SELECT COUNT(*) FROM tb_visitor_events_v1 e
             WHERE e.visitor_id=g.visitor_id AND e.event_type='page_view') AS page_views,
          CASE
            WHEN a.visitor_id IS NOT NULL THEN 'admin'
            WHEN v.visits IS NULL OR v.visits=0 THEN 'unknown'
            WHEN v.visits>1 OR julianday(v.first_tracked_at)-julianday(g.first_seen_at) > 30.0/1440 THEN 'returning'
            ELSE 'new'
          END AS visitor_type
        FROM session_groups g
        JOIN latest l ON l.visitor_id=g.visitor_id AND l.rn=1
        JOIN country_preferred cp ON cp.visitor_id=g.visitor_id AND cp.rn=1
        LEFT JOIN visit_stats v ON v.visitor_id=g.visitor_id
        LEFT JOIN admin_browsers a ON a.visitor_id=g.visitor_id
      )`;
    const clause=` WHERE (?='all' OR visitor_type=?) AND (?='ALL' OR country=?)`;
    const bindings=[audience,audience,country,country];
    const [profiles,counts,summary,countries,devices]=await Promise.all([
      env.DB.prepare(grouped+` SELECT * FROM profiles ${clause}
        ORDER BY last_seen_at DESC LIMIT ? OFFSET ?`).bind(...bindings,limit,(page-1)*limit).all(),
      env.DB.prepare(grouped+` SELECT COUNT(*) AS total,
          SUM(CASE WHEN visitor_type='new' THEN 1 ELSE 0 END) AS new_visitors,
          SUM(CASE WHEN visitor_type='returning' THEN 1 ELSE 0 END) AS returning_visitors,
          SUM(CASE WHEN visitor_type='unknown' THEN 1 ELSE 0 END) AS unknown_visitors,
          SUM(CASE WHEN visitor_type='admin' THEN 1 ELSE 0 END) AS admin_visitors
          FROM profiles ${clause}`).bind(...bindings).first(),
      env.DB.prepare(`SELECT
          COUNT(DISTINCT visitor_id) AS total_visitors,
          COUNT(DISTINCT CASE WHEN date(first_seen_at,'+7 hours')=date('now','+7 hours') THEN visitor_id END) AS today_new,
          COUNT(DISTINCT CASE WHEN date(last_seen_at,'+7 hours')=date('now','+7 hours') THEN visitor_id END) AS today_active,
          COUNT(DISTINCT CASE WHEN julianday(last_seen_at)>=julianday('now','-5 minutes') THEN visitor_id END) AS online_visitors
        FROM tb_visitor_sessions_v1 s ${nonAdminWhere}`).first(),
      env.DB.prepare(`WITH ranked AS (
          SELECT visitor_id,country,ROW_NUMBER() OVER(PARTITION BY visitor_id
            ORDER BY CASE WHEN country<>'' THEN 0 ELSE 1 END,last_seen_at DESC) AS rn
          FROM tb_visitor_sessions_v1 s ${nonAdminWhere}
        ) SELECT COALESCE(NULLIF(country,''),'ZZ') AS country,COUNT(*) AS total
          FROM ranked WHERE rn=1 GROUP BY COALESCE(NULLIF(country,''),'ZZ')
          ORDER BY total DESC,country ASC LIMIT 100`).all(),
      env.DB.prepare(`WITH ranked AS (
          SELECT visitor_id,device,os,ROW_NUMBER() OVER(PARTITION BY visitor_id
            ORDER BY last_seen_at DESC,session_id) AS rn FROM tb_visitor_sessions_v1 s ${nonAdminWhere}
        ) SELECT device,COUNT(*) AS total FROM ranked WHERE rn=1
          GROUP BY device ORDER BY total DESC,device LIMIT 20`).all()
    ]);
    return json({
      ok:true,generated_at:new Date().toISOString(),tracked_since_deployment:tracked,
      summary:{
        total_visitors:Number(summary?.total_visitors||0),
        today_new:Number(summary?.today_new||0),
        today_active:Number(summary?.today_active||0),
        online_visitors:Number(summary?.online_visitors||0),
        filtered_visitors:Number(counts?.total||0),
        new_visitors:Number(counts?.new_visitors||0),
        returning_visitors:Number(counts?.returning_visitors||0),
        unknown_visitors:Number(counts?.unknown_visitors||0),
        admin_visitors:Number(counts?.admin_visitors||0)
      },
      countries:countries.results||[],devices:devices.results||[],
      page,limit,has_more:(page*limit)<Number(counts?.total||0),
      visitors:profiles.results||[]
    });
  }catch(error){
    console.error("visitor audience analytics",error);
    return json({ok:false,message:"Không đọc được thống kê khách; không được suy diễn thành 0."},500);
  }
}
