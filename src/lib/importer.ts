import { db, media } from './cloudflare';
import { externalUrl, readLimitedText, resolveExternal, safeFetch } from './external';
import { normalizeSearch, slugify } from './utils';

type Profile={slug:string;tag:string;terms:string[];primaryUse:string;audience:string};
const PROFILES:Profile[]=[
  {slug:'ai',tag:'AI',terms:['artificial intelligence','machine learning','generative ai','chatbot','llm','gpt','copilot','ai assistant'],primaryUse:'Sử dụng các tính năng AI để hỗ trợ tạo nội dung, phân tích hoặc tự động hóa công việc.',audience:'Người dùng cần một công cụ AI hỗ trợ công việc hoặc sáng tạo.'},
  {slug:'y-khoa',tag:'Y khoa',terms:['y khoa','y tế','bác sĩ','lâm sàng','medical','healthcare','clinical','hospital','doctor','patient'],primaryUse:'Tra cứu, học tập hoặc sử dụng nội dung và công cụ liên quan đến y khoa.',audience:'Sinh viên y, nhân viên y tế hoặc người dùng quan tâm đến nội dung y khoa.'},
  {slug:'hoc-tap',tag:'Học tập',terms:['học tập','giáo dục','khóa học','ôn thi','education','learning','course','study','exam','quiz','flashcard','academy','school','classroom'],primaryUse:'Học tập, ôn luyện hoặc tiếp cận tài liệu và nội dung giáo dục trên web.',audience:'Người học, sinh viên hoặc người cần tự học trực tuyến.'},
  {slug:'thiet-ke',tag:'Thiết kế',terms:['thiết kế','giao diện','design','ui','ux','figma','canva','canvas','graphic design','prototype'],primaryUse:'Thiết kế giao diện hoặc nội dung trực quan trực tiếp trên web.',audience:'Nhà thiết kế, nhà phát triển hoặc người cần tạo sản phẩm trực quan.'},
  {slug:'video',tag:'Video',terms:['video editor','edit video','video editing','biên tập video','chỉnh sửa video','youtube studio','subtitle'],primaryUse:'Tạo, chỉnh sửa hoặc xử lý nội dung video.',audience:'Người sáng tạo nội dung hoặc người cần xử lý video trên web.'},
  {slug:'hinh-anh',tag:'Hình ảnh',terms:['image editor','photo editor','chỉnh sửa ảnh','hình ảnh','photography','image generator','photo'],primaryUse:'Tạo, chỉnh sửa hoặc xử lý hình ảnh.',audience:'Người sáng tạo nội dung, thiết kế hoặc người dùng cần xử lý hình ảnh.'},
  {slug:'nang-suat',tag:'Năng suất',terms:['productivity','to do','todo','task management','note taking','calendar','document','spreadsheet'],primaryUse:'Tổ chức công việc và nâng cao năng suất cá nhân hoặc nhóm.',audience:'Cá nhân hoặc nhóm cần quản lý công việc và thông tin hiệu quả hơn.'},
  {slug:'quan-ly',tag:'Quản lý',terms:['quản lý','quản trị','dashboard','admin panel','crm','inventory','project management','workflow','management'],primaryUse:'Quản lý dữ liệu, công việc hoặc quy trình vận hành trên web.',audience:'Người quản trị, nhóm vận hành hoặc tổ chức cần theo dõi và điều phối công việc.'},
  {slug:'tin-tuc',tag:'Tin tức',terms:['tin tức','bản tin','news','newspaper','journalism','breaking news'],primaryUse:'Đọc, quản lý hoặc xuất bản nội dung tin tức.',audience:'Người đọc tin hoặc người quản trị nội dung tin tức.'},
  {slug:'mang-xa-hoi',tag:'Mạng xã hội',terms:['mạng xã hội','cộng đồng','social network','social media','community','forum','messaging'],primaryUse:'Kết nối cộng đồng, chia sẻ nội dung và tương tác xã hội trực tuyến.',audience:'Người dùng muốn tham gia, xây dựng hoặc quản lý cộng đồng trực tuyến.'},
  {slug:'developer-tools',tag:'Developer',terms:['developer tools','developer','programming','coding','source code','github','api','debug','ide'],primaryUse:'Hỗ trợ lập trình, kiểm thử, tích hợp hoặc phát triển phần mềm.',audience:'Lập trình viên và người làm kỹ thuật phần mềm.'},
  {slug:'game',tag:'Game',terms:['trò chơi','gaming','game','pubg','steam','esports'],primaryUse:'Chơi game hoặc sử dụng nội dung và công cụ liên quan đến trò chơi.',audience:'Người chơi game hoặc người quan tâm đến nội dung gaming.'},
  {slug:'giai-tri',tag:'Giải trí',terms:['giải trí','entertainment','movie','movies','music','streaming','phim','âm nhạc'],primaryUse:'Xem, nghe hoặc khám phá nội dung giải trí trực tuyến.',audience:'Người dùng tìm kiếm nội dung giải trí trên web.'},
  {slug:'ca-nhan',tag:'Cá nhân',terms:['personal website','portfolio','diary','nhật ký','trang cá nhân'],primaryUse:'Tạo hoặc sử dụng trải nghiệm web mang tính cá nhân.',audience:'Cá nhân muốn lưu trữ, giới thiệu hoặc chia sẻ nội dung riêng.'},
  {slug:'cong-cu',tag:'Công cụ',terms:['online tool','web tool','utility','converter','calculator','generator'],primaryUse:'Thực hiện nhanh một tác vụ hoặc tiện ích trực tuyến.',audience:'Người dùng cần một tiện ích web phục vụ tác vụ cụ thể.'}
];
const TAG_RULES=[
  {name:'AI',terms:['artificial intelligence','generative ai','chatbot','llm','gpt','copilot']},{name:'Y khoa',terms:['y khoa','y tế','medical','healthcare','clinical']},
  {name:'Học tập',terms:['học tập','giáo dục','learning','course','study','exam','quiz']},{name:'Thiết kế',terms:['thiết kế','design','ui','ux','figma','canva','canvas']},
  {name:'Video',terms:['video editor','video editing','chỉnh sửa video','subtitle']},{name:'Hình ảnh',terms:['image editor','photo editor','chỉnh sửa ảnh','photography']},
  {name:'Năng suất',terms:['productivity','todo','task management','note taking','calendar']},{name:'Quản lý',terms:['quản lý','quản trị','dashboard','crm','inventory','management']},
  {name:'Tin tức',terms:['tin tức','news','newspaper']},{name:'Cộng đồng',terms:['cộng đồng','community','forum']},{name:'Mạng xã hội',terms:['mạng xã hội','social network','social media']},
  {name:'Developer',terms:['developer','programming','coding','github','api','debug']},{name:'Game',terms:['game','gaming','pubg','esports']},{name:'Giải trí',terms:['entertainment','movie','music','streaming','phim','âm nhạc']}
];

function decodeHtml(value:string){
  const common:Record<string,string>={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi,(_,code:string)=>{if(code[0]==='#'){const hex=code[1]?.toLowerCase()==='x';const n=parseInt(code.slice(hex?2:1),hex?16:10);return Number.isFinite(n)?String.fromCodePoint(n):'';}return common[code.toLowerCase()]??`&${code};`;}).replace(/\s+/g,' ').trim();
}
function attr(tag:string,name:string){const m=tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`,'i'))||tag.match(new RegExp(`${name}\\s*=\\s*([^\\s>]+)`,'i'));return m?.[1]?decodeHtml(m[1]):'';}
function metadata(html:string,pageUrl:URL){
  const metas=[...html.matchAll(/<meta\b[^>]*>/gi)].map((m)=>m[0]); const links=[...html.matchAll(/<link\b[^>]*>/gi)].map((m)=>m[0]);
  const meta=(key:string)=>{for(const tag of metas){const k=(attr(tag,'property')||attr(tag,'name')).toLowerCase();if(k===key.toLowerCase())return attr(tag,'content');}return '';};
  const title=meta('og:title')||decodeHtml(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||''); const description=meta('og:description')||meta('description');
  const image=meta('og:image')||meta('twitter:image'); let icon=''; for(const tag of links){if(/\bicon\b/i.test(attr(tag,'rel'))){icon=attr(tag,'href');if(icon)break;}}
  const safeResolve=(value:string)=>{try{return value?resolveExternal(pageUrl,value).toString():'';}catch{return '';}};
  return {title,siteName:meta('og:site_name'),description,keywords:meta('keywords'),image:safeResolve(image),icon:safeResolve(icon)||new URL('/favicon.ico',pageUrl).toString()};
}
function pageText(html:string){return decodeHtml(html.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<noscript\b[\s\S]*?<\/noscript>/gi,' ').replace(/<!--[\s\S]*?-->/g,' ').replace(/<[^>]+>/g,' ')).slice(0,12000);}
function termScore(text:string,terms:string[]){let score=0;const padded=` ${text} `;for(const raw of terms){const term=normalizeSearch(raw);if(term&&padded.includes(` ${term} `))score+=term.includes(' ')?4:2;}return score;}
function inferProfile(text:string,minScore=4){let best:Profile|null=null,bestScore=0;for(const profile of PROFILES){const score=termScore(text,profile.terms);if(score>bestScore){best=profile;bestScore=score;}}return bestScore>=minScore?best:null;}
function inferHostProfile(host:string){const compact=normalizeSearch(host).replace(/\s+/g,'');let best:Profile|null=null,bestScore=0;for(const profile of PROFILES){let score=0;for(const raw of profile.terms){const term=normalizeSearch(raw).replace(/\s+/g,'');if(term.length>=5&&compact.includes(term))score+=term.length>=8?4:2;}if(score>bestScore){best=profile;bestScore=score;}}return bestScore>=2?best:null;}
function inferTags(text:string){return TAG_RULES.filter((rule)=>termScore(text,rule.terms)>=4).sort((a,b)=>termScore(text,b.terms)-termScore(text,a.terms)).slice(0,5).map((rule)=>rule.name);}
async function uniqueSlug(base:string){const root=slugify(base)||'website';let candidate=root,index=2;while(await db().prepare('SELECT id FROM apps WHERE slug=?').bind(candidate).first())candidate=`${root}-${index++}`;return candidate;}
async function ensureTags(appId:number,names:string[]){for(const name of [...new Set(names.filter(Boolean))].slice(0,5)){const slug=slugify(name);if(!slug)continue;await db().prepare('INSERT OR IGNORE INTO tags (name,slug) VALUES (?,?)').bind(name,slug).run();const tag=await db().prepare('SELECT id FROM tags WHERE slug=? OR name=? LIMIT 1').bind(slug,name).first<{id:number}>();if(tag)await db().prepare('INSERT OR IGNORE INTO app_tags (app_id,tag_id) VALUES (?,?)').bind(appId,tag.id).run();}}
async function storeRemoteImage(url:string,prefix:string){
  if(!url)return'';try{const {response}=await safeFetch(url,{headers:{Accept:'image/*'}});const type=String(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();if(!response.ok||!type.startsWith('image/')){try{await response.body?.cancel();}catch{}return'';}const max=5*1024*1024,reader=response.body?.getReader();if(!reader)return'';const chunks:Uint8Array[]=[];let total=0;while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>max){await reader.cancel();return'';}chunks.push(value);}const merged=new Uint8Array(total);let offset=0;for(const chunk of chunks){merged.set(chunk,offset);offset+=chunk.byteLength;}const ext=type==='image/png'?'png':type==='image/webp'?'webp':type==='image/svg+xml'?'svg':type==='image/gif'?'gif':'jpg';const key=`${prefix}/${crypto.randomUUID()}.${ext}`;await media().put(key,merged,{httpMetadata:{contentType:type}});return key;}catch{return'';}
}

export async function importWebsite(rawUrl:string,categoryId:number|null=null){
  const requested=externalUrl(rawUrl);const duplicate=await db().prepare('SELECT id FROM apps WHERE production_url=?').bind(requested.toString()).first<{id:number}>();if(duplicate)return{id:duplicate.id,existing:true};
  const {response,url}=await safeFetch(requested,{headers:{Accept:'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5'}});const finalDuplicate=await db().prepare('SELECT id FROM apps WHERE production_url=?').bind(url.toString()).first<{id:number}>();if(finalDuplicate){try{await response.body?.cancel();}catch{}return{id:finalDuplicate.id,existing:true};}
  const contentType=String(response.headers.get('content-type')||'').toLowerCase();const html=contentType.includes('text/html')?await readLimitedText(response,1024*1024,true):'';const meta=html?metadata(html,url):{title:'',siteName:'',description:'',keywords:'',image:'',icon:new URL('/favicon.ico',url).toString()};
  const hostName=url.hostname.replace(/^www\./,'');const rawName=meta.siteName||meta.title;const genericTitle=/^(client challenge|just a moment|access denied|checking (your )?browser)$/i.test(rawName.trim());const name=((rawName&&!genericTitle)?rawName:hostName).slice(0,160),slug=await uniqueSlug(name),description=meta.description.slice(0,1000);
  const coreContext=normalizeSearch([meta.siteName,meta.title,meta.title,description,description,meta.keywords,url.hostname].join(' '));const bodyContext=normalizeSearch(html?pageText(html):'');
  const selectedCategory=categoryId?await db().prepare('SELECT id,name,slug FROM categories WHERE id=?').bind(categoryId).first<{id:number;name:string;slug:string}>():null;
  const inferred=inferProfile(coreContext,2)||inferHostProfile(url.hostname)||inferProfile(bodyContext,8),profile=(selectedCategory&&PROFILES.find((p)=>p.slug===selectedCategory.slug))||inferred;
  const inferredCategory=!selectedCategory&&profile?await db().prepare('SELECT id,name,slug FROM categories WHERE slug=?').bind(profile.slug).first<{id:number;name:string;slug:string}>():null;
  const finalCategory=selectedCategory||inferredCategory,tagNames=inferTags(coreContext),primaryTag=profile?.tag||finalCategory?.name||'';if(primaryTag&&!tagNames.includes(primaryTag))tagNames.unshift(primaryTag);tagNames.splice(5);
  const primaryUse=(profile?.primaryUse||`Sử dụng các chức năng được cung cấp bởi ${name} trên web.`).slice(0,1000);const audience=(profile?.audience||'Người dùng có nhu cầu sử dụng các chức năng của website này.').slice(0,1000);
  const searchKeywords=[name,url.hostname,...meta.keywords.split(',').map((x)=>x.trim()),...tagNames,finalCategory?.name||''].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).slice(0,16).join(', ').slice(0,1000);
  const healthy=(response.status>=200&&response.status<400)||[401,403,429].includes(response.status);
  const result=await db().prepare(`INSERT INTO apps (name,slug,production_url,short_description,description,primary_use,audience,category_id,status,visibility,pricing_type,platform,search_keywords,monitor_enabled,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(name,slug,url.toString(),description,description,primaryUse,audience,finalCategory?.id||null,healthy?'active':'offline','private','free','web',searchKeywords,1).run();
  const id=Number(result.meta.last_row_id);
  try{await ensureTags(id,tagNames);const [iconKey,coverKey]=await Promise.all([storeRemoteImage(meta.icon,`apps/${id}/icon`),storeRemoteImage(meta.image,`apps/${id}/cover`)]);await db().prepare('UPDATE apps SET icon_key=?,cover_key=? WHERE id=?').bind(iconKey,coverKey,id).run();await db().prepare('INSERT INTO app_status_history (app_id,old_status,new_status) VALUES (?,NULL,?)').bind(id,healthy?'active':'offline').run();return{id,existing:false,icon:!!iconKey,cover:!!coverKey,category:finalCategory?.name||'',tags:tagNames};}catch(error){await db().prepare('DELETE FROM apps WHERE id=?').bind(id).run().catch(()=>{});throw error;}
}
