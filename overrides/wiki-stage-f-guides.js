/* TrainingBot Wiki Stage F — source-aware practice guide, presentation only.
 * Editorial practice suggestions must never be presented as verified gameplay stats.
 * Uses existing C/D evidence files read-only; no Worker, API, D1 or R2 writes.
 */
(()=>{
"use strict";
if(window.__TB_WIKI_F__)return;
const api=window.__TB_WIKI_F__={ready:false,expanded:false,category:"all",query:"",visible:0};
const make=(tag,klass,content)=>{
 const el=document.createElement(tag);
 if(klass)el.className=klass;
 if(content!==undefined)el.textContent=String(content);
 return el;
};
const safeSource=url=>{
 try{const parsed=new URL(url);return parsed.protocol==="https:"&&
 ["www.pubgmobile.com","pubgm.vnggames.com"].includes(parsed.hostname)?parsed.href:null}
 catch{return null}
};
const normalize=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D").toLowerCase().trim();
let guides, sourcesC, sourcesD, section, list, status, search, toggle, controls, count;
const getTab=kind=>document.querySelector('#tbWikiTabs .tb-wiki-tab[data-tab="'+kind+'"]');
const visibleGuides=()=>guides.filter(guide=>(api.category==="all"||guide.category===api.category)&&
 (!api.query||normalize([guide.title,guide.summary,guide.caution,guide.steps.join(" ")].join(" ")).includes(normalize(api.query))));
function linkForGuide(id){
 const u=new URL(location.href);u.hash="";u.searchParams.delete("compare");u.searchParams.set("guide",id);return u.href;
}
function announce(message){if(status)status.textContent=message}
function sourceFor(ref){
 if(ref.registry==="c"){
  const item=sourcesC.weapons?.[ref.entity]?.history?.find(x=>x.sourceId===ref.sourceId);
  const src=sourcesC.sources?.[ref.sourceId];
  if(!item||!src)return null;
  return {title:src.title,summary:item.summary,version:src.version,date:src.publishedAt,url:safeSource(src.url)};
 }
 if(ref.registry==="d"){
  const item=sourcesD.maps?.[ref.entity]||sourcesD.vehicles?.[ref.entity]||sourcesD.unlisted?.[ref.entity];
  const src=sourcesD.sources?.[ref.sourceId];
  if(!item||!src||item.sourceId!==ref.sourceId)return null;
  return {title:src.title,summary:item.note,version:src.version,date:src.publishedAt,url:safeSource(src.url)};
 }
 return null;
}
function references(guide){
 const wrap=make("div","tb-f-evidence");
 wrap.append(make("strong","","Ghi chú phát hành có nguồn (không xác minh bài tập ở trên)"));
 if(!guide.evidence.length)wrap.append(make("p","","Chưa có ghi chú phát hành phù hợp trong kho nguồn C/D. Các bước trên chỉ là gợi ý luyện tập."));
 for(const ref of guide.evidence){
  const e=sourceFor(ref);
  if(!e){wrap.append(make("p","tb-f-unverified","Nguồn cho mục này chưa đủ điều kiện đối chiếu."));continue}
  const box=make("div","tb-f-release");
  box.append(make("span","tb-f-release-version","Bản "+e.version+" · "+e.date));
  box.append(make("p","",e.summary));
  if(e.url){
   const a=make("a","tb-f-source-link","Xem thông báo gốc: "+e.title);
   a.href=e.url;a.target="_blank";a.rel="noopener noreferrer external";box.append(a);
  }else box.append(make("p","tb-f-unverified","Địa chỉ nguồn không đạt danh sách cho phép."));
  wrap.append(box);
 }
 return wrap;
}
function gotoWiki(kind,name){
 if(kind==="mobility")kind="vehicles";
 const tab=getTab(kind);
 if(!tab){announce("Không tìm được danh mục Wiki.");return}
 if(window.__TB_WIKI_E__?.selecting)window.__TB_WIKI_E__.clear();
 tab.click();
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  const grid=document.getElementById("tbWikiGrid");
  if(!name){document.getElementById("tbWikiTabs")?.scrollIntoView({behavior:"instant",block:"start"});return}
  const card=[...(grid?.querySelectorAll(".tb-wiki-card")||[])].find(x=>x.querySelector("h3")?.textContent.trim()===name);
  if(!card){announce("Mục "+name+" chưa có thẻ tương ứng trong danh mục; đã mở danh mục để bạn tra cứu.");getTab(kind)?.scrollIntoView();return}
  card.scrollIntoView({behavior:"instant",block:"center"});
  card.click();
 }));
}
function share(id,button){
 const url=linkForGuide(id);
 const fallback=()=>{const input=make("input");input.value=url;input.readOnly=true;input.setAttribute("aria-label","Đường dẫn hướng dẫn");button.after(input);input.select();input.focus();announce("Đã chọn đường dẫn; nhấn Ctrl+C để sao chép.");};
 if(navigator.clipboard?.writeText)navigator.clipboard.writeText(url).then(()=>announce("Đã sao chép liên kết hướng dẫn.")).catch(fallback);
 else fallback();
}
function cardFor(guide){
 const card=make("article","tb-f-card");card.id="tbFGuide-"+guide.id;
 const top=make("div","tb-f-card-top");
 const kind=guides.meta.categories.find(c=>c.id===guide.category)?.title||"Hướng dẫn";
 top.append(make("span","tb-f-type",kind),make("span","tb-f-level",guide.level));
 card.append(top,make("h3","",guide.title),make("p","tb-f-lead",guide.summary));
 const detail=make("details","tb-f-detail");
 const summary=make("summary","","Xem bài tập, nguồn và liên kết Wiki");
 detail.append(summary);
 const body=make("div","tb-f-detail-body");
 body.append(make("strong","tb-f-editorial","Gợi ý luyện tập · biên tập TrainingBot (không phải số liệu chính thức)"));
 const steps=make("ol","tb-f-steps");
 for(const step of guide.steps)steps.append(make("li","",step));
 body.append(steps,make("p","tb-f-caution",guide.caution),references(guide));
 const nav=make("div","tb-f-links");
 for(const link of guide.related){
  const dest=link.kind==="weapons"?"vũ khí":link.kind==="attachments"?"phụ kiện":link.kind==="maps"?"bản đồ":"phương tiện";
  const button=make("button","tb-f-nav","Tra cứu "+(link.name||dest));
  button.type="button";button.addEventListener("click",()=>gotoWiki(link.kind,link.name));
  nav.append(button);
 }
 const copy=make("button","tb-f-share","Chia sẻ hướng dẫn");copy.type="button";
 copy.addEventListener("click",()=>share(guide.id,copy));nav.append(copy);
 body.append(nav);detail.append(body);card.append(detail);
 return card;
}
function render(){
 const selected=visibleGuides();api.visible=selected.length;
 const byId=new Set(selected.map(g=>g.id));
 for(const card of list.querySelectorAll(".tb-f-card")){
  card.hidden=!byId.has(card.id.slice("tbFGuide-".length));
 }
 count.textContent=selected.length+" / "+guides.length+" hướng dẫn";
 for(const b of controls.querySelectorAll("button[data-category]")){
  const yes=b.dataset.category===api.category;
  b.setAttribute("aria-pressed",String(yes));b.classList.toggle("active",yes);
 }
 let empty=section.querySelector(".tb-f-empty");
 if(!empty){empty=make("p","tb-f-empty","Không tìm thấy bài phù hợp. Thử từ khóa khác hoặc chọn Tất cả.");list.after(empty)}
 empty.hidden=selected.length!==0;
}
function expand(flag){
 api.expanded=flag;section.classList.toggle("tb-f-expanded",flag);
 toggle.setAttribute("aria-expanded",String(flag));
 toggle.textContent=flag?"Thu gọn cẩm nang":"Khám phá cẩm nang thực chiến";
 const content=section.querySelector(".tb-f-content");content.hidden=!flag;
}
function restore(){
 const url=new URL(location.href),id=url.searchParams.get("guide");
 if(!id)return;
 const match=guides.find(g=>g.id===id);
 if(!match){url.searchParams.delete("guide");history.replaceState(history.state,"",url.pathname+url.search+url.hash);return}
 api.category=match.category;api.query="";search.value="";
 expand(true);render();
 const card=document.getElementById("tbFGuide-"+id);
 if(card){card.querySelector("details").open=true;
  requestAnimationFrame(()=>card.scrollIntoView({behavior:"instant",block:"start"}));}
}
function mount(data,c,d){
 const root=document.querySelector(".tb-wiki-shell");
 if(!root||!document.getElementById("tbWikiTabs"))throw Error("Wiki shell unavailable");
 if(data.schemaVersion!=="wiki-f1"||!Array.isArray(data.guides)||!Array.isArray(data.categories)||c.schemaVersion!=="wiki-c1"||d.schemaVersion!=="wiki-d1")
  throw Error("Evidence schema mismatch");
 if(new Set(data.guides.map(g=>g.id)).size!==data.guides.length)throw Error("Duplicate guide ids");
 guides=data.guides;guides.meta=data;sourcesC=c;sourcesD=d;
 section=make("section","tb-f-section");section.id="tbFGuides";section.setAttribute("aria-labelledby","tbFHeading");
 const head=make("div","tb-f-head");
 const copy=make("div","tb-f-head-copy");
 copy.append(make("small","","TRAININGBOT / CẨM NANG"));
 const h=make("h2","","Hướng dẫn thực chiến");h.id="tbFHeading";
 copy.append(h,make("p","","Bài luyện tập theo tình huống, ghi rõ giới hạn dữ liệu và nguồn phiên bản khi có."));
 toggle=make("button","tb-f-toggle","Khám phá cẩm nang thực chiến");toggle.type="button";toggle.setAttribute("aria-expanded","false");
 toggle.setAttribute("aria-controls","tbFContent");
 toggle.addEventListener("click",()=>expand(!api.expanded));
 head.append(copy,toggle);section.append(head);
 const banner=make("p","tb-f-disclaimer",data.sourcePolicy);section.append(banner);
 const content=make("div","tb-f-content");content.id="tbFContent";content.hidden=true;
 const bar=make("div","tb-f-toolbar");
 controls=make("div","tb-f-categories");controls.setAttribute("role","group");controls.setAttribute("aria-label","Nhóm hướng dẫn");
 for(const cat of data.categories){
  const b=make("button","tb-f-category",cat.title);b.type="button";b.dataset.category=cat.id;
  b.addEventListener("click",()=>{api.category=cat.id;render()});controls.append(b);
 }
 const inputWrap=make("label","tb-f-search-label");
 inputWrap.append(make("span","","Tìm hướng dẫn"));
 search=make("input","tb-f-search");search.type="search";search.placeholder="Nhập tên súng, bản đồ hoặc mẹo...";
 search.setAttribute("aria-label","Tìm hướng dẫn không dấu");search.addEventListener("input",()=>{api.query=search.value;render()});
 inputWrap.append(search);bar.append(controls,inputWrap);content.append(bar);
 count=make("p","tb-f-count");count.setAttribute("aria-live","polite");content.append(count);
 list=make("div","tb-f-grid");
 for(const guide of guides)list.append(cardFor(guide));
 content.append(list);
 status=make("div","tb-f-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 content.append(status);section.append(content);
 const anchor=document.querySelector(".tb-b-intro")||document.querySelector(".tb-b-sections");
 if(anchor)anchor.insertAdjacentElement("afterend",section);
 else document.getElementById("tbWikiTabs").insertAdjacentElement("beforebegin",section);
 document.body.classList.add("tb-wiki-stage-f");
 api.ready=true;api.total=guides.length;
 api.openGuide=id=>{const g=guides.find(x=>x.id===id);if(!g)return false;api.category=g.category;api.query="";search.value="";expand(true);render();const el=document.getElementById("tbFGuide-"+id);el.querySelector("details").open=true;el.scrollIntoView();return true};
 api.goToWiki=gotoWiki;
 expand(false);render();restore();
}
let attempts=0;
function boot(){
 if(!document.querySelector(".tb-wiki-shell")||typeof DATA==="undefined"||!window.__TB_WIKI_E__){if(++attempts<200)setTimeout(boot,90);return}
 Promise.all(["/wiki-stage-f-guides.json","/wiki-stage-c-evidence.json","/wiki-stage-d-evidence.json"].map(path=>
  fetch(path,{credentials:"omit",cache:"no-store"}).then(r=>{if(!r.ok)throw Error(path+" HTTP "+r.status);return r.json()})
 )).then(([data,c,d])=>mount(data,c,d))
 .catch(err=>{api.error=err.message;console.error("Wiki F failed:",err.message)});
}
boot();
})();
