const JSON_HEADERS={"content-type":"application/json; charset=UTF-8","cache-control":"no-store, max-age=0","x-content-type-options":"nosniff"};
const DISCORD_INVITE="https://discord.com/invite/5u5PbZMqx";

function json(data,status=200,extra={}){return new Response(JSON.stringify(data),{status,headers:{...JSON_HEADERS,...extra}})}
function text(value,max=200){return String(value??"").trim().slice(0,max)}
function clientIp(request){return request.headers.get("CF-Connecting-IP")||request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim()||""}
function maskIp(ip){const value=text(ip,100);if(!value)return"unknown";if(value.includes(":")){const parts=value.split(":").filter(Boolean);return`${parts.slice(0,3).join(":")}:*`}const parts=value.split(".");return parts.length===4?`${parts[0]}.${parts[1]}.${parts[2]}.*`:"unknown"}
async function readJson(request){if(!(request.headers.get("Content-Type")||"").toLowerCase().includes("application/json"))throw new Error("Dữ liệu gửi lên phải có định dạng JSON.");return request.json()}
async function sha256(value){const bytes=new TextEncoder().encode(String(value||""));const hash=await crypto.subtle.digest("SHA-256",bytes);return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("")}

async function ensureTable(env){
  if(!env.DB)throw new Error("Cloudflare D1 chưa được liên kết với Pages project.");
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS team_finder_posts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pubg_uid TEXT,
    discord_name TEXT NOT NULL,
    discord_user_id TEXT,
    server TEXT NOT NULL,
    rank TEXT NOT NULL,
    mode TEXT NOT NULL,
    needed INTEGER NOT NULL,
    mic TEXT NOT NULL,
    play_time TEXT NOT NULL,
    language TEXT NOT NULL,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    ip_masked TEXT,
    device TEXT,
    manage_token_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_team_finder_active ON team_finder_posts(status, expires_at, created_at)`).run();
}

const SERVERS=new Set(["Asia","KRJP","Europe","Middle East","North America","South America"]);
const RANKS=new Set(["Bronze","Silver","Gold","Platinum","Diamond","Crown","Ace","Ace Master","Ace Dominator","Conqueror"]);
const MODES=new Set(["Ranked Classic","Classic","Metro Royale","Arena","WOW","Khác"]);
const TIMES=new Set(["Sáng","Chiều","Tối","Đêm","Linh hoạt"]);
const LANGUAGES=new Set(["Tiếng Việt","English","Khác"]);

function publicPost(row){return{id:row.id,name:row.name,pubg_uid:row.pubg_uid||"",discord_name:row.discord_name,discord_user_id:row.discord_user_id||"",server:row.server,rank:row.rank,mode:row.mode,needed:Number(row.needed||1),mic:row.mic,play_time:row.play_time,language:row.language,note:row.note||"",created_at:row.created_at,expires_at:row.expires_at,discord_invite:DISCORD_INVITE}}

async function listPosts(request,env){
  await ensureTable(env);
  const url=new URL(request.url),now=new Date().toISOString();
  const clauses=["status = 'active'","expires_at > ?"],binds=[now];
  const exact=[['server',SERVERS],['rank',RANKS],['mode',MODES],['play_time',TIMES],['language',LANGUAGES]];
  for(const [key,allowed] of exact){const value=text(url.searchParams.get(key),60);if(value&&allowed.has(value)){clauses.push(`${key} = ?`);binds.push(value)}}
  const needed=Number.parseInt(url.searchParams.get('needed')||'',10);if([1,2,3].includes(needed)){clauses.push('needed = ?');binds.push(needed)}
  const mic=text(url.searchParams.get('mic'),8);if(mic==='yes'||mic==='no'){clauses.push('mic = ?');binds.push(mic)}
  const q=text(url.searchParams.get('q'),80).toLowerCase();if(q){clauses.push('(LOWER(name) LIKE ? OR LOWER(pubg_uid) LIKE ? OR LOWER(discord_name) LIKE ?)');const like=`%${q.replace(/[%_]/g,'')}%`;binds.push(like,like,like)}
  const sort=url.searchParams.get('sort')==='oldest'?'ASC':'DESC';
  const sql=`SELECT id,name,pubg_uid,discord_name,discord_user_id,server,rank,mode,needed,mic,play_time,language,note,created_at,expires_at FROM team_finder_posts WHERE ${clauses.join(' AND ')} ORDER BY created_at ${sort} LIMIT 100`;
  const result=await env.DB.prepare(sql).bind(...binds).all();
  return json({ok:true,posts:(result.results||[]).map(publicPost)});
}

async function closePost(body,env){
  const id=text(body.id,120),token=text(body.manage_token,200);if(!id||!token)return json({ok:false,message:"Thiếu thông tin quản lý tin."},400);
  const hash=await sha256(token),row=await env.DB.prepare('SELECT manage_token_hash,status FROM team_finder_posts WHERE id = ?').bind(id).first();
  if(!row)return json({ok:false,message:"Không tìm thấy tin."},404);
  if(row.manage_token_hash!==hash)return json({ok:false,message:"Bạn không có quyền cập nhật tin này."},403);
  await env.DB.prepare("UPDATE team_finder_posts SET status = 'closed', updated_at = ? WHERE id = ?").bind(new Date().toISOString(),id).run();
  return json({ok:true,message:"Đã đánh dấu tin là đã tìm đủ đồng đội."});
}

async function createPost(request,env){
  await ensureTable(env);
  let body;try{body=await readJson(request)}catch(error){return json({ok:false,message:error.message||"Dữ liệu không hợp lệ."},400)}
  if(text(body.website,200))return json({ok:true,message:"Đăng tin thành công."},201);
  if(text(body.action,20)==='close')return closePost(body,env);

  const data={
    name:text(body.name,40),pubg_uid:text(body.pubg_uid,24),discord_name:text(body.discord_name,64),discord_user_id:text(body.discord_user_id,20),server:text(body.server,30),rank:text(body.rank,30),mode:text(body.mode,40),needed:Number.parseInt(body.needed,10),mic:text(body.mic,8),play_time:text(body.play_time,20),language:text(body.language,30),note:text(body.note,180)
  };
  if(data.name.length<2)return json({ok:false,message:"Tên hiển thị phải có ít nhất 2 ký tự."},400);
  if(data.discord_name.length<2)return json({ok:false,message:"Vui lòng nhập tên Discord."},400);
  if(data.pubg_uid&&!/^\d{5,24}$/.test(data.pubg_uid))return json({ok:false,message:"UID PUBG Mobile chỉ nên gồm chữ số."},400);
  if(data.discord_user_id&&!/^\d{17,20}$/.test(data.discord_user_id))return json({ok:false,message:"Discord User ID phải gồm 17–20 chữ số hoặc để trống."},400);
  if(!SERVERS.has(data.server)||!RANKS.has(data.rank)||!MODES.has(data.mode)||![1,2,3].includes(data.needed)||!['yes','no'].includes(data.mic)||!TIMES.has(data.play_time)||!LANGUAGES.has(data.language))return json({ok:false,message:"Một hoặc nhiều lựa chọn không hợp lệ."},400);

  const ipMasked=maskIp(clientIp(request)),device=text(request.headers.get('User-Agent'),500)||'unknown',now=new Date();
  const recent=await env.DB.prepare('SELECT created_at FROM team_finder_posts WHERE ip_masked = ? AND device = ? ORDER BY created_at DESC LIMIT 1').bind(ipMasked,device).first();
  if(recent?.created_at){const elapsed=now.getTime()-Date.parse(recent.created_at);if(Number.isFinite(elapsed)&&elapsed>=0&&elapsed<60000)return json({ok:false,message:"Bạn vừa đăng tin. Vui lòng chờ khoảng 1 phút rồi thử lại."},429)}
  const active=await env.DB.prepare("SELECT COUNT(*) AS total FROM team_finder_posts WHERE ip_masked = ? AND device = ? AND status = 'active' AND expires_at > ?").bind(ipMasked,device,now.toISOString()).first();
  if(Number(active?.total||0)>=3)return json({ok:false,message:"Bạn đang có 3 tin còn hiệu lực. Hãy đánh dấu tin cũ là đã đủ đội trước khi đăng thêm."},429);

  const id=`tb-team-${crypto.randomUUID()}`,manageToken=`${crypto.randomUUID()}${crypto.randomUUID()}`,tokenHash=await sha256(manageToken),expires=new Date(now.getTime()+7*24*60*60*1000).toISOString();
  await env.DB.prepare(`INSERT INTO team_finder_posts (id,name,pubg_uid,discord_name,discord_user_id,server,rank,mode,needed,mic,play_time,language,note,status,ip_masked,device,manage_token_hash,created_at,updated_at,expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'active',?,?,?,?,?,?)`).bind(id,data.name,data.pubg_uid,data.discord_name,data.discord_user_id,data.server,data.rank,data.mode,data.needed,data.mic,data.play_time,data.language,data.note,ipMasked,device,tokenHash,now.toISOString(),now.toISOString(),expires).run();
  return json({ok:true,id,manage_token:manageToken,post:publicPost({...data,id,created_at:now.toISOString(),expires_at:expires}),message:"Đăng tin tìm đồng đội thành công."},201);
}

export async function onRequest(context){
  const {request,env}=context,method=request.method.toUpperCase();
  if(method==='OPTIONS')return new Response(null,{status:204,headers:{allow:'GET, POST, OPTIONS','cache-control':'no-store'}});
  try{
    if(method==='GET')return listPosts(request,env);
    if(method==='POST')return createPost(request,env);
    return json({ok:false,message:"Phương thức không được hỗ trợ."},405,{allow:'GET, POST, OPTIONS'});
  }catch(error){console.error('team-finder',error);return json({ok:false,message:"Tạm thời không thể xử lý yêu cầu. Vui lòng thử lại sau."},500)}
}
