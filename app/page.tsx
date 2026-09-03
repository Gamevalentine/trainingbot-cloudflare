'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { createClient, Session, User } from '@supabase/supabase-js'
import { ProfilePosts, SocialHome, SocialNotifications } from './social'

const supabase = createClient(
  'https://wjevxwduimabtubjlqns.supabase.co',
  'sb_publishable_PuGRRnrUF9jZ8GKYrNciHw_l7J-WrSk',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
)

type Profile = { id:string; display_name:string; birth_date:string; gender:string; looking_for:string; city:string|null; bio:string|null; photo_path:string|null; is_complete:boolean }
type RailProfile = Pick<Profile,'id'|'display_name'|'birth_date'|'city'|'photo_path'> & { photo?:string|null }
type Match = { id:string; user_a:string; user_b:string; created_at:string; other?:Profile; photo?:string|null }
type Message = { id:string; match_id:string; sender_id:string; body:string; created_at:string }
type View = 'home'|'discover'|'chat'|'notifications'|'profile'

const age = (date:string) => { const d=new Date(date),n=new Date(); let a=n.getFullYear()-d.getFullYear(); if(n < new Date(n.getFullYear(),d.getMonth(),d.getDate())) a--; return a }
const initials = (name?:string) => (name||'?').trim().slice(0,1).toUpperCase()
const genderText = (gender:string) => gender==='man'?'Nam':gender==='woman'?'Nữ':'Khác'
const lookingText = (looking:string) => looking==='man'?'Nam':looking==='woman'?'Nữ':'Mọi người'

async function signed(path:string|null|undefined){
  if(!path)return null
  if(/^https?:\/\//.test(path))return path
  const {data}=await supabase.storage.from('profile-photos').createSignedUrl(path,3600)
  return data?.signedUrl||null
}

function ProfileAvatar({profile,className='avatar'}:{profile:Pick<Profile,'display_name'|'photo_path'>;className?:string}){
  const [src,setSrc]=useState<string|null>(null)
  useEffect(()=>{void signed(profile.photo_path).then(setSrc)},[profile.photo_path])
  return src?<img className={className} src={src} alt=""/>:<div className={className}>{initials(profile.display_name)}</div>
}

export default function Page(){
  const [session,setSession]=useState<Session|null>(null)
  const [ready,setReady]=useState(false)
  const [profile,setProfile]=useState<Profile|null>(null)
  const [view,setView]=useState<View>('home')
  const [chatMatch,setChatMatch]=useState<Match|null>(null)
  const [query,setQuery]=useState('')

  const loadProfile=useCallback(async(user:User)=>{ const {data}=await supabase.from('profiles').select('*').eq('id',user.id).maybeSingle(); setProfile(data as Profile|null) },[])

  useEffect(()=>{
    void supabase.auth.getSession().then(async({data})=>{ setSession(data.session); if(data.session)await loadProfile(data.session.user); setReady(true) })
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>{ setSession(s); if(s)void loadProfile(s.user); else setProfile(null) })
    return()=>subscription.unsubscribe()
  },[loadProfile])

  if(!ready)return <div className="loading">Đang mở Kết Nối…</div>
  if(!session)return <Auth/>
  if(!profile?.is_complete)return <ProfileEditor user={session.user} profile={profile} onSaved={()=>loadProfile(session.user)}/>

  const openChat=(m:Match)=>{setChatMatch(m);setView('chat')}
  const go=(v:View)=>{if(v!=='chat')setChatMatch(null);setView(v)}
  return <div className="shell">
    <Top profile={profile} view={view} setView={go} query={query} setQuery={setQuery}/>
    <div className="app social-app">
      <Nav profile={profile} view={view} setView={go}/>
      <main className="content">
        {view==='home'&&<SocialHome client={supabase} user={session.user} me={profile} signedProfile={signed}/>} 
        {view==='discover'&&<Discover user={session.user} me={profile}/>} 
        {view==='chat'&&(chatMatch?<Chat user={session.user} match={chatMatch}/>:<Matches user={session.user} openChat={openChat}/>)}
        {view==='notifications'&&<SocialNotifications client={supabase} user={session.user} signedProfile={signed}/>} 
        {view==='profile'&&<><ProfileEditor user={session.user} profile={profile} onSaved={()=>loadProfile(session.user)} embedded/><ProfilePosts client={supabase} user={session.user} signedProfile={signed}/></>}
      </main>
      <RightRail me={profile} query={query}/>
    </div>
    <MobileNav view={view} setView={go}/>
  </div>
}

function Auth(){
  const [signup,setSignup]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false)
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setMsg('');if(signup){const {data,error}=await supabase.auth.signUp({email,password});setMsg(error?error.message:data.session?'Đăng ký thành công.':'Đã gửi email xác nhận. Xác nhận xong, quay lại đây đăng nhập.')}else{const{error}=await supabase.auth.signInWithPassword({email,password});if(error)setMsg('Email hoặc mật khẩu không đúng, hoặc email chưa xác nhận.')}setBusy(false)}
  return <div className="auth-wrap"><form className="auth-card" onSubmit={submit}><div className="brand"><span>♥</span>Kết Nối</div><h1>{signup?'Tạo tài khoản':'Đăng nhập'}</h1><p>Chia sẻ cuộc sống, làm quen người mới và hẹn hò khi bạn muốn.</p><label className="field">Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="field">Mật khẩu<input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label>{msg&&<div className="message">{msg}</div>}<button className="btn primary full" disabled={busy}>{busy?'Đang xử lý…':signup?'Đăng ký':'Đăng nhập'}</button><button type="button" className="btn ghost full" onClick={()=>{setSignup(!signup);setMsg('')}}>{signup?'Đã có tài khoản? Đăng nhập':'Chưa có tài khoản? Đăng ký'}</button><small className="muted">Cộng đồng dành cho người từ 18 tuổi.</small></form></div>
}

function Top({profile,view,setView,query,setQuery}:{profile:Profile;view:View;setView:(v:View)=>void;query:string;setQuery:(v:string)=>void}){
  const items:[View,string,string][]=[['home','⌂','Trang chủ'],['discover','✦','Hẹn hò'],['chat','◉','Tin nhắn'],['notifications','◆','Thông báo']]
  return <header className="topbar">
    <div className="top-left"><div className="brand"><span>♥</span><b>Kết Nối</b></div><label className="top-search"><span>⌕</span><input aria-label="Tìm người trong Kết Nối" placeholder="Tìm người trong Kết Nối" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
    <nav className="top-nav">{items.map(([v,icon,label])=><button key={v} className={view===v?'active':''} title={label} onClick={()=>setView(v)}><i>{icon}</i><span>{label}</span></button>)}</nav>
    <button className={`user-mini ${view==='profile'?'active':''}`} onClick={()=>setView('profile')}><ProfileAvatar profile={profile}/><strong>{profile.display_name}</strong></button>
  </header>
}

function Nav({profile,view,setView}:{profile:Profile;view:View;setView:(v:View)=>void}){
  const items:[View,string,string][]=[['home','⌂','Trang chủ'],['discover','✦','Hẹn hò'],['chat','●','Tin nhắn'],['notifications','◆','Thông báo'],['profile','◉','Trang cá nhân']]
  return <aside className="side"><button className="side-profile" onClick={()=>setView('profile')}><ProfileAvatar profile={profile} className="side-avatar"/><span><strong>{profile.display_name}</strong><small>{profile.city||'Chưa đặt địa điểm'}</small></span></button><div className="nav">{items.map(([v,icon,t])=><button key={v} className={view===v?'active':''} onClick={()=>setView(v)}><i>{icon}</i><span>{t}</span></button>)}<div className="side-divider"/><button className="logout" onClick={()=>void supabase.auth.signOut()}><i>↗</i><span>Đăng xuất</span></button></div><div className="side-links">Kết Nối · Cộng đồng 18+ · An toàn & riêng tư</div></aside>
}

function MobileNav({view,setView}:{view:View;setView:(v:View)=>void}){
  const items:[View,string][]=[['home','Trang chủ'],['discover','Hẹn hò'],['chat','Chat'],['notifications','Thông báo'],['profile','Hồ sơ']]
  return <nav className="mobile-nav social-mobile-nav">{items.map(([v,t])=><button key={v} className={view===v?'active':''} onClick={()=>setView(v)}>{t}</button>)}</nav>
}

function RightRail({me,query}:{me:Profile;query:string}){
  const [people,setPeople]=useState<RailProfile[]>([])
  useEffect(()=>{void (async()=>{const {data}=await supabase.from('profiles').select('id,display_name,birth_date,city,photo_path').eq('is_complete',true).neq('id',me.id).limit(16);const rows=(data||[]) as RailProfile[];setPeople(await Promise.all(rows.map(async p=>({...p,photo:await signed(p.photo_path)}))))})()},[me.id])
  const q=query.trim().toLocaleLowerCase('vi')
  const shown=q?people.filter(p=>`${p.display_name} ${p.city||''}`.toLocaleLowerCase('vi').includes(q)):people
  const now=new Date()
  const birthdays=people.filter(p=>{const d=new Date(`${p.birth_date}T00:00:00`);return d.getDate()===now.getDate()&&d.getMonth()===now.getMonth()})
  return <aside className="right-rail">
    {!q&&birthdays.length>0&&<section className="rail-section"><h3>Sinh nhật</h3>{birthdays.map(p=><div className="birthday" key={p.id}><span>🎁</span><p>Hôm nay là sinh nhật của <b>{p.display_name}</b>.</p></div>)}</section>}
    <section className="rail-section"><div className="rail-head"><h3>{q?'Kết quả tìm kiếm':'Người trong cộng đồng'}</h3><span>{shown.length}</span></div><div className="contacts">{shown.slice(0,12).map(p=><div className="contact-row" key={p.id}>{p.photo?<img src={p.photo} alt=""/>:<div className="contact-avatar">{initials(p.display_name)}</div>}<span><b>{p.display_name}</b><small>{p.city||'Kết Nối'}</small></span></div>)}{shown.length===0&&<p className="rail-empty">Không tìm thấy thành viên phù hợp.</p>}</div></section>
    {!q&&<section className="rail-section rail-safety"><h3>An toàn khi kết nối</h3><p>Không gửi tiền, mật khẩu hay mã xác minh cho người mới quen.</p></section>}
  </aside>
}

function ProfileEditor({user,profile,onSaved,embedded=false}:{user:User;profile:Profile|null;onSaved:()=>void;embedded?:boolean}){
  const [name,setName]=useState(profile?.display_name||''),[birth,setBirth]=useState(profile?.birth_date||''),[gender,setGender]=useState(profile?.gender||'man'),[looking,setLooking]=useState(profile?.looking_for||'all'),[city,setCity]=useState(profile?.city||''),[bio,setBio]=useState(profile?.bio||''),[photoPath,setPhotoPath]=useState(profile?.photo_path||null),[photo,setPhoto]=useState<string|null>(null),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false)
  useEffect(()=>{void signed(photoPath).then(setPhoto)},[photoPath])
  async function upload(file:File){setBusy(true);const ext=file.name.split('.').pop()?.toLowerCase()||'jpg';const path=`${user.id}/${Date.now()}.${ext}`;const {error}=await supabase.storage.from('profile-photos').upload(path,file,{upsert:false});if(error)setMsg(error.message);else{setPhotoPath(path);setPhoto(await signed(path))}setBusy(false)}
  async function save(e:FormEvent){e.preventDefault();if(!birth||age(birth)<18){setMsg('Bạn phải đủ 18 tuổi.');return}if(!name.trim()){setMsg('Hãy nhập tên hiển thị.');return}setBusy(true);const payload={id:user.id,display_name:name.trim(),birth_date:birth,gender,looking_for:looking,city:city.trim()||null,bio:bio.trim()||null,photo_path:photoPath,is_complete:true,updated_at:new Date().toISOString()};const {error}=await supabase.from('profiles').upsert(payload);setMsg(error?error.message:'Đã lưu hồ sơ.');setBusy(false);if(!error)onSaved()}
  const form=<form className="card profile-card" onSubmit={save}><div className="section-heading"><div><span className="eyebrow">HỒ SƠ CÁ NHÂN</span><h2>{embedded?'Trang cá nhân của bạn':'Hoàn thiện hồ sơ'}</h2><p>Thông tin này dùng cho cả cộng đồng và mục Hẹn hò.</p></div></div><div className="profile-grid"><div><div className="photo-preview">{photo?<img className="photo-preview" src={photo} alt="Ảnh hồ sơ"/>:<div className="photo-preview avatar">{initials(name)}</div>}</div><label className="field">Ảnh<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f)}}/></label></div><div><label className="field">Tên hiển thị<input required value={name} onChange={e=>setName(e.target.value)}/></label><label className="field">Ngày sinh<input type="date" required value={birth} onChange={e=>setBirth(e.target.value)}/></label><div className="form-2"><label className="field">Giới tính<select value={gender} onChange={e=>setGender(e.target.value)}><option value="man">Nam</option><option value="woman">Nữ</option><option value="other">Khác</option></select></label><label className="field">Muốn gặp<select value={looking} onChange={e=>setLooking(e.target.value)}><option value="all">Tất cả</option><option value="man">Nam</option><option value="woman">Nữ</option></select></label></div><label className="field">Thành phố<input value={city} onChange={e=>setCity(e.target.value)}/></label><label className="field">Giới thiệu<textarea maxLength={500} value={bio} onChange={e=>setBio(e.target.value)}/></label></div></div>{msg&&<div className="message">{msg}</div>}<div className="form-actions"><button className="btn primary" disabled={busy}>{busy?'Đang lưu…':'Lưu hồ sơ'}</button>{!embedded&&<button type="button" className="btn ghost" onClick={()=>void supabase.auth.signOut()}>Đăng xuất</button>}</div></form>
  return embedded?form:<div className="auth-wrap profile-onboard"><div>{form}</div></div>
}

function Discover({user,me}:{user:User;me:Profile}){
  const [items,setItems]=useState<(Profile&{photo?:string|null})[]>([]),[index,setIndex]=useState(0),[loading,setLoading]=useState(true),[notice,setNotice]=useState('')
  const load=useCallback(async()=>{setLoading(true);const {data:liked}=await supabase.from('likes').select('liked_id').eq('liker_id',user.id);const excluded=[user.id,...(liked||[]).map(x=>x.liked_id)];let q=supabase.from('profiles').select('*').eq('is_complete',true).neq('id',user.id).limit(30);if(me.looking_for!=='all')q=q.eq('gender',me.looking_for);const {data}=await q;const filtered=(data||[]).filter(p=>!excluded.includes(p.id)&&(p.looking_for==='all'||p.looking_for===me.gender));const withPhotos=await Promise.all(filtered.map(async p=>({...p,photo:await signed(p.photo_path)})));setItems(withPhotos as (Profile&{photo?:string|null})[]);setIndex(0);setLoading(false)},[user.id,me.gender,me.looking_for])
  useEffect(()=>{void load()},[load])
  const p=items[index]
  async function react(like:boolean){if(!p)return;if(like){const {error}=await supabase.from('likes').insert({liker_id:user.id,liked_id:p.id});if(error&&!error.message.includes('duplicate')){setNotice(error.message);return}const {data:back}=await supabase.from('likes').select('id').eq('liker_id',p.id).eq('liked_id',user.id).maybeSingle();if(back){const [a,b]=[user.id,p.id].sort();const {error:merr}=await supabase.from('matches').upsert({user_a:a,user_b:b},{onConflict:'user_a,user_b'});setNotice(merr?merr.message:`Bạn và ${p.display_name} đã kết nối!`)}}setIndex(i=>i+1)}
  if(loading)return <div className="card empty rich-empty">Đang tìm người phù hợp…</div>
  if(!p)return <div className="card empty rich-empty"><div className="empty-heart">♡</div><h2>Hết hồ sơ phù hợp lúc này</h2><p className="muted">Khi có thành viên mới, họ sẽ xuất hiện tại đây.</p><button className="btn secondary" onClick={()=>void load()}>Tải lại</button></div>
  return <div className="discover-wrap"><div className="discover-head"><div><span className="eyebrow">HẸN HÒ</span><h1>Khám phá</h1><p>Những hồ sơ phù hợp với lựa chọn của bạn.</p></div><div className="suggest-count"><b>{Math.max(items.length-index,0)}</b><span>gợi ý</span></div></div>{notice&&<div className="message">{notice}</div>}<section className="discover-card"><div className="hero">{p.photo?<img src={p.photo} alt={p.display_name}/>:<div className="fallback"><span>{initials(p.display_name)}</span><small>Ảnh hồ sơ chưa được thêm</small></div>}<div className="hero-shade"/><div className="hero-status"><span/>Đang hoạt động</div><div className="hero-name"><h2>{p.display_name}, {age(p.birth_date)}</h2><p>{p.city||'Chưa đặt địa điểm'}</p></div></div><div className="person"><div className="quick-info"><span>{genderText(p.gender)}</span><span>Tìm {lookingText(p.looking_for)}</span><span>18+</span></div>{p.bio&&<div className="bio-block"><small>GIỚI THIỆU</small><p>{p.bio}</p></div>}<div className="actions"><button className="btn secondary skip" onClick={()=>void react(false)}>Bỏ qua</button><button className="btn primary like" onClick={()=>void react(true)}>♥ Thích</button></div></div></section><div className="discover-tip"><span>💡</span><p><b>Mẹo nhỏ:</b> Chỉ khi cả hai cùng thích nhau, mục Tin nhắn mới được mở.</p></div></div>
}

function Matches({user,openChat}:{user:User;openChat:(m:Match)=>void}){
  const [matches,setMatches]=useState<Match[]>([]),[loading,setLoading]=useState(true)
  useEffect(()=>{void (async()=>{const {data}=await supabase.from('matches').select('*').or(`user_a.eq.${user.id},user_b.eq.${user.id}`).order('created_at',{ascending:false});const rows=(data||[]) as Match[];const ids=rows.map(m=>m.user_a===user.id?m.user_b:m.user_a);const {data:ps}=ids.length?await supabase.from('profiles').select('*').in('id',ids):{data:[] as Profile[]};const map=new Map((ps||[]).map(p=>[p.id,p as Profile]));const full=await Promise.all(rows.map(async m=>{const other=map.get(m.user_a===user.id?m.user_b:m.user_a);return {...m,other,photo:await signed(other?.photo_path)}}));setMatches(full);setLoading(false)})()},[user.id])
  if(loading)return <div className="card empty rich-empty">Đang tải kết nối…</div>
  return <section><div className="section-heading"><div><span className="eyebrow">KẾT NỐI HẸN HÒ</span><h2>Tin nhắn</h2><p>Những người đã cùng thích bạn.</p></div><div className="suggest-count"><b>{matches.length}</b><span>kết nối</span></div></div><div className="list">{matches.length===0?<div className="card empty rich-empty"><div className="empty-heart">♡</div><h3>Chưa có kết nối hẹn hò</h3><p>Khi hai người cùng thích nhau, kết nối sẽ xuất hiện ở đây.</p></div>:matches.map(m=><button key={m.id} className="row" onClick={()=>openChat(m)}>{m.photo?<img className="avatar" src={m.photo} alt=""/>:<div className="avatar">{initials(m.other?.display_name)}</div>}<span className="grow"><strong>{m.other?.display_name||'Thành viên'}</strong><span className="muted">Nhấn để trò chuyện</span></span><span className="row-arrow">›</span></button>)}</div></section>
}

function Chat({user,match}:{user:User;match:Match}){
  const [messages,setMessages]=useState<Message[]>([]),[text,setText]=useState('')
  const load=useCallback(async()=>{const{data}=await supabase.from('messages').select('*').eq('match_id',match.id).order('created_at',{ascending:true});setMessages((data||[]) as Message[])},[match.id])
  useEffect(()=>{void load();const channel=supabase.channel(`chat-${match.id}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`match_id=eq.${match.id}`},payload=>setMessages(m=>[...m,payload.new as Message])).subscribe();return()=>{void supabase.removeChannel(channel)}},[load,match.id])
  async function send(e:FormEvent){e.preventDefault();const body=text.trim();if(!body)return;setText('');await supabase.from('messages').insert({match_id:match.id,sender_id:user.id,body})}
  return <section><div className="chat-heading"><div className="avatar">{initials(match.other?.display_name)}</div><div><h2>{match.other?.display_name||'Tin nhắn'}</h2><span>Đã kết nối · Có thể trò chuyện</span></div></div><div className="card chat"><div className="messages">{messages.length===0&&<div className="chat-start"><b>Hai bạn đã kết nối.</b><span>Hãy bắt đầu bằng một lời chào tự nhiên.</span></div>}{messages.map(m=><div key={m.id} className={`bubble ${m.sender_id===user.id?'mine':''}`}>{m.body}</div>)}</div><form className="composer" onSubmit={send}><input maxLength={1000} placeholder="Nhập tin nhắn…" value={text} onChange={e=>setText(e.target.value)}/><button className="btn primary">Gửi</button></form></div></section>
}
