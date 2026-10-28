/* Wiki V2 Stage D: evidence-aware attachments, vehicles and maps.
 * UI only; existing 51/26/8 DATA and original detail handlers stay intact.
 */
(()=>{
"use strict";
if(window.__TB_WIKI_D__)return;
const api=window.__TB_WIKI_D__={ready:false};
const kindLabels={attachments:"Phụ kiện",vehicles:"Xe cộ",maps:"Bản đồ"};
const make=(tag,klass,text)=>{const x=document.createElement(tag);if(klass)x.className=klass;if(text!==undefined)x.textContent=text;return x};
let evidence=null,modal=null,scheduled=false;
function kind(){
 return document.querySelector("#tbWikiTabs .tb-wiki-tab.active")?.dataset.tab||"weapons";
}
function summary(){
 const root=document.querySelector(".tb-wiki-shell");
 if(!root||!evidence)return;
 let box=document.getElementById("tbDSourceSummary");
 if(!box){
  box=make("div","tb-d-summary");
  box.id="tbDSourceSummary";box.setAttribute("aria-live","polite");
  const intro=document.querySelector(".tb-b-sections");
  if(intro)intro.insertAdjacentElement("afterend",box);
  else document.getElementById("tbWikiTabs")?.insertAdjacentElement("beforebegin",box);
 }
 const k=kind();
 box.replaceChildren();box.hidden=!kindLabels[k];
 if(box.hidden)return;
 const t=make("div","tb-d-summary-copy");
 t.append(make("strong","",kindLabels[k]+" · dữ liệu đang rà soát"));
 const count=Array.isArray(DATA[k])?DATA[k].length:0;
 let msg=k==="attachments"?
  "Đã liệt kê "+count+" phụ kiện. Tương thích từng vũ khí, thay đổi chỉ số và quyền sử dụng hình ảnh vẫn cần chứng cứ theo phiên bản.":
 k==="vehicles"?
  "Đã liệt kê "+count+" phương tiện. Ghi chú chính thức 4.6 có Thuyền Cao Su 4 chỗ chưa có trong danh mục cũ; không tự gộp thành xe khác.":
  "Đã liệt kê "+count+" bản đồ. Nguồn 4.6 xác nhận bản đồ của một chế độ chủ đề, không phải mọi vị trí loot trong Classic.";
 t.append(make("p","",msg));box.append(t);
 const badge=make("span","tb-d-status",k==="attachments"?"Chưa xác minh tương thích":k==="vehicles"?"1 mục chưa có trong kho":"3 ghi chú theo chế độ");
 box.append(badge);
 if(k==="vehicles"){
  const item=evidence.unlisted?.["Thuyền Cao Su"];
  if(item){
   const gap=make("div","tb-d-gap");
   const title=make("strong","","CHƯA CÓ TRONG 26 MỤC: "+ "Thuyền Cao Su");
   gap.append(title,make("p","",item.note));
   const src=evidence.sources[item.sourceId];
   if(src)gap.append(linkSource(src));
   box.append(gap);
  }
 }
}
function linkSource(source){
 const a=make("a","tb-d-source","Nguồn chính thức · v"+source.version);
 a.href=source.url;a.target="_blank";a.rel="noopener noreferrer external";
 return a;
}
function showModal(){
 scheduled=false;if(!evidence)return;
 const root=document.getElementById("tbWikiModal");
 if(!root?.classList.contains("open"))return;
 const k=kind();if(!kindLabels[k])return;
 const title=document.getElementById("tbWikiModalTitle")?.textContent?.trim()||"";
 const body=document.getElementById("tbWikiModalBody");
 if(!body||!title)return;
 if(body.querySelector(".tb-d-panel")?.dataset.tbDKey===k+"|"+title)return;
 body.querySelector(".tb-d-panel")?.remove();
 const panel=make("section","tb-d-panel");
 panel.dataset.tbDKey=k+"|"+title;
 panel.append(make("h4","","Nguồn và trạng thái kiểm chứng"));
 const note=make("p","tb-d-unverified","Các thông số không kèm trích dẫn nguồn ở hồ sơ cũ là dữ liệu tham khảo, chưa được xác minh cho bản hiện hành.");
 panel.append(note);
 const list=make("ul","tb-d-checklist");
 const missing=k==="attachments"?
  ["Vũ khí gắn được: chưa có bảng tương thích chính thức theo phiên bản.",
   "Ảnh, tác dụng định lượng và quyền sử dụng hình ảnh: chưa được đối chiếu."]:
  k==="vehicles"?
  ["Tốc độ tối đa, độ bền, phạm vi xuất hiện: số liệu hiện tại chưa có nguồn đủ tin cậy.",
   "Danh sách phương tiện cũ không bao gồm mọi vật phẩm được giới thiệu trong 4.6."]:
  ["Số người chơi, nhịp chơi, thời lượng và quy tắc loot có thể thay đổi theo chế độ/mùa.",
   "Kích thước và mô tả Wiki hiện tại cần đối chiếu nguồn trước khi coi là số liệu chính thức."];
 for(const text of missing)list.append(make("li","",text));
 panel.append(list);
 const matched=k==="maps"?evidence.maps?.[title]:
  k==="vehicles"?evidence.vehicles?.[title]:null;
 if(matched){
  const src=evidence.sources[matched.sourceId];
  const historical=make("div","tb-d-release");
  historical.append(make("b","","THÔNG TIN THEO PHIÊN BẢN "+matched.release),make("p","",matched.note));
  if(src)historical.append(linkSource(src));
  panel.append(historical);
 }
 const action=make("div","tb-d-links");
 const next=k==="attachments"?"weapons":k==="vehicles"?"maps":"vehicles";
 const b=make("button","tb-d-switch","Tra cứu "+(kindLabels[next]||"Vũ khí").toLowerCase());
 b.type="button";
 b.addEventListener("click",()=>{
  document.getElementById("tbWikiModalClose")?.click();
  document.querySelector('#tbWikiTabs .tb-wiki-tab[data-tab="'+next+'"]')?.click();
 });
 action.append(b);panel.append(action);
 body.append(panel);
}
function schedule(){
 if(scheduled)return;scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;summary();showModal()});
}
function init(){
 if(!document.getElementById("tbWikiTabs")||typeof DATA==="undefined")return false;
 document.body.classList.add("tb-wiki-stage-d");
 const link=make("link");link.rel="stylesheet";link.href="/wiki-stage-d-v2.css?v=1";document.head.append(link);
 fetch("/wiki-stage-d-evidence.json",{credentials:"omit",cache:"no-store"})
 .then(r=>{if(!r.ok)throw Error("Missing Stage D evidence "+r.status);return r.json()})
 .then(obj=>{
  if(obj.schemaVersion!=="wiki-d1"||!obj.coverage)throw Error("Invalid D evidence");
  evidence=obj;api.ready=true;api.coverage=obj.coverage;
  modal=document.getElementById("tbWikiModal");
  if(modal)new MutationObserver(schedule).observe(modal,{attributes:true,attributeFilter:["class"],subtree:true,childList:true});
  document.getElementById("tbWikiTabs")?.addEventListener("click",()=>setTimeout(schedule,0));
  schedule();
 }).catch(err=>{api.error=err.message;console.error("Wiki D failed:",err.message)});
 return true;
}
let tries=0;
const boot=()=>{if(init())return;if(++tries<160)setTimeout(boot,100)};
boot();
})();
