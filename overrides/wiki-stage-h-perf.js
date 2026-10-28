/* Wiki H.2/H.3 lightweight resource hints + lab performance observations.
 * Does not mutate DATA, the API, navigation, or above-the-fold branding.
 * The client metrics are diagnostic only, not field Core Web Vitals.
 */
(()=>{
"use strict";
if(window.__TB_WIKI_H__)return;
const state=window.__TB_WIKI_H__={ready:false,version:"h1",imagesPrepared:0,metrics:{fcp:null,lcp:null,cls:0,longTasks:0,interactionSampleMs:null}};
const metrics=state.metrics;
const observers=[];
function observe(type,handler,options){
 try{const obs=new PerformanceObserver(list=>list.getEntries().forEach(handler));
  obs.observe(options||{type,buffered:true});observers.push(obs);}catch(_){}
}
observe("paint",entry=>{if(entry.name==="first-contentful-paint")metrics.fcp=Math.round(entry.startTime)});
observe("largest-contentful-paint",entry=>{metrics.lcp=Math.round(entry.startTime)});
observe("layout-shift",entry=>{if(!entry.hadRecentInput)metrics.cls=Math.round((metrics.cls+entry.value)*10000)/10000});
observe("longtask",()=>{metrics.longTasks++});
function prepare(){
 const grid=document.getElementById("tbWikiGrid");
 if(!grid)return false;
 const images=[...grid.querySelectorAll(".tb-wiki-card img")];
 for(let i=0;i<images.length;i++){
  const img=images[i];
  // First row stays eager so the visible first card is not delayed.
  const desired=i<4?"eager":"lazy";
  if(img.dataset.tbHImage!=="1"){img.dataset.tbHImage="1";state.imagesPrepared++;}
  if(img.loading!==desired)img.loading=desired;
  img.decoding="async";
  img.fetchPriority=i>=4?"low":"auto";
 }
 if(!state.ready){
  let queued=false;
  const observer=new MutationObserver(()=>{
   if(queued)return;queued=true;
   queueMicrotask(()=>{queued=false;prepare()});
  });
  observer.observe(grid,{childList:true,subtree:true});
  state.ready=true;
 }
 return true;
}
let attempts=0;
function boot(){
 if(prepare())return;
 if(++attempts<=200)setTimeout(boot,75);
 else state.error="Wiki grid unavailable after boot";
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
else boot();
// Reveal stable Wiki after F/E initialization, with a short two-frame settle.
// The H build also has an independent 3.2s fallback if this script fails.
let revealAttempts=0;
function revealAfterMount(){
 if(!window.__TB_WIKI_F__?.ready||!window.__TB_WIKI_E__?.ready){
  if(++revealAttempts<140)setTimeout(revealAfterMount,20);
  return;
 }
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  setTimeout(()=>document.body.classList.add("tb-h-layout-ready"),180);
 }));
}
revealAfterMount();
state.capture=()=>({metrics:{...metrics},imagesPrepared:state.imagesPrepared,
 navigation:performance.getEntriesByType("navigation").map(e=>({domContentLoaded:Math.round(e.domContentLoadedEventEnd),loadEvent:Math.round(e.loadEventEnd),transferSize:e.transferSize})),
 resources:performance.getEntriesByType("resource").length});
})();
