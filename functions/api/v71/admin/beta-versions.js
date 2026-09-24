const H={"content-type":"application/json; charset=UTF-8","cache-control":"no-store, max-age=0","x-content-type-options":"nosniff"};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:H});

const SEEDS=[
  ["beta-v4-6-1","V4.6.1","V4.6","x64","released","http://k.gjacky.com/1375135419/230/apkupdate/4.6.1.21395/1375135419_230_4.6.1.21395_20260801175229_459046313_apkupdate.apk","2026-08-01T10:52:29Z"],
  ["beta-v4-6-2","V4.6.2","V4.6","x64","released","http://k.gjacky.com/1375135419/230/apkupdate/4.6.2.21415/1375135419_230_4.6.2.21415_20260807154052_1447578134_apkupdate.apk","2026-08-07T08:40:52Z"],
  ["beta-v4-6-3","V4.6.3","V4.6","x64","released","http://k.gjacky.com/1375135419/230/apkupdate/4.6.3.21435/1375135419_230_4.6.3.21435_20260814163305_39475866_apkupdate.apk","2026-08-14T09:33:05Z"],
  ["beta-v4-6-4","V4.6.4","V4.6","x64","released","http://k.gjacky.com/1375135419/230/apkupdate/4.6.4.21455/1375135419_230_4.6.4.21455_20260824160548_128024679_apkupdate.apk","2026-08-24T09:05:48Z"],
  ["beta-v4-7-1","V4.7.1","V4.7","x64","released","http://k.gjacky.com/1375135419/230/apkupdate/4.7.1.21595/1375135419_230_4.7.1.21595_20260924155659_1189713074_apkupdate.apk","2026-09-24T08:56:59Z"],
  ["beta-v4-7-2","V4.7.2","V4.7","x64","coming_soon","","2026-09-24T09:00:00Z"],
  ["beta-v4-7-3","V4.7.3","V4.7","x64","coming_soon","","2026-09-24T09:00:01Z"],
  ["beta-v4-7-4","V4.7.4","V4.7","x64","coming_soon","","2026-09-24T09:00:02Z"]
];

function allowed(request,env){
  const expected=String(env.ADMIN_TOKEN||"");
  return !!expected && String(request.headers.get("Authorization")||"")===`Bearer ${expected}`;
}
async function setup(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS tb_beta_versions_v1 (
    id TEXT PRIMARY KEY,
    version TEXT NOT NULL UNIQUE,
    major TEXT NOT NULL,
    arch TEXT NOT NULL DEFAULT 'x64',
    status TEXT NOT NULL DEFAULT 'coming_soon',
    download_url TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`).run();
  const count=await db.prepare("SELECT COUNT(*) AS n FROM tb_beta_versions_v1").first();
  if(Number(count?.n||0)===0){
    for(const seed of SEEDS){
      await db.prepare("INSERT INTO tb_beta_versions_v1(id,version,major,arch,status,download_url,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)")
        .bind(seed[0],seed[1],seed[2],seed[3],seed[4],seed[5],seed[6],seed[6]).run();
    }
  }
}
function parseVersion(value){
  const m=String(value||"").trim().toUpperCase().match(/^V?(\d+)\.(\d+)\.(\d+)$/);
  if(!m)return null;
  return {version:`V${Number(m[1])}.${Number(m[2])}.${Number(m[3])}`,major:`V${Number(m[1])}.${Number(m[2])}`};
}
function cleanArch(value){return String(value||"x64").trim().slice(0,20)||"x64";}
function validUrl(value){
  const s=String(value||"").trim();
  if(!s)return "";
  try{
    const u=new URL(s);
    return /^https?:$/.test(u.protocol)?u.toString():"";
  }catch{return "";}
}
function parts(value){
  const m=String(value||"").toUpperCase().match(/^V(\d+)\.(\d+)\.(\d+)$/);
  return m?[Number(m[1]),Number(m[2]),Number(m[3])]:[0,0,0];
}
function sortRows(rows){
  return [...rows].sort((a,b)=>{
    const A=parts(a.version),B=parts(b.version);
    return B[0]-A[0]||B[1]-A[1]||B[2]-A[2];
  });
}
async function list(db){
  const result=await db.prepare("SELECT id,version,major,arch,status,download_url,created_at,updated_at FROM tb_beta_versions_v1").all();
  return sortRows(result.results||[]);
}
function normalizedBody(body){
  const pv=parseVersion(body.version);
  if(!pv)return {error:"Phiên bản phải có dạng V4.8.1."};
  const status=body.status==="released"?"released":"coming_soon";
  const url=validUrl(body.download_url);
  if(status==="released"&&!url)return {error:"Phiên bản đã phát hành cần có link tải HTTP/HTTPS hợp lệ."};
  return {...pv,arch:cleanArch(body.arch),status,download_url:status==="released"?url:""};
}

export async function onRequestGet({request,env}){
  if(!env.DB)return reply({ok:false,message:"Cloudflare D1 chưa được liên kết."},503);
  if(!allowed(request,env))return reply({ok:false,message:"Unauthorized"},401);
  try{
    await setup(env.DB);
    return reply({ok:true,versions:await list(env.DB)});
  }catch(error){
    console.error("admin beta versions get",error);
    return reply({ok:false,message:"Không thể tải danh sách phiên bản beta."},500);
  }
}

export async function onRequestPost({request,env}){
  if(!env.DB)return reply({ok:false,message:"Cloudflare D1 chưa được liên kết."},503);
  if(!allowed(request,env))return reply({ok:false,message:"Unauthorized"},401);
  try{
    await setup(env.DB);
    const body=await request.json().catch(()=>({}));
    const v=normalizedBody(body);
    if(v.error)return reply({ok:false,message:v.error},400);
    const exists=await env.DB.prepare("SELECT id FROM tb_beta_versions_v1 WHERE version=? LIMIT 1").bind(v.version).first();
    if(exists)return reply({ok:false,message:"Phiên bản này đã tồn tại. Hãy bấm Sửa thay vì thêm mới."},409);
    const now=new Date().toISOString();
    const id=`beta-${crypto.randomUUID()}`;
    await env.DB.prepare("INSERT INTO tb_beta_versions_v1(id,version,major,arch,status,download_url,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)")
      .bind(id,v.version,v.major,v.arch,v.status,v.download_url,now,now).run();
    return reply({ok:true,version:{id,...v,created_at:now,updated_at:now},versions:await list(env.DB)},201);
  }catch(error){
    console.error("admin beta versions add",error);
    return reply({ok:false,message:"Không thể thêm phiên bản beta."},500);
  }
}

export async function onRequestPatch({request,env}){
  if(!env.DB)return reply({ok:false,message:"Cloudflare D1 chưa được liên kết."},503);
  if(!allowed(request,env))return reply({ok:false,message:"Unauthorized"},401);
  try{
    await setup(env.DB);
    const body=await request.json().catch(()=>({}));
    const id=String(body.id||"").trim();
    if(!id)return reply({ok:false,message:"Thiếu mã phiên bản cần sửa."},400);
    const current=await env.DB.prepare("SELECT id FROM tb_beta_versions_v1 WHERE id=? LIMIT 1").bind(id).first();
    if(!current)return reply({ok:false,message:"Không tìm thấy phiên bản cần sửa."},404);
    const v=normalizedBody(body);
    if(v.error)return reply({ok:false,message:v.error},400);
    const duplicate=await env.DB.prepare("SELECT id FROM tb_beta_versions_v1 WHERE version=? AND id<>? LIMIT 1").bind(v.version,id).first();
    if(duplicate)return reply({ok:false,message:"Tên phiên bản này đang được dùng bởi một mục khác."},409);
    const now=new Date().toISOString();
    await env.DB.prepare("UPDATE tb_beta_versions_v1 SET version=?,major=?,arch=?,status=?,download_url=?,updated_at=? WHERE id=?")
      .bind(v.version,v.major,v.arch,v.status,v.download_url,now,id).run();
    return reply({ok:true,version:{id,...v,updated_at:now},versions:await list(env.DB)});
  }catch(error){
    console.error("admin beta versions update",error);
    return reply({ok:false,message:"Không thể cập nhật phiên bản beta."},500);
  }
}

export async function onRequestDelete({request,env}){
  if(!env.DB)return reply({ok:false,message:"Cloudflare D1 chưa được liên kết."},503);
  if(!allowed(request,env))return reply({ok:false,message:"Unauthorized"},401);
  try{
    await setup(env.DB);
    const body=await request.json().catch(()=>({}));
    const id=String(body.id||"").trim();
    if(!id)return reply({ok:false,message:"Thiếu mã phiên bản cần xóa."},400);
    const result=await env.DB.prepare("DELETE FROM tb_beta_versions_v1 WHERE id=?").bind(id).run();
    if(!result.meta?.changes)return reply({ok:false,message:"Không tìm thấy phiên bản cần xóa."},404);
    return reply({ok:true,versions:await list(env.DB)});
  }catch(error){
    console.error("admin beta versions delete",error);
    return reply({ok:false,message:"Không thể xóa phiên bản beta."},500);
  }
}
