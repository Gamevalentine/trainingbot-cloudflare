const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

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
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    published_at TEXT NOT NULL
  )`).run();
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

function dateVi(value){
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return "";
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

function page(post){
  const cover=post.cover_url?`<img class="tb-cover" src="${esc(post.cover_url)}" alt="${esc(post.title)}">`:"";
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${esc(post.summary)}">
<title>${esc(post.title)} — TrainingBot</title>
<link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="/mobile_polish_v62.css?v=62">
<link rel="stylesheet" href="/brand_logo_v116.css?v=116">
<link rel="stylesheet" href="/navigation_v124.css?v=124">
<link rel="stylesheet" href="/header_search_v152.css?v=152">
<style>
.tb-user-article{padding:44px 0 72px}.tb-user-wrap{max-width:900px;margin:auto}.tb-user-tag{display:inline-flex;padding:7px 12px;border:1px solid rgba(118,92,255,.28);border-radius:999px;color:#b9b2ff;font-size:.76rem;font-weight:800}.tb-user-wrap h1{max-width:850px;margin:16px 0 12px;font-size:clamp(1.8rem,3.6vw,2.8rem);line-height:1.08;letter-spacing:-.035em}.tb-user-lead{max-width:790px;color:#b9c3d5;font-size:1rem;line-height:1.7}.tb-user-meta{margin-top:12px;color:#7f8ba3;font-size:.84rem}.tb-cover{display:block;width:100%;max-height:520px;object-fit:cover;margin:28px 0;border-radius:18px;border:1px solid rgba(148,163,184,.18)}.tb-user-story{max-width:790px;display:grid;gap:15px;color:#d9e0ee;font-size:1rem;line-height:1.82}.tb-user-story h2,.tb-user-story h3{margin:20px 0 0;color:#fff}.tb-user-story h2{font-size:1.42rem}.tb-user-story h3{font-size:1.16rem}.tb-user-story p,.tb-user-story ul{margin:0}.tb-user-story ul{padding-left:22px}.tb-back{display:inline-flex;margin-top:30px;color:#9fb0ca;font-weight:750}@media(max-width:640px){.tb-user-article{padding:30px 0 52px}.tb-cover{margin:22px 0;border-radius:14px}.tb-user-story{font-size:.96rem;line-height:1.76}}
</style>
</head>
<body>
<header class="site-header"><div class="container header-inner"><a class="brand" href="/"><span class="brand-logo"></span><span>TRAININGBOT<small>Gaming Knowledge Hub</small></span></a><nav class="desktop-nav" aria-label="Điều hướng chính"><a class="nav-link" href="/">Trang chủ</a><a class="nav-link" href="/updates">Bản cập nhật</a><a class="nav-link active" href="/news">Tin tức</a><a class="nav-link" href="/wiki">Wiki</a><a class="nav-link" href="/community">Cộng đồng</a><a class="nav-link" href="/contact">Liên hệ</a></nav><div class="header-actions"><button class="icon-button" aria-label="Tìm kiếm"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3-3"></path></svg></button><button class="menu-button" aria-label="Mở menu" aria-expanded="false"><span></span><span></span><span></span></button></div></div><nav class="mobile-nav" aria-label="Điều hướng di động"></nav></header>
<main class="tb-user-article"><article class="container tb-user-wrap"><span class="tb-user-tag">${esc(post.category)}</span><h1>${esc(post.title)}</h1><p class="tb-user-lead">${esc(post.summary)}</p><div class="tb-user-meta">${dateVi(post.published_at)} · TrainingBot</div>${cover}<div class="tb-user-story">${renderContent(post.content)}</div><a class="tb-back" href="/news">← Quay lại Tin tức</a></article></main>
<footer><div class="container footer-inner"><span>© 2026 TrainingBot.</span><div class="footer-links"><a href="/contact">Điều khoản</a><a href="/contact">Quyền riêng tư</a></div></div></footer>
<script defer src="/navigation_v124.js?v=124"></script><script defer src="/header_search_v152.js?v=152"></script>
</body></html>`;
}

export async function onRequestGet({env,params}){
  if(!env.DB)return new Response("Dữ liệu bài viết chưa sẵn sàng.",{status:503});
  await setup(env.DB);
  const slug=String(params.slug||"").toLowerCase();
  if(!/^[a-z0-9-]{1,110}$/.test(slug))return new Response("Không tìm thấy bài viết.",{status:404});
  const post=await env.DB.prepare("SELECT slug,title,summary,content,category,cover_url,published_at FROM tb_manual_posts_v1 WHERE slug=? AND status='published' LIMIT 1").bind(slug).first();
  if(!post)return new Response("Không tìm thấy bài viết.",{status:404});
  return new Response(page(post),{status:200,headers:{"content-type":"text/html; charset=UTF-8","cache-control":"public, max-age=30, stale-while-revalidate=120","x-content-type-options":"nosniff"}});
}
