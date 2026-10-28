/* Stage C Admin presentation only. Original forms, APIs and tokens untouched. */
(()=>{
 "use strict";
 const $=id=>document.getElementById(id),app=$("adminApp");
 const nav=app?.querySelector("#sidebar .side-nav");
 const content=app?.querySelector('[data-view-panel="content"]');
 const dash=app?.querySelector('[data-view-panel="dashboard"]');
 if(!nav||!content||!dash)return;
 if($("tbStageCStyle"))return;
 const style=document.createElement("style");style.id="tbStageCStyle";
 style.textContent=[
 'body.tb-admin-stage-c .command-hero{display:none!important}',
 'body.tb-admin-stage-c .quick-grid{display:none!important}',
 'body.tb-admin-stage-c .dash-grid.lower .panel:has(.quick-grid){display:none!important}',
 'body.tb-admin-stage-c .health-score .score-ring{display:none!important}',
 'body.tb-admin-stage-c .health-score .score-wrap{display:block}',
 'body.tb-admin-stage-c .health-score .score-wrap:before{content:"Chỉ phản ánh các API đã kiểm tra, không xác nhận toàn bộ hệ thống";display:block;color:#a6b5d0;font-size:12px;line-height:1.6;margin-bottom:12px}',
 'body.tb-admin-stage-c .tb-c-dash-actions{display:flex;flex-wrap:wrap;gap:9px;margin:0 0 17px}',
 'body.tb-admin-stage-c .tb-c-dash-actions button{min-height:44px;border:1px solid #475779;border-radius:10px;background:#15223a;color:#edf0ff;padding:9px 14px;font-weight:750;cursor:pointer}',
 'body.tb-admin-stage-c .tb-c-dash-actions button.primary{background:#6248c3;border-color:#9787ff}',
 'body.tb-admin-stage-c .tb-c-beta-panel .tb-beta-admin{margin-top:12px}',
 'body.tb-admin-stage-c .tb-c-beta-panel .tb-beta-list{display:grid;gap:10px;margin:14px 0}',
 'body.tb-admin-stage-c .tb-c-beta-panel .tb-c-beta-editor{padding:12px;border:1px solid #354565;border-radius:14px;margin:15px 0;background:#0a1529}',
 'body.tb-admin-stage-c .tb-c-beta-panel .tb-c-beta-editor summary{min-height:44px;display:flex;align-items:center;color:#dfdbff;font-weight:750;cursor:pointer}',
 'body.tb-admin-stage-c .tb-c-beta-panel .tb-beta-head{flex-wrap:wrap;gap:9px}',
 'body.tb-admin-stage-c .tb-c-beta-panel .tb-beta-edit,body.tb-admin-stage-c .tb-c-beta-panel .tb-beta-delete{min-height:44px}',
 'body.tb-admin-stage-c .tb-c-info{border:1px solid #344362;border-radius:12px;padding:12px;color:#bed0e9;font-size:12px;line-height:1.6;background:#111d31}',
 '@media(max-width:760px){body.tb-admin-stage-c .tb-c-dash-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}body.tb-admin-stage-c .tb-c-beta-panel .tb-beta-row{grid-template-columns:minmax(0,1fr)}}',
 '@media(max-width:390px){body.tb-admin-stage-c .tb-c-dash-actions{grid-template-columns:1fr}}'
 ].join("\n");
 document.head.append(style);document.body.classList.add("tb-admin-stage-c");
 if(!$("tbCDashboardActions")){
  const bar=document.createElement("div");bar.id="tbCDashboardActions";bar.className="tb-c-dash-actions";
  for(const [label,key] of [["Quản lý bài viết","posts"],["Trang web","content"],["Theo dõi truy cập","visitor-tracking"],["Hộp thư","inbox"]]){
   const b=document.createElement("button");b.type="button";b.textContent=label;
   b.addEventListener("click",()=>{
    const target=key==="visitor-tracking"?$("tbVisitorNav"):nav.querySelector('.nav-item[data-view="'+key+'"]');
    target?.click();
   });
   bar.append(b);
  }
  dash.insertBefore(bar,dash.querySelector(".kpi-grid"));
 }
 const title=dash.querySelector(".health-score .panel-head h3");
 if(title)title.textContent="Tình trạng API đã kiểm tra";
 const contentTitle=content.querySelector(".section-title h2");
 if(contentTitle)contentTitle.textContent="Trang web";
 const summary=content.querySelector(".section-title p");
 if(summary)summary.textContent="Các trang hiện có và lối vào Studio. Quản lý Bài viết và Beta ở các màn riêng.";
 const beta=document.createElement("section");beta.className="view tb-c-beta-panel";beta.dataset.viewPanel="beta";
 beta.innerHTML='<div class="section-title"><div><span class="eyebrow">NỘI DUNG</span><h2>Phiên bản Beta</h2><p>Quản lý trạng thái, phiên bản và URL tải bằng API hiện có.</p></div></div><p class="tb-c-info">Chỉ xuất bản phiên bản khi đã kiểm tra URL tải thực tế. Lưu thay đổi sẽ tác động trang công khai.</p>';
 content.insertAdjacentElement("afterend",beta);
 let booted=false,reloading=false;
 const betaNav=()=>nav.querySelector('.nav-item[data-view="beta"]');
 if(!betaNav()){
  const button=document.createElement("button");button.type="button";button.className="nav-item";button.dataset.view="beta";
  button.innerHTML="<span>↓</span><b>Phiên bản Beta</b>";button.setAttribute("aria-label","Phiên bản Beta");
  nav.append(button); // Stage B automatically regroups the new entry under Nội dung.
 }
 function show(){
  if(app.classList.contains("hidden"))return;
  app.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v===beta));
  nav.querySelectorAll(".nav-item").forEach(b=>{b.classList.toggle("active",b===betaNav());if(b!==betaNav())b.removeAttribute("aria-current");});
  betaNav()?.setAttribute("aria-current","page");
  if($("pageTitle"))$("pageTitle").textContent="Phiên bản Beta";
  if($("pageEyebrow"))$("pageEyebrow").textContent="NỘI DUNG";
  if(!reloading){reloading=true;$("tbBetaReload")?.click();}
  $("closeSidebar")?.click();
 }
 function move(){
  const panel=$("tbBetaAdmin");if(!panel)return false;
  if(beta.contains(panel))return true;
  beta.append(panel);
  const form=$("tbBetaForm"),list=$("tbBetaList");
  if(form&&list){
   panel.insertBefore(list,form);
   const details=document.createElement("details");details.className="tb-c-beta-editor";details.id="tbCBetaEditor";
   const label=document.createElement("summary");label.textContent="Thêm hoặc chỉnh sửa phiên bản";
   panel.insertBefore(details,form);details.append(label,form);
   panel.addEventListener("click",event=>{
    if(event.target.closest("[data-edit-beta]"))details.open=true;
   },true);
  }
  return true;
 }
 const observer=new MutationObserver(()=>{
  if(move()){observer.disconnect();if(location.hash==="#beta")requestAnimationFrame(show);}
 });
 if(!move())observer.observe(content,{childList:true,subtree:true});
 function mountNav(){
  const b=betaNav();
  if(!b||b.dataset.stageC==="ready")return;
  b.dataset.stageC="ready";
  b.addEventListener("click",()=>{reloading=false;show();});
 }
 const navObserver=new MutationObserver(mountNav);
 navObserver.observe(nav,{childList:true,subtree:false});
 mountNav();
 function restore(){
  if(location.hash==="#beta"){reloading=false;show();}
 }
 window.addEventListener("popstate",restore);
 window.addEventListener("hashchange",restore);
 const authObserver=new MutationObserver(()=>{
  if(!app.classList.contains("hidden"))requestAnimationFrame(restore);
 });
 authObserver.observe(app,{attributes:true,attributeFilter:["class"]});
 requestAnimationFrame(restore);
})();