/* Stage D (ADM-07): the six remaining Admin panels.
 * Presentation and safety labels only. Original buttons/handlers remain.
 * Does not create endpoints, change authorization, or issue API requests.
 */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const app=$("adminApp");if(!app)return;
const panels={};
for(const name of ["media","users","inbox","analytics","security","system"]){
 const p=app.querySelector('.view[data-view-panel="'+name+'"]');
 if(!p)return;panels[name]=p;
}
if(Object.keys(panels).length!==6||$("tbAdminStageDStyle"))return;
const css=document.createElement("style");css.id="tbAdminStageDStyle";
css.textContent=[
'body.tb-admin-stage-d .tb-d-note{padding:11px 14px;margin:0 0 17px;border:1px solid #354767;border-radius:12px;background:#121f34;color:#bbcee8;font-size:12px;line-height:1.65}',
'body.tb-admin-stage-d .tb-d-note strong{color:#ece6ff}',
'body.tb-admin-stage-d .tb-d-section-actions{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin:0 0 15px}',
'body.tb-admin-stage-d .tb-d-section-actions button{min-height:44px;padding:8px 15px;border:1px solid #514982;border-radius:10px;background:#2a2450;color:#e9e3ff;font-weight:750;cursor:pointer}',
'body.tb-admin-stage-d .tb-d-section-actions button:focus-visible{outline:2px solid #bdadff;outline-offset:2px}',
'body.tb-admin-stage-d .tb-d-columns{min-width:0;max-width:100%}',
'body.tb-admin-stage-d .view[data-view-panel="users"] .table-wrap,body.tb-admin-stage-d .view[data-view-panel="users"] .table-scroll{overflow-x:auto;max-width:100%}',
'body.tb-admin-stage-d .view[data-view-panel="users"] table{min-width:720px}',
'body.tb-admin-stage-d .view[data-view-panel="inbox"] .mail-card{min-width:0;overflow-wrap:anywhere}',
'body.tb-admin-stage-d .view[data-view-panel="inbox"] .mail-actions{display:flex;gap:8px;flex-wrap:wrap}',
'body.tb-admin-stage-d .view[data-view-panel="inbox"] .mail-actions button{min-height:44px}',
'body.tb-admin-stage-d .view[data-view-panel="media"] input,body.tb-admin-stage-d .view[data-view-panel="users"] input,body.tb-admin-stage-d .view[data-view-panel="inbox"] input{min-width:0;max-width:100%;box-sizing:border-box}',
'body.tb-admin-stage-d button:disabled{cursor:not-allowed;opacity:.55}',
'body.tb-admin-stage-d .view[data-view-panel="analytics"] .bar-row{min-width:0}',
'body.tb-admin-stage-d .view[data-view-panel="analytics"] #userActivityChart,body.tb-admin-stage-d .view[data-view-panel="analytics"] #mailLegend{overflow-wrap:anywhere}',
'@media(max-width:760px){body.tb-admin-stage-d .view[data-view-panel="media"] .media-grid{grid-template-columns:repeat(2,minmax(0,1fr))}body.tb-admin-stage-d .view[data-view-panel="analytics"] .analytics-grid{grid-template-columns:1fr}body.tb-admin-stage-d .tb-d-note{font-size:12px}}',
'@media(max-width:390px){body.tb-admin-stage-d .view[data-view-panel="media"] .media-grid{grid-template-columns:1fr}}'
].join("\n");document.head.append(css);document.body.classList.add("tb-admin-stage-d");
function note(view,title,description){
 const el=document.createElement("div");el.className="tb-d-note";el.dataset.adminStageD=view;
 const strong=document.createElement("strong");strong.textContent=title+" ";
 el.append(strong,document.createTextNode(description));
 const heading=panels[view].querySelector(".section-title");
 if(heading)heading.insertAdjacentElement("afterend",el);
 else panels[view].prepend(el);
 return el;
}
note("media","Phạm vi thư viện:","Danh mục media tại đây được lưu trên trình duyệt hiện tại. Ảnh và video đã tải lên có thể dùng dịch vụ lưu trữ riêng; danh mục này không phải thống kê đầy đủ media trên server.");
note("users","Dữ liệu người dùng:","Bảng và số lượng chỉ được xác nhận khi API trả thành công. Các nút khóa tài khoản và đăng xuất phiên thuộc hệ thống hiện có; hãy kiểm tra người dùng trước khi thao tác.");
note("inbox","Hộp thư:","Được nạp qua Worker quản trị cũ. Nút Trả lời mở trình soạn Gmail, không tự gửi thư hoặc xác nhận đã trả lời; trạng thái thư chỉ thay đổi khi thực hiện thao tác trạng thái riêng.");
note("analytics","Phạm vi thống kê:","Số liệu tổng hợp lấy từ các API Admin; khi không tải được sẽ hiển thị chưa có dữ liệu, không quy đổi thành 0. Chỉ số Media là danh mục lưu trên trình duyệt này.");
note("security","Phiên quản trị:","Quyền truy cập vẫn dựa vào cơ chế xác thực hiện có. Màn này không kiểm tra thay cho bảo mật của toàn hệ thống và không hiển thị mã truy cập.");
note("system","Kiểm tra giới hạn:","Nút Chạy kiểm tra hiện chỉ kiểm tra ba API: Người dùng, Hộp thư và Studio. Trạng thái thành công không có nghĩa mọi dịch vụ, database, lưu trữ và tác vụ đều hoạt động.");
// Keep legacy refresh handlers; add a clear, accessible refresh action to the
// summary page using only existing buttons, never a new backend.
const analytics=panels.analytics;
const noteEl=analytics.querySelector('[data-admin-stage-d="analytics"]');
if(noteEl&&!$("tbDRefreshAnalytics")){
 const row=document.createElement("div");row.className="tb-d-section-actions";
 const button=document.createElement("button");button.type="button";button.id="tbDRefreshAnalytics";button.textContent="Làm mới dữ liệu nguồn";
 const state=document.createElement("span");state.id="tbDRefreshState";state.setAttribute("role","status");state.setAttribute("aria-live","polite");
 button.addEventListener("click",()=>{
  if(app.classList.contains("hidden"))return;
  const u=$("reloadUsers"),m=$("reloadInbox");
  if(!u||!m){state.textContent="Chưa tìm thấy nút làm mới của hệ thống cũ.";return;}
  state.textContent="Đã yêu cầu tải lại dữ liệu từ hai API nguồn; xem trạng thái tại Người dùng và Hộp thư.";
  u.click();m.click();
 });
 row.append(button,state);noteEl.insertAdjacentElement("afterend",row);
}
// In case a protected GET failed, prevent exporting an empty/stale account list
// or clearing an unknown inbox. Reenable only after the legacy notice is success.
function watchNotice(id,buttonId){
 const notice=$(id),button=$(buttonId);if(!notice||!button)return;
 const update=()=>{
  const hasError=notice.classList.contains("error");
  if(hasError)button.disabled=true;
  if(notice.classList.contains("ok"))button.disabled=false;
 };
 new MutationObserver(update).observe(notice,{attributes:true,attributeFilter:["class"]});
 update();
}
watchNotice("usersNotice","exportUsers");
watchNotice("inboxNotice","clearInbox");
})();
