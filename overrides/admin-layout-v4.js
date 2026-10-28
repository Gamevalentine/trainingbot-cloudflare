/* TrainingBot Admin Layout V4.
 * Reorganizes existing UI nodes, preserving original handlers, API, auth and
 * legacy navigation nodes. No storage, network, DB or content writes.
 */
(()=>{
"use strict";
const app=document.getElementById("adminApp");
const nav=app?.querySelector("#sidebar .side-nav");
const dash=app?.querySelector('[data-view-panel="dashboard"]');
const area=app?.querySelector(".content-area");
if(!app||!nav||!dash||!area||document.getElementById("tb4WorkspaceBar"))return;
const GROUPS=[
 {id:"dashboard",title:"Tổng quan",brief:"Tổng hợp hoạt động",targets:["dashboard"]},
 {id:"content",title:"Nội dung",brief:"Bài viết, trang và Beta",targets:["posts","content","wiki","studio","beta"]},
 {id:"library",title:"Thư viện",brief:"Tài sản media",targets:["media"]},
 {id:"community",title:"Cộng đồng",brief:"Tài khoản và hộp thư",targets:["users","inbox"]},
 {id:"stats",title:"Phân tích",brief:"Thống kê truy cập",targets:["analytics","visitor-tracking"]},
 {id:"settings",title:"Hệ thống",brief:"Bảo mật và cấu hình",targets:["security","system"]}
];
const ROUTES={
 dashboard:"Tổng quan",posts:"Bài viết",content:"Trang web",wiki:"Wiki",
 studio:"Studio V2",beta:"Phiên bản Beta",media:"Thư viện media",
 users:"Người dùng",inbox:"Hộp thư",analytics:"Thống kê",
 "visitor-tracking":"Theo dõi truy cập",security:"Bảo mật",system:"Hệ thống"
};
const keyOf=node=>node?.id==="tbVisitorNav"?"visitor-tracking":node?.dataset?.view||"";
function go(id){
 if(app.classList.contains("hidden"))return false;
 const node=[...nav.querySelectorAll(".nav-item")].find(n=>keyOf(n)===id);
 if(!node)return false;
 node.click();
 return true;
}
const css=document.createElement("link");
css.id="tb4LayoutCSS";css.rel="stylesheet";css.href="/admin-layout-v4.css?v=1";
document.head.append(css);
document.body.classList.add("tb-admin-v4");

// GLOBAL WORKSPACE: new group switcher and contextual route tabs, outside panels.
const workspace=document.createElement("section");
workspace.id="tb4WorkspaceBar";workspace.className="tb4-workspacebar";
workspace.setAttribute("aria-label","Điều hướng khu vực làm việc");
const line=document.createElement("div");line.className="tb4-workspace-line";
const identity=document.createElement("div");identity.className="tb4-workspace-identity";
const kicker=document.createElement("span");kicker.className="tb4-kicker";
kicker.textContent="TRUNG TÂM ĐIỀU HÀNH / WORKSPACE";
const title=document.createElement("h2");title.id="tb4CurrentTitle";
title.textContent="Tổng quan";
const description=document.createElement("p");description.id="tb4CurrentDescription";
description.textContent="Tổng hợp hoạt động";
identity.append(kicker,title,description);
const routeButton=document.createElement("button");
routeButton.type="button";routeButton.className="tb4-return";
routeButton.textContent="Về tổng quan";routeButton.addEventListener("click",()=>go("dashboard"));
line.append(identity,routeButton);
const row=document.createElement("nav");row.id="tb4GroupNav";row.className="tb4-groupnav";
row.setAttribute("aria-label","Nhóm chức năng");
for(const g of GROUPS){
 const b=document.createElement("button");b.type="button";
 b.dataset.tb4Group=g.id;b.className="tb4-groupbutton";
 const label=document.createElement("strong");label.textContent=g.title;
 const count=document.createElement("small");count.textContent=String(g.targets.length).padStart(2,"0");
 b.append(label,count);
 b.addEventListener("click",()=>go(g.targets[0]));
 row.append(b);
}
const sub=document.createElement("nav");sub.id="tb4RouteTabs";
sub.className="tb4-route-tabs";sub.setAttribute("aria-label","Các màn trong nhóm");
workspace.append(line,row,sub);
area.prepend(workspace);

// SIDEBAR SEARCH: filters original nav buttons without replacing/detaching them.
const find=document.createElement("div");find.id="tb4NavSearch";find.className="tb4-nav-search";
const searchLabel=document.createElement("label");
searchLabel.setAttribute("for","tb4SearchInput");searchLabel.textContent="Tìm công cụ";
const input=document.createElement("input");input.type="search";
input.id="tb4SearchInput";input.placeholder="Tìm trong 13 màn…";
input.autocomplete="off";input.setAttribute("aria-keyshortcuts","Control+k Meta+k");
find.append(searchLabel,input);nav.insertAdjacentElement("beforebegin",find);
function normalize(text){return String(text||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/gi,"d").toLowerCase();}
function filterNav(){
 const q=normalize(input.value.trim());
 let visible=0;
 for(const button of nav.querySelectorAll(".nav-item")){
  const matches=!q||normalize(button.textContent+" "+(ROUTES[keyOf(button)]||"")).includes(q);
  button.classList.toggle("tb4-filter-hidden",!matches);
  if(matches)visible++;
 }
 const children=[...nav.children];
 for(let i=0;i<children.length;i++){
  const node=children[i];
  if(!node.classList?.contains("tb-admin-b-group"))continue;
  let match=false;
  for(let j=i+1;j<children.length&&!children[j].classList?.contains("tb-admin-b-group");j++){
   if(children[j].classList?.contains("nav-item")&&!children[j].classList.contains("tb4-filter-hidden"))match=true;
  }
  node.classList.toggle("tb4-filter-hidden",!match);
 }
 input.setAttribute("aria-label",visible+" chức năng phù hợp");
}
input.addEventListener("input",filterNav);
input.addEventListener("keydown",e=>{
 if(e.key==="Escape"){input.value="";filterNav();input.blur();}
 if(e.key==="Enter"){
  const first=[...nav.querySelectorAll(".nav-item")].find(n=>!n.classList.contains("tb4-filter-hidden"));
  if(first){first.click();input.blur();}
 }
});
document.addEventListener("keydown",e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){
  if(app.classList.contains("hidden"))return;
  e.preventDefault();input.focus();input.select();
 }
});
const menuObserver=new MutationObserver(filterNav);
menuObserver.observe(nav,{childList:true,subtree:false});

// DASHBOARD: a real information architecture, not another decorative banner.
// Keep existing KPI, action-center, health and recent-activity DOM nodes alive;
// their legacy API updates and delegated actions continue to work.
document.getElementById("tb3Hero")?.remove();
document.getElementById("tb3ShortcutsLabel")?.remove();
document.getElementById("tb3OverviewLabel")?.remove();
const kpis=dash.querySelector(".kpi-grid");
const topGrid=[...dash.querySelectorAll(".dash-grid")].find(el=>!el.classList.contains("lower"));
const recent=dash.querySelector(".dash-grid.lower");
const quick=document.getElementById("tbCDashboardActions");
if(kpis&&topGrid&&quick){
 const layout=document.createElement("div");
 layout.className="tb4-home";layout.id="tb4Home";
 const left=document.createElement("div");left.className="tb4-home-main";
 const right=document.createElement("aside");right.className="tb4-home-rail";
 right.setAttribute("aria-label","Tác vụ và tình trạng hệ thống");
 const header=document.createElement("div");header.className="tb4-home-header";
 const headline=document.createElement("div");
 const eyebrow=document.createElement("span");eyebrow.className="tb4-eyebrow";
 eyebrow.textContent="KHÔNG GIAN ĐIỀU HÀNH";
 const h=document.createElement("h3");h.textContent="Bàn làm việc";
 const p=document.createElement("p");
 p.textContent="Số liệu, công cụ và công việc quan trọng được sắp xếp theo ưu tiên.";
 headline.append(eyebrow,h,p);header.append(headline);
 const actions=document.createElement("div");actions.className="tb4-heading-actions";
 for(const [label,key] of [["Bài viết","posts"],["Beta","beta"]]){
  const button=document.createElement("button");button.type="button";
  button.textContent=label;button.addEventListener("click",()=>go(key));
  actions.append(button);
 }
 header.append(actions);
 const statsHeading=document.createElement("div");statsHeading.className="tb4-pane-heading";
 statsHeading.innerHTML="<h4>Chỉ số hoạt động</h4><span>Dữ liệu từ hệ thống hiện hành</span>";
 const modulesHeading=document.createElement("div");modulesHeading.className="tb4-pane-heading";
 modulesHeading.innerHTML="<h4>Khu vực quản lý</h4><span>Chọn một màn để bắt đầu</span>";
 const modules=document.createElement("div");modules.className="tb4-modules";modules.id="tb4Modules";
 const items=[
  ["posts","01","Bài viết","Biên tập, quản lý nháp và xuất bản"],
  ["content","02","Trang web","Quản lý nội dung các trang"],
  ["beta","03","Phiên bản Beta","Trạng thái, phiên bản và liên kết"],
  ["users","04","Người dùng","Tài khoản và dữ liệu cộng đồng"],
  ["inbox","05","Hộp thư","Liên hệ và phản hồi"],
  ["analytics","06","Phân tích","Số liệu vận hành và truy cập"]
 ];
 for(const [key,number,name,detail] of items){
  const b=document.createElement("button");b.type="button";b.className="tb4-module";
  b.dataset.tb4Route=key;
  const n=document.createElement("span");n.className="tb4-module-number";n.textContent=number;
  const body=document.createElement("span");body.className="tb4-module-copy";
  const heading=document.createElement("strong");heading.textContent=name;
  const secondary=document.createElement("small");secondary.textContent=detail;
  const arrow=document.createElement("span");arrow.className="tb4-module-arrow";arrow.textContent="↗";
  body.append(heading,secondary);b.append(n,body,arrow);
  b.addEventListener("click",()=>go(key));modules.append(b);
 }
 const quickHeading=document.createElement("div");quickHeading.className="tb4-pane-heading";
 quickHeading.innerHTML="<h4>Thao tác nhanh</h4><span>Đi đến màn chức năng tương ứng</span>";
 left.append(header,statsHeading,kpis,modulesHeading,modules,quickHeading,quick);
 if(recent){
  const recentHeading=document.createElement("div");
  recentHeading.className="tb4-pane-heading";
  recentHeading.innerHTML="<h4>Hoạt động gần đây</h4><span>Dữ liệu sẽ xuất hiện khi API trả thành công</span>";
  left.append(recentHeading,recent);
 }
 const sideHeading=document.createElement("div");sideHeading.className="tb4-side-heading";
 sideHeading.innerHTML="<span>TRẠNG THÁI & CÔNG VIỆC</span><h4>Cần quan tâm</h4>";
 right.append(sideHeading,topGrid);
 layout.append(left,right);dash.append(layout);
}

// CONTEXTUAL SUBNAV: groups share a stable route switcher on every page.
let pending=false;
function renderCurrent(){
 pending=false;
 const active=[...nav.querySelectorAll(".nav-item")].find(n=>n.classList.contains("active"));
 const current=keyOf(active)||location.hash.slice(1)||"dashboard";
 const group=GROUPS.find(g=>g.targets.includes(current))||GROUPS[0];
 title.textContent=ROUTES[current]||"Tổng quan";
 description.textContent=group.brief;
 routeButton.hidden=current==="dashboard";
 for(const b of row.querySelectorAll("button")){
  const selected=b.dataset.tb4Group===group.id;
  b.classList.toggle("active",selected);
  if(selected)b.setAttribute("aria-current","true");else b.removeAttribute("aria-current");
 }
 const currentKeys=[...sub.querySelectorAll("[data-tb4-route]")].map(b=>b.dataset.tb4Route).join("|");
 if(currentKeys!==group.targets.join("|")){
  sub.replaceChildren();
  for(const id of group.targets){
   const b=document.createElement("button");b.type="button";
   b.dataset.tb4Route=id;b.textContent=ROUTES[id]||id;
   b.addEventListener("click",()=>go(id));sub.append(b);
  }
 }
 for(const b of sub.querySelectorAll("button")){
  const selected=b.dataset.tb4Route===current;
  b.classList.toggle("active",selected);
  if(selected)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");
 }
}
function scheduleRender(){
 if(pending)return;
 pending=true;requestAnimationFrame(renderCurrent);
}
new MutationObserver(scheduleRender).observe(nav,{attributes:true,attributeFilter:["class"],subtree:true});
new MutationObserver(scheduleRender).observe(app,{attributes:true,attributeFilter:["class"]});
window.addEventListener("hashchange",scheduleRender);
window.addEventListener("popstate",scheduleRender);
window.addEventListener("load",scheduleRender,{once:true});
scheduleRender();
})();
