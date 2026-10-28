/* TrainingBot Wiki V2 — Stage B.1–B.5
 * Read-only presentation layer over existing verified/unverified runtime DATA.
 * Keeps all current detail modals, overlays, images, selection and compare logic.
 * Never invent gameplay metrics, source links, or backend operations.
 */
(()=>{
"use strict";
const root=document.querySelector(".tb-wiki-shell");
const tabs=document.getElementById("tbWikiTabs");
const grid=document.getElementById("tbWikiGrid");
const filters=document.getElementById("tbWikiFilters");
const search=document.getElementById("tbWikiSearch");
const compare=document.getElementById("tbCompareBtn");
if(!root||!tabs||!grid||!filters||!search||typeof DATA==="undefined"||root.dataset.tbStageB)return;
root.dataset.tbStageB="1";document.body.classList.add("tb-wiki-stage-b");
const KINDS=["weapons","attachments","vehicles","maps"];
const names={weapons:"Vũ khí",attachments:"Phụ kiện",vehicles:"Xe cộ",maps:"Bản đồ"};
const headlines={
 weapons:"Tra cứu vũ khí, loại đạn, chế độ bắn và nhóm sử dụng.",
 attachments:"Tìm phụ kiện theo nhóm và công dụng đang lưu trong Wiki.",
 vehicles:"Xem loại phương tiện, số chỗ ngồi và phạm vi xuất hiện được ghi trong dữ liệu.",
 maps:"Khám phá kích thước, nhịp chơi và thông tin bản đồ."
};
const aliases={
 "Nỏ":"Crossbow","Súng pháo sáng":"Flare Gun","Súng cưa nòng":"Sawed-Off",
 "Xe Buggy":"Buggy","Xe mô tô":"Motorcycle","Xe mô tô có thùng bên":"Motorcycle + Sidecar",
 "Xe bán tải":"Pickup","Xe bán tải kín":"Pickup kín","Xe tải nhỏ":"Van","Xe tay ga":"Scooter",
 "Xe trượt tuyết":"Snowmobile","Xe máy tuyết":"Snowbike","Tàu lượn có động cơ":"Motor Glider",
 "Xe tải quái vật":"Monster Truck","Xe đạp địa hình":"Mountain Bike"
};
const normalize=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D").toLocaleLowerCase("vi").replace(/\s+/g," ").trim();
const safeText=value=>String(value??"").trim()||"Chưa xác minh";
const topTitle=document.getElementById("tbWikiTitle");
const subtitle=document.getElementById("tbWikiSubtitle");
const head=root.querySelector(".tb-wiki-head");
const logo=root.querySelector(".tb-wiki-kicker span");
if(logo)logo.textContent="TRAININGBOT / WIKI PUBG MOBILE";
if(topTitle)topTitle.textContent="Kho vũ khí";
if(subtitle)subtitle.textContent=headlines.weapons;
const intro=document.createElement("div");intro.className="tb-b-intro";
const introIcon=document.createElement("span");introIcon.className="tb-b-intro-mark";introIcon.textContent="i";introIcon.setAttribute("aria-hidden","true");
const introCopy=document.createElement("p");
introCopy.textContent="Tra cứu nhanh từ dữ liệu hiện có của TrainingBot. Các chỉ số chuyên sâu chưa có nguồn xác minh sẽ không được tự bổ sung.";
intro.append(introIcon,introCopy);
head.insertAdjacentElement("afterend",intro);
const sections=document.createElement("div");sections.className="tb-b-sections";
const sectionCopy=document.createElement("div");sectionCopy.className="tb-b-section-copy";
const sectionLabel=document.createElement("span");sectionLabel.className="tb-b-section-label";sectionLabel.textContent="DANH MỤC";
const sectionTitle=document.createElement("h2");sectionTitle.textContent="Khám phá dữ liệu PUBG MOBILE";
sectionCopy.append(sectionLabel,sectionTitle);
const total=document.createElement("span");total.className="tb-b-total";
total.setAttribute("aria-live","polite");
sections.append(sectionCopy,total);
tabs.insertAdjacentElement("beforebegin",sections);
const control=document.createElement("div");control.className="tb-b-controls";
const controlHeading=document.createElement("div");controlHeading.className="tb-b-controls-label";
const controlTitle=document.createElement("h2");controlTitle.id="tbBGridTitle";controlTitle.textContent="Danh sách vũ khí";
const count=document.createElement("p");count.id="tbBResultCount";count.setAttribute("aria-live","polite");count.textContent="Đang tải danh sách...";
controlHeading.append(controlTitle,count);
const sortLabel=document.createElement("label");sortLabel.className="tb-b-sort-label";
const sortText=document.createElement("span");sortText.textContent="Sắp xếp";
const sort=document.createElement("select");sort.id="tbBSort";sort.setAttribute("aria-label","Sắp xếp kết quả");
for(const [value,label] of [["default","Mặc định"],["name-asc","Tên A–Z"],["name-desc","Tên Z–A"],["category","Theo nhóm"]]){
 const opt=document.createElement("option");opt.value=value;opt.textContent=label;sort.append(opt);
}
sortLabel.append(sortText,sort);
control.append(controlHeading,sortLabel);
filters.insertAdjacentElement("afterend",control);
const searchClear=document.createElement("button");searchClear.type="button";searchClear.className="tb-b-clear";
searchClear.setAttribute("aria-label","Xóa tìm kiếm");searchClear.textContent="×";searchClear.hidden=true;
search.parentElement?.append(searchClear);
search.setAttribute("aria-label","Tìm kiếm Wiki (hỗ trợ tiếng Việt không dấu)");
search.setAttribute("spellcheck","false");
const empty=document.createElement("div");empty.className="tb-b-empty";empty.hidden=true;
empty.innerHTML='<strong>Không tìm thấy dữ liệu phù hợp</strong><p>Thử tên khác, chọn “Tất cả” hoặc xóa từ khóa tìm kiếm.</p><button type="button" class="tb-b-reset">Xóa bộ lọc</button>';
grid.insertAdjacentElement("afterend",empty);
let query="",active="weapons",sortKey="default",queued=false,paused=false;
function getActive(){
 return tabs.querySelector(".tb-wiki-tab.active")?.dataset.tab||"weapons";
}
function rowFor(kind,displayTitle){
 const title=aliases[displayTitle]||displayTitle;
 return DATA[kind]?.find(row=>row[0]===title)||DATA[kind]?.find(row=>normalize(row[0])===normalize(title))||null;
}
function chips(kind,row){
 if(!row)return [];
 if(kind==="weapons")return [["Đạn",safeText(row[2])],["Chế độ",safeText(row[3])]];
 if(kind==="attachments")return [["Nhóm",safeText(row[1])]];
 if(kind==="vehicles")return [["Chỗ",safeText(row[2])],["Bản đồ",safeText(row[3])]];
 return [["Kích thước",safeText(row[1])],["Nhịp chơi",safeText(row[2])]];
}
function addCardFacts(card,kind){
 const title=card.querySelector("h3")?.textContent.trim();
 if(!title)return;
 const row=rowFor(kind,title);
 if(!row)return;
 card.setAttribute("role","button");
 card.setAttribute("aria-label","Xem chi tiết "+title);
 const specs=chips(kind,row);
 const fingerprint=JSON.stringify(specs);
 const existing=card.querySelector(".tb-b-card-facts");
 if(existing?.dataset.fingerprint===fingerprint)return;
 const container=existing||document.createElement("div");
 container.className="tb-b-card-facts";container.dataset.fingerprint=fingerprint;
 container.replaceChildren();
 for(const [label,value] of specs){
  const chip=document.createElement("span");chip.className="tb-b-card-fact";
  const caption=document.createElement("b");caption.textContent=label+":";
  const val=document.createElement("span");val.textContent=value;val.title=value;
  chip.append(caption,val);container.append(chip);
 }
 if(!existing)card.append(container);
}
function syncCounts(){
 let countAll=0;
 for(const kind of KINDS){
  const number=DATA[kind]?.length||0;countAll+=number;
  const badge=tabs.querySelector('.tb-wiki-tab[data-tab="'+kind+'"] small');
  if(badge&&badge.textContent!==String(number))badge.textContent=String(number);
 }
 const next=countAll+" mục dữ liệu · 4 danh mục";
 if(total.textContent!==next)total.textContent=next;
}
function sync(){
 queued=false;
 if(!root.isConnected||paused)return;
 active=getActive();
 syncCounts();
 const nextTitle="Danh sách "+names[active].toLocaleLowerCase("vi");
 if(controlTitle.textContent!==nextTitle)controlTitle.textContent=nextTitle;
 const cards=[...grid.querySelectorAll(".tb-wiki-card")];
 // Preserve original card click listeners: sorting only moves existing nodes.
 cards.forEach((card,index)=>{if(!card.dataset.tbBOrigin)card.dataset.tbBOrigin=String(index+1);addCardFacts(card,active);});
 if(cards.length>1&&sortKey!=="default"){
  const normalized=card=>normalize(card.querySelector("h3")?.textContent);
  const category=card=>normalize(rowFor(active,card.querySelector("h3")?.textContent.trim())?.[1]);
  const sorted=[...cards].sort((a,b)=>{
   if(sortKey==="name-asc")return normalized(a).localeCompare(normalized(b),"vi");
   if(sortKey==="name-desc")return normalized(b).localeCompare(normalized(a),"vi");
   if(sortKey==="category")return category(a).localeCompare(category(b),"vi")||normalized(a).localeCompare(normalized(b),"vi");
   return 0;
  });
  if(sorted.some((c,i)=>c!==cards[i]))grid.append(...sorted);
 }
 let visible=0;
 for(const card of grid.querySelectorAll(".tb-wiki-card")){
  const row=rowFor(active,card.querySelector("h3")?.textContent.trim());
  const haystack=[...row||[],card.querySelector("h3")?.textContent,card.querySelector("p")?.textContent,
   ...[...(card.querySelectorAll(".tb-b-card-fact"))].map(x=>x.textContent)].join(" ");
  const match=!query||normalize(haystack).includes(normalize(query));
  card.hidden=!match;
  if(match)visible++;
 }
 const info=(query?"Tìm thấy "+visible+" / "+cards.length:visible+" mục")+" · "+names[active];
 if(count.textContent!==info)count.textContent=info;
 const isEmpty=visible===0;
 if(empty.hidden!==!isEmpty)empty.hidden=!isEmpty;
 const legacyEmpty=grid.querySelector(".tb-wiki-empty");
 if(legacyEmpty)legacyEmpty.hidden=true;
 if(searchClear.hidden===!!query)searchClear.hidden=!query;
 if(subtitle&&subtitle.textContent!==headlines[active])subtitle.textContent=headlines[active];
}
function schedule(){
 if(queued)return;queued=true;requestAnimationFrame(sync);
}
// Override only legacy textbox filtering; it would recreate card nodes and
// disconnect originals on each keystroke. All other original handlers remain.
search.oninput=e=>{query=e.target.value;searchClear.hidden=!query;schedule();};
searchClear.addEventListener("click",()=>{query="";search.value="";search.focus();schedule();});
sort.addEventListener("change",()=>{sortKey=sort.value;schedule();});
empty.querySelector("button").addEventListener("click",()=>{
 query="";search.value="";sortKey="default";sort.value="default";
 const all=filters.querySelector('.tb-wiki-filter[data-filter="Tất cả"]');
 if(all)all.click();
 schedule();
});
tabs.addEventListener("click",event=>{
 const button=event.target.closest(".tb-wiki-tab");if(!button)return;
 query="";sortKey="default";sort.value="default";searchClear.hidden=true;
 schedule();
},true);
filters.addEventListener("click",event=>{
 if(event.target.closest(".tb-wiki-filter"))schedule();
},true);
compare?.addEventListener("click",schedule);
const observer=new MutationObserver(mutations=>{
 // Ignore mutations we have made to our own summary/labels/cards,
 // while reacting to a fresh grid from original handlers/later patches.
 if(mutations.some(m=>m.target===grid||m.target.closest?.(".tb-wiki-card")&&
    !m.target.closest(".tb-b-card-facts")))schedule();
});
observer.observe(grid,{childList:true,subtree:true});
new MutationObserver(()=>schedule()).observe(tabs,{childList:true,subtree:true});
document.addEventListener("keydown",event=>{
 if(event.key==="/"&&!event.ctrlKey&&!event.metaKey&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||"")){
  event.preventDefault();search.focus();
 }
 if(event.key==="Escape"&&document.activeElement===search&&search.value){
  query="";search.value="";schedule();
 }
});
schedule();
window.addEventListener("load",schedule,{once:true});
setTimeout(schedule,950);
})();