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

// Significant public editorial updates on 2026-10-29: 1 retraction and 4 sourced article panels.
// Published D1 rows remain untouched, while sitemap lastmod must reflect the changed public HTML.
const VERIFIED_20261029_SLUGS=new Set(["battlegrounds-mo-rong-erangel-subzero-trong-pubg-mobile-bgmi-voi-ban-beta-4-7-2","pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y","pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam-van-cho-thong-tin","pubg-mobile-4-6-chinh-thuc-cap-nhat-hom-nay-midnight-hunters-da-den-tay-nguoi-choi","pubg-mobile-one-punch-man-chinh-thuc-duoc-cong-bo-saitama-do-bo-erangel-tu-ngay-20-9"]);

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
      const rawLastmod=isoDay(row.updated_at||row.published_at);
      const lastmod=VERIFIED_20261029_SLUGS.has(row.slug) && (!rawLastmod||rawLastmod<"2026-10-29")?"2026-10-29":rawLastmod;
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
