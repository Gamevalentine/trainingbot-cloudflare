const JSON_HEADERS={"content-type":"application/json; charset=UTF-8","cache-control":"no-store, max-age=0","x-content-type-options":"nosniff"};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
const SEEDS=[
  ["7681293376775277832","https://www.tiktok.com/@trainingbot.ai2/video/7681293376775277832?is_from_webapp=1&sender_device=pc","HỢP TÁC PUBG MOBILE x LINCOLN","2026-09-03T13:08:20Z"],
  ["7680817497632820501","https://www.tiktok.com/@trainingbot.ai2/video/7680817497632820501?is_from_webapp=1&sender_device=pc","","2026-09-03T13:00:00Z"],
  ["7677790316665031957","https://www.tiktok.com/@trainingbot.ai2/video/7677790316665031957","","2026-09-01T00:00:00Z"]
];

async function resolveTitle(url){
  try{
    const response=await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,{headers:{accept:"application/json"}});
    if(!response.ok)return "";
    const data=await response.json();
    return String(data?.title||"").replace(/\s+/g," ").trim().slice(0,140);
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
  await env.DB.prepare("UPDATE home_videos SET url=? WHERE external_id=? AND url LIKE '%/player/v1/%'")
    .bind(SEEDS[2][1],SEEDS[2][0]).run();
}
async function hydrateTitles(env,rows){
  return Promise.all((rows||[]).map(async item=>{
    if(String(item.title||"").trim())return item;
    const title=await resolveTitle(item.url);
    if(!title)return {...item,title:""};
    await env.DB.prepare("UPDATE home_videos SET title=? WHERE external_id=?").bind(title,item.external_id).run();
    return {...item,title};
  }));
}

export async function onRequestGet({env}){
  try{
    await ensureTable(env);
    const result=await env.DB.prepare("SELECT external_id,url,title,created_at FROM home_videos ORDER BY created_at DESC, external_id DESC").all();
    return json({ok:true,videos:await hydrateTitles(env,result.results||[])});
  }catch(error){
    console.error("home videos",error);
    return json({ok:false,message:"Không thể tải danh sách video trang chủ."},500);
  }
}
