const H={"content-type":"application/json; charset=UTF-8","cache-control":"public, max-age=0, must-revalidate"};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:H});

async function setup(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS tb_manual_posts_v1 (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Tin mới',
    cover_url TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'published',
    featured_at TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    published_at TEXT NOT NULL
  )`).run();
  const columns=await db.prepare("PRAGMA table_info(tb_manual_posts_v1)").all();
  if(!(columns.results||[]).some(column=>column.name==="featured_at"))await db.prepare("ALTER TABLE tb_manual_posts_v1 ADD COLUMN featured_at TEXT NOT NULL DEFAULT ''").run();
}

export async function onRequestGet({request,env}){
  if(!env.DB)return reply({ok:false,message:"Dữ liệu bài viết chưa sẵn sàng."},503);
  await setup(env.DB);
  const url=new URL(request.url);
  const limit=Math.min(100,Math.max(1,Number(url.searchParams.get("limit"))||10));
  const forSearch=url.searchParams.get("search")==="1";
  const fields=forSearch
    ? "id,slug,title,summary,category,cover_url,featured_at,published_at,substr(content,1,12000) AS content"
    : "id,slug,title,summary,category,cover_url,featured_at,published_at";
  const result=await env.DB.prepare(`SELECT ${fields} FROM tb_manual_posts_v1 WHERE status='published' ORDER BY published_at DESC LIMIT ?`).bind(limit).all();
  const posts=(result.results||[]).map(row=>({...row,url:`/bai-viet/${row.slug}`}));
  return reply({ok:true,posts});
}
