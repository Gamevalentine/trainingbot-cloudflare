/* TrainingBot Admin — Stage B (ADM-02 + ADM-03).
 * Progressive six-group navigation, functional back/forward routing, responsive
 * cohesive styling. Keep all legacy view panels, listeners, token and APIs.
 * No external request, mutation, storage or configuration changes here.
 */
(()=>{
"use strict";
const GROUPS=[
 ["TỔNG QUAN",[["dashboard","Tổng quan"]]],
 ["NỘI DUNG",[["posts","Bài viết"],["content","Trang web"],["wiki","Wiki"],["studio","Studio V2"]]],
 ["THƯ VIỆN",[["media","Thư viện media"]]],
 ["CỘNG ĐỒNG",[["users","Người dùng"],["inbox","Hộp thư"]]],
 ["THỐNG KÊ",[["analytics","Thống kê"],["visitor-tracking","Theo dõi truy cập"]]],
 ["CÀI ĐẶT",[["security","Bảo mật"],["system","Hệ thống"]]]
];
const groupOf=new Map(GROUPS.flatMap(([group,items])=>items.map(([id])=>[id,group])));
const labelOf=new Map(GROUPS.flatMap(([,items])=>items));
const app=document.getElementById("adminApp");
const nav=app?.querySelector("#sidebar .side-nav");
if(!app||!nav)return;
const navKey=node=>node?.id==="tbVisitorNav"?"visitor-tracking":node?.dataset?.view||"";
const isActive=()=>!app.classList.contains("hidden");
let regrouping=false,pending=false;
function buttons(){return [...nav.querySelectorAll(".nav-item")];}
function reorganize(){
 if(regrouping)return;
 const existing=buttons(),lookup=new Map();
 for(const button of existing){
  const key=navKey(button);
  if(key&&!lookup.has(key))lookup.set(key,button);
 }
 const expected=[...GROUPS.flatMap(([,items])=>items.map(([id])=>id).filter(id=>lookup.has(id)))];
 const unknown=existing.filter(node=>!groupOf.has(navKey(node)));
 const current=[...nav.children].filter(x=>x.classList?.contains("nav-item")).map(navKey);
 const headings=[...nav.children].filter(x=>x.classList?.contains("tb-admin-b-group")).map(x=>x.textContent.trim());
 if(!unknown.length&&current.join("|")===expected.join("|")&&headings.join("|")===GROUPS.map(x=>x[0]).join("|"))return;
 regrouping=true;
 const nodes=[];
 for(const [heading,items] of GROUPS){
  const title=document.createElement("p");
  title.className="tb-admin-b-group";
  title.textContent=heading;
  nodes.push(title);
  for(const [id,label] of items){
   const button=lookup.get(id);
   if(!button)continue;
   const b=button.querySelector("b");
   if(b)b.textContent=label;
   if(!button.hasAttribute("type"))button.type="button";
   if(!button.hasAttribute("aria-label"))button.setAttribute("aria-label",label);
   nodes.push(button); // move ORIGINAL node, keep all attached legacy listeners
  }
 }
 // Fail open for any new Plugin/Admin menu items unknown to Stage B.
 if(unknown.length){
  nodes.push(...unknown);
 }
 nav.replaceChildren(...nodes);
 regrouping=false;
 updateSection();
}
function scheduleRegroup(){
 if(pending)return;
 pending=true;
 queueMicrotask(()=>{pending=false;reorganize();});
}
const observer=new MutationObserver(scheduleRegroup);
observer.observe(nav,{childList:true,subtree:false});
function updateSection(){
 const active=buttons().find(node=>node.classList.contains("active"));
 const key=navKey(active)||location.hash.slice(1)||"dashboard";
 const eyebrow=document.getElementById("pageEyebrow");
 if(eyebrow)eyebrow.textContent=groupOf.get(key)||"ADMIN CENTER";
 for(const node of buttons()){
  const selected=node===active;
  if(selected)node.setAttribute("aria-current","page");
  else node.removeAttribute("aria-current");
 }
}
function installStyles(){
 if(document.getElementById("tbAdminStageBStyles"))return;
 const style=document.createElement("style");style.id="tbAdminStageBStyles";
 style.textContent=[
 'body.tb-admin-stage-b{font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}',
 'body.tb-admin-stage-b .sidebar{background:#090f1d;border-right:1px solid #222e47}',
 'body.tb-admin-stage-b .side-nav{display:flex;flex-direction:column;gap:3px;padding:10px 9px 16px}',
 'body.tb-admin-stage-b .side-nav>.tb-admin-b-group{margin:14px 6px 5px;padding:0 8px;color:#a6b5d0;font-size:10.5px!important;letter-spacing:.105em;font-weight:850;line-height:1.8}',
 'body.tb-admin-stage-b .side-nav>.tb-admin-b-group:first-child{margin-top:4px}',
 'body.tb-admin-stage-b .side-nav>.nav-item{display:flex;align-items:center;gap:12px;min-height:44px;padding:9px 13px;border-radius:11px;font-size:13px;line-height:1.4;white-space:normal;text-align:left}',
 'body.tb-admin-stage-b .side-nav>.nav-item b{font-weight:700;font-size:13px}',
 'body.tb-admin-stage-b .side-nav>.nav-item:focus-visible{outline:2px solid #a99bff;outline-offset:2px}',
 'body.tb-admin-stage-b .side-nav>.nav-item.active{background:linear-gradient(95deg,rgba(121,91,254,.26),rgba(96,78,190,.10));color:#eee9ff;box-shadow:inset 3px 0 #917aff;border:1px solid #594c88}',
 'body.tb-admin-stage-b .side-nav>.nav-item:hover:not(.active){background:#18243b}',
 'body.tb-admin-stage-b .sidebar .side-foot{border-top:1px solid #222e47}',
 'body.tb-admin-stage-b .topbar{border-bottom:1px solid #27324b;background:rgba(9,15,29,.96)}',
 'body.tb-admin-stage-b #pageEyebrow{letter-spacing:.11em;font-size:10px;font-weight:800;color:#a49eff}',
 'body.tb-admin-stage-b #pageTitle{font-weight:800;letter-spacing:-.025em}',
 'body.tb-admin-stage-b .content-area{width:100%;box-sizing:border-box;max-width:1540px;margin:0 auto}',
 'body.tb-admin-stage-b .panel,body.tb-admin-stage-b .kpi{border-color:#293650;border-radius:15px}',
 'body.tb-admin-stage-b .btn:focus-visible,body.tb-admin-stage-b button:focus-visible,body.tb-admin-stage-b a:focus-visible,body.tb-admin-stage-b input:focus-visible,body.tb-admin-stage-b select:focus-visible{outline:2px solid #a99bff;outline-offset:2px}',
 'body.tb-admin-stage-b .section-title{gap:14px;flex-wrap:wrap}',
 'body.tb-admin-stage-b .view{min-width:0}',
 'body.tb-admin-stage-b .panel,body.tb-admin-stage-b .kpi,body.tb-admin-stage-b .page-grid{min-width:0}',
 'body.tb-admin-stage-b .content-area table{max-width:100%}',
 'body.tb-admin-stage-b .topbar-right{gap:8px;min-width:0}',
 'body.tb-admin-stage-b #openSidebar,body.tb-admin-stage-b #closeSidebar{min-width:44px;min-height:44px}',
 'body.tb-admin-stage-b .tb-admin-b-skip{position:fixed;left:12px;top:-70px;padding:10px 14px;background:#f3eeff;color:#201446;z-index:99999;border-radius:8px;font-weight:750}',
 'body.tb-admin-stage-b .tb-admin-b-skip:focus{top:10px}',
 '@media(max-width:1100px){body.tb-admin-stage-b .content-area{padding-left:16px;padding-right:16px}body.tb-admin-stage-b .dash-grid{gap:12px}}',
 '@media(max-width:760px){body.tb-admin-stage-b .topbar{min-height:68px;padding:9px 14px}body.tb-admin-stage-b .content-area{padding:15px 12px 34px}body.tb-admin-stage-b .kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}body.tb-admin-stage-b .dash-grid,body.tb-admin-stage-b .dash-grid.lower{grid-template-columns:minmax(0,1fr);gap:12px}body.tb-admin-stage-b .sidebar{width:min(87vw,310px)}body.tb-admin-stage-b #pageTitle{font-size:21px}body.tb-admin-stage-b .topbar-right .global-status{max-width:125px;overflow:hidden;text-overflow:ellipsis}body.tb-admin-stage-b .topbar-right .avatar{display:none}}',
 '@media(max-width:390px){body.tb-admin-stage-b .kpi-grid{grid-template-columns:minmax(0,1fr)}body.tb-admin-stage-b .topbar-right .global-status{max-width:90px}}',
 '@media(prefers-reduced-motion:reduce){body.tb-admin-stage-b *,body.tb-admin-stage-b *::before,body.tb-admin-stage-b *::after{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important}}'
 ].join("\n");
 document.head.append(style);
}
function routeFromHistory(){
 if(!isActive())return;
 const key=decodeURIComponent(location.hash.slice(1))||"dashboard";
 const node=buttons().find(button=>navKey(button)===key);
 if(!node)return;
 // Existing router owns view rendering and its API loads. Do not replace it.
 if(!node.classList.contains("active"))node.click();
 requestAnimationFrame(updateSection);
}
let restorationPending=false;
function onHistory(){
 if(restorationPending)return;
 restorationPending=true;
 requestAnimationFrame(()=>{restorationPending=false;routeFromHistory();});
}
// A click with user intent should create a navigable history entry.
// The legacy router subsequently uses replaceState with the same fragment.
document.addEventListener("click",event=>{
 if(!isActive())return;
 const button=event.target.closest(".nav-item,[data-go],[data-go-action]");
 if(!button||!app.contains(button))return;
 const target=navKey(button)||button.dataset.go||button.dataset.goAction;
 if(!target||!app.querySelector('.view[data-view-panel="'+target+'"]'))return;
 if(location.hash.slice(1)!==target){
  history.pushState({trainingbotAdminStageB:true},"","#"+target);
 }
 requestAnimationFrame(updateSection);
},true);
window.addEventListener("popstate",onHistory);
window.addEventListener("hashchange",onHistory);
document.addEventListener("keydown",event=>{
 if(event.key!=="Escape"||!isActive())return;
 const sidebar=document.getElementById("sidebar");
 if(!sidebar)return;
 const close=document.getElementById("closeSidebar");
 const backdrop=document.getElementById("sidebarBackdrop");
 if(sidebar.classList.contains("open")||backdrop?.classList.contains("visible")||document.body.classList.contains("sidebar-open")){
  close?.click();document.getElementById("openSidebar")?.focus();
 }
});
if(!document.getElementById("tbAdminStageBSkip")){
 const skip=document.createElement("button");
 skip.type="button";
 skip.id="tbAdminStageBSkip";skip.className="tb-admin-b-skip";
 skip.textContent="Chuyển tới nội dung";
 const main=app.querySelector(".content-area");
 if(main){main.id="tbAdminStageBMain";main.tabIndex=-1;skip.addEventListener("click",()=>main.focus());app.prepend(skip);}
}
// Sync active section even when the legacy runtime toggles the active class.
const activeObserver=new MutationObserver(()=>requestAnimationFrame(updateSection));
activeObserver.observe(nav,{subtree:true,attributes:true,attributeFilter:["class"]});
document.body.classList.add("tb-admin-stage-b");
nav.dataset.stageB="ready";
installStyles();
scheduleRegroup();
window.addEventListener("load",scheduleRegroup,{once:true});
})();
