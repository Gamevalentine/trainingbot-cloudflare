(()=>{
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