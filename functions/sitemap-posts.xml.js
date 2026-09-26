const H={
  "content-type":"application/xml; charset=UTF-8",
  "cache-control":"public, max-age=300, stale-while-revalidate=600",
  "x-content-type-options":"nosniff"
};

const escXml=value=>String(value??"")
  .replace(/&/g,"&amp;")
  .replace(/</g,"&lt;")
  .replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;")
  .replace(/'/g,"&apos;");

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
  if(!(columns.results||[]).some(column=>column.name==="featured_at")){
    await db.prepare("ALTER TABLE tb_manual_posts_v1 ADD COLUMN featured_at TEXT NOT NULL DEFAULT ''").run();
  }
}

function isoDay(value){
  const d=new Date(value);
  return Number.isNaN(d.getTime())?"":d.toISOString().slice(0,10);
}

export async function onRequestGet({env}){
  const origin="https://trainingbot.io.vn";
  let rows=[];
  if(env.DB){
    try{
      await setup(env.DB);
      const result=await env.DB.prepare(
        "SELECT slug,updated_at,published_at FROM tb_manual_posts_v1 WHERE status='published' ORDER BY published_at DESC LIMIT 5000"
      ).all();
      rows=result.results||[];
    }catch(error){
      console.error("dynamic sitemap",error);
    }
  }

  const urls=rows
    .filter(row=>/^[a-z0-9-]{1,110}$/.test(String(row.slug||"")))
    .map(row=>{
      const loc=origin+"/bai-viet/"+encodeURIComponent(row.slug);
      const lastmod=isoDay(row.updated_at||row.published_at);
      return "  <url><loc>"+escXml(loc)+"</loc>"+(lastmod?"<lastmod>"+lastmod+"</lastmod>":"")+"</url>";
    });

  const xml=[
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    ''
  ].join("\n");

  return new Response(xml,{status:200,headers:H});
}
