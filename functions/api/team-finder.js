const JSON_HEADERS={"content-type":"application/json; charset=UTF-8","cache-control":"no-store, max-age=0","x-content-type-options":"nosniff"};
const DISCORD_INVITE="https://discord.com/invite/5u5PbZMqx";
const DISCORD_INVITE_CODE="5u5PbZMqx";
const DISCORD_API="https://discord.com/api/v10";

function json(data,status=200,extra={}){return new Response(JSON.stringify(data),{status,headers:{...JSON_HEADERS,...extra}})}
function text(value,max=200){return String(value??"").trim().slice(0,max)}
function clientIp(request){return request.headers.get("CF-Connecting-IP")||request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim()||""}
function maskIp(ip){const value=text(ip,100);if(!value)return"unknown";if(value.includes(":")){const parts=value.split(":").filter(Boolean);return`${parts.slice(0,3).join(":")}:*`}const parts=value.split(".");return parts.length===4?`${parts[0]}.${parts[1]}.${parts[2]}.*`:"unknown"}
async function readJson(request){if(!(request.headers.get("Content-Type")||"").toLowerCase().includes("application/json"))throw new Error("Dữ liệu gửi lên phải có định dạng JSON.");return request.json()}
async function sha256(value){const bytes=new TextEncoder().encode(String(value||""));const hash=await crypto.subtle.digest("SHA-256",bytes);return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("")}
function safeDiscord(value,max=500){return text(value,max).replace(/@/g,"@\u200b")}
function slug(value){return String(value||"").normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}

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
    expires_at TEXT NOT NULL,
    discord_thread_id TEXT,
    discord_thread_url TEXT
  )`).run();
  const info=await env.DB.prepare("PRAGMA table_info(team_finder_posts)").all();
  const columns=new Set((info.results||[]).map(row=>row.name));
  if(!columns.has('discord_thread_id'))await env.DB.prepare("ALTER TABLE team_finder_posts ADD COLUMN discord_thread_id TEXT").run();
  if(!columns.has('discord_thread_url'))await env.DB.prepare("ALTER TABLE team_finder_posts ADD COLUMN discord_thread_url TEXT").run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_team_finder_active ON team_finder_posts(status, expires_at, created_at)`).run();
}

const SERVERS=new Set(["Asia","KRJP","Europe","Middle East","North America","South America"]);
const RANKS=new Set(["Bronze","Silver","Gold","Platinum","Diamond","Crown","Ace","Ace Master","Ace Dominator","Conqueror"]);
const MODES=new Set(["Ranked Classic","Classic","Metro Royale","Arena","WOW","Khác"]);
const TIMES=new Set(["Sáng","Chiều","Tối","Đêm","Linh hoạt"]);
const LANGUAGES=new Set(["Tiếng Việt","English","Khác"]);

function publicPost(row){return{id:row.id,name:row.name,pubg_uid:row.pubg_uid||"",discord_name:row.discord_name,discord_user_id:row.discord_user_id||"",server:row.server,rank:row.rank,mode:row.mode,needed:Number(row.needed||1),mic:row.mic,play_time:row.play_time,language:row.language,note:row.note||"",created_at:row.created_at,expires_at:row.expires_at,discord_invite:DISCORD_INVITE,discord_thread_url:row.discord_thread_url||""}}

function discordConfigured(env){return Boolean(text(env.DISCORD_BOT_TOKEN,300))}
async function discordRequest(env,path,options={}){
  const token=text(env.DISCORD_BOT_TOKEN,300);
  if(!token)throw new Error('DISCORD_BOT_TOKEN chưa được cấu hình.');
  const res=await fetch(`${DISCORD_API}${path}`,{...options,headers:{authorization:`Bot ${token}`,'content-type':'application/json',...(options.headers||{})}});
  let data=null;try{data=await res.json()}catch{}
  if(!res.ok){const message=text(data?.message,300)||`Discord API lỗi ${res.status}`;throw new Error(message)}
  return data;
}
async function inviteGuildId(){
  const res=await fetch(`${DISCORD_API}/invites/${DISCORD_INVITE_CODE}?with_counts=false&with_expiration=false`,{headers:{accept:'application/json'}});
  let data=null;try{data=await res.json()}catch{}
  if(!res.ok||!data?.guild?.id)throw new Error('Không xác định được Discord server từ link mời TrainingBot.');
  return text(data.guild.id,30);
}
async function resolveTeamChannel(env){
  const configured=text(env.DISCORD_TEAM_CHANNEL_ID,30);
  if(configured)return discordRequest(env,`/channels/${configured}`);
  const guildId=await inviteGuildId();
  const channels=await discordRequest(env,`/guilds/${guildId}/channels`);
  const existing=(Array.isArray(channels)?channels:[]).find(channel=>[0,15].includes(Number(channel.type))&&slug(channel.name)==='tim-dong-doi');
  if(existing)return existing;
  const base={name:'tìm-đồng-đội',topic:'Phòng ghép đội tự động từ TrainingBot. Mỗi tin tìm đồng đội có một thread riêng.'};
  try{return await discordRequest(env,`/guilds/${guildId}/channels`,{method:'POST',body:JSON.stringify({...base,type:15})})}
  catch(error){console.warn('team-finder create forum fallback',error);return discordRequest(env,`/guilds/${guildId}/channels`,{method:'POST',body:JSON.stringify({...base,type:0})})}
}
function threadName(data){return text(`🎮 ${data.name} • ${data.server} • ${data.rank} • ${data.play_time}`,100)}
function starterMessage(data){
  const lines=[
    `## 🎮 ${safeDiscord(data.name,40)} đang tìm đồng đội`,
    `**Server:** ${safeDiscord(data.server,30)}  •  **Rank:** ${safeDiscord(data.rank,30)}  •  **Chế độ:** ${safeDiscord(data.mode,40)}`,
    `**Cần thêm:** ${data.needed} người  •  **Mic:** ${data.mic==='yes'?'Có mic':'Không yêu cầu'}  •  **Khung giờ:** ${safeDiscord(data.play_time,20)}`,
    `**Ngôn ngữ:** ${safeDiscord(data.language,30)}  •  **Discord:** ${safeDiscord(data.discord_name,64)}`,
    data.pubg_uid?`**PUBG UID:** ${safeDiscord(data.pubg_uid,24)}`:'',
    data.note?`> ${safeDiscord(data.note,180)}`:'',
    '',
    `👉 Ai phù hợp có thể nhắn ngay trong thread này. Khi đã đủ đội, chủ tin hãy bấm **“Đã tìm đủ đồng đội”** trên TrainingBot để phòng được khóa tự động.`
  ];
  return lines.filter(Boolean).join('\n');
}
async function createDiscordThread(env,data){
  if(!discordConfigured(env))return{created:false,reason:'Discord chưa được cấu hình'};
  const channel=await resolveTeamChannel(env);
  const channelId=text(channel?.id,30);
  if(!channelId)throw new Error('Không xác định được kênh tìm đồng đội trên Discord.');
  const name=threadName(data),content=starterMessage(data);
  let thread;
  if(channel?.type===15||channel?.type===16){
    const payload={name,auto_archive_duration:10080,message:{content}};
    try{thread=await discordRequest(env,`/channels/${channelId}/threads`,{method:'POST',body:JSON.stringify(payload)})}
    catch(error){payload.auto_archive_duration=1440;thread=await discordRequest(env,`/channels/${channelId}/threads`,{method:'POST',body:JSON.stringify(payload)})}
  }else{
    const payload={name,type:11,auto_archive_duration:10080,invitable:true};
    try{thread=await discordRequest(env,`/channels/${channelId}/threads`,{method:'POST',body:JSON.stringify(payload)})}
    catch(error){payload.auto_archive_duration=1440;thread=await discordRequest(env,`/channels/${channelId}/threads`,{method:'POST',body:JSON.stringify(payload)})}
    await discordRequest(env,`/channels/${thread.id}/messages`,{method:'POST',body:JSON.stringify({content})});
  }
  const guildId=text(thread?.guild_id||channel?.guild_id,30);
  const threadId=text(thread?.id,30);
  if(!threadId)throw new Error('Discord không trả về ID phòng chat.');
  return{created:true,id:threadId,url:guildId?`https://discord.com/channels/${guildId}/${threadId}`:DISCORD_INVITE};
}
async function closeDiscordThread(env,threadId){
  if(!threadId||!discordConfigured(env))return{closed:false};
  await discordRequest(env,`/channels/${threadId}`,{method:'PATCH',body:JSON.stringify({archived:true,locked:true})});
  return{closed:true};
}

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
  const sql=`SELECT id,name,pubg_uid,discord_name,discord_user_id,server,rank,mode,needed,mic,play_time,language,note,created_at,expires_at,discord_thread_url FROM team_finder_posts WHERE ${clauses.join(' AND ')} ORDER BY created_at ${sort} LIMIT 100`;
  const result=await env.DB.prepare(sql).bind(...binds).all();
  return json({ok:true,posts:(result.results||[]).map(publicPost),discord_threads_enabled:discordConfigured(env)});
}

async function closePost(body,env){
  const id=text(body.id,120),token=text(body.manage_token,200);if(!id||!token)return json({ok:false,message:"Thiếu thông tin quản lý tin."},400);
  const hash=await sha256(token),row=await env.DB.prepare('SELECT manage_token_hash,status,discord_thread_id FROM team_finder_posts WHERE id = ?').bind(id).first();
  if(!row)return json({ok:false,message:"Không tìm thấy tin."},404);
  if(row.manage_token_hash!==hash)return json({ok:false,message:"Bạn không có quyền cập nhật tin này."},403);
  let discordClosed=false,discordWarning='';
  if(row.discord_thread_id){try{discordClosed=(await closeDiscordThread(env,row.discord_thread_id)).closed}catch(error){console.error('team-finder close discord',error);discordWarning='Tin đã đóng trên web nhưng chưa khóa được phòng Discord.'}}
  await env.DB.prepare("UPDATE team_finder_posts SET status = 'closed', updated_at = ? WHERE id = ?").bind(new Date().toISOString(),id).run();
  return json({ok:true,discord_closed:discordClosed,warning:discordWarning,message:discordClosed?"Đã đóng tin và khóa phòng Discord.":"Đã đánh dấu tin là đã tìm đủ đồng đội."});
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

  let discord={created:false,url:'',id:''},warning='';
  try{discord=await createDiscordThread(env,data);if(discord.created)await env.DB.prepare('UPDATE team_finder_posts SET discord_thread_id = ?, discord_thread_url = ?, updated_at = ? WHERE id = ?').bind(discord.id,discord.url,new Date().toISOString(),id).run()}
  catch(error){console.error('team-finder create discord',error);warning='Tin đã đăng trên web nhưng chưa tạo được phòng Discord.'}
  if(!discordConfigured(env))warning='Tin đã đăng trên web. Phòng Discord sẽ hoạt động sau khi quản trị viên kết nối bot TrainingBot.';
  const post=publicPost({...data,id,created_at:now.toISOString(),expires_at:expires,discord_thread_url:discord.url});
  return json({ok:true,id,manage_token:manageToken,post,discord_thread_created:Boolean(discord.created),discord_thread_url:discord.url||'',warning,message:discord.created?"Đăng tin và tạo phòng Discord thành công.":"Đăng tin tìm đồng đội thành công."},201);
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
