const IMAGE_PATH=/\.(?:png|jpe?g|webp|gif|svg|avif)$/i;
function keyFor(path){return `site-overrides/${encodeURIComponent(path)}`;}

const ADMIN_INJECT=`<script id="tb-image-manager-loader">(()=>{const nativeWrite=Document.prototype.write;if(nativeWrite.__tbImgPatched)return;function patchedWrite(...args){let html=args.join('');if(html.includes('TrainingBot Admin Center V2')&&!html.includes('admin-image-manager-v1.js')){html=html.replace('</body>','<script defer src="/admin-image-manager-v1.js?v=1"><\\/script></body>')}return nativeWrite.call(this,html)}patchedWrite.__tbImgPatched=true;Document.prototype.write=patchedWrite})();<\/script>`;

export async function onRequest(context){
  const {request,env}=context;
  const url=new URL(request.url);

  if(request.method==="GET" && (url.pathname==="/admin" || url.pathname==="/admin.html")){
    const response=await context.next();
    const type=String(response.headers.get("content-type")||"");
    if(!response.ok || !type.includes("text/html"))return response;
    let html=await response.text();
    if(html.includes("TrainingBot Admin Center V2") && !html.includes("tb-image-manager-loader")){
      html=html.replace("</body>",`${ADMIN_INJECT}</body>`);
    }
    const headers=new Headers(response.headers);
    headers.delete("content-length");
    headers.set("cache-control","no-store");
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
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