(()=>{
  const social=document.querySelector('.tb-social-links');
  if(social){
    social.innerHTML=`
      <a href="https://www.tiktok.com/@trainingbot.ai2" target="_blank" rel="noopener noreferrer" aria-label="TikTok" title="TikTok">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 3v10.1a4.6 4.6 0 1 1-3.4-4.45v2.55a2.1 2.1 0 1 0 1.1 1.9V3h2.3Zm0 0c.55 2.2 2.02 3.58 4.5 3.9v2.35c-1.7-.1-3.18-.67-4.5-1.7V3Z"/></svg>
      </a>
      <a href="mailto:trainingbot.ai2@gmail.com" aria-label="Email" title="Email">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Zm0 2 8 5.3 8-5.3H4Zm16 9V9.9l-7.45 4.95a1 1 0 0 1-1.1 0L4 9.9v6.6h16Z"/></svg>
      </a>
      <a href="https://discord.com/invite/6DE6sBhX" target="_blank" rel="noopener noreferrer" aria-label="Discord" title="Discord">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 5.4A14.5 14.5 0 0 1 10 4.7l.35.7a11.3 11.3 0 0 1 3.3 0l.35-.7c.98.16 1.92.4 2.8.7 2.1 3.15 2.67 6.2 2.38 9.2A11.9 11.9 0 0 1 15.72 16l-.83-1.08c.54-.2 1.04-.45 1.5-.75l-.37-.3c-2.75 1.26-5.72 1.26-8.44 0l-.38.3c.46.3.97.55 1.51.75L7.88 16a11.8 11.8 0 0 1-3.47-1.4c-.36-3.5.61-6.5 2.79-9.2ZM9.25 11.2c-.7 0-1.27.64-1.27 1.43s.58 1.43 1.27 1.43c.7 0 1.27-.64 1.27-1.43S9.95 11.2 9.25 11.2Zm5.5 0c-.7 0-1.27.64-1.27 1.43s.58 1.43 1.27 1.43c.7 0 1.27-.64 1.27-1.43s-.57-1.43-1.27-1.43Z"/></svg>
      </a>`;
    const style=document.createElement('style');
    style.textContent='.tb-social .tb-side-title:before{content:"👥";filter:none}.tb-social-links{gap:12px}.tb-social-links a{width:44px;height:44px;border:1px solid #26303c;background:#151c25;transition:.18s ease}.tb-social-links a:hover{border-color:#ff6a00;background:#1a222d;transform:translateY(-1px)}.tb-social-links svg{width:21px;height:21px;fill:#fff;display:block}.tb-social-links a:first-child svg{fill:#fff}.tb-social-links a:last-child svg{fill:#5865F2}';
    document.head.appendChild(style);
  }

  const btn=document.querySelector('[data-news-push]');
  if(!btn)return;
  const API='https://rvyodriafttdeizmrtkz.supabase.co/functions/v1/news-push';
  const VAPID='BGMdXR52-uyiz002Qc5rwx_ZEnU0Nif4GAZQVv2WHuFe2fnaJFM5HHznPEIc-d8Hl3Sve35s5HMS-TGUoKTA6Ko';
  const set=(text,state)=>{btn.textContent=text;btn.dataset.state=state||'';};
  const b64=s=>{const p='='.repeat((4-s.length%4)%4),r=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(r,c=>c.charCodeAt(0));};
  async function current(){
    if(!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window)){set('Thông báo chưa được hỗ trợ','unsupported');btn.disabled=true;return null;}
    const reg=await navigator.serviceWorker.register('/news-push-sw.js');
    const sub=await reg.pushManager.getSubscription();
    if(sub&&Notification.permission==='granted')set('✓ Đã bật thông báo','on');
    return {reg,sub};
  }
  btn.addEventListener('click',async()=>{
    if(btn.disabled)return;
    btn.disabled=true;
    try{
      const x=await current(); if(!x)return;
      if(x.sub){
        await fetch(API+'?action=unsubscribe',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({endpoint:x.sub.endpoint})});
        await x.sub.unsubscribe(); set('🔔 Nhận thông báo tin mới','off'); return;
      }
      const permission=await Notification.requestPermission();
      if(permission!=='granted'){set(permission==='denied'?'Thông báo đã bị chặn':'🔔 Nhận thông báo tin mới',permission);return;}
      const sub=await x.reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(VAPID)});
      const res=await fetch(API+'?action=subscribe',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({subscription:sub.toJSON()})});
      if(!res.ok){await sub.unsubscribe();throw new Error('subscribe_failed');}
      set('✓ Đã bật thông báo','on');
    }catch(e){console.error(e);set('Không thể bật thông báo','error');}
    finally{btn.disabled=false;}
  });
  current().catch(()=>set('Không thể kiểm tra thông báo','error'));
})();