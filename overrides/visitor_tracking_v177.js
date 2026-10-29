/* TrainingBot - anonymous visitor tracking v177 */
(()=>{
  "use strict";

  if(/^\/admin(?:\/|\.html|$)/i.test(location.pathname))return;
  // Opt-out ONLY when a developer intentionally opens a marked QA URL.
  // This is not bot detection, and it cannot identify earlier test traffic.
  if(new URLSearchParams(location.search||"").get("tb_internal_qa")==="1")return;

  const VISITOR_KEY="tb-visitor-id-v1"; // Keep existing anonymous IDs.
  const VISIT_KEY="tb-shared-visit-v2";
  const INACTIVITY_MS=30*60*1000;

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
  function currentVisitId(){
    const now=Date.now();
    try{
      let state;
      try{state=JSON.parse(localStorage.getItem(VISIT_KEY)||"null");}catch{state=null;}
      if(!state||!/^[A-Za-z0-9_-]{8,80}$/.test(state.id||"")||
         !Number.isFinite(state.last)||now-state.last>INACTIVITY_MS||now<state.last-60000){
        state={id:makeId(),last:now};
      }
      state.last=now;
      localStorage.setItem(VISIT_KEY,JSON.stringify(state));
      // Read back: another tab might have updated the shared visit concurrently.
      const latest=JSON.parse(localStorage.getItem(VISIT_KEY)||"null");
      return latest?.id||state.id;
    }catch{
      // Storage-disabled browsers cannot be reliably deduplicated across tabs.
      return readOrCreate(sessionStorage,"tb-session-id-fallback-v2");
    }
  }

  const currentPath=()=>location.pathname||"/";
  // Read only explicit campaign parameters; never send arbitrary query strings,
  // which may contain private tokens or user-entered content.
  const campaign=(()=>{
    const params=new URLSearchParams(location.search||"");
    const take=name=>String(params.get(name)||"").slice(0,80);
    return {
      utmSource:take("utm_source"),utmMedium:take("utm_medium"),
      utmCampaign:take("utm_campaign"),utmTerm:take("utm_term"),
      utmContent:take("utm_content")
    };
  })();

  function send(type,extra={}){
    const payload={
      visitorId,
      sessionId:currentVisitId(),
      type,
      path:currentPath(),
      referrer:document.referrer||"",
      ...campaign,
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
