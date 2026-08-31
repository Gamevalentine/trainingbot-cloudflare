const JSON_HEADERS={"content-type":"application/json; charset=UTF-8","cache-control":"no-store, max-age=0","x-content-type-options":"nosniff"};
function json(data,status=200,extra={}){return new Response(JSON.stringify(data),{status,headers:{...JSON_HEADERS,...extra}})}
function text(v,max=5000){return String(v??"").trim().slice(0,max)}
function tokenFrom(request){const a=request.headers.get("Authorization")||"";const m=a.match(/^Bearer\s+(.+)$/i);return text(m?.[1]||request.headers.get("X-Admin-Token"),500)}
function equal(a,b){const l=new TextEncoder().encode(String(a||"")),r=new TextEncoder().encode(String(b||""));let d=l.length^r.length;for(let i=0,n=Math.max(l.length,r.length);i<n;i++)d|=(l[i]||0)^(r[i]||0);return d===0}
function requireAdmin(request,env){if(!env.ADMIN_TOKEN)return json({ok:false,message:"Chưa cấu hình ADMIN_TOKEN trên Cloudflare Pages."},503);const supplied=tokenFrom(request);if(!supplied||!equal(supplied,env.ADMIN_TOKEN))return json({ok:false,message:"Mật khẩu quản trị không đúng."},401,{"www-authenticate":'Bearer realm="TrainingBot Admin"'});return null}
const STATUSES=new Set(["active","suspended"]);
export async function onRequestGet({request,env}){
  try{
    if(!env.DB)return json({ok:false,message:"Cloudflare D1 chưa được liên kết với Pages project."},503);
    const denied=requireAdmin(request,env);if(denied)return denied;
    const url=new URL(request.url);const search=text(url.searchParams.get("search"),120).toLowerCase();const status=text(url.searchParams.get("status"),20);const method=text(url.searchParams.get("method"),30);const limit=Math.max(1,Math.min(Number.parseInt(url.searchParams.get("limit")||"200",10)||200,500));
    const conditions=[],binds=[];
    if(search){conditions.push("(LOWER(display_name) LIKE ? OR LOWER(username) LIKE ? OR LOWER(email) LIKE ?)");const like=`%${search}%`;binds.push(like,like,like)}
    if(STATUSES.has(status)){conditions.push("status = ?");binds.push(status)}
    if(["email","google","discord","apple"].includes(method)){conditions.push("registration_method = ?");binds.push(method)}
    const where=conditions.length?`WHERE ${conditions.join(" AND ")}`:"";
    const users=env.DB.prepare(`SELECT id,display_name,username,email,gender,registration_method,status,password_algorithm,registered_device,registered_os,registered_browser,created_at,updated_at,last_login_at,last_seen_at FROM users_v49 ${where} ORDER BY created_at DESC LIMIT ?`).bind(...binds,limit);
    const dayAgo=new Date(Date.now()-86400000).toISOString(),weekAgo=new Date(Date.now()-604800000).toISOString(),today=new Date();today.setHours(0,0,0,0);
    const [u,total,d,w,n,devices]=await env.DB.batch([users,env.DB.prepare("SELECT COUNT(*) AS count FROM users_v49"),env.DB.prepare("SELECT COUNT(*) AS count FROM users_v49 WHERE last_seen_at >= ?").bind(dayAgo),env.DB.prepare("SELECT COUNT(*) AS count FROM users_v49 WHERE last_seen_at >= ?").bind(weekAgo),env.DB.prepare("SELECT COUNT(*) AS count FROM users_v49 WHERE created_at >= ?").bind(today.toISOString()),env.DB.prepare("SELECT registered_device AS label,COUNT(*) AS count FROM users_v49 GROUP BY registered_device ORDER BY count DESC LIMIT 8")]);
    return json({ok:true,users:u.results||[],stats:{total:Number(total.results?.[0]?.count||0),active_24h:Number(d.results?.[0]?.count||0),active_7d:Number(w.results?.[0]?.count||0),new_today:Number(n.results?.[0]?.count||0)},devices:devices.results||[]});
  }catch(error){console.error("TrainingBot admin users API",error);return json({ok:false,message:"Máy chủ Cloudflare gặp lỗi.",error:String(error?.message||error)},500)}
}
export async function onRequest(){return json({ok:false,message:"Method not allowed."},405,{allow:"GET"})}
