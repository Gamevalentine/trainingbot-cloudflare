
/* TrainingBot dynamic hero slides, 10 seconds each. Read-only APIs and existing download endpoints. */
(()=>{"use strict";
 const root=document.getElementById("tb203Spotlight"),frame=document.getElementById("tb203SlideFrame"),dots=document.getElementById("tb203Dots");
 const prev=document.getElementById("tb203Prev"),next=document.getElementById("tb203Next");
 if(!root||!frame||!dots||!prev||!next)return;
 const TEN_SECONDS=10000,reduced=matchMedia?.("(prefers-reduced-motion: reduce)")?.matches||false;
 let slides=[],active=0,timer=0,hover=false,focus=false;
 const el=(tag,cls,txt)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(txt!==undefined)node.textContent=txt;return node;};
 const vnum=v=>{const m=String(v||"").match(/v?(\d+)\.(\d+)\.(\d+)/i);return m?(+m[1]*1000000 + +m[2]*1000 + +m[3]):0;};
 const localImage=(value,fallback)=>{if(!value)return fallback;try{const u=new URL(value,location.origin);return u.origin===location.origin?u.href:fallback;}catch{return fallback;}};
 function latestFlash(){
  const versions=[...document.querySelectorAll("#tbFlashMount .tb-flash-card")].map(card=>({
   version:card.querySelector("[data-flash-download-version]")?.dataset.flashDownloadVersion||"",
   url:card.querySelector('a[href^="/download/flash-"]')?.getAttribute("href")||"",
   image:card.querySelector(".tb-flash-image")?.getAttribute("src")||""
  })).filter(x=>/^v\d+\.\d+\.\d+$/i.test(x.version)&&/^\/download\/flash-v\d+-\d+-\d+$/.test(x.url));
  versions.sort((a,b)=>vnum(b.version)-vnum(a.version));
  const f=versions[0];
  return f?{type:"flash",label:"FLASH BETA · MỚI NHẤT",title:"PUBG MOBILE FLASH BETA "+f.version.toUpperCase(),
   meta:"Đã mở tải · Phiên bản Flash Beta",image:localImage(f.image,"/pubg-mobile-light-avatar.webp"),
   download:f.url,detail:"/#tbFlashMount"}:null;
 }
 async function latestBeta(){
  const r=await fetch("/api/beta-versions",{cache:"no-store"});if(!r.ok)throw Error("beta");
  const data=await r.json();if(!data.ok||!Array.isArray(data.versions))throw Error("beta data");
  const v=data.versions.filter(x=>x.status==="released"&&x.download_url&&/^V\d+\.\d+\.\d+$/i.test(x.version||""))
   .sort((a,b)=>vnum(b.version)-vnum(a.version))[0];
  if(!v)return null;
  return {type:"beta",label:"PUBG BETA · MỚI NHẤT",title:"PUBG MOBILE BETA "+v.version.toUpperCase(),
   meta:(v.arch||"Android")+" · Đã mở tải",image:"/pubg-game-avatar.webp?v=140",
   download:"/download/beta/"+encodeURIComponent(v.version),detail:"/ban-cap-nhat"};
 }
 async function news(){
  const r=await fetch("/api/posts?limit=6",{cache:"no-store"});if(!r.ok)throw Error("posts");
  const data=await r.json();if(!data.ok||!Array.isArray(data.posts))throw Error("posts data");
  return data.posts.filter(p=>/^[a-z0-9-]{1,180}$/.test(String(p.slug||""))).slice(0,6).map((p,i)=>{
   const d=new Date(p.published_at);
   return {type:"news",label:i===0?"TIN MỚI NHẤT":"TIN TỨC TRAININGBOT",title:String(p.title||"Bài viết"),
    meta:Number.isNaN(d.getTime())?"TrainingBot":new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"}).format(d),
    image:localImage(p.cover_url,"/pubg-game-avatar.webp?v=140"),detail:"/bai-viet/"+p.slug};
  });
 }
 const stop=()=>{if(timer){clearTimeout(timer);timer=0;}};
 const resume=()=>{stop();if(slides.length>1&&!hover&&!focus&&!document.hidden&&!reduced)timer=setTimeout(()=>show(active+1),TEN_SECONDS);};
 function show(index){
  if(!slides.length)return;
  active=(index+slides.length)%slides.length;
  const x=slides[active],card=el("div","tb203-slide");
  card.style.background=x.type==="news"?"#112640":"radial-gradient(circle at 60% 18%,#3a3374,#0b2344 65%,#080f24)";
  const image=el("img",x.type==="news"?"":"tb203-game");image.src=x.image;image.alt="";image.decoding="async";image.loading="lazy";
  image.onerror=()=>{if(!image.dataset.fallback){image.dataset.fallback="1";image.src="/pubg-game-avatar.webp?v=140";}};
  const cover=el("a","tb203-cover-link");cover.href=x.detail;cover.setAttribute("aria-label","Xem chi tiết "+x.title);
  const copy=el("div","tb203-copy"),tag=el("strong","",x.label),title=el("h2","",x.title),meta=el("p","",x.meta);
  const actions=el("div","tb203-actions");
  if(x.download){const down=el("a","tb203-download","↓ Tải xuống");down.href=x.download;actions.append(down);}
  const view=el("a","tb203-view",x.download?"Xem chi tiết →":"Đọc bài viết →");view.href=x.detail;actions.append(view);
  copy.append(tag,title,meta,actions);card.append(image,cover,copy);frame.replaceChildren(card);
  dots.replaceChildren(...slides.map((slide,i)=>{
    const dot=el("button");dot.type="button";dot.setAttribute("aria-current",String(i===active));
    dot.setAttribute("aria-label","Chuyển đến ảnh "+(i+1)+": "+slide.title);
    dot.addEventListener("click",()=>show(i));return dot;
  }));
  prev.disabled=next.disabled=slides.length<2;
  root.setAttribute("aria-label","Tin nổi bật và bản tải PUBG Mobile, ảnh "+(active+1)+"/"+slides.length);
  resume();
 }
 function setSlides(items){
  const previous=slides[active]?.detail;
  slides=items.filter(Boolean);
  if(!slides.length){frame.replaceChildren(el("div","tb203-loading","Không có nội dung nổi bật."));dots.replaceChildren();prev.disabled=next.disabled=true;stop();return;}
  const index=slides.findIndex(x=>x.detail===previous);
  show(index>=0?index:0);
 }
 const flash=latestFlash();
 if(flash)setSlides([flash]);
 Promise.allSettled([latestBeta(),news()]).then(([beta,posts])=>{
  const b=beta.status==="fulfilled"?beta.value:null;
  const articles=posts.status==="fulfilled"?posts.value:[];
  setSlides([b,flash,...articles]);
 });
 prev.addEventListener("click",()=>show(active-1));
 next.addEventListener("click",()=>show(active+1));
 root.addEventListener("mouseenter",()=>{hover=true;stop();});
 root.addEventListener("mouseleave",()=>{hover=false;resume();});
 root.addEventListener("focusin",()=>{focus=true;stop();});
 root.addEventListener("focusout",e=>{if(!root.contains(e.relatedTarget)){focus=false;resume();}});
 document.addEventListener("visibilitychange",resume);
 window.addEventListener("pagehide",stop,{once:true});
})();
