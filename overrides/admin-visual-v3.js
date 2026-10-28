/* TrainingBot Admin Visual V3 — presentation only.
 * Reuses the existing protected A–E runtime, navigation and API handlers.
 * No credential, storage, network or data mutations.
 */
(()=>{
 "use strict";
 const app=document.getElementById("adminApp");
 const nav=app?.querySelector("#sidebar .side-nav");
 const dashboard=app?.querySelector('[data-view-panel="dashboard"]');
 if(!app||!nav||!dashboard||document.getElementById("tb3Hero"))return;
 const css=document.createElement("link");
 css.rel="stylesheet";css.href="/admin-visual-v3.css?v=3";
 css.id="tb3DesignStyles";document.head.append(css);
 document.body.classList.add("tb-admin-v3");
 const label=document.createElement("div");
 label.className="tb3-sidebar-version";
 label.textContent="Control Center · Giao diện V3";
 nav.insertAdjacentElement("beforebegin",label);
 const go=key=>{
   if(app.classList.contains("hidden"))return;
   const button=key==="visitor-tracking"
     ?document.getElementById("tbVisitorNav")
     :nav.querySelector('.nav-item[data-view="'+key+'"]');
   button?.click();
 };
 const hero=document.createElement("section");
 hero.id="tb3Hero";hero.className="tb3-hero";
 hero.setAttribute("aria-label","Trung tâm điều hành TrainingBot");
 const copy=document.createElement("div");copy.className="tb3-hero-copy";
 const eyebrow=document.createElement("div");eyebrow.className="tb3-eyebrow";
 eyebrow.textContent="TRAININGBOT / ADMIN CONTROL CENTER";
 const heading=document.createElement("h2");heading.textContent="Mọi hoạt động. Một nơi quản lý.";
 const desc=document.createElement("p");
 desc.textContent="Điều hành nội dung, phiên bản Beta và cộng đồng từ trung tâm quản trị thống nhất.";
 const actions=document.createElement("div");actions.className="tb3-hero-buttons";
 const post=document.createElement("button");post.type="button";post.textContent="Quản lý bài viết";
 post.addEventListener("click",()=>go("posts"));
 const beta=document.createElement("button");beta.type="button";beta.textContent="Phiên bản Beta";
 beta.addEventListener("click",()=>go("beta"));
 actions.append(post,beta);
 copy.append(eyebrow,heading,desc,actions);
 const grid=document.createElement("div");grid.className="tb3-hero-statgrid";
 for(const [num,text] of [["06","Nhóm quản trị"],["13","Màn chức năng"]]){
   const cell=document.createElement("div");cell.className="tb3-hero-stat";
   const strong=document.createElement("strong");strong.textContent=num;
   const caption=document.createElement("span");caption.textContent=text;
   cell.append(strong,caption);grid.append(cell);
 }
 hero.append(copy,grid);
 const quick=document.getElementById("tbCDashboardActions");
 dashboard.insertBefore(hero,quick||dashboard.firstElementChild);
 // Labels are informational. The existing Dashboard KPIs remain backed by
 // real API state; no new fake metrics or success indicators are introduced.
 if(quick&&!document.getElementById("tb3ShortcutsLabel")){
   const label=document.createElement("div");label.className="tb3-section-label";label.id="tb3ShortcutsLabel";
   const title=document.createElement("b");title.textContent="Lối tắt quản trị";
   const note=document.createElement("small");note.textContent="Di chuyển nhanh giữa các công cụ";
   label.append(title,note);quick.insertAdjacentElement("beforebegin",label);
 }
 const kpi=dashboard.querySelector(".kpi-grid");
 if(kpi&&!document.getElementById("tb3OverviewLabel")){
   const label=document.createElement("div");label.className="tb3-section-label";label.id="tb3OverviewLabel";
   const title=document.createElement("b");title.textContent="Tổng quan dữ liệu";
   const note=document.createElement("small");note.textContent="Chỉ số do các API hiện hành cung cấp";
   label.append(title,note);kpi.insertAdjacentElement("beforebegin",label);
 }
})();
