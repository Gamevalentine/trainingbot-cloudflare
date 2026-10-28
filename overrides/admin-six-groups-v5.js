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
function renderHub(group){
 hub.replaceChildren();
 const top=document.createElement("div");top.className="tb5-hub-head";
 const kicker=document.createElement("span");kicker.className="tb5-hub-kicker";
 kicker.textContent="TRAININGBOT / ADMIN CENTER";
 const title=document.createElement("h2");title.textContent=group.label;
 const subtitle=document.createElement("p");subtitle.textContent=group.description;
 const summary=document.createElement("div");summary.className="tb5-hub-total";
 summary.textContent=group.items.length+" chức năng";
 top.append(kicker,title,subtitle,summary);
 const cards=document.createElement("div");cards.className="tb5-function-grid";
 for(const [id,label,detail,icon] of group.items){
  const b=document.createElement("button");b.className="tb5-function-card";b.type="button";
  b.dataset.tb5Route=id;
  const head=document.createElement("span");head.className="tb5-card-heading";
  const glyph=document.createElement("span");glyph.className="tb5-function-icon";glyph.setAttribute("aria-hidden","true");glyph.textContent=icon;
  const arrow=document.createElement("span");arrow.className="tb5-function-arrow";arrow.setAttribute("aria-hidden","true");arrow.textContent="↗";
  head.append(glyph,arrow);
  const name=document.createElement("strong");name.textContent=label;
  const p=document.createElement("span");p.className="tb5-card-description";p.textContent=detail;
  b.append(head,name,p);
  b.addEventListener("click",()=>navigate(id));
  cards.append(b);
 }
 hub.append(top,cards);
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