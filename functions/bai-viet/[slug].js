const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

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
  // Protocol-relative URLs (//host), backslashes and control bytes can turn
  // ostensibly local editorial links into untrusted cross-origin navigation.
  if(/[\u0000-\u001f\\]/.test(raw))return "";
  if(raw.startsWith("/") && !raw.startsWith("//"))return raw;
  try{
    const url=new URL(raw);
    if(url.username||url.password)return "";
    if(kind==="image" && url.protocol==="https:")return url.href;
    if(kind==="link" && (url.protocol==="https:"||url.protocol==="http:"))return url.href;
  }catch{}
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


function articleExcerpt(post){
 const text=String(post.summary||post.content||post.rich_content||"").replace(/<[^>]*>/g," ").replace(/^#{1,6}\s+/gm,"").replace(/\*\*/g,"").replace(/\s+/g," ").trim();
 if(text.length<=165)return text;
 const cut=text.slice(0,163),end=Math.max(cut.lastIndexOf(". "),cut.lastIndexOf("? "),cut.lastIndexOf("! "));
 if(end>=90)return cut.slice(0,end+1);
 const space=cut.lastIndexOf(" ");return (space>=90?cut.slice(0,space):cut)+"…";
}
function articleSources(post){
 const found=new Set(),content=String(post.content||"")+" "+String(post.rich_content||"");
 for(const raw of content.match(/https?:\/\/[^\s<>"')\]]+/g)||[]){
   try{const u=new URL(raw.replace(/[.,;]+$/,""));if((u.protocol==="https:"||u.protocol==="http:")&&!u.username&&!u.password&&u.hostname!=="trainingbot.io.vn")found.add(u.href);}catch{}
   if(found.size>=8)break;
 }
 if(!found.size)return '<section class="tb-p1-box"><h2>Nguồn tham khảo</h2><p>Chưa có liên kết nguồn trực tiếp để đối chiếu nội dung bài viết.</p></section>';
 return '<section class="tb-p1-box"><h2>Nguồn được bài viết dẫn</h2><ul>'+
 [...found].map(u=>'<li><a target="_blank" rel="noopener noreferrer nofollow" href="'+esc(u)+'">'+esc(new URL(u).hostname)+'</a></li>').join("")+
 '</ul></section>';
}
function articleRelated(rows){
 const posts=(rows||[]).filter(p=>/^[a-z0-9-]{1,110}$/.test(String(p.slug||""))).slice(0,3);
 if(!posts.length)return "";
 return '<aside class="tb-p1-box"><h2>Bài viết liên quan</h2><ul>'+
 posts.map(p=>'<li><a href="/bai-viet/'+encodeURIComponent(p.slug)+'">'+esc(p.title||"Bài viết")+'</a></li>').join("")+'</ul></aside>';
}
function editorialVersionLinks(post){
  // Only a verified older Beta article gets a cross-version reading trail.
  // Do not imply that an old test build is currently the live game version.
  if(post.slug!=="pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y")return "";
  return '<aside class="tb-p1-box" aria-label="Đọc tiếp theo phiên bản">'+
   '<h2>Đọc tiếp theo phiên bản</h2>'+
   '<p>Bài này ghi nhận thông tin ở giai đoạn Beta 1; nội dung thử nghiệm có thể thay đổi. Đối chiếu thêm nguồn và ngày đăng trước khi áp dụng cho phiên bản hiện tại.</p>'+
   '<ul><li><a href="/news-pubg-mobile-4-6-skins-events">Lịch trang phục và sự kiện PUBG Mobile 4.6 (tham khảo lịch cũ)</a></li>'+
   '<li><a href="/ban-cap-nhat">Xem trang Bản cập nhật TrainingBot</a></li>'+
   '<li><a href="/wiki">Tra cứu Wiki với nhãn xác minh theo nguồn</a></li></ul></aside>';
}
function editorialArchiveContext(post){
  // Editorial navigation is tied to known archived story slugs, not guessed releases.
  // Do not assert that earlier Beta notes are the live version.
  const links={
    "battlegrounds-mo-rong-erangel-subzero-trong-pubg-mobile-bgmi-voi-ban-beta-4-7-2":{
      note:"Bài này phản ánh thông tin được đăng về bản thử nghiệm Beta 4.7.2; chi tiết có thể thay đổi và hiện bài chưa dẫn liên kết nguồn trực tiếp. Không xem các thông số trong bài là dữ liệu đã xác minh cho phiên bản hiện hành.",
      refs:[["/bai-viet/pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y","Đọc lại thông tin Beta 4.7 giai đoạn 1"],["/wiki","Tra cứu Wiki và tình trạng xác minh dữ liệu"]]
    },
    "pubg-mobile-4-6-chinh-thuc-cap-nhat-hom-nay-midnight-hunters-da-den-tay-nguoi-choi":{
      note:"Từ 'hôm nay' trong tiêu đề đề cập ngày đăng bài 08/09/2026, không phải thời điểm hiện tại. Bài lưu lại đợt cập nhật 4.6 để người đọc đối chiếu lịch sử.",
      refs:[["/news-pubg-mobile-4-6","Đọc hướng dẫn PUBG Mobile 4.6"],["/ban-cap-nhat","Xem trang Bản cập nhật"]]
    },
    "pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam-van-cho-thong-tin":{
      note:"Trạng thái 'gần hoàn thiện' phản ánh thông tin tại thời điểm bài được đăng; bài chưa có liên kết gốc trực tiếp để xác minh ngày phát hành và khu vực áp dụng. Không xem đây là xác nhận hiệu ứng đã ra mắt tại Việt Nam.",
      refs:[["/news-featured","Xem các bài viết đã xuất bản"],["/ban-cap-nhat","Theo dõi bản cập nhật"]]
    }
  };
  const item=links[String(post.slug||"")];
  if(!item)return "";
  return '<aside class="tb-p1-box" aria-label="Bối cảnh lịch sử và bài liên quan"><h2>Bối cảnh bài viết</h2><p>'+esc(item.note)+'</p><ul>'+
    item.refs.map(([url,label])=>'<li><a href="'+esc(url)+'">'+esc(label)+'</a></li>').join("")+
    '</ul></aside>';
}
function articleHasHeading(post){
 return /<h2\b/i.test(String(post.rich_content||""))||/^##\s/m.test(String(post.content||""));
}

function page(post,related=[]){
 const excerpt=articleExcerpt(post);
  const canonical=`${ORIGIN}/bai-viet/${encodeURIComponent(post.slug)}`;
  const safeCover=safeUrl(post.cover_url,"image");
  const shareImage=absoluteUrl(safeCover,`${ORIGIN}/news-pubg-mobile-4-6-cover.webp`);
  const published=isoDate(post.published_at);
  const modified=isoDate(post.updated_at)||published;
  const cover=safeCover?`<img class="tb-cover" src="${esc(safeCover)}" alt="${esc(post.title)}">`:"";
  const graph={
    "@context":"https://schema.org",
    "@graph":[
      {"@type":"Organization","@id":ORIGIN+"/#organization","name":"TrainingBot","url":ORIGIN+"/","logo":{"@type":"ImageObject","url":ORIGIN+"/favicon.svg"}},
      {"@type":"WebSite","@id":ORIGIN+"/#website","url":ORIGIN+"/","name":"TrainingBot","publisher":{"@id":ORIGIN+"/#organization"},"inLanguage":"vi-VN"},
      {"@type":"NewsArticle","@id":canonical+"#article","mainEntityOfPage":canonical,"headline":post.title,"description":excerpt,"image":[shareImage],"datePublished":published||undefined,"dateModified":modified||undefined,"author":{"@id":ORIGIN+"/#organization"},"publisher":{"@id":ORIGIN+"/#organization"},"inLanguage":"vi-VN"}
    ]
  };
  const jsonLd=JSON.stringify(graph).replace(/</g,"\\u003c");
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${esc(excerpt)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:site_name" content="TrainingBot">
<meta property="og:locale" content="vi_VN">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(post.title)}">
<meta property="og:description" content="${esc(excerpt)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(shareImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(post.title)}">
<meta name="twitter:description" content="${esc(excerpt)}">
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
.tb-p1-box{margin:24px 0 0;padding:18px 21px;border:1px solid #32435e;background:#111b2c;border-radius:14px}.tb-p1-box h2{margin:0 0 10px;font-size:1.14rem;color:#fff}.tb-p1-box li{padding:4px 0}.tb-p1-box p{color:#acbad2}.tb-p1-box a{color:#bbcdff;text-decoration:underline;overflow-wrap:anywhere}
</style>
</head>
<body>
<header class="site-header"><div class="container header-inner"><a class="brand" href="/"><span class="brand-logo"></span><span>TRAININGBOT<small>Gaming Knowledge Hub</small></span></a><nav class="desktop-nav" aria-label="Điều hướng chính"><a class="nav-link" href="/">Trang chủ</a><a class="nav-link" href="/ban-cap-nhat">Bản cập nhật</a><a class="nav-link active" href="/news">Tin tức</a><a class="nav-link" href="/wiki">Wiki</a><a class="nav-link" href="/community">Cộng đồng</a><a class="nav-link" href="/contact">Liên hệ</a></nav><div class="header-actions"><button class="icon-button" aria-label="Tìm kiếm"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3-3"></path></svg></button><button class="menu-button" aria-label="Mở menu" aria-expanded="false"><span></span><span></span><span></span></button></div></div><nav class="mobile-nav" aria-label="Điều hướng di động"></nav></header>
<main class="tb-user-article"><article class="container tb-user-wrap"><span class="tb-user-tag">${esc(post.category)}</span><h1>${esc(post.title)}</h1><p class="tb-user-lead">${esc(excerpt)}</p><div class="tb-user-meta">${dateVi(post.published_at)} · TrainingBot</div>${cover}<div class="tb-user-story">${articleHasHeading(post)?"":"<h2>Nội dung bài viết</h2>"}${post.rich_content?sanitizeRich(post.rich_content):renderContent(post.content)}</div>${articleSources(post)}${editorialVersionLinks(post)}${editorialArchiveContext(post)}${articleRelated(related)}<a class="tb-back" href="/news">← Quay lại Tin tức</a></article></main>
<footer><div class="container footer-inner"><span>© 2026 TrainingBot.</span><div class="footer-links"><a href="/terms">Điều khoản</a><a href="/privacy">Quyền riêng tư</a></div></div></footer>
<script defer src="/navigation_v124.js?v=124"></script>
<script defer src="/header_search_v152.js?v=182"></script>
<script defer src="/visitor_tracking_v177.js?v=181"></script>
<script defer src="/footer_v135.js?v=178"></script>
</body></html>`;
}

export async function onRequestGet({env,params}){
  if(!env.DB)return new Response("Dữ liệu bài viết chưa sẵn sàng.",{status:503});
  const slug=String(params.slug||"").toLowerCase();
  if(!/^[a-z0-9-]{1,110}$/.test(slug))return new Response("Không tìm thấy bài viết.",{status:404});
  const post=await env.DB.prepare("SELECT slug,title,summary,content,rich_content,category,cover_url,published_at,updated_at FROM tb_manual_posts_v1 WHERE slug=? AND status='published' LIMIT 1").bind(slug).first();
  if(!post)return new Response("Không tìm thấy bài viết.",{status:404});
  let related=[];
  try{
    const q=await env.DB.prepare("SELECT slug,title FROM tb_manual_posts_v1 WHERE status='published' AND slug!=? AND category=? ORDER BY published_at DESC LIMIT 3").bind(slug,post.category).all();
    related=q.results||[];
  }catch(error){console.error("Related posts unavailable",error);}
  return new Response(page(post,related),{status:200,headers:{"content-type":"text/html; charset=UTF-8","cache-control":"public, max-age=30, stale-while-revalidate=120","x-content-type-options":"nosniff"}});
}
