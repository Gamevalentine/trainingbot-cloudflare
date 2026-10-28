/* TrainingBot ADM-02/03/04/05: reversible Admin UI enhancement only.
 * No request, DB write, API change, or new authentication entry point.
 */
(()=>{
 "use strict";
 const byId=id=>document.getElementById(id);
 function css(){
  if(byId("tbAdminReworkCSS"))return;
  const style=document.createElement("style");
  style.id="tbAdminReworkCSS";
  style.textContent=[
   'body.tb-admin-reworked .side-nav>.tb-admin-group-title{padding:14px 14px 5px;margin:6px 0 0;color:#99a9c4;font-size:11px!important;font-weight:850;letter-spacing:.08em}',
   'body.tb-admin-reworked .side-nav>.tb-admin-group-title:first-child{margin-top:0}',
   'body.tb-admin-reworked .side-nav>.nav-item{min-height:44px;font-size:14px}',
   'body.tb-admin-reworked .side-nav>.nav-item b{font-size:14px!important}',
   'body.tb-admin-reworked .command-hero{display:none!important}',
   'body.tb-admin-reworked .quick-grid{display:none!important}',
   'body.tb-admin-reworked .health-score .score-ring{display:none!important}',
   'body.tb-admin-reworked .tb-admin-health-note{font-size:12px;color:#9caac2;margin:10px 0;line-height:1.6}',
   'body.tb-admin-reworked .tb-admin-beta-panel{min-width:0}',
   'body.tb-admin-reworked .tb-admin-beta-panel .tb-beta-admin{margin-top:16px}',
   'body.tb-admin-reworked .tb-admin-beta-panel .tb-beta-list{margin:14px 0}',
   'body.tb-admin-reworked .tb-admin-beta-panel .tb-admin-beta-editor{border:1px solid #293650;border-radius:12px;padding:12px;margin:16px 0;background:#08101e}',
   'body.tb-admin-reworked .tb-admin-beta-panel .tb-admin-beta-editor>summary{cursor:pointer;font-weight:850;min-height:44px;display:flex;align-items:center;color:#c9c3ff}',
   'body.tb-admin-reworked .tb-admin-beta-panel .tb-admin-beta-editor:focus-within{border-color:#745cff}',
   'body.tb-admin-reworked .tb-admin-beta-panel .tb-beta-head{flex-wrap:wrap}',
   'body.tb-admin-reworked .tb-admin-beta-panel .tb-beta-admin .tb-beta-field label{font-size:12px}',
   'body.tb-admin-reworked .tb-admin-beta-panel .tb-beta-note,body.tb-admin-reworked .tb-admin-beta-panel .tb-beta-status{font-size:12px}',
   'body.tb-admin-reworked .tb-admin-beta-panel .tb-beta-edit,body.tb-admin-reworked .tb-admin-beta-panel .tb-beta-delete{min-height:44px;font-size:12px}',
   '@media(max-width:720px){body.tb-admin-reworked .tb-admin-beta-panel .tb-beta-row{grid-template-columns:1fr}body.tb-admin-reworked .tb-admin-beta-panel .tb-beta-actions{display:flex;flex-wrap:wrap}}'
  ].join("\n");
  document.head.append(style);
 }
 function main(){
  const app=byId("adminApp"),nav=app?.querySelector("#sidebar .side-nav");
  if(!app||!nav)return false;
  if(nav.dataset.tbAdminRework==="1")return true;
  const available=new Map([...nav.querySelectorAll(".nav-item[data-view]")].map(b=>[b.dataset.view,b]));
  const needed=["dashboard","content","studio","media","wiki","users","inbox","analytics","security","system"];
  if(needed.some(name=>!available.has(name)))return false;
  const contentPanel=app.querySelector('[data-view-panel="content"]');
  if(!contentPanel)return false;
  const betaPanel=document.createElement("section");
  betaPanel.className="view tb-admin-beta-panel";betaPanel.dataset.viewPanel="beta";
  betaPanel.innerHTML='<div class="section-title"><div><span class="eyebrow">NỘI DUNG</span><h2>Phiên bản Beta</h2><p>Danh sách và trạng thái phát hành của PUBG Mobile Beta.</p></div></div>';
  contentPanel.insertAdjacentElement("afterend",betaPanel);
  const betaButton=document.createElement("button");
  betaButton.type="button";betaButton.className="nav-item";betaButton.dataset.view="beta";
  betaButton.innerHTML="<span>↓</span><b>Phiên bản Beta</b>";
  betaButton.setAttribute("aria-label","Mở danh sách phiên bản Beta");
  betaButton.addEventListener("click",()=>{
   if(location.hash!=="#beta")location.hash="beta";
   showBeta();
   // When login happened after the initial loader, refresh only on explicit entry.
   byId("tbBetaReload")?.click();
  });
  const groups=[
   ["TỔNG QUAN",[["dashboard","Tổng quan"]]],
   ["NỘI DUNG",[["posts","Bài viết"],["content","Trang web"],["wiki","Wiki"],["beta","Phiên bản Beta"]]],
   ["THƯ VIỆN",[["media","Ảnh, video và tệp"]]],
   ["CỘNG ĐỒNG",[["users","Người dùng"],["inbox","Hộp thư"]]],
   ["THỐNG KÊ",[["analytics","Tổng hợp và truy cập"]]],
   ["CÀI ĐẶT",[["security","Bảo mật"],["system","Hệ thống"]]]
  ];
  nav.replaceChildren();
  for(const [heading,items] of groups){
   const title=document.createElement("p");title.className="tb-admin-group-title";title.textContent=heading;nav.append(title);
   for(const [name,label] of items){
    const node=name==="beta"?betaButton:available.get(name);
    if(!node)continue;
    const text=node.querySelector("b");if(text)text.textContent=label;
    nav.append(node);
   }
  }
  const title=byId("pageTitle"),eyebrow=byId("pageEyebrow");
  // Original packed router assigns "Admin Center" to any new route. Keep its
  // protected route handling, but synchronize the Beta title after it updates.
  if(title){
   const observer=new MutationObserver(()=>{
    if(location.hash==="#beta"&&title.textContent!=="Phiên bản Beta")title.textContent="Phiên bản Beta";
   });
   observer.observe(title,{childList:true,subtree:true,characterData:true});
  }
  function showBeta(){
   app.querySelectorAll(".view").forEach(view=>view.classList.toggle("active",view===betaPanel));
   nav.querySelectorAll(".nav-item").forEach(button=>button.classList.toggle("active",button===betaButton));
   if(title)title.textContent="Phiên bản Beta";
   if(eyebrow)eyebrow.textContent="NỘI DUNG";
   const close=byId("closeSidebar");if(close)close.click();
  }
  const currentHash=()=>location.hash.replace(/^#/,"");
  window.addEventListener("hashchange",()=>{if(currentHash()==="beta")queueMicrotask(showBeta);});
  window.addEventListener("popstate",()=>{if(currentHash()==="beta")queueMicrotask(showBeta);});
  if(currentHash()==="beta")queueMicrotask(showBeta);
  const viewContent=contentPanel.querySelector(".section-title h2");
  if(viewContent)viewContent.textContent="Trang web";
  const info=contentPanel.querySelector(".section-title p");
  if(info)info.textContent="Chọn trang để xem hoặc mở trình biên tập hiện có.";
  const dash=app.querySelector('[data-view-panel="dashboard"]');
  if(dash&&!dash.querySelector(".tb-admin-dashboard-action")){
   const b=document.createElement("button");b.type="button";
   b.className="btn primary tb-admin-dashboard-action";b.dataset.go="posts";
   b.textContent="Quản lý bài viết";b.style.marginBottom="16px";dash.prepend(b);
  }
  const health=app.querySelector(".health-score");
  if(health&&!health.querySelector(".tb-admin-health-note")){
   const head=health.querySelector(".panel-head h3");
   if(head)head.textContent="Các dịch vụ đã kiểm tra";
   const note=document.createElement("p");note.className="tb-admin-health-note";
   note.textContent="Trạng thái chỉ phản ánh các phép kiểm tra đang hiển thị, không xác nhận quyền lưu hoặc xuất bản.";
   health.append(note);
  }
  // The real Beta form/list is injected by the previous manager. Move its DOM
  // node with original listeners. The editor is collapsed until explicitly used.
  function relocateBeta(){
   const node=byId("tbBetaAdmin");
   if(!node)return false;
   if(betaPanel.contains(node))return true;
   betaPanel.append(node);
   const form=byId("tbBetaForm"),note=node.querySelector(".tb-beta-note"),list=byId("tbBetaList");
   if(form&&list){
    node.insertBefore(list,form);
    const editor=document.createElement("details");editor.className="tb-admin-beta-editor";
    const summary=document.createElement("summary");
    summary.textContent="Thêm hoặc chỉnh sửa phiên bản";
    node.insertBefore(editor,form);editor.append(summary,form);
    if(note)editor.append(note);
    node.addEventListener("click",event=>{
     if(event.target.closest("[data-edit-beta]"))editor.open=true;
    },true);
   }
   return true;
  }
  if(!relocateBeta()){
   const observer=new MutationObserver(()=>{if(relocateBeta())observer.disconnect();});
   observer.observe(contentPanel,{childList:true,subtree:true});
   setTimeout(()=>observer.disconnect(),12000);
  }
  nav.dataset.tbAdminRework="1";document.body.classList.add("tb-admin-reworked");css();
  return true;
 }
 let tries=0;
 function boot(){if(main())return;if(++tries<120)setTimeout(boot,100);}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();