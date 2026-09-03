const JSON_HEADERS={"content-type":"application/json; charset=UTF-8","cache-control":"no-store, max-age=0","x-content-type-options":"nosniff"};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
const SEEDS=[
  ["7681293376775277832","https://www.tiktok.com/@trainingbot.ai2/video/7681293376775277832?is_from_webapp=1&sender_device=pc","","2026-09-03T13:08:20Z"],
  ["7677790316665031957","https://www.tiktok.com/player/v1/7677790316665031957","","2026-09-01T00:00:00Z"]
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
async function ensureTable(env){
  if(!env.DB)throw new Error("Cloudflare D1 chưa được liên kết với Pages project.");
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS home_videos (
    external_id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`).run();
  const row=await env.DB.prepare("SELECT COUNT(*) AS total FROM home_videos").first();
  if(Number(row?.total||0)===0){
    for(const seed of SEEDS){
      await env.DB.prepare("INSERT OR IGNORE INTO home_videos(external_id,url,title,created_at) VALUES(?,?,?,?)").bind(...seed).run();
    }
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
    const title=String(body.title||"").trim().slice(0,120);
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
