const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

async function setup(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS tb_manual_posts_v1 (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    rich_content TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Tin mới',
    cover_url TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'published',
    featured_at TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    published_at TEXT NOT NULL
  )`).run();
  const columns=await db.prepare("PRAGMA table_info(tb_manual_posts_v1)").all();
  const names=new Set((columns.results||[]).map(column=>column.name));
  if(!names.has("featured_at")){
    await db.prepare("ALTER TABLE tb_manual_posts_v1 ADD COLUMN featured_at TEXT NOT NULL DEFAULT ''").run();
  }
  if(!names.has("rich_content")){
    await db.prepare("ALTER TABLE tb_manual_posts_v1 ADD COLUMN rich_content TEXT NOT NULL DEFAULT ''").run();
  }
}

function inline(value){
  return esc(value).replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
}

function renderContent(source){
  const lines=String(source||"").replace(/\r/g,"").split("\n");
  const out=[];
  let paragraph=[];
  let list=[];
  const flushParagraph=()=>{if(paragraph.length){out.push(`<p>${paragraph.map(inline).join("<br>")}</p>`);paragraph=[];}};
  const flushList=()=>{if(list.length){out.push(`<ul>${list.map(item=>`<li>${inline(item)}</li>`).join("")}</ul>`);list=[];}};
  for(const raw of lines){
    const line=raw.trim();
    if(!line){flushParagraph();flushList();continue;}
    if(line.startsWith("### ")){flushParagraph();flushList();out.push(`<h3>${inline(line.slice(4))}</h3>`);continue;}
    if(line.startsWith("## ")){flushParagraph();flushList();out.push(`<h2>${inline(line.slice(3))}</h2>`);continue;}
    if(line.startsWith("- ")||line.startsWith("* ")){flushParagraph();list.push(line.slice(2));continue;}
    flushList();paragraph.push(line);
  }
  flushParagraph();flushList();
  return out.join("\n");
}

function safeUrl(value,kind="link"){
  const raw=String(value||"").trim();
  if(!raw)return "";
  if(raw.startsWith("/"))return raw.replace(/[\u0000-\u001f]/g,"");
  if(kind==="image" && /^https:\/\//i.test(raw))return raw;
  if(kind==="link" && /^https?:\/\//i.test(raw))return raw;
  return "";
}
function safeFontFamily(value){
  const key=String(value||"").replace(/["']/g,"").trim().toLowerCase();
  const fonts={
    "segoe ui":'"Segoe UI",Arial,sans-serif',
    "arial":"Arial,sans-serif",
    "arial black":'"Arial Black","Segoe UI Black",Arial,sans-serif',
    "georgia":"Georgia,serif",
    "tahoma":"Tahoma,Arial,sans-serif",
    "verdana":"Verdana,Arial,sans-serif",
    "trebuchet ms":'"Trebuchet MS",Arial,sans-serif',
    "times new roman":'"Times New Roman",serif'
  };
  return fonts[key]||"";
}
function safeStyle(value,tag){
  const out=[];
  for(const raw of String(value||"").split(";")){
    const [name,...rest]=raw.split(":");
    const prop=String(name||"").trim().toLowerCase();
    const val=rest.join(":").trim().toLowerCase();
    if(!prop||!val)continue;
    if(prop==="font-size" && /^(?:1[0-9]|[2-6][0-9]|7[0-2])px$/.test(val) && ["span","p","h2","h3","h4","li","blockquote"].includes(tag))out.push(`font-size:${val}`);
    if(prop==="font-family" && ["span","p","h2","h3","h4","li","blockquote"].includes(tag)){
      const family=safeFontFamily(val);if(family)out.push(`font-family:${family}`);
    }
    if(prop==="text-align" && /^(left|center|right)$/.test(val) && ["p","h2","h3","h4","blockquote","figure"].includes(tag))out.push(`text-align:${val}`);
    if(prop==="width" && /^(?:[1-9]|[1-9][0-9]|100)%$/.test(val) && tag==="img")out.push(`width:${val}`);
  }
  return out.join(";");
}
function sanitizeRich(input){
  let html=String(input||"").slice(0,120000);
  html=html.replace(/<!--([\s\S]*?)-->/g,"");
  html=html.replace(/<(script|style|iframe|object|embed|svg|math|form|button|input|textarea|select|option)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,"");
  html=html.replace(/<(script|style|iframe|object|embed|svg|math|form|button|input|textarea|select|option)\b[^>]*\/?>/gi,"");
  const allowed=new Set(["p","br","h2","h3","h4","strong","b","em","i","u","s","ul","ol","li","blockquote","span","img","figure","figcaption","a","hr"]);
  return html.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g,(full,rawTag,rawAttrs)=>{
    const tag=String(rawTag||"").toLowerCase();
    if(!allowed.has(tag))return "";
    if(/^<\//.test(full))return `</${tag}>`;
    if(tag==="br"||tag==="hr")return `<${tag}>`;
    const attrs={};
    String(rawAttrs||"").replace(/([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+))/g,(_,name,a,b,c)=>{
      attrs[String(name||"").toLowerCase()]=a??b??c??"";
      return "";
    });
    const out=[];
    const style=safeStyle(attrs.style,tag);
    if(style)out.push(`style="${esc(style)}"`);
    if(tag==="img"){
      const src=safeUrl(attrs.src,"image");
      if(!src)return "";
      out.push(`src="${esc(src)}"`,`alt="${esc(attrs.alt||"")}"`,'loading="lazy"','decoding="async"');
    }else if(tag==="a"){
      const href=safeUrl(attrs.href,"link");
      if(href)out.push(`href="${esc(href)}"`,'target="_blank"','rel="noopener noreferrer"');
    }else if(attrs.title){
      out.push(`title="${esc(attrs.title)}"`);
    }
    return `<${tag}${out.length?" "+out.join(" "):""}>`;
  });
}

function dateVi(value){
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return "";
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

const ORIGIN="https://trainingbot.io.vn";
function absoluteUrl(value,fallback=""){
  try{
    const url=new URL(String(value||fallback),ORIGIN);
    return /^https?:$/.test(url.protocol)?url.href:fallback;
  }catch{return fallback;}
}
function isoDate(value){
  const d=new Date(value);
  return Number.isNaN(d.getTime())?"":d.toISOString();
}

function page(post){
  const canonical=`${ORIGIN}/bai-viet/${encodeURIComponent(post.slug)}`;
  const shareImage=absoluteUrl(post.cover_url,`${ORIGIN}/news-pubg-mobile-4-6-cover.webp`);
  const published=isoDate(post.published_at);
  const modified=isoDate(post.updated_at)||published;
  const cover=post.cover_url?`<img class="tb-cover" src="${esc(post.cover_url)}" alt="${esc(post.title)}">`:"";
  const graph={
    "@context":"https://schema.org",
    "@graph":[
      {"@type":"Organization","@id":ORIGIN+"/#organization","name":"TrainingBot","url":ORIGIN+"/","logo":{"@type":"ImageObject","url":ORIGIN+"/favicon.svg"}},
      {"@type":"WebSite","@id":ORIGIN+"/#website","url":ORIGIN+"/","name":"TrainingBot","publisher":{"@id":ORIGIN+"/#organization"},"inLanguage":"vi-VN"},
      {"@type":"NewsArticle","@id":canonical+"#article","mainEntityOfPage":canonical,"headline":post.title,"description":post.summary||"","image":[shareImage],"datePublished":published||undefined,"dateModified":modified||undefined,"author":{"@id":ORIGIN+"/#organization"},"publisher":{"@id":ORIGIN+"/#organization"},"inLanguage":"vi-VN"}
    ]
  };
  const jsonLd=JSON.stringify(graph).replace(/</g,"\\u003c");
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${esc(post.summary)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:site_name" content="TrainingBot">
<meta property="og:locale" content="vi_VN">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(post.title)}">
<meta property="og:description" content="${esc(post.summary)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(shareImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(post.title)}">
<meta name="twitter:description" content="${esc(post.summary)}">
<meta name="twitter:image" content="${esc(shareImage)}">
${published?`<meta property="article:published_time" content="${esc(published)}">`:""}
${modified?`<meta property="article:modified_time" content="${esc(modified)}">`:""}
<title>${esc(post.title)} — TrainingBot</title>
<script type="application/ld+json">${jsonLd}</script>
<link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="/mobile_polish_v62.css?v=62">
<link rel="stylesheet" href="/brand_logo_v116.css?v=116">
<link rel="stylesheet" href="/navigation_v124.css?v=124">
<link rel="stylesheet" href="/header_search_v152.css?v=152">
<style>
.tb-user-article{padding:44px 0 72px}.tb-user-wrap{max-width:900px;margin:auto}.tb-user-tag{display:inline-flex;padding:7px 12px;border:1px solid rgba(118,92,255,.28);border-radius:999px;color:#b9b2ff;font-size:.76rem;font-weight:800}.tb-user-wrap h1{max-width:850px;margin:16px 0 12px;font-size:clamp(1.8rem,3.6vw,2.8rem);line-height:1.08;letter-spacing:-.035em}.tb-user-lead{max-width:790px;color:#b9c3d5;font-size:1rem;line-height:1.7}.tb-user-meta{margin-top:12px;color:#7f8ba3;font-size:.84rem}.tb-cover{display:block;width:100%;max-height:520px;object-fit:cover;margin:28px 0;border-radius:18px;border:1px solid rgba(148,163,184,.18)}.tb-user-story{max-width:790px;display:grid;gap:15px;color:#d9e0ee;font-family:"Segoe UI",Tahoma,Arial,sans-serif;font-size:1rem;font-weight:400;line-height:1.82}.tb-user-story h2,.tb-user-story h3,.tb-user-story h4{color:#fff;font-family:"Arial Black","Segoe UI Black","Segoe UI",Arial,sans-serif;font-weight:900;line-height:1.2;letter-spacing:-.025em}.tb-user-story h2{margin:42px 0 16px;padding:13px 16px 14px 18px;border-left:4px solid #765cff;border-radius:0 12px 12px 0;background:linear-gradient(90deg,rgba(118,92,255,.16),rgba(118,92,255,.035) 72%,transparent);box-shadow:inset 0 0 0 1px rgba(118,92,255,.08);font-size:clamp(1.85rem,3.35vw,2.35rem)}.tb-user-story h3{margin:32px 0 11px;padding-left:13px;border-left:3px solid rgba(42,203,234,.72);font-size:clamp(1.46rem,2.45vw,1.82rem)}.tb-user-story h4{margin:25px 0 8px;font-size:1.23rem}.tb-user-story strong,.tb-user-story b{color:#fff;font-family:"Segoe UI Semibold","Segoe UI",Arial,sans-serif;font-weight:800}.tb-user-story p,.tb-user-story ul,.tb-user-story ol,.tb-user-story blockquote,.tb-user-story figure{margin:0}.tb-user-story ul,.tb-user-story ol{padding-left:24px}.tb-user-story blockquote{padding:12px 16px;border-left:3px solid rgba(116,92,255,.8);background:rgba(116,92,255,.08);border-radius:10px}.tb-user-story figure{display:grid;justify-items:center;gap:8px}.tb-user-story img{display:block;max-width:100%;height:auto;border-radius:14px}.tb-user-story figcaption{color:#8d9ab0;font-size:.82rem;text-align:center}.tb-back{display:inline-flex;margin-top:30px;color:#9fb0ca;font-weight:750}@media(max-width:640px){.tb-user-article{padding:30px 0 52px}.tb-cover{margin:22px 0;border-radius:14px}.tb-user-story{font-size:.96rem;line-height:1.76}.tb-user-story h2{margin-top:34px;padding:11px 12px 12px 14px;font-size:1.62rem}.tb-user-story h3{margin-top:27px;font-size:1.32rem}}
</style>
</head>
<body>
<header class="site-header"><div class="container header-inner"><a class="brand" href="/"><span class="brand-logo"></span><span>TRAININGBOT<small>Gaming Knowledge Hub</small></span></a><nav class="desktop-nav" aria-label="Điều hướng chính"><a class="nav-link" href="/">Trang chủ</a><a class="nav-link" href="/ban-cap-nhat">Bản cập nhật</a><a class="nav-link active" href="/news">Tin tức</a><a class="nav-link" href="/wiki">Wiki</a><a class="nav-link" href="/community">Cộng đồng</a><a class="nav-link" href="/contact">Liên hệ</a></nav><div class="header-actions"><button class="icon-button" aria-label="Tìm kiếm"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3-3"></path></svg></button><button class="menu-button" aria-label="Mở menu" aria-expanded="false"><span></span><span></span><span></span></button></div></div><nav class="mobile-nav" aria-label="Điều hướng di động"></nav></header>
<main class="tb-user-article"><article class="container tb-user-wrap"><span class="tb-user-tag">${esc(post.category)}</span><h1>${esc(post.title)}</h1><p class="tb-user-lead">${esc(post.summary)}</p><div class="tb-user-meta">${dateVi(post.published_at)} · TrainingBot</div>${cover}<div class="tb-user-story">${post.rich_content?sanitizeRich(post.rich_content):renderContent(post.content)}</div><a class="tb-back" href="/news">← Quay lại Tin tức</a></article></main>
<footer><div class="container footer-inner"><span>© 2026 TrainingBot.</span><div class="footer-links"><a href="/contact">Điều khoản</a><a href="/contact">Quyền riêng tư</a></div></div></footer>
<script defer src="/navigation_v124.js?v=124"></script>
<script defer src="/header_search_v152.js?v=182"></script>
<script defer src="/visitor_tracking_v177.js?v=181"></script>
<script defer src="/footer_v135.js?v=178"></script>
</body></html>`;
}

export async function onRequestGet({env,params}){
  if(!env.DB)return new Response("Dữ liệu bài viết chưa sẵn sàng.",{status:503});
  await setup(env.DB);
  const slug=String(params.slug||"").toLowerCase();
  if(!/^[a-z0-9-]{1,110}$/.test(slug))return new Response("Không tìm thấy bài viết.",{status:404});
  const post=await env.DB.prepare("SELECT slug,title,summary,content,rich_content,category,cover_url,published_at,updated_at FROM tb_manual_posts_v1 WHERE slug=? AND status='published' LIMIT 1").bind(slug).first();
  if(!post)return new Response("Không tìm thấy bài viết.",{status:404});
  return new Response(page(post),{status:200,headers:{"content-type":"text/html; charset=UTF-8","cache-control":"public, max-age=30, stale-while-revalidate=120","x-content-type-options":"nosniff"}});
}
