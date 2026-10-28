/* TrainingBot Admin V5 — six category sidebar, function cards in main.
 * Presentation/navigation only. All 13 legacy .nav-item nodes remain in
 * #sidebar .side-nav with their original listeners and API behavior.
 * No auth/session/storage, D1/R2, Worker or API mutation here.
 */
(()=>{
"use strict";
const app=document.getElementById("adminApp");
const sidebar=app?.querySelector("#sidebar");
const nav=sidebar?.querySelector(".side-nav");
const content=app?.querySelector(".content-area");
if(!app||!sidebar||!nav||!content||document.getElementById("tb5Categories"))return;
const GROUPS=[
 {id:"dashboard",label:"Tổng quan",icon:"▦",description:"Tổng hợp hoạt động và công việc",items:[["dashboard","Tổng quan","Thống kê và công việc cần xử lý","▦"]]},
 {id:"content",label:"Nội dung",icon:"▤",description:"Biên tập và phát hành thông tin",items:[
  ["posts","Bài viết","Tạo bài, chỉnh sửa, quản lý nháp và xuất bản","▤"],
  ["content","Trang web","Chỉnh sửa nội dung các trang công khai","◫"],
  ["wiki","Wiki","Quản lý dữ liệu và nội dung Wiki","▧"],
  ["studio","Studio V2","Không gian biên tập nội dung","✦"],
  ["beta","Phiên bản Beta","Quản lý bản phát hành, trạng thái và link tải","↓"]]},
 {id:"library",label:"Thư viện",icon:"▧",description:"Tài sản hình ảnh và nội dung đa phương tiện",items:[
  ["media","Thư viện media","Xem và quản lý tài sản media","▧"]]},
 {id:"community",label:"Cộng đồng",icon:"♙",description:"Người dùng và liên hệ",items:[
  ["users","Người dùng","Tài khoản và hoạt động cộng đồng","♙"],
  ["inbox","Hộp thư","Xử lý yêu cầu và phản hồi","✉"]]},
 {id:"analytics",label:"Thống kê",icon:"⌁",description:"Theo dõi tình hình hoạt động",items:[
  ["analytics","Thống kê","Tổng quan các chỉ số từ API","⌁"],
  ["visitor-tracking","Theo dõi truy cập","Hoạt động phiên và lưu lượng truy cập","◎"]]},
 {id:"settings",label:"Cài đặt",icon:"⚙",description:"Bảo mật và cấu hình hệ thống",items:[
  ["security","Bảo mật","Phiên đăng nhập và các kiểm tra bảo mật","◇"],
  ["system","Hệ thống","Trạng thái API và công cụ quản trị","⚙"]]}
];
const groupByRoute=new Map(GROUPS.flatMap(g=>g.items.map(i=>[i[0],g])));
const navKey=node=>node?.id==="tbVisitorNav"?"visitor-tracking":node?.dataset?.view;
const legacyRoute=id=>[...nav.querySelectorAll(".nav-item")].find(n=>navKey(n)===id);
const authenticated=()=>!app.classList.contains("hidden");
const groupRoute=id=>GROUPS.find(g=>g.id===id);
const groupHash=id=>"#group-"+id;
const topTitle=document.getElementById("pageTitle");
const eyebrow=document.getElementById("pageEyebrow");
const style=document.createElement("link");
style.id="tb5CategoryStyle";style.rel="stylesheet";style.href="/admin-six-groups-v5.css?v=1";
document.head.append(style);
// Quiet, professional UI polish. Loaded after V5 CSS so it can rebalance
// hierarchy without replacing the six-category interaction model.
const polish=document.createElement("link");
polish.id="tb5WorkspacePolishStyle";polish.rel="stylesheet";
polish.href="/admin-workspace-polish-v5.css?v=1";
document.head.append(polish);
document.body.classList.add("tb-admin-six-groups");
sidebar.querySelector(".tb3-sidebar-version")?.remove();
// Hidden legacy menu retains all listeners but is excluded from tab and screen reader.
nav.setAttribute("aria-hidden","true");nav.setAttribute("inert","");
const categories=document.createElement("nav");
categories.id="tb5Categories";categories.className="tb5-categories";
categories.setAttribute("aria-label","Danh mục quản trị");
const sideLabel=document.createElement("div");sideLabel.className="tb5-sidebar-label";
sideLabel.textContent="DANH MỤC QUẢN TRỊ";
categories.append(sideLabel);
for(const g of GROUPS){
 const button=document.createElement("button");button.type="button";
 button.className="tb5-category";button.dataset.tb5Group=g.id;
 const glyph=document.createElement("span");glyph.className="tb5-category-icon";glyph.setAttribute("aria-hidden","true");glyph.textContent=g.icon;
 const text=document.createElement("span");text.className="tb5-category-label";text.textContent=g.label;
 const chevron=document.createElement("span");chevron.className="tb5-category-arrow";chevron.setAttribute("aria-hidden","true");chevron.textContent="›";
 button.append(glyph,text,chevron);
 button.addEventListener("click",()=>{
  if(!authenticated())return;
  if(g.id==="dashboard"){navigate("dashboard");return;}
  showGroup(g.id,true);
  sidebar.querySelector("#closeSidebar")?.click();
 });
 categories.append(button);
}
nav.insertAdjacentElement("beforebegin",categories);
const hub=document.createElement("section");hub.id="tb5GroupHome";
hub.className="tb5-group-home";hub.setAttribute("aria-label","Các chức năng quản trị");hub.hidden=true;
const crumb=document.createElement("nav");crumb.id="tb5Breadcrumb";
crumb.className="tb5-breadcrumb";crumb.setAttribute("aria-label","Đường dẫn quản trị");crumb.hidden=true;
const back=document.createElement("button");back.type="button";back.className="tb5-crumb-back";
back.textContent="← Danh mục";back.addEventListener("click",()=>{
 const active=navKey([...nav.querySelectorAll(".nav-item")].find(b=>b.classList.contains("active")));
 const g=groupByRoute.get(active);
 if(g?.id==="dashboard"){navigate("dashboard");return;}
 if(g)showGroup(g.id,true);
});
const crumbGroup=document.createElement("span");crumbGroup.id="tb5CrumbGroup";
const crumbSep=document.createElement("span");crumbSep.setAttribute("aria-hidden","true");crumbSep.textContent="/";
const crumbPage=document.createElement("strong");crumbPage.id="tb5CrumbPage";
crumb.append(back,crumbGroup,crumbSep,crumbPage);
content.prepend(hub);
hub.insertAdjacentElement("afterend",crumb);
let hubShowing=false,selectedGroup="dashboard",updateQueued=false,programmatic=0;
function selectSide(groupId){
 for(const b of categories.querySelectorAll("button[data-tb5-group]")){
  const active=b.dataset.tb5Group===groupId;
  b.classList.toggle("active",active);
  if(active)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");
 }
}
// Small original outline pictograms. All icons are inline vector data: no
// third-party resources, emoji/font fallback, tracking or network requests.
const vectorPaths={
 dashboard:"M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",
 content:"M4 5h16v14H4z M4 10h16 M10 10v9",
 library:"M4 4h16v16H4z M7 16l4-5 3 3 2-2 4 4 M8 8h.01",
 community:"M15 19v-2c0-2-2-3-4-3H7c-2 0-4 1-4 3v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 11c2 0 4 1 4 3v5 M17 3a4 4 0 0 1 0 8",
 analytics:"M4 20V13 M10 20V8 M16 20V4 M22 20V11",
 settings:"M12 3l2 2 3-.2 1 3 2 2-1 2 1 3-2 2-1 3-3-.2-2 2-2-2-3 .2-1-3-2-2 1-3-1-2 2-2 1-3 3 .2z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
 posts:"M7 3h8l4 4v14H5V3h2 M14 3v5h5 M8 12h8 M8 16h8",
 wiki:"M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1z M12 6v14",
 studio:"M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z M19 18l.7 1.3L21 20l-1.3.7L19 22l-.7-1.3L17 20l1.3-.7z",
 beta:"M12 3v12 M7 10l5 5 5-5 M5 20h14",
 media:"M4 5h16v14H4z M4 15l5-5 4 4 3-3 4 4 M8 8h.01",
 users:"M16 20v-2c0-2.3-1.8-4-4-4H8c-2.2 0-4 1.7-4 4v2 M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M18 8a3 3 0 0 1 0 6 M20 20v-2a4 4 0 0 0-2-3.3",
 inbox:"M3 6h18v12H3z M3 7l9 7 9-7",
 "visitor-tracking":"M2 12c4-7 16-7 20 0-4 7-16 7-20 0z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
 security:"M12 3l8 4v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7z M9 12l2 2 4-4",
 system:"M12 3l2 2 3-.2 1 3 2 2-1 2 1 3-2 2-1 3-3-.2-2 2-2-2-3 .2-1-3-2-2 1-3-1-2 2-2 1-3 3 .2z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6"
};
function vectorIcon(id){
 const ns="http://www.w3.org/2000/svg";
 const svg=document.createElementNS(ns,"svg");
 svg.setAttribute("viewBox","0 0 24 24");
 svg.setAttribute("aria-hidden","true");
 svg.setAttribute("focusable","false");
 const path=document.createElementNS(ns,"path");
 path.setAttribute("d",vectorPaths[id]||vectorPaths.content);
 path.setAttribute("fill","none");
 path.setAttribute("stroke","currentColor");
 path.setAttribute("stroke-width","1.75");
 path.setAttribute("stroke-linejoin","round");
 path.setAttribute("stroke-linecap","round");
 svg.append(path);
 return svg;
}
function renderHub(group){
 hub.replaceChildren();
 hub.dataset.tb5Group=group.id;
 const top=document.createElement("div");
 top.className="tb5-hub-head";
 const left=document.createElement("div");left.className="tb6-hub-left";
 const symbol=document.createElement("span");symbol.className="tb6-hub-glyph";
 symbol.append(vectorIcon(group.id));
 const copy=document.createElement("div");copy.className="tb6-hub-copy";
 const kicker=document.createElement("span");kicker.className="tb5-hub-kicker";
 kicker.textContent="TRAININGBOT  /  KHÔNG GIAN QUẢN TRỊ";
 const title=document.createElement("h2");title.textContent=group.label;
 const subtitle=document.createElement("p");subtitle.textContent=group.description;
 copy.append(kicker,title,subtitle);left.append(symbol,copy);
 const total=document.createElement("div");total.className="tb5-hub-total";
 const n=document.createElement("strong");n.className="tb6-count-number";
 n.textContent=String(group.items.length).padStart(2,"0");
 const caption=document.createElement("span");caption.className="tb6-count-caption";
 caption.textContent="chức năng";
 total.append(n,caption);
 top.append(left,total);
 const section=document.createElement("div");section.className="tb6-section-heading";
 const subhead=document.createElement("h3");subhead.textContent="Công cụ quản lý";
 const sublabel=document.createElement("p");
 sublabel.textContent="Chọn công cụ để mở khu vực làm việc";
 section.append(subhead,sublabel);
 const cards=document.createElement("div");cards.className="tb5-function-grid";
 cards.dataset.tb6Count=String(group.items.length);
 for(const [id,label,detail] of group.items){
  const b=document.createElement("button");
  b.className="tb5-function-card tb6-function-card";
  b.type="button";b.dataset.tb5Route=id;
  if(group.id==="content"&&id==="posts")b.classList.add("tb6-feature");
  const head=document.createElement("span");head.className="tb5-card-heading";
  const glyph=document.createElement("span");glyph.className="tb5-function-icon";
  glyph.setAttribute("aria-hidden","true");glyph.append(vectorIcon(id));
  const arrow=document.createElement("span");arrow.className="tb5-function-arrow";
  arrow.setAttribute("aria-hidden","true");arrow.textContent="↗";
  head.append(glyph,arrow);
  const name=document.createElement("strong");name.textContent=label;
  const p=document.createElement("span");p.className="tb5-card-description";p.textContent=detail;
  const footer=document.createElement("span");footer.className="tb6-card-footer";
  footer.textContent="Mở công cụ";
  if(group.id==="content"&&id==="posts"){
   const feature=document.createElement("span");feature.className="tb6-card-feature-label";
   feature.textContent="BIÊN TẬP NỘI DUNG";
   b.append(feature);
  }
  b.append(head,name,p,footer);
  b.addEventListener("click",()=>navigate(id));
  cards.append(b);
 }
 hub.append(top,section,cards);
}
// Existing admin view management remains the only engine that opens a function.
function navigate(id){
 if(!authenticated())return false;
 const item=legacyRoute(id);
 if(!item)return false;
 programmatic++;
 hubShowing=false;
 document.body.classList.remove("tb-admin-group-home");
 hub.hidden=true;
 crumb.hidden=id==="dashboard";
 // Keep original Stage B, C and visitor-tracking listeners and URL/history.
 item.click();
 programmatic--;
 updateRoute(id);
 return true;
}
function showGroup(groupId,push){
 if(!authenticated())return;
 const group=groupRoute(groupId);
 if(!group)return;
 if(group.id==="dashboard"){navigate("dashboard");return;}
 hubShowing=true;selectedGroup=group.id;
 renderHub(group);
 hub.hidden=false;
 crumb.hidden=true;
 document.body.classList.add("tb-admin-group-home");
 selectSide(group.id);
 if(eyebrow)eyebrow.textContent="DANH MỤC QUẢN TRỊ";
 if(topTitle)topTitle.textContent=group.label;
 if(push&&location.hash!==groupHash(group.id)){
  history.pushState({trainingbotAdminGroup:group.id},"",groupHash(group.id));
 }
}
function updateRoute(id){
 const g=groupByRoute.get(id);
 if(!g)return;
 selectedGroup=g.id;
 selectSide(g.id);
 if(!hubShowing){
  document.body.classList.remove("tb-admin-group-home");
  hub.hidden=true;
  crumb.hidden=id==="dashboard";
  if(id!=="dashboard"){
   crumbGroup.textContent=g.label;
   crumbPage.textContent=g.items.find(item=>item[0]===id)?.[1]||id;
  }
 }
}
function syncFromLegacy(){
 updateQueued=false;
 if(!authenticated())return;
 const groupId=location.hash.slice(7);
 if(location.hash.startsWith("#group-")&&groupRoute(groupId)){
  if(!hubShowing||selectedGroup!==groupId)showGroup(groupId,false);
  return;
 }
 const active=[...nav.querySelectorAll(".nav-item")].find(b=>b.classList.contains("active"));
 const id=navKey(active)||"dashboard";
 // When the original menu is used by an internal action, show its panel,
 // even if the user previously viewed a group landing page.
 if(hubShowing&&location.hash==="#"+id){
  hubShowing=false;
 }
 updateRoute(id);
}
function scheduleSync(){
 if(updateQueued)return;
 updateQueued=true;
 requestAnimationFrame(syncFromLegacy);
}
new MutationObserver(scheduleSync).observe(nav,{subtree:true,attributes:true,attributeFilter:["class"]});
new MutationObserver(scheduleSync).observe(app,{attributes:true,attributeFilter:["class"]});
window.addEventListener("popstate",scheduleSync);
window.addEventListener("hashchange",scheduleSync);
window.addEventListener("load",scheduleSync,{once:true});
document.addEventListener("click",event=>{
 const route=event.target.closest?.(".nav-item,[data-go],[data-go-action]");
 if(route&&app.contains(route)){
  const id=navKey(route)||route.dataset.go||route.dataset.goAction;
  if(groupByRoute.has(id)&&programmatic===0){
   hubShowing=false;
   updateRoute(id);
  }
 }
},true);
scheduleSync();
})();