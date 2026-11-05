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

function photoFromPlayer(html){
  if(!html)return "";
  const tags=html.match(/<img\b[^>]*>/gi)||[];
  for(const tag of tags){
    const match=tag.match(/\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
    if(!match)continue;
    const candidate=decode(match[1]||match[2]);
    if(/photomode|photo-mode|photo_mode/i.test(candidate)){
      const valid=safeImage(candidate);
      if(valid)return valid;
    }
  }
  // TikTok may serialize the same image in JSON instead of a DOM img element.
  const possible=html.match(/https?:[^\s"'<>{}]{15,2000}/g)||[];
  for(const candidate of possible){
    if(!/photomode|photo-mode|photo_mode/i.test(candidate))continue;
    const valid=safeImage(decode(candidate.replace(/\\u0026/g,"&").replace(/\\\//g,"/")));
    if(valid)return valid;
  }
  return "";
}

export async function onRequestGet({request}){
  const params=new URL(request.url).searchParams;
  const user=params.get("user"),kind=params.get("kind"),id=params.get("id");
  const direct=user&&kind&&id&&/^[\w.]{2,32}$/.test(user)&&/^(video|photo)$/.test(kind)&&/^\d{10,25}$/.test(id)
    ? "https://www.tiktok.com/@"+user+"/"+kind+"/"+id : null;
  const input=parseTikTok(direct||params.get("url"));
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
  if(input.type==="photo" && !thumbnail_url){
    const player=await retrieve("https://www.tiktok.com/player/v1/"+encodeURIComponent(input.id)+"?controls=0&description=0&music_info=0");
    if(player){
      thumbnail_url=photoFromPlayer(player);
      if(!description)description=title(meta(player,"og:description")||meta(player,"description"));
    }
  }
  return json({ok:true,type:input.type,thumbnail_url,title:description});
}