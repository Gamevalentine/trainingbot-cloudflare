const NO_STORE={"cache-control":"no-store","x-content-type-options":"nosniff"};

function cleanText(value,max=180){
  return String(value??"").replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,max);
}

function cleanPath(value){
  let path=cleanText(value,260);
  if(!path.startsWith("/"))path="/";
  return path.split("?")[0].split("#")[0].slice(0,240)||"/";
}

function cleanReferrer(value,requestUrl){
  const raw=cleanText(value,320);
  if(!raw)return "";
  try{
    const ref=new URL(raw);
    const current=new URL(requestUrl);
    return ref.origin===current.origin?cleanPath(ref.pathname):ref.origin.slice(0,220);
  }catch{return "";}
}

function parseClient(request){
  const ua=String(request.headers.get("User-Agent")||"");
  const platform=String(request.headers.get("Sec-CH-UA-Platform")||"").replace(/"/g,"");

  let os="Khác";
  if(/iPhone|iPad|iPod/i.test(ua))os="iOS";
  else if(/Android/i.test(ua))os="Android";
  else if(/Windows NT/i.test(ua)||/Windows/i.test(platform))os="Windows";
  else if(/Mac OS X|Macintosh/i.test(ua)||/macOS/i.test(platform))os="macOS";
  else if(/Linux/i.test(ua)||/Linux/i.test(platform))os="Linux";

  let device="Máy tính";
  if(/iPhone/i.test(ua))device="iPhone";
  else if(/iPad/i.test(ua))device="iPad";
  else if(/Android/i.test(ua)){
    const model=(ua.match(/Android[^;]*;\s*([^;)]+?)(?:\s+Build\/|;|\))/i)?.[1]||"Android").trim();
    device=cleanText(model.replace(/^wv$/i,"Android"),60)||"Android";
  }else if(/Mobile/i.test(ua))device="Điện thoại";

  let browser="Khác";
  if(/Edg\//i.test(ua))browser="Edge";
  else if(/OPR\//i.test(ua))browser="Opera";
  else if(/CriOS\//i.test(ua))browser="Chrome iOS";
  else if(/Chrome\//i.test(ua))browser="Chrome";
  else if(/FxiOS\//i.test(ua))browser="Firefox iOS";
  else if(/Firefox\//i.test(ua))browser="Firefox";
  else if(/Safari\//i.test(ua))browser="Safari";

  return {os,device,browser};
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
      gender TEXT NOT NULL DEFAULT 'unknown',
      city TEXT NOT NULL DEFAULT '',
      region TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT ''
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

  const columns=await db.prepare("PRAGMA table_info(tb_visitor_sessions_v1)").all();
  const names=new Set((columns.results||[]).map(column=>column.name));
  if(!names.has("city"))await db.prepare("ALTER TABLE tb_visitor_sessions_v1 ADD COLUMN city TEXT NOT NULL DEFAULT ''").run();
  if(!names.has("region"))await db.prepare("ALTER TABLE tb_visitor_sessions_v1 ADD COLUMN region TEXT NOT NULL DEFAULT ''").run();
  if(!names.has("country"))await db.prepare("ALTER TABLE tb_visitor_sessions_v1 ADD COLUMN country TEXT NOT NULL DEFAULT ''").run();
}

export async function onRequestPost({request,env}){
  if(!env.DB)return new Response(null,{status:204,headers:NO_STORE});

  const requestUrl=new URL(request.url);
  const origin=String(request.headers.get("Origin")||"");
  if(origin&&origin!==requestUrl.origin)return new Response(null,{status:204,headers:NO_STORE});
  const fetchSite=String(request.headers.get("Sec-Fetch-Site")||"").toLowerCase();
  if(fetchSite&&!["same-origin","same-site","none"].includes(fetchSite)){
    return new Response(null,{status:204,headers:NO_STORE});
  }
  const ua=String(request.headers.get("User-Agent")||"");
  if(/bot|crawler|spider|slurp|preview|facebookexternalhit|discordbot|slackbot|telegrambot|whatsapp/i.test(ua)){
    return new Response(null,{status:204,headers:NO_STORE});
  }

  const contentLength=Number(request.headers.get("Content-Length")||0);
  if(contentLength>8192)return new Response(null,{status:204,headers:NO_STORE});

  const body=await request.json().catch(()=>null);
  if(!body||typeof body!=="object")return new Response(null,{status:204,headers:NO_STORE});

  const visitorId=cleanText(body.visitorId,80);
  const sessionId=cleanText(body.sessionId,80);
  if(!/^[A-Za-z0-9_-]{8,80}$/.test(visitorId)||!/^[A-Za-z0-9_-]{8,80}$/.test(sessionId)){
    return new Response(null,{status:204,headers:NO_STORE});
  }

  const allowed=new Set(["page_view","navigation","heartbeat"]);
  const eventType=allowed.has(body.type)?body.type:"page_view";
  const path=cleanPath(body.path);
  const target=cleanPath(body.target||path);
  const label=cleanText(body.label,100);
  const referrer=cleanReferrer(body.referrer,request.url);
  const now=new Date().toISOString();
  const client=parseClient(request);
  const cf=request.cf||{};
  const geo={
    city:cleanText(cf.city,100),
    region:cleanText(cf.region||cf.regionCode,100),
    country:cleanText(cf.country,8).toUpperCase()
  };

  try{
    await setup(env.DB);
    const statements=[
      env.DB.prepare(`INSERT INTO tb_visitor_sessions_v1
        (session_id,visitor_id,first_seen_at,last_seen_at,entry_path,current_path,referrer,device,os,browser,gender,city,region,country)
        VALUES(?,?,?,?,?,?,?,?,?,?,'unknown',?,?,?)
        ON CONFLICT(session_id) DO UPDATE SET
          last_seen_at=excluded.last_seen_at,
          current_path=excluded.current_path,
          device=excluded.device,
          os=excluded.os,
          browser=excluded.browser,
          city=CASE WHEN excluded.city<>'' THEN excluded.city ELSE city END,
          region=CASE WHEN excluded.region<>'' THEN excluded.region ELSE region END,
          country=CASE WHEN excluded.country<>'' THEN excluded.country ELSE country END`)
        .bind(sessionId,visitorId,now,now,path,path,referrer,client.device,client.os,client.browser,geo.city,geo.region,geo.country)
    ];
    if(eventType!=="heartbeat"){
      statements.push(
        env.DB.prepare(`INSERT INTO tb_visitor_events_v1
          (session_id,visitor_id,event_type,path,label,target,created_at)
          SELECT ?,?,?,?,?,?,?
          WHERE NOT EXISTS (
            SELECT 1 FROM tb_visitor_events_v1
            WHERE session_id=? AND event_type=? AND path=? AND target=?
              AND julianday(created_at)>=julianday(?,'-2 seconds')
            LIMIT 1
          )
          AND (
            SELECT COUNT(*) FROM tb_visitor_events_v1 WHERE session_id=?
          ) < 300`)
          .bind(
            sessionId,visitorId,eventType,path,label,target,now,
            sessionId,eventType,path,target,now,sessionId
          )
      );
    }
    await env.DB.batch(statements);
  }catch(error){
    console.error("visitor tracking",error);
  }

  return new Response(null,{status:204,headers:NO_STORE});
}
