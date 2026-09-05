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

function slugify(value){
  return clean(value,180).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,90)||"bai-viet";
}

function makeSummary(content){
  return content.replace(/^#{1,6}\s+/gm,"").replace(/^[-*]\s+/gm,"").replace(/\s+/g," ").trim().slice(0,220);
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
  const result=await env.DB.prepare("SELECT id,slug,title,summary,category,cover_url,status,featured_at,published_at FROM tb_manual_posts_v1 ORDER BY published_at DESC LIMIT 100").all();
  return reply({ok:true,posts:(result.results||[]).map(row=>({...row,url:`/bai-viet/${row.slug}`}))});
}

export async function onRequestPost({request,env}){
  if(!env.DB)return reply({ok:false,message:"Cloudflare D1 chưa được liên kết."},503);
  if(!allowed(request,env))return reply({ok:false,message:"Unauthorized"},401);
  let body;
  try{body=await request.json()}catch{return reply({ok:false,message:"Dữ liệu bài viết không hợp lệ."},400)}
  const title=clean(body.title,180);
  const content=clean(body.content,60000);
  const category=clean(body.category,60)||"Tin mới";
  const summary=clean(body.summary,260)||makeSummary(content);
  const coverUrl=clean(body.cover_url,500);
  if(title.length<4)return reply({ok:false,message:"Tiêu đề quá ngắn."},400);
  if(content.length<20)return reply({ok:false,message:"Nội dung bài viết quá ngắn."},400);
  if(coverUrl && !coverUrl.startsWith("/"))return reply({ok:false,message:"Đường dẫn ảnh bìa không hợp lệ."},400);
  await setup(env.DB);
  const slug=await uniqueSlug(env.DB,title);
  const now=new Date().toISOString();
  const id=`tb-post-${crypto.randomUUID()}`;
  await env.DB.prepare("INSERT INTO tb_manual_posts_v1 (id,slug,title,summary,content,category,cover_url,status,featured_at,created_at,updated_at,published_at) VALUES (?,?,?,?,?,?,?,'published','',?,?,?)").bind(id,slug,title,summary,content,category,coverUrl,now,now,now).run();
  return reply({ok:true,post:{id,slug,title,summary,category,cover_url:coverUrl,featured_at:"",published_at:now,url:`/bai-viet/${slug}`}},201);
}

export async function onRequestPatch({request,env}){
  if(!env.DB)return reply({ok:false,message:"Cloudflare D1 chưa được liên kết."},503);
  if(!allowed(request,env))return reply({ok:false,message:"Unauthorized"},401);
  let body;
  try{body=await request.json()}catch{return reply({ok:false,message:"Dữ liệu cập nhật không hợp lệ."},400)}
  const id=clean(body.id,160);
  if(!id||typeof body.featured!=="boolean")return reply({ok:false,message:"Thiếu thông tin bài viết hoặc trạng thái nổi bật."},400);
  await setup(env.DB);
  const post=await env.DB.prepare("SELECT id,slug,title FROM tb_manual_posts_v1 WHERE id=? LIMIT 1").bind(id).first();
  if(!post)return reply({ok:false,message:"Không tìm thấy bài viết."},404);
  const featuredAt=body.featured?new Date().toISOString():"";
  await env.DB.prepare("UPDATE tb_manual_posts_v1 SET featured_at=?,updated_at=? WHERE id=?").bind(featuredAt,new Date().toISOString(),id).run();
  if(body.featured){
    await env.DB.prepare("UPDATE tb_manual_posts_v1 SET featured_at='' WHERE featured_at<>'' AND id NOT IN (SELECT id FROM tb_manual_posts_v1 WHERE featured_at<>'' ORDER BY featured_at DESC LIMIT 3)").run();
  }
  return reply({ok:true,post:{...post,featured_at:featuredAt,url:`/bai-viet/${post.slug}`},message:body.featured?"Đã đẩy bài lên khu Tin tức.":"Đã gỡ bài khỏi khu Tin tức."});
}

export async function onRequestDelete({request,env}){
  if(!env.DB)return reply({ok:false,message:"Cloudflare D1 chưa được liên kết."},503);
  if(!allowed(request,env))return reply({ok:false,message:"Unauthorized"},401);
  let body;
  try{body=await request.json()}catch{return reply({ok:false,message:"Dữ liệu xóa bài không hợp lệ."},400)}
  const id=clean(body.id,160);
  if(!id)return reply({ok:false,message:"Thiếu mã bài viết cần xóa."},400);
  await setup(env.DB);
  const post=await env.DB.prepare("SELECT id,slug,title,cover_url FROM tb_manual_posts_v1 WHERE id=? LIMIT 1").bind(id).first();
  if(!post)return reply({ok:false,message:"Không tìm thấy bài viết."},404);
  const result=await env.DB.prepare("DELETE FROM tb_manual_posts_v1 WHERE id=?").bind(id).run();
  if(!result.meta?.changes)return reply({ok:false,message:"Không xóa được bài viết."},500);
  let coverDeleted=false;
  if(env.VIDEO_BUCKET && String(post.cover_url||"").startsWith("/user-posts/")){
    try{await env.VIDEO_BUCKET.delete(imageKey(post.cover_url));coverDeleted=true}catch(error){console.error("delete post cover",error)}
  }
  return reply({ok:true,deleted:{id:post.id,slug:post.slug,title:post.title,cover_deleted:coverDeleted},message:"Đã xóa bài viết."});
}
