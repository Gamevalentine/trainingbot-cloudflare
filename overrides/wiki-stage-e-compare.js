/* TrainingBot Wiki V2 — Stage E1–E6: comparison without guessed stats.
 * Builds on A/B/C/D. No Worker/API writes; only source-linked release notes.
 */
(()=>{
"use strict";
if(window.__TB_WIKI_E__)return;
const api=window.__TB_WIKI_E__={ready:false,selecting:false,selected:[],open:false};
let source=null,grid=null,tabs=null,compareBtn=null,tray=null,dialog=null,notice=null;
let scheduled=false,lastFocus=null;
const originalCardLabels=new WeakMap();
const make=(tag,cls,text)=>{
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(text!==undefined)el.textContent=text;
 return el;
};
const weapons=()=>typeof DATA!=="undefined"&&Array.isArray(DATA.weapons)?DATA.weapons:[];
const lookup=name=>weapons().find(row=>row[0]===name);
const active=()=>tabs?.querySelector(".tb-wiki-tab.active")?.dataset.tab||"weapons";
const valid=value=>value!==null&&value!==undefined&&String(value).trim()!=="";
const labelValue=value=>valid(value)?String(value):"Chưa xác minh";
const metrics=[
 {id:"baseDamage",label:"Sát thương cơ bản",regex:/^Sát thương cơ bản/},
 {id:"reloadEmpty",label:"Thay đạn băng rỗng",regex:/^Nạp đạn băng rỗng/},
 {id:"reloadTactical",label:"Nạp đạn chiến thuật",regex:/^Nạp đạn chiến thuật/}
];
function latestEvidence(name){
 return (source?.weapons?.[name]?.history||[]).map(item=>{
  const src=source.sources[item.sourceId];
  return src?{item,src}:null;
 }).filter(Boolean);
}
function knownMetric(name,metric){
 const facts=[];
 for(const {item,src} of latestEvidence(name)){
  if(src.isCurrent!==false||!src.version||!src.url)continue;
  for(const fact of item.facts||[]){
   if(!metric.regex.test(fact.label)||typeof fact.value!=="number"||!Number.isFinite(fact.value)||fact.value<=0)continue;
   facts.push({value:fact.value,unit:fact.unit||"",version:src.version,sourceId:item.sourceId,source:src});
  }
 }
 return facts;
}
function announce(message){if(notice)notice.textContent=message}
function urlFor(names){
 const url=new URL(location.href);
 url.hash="";
 url.searchParams.delete("utm_source");
 if(names.length>=2)url.searchParams.set("compare",names.join(","));
 else url.searchParams.delete("compare");
 return url;
}
function applyUrl(){
 const url=new URL(location.href);
 if(api.selecting&&api.selected.length>=2)url.searchParams.set("compare",api.selected.join(","));
 else url.searchParams.delete("compare");
 history.replaceState(history.state,"",url.pathname+url.search+url.hash);
}
function syncCards(){
 if(!grid)return;
 for(const card of grid.querySelectorAll(".tb-wiki-card")){
  const name=card.querySelector("h3")?.textContent?.trim();
  const chosen=api.selected.includes(name);
  card.classList.toggle("tb-e-selected",api.selecting&&chosen);
  if(api.selecting&&active()==="weapons"){
   if(!originalCardLabels.has(card))originalCardLabels.set(card,card.getAttribute("aria-label"));
   card.setAttribute("aria-pressed",String(chosen));
   card.setAttribute("aria-label",(chosen?"Đã chọn ":"Chọn vũ khí ")+(name||""));
  }else if(originalCardLabels.has(card)){
   // B's existing accessible action label belongs to the card; restore it.
   card.removeAttribute("aria-pressed");
   const original=originalCardLabels.get(card);
   if(original===null)card.removeAttribute("aria-label");
   else card.setAttribute("aria-label",original);
   originalCardLabels.delete(card);
  }
 }
}
function reflect(){
 scheduled=false;
 if(active()!=="weapons"&&api.selecting){
  api.selecting=false;api.selected=[];api.open=false;
  dialog?.close?.();dialog?.classList.remove("open");
  applyUrl();
 }
 compareBtn?.classList.toggle("active",api.selecting);
 compareBtn?.setAttribute("aria-pressed",String(api.selecting));
 if(compareBtn){
  const span=compareBtn.querySelector("span");
  if(span)span.textContent=api.selecting?"So sánh ("+api.selected.length+"/3)":"So sánh";
 }
 document.querySelector(".tb-wiki-shell")?.classList.toggle("tb-e-picking",api.selecting);
 if(tray){
  tray.hidden=!api.selecting||active()!=="weapons";
  tray.querySelector(".tb-e-count").textContent=api.selected.length+" / 3 vũ khí";
  tray.querySelector(".tb-e-open").disabled=api.selected.length<2;
  const list=tray.querySelector(".tb-e-picked");
  list.replaceChildren();
  for(const n of api.selected){
   const chip=make("button","tb-e-chip",n+" ×");
   chip.type="button";chip.setAttribute("aria-label","Bỏ chọn "+n);
   chip.addEventListener("click",()=>toggle(n));
   list.append(chip);
  }
 }
 syncCards();
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(reflect)}
function toggle(name){
 if(!lookup(name))return;
 const i=api.selected.indexOf(name);
 if(i>=0)api.selected.splice(i,1);
 else if(api.selected.length<3)api.selected.push(name);
 else{announce("Đã chọn tối đa 3 vũ khí. Bỏ chọn một khẩu để thay thế.");return;}
 announce("Đã chọn "+api.selected.length+" / 3 vũ khí.");
 applyUrl();schedule();
}
function startPicker(){
 if(active()!=="weapons")return;
 api.selecting=true;api.selected=[];
 announce("Chọn từ 2 đến 3 vũ khí để so sánh.");
 schedule();
}
function stopPicker(){
 api.selecting=false;api.selected=[];
 closeDialog();applyUrl();announce("Đã thoát chế độ so sánh.");schedule();
}
function titleBlock(name){
 const node=make("div","tb-e-weapon-head");
 node.append(make("h3","",name));
 const e=latestEvidence(name);
 node.append(make("span","",e.length?e.length+" ghi chú phiên bản có nguồn":"Chưa có ghi chú phiên bản có nguồn"));
 return node;
}
function cell(value,notes){
 const td=make("td");
 const main=make("strong","",labelValue(value));
 td.append(main);
 if(notes)td.append(make("small","",notes));
 return td;
}
function table(names){
 const wrap=make("div","tb-e-scroll");
 wrap.tabIndex=0;wrap.setAttribute("aria-label","Bảng so sánh, cuộn ngang nếu cần");
 const table=make("table","tb-e-table");
 const thead=make("thead"),tr=make("tr");
 tr.append(make("th","","Tiêu chí"));
 for(const name of names){
  const th=make("th");th.append(titleBlock(name));tr.append(th);
 }
 thead.append(tr);
 const body=make("tbody");
 const rows=[
  ["Nhóm",name=>lookup(name)?.[1],"Danh mục Wiki · chưa đối chiếu phiên bản mới"],
  ["Loại đạn",name=>lookup(name)?.[2],"Danh mục Wiki · chưa đối chiếu phiên bản mới"],
  ["Chế độ bắn",name=>lookup(name)?.[3],"Danh mục Wiki · chưa đối chiếu phiên bản mới"],
  ["Phụ kiện tương thích",()=>null,"Chưa có bảng tương thích chính thức theo từng bản"],
  ["Ưu / nhược điểm",()=>null,"Chưa có đánh giá đối chiếu độc lập cùng phiên bản"]
 ];
 for(const [heading,extract,note] of rows){
  const row=make("tr");row.append(make("th","",heading));
  for(const name of names)row.append(cell(extract(name),note));
  body.append(row);
 }
 for(const metric of metrics){
  // Never merge values from 2.4 and 4.6 into a single row.
  const versions=[...new Set(names.flatMap(n=>knownMetric(n,metric).map(f=>f.version)))];
  for(const version of versions){
   const row=make("tr");
   row.append(make("th","",metric.label+" · v"+version+" (lịch sử)"));
   for(const name of names){
    const found=knownMetric(name,metric).find(x=>x.version===version);
    row.append(cell(found?found.value+" "+found.unit:null,found?"Nguồn chính thức · v"+version:"Không có số liệu có nguồn v"+version));
   }
   body.append(row);
  }
 }
 table.append(thead,body);wrap.append(table);
 return wrap;
}
function chart(names){
 const section=make("section","tb-e-chart");
 section.append(make("h3","","Biểu đồ đối chiếu theo cùng phiên bản"));
 let count=0;
 for(const metric of metrics){
  const all=names.flatMap(name=>knownMetric(name,metric).map(v=>({...v,name})));
  const versionGroups=new Map();
  for(const item of all){
   const key=item.version+"|"+item.sourceId+"|"+item.unit;
   if(!versionGroups.has(key))versionGroups.set(key,[]);
   versionGroups.get(key).push(item);
  }
  for(const [key,arr] of versionGroups){
   const unique=arr.filter((v,i)=>arr.findIndex(x=>x.name===v.name)===i);
   if(unique.length<2)continue;
   count++;
   const src=unique[0].source;
   const group=make("div","tb-e-chart-group");
   group.append(make("h4","",metric.label+" · bản "+src.version+" · "+src.publishedAt));
   const max=Math.max(...unique.map(v=>v.value));
   for(const info of unique){
    const row=make("div","tb-e-chart-row");
    row.append(make("span","",info.name));
    const track=make("div","tb-e-track"),bar=make("div","tb-e-bar");
    bar.style.width=(info.value/max*100).toFixed(1)+"%";
    track.append(bar);row.append(track,make("b","",info.value+" "+info.unit));group.append(row);
   }
   const caption=make("p","tb-e-caption","Chỉ số ghi trong cùng một thông báo, không phải kết quả thử nghiệm hoặc xếp hạng vũ khí. Số thấp/cao không tự động đồng nghĩa tốt hơn.");
   group.append(caption);
   const a=make("a","tb-e-source","Nguồn gốc: "+src.title+" · v"+src.version);
   a.href=src.url;a.target="_blank";a.rel="noopener noreferrer external";
   group.append(a);
   section.append(group);
  }
 }
 if(!count)section.append(make("p","tb-e-empty-chart","Chưa đủ ít nhất 2 giá trị cùng chỉ số, phiên bản và nguồn chính thức để vẽ biểu đồ. Không tạo thang điểm 0–100 giả."));
 return section;
}
function references(names){
 const sec=make("section","tb-e-references");
 sec.append(make("h3","","Nguồn kiểm chứng và giới hạn dữ liệu"));
 const seen=new Set();
 for(const name of names){
  const group=make("div","tb-e-reference-row");
  group.append(make("strong","",name));
  const entries=latestEvidence(name);
  if(!entries.length)group.append(make("span","","Chưa có nguồn thông số riêng trong Wiki C; chỉ hiển thị dữ liệu danh mục tham khảo."));
  else for(const {item,src} of entries){
   const key=name+"|"+src.url+"|"+src.version;
   if(seen.has(key))continue;seen.add(key);
   const p=make("p","",item.summary+" (Phiên bản "+src.version+", "+src.publishedAt+")");
   const a=make("a","tb-e-source","Xem nguồn chính thức · v"+src.version);
   a.href=src.url;a.target="_blank";a.rel="noopener noreferrer external";
   group.append(p,a);
  }
  sec.append(group);
 }
 sec.append(make("p","tb-e-warning","Chưa xác minh số liệu hiện hành, phụ kiện tương thích, ảnh và toàn bộ ưu/nhược điểm. Không so sánh các phiên bản khác nhau như thể cùng thời điểm."));
 return sec;
}
function getShareLink(names){return urlFor(names).href}
function buildDialog(){
 const d=make("dialog","tb-e-dialog");
 d.id="tbECompareModal";d.setAttribute("aria-label","So sánh vũ khí PUBG MOBILE");
 const frame=make("div","tb-e-modal-frame");
 const head=make("div","tb-e-modal-head");
 const heading=make("div");
 heading.append(make("small","","TRAININGBOT / WIKI"),make("h2","","So sánh vũ khí"));
 const close=make("button","tb-e-close","×");close.type="button";close.setAttribute("aria-label","Đóng so sánh");
 close.addEventListener("click",closeDialog);head.append(heading,close);
 const sub=make("p","tb-e-summary","");
 const content=make("div","tb-e-modal-content");
 const foot=make("div","tb-e-share");
 const input=make("input","tb-e-link");
 input.id="tbEShareLink";input.readOnly=true;input.setAttribute("aria-label","Đường dẫn chia sẻ so sánh");
 const copy=make("button","tb-e-copy","Sao chép liên kết");copy.type="button";
 copy.addEventListener("click",async()=>{
  try{await navigator.clipboard.writeText(input.value);announce("Đã sao chép liên kết.");copy.textContent="Đã sao chép";}
  catch(err){input.focus();input.select();announce("Đã chọn địa chỉ liên kết; có thể sao chép bằng bàn phím.");}
 });
 foot.append(input,copy);
 frame.append(head,sub,content,foot);d.append(frame);
 d.addEventListener("click",event=>{if(event.target===d)closeDialog()});
 d.addEventListener("close",()=>{api.open=false;lastFocus?.focus?.()});
 document.body.append(d);
 return d;
}
function openDialog(){
 if(api.selected.length<2){announce("Cần chọn ít nhất 2 vũ khí.");return;}
 const names=api.selected.slice(0,3);
 if(!names.every(name=>lookup(name))){announce("Một vũ khí không còn trong dữ liệu.");return;}
 const d=dialog||buildDialog();dialog=d;lastFocus=document.activeElement;
 const content=d.querySelector(".tb-e-modal-content");
 content.replaceChildren(table(names),chart(names),references(names));
 d.querySelector(".tb-e-summary").textContent="Đang đối chiếu "+names.length+" vũ khí · các số liệu có nguồn được gắn phiên bản, không nội suy.";
 d.querySelector(".tb-e-link").value=getShareLink(names);
 d.querySelector(".tb-e-copy").textContent="Sao chép liên kết";
 api.open=true;applyUrl();
 if(typeof d.showModal==="function")d.showModal();
 else d.classList.add("open");
 announce("Đã mở bảng so sánh "+names.join(", ")+".");
 d.querySelector(".tb-e-close")?.focus();
}
function closeDialog(){
 if(!dialog)return;
 if(dialog.open)dialog.close();
 dialog.classList.remove("open");
 api.open=false;
}
function createTray(){
 tray=make("div","tb-e-tray");tray.hidden=true;tray.id="tbETray";
 const left=make("div","tb-e-tray-left");
 left.append(make("strong","","So sánh vũ khí"),make("span","tb-e-count","0 / 3 vũ khí"));
 left.append(make("div","tb-e-picked"));
 const actions=make("div","tb-e-tray-actions");
 const view=make("button","tb-e-open","Xem so sánh");view.type="button";view.disabled=true;
 view.addEventListener("click",openDialog);
 const exit=make("button","tb-e-exit","Thoát chọn");exit.type="button";
 exit.addEventListener("click",stopPicker);
 actions.append(view,exit);tray.append(left,actions);
 grid.before(tray);
 notice=make("div","tb-e-announcement");notice.id="tbEAnnouncement";
 notice.setAttribute("role","status");notice.setAttribute("aria-live","polite");
 tray.after(notice);
}
function initializeShare(){
 let url;try{url=new URL(location.href)}catch{return;}
 const raw=url.searchParams.get("compare");
 if(!raw)return;
 const names=raw.split(",").map(s=>s.trim()).filter(Boolean);
 if(names.length<2||names.length>3||new Set(names).size!==names.length||!names.every(n=>lookup(n))){
  url.searchParams.delete("compare");history.replaceState(history.state,"",url.pathname+url.search+url.hash);
  return;
 }
 api.selecting=true;api.selected=names;schedule();
 // Do not automatically open an unsolicited modal; display selected weapons.
 announce("Đã khôi phục "+names.length+" vũ khí từ liên kết chia sẻ. Bấm Xem so sánh để xem bảng.");
}
function init(){
 grid=document.getElementById("tbWikiGrid");tabs=document.getElementById("tbWikiTabs");compareBtn=document.getElementById("tbCompareBtn");
 if(!grid||!tabs||!compareBtn||!weapons().length)return false;
 if(!document.getElementById("tbECompareStyle")){
  const link=make("link");link.rel="stylesheet";link.id="tbECompareStyle";link.href="/wiki-stage-e-compare.css?v=1";document.head.append(link);
 }
 document.body.classList.add("tb-wiki-stage-e");
 createTray();
 // Capturing at document avoids original onclick and explicitly guards v145
 // at its window capturing handler when selecting.
 document.addEventListener("click",event=>{
  if(event.target.closest("#tbCompareBtn")){
   event.preventDefault();event.stopImmediatePropagation();
   if(!api.selecting)startPicker();else if(api.selected.length>=2)openDialog();
   else announce("Chọn ít nhất 2 vũ khí từ danh sách.");
   return;
  }
  const card=event.target.closest("#tbWikiGrid .tb-wiki-card");
  if(card&&api.selecting&&active()==="weapons"){
   event.preventDefault();event.stopImmediatePropagation();
   const name=card.querySelector("h3")?.textContent.trim();
   if(name)toggle(name);
  }
 },true);
 // Keyboard interaction for card articles (not native buttons).
 grid.addEventListener("keydown",event=>{
  if(!api.selecting||active()!=="weapons"||!["Enter"," "].includes(event.key))return;
  const card=event.target.closest(".tb-wiki-card");if(!card)return;
  event.preventDefault();event.stopImmediatePropagation();
  const name=card.querySelector("h3")?.textContent.trim();
  if(name)toggle(name);
 },true);
 tabs.addEventListener("click",()=>setTimeout(schedule,0),true);
 new MutationObserver(schedule).observe(grid,{childList:true,subtree:false});
 new MutationObserver(schedule).observe(tabs,{childList:true,subtree:true});
 initializeShare();schedule();
 // Source evidence is intentionally fetched separately from the static DATA.
 // Do not announce ready until the matching versioned evidence is available.
 fetch("/wiki-stage-c-evidence.json",{credentials:"omit",cache:"no-store"})
  .then(response=>{if(!response.ok)throw Error("Evidence HTTP "+response.status);return response.json()})
  .then(data=>{
   if(!data||!data.sources||!data.weapons||!data.schemaVersion?.startsWith("wiki-c"))throw Error("Unrecognized Wiki C evidence schema");
   source=data;api.ready=true;api.sourceCount=Object.keys(data.weapons).length;announce("Đã nạp dữ liệu đối chiếu nguồn.");
  })
  .catch(err=>{api.error=err.message;api.ready=false;announce("Không tải được nguồn so sánh. Vui lòng thử lại.");});
 api.openComparison=openDialog;
 api.clear=stopPicker;
 api.shareUrl=()=>getShareLink(api.selected);
 return true;
}
let attempts=0;
const boot=()=>{if(init())return;if(++attempts<180)setTimeout(boot,90)};
boot();
})();
