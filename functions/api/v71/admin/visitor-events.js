const H={"content-type":"application/json; charset=UTF-8","cache-control":"no-store, max-age=0","x-content-type-options":"nosniff"};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:H});

function allowed(request,env){
  const expected=String(env.ADMIN_TOKEN||"");
  return !!expected&&String(request.headers.get("Authorization")||"")===`Bearer ${expected}`;
}

async function setup(db){
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS tb_visitor_sessions_v1 (
      session_id TEXT PRIMARY KEY,
      visitor_id TEXT NOT NULL,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      entry_path TEXT NOT NULL,
      current_path TEXT NOT NULL,
      referrer TEXT NOT NULL DEFAULT '',
      device TEXT NOT NULL DEFAULT 'Khác',
      os TEXT NOT NULL DEFAULT 'Khác',
      browser TEXT NOT NULL DEFAULT 'Khác',
      gender TEXT NOT NULL DEFAULT 'unknown'
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS tb_visitor_events_v1 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      path TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT '',
      target TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_tb_visitor_sessions_last_seen ON tb_visitor_sessions_v1(last_seen_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_tb_visitor_sessions_visitor ON tb_visitor_sessions_v1(visitor_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_tb_visitor_events_session ON tb_visitor_events_v1(session_id,created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_tb_visitor_events_created ON tb_visitor_events_v1(created_at DESC)")
  ]);
}

export async function onRequestGet({request,env}){
  if(!env.DB)return reply({ok:false,message:"Cloudflare D1 chưa được liên kết."},503);
  if(!allowed(request,env))return reply({ok:false,message:"Unauthorized"},401);

  try{
    await setup(env.DB);
    const url=new URL(request.url);
    const limit=Math.min(Math.max(Number(url.searchParams.get("limit")||120),25),200);

    const [sessions,today,online,devices,oses,browsers]=await Promise.all([
      env.DB.prepare(`SELECT session_id,visitor_id,first_seen_at,last_seen_at,entry_path,current_path,referrer,device,os,browser,gender
        FROM tb_visitor_sessions_v1 ORDER BY last_seen_at DESC LIMIT ?`).bind(limit).all(),
      env.DB.prepare(`SELECT COUNT(*) AS sessions,COUNT(DISTINCT visitor_id) AS visitors
        FROM tb_visitor_sessions_v1
        WHERE date(first_seen_at,'+7 hours')=date('now','+7 hours')`).first(),
      env.DB.prepare(`SELECT COUNT(*) AS sessions,COUNT(DISTINCT visitor_id) AS visitors
        FROM tb_visitor_sessions_v1
        WHERE julianday(last_seen_at)>=julianday('now','-5 minutes')`).first(),
      env.DB.prepare(`SELECT device,COUNT(*) AS total FROM tb_visitor_sessions_v1
        GROUP BY device ORDER BY total DESC,device LIMIT 8`).all(),
      env.DB.prepare(`SELECT os,COUNT(*) AS total FROM tb_visitor_sessions_v1
        GROUP BY os ORDER BY total DESC,os LIMIT 8`).all(),
      env.DB.prepare(`SELECT browser,COUNT(*) AS total FROM tb_visitor_sessions_v1
        GROUP BY browser ORDER BY total DESC,browser LIMIT 8`).all()
    ]);

    const rows=sessions.results||[];
    let events=[];
    if(rows.length){
      const placeholders=rows.map(()=>"?").join(",");
      const result=await env.DB.prepare(`SELECT session_id,event_type,path,label,target,created_at
        FROM tb_visitor_events_v1
        WHERE session_id IN (${placeholders})
        ORDER BY created_at ASC,id ASC`).bind(...rows.map(row=>row.session_id)).all();
      events=result.results||[];
    }

    const bySession=new Map();
    for(const event of events){
      const list=bySession.get(event.session_id)||[];
      list.push(event);
      bySession.set(event.session_id,list);
    }

    return reply({
      ok:true,
      generated_at:new Date().toISOString(),
      summary:{
        today_sessions:Number(today?.sessions||0),
        today_visitors:Number(today?.visitors||0),
        online_sessions:Number(online?.sessions||0),
        online_visitors:Number(online?.visitors||0)
      },
      devices:devices.results||[],
      oses:oses.results||[],
      browsers:browsers.results||[],
      sessions:rows.map(row=>({...row,events:bySession.get(row.session_id)||[]}))
    });
  }catch(error){
    console.error("admin visitor tracking",error);
    return reply({ok:false,message:"Không thể tải dữ liệu truy cập."},500);
  }
}
