// Read-only public TrainingBot knowledge bridge for Visitor Preview.
// Two FIXED anonymous JSON endpoints; no Production D1/Worker bindings, secrets,
// cookies, redirects, arbitrary URLs, HTML injection or paid background jobs.
// Called only after a successful signed/rate-limited Staging chat turn.
const SITE="https://trainingbot.io.vn";
const BETA_URL=SITE+"/ban-cap-nhat";
const NEWS_ENDPOINT=SITE+"/api/posts?limit=12";
const BETA_ENDPOINT=SITE+"/api/beta-versions";
const MAX_BYTES=40000;

const norm=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .replace(/đ/g,"d").replace(/Đ/g,"D").toLowerCase().replace(/\s+/g," ").trim();
const trimText=(s,n=160)=>String(s??"").replace(/<[^>]*>/g," ")
  .replace(/[*_\x60#]/g,"").replace(/[\r\n\t]+/g," ").replace(/\s+/g," ").trim().slice(0,n);
const dateOnly=(s)=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}T/.test(s)&&Number.isFinite(Date.parse(s))
  ?s.slice(0,10):null;
const versionParts=s=>String(s).replace(/^v/i,"").split(".").map(Number);
const newer=(a,b)=>{const x=versionParts(a),y=versionParts(b);for(let i=0;i<3;i++){if((x[i]??0)!==(y[i]??0))return (y[i]??0)-(x[i]??0);}return 0;};
function versionFrom(q){
  const m=q.match(/(?:^|[^a-z0-9])(?:v(?:ersion)?\s*)?(\d{1,2})\s*[.,]\s*(\d{1,2})(?:\s*[.,]\s*(\d{1,2}))?(?!\d)/);
  return m?{major:"V"+m[1]+"."+m[2],full:m[3]?"V"+m[1]+"."+m[2]+"."+m[3]:null}:null;
}
export function publicKnowledgeIntent(question){
  if(typeof question!=="string"||question.length>3000)return null;
  const q=norm(question);
  const version=versionFrom(q);
  const flash=/\bflash\b/.test(q);
  const beta=/\bbeta\b|\bban thu nghiem\b|\bthu nghiem\b|\bapk\b|\bxapk\b/.test(q);
  const news=/\btin\b|\bnews\b|\bbai viet\b|\bsu kien\b|\bthong bao\b|\bcong bo\b/.test(q);
  const release=/\bbao gio\b|\bkhi nao\b|\blich\b|\bra mat\b|\bphat hanh\b|\bupdate\b|\bcap nhat\b|\bphien ban\b|\bmoi nhat\b|\bmoi\b|\bco chua\b|\bda co\b/.test(q);
  const aboutGame=/\bpubg\b|\bbgmi\b|\bgame\b|\b4[.,]\d\b|\bflash\b|\bbeta\b/.test(q);
  // Don't spend extra public API subrequests on unrelated or normal Wiki chat.
  if(!((news||beta||release)&&(aboutGame||news||beta||version)))return null;
  const latest=/\bmoi nhat\b|\bgan day\b|\bgan nhat\b|\btin moi\b|\bcap nhat moi\b/.test(q);
  const needsBeta=!flash&&(beta||Boolean(version)||/ban beta|phien ban moi nhat|ban thu nghiem/.test(q));
  const needsPosts=flash||news||release||Boolean(version);
  return {q,version,flash,beta,latest,needsBeta,needsPosts};
}
async function readPublicJSON(fetchImpl,url){
  try{
    const res=await fetchImpl(url,{
      method:"GET",redirect:"manual",credentials:"omit",cache:"no-store",
      headers:{accept:"application/json"},signal:AbortSignal.timeout(4000)
    });
    if(res.status!==200||!(res.headers.get("content-type")||"").toLowerCase().startsWith("application/json"))
      return null;
    const declared=Number(res.headers.get("content-length")||0);
    if(declared>MAX_BYTES)return null;
    const text=await res.text();
    if(text.length>MAX_BYTES)return null;
    const obj=JSON.parse(text);
    return obj&&obj.ok===true&&!Array.isArray(obj)?obj:null;
  }catch{return null;}
}
export async function getTrainingBotPublicData(question,{fetchImpl=fetch,now=()=>Date.now()}={}){
  const intent=publicKnowledgeIntent(question);
  if(!intent)return null;
  const [beta,posts]=await Promise.all([
    intent.needsBeta?readPublicJSON(fetchImpl,BETA_ENDPOINT):Promise.resolve(null),
    intent.needsPosts?readPublicJSON(fetchImpl,NEWS_ENDPOINT):Promise.resolve(null)
  ]);
  const versions=Array.isArray(beta?.versions)?beta.versions.slice(0,50).flatMap(x=>{
    if(!x||typeof x!=="object"||typeof x.version!=="string"||!/^V\d{1,2}\.\d{1,2}(?:\.\d{1,2})?$/.test(x.version))return [];
    return [{version:x.version,status:typeof x.status==="string"&&/^[a-z_]{1,40}$/.test(x.status)?x.status:"unknown",
      updatedAt:dateOnly(x.updated_at),arch:trimText(x.arch,12)}];
  }).sort((a,b)=>newer(a.version,b.version)):[];
  const articles=Array.isArray(posts?.posts)?posts.posts.slice(0,24).flatMap(x=>{
    if(!x||typeof x!=="object"||typeof x.title!=="string"||typeof x.url!=="string"||
       !/^\/bai-viet\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.url))return [];
    const title=trimText(x.title,150),summary=trimText(x.summary,230);
    const publishedAt=dateOnly(x.published_at);
    if(!title||!publishedAt||Date.parse(x.published_at)>now()+86400000)return [];
    return [{title,summary,url:SITE+x.url,publishedAt}];
  }).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)):[];
  const checkedAt=new Date(now()).toISOString().slice(0,10);
  return {intent,versions,articles,checkedAt,betaAvailable:!!beta,postsAvailable:!!posts};
}
const statusText=s=>s==="released"?"được đánh dấu đã phát hành":
  ["coming_soon","upcoming","scheduled","unreleased","pending"].includes(s)?"chưa mở tải":
  "trạng thái chưa được xác minh";
function relevantArticles(data){
  const {intent,articles}=data;
  if((intent.latest||(/\btin\b|\bnews\b|\bbai viet\b/.test(intent.q)&&!intent.flash))&&!intent.version&&!intent.beta&&!/\bglacier\b|\berangel\b|\bm416\b/.test(intent.q))return articles.slice(0,3);
  const ver=intent.version?norm(intent.version.major.slice(1)):null;
  const relevant=articles.map(article=>{
    const title=norm(article.title),summary=norm(article.summary);
    let score=0;
    if(ver&&title.includes(ver))score+=7;
    if(ver&&summary.includes(ver))score+=2;
    if(intent.flash&&title.includes("flash"))score+=9;
    if(intent.flash&&!title.includes("flash"))score-=15;
    if(intent.beta&&title.includes("beta"))score+=4;
    if(intent.beta&&!ver&&!title.includes("beta"))score-=4;
    if(/glacier/.test(intent.q)&&title.includes("glacier"))score+=8;
    if(/erangel/.test(intent.q)&&title.includes("erangel"))score+=7;
    if(!ver&&!intent.flash&&!intent.beta&&intent.latest&&!/\bglacier\b|\berangel\b|\bm416\b/.test(intent.q))score+=2;
    return {article,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||b.article.publishedAt.localeCompare(a.article.publishedAt));
  return relevant.slice(0,3).map(x=>x.article);
}
export function composeTrainingBotPublicAnswer(data,{official47=null}={}){
  if(!data?.intent)return null;
  const {intent,versions,checkedAt}=data;
  const matched=versions.filter(x=>!intent.version||
    (intent.version.full?x.version.toLowerCase()===intent.version.full.toLowerCase():
      x.version.toLowerCase().startsWith(intent.version.major.toLowerCase()+".")));
  const selected=intent.needsBeta?matched.slice(0,(intent.version?.full||(!intent.version&&intent.latest))?1:4):[];
  const news=relevantArticles(data);
  const sections=[],sources=[];
  // Date-specific official announcement comes from our reviewed official citation,
  // NEVER from article title alone. Beta status always comes from live public API.
  if(official47&&!intent.flash&&!intent.beta&&intent.version?.major==="V4.7"){
    const officialLine=official47.reply.split("\n\n")[0];
    sections.push(officialLine);
    const officialSource=official47.sources?.find(s=>s.type==="official_claim");
    if(officialSource)sources.push(officialSource);
  }
  if(selected.length){
    sections.push("Danh sách Beta TrainingBot (kiểm tra "+checkedAt+"):\n"+
      selected.map(x=>"• "+x.version+" ("+x.arch+"): "+statusText(x.status)+
        (x.updatedAt?"; dữ liệu sửa "+x.updatedAt:"")).join("\n")+
      "\nĐây là trạng thái trong hệ thống TrainingBot, không bảo đảm đường dẫn APK còn hoạt động hoặc bản chính thức đã phát hành.");
    sources.push({type:"site_release",title:"TrainingBot — Danh sách PUBG MOBILE Beta",
      url:BETA_URL,checkedAt,sourceStatus:"trainingbot_public_catalog"});
  }else if(intent.beta&&data.betaAvailable)sections.push("Danh sách Beta công khai hiện không có phiên bản trùng yêu cầu.");
  if(news.length){
    const intro=intent.latest?"Tin PUBG MOBILE gần nhất trên TrainingBot:":"Bài viết liên quan từ TrainingBot:";
    sections.push(intro+"\n"+news.map(x=>"• "+x.title+" (đăng "+x.publishedAt+")"+
      (x.summary?". Tóm tắt: "+x.summary:"")).join("\n"));
    for(const x of news)sources.push({type:"site_news",title:x.title,url:x.url,
      checkedAt,publishedAt:x.publishedAt,sourceStatus:"trainingbot_published_article"});
  }
  if(!sections.length&&intent.version&&(data.betaAvailable||data.postsAvailable)){
    sections.push("Mình chưa tìm thấy trạng thái Beta hoặc bài viết về "+
      (intent.version.full??intent.version.major)+
      " trong dữ liệu công khai TrainingBot vừa đọc ("+checkedAt+
      "). Chưa đủ căn cứ để xác nhận ngày ra mắt chính thức.");
  }
  if(!sections.length)return null;
  sections.push("Nguồn: dữ liệu công khai TrainingBot được đọc khi bạn hỏi ("+checkedAt+"). Bài viết của TrainingBot không thay thế thông báo chính thức của nhà phát hành.");
  return {reply:sections.join("\n\n").slice(0,5000),sources:sources.slice(0,6)};
}
