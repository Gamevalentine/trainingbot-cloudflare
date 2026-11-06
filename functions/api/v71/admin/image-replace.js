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
    const allowed=new Set(["image/png","image/jpeg","image/webp","image/gif","image/avif","image/svg+xml"]);
    if(!allowed.has(type))return json({ok:false,message:"Định dạng ảnh không được hỗ trợ. Hỗ trợ PNG, JPG, WebP, GIF, AVIF, SVG."},415);
    const size=Number(file.size||0);
    if(size<=0)return json({ok:false,message:"Ảnh không có dữ liệu."},400);
    if(size>12*1024*1024)return json({ok:false,message:"Ảnh vượt quá 12 MB."},413);
    const key=keyFor(target);
    // A File.stream() from multipart FormData is not guaranteed to have a known
    // length. R2Bucket.put rejects unknown-length streams in production.
    // Buffering is bounded by the 12 MB limit above; filenames are not used as keys.
    const bytes=await file.arrayBuffer();
    if(bytes.byteLength!==size)return json({ok:false,message:"Dữ liệu ảnh nhận được chưa đầy đủ."},400);
    const stored=await env.VIDEO_BUCKET.put(key,bytes,{
      httpMetadata:{contentType:type,cacheControl:"public, max-age=0, must-revalidate"},
      // Store the original Unicode filename as ASCII-safe percent encoding.
      customMetadata:{targetPath:target,originalName:encodeURIComponent(String(file.name||"image")).slice(0,512),updatedAt:new Date().toISOString()}
    });
    if(!stored)throw new Error("R2 put returned null");
    return json({ok:true,target,key,url:target});
  }catch(error){
    console.error("image replace",error);
    return json({ok:false,message:"Không thể lưu ảnh mới lên R2."},500);
  }
}