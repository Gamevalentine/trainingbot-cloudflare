/* TrainingBot - anonymous visitor tracking v177 */
(()=>{
  "use strict";

  if(/^\/admin(?:\/|\.html|$)/i.test(location.pathname))return;

  const VISITOR_KEY="tb-visitor-id-v1";
  const SESSION_KEY="tb-session-id-v1";

  const makeId=()=>{
    try{
      if(globalThis.crypto&&typeof globalThis.crypto.randomUUID==="function"){
        return globalThis.crypto.randomUUID().replace(/-/g,"");
      }
    }catch{}
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  };

  const readOrCreate=(storage,key)=>{
    try{
      let value=storage.getItem(key);
      if(!value){
        value=makeId();
        storage.setItem(key,value);
      }
      return value;
    }catch{
      return makeId();
    }
  };

  const visitorId=readOrCreate(localStorage,VISITOR_KEY);
  const sessionId=readOrCreate(sessionStorage,SESSION_KEY);

  const currentPath=()=>location.pathname||"/";

  function send(type,extra={}){
    const payload={
      visitorId,
      sessionId,
      type,
      path:currentPath(),
      referrer:document.referrer||"",
      ...extra
    };
    fetch("/api/visitor-events",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload),
      credentials:"same-origin",
      cache:"no-store",
      keepalive:true
    }).catch(()=>{});
  }

  send("page_view");

  document.addEventListener("click",event=>{
    const source=event.target instanceof Element?event.target:null;
    if(!source)return;

    const link=source.closest("a[href]");
    if(link){
      let target;
      try{target=new URL(link.getAttribute("href")||"",location.href);}catch{return;}
      if(target.origin!==location.origin)return;
      const label=String(
        link.getAttribute("aria-label")||
        link.getAttribute("title")||
        link.textContent||
        ""
      ).replace(/\s+/g," ").trim().slice(0,100);
      send("navigation",{label,target:target.pathname||"/"});
      return;
    }

    const control=source.closest("button,[role='tab'],[role='button'],[aria-expanded]");
    if(!control)return;
    const trackable=
      control.matches(".menu-button,.icon-button,[role='tab'],[aria-expanded],[data-beta-major],.light-signup-btn")||
      !!control.closest("nav");
    if(!trackable)return;

    const label=String(
      control.getAttribute("aria-label")||
      control.getAttribute("title")||
      control.textContent||
      ""
    ).replace(/\s+/g," ").trim().slice(0,100);
    if(!label)return;
    send("navigation",{label,target:currentPath()});
  },{capture:true});

  const heartbeat=()=>{
    if(document.visibilityState==="visible")send("heartbeat");
  };
  const timer=setInterval(heartbeat,120000);
  document.addEventListener("visibilitychange",heartbeat);
  addEventListener("pagehide",()=>clearInterval(timer),{once:true});
})();
