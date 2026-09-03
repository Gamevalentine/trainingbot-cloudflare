const JSON_HEADERS={"content-type":"application/json; charset=UTF-8","cache-control":"no-store, max-age=0","x-content-type-options":"nosniff"};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
const SEEDS=[
  ["7681293376775277832","https://www.tiktok.com/@trainingbot.ai2/video/7681293376775277832?is_from_webapp=1&sender_device=pc","HỢP TÁC PUBG MOBILE x LINCOLN","2026-09-03T13:08:20Z"],
  ["7680817497632820501","https://www.tiktok.com/@trainingbot.ai2/video/7680817497632820501?is_from_webapp=1&sender_device=pc","","2026-09-03T13:00:00Z"],
  ["7677790316665031957","https://www.tiktok.com/@trainingbot.ai2/video/7677790316665031957","","2026-09-01T00:00:00Z"]
];

function isAdmin(request,env){
  const expected=String(env.ADMIN_TOKEN||"");
  return !!expected && String(request.headers.get("Authorization")||"")===`Bearer ${expected}`;
}
function parseTikTok(raw){
  const value=String(raw||"").trim();
  if(!value)return null;
  try{
    const url=new URL(value);
    if(!/(^|\.)tiktok\.com$/i.test(url.hostname))return null;
    const match=url.pathname.match(/\/video\/(\d{10,25})/)||url.pathname.match(/\/player\/v1\/(\d{10,25})/);
    if(!match)return null;
    return {external_id:match[1],url:value};
  }catch{return null;}
}
function cleanText(value){
  return String(value||"")
    .replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&#x27;/g,"'")
    .replace(/&lt;/g,"<").replace(/&gt;/g,">")
    .replace(/\s+/g," ").trim()
    .replace(/\s*[|·-]\s*TikTok(?:\s|$).*$/i,"")
    .slice(0,140);
}
function canonicalUrl(raw){
  try{const u=new URL(raw);u.search="";u.hash="";return u.toString();}catch{return String(raw||"");}
}
function meta(html,key){
  const escaped=key.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const patterns=[
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`,`i`),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`,`i`)
  ];
  for(const pattern of patterns){const match=html.match(pattern);if(match?.[1])return cleanText(match[1]);}
  return "";
}
async function resolveTitle(rawUrl){
  const url=canonicalUrl(rawUrl);
  try{
    const response=await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,{headers:{accept:"application/json"}});
    if(response.ok){
      const data=await response.json();
      const title=cleanText(data?.title);
      if(title)return title;
    }
  }catch{}
  try{
    const response=await fetch(url,{headers:{"user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36","accept":"text/html,application/xhtml+xml"}});
    if(!response.ok)return "";
    const html=await response.text();
    const title=meta(html,"og:description")||meta(html,"description")||meta(html,"og:title")||cleanText((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]);
    return /^(TikTok|Make Your Day)$/i.test(title)?"":title;
  }catch{return "";}
}
async function ensureTable(env){
  if(!env.DB)throw new Error("Cloudflare D1 chưa được liên kết với Pages project.");
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS home_videos (
    external_id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`).run();
  for(const seed of SEEDS){
    await env.DB.prepare("INSERT OR IGNORE INTO home_videos(external_id,url,title,created_at) VALUES(?,?,?,?)").bind(...seed).run();
  }
}
async function list(env){
  const result=await env.DB.prepare("SELECT external_id,url,title,created_at FROM home_videos ORDER BY created_at DESC, external_id DESC").all();
  return result.results||[];
}

export async function onRequestPost({request,env}){
  if(!env.ADMIN_TOKEN)return json({ok:false,message:"ADMIN_TOKEN chưa được cấu hình."},503);
  if(!isAdmin(request,env))return json({ok:false,message:"Unauthorized"},401);
  try{
    await ensureTable(env);
    const body=await request.json().catch(()=>({}));
    const video=parseTikTok(body.url);
    if(!video)return json({ok:false,message:"Link TikTok không hợp lệ."},400);
    const suppliedTitle=cleanText(body.title);
    const title=suppliedTitle||await resolveTitle(video.url);
    const now=new Date().toISOString();
    await env.DB.prepare(`INSERT INTO home_videos(external_id,url,title,created_at) VALUES(?,?,?,?)
      ON CONFLICT(external_id) DO UPDATE SET url=excluded.url,title=excluded.title,created_at=excluded.created_at`)
      .bind(video.external_id,video.url,title,now).run();
    return json({ok:true,videos:await list(env)});
  }catch(error){
    console.error("admin home videos add",error);
    return json({ok:false,message:"Không thể thêm video trang chủ."},500);
  }
}

export async function onRequestDelete({request,env}){
  if(!env.ADMIN_TOKEN)return json({ok:false,message:"ADMIN_TOKEN chưa được cấu hình."},503);
  if(!isAdmin(request,env))return json({ok:false,message:"Unauthorized"},401);
  try{
    await ensureTable(env);
    const body=await request.json().catch(()=>({}));
    const id=String(body.external_id||"").trim();
    if(!/^\d{10,25}$/.test(id))return json({ok:false,message:"Video không hợp lệ."},400);
    await env.DB.prepare("DELETE FROM home_videos WHERE external_id=?").bind(id).run();
    return json({ok:true,videos:await list(env)});
  }catch(error){
    console.error("admin home videos delete",error);
    return json({ok:false,message:"Không thể xóa video trang chủ."},500);
  }
}
