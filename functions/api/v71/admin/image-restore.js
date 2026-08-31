const JSON_HEADERS = {"content-type":"application/json; charset=UTF-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
function isAdmin(request,env){const expected=String(env.ADMIN_TOKEN||"");return !!expected && String(request.headers.get("Authorization")||"")===`Bearer ${expected}`;}
function cleanTarget(raw){const value=String(raw||"").trim();if(!value.startsWith("/"))return "";const path=value.split(/[?#]/)[0];return /\.(?:png|jpe?g|webp|gif|svg|avif)$/i.test(path)?path:"";}
function keyFor(path){return `site-overrides/${encodeURIComponent(path)}`;}
export async function onRequestPost({request,env}){
  if(!env.ADMIN_TOKEN)return json({ok:false,message:"ADMIN_TOKEN chưa được cấu hình."},503);
  if(!isAdmin(request,env))return json({ok:false,message:"Unauthorized"},401);
  if(!env.VIDEO_BUCKET)return json({ok:false,message:"R2 VIDEO_BUCKET chưa được liên kết với Pages project."},503);
  try{
    const body=await request.json().catch(()=>({}));
    const target=cleanTarget(body.target);
    if(!target)return json({ok:false,message:"Đường dẫn ảnh không hợp lệ."},400);
    await env.VIDEO_BUCKET.delete(keyFor(target));
    return json({ok:true,target});
  }catch(error){console.error("image restore",error);return json({ok:false,message:"Không thể khôi phục ảnh gốc."},500);}
}