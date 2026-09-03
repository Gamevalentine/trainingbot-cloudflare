const JSON_HEADERS={"content-type":"application/json; charset=UTF-8","cache-control":"no-store, max-age=0","x-content-type-options":"nosniff"};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
const SEEDS=[
  ["7681293376775277832","https://www.tiktok.com/@trainingbot.ai2/video/7681293376775277832?is_from_webapp=1&sender_device=pc","HỢP TÁC PUBG MOBILE x LINCOLN","2026-09-03T13:08:20Z"],
  ["7680817497632820501","https://www.tiktok.com/@trainingbot.ai2/video/7680817497632820501?is_from_webapp=1&sender_device=pc","","2026-09-03T13:00:00Z"],
  ["7677790316665031957","https://www.tiktok.com/@trainingbot.ai2/video/7677790316665031957","","2026-09-01T00:00:00Z"]
];

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
