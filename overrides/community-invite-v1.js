/* TrainingBot public community welcome - first view per tab session.
   No tracking, cookies, analytics or remote code. Visitors may always close. */
"use strict";
(()=>{
  const FLAG="tb-community-invite-seen-v1";
  function seen(){
    try{return sessionStorage.getItem(FLAG)==="1";}catch{return false;}
  }
  function markSeen(){
    try{sessionStorage.setItem(FLAG,"1");}catch{/* private mode still works */}
  }
  function make(tag,klass,label){
    const node=document.createElement(tag);
    if(klass)node.className=klass;
    if(label!==undefined)node.textContent=label;
    return node;
  }
  function init(){
    if(seen()||document.querySelector("[data-tb-community-invite]"))return;
    const previous=document.activeElement;
    const veil=make("div","tb-community-invite");
    veil.hidden=true;
    veil.setAttribute("data-tb-community-invite","");
    veil.setAttribute("role","presentation");
    const card=make("section","tb-community-invite-card");
    card.setAttribute("role","dialog");
    card.setAttribute("aria-modal","true");
    card.setAttribute("aria-labelledby","tb-community-invite-heading");
    card.setAttribute("aria-describedby","tb-community-invite-description");

    const x=make("button","tb-community-invite-close","×");
    x.type="button";x.setAttribute("aria-label","Đóng thông báo cộng đồng");
    const crest=make("div","tb-community-invite-crest","✦");
    crest.setAttribute("aria-hidden","true");
    const eyebrow=make("p","tb-community-invite-eyebrow","Cộng đồng TrainingBot");
    const title=make("h2","tb-community-invite-title",
      "Đừng bỏ lỡ tin PUBG MOBILE mới nhất!");
    title.id="tb-community-invite-heading";
    const body=make("p","tb-community-invite-copy",
      "Tham gia Telegram để theo dõi thông báo về PUBG MOBILE, bản Beta và lịch cập nhật. Kết nối trên Discord để thảo luận và chia sẻ cùng cộng đồng.");
    body.id="tb-community-invite-description";
    const actions=make("div","tb-community-invite-actions");
    function link(href,style,label,subtitle){
      const a=make("a","tb-community-invite-action "+style);
      a.href=href;a.target="_blank";a.rel="noopener noreferrer";
      const main=make("strong","",label),small=make("small","",subtitle);
      a.append(main,small);
      actions.append(a);
      return a;
    }
    const telegram=link("https://t.me/TraininggBott","telegram",
      "Tham gia Telegram","Theo dõi thông báo mới");
    const discord=link("https://discord.com/invite/5u5PbZMqx","discord",
      "Tham gia Discord","Giao lưu & thảo luận");
    const later=make("button","tb-community-invite-later","Để sau, tiếp tục xem web");
    later.type="button";
    card.append(x,crest,eyebrow,title,body,actions,later);
    veil.append(card);
    document.body.append(veil);

    let open=false;
    const focusables=[x,telegram,discord,later];
    function dismiss(){
      if(!open)return;
      open=false;markSeen();
      document.body.classList.remove("tb-community-invite-active");
      veil.hidden=true;
      document.removeEventListener("keydown",handleKeys,true);
      if(previous&&previous.isConnected&&typeof previous.focus==="function"&&
         previous!==document.body)
        previous.focus({preventScroll:true});
    }
    function handleKeys(event){
      if(!open)return;
      if(event.key==="Escape"){
        event.preventDefault();dismiss();return;
      }
      if(event.key!=="Tab")return;
      const index=focusables.indexOf(document.activeElement);
      if(event.shiftKey&&(index<=0)){event.preventDefault();later.focus();}
      else if(!event.shiftKey&&index===focusables.length-1){
        event.preventDefault();x.focus();
      }
    }
    x.addEventListener("click",dismiss);
    later.addEventListener("click",dismiss);
    veil.addEventListener("click",event=>{if(event.target===veil)dismiss();});
    for(const a of [telegram,discord])a.addEventListener("click",dismiss);
    if(seen())return;
    open=true;veil.hidden=false;
    document.body.classList.add("tb-community-invite-active");
    document.addEventListener("keydown",handleKeys,true);
    x.focus({preventScroll:true});
  }
  if(document.readyState==="loading")
    document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();