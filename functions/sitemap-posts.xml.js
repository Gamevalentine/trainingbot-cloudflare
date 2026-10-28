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

function isoDay(value){
  const d=new Date(value);
  return Number.isNaN(d.getTime())?"":d.toISOString().slice(0,10);
}

export async function onRequestGet({env}){
  const origin="https://trainingbot.io.vn";
  let rows=[];
  if(env.DB){
    try{
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
