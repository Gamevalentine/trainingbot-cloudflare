const IMAGE_PATH=/\.(?:png|jpe?g|webp|gif|svg|avif)$/i;
function keyFor(path){return `site-overrides/${encodeURIComponent(path)}`;}

export async function onRequest(context){
  const {request,env}=context;
  const url=new URL(request.url);

  // Never alter the Admin V2 loader document. It reconstructs the Admin UI
  // with document.open/write/close and must be served byte-for-byte unchanged.
  if(url.pathname==="/admin" || url.pathname==="/admin.html"){
    return context.next();
  }

  if((url.pathname==="/news"||url.pathname==="/news.html")&&request.method==="GET"){
    const response=await context.next();
    const type=response.headers.get("content-type")||"";
    if(!response.ok||!type.includes("text/html"))return response;
    let html=await response.text();
    const patch=`<script>(()=>{const n=s=>String(s||'').replace(/\\s+/g,' ').trim().toUpperCase();const apply=()=>{const title=[...document.querySelectorAll('h1,h2,h3,h4,div,span')].find(x=>n(x.textContent)==='BÀI VIẾT MỚI NHẤT');if(!title)return false;let section=title.parentElement;while(section&&section!==document.body){const cs=getComputedStyle(section);const r=section.getBoundingClientRect();if(parseFloat(cs.borderTopWidth)>0&&parseFloat(cs.borderLeftWidth)>0&&r.width>500)break;section=section.parentElement;}if(!section||section===document.body)return false;section.style.setProperty('margin-top','64px','important');section.style.setProperty('clear','both','important');section.style.setProperty('position','relative','important');section.style.setProperty('z-index','1','important');return true;};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(!apply())setTimeout(apply,300)},{once:true});else if(!apply())setTimeout(apply,300);})();<\/script>`;
    if(!html.includes("BÀI VIẾT MỚI NHẤT"))return response;
    html=html.replace("</body>",patch+"</body>");
    const headers=new Headers(response.headers);
    headers.delete("content-length");
    headers.set("cache-control","public, max-age=0, must-revalidate");
    return new Response(html,{status:response.status,headers});
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
