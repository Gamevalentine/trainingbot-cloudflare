/* TrainingBot Wiki V2 — Stage C, evidence-first weapon profiles.
 * Keeps the legacy detailed viewer, source DATA, Admin and all APIs intact.
 * Source: /wiki-stage-c-evidence.json (official *historical* release notes).
 */
(()=>{
"use strict";
if(window.__TB_WIKI_C__)return;
window.__TB_WIKI_C__={ready:false};
let evidence=null,overlay=null,observer=null,queued=false,renderedName="";
const api=window.__TB_WIKI_C__;
const make=(tag,klass,text)=>{
 const el=document.createElement(tag);if(klass)el.className=klass;
 if(text!==undefined)el.textContent=text;
 return el;
};
const valid=value=>value!==undefined&&value!==null&&String(value).trim()!==""&&!/^(chưa rõ|chưa xác minh|n\/a|unknown|—|-)$/.test(String(value).trim().toLowerCase());
const sourceFor=id=>evidence?.sources?.[id]||null;
const textValue=v=>valid(v)?String(v):"Chưa xác minh";
function getRow(name){
 if(typeof DATA==="undefined"||!Array.isArray(DATA.weapons))return null;
 return DATA.weapons.find(r=>r[0]===name)||null;
}
function line(title,value,status){
 const cell=make("div","tb-c-fact");
 const label=make("small","",title),body=make("strong","",textValue(value));
 const state=make("span","tb-c-field-status",status);
 cell.append(label,body,state);
 return cell;
}
function buildSheet(row){
 const name=row[0],extra=evidence.weapons?.[name];
 const sheet=make("section","tb-c-sheet");
 sheet.dataset.tbCName=name;
 sheet.setAttribute("aria-label","Hồ sơ nguồn và lịch sử "+name);
 const heading=make("div","tb-c-heading");
 heading.append(make("h3","","Hồ sơ dữ liệu"),make("span","tb-c-version","Đối chiếu nguồn: 29/10/2026"));
 sheet.append(heading);
 sheet.append(make("p","tb-c-context","Dữ liệu cơ bản bên dưới kế thừa Wiki TrainingBot và chưa được xác minh độc lập theo phiên bản hiện hành."));
 const basics=make("div","tb-c-grid");
 basics.append(line("Tên vũ khí",name,"Từ danh mục Wiki"),
  line("Nhóm",row[1],"Từ danh mục Wiki"),
  line("Loại đạn",row[2],"Chưa kiểm chứng hiện hành"),
  line("Chế độ bắn",row[3],"Chưa kiểm chứng hiện hành"));
 sheet.append(basics);
 const title=make("h4","tb-c-subtitle","Thông số nâng cao có nguồn");
 sheet.append(title);
 const history=Array.isArray(extra?.history)?extra.history:[];
 if(!history.length){
  sheet.append(make("p","tb-c-unverified","Chưa có thông số nâng cao được đối chiếu với ghi chú cập nhật chính thức cho mục này. Không sử dụng biểu đồ điểm 0–100 cũ để thay thế sát thương hoặc độ giật thực tế."));
 }else{
  for(const record of history){
   const src=sourceFor(record.sourceId);
   if(!src||src.isCurrent!==false||src.version!=="2.4")continue;
   const wrap=make("div","tb-c-release");
   const tag=make("span","tb-c-tag","LỊCH SỬ · PHIÊN BẢN "+src.version+" · "+src.publishedAt);
   wrap.append(tag,make("p","",record.summary));
   wrap.append(make("div","tb-c-grid tb-c-history-grid"));
   const container=wrap.querySelector(".tb-c-history-grid");
   for(const fact of record.facts||[]){
    if(!valid(fact.value))continue;
    container.append(line(fact.label,String(fact.value)+(fact.unit?" "+fact.unit:""),"Ghi chú chính thức · v"+src.version));
   }
   if((record.mapsAtRelease||[]).length){
    wrap.append(make("p","tb-c-maps","Bản đồ trong ghi chú 2.4: "+record.mapsAtRelease.join(", ")+"."));
   }
   const cite=make("a","tb-c-source","Đọc ghi chú chính thức · "+src.title);
   cite.href=src.url;cite.target="_blank";cite.rel="noopener noreferrer external";
   wrap.append(cite,make("p","tb-c-disclaimer","Đây là dữ liệu lịch sử của bản 2.4 (2023), không xác nhận các giá trị còn hiệu lực ở phiên bản 4.x."));
   sheet.append(wrap);
  }
 }
 const remaining=make("details","tb-c-more");
 const detailsTitle=make("summary","","Những dữ liệu đang chờ kiểm chứng");
 remaining.append(detailsTitle);
 const list=make("ul","");
 for(const item of [
  "Sát thương, tốc độ bắn, tốc độ đạn và độ giật của bản mới nhất.",
  "Số viên/băng, thời gian thay đạn và tầm hiệu quả theo từng phiên bản.",
  "Mức độ tương thích chính thức của từng phụ kiện.",
  "Danh sách bản đồ xuất hiện thực tế và thay đổi theo mùa.",
  "Ảnh vật phẩm: độ đúng mẫu, quyền sử dụng và nguồn gốc."
 ])list.append(make("li","",item));
 remaining.append(list);
 sheet.append(remaining);
 const guide=make("div","tb-c-guide");
 guide.append(make("h4","","Hướng dẫn sử dụng dữ liệu"));
 guide.append(make("p","","Thông tin mô tả theo nhóm trong Wiki chỉ mang tính tham khảo. Đối chiếu phụ kiện, bản đồ và cơ chế vũ khí ngay trong phiên bản game bạn đang chơi; không suy ra giá trị từ điểm nhóm 0–100."));
 sheet.append(guide);
 return sheet;
}
function reflect(){
 queued=false;if(!evidence)return;
 const o=document.querySelector(".tb-v145.open");
 if(!o)return;
 const left=o.querySelector(".tb-v145-left");
 const name=left?.querySelector("h2")?.textContent?.trim();
 if(!name)return;
 const row=getRow(name);
 if(!row)return;
 const unsourced=left.querySelector(".tb-v145-note b");
 if(unsourced&&unsourced.textContent.includes("đã đối chiếu"))unsourced.textContent="Thông tin từ Wiki cũ (chưa liên kết nguồn):";
 if(left.querySelector(".tb-c-sheet")?.dataset.tbCName===name)return;
 left.querySelector(".tb-c-sheet")?.remove();
 const parent=left.querySelector(".tb-v145-score-title");
 const sheet=buildSheet(row);
 if(parent)parent.before(sheet);else left.append(sheet);
 // Clarify what the older UI does and does not establish.
 const right=o.querySelector(".tb-v145-right");
 if(right){
   const header=[...right.querySelectorAll(".tb-v145-title")].find(el=>el.textContent.includes("Phụ kiện"));
   if(header)header.textContent="Phụ kiện gợi ý từ Wiki (chưa xác minh tương thích)";
   if(!right.querySelector(".tb-c-legacy-note")){
    const note=make("p","tb-c-legacy-note","Các bản đồ, phụ kiện và nhận xét từ giao diện cũ chưa có bằng chứng cho phiên bản hiện hành.");
    right.prepend(note);
   }
 }
 renderedName=name;
}
function schedule(){
 if(queued)return;
 queued=true;requestAnimationFrame(reflect);
}
function watch(){
 if(overlay)return;
 overlay=document.querySelector(".tb-v145");
 if(!overlay)return;
 observer=new MutationObserver(schedule);
 observer.observe(overlay,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});
 schedule();
}
function init(){
 if(!document.getElementById("tbWikiGrid")||typeof DATA==="undefined")return false;
 document.body.classList.add("tb-wiki-stage-c");
 const style=make("link");style.rel="stylesheet";style.href="/wiki-stage-c-weapon.css?v=1";
 document.head.append(style);
 fetch("/wiki-stage-c-evidence.json",{credentials:"omit",cache:"no-store"})
  .then(r=>{if(!r.ok)throw Error("Wiki C evidence HTTP "+r.status);return r.json()})
  .then(payload=>{
   if(payload.schemaVersion!=="wiki-c1"||!payload.sources||!payload.weapons)throw Error("Wiki C evidence schema invalid");
   evidence=payload;api.ready=true;api.officialHistoricalCount=Object.keys(payload.weapons).length;
   watch();schedule();
  })
  .catch(err=>{api.error=err.message;console.error("Wiki C evidence unavailable:",err.message)});
 const existing=window.setInterval(()=>{watch();if(overlay)window.clearInterval(existing);},150);
 window.setTimeout(()=>window.clearInterval(existing),90000);
 document.addEventListener("click",()=>setTimeout(()=>{watch();schedule()},0),true);
 document.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight")setTimeout(schedule,0)},true);
 return true;
}
let retries=0;
const boot=()=>{if(init())return;if(++retries<160)setTimeout(boot,100)};
boot();
})();
