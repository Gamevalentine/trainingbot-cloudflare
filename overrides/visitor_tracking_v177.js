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
    const element=event.target instanceof Element?event.target.closest("a[href]"):null;
    if(!element)return;
    let target;
    try{target=new URL(element.getAttribute("href")||"",location.href);}catch{return;}
    if(target.origin!==location.origin)return;
    const label=String(
      element.getAttribute("aria-label")||
      element.getAttribute("title")||
      element.textContent||
      ""
    ).replace(/\s+/g," ").trim().slice(0,100);
    send("navigation",{label,target:target.pathname||"/"});
  },{capture:true});

  const heartbeat=()=>{
    if(document.visibilityState==="visible")send("heartbeat");
  };
  const timer=setInterval(heartbeat,120000);
  document.addEventListener("visibilitychange",heartbeat);
  addEventListener("pagehide",()=>clearInterval(timer),{once:true});
})();
