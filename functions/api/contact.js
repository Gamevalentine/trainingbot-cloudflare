
const H={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:H});
const emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export async function onRequestPost({request,env}){
 const url=new URL(request.url),origin=request.headers.get("Origin");
 if(origin&&origin!==url.origin)return json({ok:false,message:"Yêu cầu sai nguồn."},403);
 if(!request.headers.get("content-type")?.startsWith("application/json"))return json({ok:false,message:"Định dạng không hỗ trợ."},415);
 if(!env.DB)return json({ok:false,message:"Biểu mẫu chưa khả dụng, vui lòng gửi email."},503);
 let d;try{const raw=await request.text();if(raw.length>8000)return json({ok:false,message:"Quá dài."},413);d=JSON.parse(raw);}catch{return json({ok:false,message:"Dữ liệu không hợp lệ."},400);}
 if(!d||typeof d!=="object"||String(d.website||"").trim())return json({ok:false,message:"Yêu cầu không hợp lệ."},400);
 const name=String(d.name||"").trim(),email=String(d.email||"").trim().toLowerCase(),subject=String(d.subject||"").trim(),message=String(d.message||"").trim();
 if(name.length<2||name.length>80||email.length>254||!emailRe.test(email)||!["Góp ý nội dung","Báo lỗi website","Liên kết tải","Hợp tác","Khác"].includes(subject)||message.length<10||message.length>4000)return json({ok:false,message:"Thông tin không hợp lệ."},400);
 try{
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS tb_contact_messages_v202 (id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,subject TEXT NOT NULL,message TEXT NOT NULL,source_hash TEXT NOT NULL,received_at TEXT NOT NULL)").run();
  const source=(request.headers.get("CF-Connecting-IP")||"unknown")+"|"+(env.CONTACT_RATE_SALT||env.ADMIN_TOKEN||"trainingbot-contact");
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(source)))).map(n=>n.toString(16).padStart(2,"0")).join("");
  const cutoff=new Date(Date.now()-1800000).toISOString();
  const count=await env.DB.prepare("SELECT COUNT(*) AS n FROM tb_contact_messages_v202 WHERE source_hash=? AND received_at>=?").bind(hash,cutoff).first();
  if(Number(count?.n||0)>=3)return json({ok:false,message:"Bạn đã gửi quá nhiều yêu cầu, vui lòng thử sau."},429);
  const id=crypto.randomUUID();
  await env.DB.prepare("INSERT INTO tb_contact_messages_v202 (id,name,email,subject,message,source_hash,received_at) VALUES (?,?,?,?,?,?,?)").bind(id,name,email,subject,message,hash,new Date().toISOString()).run();
  return json({ok:true,received:true,id:id.slice(0,8)},201);
 }catch(err){console.error("TrainingBot contact",err);return json({ok:false,message:"Hệ thống chưa lưu được yêu cầu."},503);}
}
