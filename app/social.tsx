'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'

type ProfileMini = { id:string; display_name:string; city:string|null; photo_path:string|null }
type SocialProfile = ProfileMini & { gender:string; looking_for:string; bio:string|null }
type PostRow = { id:number; author_id:string; body:string; media_path:string|null; created_at:string }
type CommentRow = { id:number; post_id:number; author_id:string; body:string; created_at:string }
type FeedPost = PostRow & {
  author?:ProfileMini
  authorPhoto?:string|null
  media?:string|null
  liked:boolean
  likeCount:number
  comments:(CommentRow&{author?:ProfileMini;photo?:string|null})[]
}
type Notice = { id:number; actor_id:string; kind:'follow'|'post_like'|'comment'; post_id:number|null; created_at:string; read_at:string|null; actor?:ProfileMini; photo?:string|null }

type SharedProps = {
  client:SupabaseClient
  user:User
  me:SocialProfile
  signedProfile:(path:string|null|undefined)=>Promise<string|null>
}

const relativeTime=(iso:string)=>{
  const seconds=Math.max(1,Math.floor((Date.now()-new Date(iso).getTime())/1000))
  if(seconds<60)return 'vừa xong'
  const minutes=Math.floor(seconds/60); if(minutes<60)return `${minutes} phút`
  const hours=Math.floor(minutes/60); if(hours<24)return `${hours} giờ`
  const days=Math.floor(hours/24); if(days<7)return `${days} ngày`
  return new Date(iso).toLocaleDateString('vi-VN')
}

async function signedPost(client:SupabaseClient,path:string|null){
  if(!path)return null
  const {data}=await client.storage.from('post-media').createSignedUrl(path,3600)
  return data?.signedUrl||null
}

export function SocialHome(props:SharedProps){
  const {client,user,me,signedProfile}=props
  const [posts,setPosts]=useState<FeedPost[]>([])
  const [people,setPeople]=useState<(ProfileMini&{photo?:string|null;following:boolean})[]>([])
  const [body,setBody]=useState('')
  const [file,setFile]=useState<File|null>(null)
  const [preview,setPreview]=useState<string|null>(null)
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [msg,setMsg]=useState('')

  const load=useCallback(async()=>{
    setLoading(true)
    const {data:postRows,error}=await client.from('posts').select('id,author_id,body,media_path,created_at').order('created_at',{ascending:false}).limit(30)
    if(error){setMsg(error.message);setLoading(false);return}
    const rows=(postRows||[]) as PostRow[]
    const ids=rows.map(p=>p.id)
    const [{data:likes},{data:comments}]=ids.length?await Promise.all([
      client.from('post_likes').select('post_id,user_id').in('post_id',ids),
      client.from('comments').select('id,post_id,author_id,body,created_at').in('post_id',ids).order('created_at',{ascending:true})
    ]):[{data:[]},{data:[]}]
    const commentRows=(comments||[]) as CommentRow[]
    const profileIds=[...new Set([...rows.map(p=>p.author_id),...commentRows.map(c=>c.author_id)])]
    const {data:profiles}=profileIds.length?await client.from('profiles').select('id,display_name,city,photo_path').in('id',profileIds):{data:[] as ProfileMini[]}
    const profileMap=new Map((profiles||[]).map(p=>[p.id,p as ProfileMini]))
    const photoMap=new Map<string,string|null>()
    await Promise.all((profiles||[]).map(async p=>photoMap.set(p.id,await signedProfile(p.photo_path))))
    const likeRows=(likes||[]) as {post_id:number;user_id:string}[]
    const next=await Promise.all(rows.map(async p=>({
      ...p,
      author:profileMap.get(p.author_id),
      authorPhoto:photoMap.get(p.author_id)||null,
      media:await signedPost(client,p.media_path),
      liked:likeRows.some(l=>l.post_id===p.id&&l.user_id===user.id),
      likeCount:likeRows.filter(l=>l.post_id===p.id).length,
      comments:commentRows.filter(c=>c.post_id===p.id).map(c=>({...c,author:profileMap.get(c.author_id),photo:photoMap.get(c.author_id)||null}))
    })))
    setPosts(next)

    const [{data:suggestions},{data:following}]=await Promise.all([
      client.from('profiles').select('id,display_name,city,photo_path').eq('is_complete',true).neq('id',user.id).limit(6),
      client.from('follows').select('following_id').eq('follower_id',user.id)
    ])
    const followingIds=new Set((following||[]).map(x=>x.following_id))
    const suggestionRows=(suggestions||[]) as ProfileMini[]
    setPeople(await Promise.all(suggestionRows.map(async p=>({...p,photo:await signedProfile(p.photo_path),following:followingIds.has(p.id)}))))
    setLoading(false)
  },[client,signedProfile,user.id])

  useEffect(()=>{void load()},[load])

  function chooseFile(next:File|null){
    if(preview)URL.revokeObjectURL(preview)
    setFile(next)
    setPreview(next?URL.createObjectURL(next):null)
  }

  async function publish(e:FormEvent){
    e.preventDefault(); const text=body.trim(); if(!text&&!file)return
    setBusy(true);setMsg('')
    let mediaPath:string|null=null
    if(file){
      const ext=file.name.split('.').pop()?.toLowerCase()||'jpg'
      mediaPath=`${user.id}/${Date.now()}.${ext}`
      const {error}=await client.storage.from('post-media').upload(mediaPath,file,{upsert:false})
      if(error){setMsg(error.message);setBusy(false);return}
    }
    const {error}=await client.from('posts').insert({author_id:user.id,body:text,media_path:mediaPath})
    if(error){if(mediaPath)await client.storage.from('post-media').remove([mediaPath]);setMsg(error.message)}
    else{setBody('');chooseFile(null);await load()}
    setBusy(false)
  }

  async function toggleLike(post:FeedPost){
    if(post.liked)await client.from('post_likes').delete().eq('post_id',post.id).eq('user_id',user.id)
    else await client.from('post_likes').insert({post_id:post.id,user_id:user.id})
    setPosts(items=>items.map(p=>p.id===post.id?{...p,liked:!p.liked,likeCount:Math.max(0,p.likeCount+(p.liked?-1:1))}:p))
  }

  async function comment(postId:number,text:string){
    const body=text.trim();if(!body)return
    const {error}=await client.from('comments').insert({post_id:postId,author_id:user.id,body})
    if(error)setMsg(error.message);else await load()
  }

  async function removePost(post:FeedPost){
    if(post.author_id!==user.id)return
    if(post.media_path)await client.storage.from('post-media').remove([post.media_path])
    await client.from('posts').delete().eq('id',post.id)
    setPosts(items=>items.filter(p=>p.id!==post.id))
  }

  async function toggleFollow(person:ProfileMini&{following:boolean}){
    if(person.following)await client.from('follows').delete().eq('follower_id',user.id).eq('following_id',person.id)
    else await client.from('follows').insert({follower_id:user.id,following_id:person.id})
    setPeople(items=>items.map(p=>p.id===person.id?{...p,following:!p.following}:p))
  }

  return <div className="social-home">
    <div className="social-heading"><div><span className="eyebrow">CỘNG ĐỒNG</span><h1>Trang chủ</h1><p>Chia sẻ cuộc sống, làm quen người mới và hẹn hò khi bạn muốn.</p></div></div>

    <form className="composer-card" onSubmit={publish}>
      <div className="composer-top"><div className="composer-avatar">{me.display_name.slice(0,1).toUpperCase()}</div><textarea maxLength={3000} placeholder={`${me.display_name}, hôm nay bạn muốn chia sẻ gì?`} value={body} onChange={e=>setBody(e.target.value)}/></div>
      {preview&&<div className="composer-preview"><img src={preview} alt="Ảnh chuẩn bị đăng"/><button type="button" onClick={()=>chooseFile(null)}>×</button></div>}
      <div className="composer-bottom"><label className="media-pick">▣ Ảnh<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>chooseFile(e.target.files?.[0]||null)}/></label><button className="btn primary" disabled={busy||(!body.trim()&&!file)}>{busy?'Đang đăng…':'Đăng bài'}</button></div>
    </form>

    {msg&&<div className="message">{msg}</div>}

    {people.length>0&&<section className="people-strip"><div className="strip-title"><b>Gợi ý kết nối</b><span>Theo dõi để thấy nhau thường xuyên hơn</span></div><div className="people-grid">{people.slice(0,4).map(p=><article key={p.id} className="person-suggest">{p.photo?<img src={p.photo} alt=""/>:<div className="suggest-avatar">{p.display_name.slice(0,1)}</div>}<strong>{p.display_name}</strong><span>{p.city||'Chưa đặt địa điểm'}</span><button className={p.following?'following':''} onClick={()=>void toggleFollow(p)}>{p.following?'Đang theo dõi':'Theo dõi'}</button></article>)}</div></section>}

    <section className="feed-list">
      {loading?<div className="card empty">Đang tải bảng tin…</div>:posts.length===0?<div className="card empty"><h3>Bảng tin đang trống</h3><p>Hãy đăng bài đầu tiên để bắt đầu cộng đồng.</p></div>:posts.map(post=><PostCard key={post.id} post={post} me={me} user={user} onLike={()=>void toggleLike(post)} onComment={text=>void comment(post.id,text)} onDelete={()=>void removePost(post)}/>) }
    </section>
  </div>
}

function PostCard({post,user,onLike,onComment,onDelete}:{post:FeedPost;me:SocialProfile;user:User;onLike:()=>void;onComment:(text:string)=>void;onDelete:()=>void}){
  const [text,setText]=useState('')
  function submit(e:FormEvent){e.preventDefault();const value=text.trim();if(!value)return;setText('');onComment(value)}
  return <article className="feed-card">
    <header className="post-head">{post.authorPhoto?<img src={post.authorPhoto} alt=""/>:<div className="post-avatar">{post.author?.display_name?.slice(0,1)||'?'}</div>}<div><strong>{post.author?.display_name||'Thành viên'}</strong><span>{post.author?.city||'Kết Nối'} · {relativeTime(post.created_at)}</span></div>{post.author_id===user.id&&<button className="post-delete" onClick={onDelete}>Xóa</button>}</header>
    {post.body&&<p className="post-body">{post.body}</p>}
    {post.media&&<img className="post-media" src={post.media} alt="Ảnh bài viết"/>}
    <div className="post-meta"><span>{post.likeCount} lượt thích</span><span>{post.comments.length} bình luận</span></div>
    <div className="post-actions"><button className={post.liked?'active':''} onClick={onLike}>♥ {post.liked?'Đã thích':'Thích'}</button><span>● Bình luận</span></div>
    {post.comments.length>0&&<div className="comment-list">{post.comments.slice(-4).map(c=><div className="comment" key={c.id}>{c.photo?<img src={c.photo} alt=""/>:<div className="comment-avatar">{c.author?.display_name?.slice(0,1)||'?'}</div>}<div><b>{c.author?.display_name||'Thành viên'}</b><p>{c.body}</p></div></div>)}</div>}
    <form className="comment-form" onSubmit={submit}><div className="comment-avatar">{user.email?.slice(0,1).toUpperCase()}</div><input maxLength={1000} placeholder="Viết bình luận…" value={text} onChange={e=>setText(e.target.value)}/><button>Gửi</button></form>
  </article>
}

export function SocialNotifications({client,user,signedProfile}:{client:SupabaseClient;user:User;signedProfile:(path:string|null|undefined)=>Promise<string|null>}){
  const [items,setItems]=useState<Notice[]>([])
  const [loading,setLoading]=useState(true)
  useEffect(()=>{void (async()=>{
    const {data}=await client.from('notifications').select('id,actor_id,kind,post_id,created_at,read_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(50)
    const rows=(data||[]) as Notice[]
    const ids=[...new Set(rows.map(n=>n.actor_id))]
    const {data:profiles}=ids.length?await client.from('profiles').select('id,display_name,city,photo_path').in('id',ids):{data:[] as ProfileMini[]}
    const map=new Map((profiles||[]).map(p=>[p.id,p as ProfileMini]))
    setItems(await Promise.all(rows.map(async n=>({...n,actor:map.get(n.actor_id),photo:await signedProfile(map.get(n.actor_id)?.photo_path)}))))
    const unread=rows.filter(n=>!n.read_at).map(n=>n.id)
    if(unread.length)await client.from('notifications').update({read_at:new Date().toISOString()}).in('id',unread)
    setLoading(false)
  })()},[client,signedProfile,user.id])
  const text=(n:Notice)=>n.kind==='follow'?'đã theo dõi bạn':n.kind==='post_like'?'đã thích bài viết của bạn':'đã bình luận về bài viết của bạn'
  return <section><div className="social-heading"><div><span className="eyebrow">HOẠT ĐỘNG</span><h1>Thông báo</h1><p>Những tương tác mới trong cộng đồng.</p></div></div><div className="notice-list">{loading?<div className="card empty">Đang tải thông báo…</div>:items.length===0?<div className="card empty">Chưa có thông báo mới.</div>:items.map(n=><article className={`notice-row ${n.read_at?'':'unread'}`} key={n.id}>{n.photo?<img src={n.photo} alt=""/>:<div className="post-avatar">{n.actor?.display_name?.slice(0,1)||'?'}</div>}<div><p><b>{n.actor?.display_name||'Một thành viên'}</b> {text(n)}.</p><span>{relativeTime(n.created_at)}</span></div></article>)}</div></section>
}

export function ProfilePosts({client,user,signedProfile}:{client:SupabaseClient;user:User;signedProfile:(path:string|null|undefined)=>Promise<string|null>}){
  const [posts,setPosts]=useState<(PostRow&{media?:string|null})[]>([])
  useEffect(()=>{void (async()=>{const {data}=await client.from('posts').select('id,author_id,body,media_path,created_at').eq('author_id',user.id).order('created_at',{ascending:false}).limit(20);setPosts(await Promise.all(((data||[]) as PostRow[]).map(async p=>({...p,media:await signedPost(client,p.media_path)}))))})()},[client,user.id,signedProfile])
  return <section className="profile-posts"><div className="strip-title"><b>Bài viết của bạn</b><span>{posts.length} bài viết</span></div>{posts.length===0?<div className="profile-empty">Bạn chưa đăng bài nào.</div>:posts.map(p=><article className="profile-post" key={p.id}><span>{relativeTime(p.created_at)}</span>{p.body&&<p>{p.body}</p>}{p.media&&<img src={p.media} alt="Ảnh bài viết"/>}</article>)}</section>
}
