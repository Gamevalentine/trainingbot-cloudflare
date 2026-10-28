/* Conservative attribution: only explicit UTM or browser referrer. Never infer Direct from missing evidence. */
const normalize=value=>String(value??"").trim().toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9._-]/g,"").slice(0,64);
const hostFrom=referrer=>{
  try{
    const url=new URL(referrer);
    return ["http:","https:"].includes(url.protocol)?url.hostname.toLowerCase():"";
  }catch{return "";}
};
function platform(source){
  const value=source.replace(/^www\./,"");
  if(/^(?:google\.|google$)/.test(value))return ["google","Tìm kiếm","Google"];
  if(/^(?:bing\.|bing$)/.test(value))return ["bing","Tìm kiếm","Bing"];
  if(/^(?:duckduckgo\.|duckduckgo$)/.test(value))return ["duckduckgo","Tìm kiếm","DuckDuckGo"];
  if(/^(?:yahoo\.|yahoo$)/.test(value))return ["yahoo","Tìm kiếm","Yahoo"];
  if(/^(?:facebook\.|m\.facebook\.|l\.facebook\.|fb\.|facebook$)/.test(value))return ["facebook","Mạng xã hội","Facebook"];
  if(/^(?:instagram\.|l\.instagram\.|instagram$)/.test(value))return ["instagram","Mạng xã hội","Instagram"];
  if(/^(?:tiktok\.|tiktok$)/.test(value))return ["tiktok","Mạng xã hội","TikTok"];
  if(/^(?:t\.me$|telegram\.me$|telegram\.org$|telegram$)/.test(value))return ["telegram","Mạng xã hội","Telegram"];
  if(/^(?:discord\.|discord$)/.test(value))return ["discord","Mạng xã hội","Discord"];
  if(/^(?:youtube\.|youtu\.be$|youtube$)/.test(value))return ["youtube","Mạng xã hội","YouTube"];
  if(/^(?:zalo\.|zalo$)/.test(value))return ["zalo","Mạng xã hội","Zalo"];
  if(/^(?:twitter\.|t\.co$|x\.com$|twitter$|x$)/.test(value))return ["x","Mạng xã hội","X / Twitter"];
  return null;
}
export function classifyAttribution({referrer="",siteOrigin="https://trainingbot.io.vn",utmSource="",utmMedium=""}={}){
  const source=normalize(utmSource),medium=normalize(utmMedium);
  const refHost=hostFrom(referrer);
  const ownHost=hostFrom(siteOrigin);
  if(source){
    const known=platform(source);
    const ref=known?known[0]:source;
    const channel=medium==="organic"||medium==="search"||medium==="cpc"||medium==="ppc"?"Tìm kiếm"
      :["social","social-media","social_media","paid_social"].includes(medium)?"Mạng xã hội"
      :["email","newsletter"].includes(medium)?"Email"
      :known?.[1]||"Chiến dịch UTM";
    return {source:ref,label:known?.[2]||source,channel,evidence:"utm"};
  }
  if(refHost&&refHost!==ownHost){
    const known=platform(refHost);
    return {source:known?.[0]||refHost,label:known?.[2]||refHost,channel:known?.[1]||"Website giới thiệu",evidence:"referrer"};
  }
  return {source:"unknown",label:"Không rõ nguồn",channel:"Không rõ nguồn",evidence:"none"};
}
export function cleanUtm(value,max=80){
  return String(value??"").replace(/[\u0000-\u001f\u007f]/g,"").trim().slice(0,max);
}
