const JSON_HEADERS={"content-type":"application/json; charset=UTF-8","cache-control":"no-store, max-age=0","x-content-type-options":"nosniff"};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
const SEEDS=[
  ["7681293376775277832","https://www.tiktok.com/@trainingbot.ai2/video/7681293376775277832?is_from_webapp=1&sender_device=pc","","2026-09-03T13:08:20Z"],
  ["7677790316665031957","https://www.tiktok.com/player/v1/7677790316665031957","","2026-09-01T00:00:00Z"]
];

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

export async function onRequestGet({env}){
  try{
    await ensureTable(env);
    const result=await env.DB.prepare("SELECT external_id,url,title,created_at FROM home_videos ORDER BY created_at DESC, external_id DESC").all();
    return json({ok:true,videos:result.results||[]});
  }catch(error){
    console.error("home videos",error);
    return json({ok:false,message:"Không thể tải danh sách video trang chủ."},500);
  }
}
