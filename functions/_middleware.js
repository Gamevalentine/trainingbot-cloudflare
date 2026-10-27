const IMAGE_PATH=/\.(?:png|jpe?g|webp|gif|svg|avif)$/i;
function keyFor(path){return `site-overrides/${encodeURIComponent(path)}`;}

/*
 * Pages Preview has no production D1 binding. Only read-only PUBLIC content is
 * mirrored from the live public website, with no cookies, authorization or
 * mutable operations. Production and the canonical pages.dev host are excluded.
 * Admin, uploads, POST/PATCH/DELETE and download counters remain isolated.
 */
const PUBLIC_READ_PATHS = new Set([
  "/api/beta-versions",
  "/api/beta-download-counts",
  "/api/flash-download-counts",
  "/api/home-videos",
  "/api/posts",
  "/api/team-finder"
]);
const ARTICLE_PATH = new RegExp("^/bai-viet/[a-zA-Z0-9][a-zA-Z0-9-]{0,180}$");
const PUBLIC_POST_IMAGE = new RegExp("^/user-posts/[a-zA-Z0-9._-]+[.](?:png|jpe?g|webp|gif|avif)$","i");
function isTrainingBotPreview(hostname){
  return hostname.endsWith(".trainingbot-cloudflare.pages.dev");
}
async function previewPublicReadOnly({request},url){
  if(request.method!=="GET" || !isTrainingBotPreview(url.hostname))return null;
  const path=url.pathname;
  const isApi=PUBLIC_READ_PATHS.has(path);
  const isArticle=ARTICLE_PATH.test(path);
  const isImage=PUBLIC_POST_IMAGE.test(path);
  if(!isApi && !isArticle && !isImage)return null;

  const target=new URL(path, "https://trainingbot.io.vn");
  if(path==="/api/team-finder"){
    for(const key of ["server","rank","mode","play_time","language","needed","mic","q","sort"]){
      const value=url.searchParams.get(key);
      if(value!==null)target.searchParams.set(key,value.slice(0,100));
    }
  }
  if(path==="/api/posts"){
    // Only the public query parameters already supported by this endpoint.
    for(const key of ["limit","search"]){
      const value=url.searchParams.get(key);
      if(value!==null)target.searchParams.set(key,value);
    }
  }
  try{
    const response=await fetch(target.toString(),{
      method:"GET",
      headers:{Accept:isApi?"application/json":isArticle?"text/html":"image/*"},
      redirect:"follow"
    });
    if(!response.ok)throw new Error("Public origin returned "+response.status);
    const headers=new Headers();
    headers.set("content-type",response.headers.get("content-type") ||
      (isApi?"application/json; charset=utf-8":isArticle?"text/html; charset=utf-8":"application/octet-stream"));
    headers.set("cache-control","no-store");
    headers.set("x-content-type-options","nosniff");
    headers.set("x-robots-tag","noindex, nofollow");
    return new Response(response.body,{status:200,headers});
  }catch(error){
    console.error("TrainingBot preview public GET unavailable",path,error);
    return new Response(isApi?JSON.stringify({ok:false,message:"Không thể đọc dữ liệu công khai. Vui lòng thử lại."}):"Dữ liệu công khai tạm thời không khả dụng.",{
      status:503,headers:{
        "content-type":isApi?"application/json; charset=utf-8":"text/plain; charset=utf-8",
        "cache-control":"no-store","x-content-type-options":"nosniff"
      }
    });
  }
}

export async function onRequest(context){
  const {request,env}=context;
  const url=new URL(request.url);

  /*
   * P3.1 hard isolation: a Preview must never send mutations to D1, R2 or
   * legacy upstream routes, even if someone later attaches production bindings
   * or enables API secrets for this Pages environment by mistake.
   *
   * GET /api/* is allowlisted for public read-through only. All other API
   * routes (including versioned admin/legacy fallbacks) are denied. Pages
   * Production/custom domain and the canonical pages.dev host are unaffected.
   */
  if(isTrainingBotPreview(url.hostname)){
    const apiPath=url.pathname.startsWith("/api/");
    if(!["GET","HEAD"].includes(request.method) ||
       (apiPath&&(request.method!=="GET"||!PUBLIC_READ_PATHS.has(url.pathname)))){
      return new Response(JSON.stringify({
        ok:false,message:"Bản Preview chỉ cho phép đọc dữ liệu công khai."
      }),{
        status:403,headers:{
          "content-type":"application/json; charset=utf-8",
          "cache-control":"no-store",
          "x-content-type-options":"nosniff",
          "x-robots-tag":"noindex, nofollow"
        }
      });
    }
  }
  // Preview has no D1: an explicit download opens the canonical public endpoint.
  // No credentials are forwarded, and no background count is created.
  if(isTrainingBotPreview(url.hostname)&&["GET","HEAD"].includes(request.method)&&
    (/^\/download\/beta\/V\d+\.\d+\.\d+$/i.test(url.pathname)||
     /^\/download\/flash-v4-(?:6-1|7-0)$/.test(url.pathname))){
    return Response.redirect("https://trainingbot.io.vn"+url.pathname,307);
  }
  const publicPreview=await previewPublicReadOnly(context,url);
  if(publicPreview)return publicPreview;

  // Never alter the Admin V2 loader document. It reconstructs the Admin UI
  // with document.open/write/close and must be served byte-for-byte unchanged.
  if(url.pathname==="/admin" || url.pathname==="/admin.html"){
    return context.next();
  }

  if(!env.VIDEO_BUCKET || !["GET","HEAD"].includes(request.method))return context.next();
  if(!IMAGE_PATH.test(url.pathname))return context.next();
  try{
    const key=keyFor(url.pathname);
    if(request.method==="HEAD"){
      const head=await env.VIDEO_BUCKET.head(key);
      if(!head)return context.next();
      const headers=new Headers();
      head.writeHttpMetadata(headers);
      headers.set("etag",head.httpEtag);
      headers.set("cache-control","public, max-age=0, must-revalidate");
      headers.set("content-length",String(head.size));
      return new Response(null,{status:200,headers});
    }
    const object=await env.VIDEO_BUCKET.get(key);
    if(!object)return context.next();
    const headers=new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag",object.httpEtag);
    headers.set("cache-control","public, max-age=0, must-revalidate");
    return new Response(object.body,{status:200,headers});
  }catch(error){
    console.error("site image override",error);
    return context.next();
  }
}
