const JSON_HEADERS = {"content-type":"application/json; charset=UTF-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});

function isAdmin(request,env){
  const expected=String(env.ADMIN_TOKEN||"");
  const auth=String(request.headers.get("Authorization")||"");
  return !!expected && auth===`Bearer ${expected}`;
}
function cleanTarget(raw){
  const value=String(raw||"").trim();
  if(!value.startsWith("/"))return "";
  const path=value.split(/[?#]/)[0];
  if(!/\.(?:png|jpe?g|webp|gif|svg|avif)$/i.test(path))return "";
  return path;
}
function keyFor(path){return `site-overrides/${encodeURIComponent(path)}`;}

export async function onRequestPost({request,env}){
  if(!env.ADMIN_TOKEN)return json({ok:false,message:"ADMIN_TOKEN chưa được cấu hình."},503);
  if(!isAdmin(request,env))return json({ok:false,message:"Unauthorized"},401);
  if(!env.VIDEO_BUCKET)return json({ok:false,message:"R2 VIDEO_BUCKET chưa được liên kết với Pages project."},503);
  try{
    const form=await request.formData();
    const target=cleanTarget(form.get("target"));
    const file=form.get("file");
    if(!target)return json({ok:false,message:"Đường dẫn ảnh cần thay không hợp lệ."},400);
    if(!file || typeof file.stream!=="function")return json({ok:false,message:"Không nhận được file ảnh."},400);
    const type=String(file.type||"").toLowerCase();
    if(!type.startsWith("image/"))return json({ok:false,message:"File được chọn không phải ảnh."},400);
    if(Number(file.size||0)>12*1024*1024)return json({ok:false,message:"Ảnh vượt quá 12 MB."},413);
    const key=keyFor(target);
    await env.VIDEO_BUCKET.put(key,file.stream(),{
      httpMetadata:{contentType:type||"application/octet-stream",cacheControl:"public, max-age=0, must-revalidate"},
      customMetadata:{targetPath:target,originalName:String(file.name||"image").slice(0,160),updatedAt:new Date().toISOString()}
    });
    return json({ok:true,target,key,url:target});
  }catch(error){
    console.error("image replace",error);
    return json({ok:false,message:"Không thể lưu ảnh mới lên R2."},500);
  }
}