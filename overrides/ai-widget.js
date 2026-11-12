"use strict";
(()=>{
  const get=id=>document.getElementById(id);
  const thread=get("tb-thread"),question=get("tb-question"),send=get("tb-send");
  const form=get("tb-form"),status=get("tb-status"),close=get("tb-close");
  const PARENT=window.location.origin;
  const API="/api/ai-preview";
  const Q="";
  let ready=false,conversationId=null,working=false;
  const notify=event=>{
    if(window.parent!==window)window.parent.postMessage({source:"trainingbot-ai-widget",event},PARENT);
  };
  function banner(text,kind="loading"){
    status.textContent=text;status.dataset.kind=kind;
  }
  function safeSource(source){
    if(!source||typeof source.url!=="string"||typeof source.title!=="string")return false;
    const u=source.url;
    if(source.type==="site_release")return u==="https://trainingbot.io.vn/ban-cap-nhat";
    if(source.type==="site_news")return /^https:\/\/trainingbot\.io\.vn\/bai-viet\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(u);
    if(source.type==="official_claim")return /^https:\/\/www\.instagram\.com\/reel\/DfbazBRtgl5\/$/.test(u)||
      /^https:\/\/www\.pubgmobile\.com\/en\/event\/(?:PUBG-MOBILE-Version-430|PUBG-MOBILE-Version-400|Official-Transformers-Collaboration|260Devnotes|250Devnotes|270Devnotes)\/$/.test(u);
    if(source.type==="wiki_snapshot")return /^https:\/\/github\.com\/Gamevalentine\/trainingbot-cloudflare\/(?:blob\/[a-f0-9]{40}\/overrides\/wiki\.html|actions\/runs\/40763409109)$/.test(u);
    return false;
  }
  function bubble(role,text,sources=[]){
    const message=document.createElement("div");
    message.className="tb-message "+(role==="user"?"tb-user":"tb-assistant");
    if(role!=="user"){
      const avatar=document.createElement("span");avatar.className="tb-small-avatar";
      avatar.setAttribute("aria-hidden","true");avatar.textContent="✦";message.append(avatar);
    }
    const body=document.createElement("div");body.className="tb-bubble";
    body.textContent=String(text).slice(0,16000);
    if(role!=="user"&&Array.isArray(sources)&&sources.length){
      const valid=sources.slice(0,6).filter(safeSource);
      if(valid.length){
        const listing=document.createElement("div");
        listing.className="tb-source-list";
        const label=document.createElement("strong");label.textContent="Nguồn tham khảo";listing.append(label);
        for(const source of valid){
          const line=document.createElement("span");line.className="tb-source-line";
          const link=document.createElement("a");
          link.href=source.url;link.target="_blank";link.rel="noopener noreferrer";
          link.textContent=source.title.slice(0,115);
          line.append(link);listing.append(line);
        }
        body.append(listing);
      }
    }
    message.append(body);thread.append(message);thread.scrollTop=thread.scrollHeight;
  }
  async function connect(){
    try{
      const response=await fetch(API+"/status"+Q,{
        method:"GET",credentials:"same-origin",cache:"no-store",redirect:"error",
        headers:{accept:"application/json"}
      });
      const s=await response.json();
      if(!response.ok||s?.ready!==true||s?.surfaces?.visitor!==true||s?.anonymousVisitorReady!==true)
        throw Error("NOT_READY");
      const session=await fetch(API+"/session"+Q,{
        method:"POST",credentials:"same-origin",cache:"no-store",redirect:"error",
        headers:{"content-type":"application/json",accept:"application/json"},body:"{}"
      });
      if(session.status===429)throw Error("RATE_LIMITED");
      if(!session.ok)throw Error("SESSION_UNAVAILABLE");
      ready=true;question.disabled=false;send.disabled=false;
      banner("● Trợ lý sẵn sàng","ready");
      // Do not summon Safari's virtual keyboard on initialization.
      // The visitor should explicitly tap the input when ready.
      notify("ready");
    }catch(err){
      ready=false;question.disabled=true;send.disabled=true;
      banner(err?.message==="RATE_LIMITED"
        ?"Đã đạt giới hạn tạo phiên. Hãy thử lại sau."
        :"Chưa kết nối được trong cửa sổ nhỏ. Chọn “Mở toàn màn hình” bên dưới.","error");
      notify("unavailable");
    }
  }
  async function submit(message){
    if(!ready||working||!message.trim())return;
    const clean=message.trim().slice(0,3000);
    question.value="";bubble("user",clean);
    working=true;send.disabled=true;banner("Đang trả lời…");
    try{
      const response=await fetch(API+"/chat"+Q,{
        method:"POST",credentials:"same-origin",cache:"no-store",redirect:"error",
        headers:{"content-type":"application/json",accept:"application/json"},
        body:JSON.stringify({surface:"visitor",message:clean,...(conversationId?{conversationId}:{})})
      });
      if(response.status===429)throw Error("RATE_LIMITED");
      if(!response.ok)throw Error("UNAVAILABLE");
      const data=await response.json();
      if(typeof data.reply!=="string"||!data.reply.trim()||data.reply.length>16000)
        throw Error("INVALID_REPLY");
      if(typeof data.conversationId==="string"&&/^[A-Za-z0-9_-]{8,100}$/.test(data.conversationId))
        conversationId=data.conversationId;
      bubble("assistant",data.reply,data.sources);
      banner("● Trợ lý sẵn sàng","ready");
    }catch(err){
      const limit=err?.message==="RATE_LIMITED";
      bubble("assistant",limit
        ?"Đã đạt giới hạn câu hỏi. Bạn có thể thử lại sau."
        :"Không thể trả lời ngay lúc này. Bạn có thể thử qua trang AI toàn màn hình.");
      if(limit){ready=false;question.disabled=true;banner("Đã đạt giới hạn sử dụng","error");}
      else{banner("Dịch vụ tạm gián đoạn","error");}
    }finally{
      working=false;send.disabled=!ready;
    }
  }
  form.addEventListener("submit",event=>{
    event.preventDefault();void submit(question.value);
  });
  question.addEventListener("keydown",event=>{
    if(event.key==="Enter"&&!event.shiftKey&&!event.isComposing){
      event.preventDefault();form.requestSubmit();
    }
  });
  // Let the parent dialog follow the shrinking iPhone visual viewport only
  // when the visitor is actually typing, never on initial chat connection.
  question.addEventListener("focus",()=>notify("input-focus"));
  question.addEventListener("blur",()=>notify("input-blur"));
  close.addEventListener("click",()=>{
    if(document.activeElement===question)question.blur();
    notify("close");
  });
  window.addEventListener("message",event=>{
    if(event.origin!==PARENT||event.data?.source!=="trainingbot-site-widget")return;
    // On touch devices programmatic focus scrolls/zooms Safari even when
    // preventScroll is requested. Only desktop receives automatic focus.
    if(event.data.event==="focus"&&ready&&
      window.matchMedia?.("(pointer:fine)")?.matches)
      question.focus({preventScroll:true});
    if(event.data.event==="dismiss"&&document.activeElement===question)
      question.blur();
  });
  void connect();
})();