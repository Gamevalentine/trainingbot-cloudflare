const HEADERS={"content-type":"application/json; charset=UTF-8","cache-control":"public, max-age=300","x-content-type-options":"nosniff"};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:HEADERS});
function parseTikTok(raw){
  try{
    const url=new URL(String(raw||""));
    if(url.protocol!=="https:"||!/(^|\.)tiktok\.com$/i.test(url.hostname))return null;
    const match=url.pathname.match(/^\/@[\w.]+\/(video|photo)\/(\d{10,25})(?:\/|$)/);
    if(!match)return null;
    return {type:match[1],id:match[2],url:"https://www.tiktok.com"+url.pathname.replace(/\/$/,"")};
  }catch{return null;}
}
function safeImage(raw){
  try{
    const url=new URL(String(raw||"").replace(/&amp;/g,"&"));
    if(url.protocol!=="https:"||!/(^|\.)((?:tiktokcdn(?:-[a-z]+)?|muscdn)\.com)$/i.test(url.hostname))return "";
    return url.href;
  }catch{return "";}
}
function decode(raw){
  return String(raw||"").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&#x27;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">");
}
function meta(html,key){
  const tags=String(html||"").match(/<meta\b[^>]*>/gi)||[];
  for(const tag of tags){
    const attrs={};
    for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[m[1].toLowerCase()]=m[2]??m[3];
    if(attrs.property===key||attrs.name===key)return decode(attrs.content||"");
  }
  return "";
}
function title(raw){
  const text=decode(raw).replace(/\s+/g," ").trim().slice(0,160);
  return /^(?:TikTok(?:\s*-\s*Make Your Day)?|Make Your Day)$/i.test(text)?"":text;
}
async function retrieve(url,asJson=false){
  try{
    const response=await fetch(url,{signal:AbortSignal.timeout(3900),headers:{accept:asJson?"application/json":"text/html,application/xhtml+xml"}});
    if(!response.ok)return null;
    return asJson?await response.json():await response.text();
  }catch{return null;}
}
export async function onRequestGet({request}){
  const input=parseTikTok(new URL(request.url).searchParams.get("url"));
  if(!input)return json({ok:false,message:"Link TikTok không hợp lệ."},400);
  let thumbnail_url="",description="";
  if(input.type==="video"){
    const embed=await retrieve("https://www.tiktok.com/oembed?url="+encodeURIComponent(input.url),true);
    thumbnail_url=safeImage(embed?.thumbnail_url);
    description=title(embed?.title);
  }
  if(!thumbnail_url||!description){
    const page=await retrieve(input.url);
    if(page){
      if(!thumbnail_url)thumbnail_url=safeImage(meta(page,"og:image")||meta(page,"twitter:image"));
      if(!description)description=title(meta(page,"og:description")||meta(page,"description"));
    }
  }
  return json({ok:true,type:input.type,thumbnail_url,title:description});
}