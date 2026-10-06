const H={"content-type":"application/json; charset=UTF-8","cache-control":"no-store"};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:H});
const clean=(value,max=100000)=>String(value??"").trim().slice(0,max);
const imageKey=path=>`site-overrides/${encodeURIComponent(path)}`;

function allowed(request,env){
  const expected=String(env.ADMIN_TOKEN||"");
  return !!expected && request.headers.get("Authorization")===`Bearer ${expected}`;
}

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
  if(!names.has("featured_at"))await db.prepare("ALTER TABLE tb_manual_posts_v1 ADD COLUMN featured_at TEXT NOT NULL DEFAULT ''").run();
  if(!names.has("rich_content"))await db.prepare("ALTER TABLE tb_manual_posts_v1 ADD COLUMN rich_content TEXT NOT NULL DEFAULT ''").run();
}

function slugify(value){
  return clean(value,180).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,90)||"bai-viet";
}

function makeSummary(content){
  return String(content||"").replace(/^#{1,6}\s+/gm,"").replace(/^[-*]\s+/gm,"").replace(/\s+/g," ").trim().slice(0,220);
}

function escAttr(value){
  return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
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
    if(style)out.push(`style="${escAttr(style)}"`);
    if(tag==="img"){
      const src=safeUrl(attrs.src,"image");
      if(!src)return "";
      out.push(`src="${escAttr(src)}"`,`alt="${escAttr(attrs.alt||"")}"`,'loading="lazy"','decoding="async"');
    }else if(tag==="a"){
      const href=safeUrl(attrs.href,"link");
      if(href)out.push(`href="${escAttr(href)}"`,'target="_blank"','rel="noopener noreferrer"');
    }else if(attrs.title){
      out.push(`title="${escAttr(attrs.title)}"`);
    }
    return `<${tag}${out.length?" "+out.join(" "):""}>`;
  });
}

async function uniqueSlug(db,title){
  const base=slugify(title);
  for(let i=1;i<=99;i++){
    const slug=i===1?base:`${base}-${i}`;
    const found=await db.prepare("SELECT 1 FROM tb_manual_posts_v1 WHERE slug=? LIMIT 1").bind(slug).first();
    if(!found)return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0,8)}`;
}

export async function onRequestGet({request,env}){
  if(!env.DB)return reply({ok:false,message:"Cloudflare D1 chưa được liên kết."},503);
  if(!allowed(request,env))return reply({ok:false,message:"Unauthorized"},401);
  await setup(env.DB);
  const url=new URL(request.url);
  const id=clean(url.searchParams.get("id"),160);
  if(id){
    const post=await env.DB.prepare("SELECT id,slug,title,summary,content,rich_content,category,cover_url,status,featured_at,created_at,updated_at,published_at FROM tb_manual_posts_v1 WHERE id=? LIMIT 1").bind(id).first();
    if(!post)return reply({ok:false,message:"Không tìm thấy bài viết."},404);
    return reply({ok:true,post:{...post,url:`/bai-viet/${post.slug}`}});
  }
  const result=await env.DB.prepare("SELECT id,slug,title,summary,category,cover_url,status,featured_at,published_at,updated_at FROM tb_manual_posts_v1 ORDER BY published_at DESC LIMIT 100").all();
  return reply({ok:true,posts:(result.results||[]).map(row=>({...row,url:`/bai-viet/${row.slug}`}))});
}

export async function onRequestPost({request,env}){
  if(!env.DB)return reply({ok:false,message:"Cloudflare D1 chưa được liên kết."},503);
  if(!allowed(request,env))return reply({ok:false,message:"Unauthorized"},401);
  let body;
  try{body=await request.json()}catch{return reply({ok:false,message:"Dữ liệu bài viết không hợp lệ."},400)}
  const title=clean(body.title,180);
  const content=clean(body.content,60000);
  const richContent=sanitizeRich(body.rich_content);
  const category=clean(body.category,60)||"Tin mới";
  const summary=clean(body.summary,260)||makeSummary(content);
  const coverUrl=clean(body.cover_url,500);
  if(title.length<4)return reply({ok:false,message:"Tiêu đề quá ngắn."},400);
  if(content.length<20 && !richContent)return reply({ok:false,message:"Nội dung bài viết quá ngắn."},400);
  if(coverUrl && !coverUrl.startsWith("/"))return reply({ok:false,message:"Đường dẫn ảnh bìa không hợp lệ."},400);
  await setup(env.DB);
  const slug=await uniqueSlug(env.DB,title);
  const now=new Date().toISOString();
  const id=`tb-post-${crypto.randomUUID()}`;
  await env.DB.prepare("INSERT INTO tb_manual_posts_v1 (id,slug,title,summary,content,rich_content,category,cover_url,status,featured_at,created_at,updated_at,published_at) VALUES (?,?,?,?,?,?,?,?,'published','',?,?,?)").bind(id,slug,title,summary,content,richContent,category,coverUrl,now,now,now).run();
  return reply({ok:true,post:{id,slug,title,summary,category,cover_url:coverUrl,featured_at:"",published_at:now,url:`/bai-viet/${slug}`}},201);
}

export async function onRequestPatch({request,env}){
  if(!env.DB)return reply({ok:false,message:"Cloudflare D1 chưa được liên kết."},503);
  if(!allowed(request,env))return reply({ok:false,message:"Unauthorized"},401);
  let body;
  try{body=await request.json()}catch{return reply({ok:false,message:"Dữ liệu cập nhật không hợp lệ."},400)}
  const id=clean(body.id,160);
  if(!id)return reply({ok:false,message:"Thiếu thông tin bài viết."},400);
  await setup(env.DB);
  const post=await env.DB.prepare("SELECT id,slug,title,summary,content,rich_content,category,cover_url,featured_at,published_at FROM tb_manual_posts_v1 WHERE id=? LIMIT 1").bind(id).first();
  if(!post)return reply({ok:false,message:"Không tìm thấy bài viết."},404);

  if(typeof body.featured==="boolean"){
    const featuredAt=body.featured?new Date().toISOString():"";
    await env.DB.prepare("UPDATE tb_manual_posts_v1 SET featured_at=?,updated_at=? WHERE id=?").bind(featuredAt,new Date().toISOString(),id).run();
    if(body.featured){
      await env.DB.prepare("UPDATE tb_manual_posts_v1 SET featured_at='' WHERE featured_at<>'' AND id NOT IN (SELECT id FROM tb_manual_posts_v1 WHERE featured_at<>'' ORDER BY featured_at DESC LIMIT 3)").run();
    }
    return reply({ok:true,post:{id:post.id,slug:post.slug,title:post.title,featured_at:featuredAt,url:`/bai-viet/${post.slug}`},message:body.featured?"Đã đẩy bài lên khu Tin tức.":"Đã gỡ bài khỏi khu Tin tức."});
  }

  const title=clean(body.title,180);
  const content=clean(body.content,60000);
  const richContent=sanitizeRich(body.rich_content);
  const category=clean(body.category,60)||"Tin mới";
  const summary=clean(body.summary,260)||makeSummary(content);
  const coverUrl=clean(body.cover_url,500);
  if(title.length<4)return reply({ok:false,message:"Tiêu đề quá ngắn."},400);
  if(content.length<20 && !richContent)return reply({ok:false,message:"Nội dung bài viết quá ngắn."},400);
  if(coverUrl && !coverUrl.startsWith("/"))return reply({ok:false,message:"Đường dẫn ảnh bìa không hợp lệ."},400);

  const now=new Date().toISOString();
  await env.DB.prepare("UPDATE tb_manual_posts_v1 SET title=?,summary=?,content=?,rich_content=?,category=?,cover_url=?,updated_at=? WHERE id=?").bind(title,summary,content,richContent,category,coverUrl,now,id).run();
  return reply({ok:true,post:{id,slug:post.slug,title,summary,content,rich_content:richContent,category,cover_url:coverUrl,featured_at:post.featured_at,published_at:post.published_at,updated_at:now,url:`/bai-viet/${post.slug}`},message:"Đã lưu thay đổi bài viết."});
}

export async function onRequestDelete({request,env}){
  if(!env.DB)return reply({ok:false,message:"Cloudflare D1 chưa được liên kết."},503);
  if(!allowed(request,env))return reply({ok:false,message:"Unauthorized"},401);
  let body;
  try{body=await request.json()}catch{return reply({ok:false,message:"Dữ liệu xóa bài không hợp lệ."},400)}
  const id=clean(body.id,160);
  if(!id)return reply({ok:false,message:"Thiếu mã bài viết cần xóa."},400);
  await setup(env.DB);
  const post=await env.DB.prepare("SELECT id,slug,title,cover_url,rich_content FROM tb_manual_posts_v1 WHERE id=? LIMIT 1").bind(id).first();
  if(!post)return reply({ok:false,message:"Không tìm thấy bài viết."},404);
  const result=await env.DB.prepare("DELETE FROM tb_manual_posts_v1 WHERE id=?").bind(id).run();
  if(!result.meta?.changes)return reply({ok:false,message:"Không xóa được bài viết."},500);
  let coverDeleted=false;
  if(env.VIDEO_BUCKET && String(post.cover_url||"").startsWith("/user-posts/")){
    try{await env.VIDEO_BUCKET.delete(imageKey(post.cover_url));coverDeleted=true}catch(error){console.error("delete post cover",error)}
  }
  return reply({ok:true,deleted:{id:post.id,slug:post.slug,title:post.title,cover_deleted:coverDeleted},message:"Đã xóa bài viết."});
}
