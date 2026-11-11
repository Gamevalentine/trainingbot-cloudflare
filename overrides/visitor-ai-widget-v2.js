/* TrainingBot in-page AI launcher. The iframe now stays first-party on
   trainingbot.io.vn so iOS Safari does not block a third-party chat frame.
   Its API is a scoped server-side bridge to the quota-limited Visitor AI. */
"use strict";
(()=>{
 const panel=document.getElementById("tb-ai-popup");
 if(!panel)return;
 const ORIGIN=window.location.origin;
 const FRAME="/ai-widget";
 let iframe=null,openedFrom=null,handshake=false,pendingCheck=null;
 const toggles=()=>document.querySelectorAll("[data-tb-ai-toggle]");
 const expanded=active=>toggles().forEach(link=>link.setAttribute("aria-expanded",active?"true":"false"));
 function closeWidget(){
   panel.hidden=true;expanded(false);
   if(openedFrom?.isConnected)openedFrom.focus({preventScroll:true});
 }
 function openWidget(source){
   openedFrom=source;
   panel.hidden=false;expanded(true);
   if(!iframe){
     iframe=document.createElement("iframe");
     iframe.title="Trò chuyện cùng TrainingBot AI";
     iframe.referrerPolicy="no-referrer";
     iframe.setAttribute("sandbox","allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox");
     iframe.setAttribute("allow","microphone 'none'; camera 'none'; geolocation 'none'");
     iframe.src=FRAME;
     const mount=panel.querySelector(".tb-ai-frame-mount");
     if(!mount){closeWidget();return;}
     mount.append(iframe);
     pendingCheck=setTimeout(()=>{
       if(handshake)return;
       const backup=panel.querySelector(".tb-ai-popup-backup");
       if(backup)backup.hidden=false;
     },14000);
   }else{
     iframe.contentWindow?.postMessage({source:"trainingbot-site-widget",event:"focus"},ORIGIN);
   }
 }
 document.addEventListener("click",event=>{
   const link=event.target.closest?.("[data-tb-ai-toggle]");
   if(!link)return;
   if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
   event.preventDefault();
   if(panel.hidden)openWidget(link);else closeWidget();
 });
 document.addEventListener("keydown",event=>{
   if(event.key==="Escape"&&!panel.hidden){event.preventDefault();closeWidget();}
 });
 document.addEventListener("pointerdown",event=>{
   if(panel.hidden)return;
   if(panel.contains(event.target)||event.target.closest?.("[data-tb-ai-toggle]"))return;
   // Keep popup open when interacting with the underlying site.
 });
 window.addEventListener("message",event=>{
   if(event.origin!==ORIGIN||event.source!==iframe?.contentWindow||
     event.data?.source!=="trainingbot-ai-widget")return;
   if(event.data.event==="close"){closeWidget();return;}
   if(["ready","unavailable"].includes(event.data.event)){
     handshake=true;
     if(pendingCheck!==null){clearTimeout(pendingCheck);pendingCheck=null;}
     if(event.data.event==="ready"){
       const backup=panel.querySelector(".tb-ai-popup-backup");
       if(backup)backup.hidden=true;
     }
   }
 });
})();
