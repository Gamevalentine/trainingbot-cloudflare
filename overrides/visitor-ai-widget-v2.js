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
 let typing=false,baselineVisualHeight=0,blurTimer=null;
 const toggles=()=>document.querySelectorAll("[data-tb-ai-toggle]");
 const expanded=active=>toggles().forEach(link=>link.setAttribute("aria-expanded",active?"true":"false"));
 const touchMobile=()=>window.matchMedia?.("(max-width:700px) and (pointer:coarse)")?.matches===true;
 function clearKeyboardLayout(){
   panel.classList.remove("tb-ai-keyboard");
   for(const name of ["--tb-ai-vv-top","--tb-ai-vv-left","--tb-ai-vv-width","--tb-ai-vv-height"])
     panel.style.removeProperty(name);
 }
 function syncKeyboardLayout(){
   const vv=window.visualViewport;
   if(panel.hidden||!vv||!touchMobile()){
     clearKeyboardLayout();return;
   }
   if(!typing){
     baselineVisualHeight=vv.height;
     clearKeyboardLayout();return;
   }
   // The visual viewport shrinks on iOS when the on-screen keyboard appears.
   // Keep the Send button above that keyboard without disabling user zoom.
   if(baselineVisualHeight-vv.height<90){
     clearKeyboardLayout();return;
   }
   const inset=6;
   panel.style.setProperty("--tb-ai-vv-top",Math.max(0,vv.offsetTop+inset)+"px");
   panel.style.setProperty("--tb-ai-vv-left",Math.max(0,vv.offsetLeft+inset)+"px");
   panel.style.setProperty("--tb-ai-vv-width",Math.max(220,vv.width-inset*2)+"px");
   panel.style.setProperty("--tb-ai-vv-height",Math.max(180,vv.height-inset*2)+"px");
   panel.classList.add("tb-ai-keyboard");
 }
 window.visualViewport?.addEventListener("resize",syncKeyboardLayout);
 window.visualViewport?.addEventListener("scroll",syncKeyboardLayout);
 window.addEventListener("resize",syncKeyboardLayout);
 function closeWidget(){
   typing=false;
   if(blurTimer!==null){clearTimeout(blurTimer);blurTimer=null;}
   clearKeyboardLayout();
   iframe?.contentWindow?.postMessage({source:"trainingbot-site-widget",event:"dismiss"},ORIGIN);
   panel.hidden=true;expanded(false);
   if(openedFrom?.isConnected)openedFrom.focus({preventScroll:true});
 }
 function openWidget(source){
   openedFrom=source;
   panel.hidden=false;expanded(true);
   baselineVisualHeight=window.visualViewport?.height||window.innerHeight;
   syncKeyboardLayout();
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
   if(event.data.event==="input-focus"){
     typing=true;
     if(blurTimer!==null){clearTimeout(blurTimer);blurTimer=null;}
     syncKeyboardLayout();return;
   }
   if(event.data.event==="input-blur"){
     if(blurTimer!==null)clearTimeout(blurTimer);
     // Let the iPhone keyboard finish retracting before restoring the popup.
     blurTimer=setTimeout(()=>{
       blurTimer=null;typing=false;syncKeyboardLayout();
     },250);
     return;
   }
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
