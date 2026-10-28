/* TrainingBot Admin Wiki G.1–G.5 — authenticated local-only review workbench.
 * Existing Admin credentials/router untouched; no API writes, no storage writes.
 * JSON export is an approval artifact, NOT an automatic production publishing path.
 */
(()=>{
"use strict";
if(window.__TB_ADMIN_WIKI_G__)return;
const api=window.__TB_ADMIN_WIKI_G__={ready:false,loaded:false,status:"await_auth",writes:0};
const app=document.getElementById("adminApp");
const panel=app?.querySelector('.view[data-view-panel="wiki"]');
if(!app||!panel)return;
const make=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e};
const authenticated=()=>!app.classList.contains("hidden")&&!!app.querySelector('#sidebar .nav-item[data-view="wiki"]');
const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").toLowerCase();
const CATS={weapons:"Vũ khí",attachments:"Phụ kiện",vehicles:"Phương tiện",maps:"Bản đồ",guides:"Hướng dẫn"};
const state={items:[],selected:null,filters:{kind:"all",term:""},history:new Map(),source:null,iframe:null};
const allowedStatuses=new Set(["draft","in_review","approved"]);
const legalLicenses=new Set(["unknown","own","permission","licensed"]);
const statusLabels={draft:"Bản nháp",in_review:"Chờ duyệt",approved:"Đủ điều kiện đề xuất"};
const root=make("section","tb-g-workbench");root.id="tbGWorkbench";root.hidden=true;
const head=make("header","tb-g-head");
head.append(make("small","","WIKI V2 · GIAI ĐOẠN G — PREVIEW"),make("h2","","Quản trị dữ liệu Wiki"));
head.append(make("p","","Kiểm tra 4 kho và hướng dẫn, tạo nháp, đối chiếu nguồn, lưu lịch sử trong phiên trình duyệt. Không ghi Production, không tự xuất bản."));
const info=make("div","tb-g-warning","CHẾ ĐỘ RÀ SOÁT NHÁP · Chỉ xuất gói JSON, chưa có API ghi dữ liệu Wiki được xác nhận và bảo vệ phía máy chủ.");
const actions=make("div","tb-g-actions");
const load=make("button","tb-g-primary","Tải dữ liệu Wiki");load.type="button";load.id="tbGLoad";
const exportBtn=make("button","","Xuất gói nháp JSON");exportBtn.type="button";exportBtn.id="tbGExport";exportBtn.disabled=true;
const importLabel=make("label","tb-g-import","Nhập gói nháp JSON");
const upload=make("input");upload.type="file";upload.accept=".json,application/json";upload.id="tbGImport";upload.disabled=true;importLabel.append(upload);
const reset=make("button","","Hủy mọi thay đổi trong phiên");reset.type="button";reset.id="tbGReset";reset.disabled=true;
actions.append(load,exportBtn,importLabel,reset);
const stat=make("p","tb-g-status","Chưa tải dữ liệu. Yêu cầu đăng nhập Admin trước khi thao tác.");stat.id="tbGStatus";stat.setAttribute("role","status");stat.setAttribute("aria-live","polite");
const body=make("div","tb-g-body");body.hidden=true;
const side=make("section","tb-g-side");
const toolbar=make("div","tb-g-toolbar");
const kindSel=make("select");kindSel.id="tbGKind";kindSel.setAttribute("aria-label","Lọc kho Wiki");
for(const [value,label] of [["all","Tất cả"],...Object.entries(CATS)]){const o=make("option","",label);o.value=value;kindSel.append(o)}
const search=make("input");search.id="tbGSearch";search.placeholder="Tìm tên không dấu";search.setAttribute("aria-label","Tìm bản ghi");search.type="search";
const total=make("span","tb-g-total","0 bản ghi");toolbar.append(kindSel,search,total);
const list=make("div","tb-g-list");list.id="tbGList";list.setAttribute("role","listbox");list.setAttribute("aria-label","Bản ghi Wiki");
side.append(toolbar,list);
const detail=make("section","tb-g-detail");detail.id="tbGDetail";
detail.append(make("p","","Chọn một mục để xem và lập nháp kiểm duyệt."));
body.append(side,detail);root.append(head,info,actions,stat,body);
panel.append(root);
const msg=text=>stat.textContent=text;
const getCurrent=()=>state.items.find(x=>x.id===state.selected);
function sanitize(v){return String(v??"").trim().slice(0,4000)}
function blankReview(){return {status:"draft",editorNote:"",sourceUrl:"",sourceVersion:"",sourceDate:"",imageUrl:"",imageLicense:"unknown",imageRightsUrl:""}}
function validHTTPS(v){try{let u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password}catch{return false}}
function validate(review){
 const issues=[];
 if(!allowedStatuses.has(review.status))issues.push("Trạng thái không hợp lệ");
 if(!legalLicenses.has(review.imageLicense))issues.push("Giấy phép ảnh không hợp lệ");
 for(const key of ["sourceUrl","imageUrl","imageRightsUrl"])if(review[key]&&!validHTTPS(review[key]))issues.push(key+" cần URL HTTPS hợp lệ");
 if(review.sourceDate&&!/^\d{4}-\d{2}-\d{2}$/.test(review.sourceDate))issues.push("Ngày nguồn phải là YYYY-MM-DD");
 if(review.imageUrl&&review.imageLicense==="unknown")issues.push("Hình ảnh thiếu quyền sử dụng đã đối chiếu");
 if(review.imageUrl&&review.imageLicense!=="unknown"&&!review.imageRightsUrl)issues.push("Thiếu liên kết bằng chứng giấy phép ảnh");
 if(review.status==="approved"&&(!review.sourceUrl||!review.sourceVersion||!review.sourceDate))issues.push("Chưa đủ URL/phiên bản/ngày để đề xuất duyệt");
 if(review.status==="approved"&&issues.length)issues.push("Không thể đề xuất duyệt nếu còn lỗi xác minh");
 return [...new Set(issues)];
}
function changed(){
 return state.items.filter(x=>JSON.stringify(x.review)!==JSON.stringify(blankReview()));
}
function updateStatus(){total.textContent=state.items.length+" bản ghi · "+changed().length+" có nháp";}
function selectedRows(){
 const needle=normalize(state.filters.term);
 return state.items.filter(x=>(state.filters.kind==="all"||x.kind===state.filters.kind)&&
 (!needle||normalize(x.name+" "+x.group).includes(needle)));
}
function renderList(){
 const rows=selectedRows();list.replaceChildren();
 for(const item of rows){
  const b=make("button","tb-g-row");b.type="button";b.dataset.recordId=item.id;
  if(state.selected===item.id)b.classList.add("selected");
  const group=make("small","",CATS[item.kind]);
  const title=make("strong","",item.name);
  const flag=make("span","tb-g-flag",statusLabels[item.review.status]);
  b.append(group,title,flag);
  b.addEventListener("click",()=>{state.selected=item.id;renderList();renderDetail()});
  list.append(b);
 }
 if(!rows.length)list.append(make("p","tb-g-empty","Không tìm thấy dữ liệu phù hợp."));
 updateStatus();
}
function addField(parent,label,key,record,type="text",options=null){
 const wrap=make("label","tb-g-field");wrap.append(make("span","",label));
 let el;
 if(type==="textarea"){el=make("textarea");el.rows=3}
 else if(type==="select"){el=make("select");for(const [v,t] of options){const op=make("option","",t);op.value=v;el.append(op)}}
 else {el=make("input");el.type=type}
 el.value=record.review[key]||"";
 el.dataset.field=key;
 el.addEventListener("change",()=>applyChange(key,el.value));
 wrap.append(el);parent.append(wrap);
}
function renderDetail(){
 const rec=getCurrent();detail.replaceChildren();
 if(!rec){detail.append(make("p","","Chọn mục bên trái để biên tập."));return}
 detail.append(make("h3","",rec.name),make("p","tb-g-description",CATS[rec.kind]+" · "+rec.group));
 const raw=make("details","tb-g-raw");raw.append(make("summary","","Dữ liệu Wiki gốc (chỉ đọc)"));
 raw.append(make("pre","",JSON.stringify(rec.raw,null,2)));detail.append(raw);
 const form=make("div","tb-g-form");
 addField(form,"Trạng thái nháp","status",rec,"select",[["draft","Bản nháp"],["in_review","Chờ duyệt"],["approved","Đề xuất đủ điều kiện"]]);
 addField(form,"Ghi chú kiểm duyệt","editorNote",rec,"textarea");
 addField(form,"URL nguồn chứng minh","sourceUrl",rec,"url");
 addField(form,"Phiên bản nguồn","sourceVersion",rec);
 addField(form,"Ngày công bố YYYY-MM-DD","sourceDate",rec,"date");
 addField(form,"URL ảnh (không tự tải lên R2)","imageUrl",rec,"url");
 addField(form,"Tình trạng bản quyền ảnh","imageLicense",rec,"select",[["unknown","Chưa xác minh"],["own","Ảnh tự sở hữu"],["permission","Có cho phép"],["licensed","Có giấy phép"]]);
 addField(form,"URL bằng chứng quyền sử dụng ảnh","imageRightsUrl",rec,"url");
 detail.append(form);
 const errors=validate(rec.review),notice=make("div","tb-g-validation");notice.id="tbGValidation";
 notice.append(make("strong","",errors.length?"Còn "+errors.length+" điều cần xử lý":"Nháp không có lỗi cấu trúc"));
 for(const e of errors)notice.append(make("p","",e));
 detail.append(notice);
 const history=state.history.get(rec.id)||[];
 const undo=make("button","tb-g-undo","Khôi phục lần sửa trước");undo.type="button";undo.id="tbGUndo";undo.disabled=!history.length;
 undo.addEventListener("click",()=>{
  const prior=state.history.get(rec.id)?.pop();if(!prior)return;
  rec.review=prior.before;renderList();renderDetail();msg("Đã khôi phục bản trước trong phiên, không ghi Production.");
 });
 detail.append(undo,make("p","tb-g-history","Nhật ký trong phiên: "+history.length+" lần thay đổi. Tải lại trang sẽ mất nháp chưa xuất JSON."));
}
function applyChange(key,value){
 if(!authenticated()){msg("Đã khóa chỉnh sửa: chưa đăng nhập Admin.");return}
 const rec=getCurrent();if(!rec||!Object.hasOwn(blankReview(),key))return;
 const v=sanitize(value);
 if(key==="status"&&!allowedStatuses.has(v))return;
 if(key==="imageLicense"&&!legalLicenses.has(v))return;
 if(rec.review[key]===v)return;
 if(!state.history.has(rec.id))state.history.set(rec.id,[]);
 const h=state.history.get(rec.id);h.push({before:{...rec.review},field:key,at:new Date().toISOString()});
 if(h.length>40)h.shift();
 rec.review[key]=v;
 renderList();renderDetail();
 const errors=validate(rec.review);
 msg("Đã lưu nháp trong phiên · "+rec.name+" · "+(errors.length?errors.length+" cảnh báo kiểm duyệt.":"không có lỗi cấu trúc.")+" Không ghi máy chủ.");
}
function parseRecords(snapshot,guideData){
 if(snapshot.schemaVersion!=="wiki-g1"||guideData.schemaVersion!=="wiki-f1")throw Error("Sai schema dữ liệu Wiki");
 const kinds=["weapons","attachments","vehicles","maps"],items=[];
 for(const kind of kinds){
  const rows=snapshot.catalog[kind];if(!Array.isArray(rows)||rows.length!==snapshot.counts[kind])throw Error("Kho thiếu: "+kind);
  for(const r of rows)items.push({id:r.id,kind,name:r.name,group:r.category,raw:r.fields,review:blankReview()});
 }
 for(const g of guideData.guides)items.push({id:"guide:"+g.id,kind:"guides",name:g.title,group:g.category,raw:{summary:g.summary,steps:g.steps,sourceRefs:g.evidence},review:blankReview()});
 const total=kinds.reduce((n,k)=>n+snapshot.counts[k],0);
 if(total!==146||guideData.guides.length!==16||items.length!==162)throw Error("Snapshot không đủ 146 + 16 mục; từ chối dữ liệu thiếu");
 return items;
}
async function loadData(){
 if(!authenticated()){msg("Cần đăng nhập Admin trước khi tải dữ liệu Wiki.");return}
 if(state.items.length){msg("Dữ liệu đã tải, không cần tải lại.");return}
 load.disabled=true;msg("Đang lấy ảnh chụp runtime Wiki và kho hướng dẫn F…");
 try{
  const guides=await fetch("/wiki-stage-f-guides.json",{credentials:"omit",cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Hướng dẫn HTTP "+r.status);return r.json()});
  // Same-origin read-only snapshot of the real patched Wiki DATA (61/51/26/8).
  // Never fetch synthetic numbers or send any data back to the iframe.
  const frame=make("iframe");frame.hidden=true;frame.id="tbGWikiSource";frame.title="Kho Wiki công khai dùng để đọc dữ liệu";
  frame.src="/wiki.html";frame.setAttribute("aria-hidden","true");
  document.body.append(frame);state.iframe=frame;
  await new Promise((resolve,reject)=>{
   const deadline=setTimeout(()=>reject(Error("Wiki runtime không phản hồi")),22000);
   const poll=()=>{if(!state.iframe?.isConnected){clearTimeout(deadline);reject(Error("Snapshot iframe đã đóng"));return}
    try{const d=frame.contentWindow?.__TB_WIKI_G_SNAPSHOT__;if(d){clearTimeout(deadline);resolve(d);return}}catch(e){clearTimeout(deadline);reject(Error("Không thể truy cập Wiki cùng origin"));return}
    setTimeout(poll,100);
   };poll();
  });
  const snapshot=frame.contentWindow.__TB_WIKI_G_SNAPSHOT__;
  state.items=parseRecords(snapshot,guides);
  state.source={counts:snapshot.counts,guideCount:guides.guides.length};
  frame.remove();state.iframe=null;
  api.loaded=true;api.total=state.items.length;api.counts=state.source.counts;
  exportBtn.disabled=upload.disabled=reset.disabled=false;body.hidden=false;
  state.selected=state.items[0].id;renderList();renderDetail();
  msg("Đã tải "+state.items.length+" mục thực từ Wiki (146 kho + 16 hướng dẫn). Mọi chỉnh sửa là nháp trong phiên.");
 }catch(err){
  state.iframe?.remove();state.iframe=null;msg("Không thể tải: "+err.message+". Chưa thay đổi dữ liệu.");load.disabled=false;api.error=err.message;
 }
}
function packageData(){
 return {schemaVersion:"wiki-g-draft1",createdAt:new Date().toISOString(),published:false,
  sourceCounts:state.source?.counts||null,recordCount:state.items.length,
  records:changed().map(x=>({id:x.id,kind:x.kind,name:x.name,review:{...x.review},validation:validate(x.review)})),
  disclaimer:"Gói nháp chờ kiểm duyệt thủ công. Không phải lệnh cập nhật Production."};
}
function downloadDraft(){
 if(!authenticated()||!api.loaded)return;
 const payload=JSON.stringify(packageData(),null,2),blob=new Blob([payload],{type:"application/json"});
 const u=URL.createObjectURL(blob),a=make("a");a.href=u;a.download="trainingbot-wiki-draft.json";a.click();
 setTimeout(()=>URL.revokeObjectURL(u),1500);msg("Đã tạo gói JSON để tải xuống. Chưa xuất bản hoặc ghi máy chủ.");
}
async function importDraft(file){
 if(!authenticated()||!api.loaded||!file)return;
 if(file.size>2_000_000){msg("Từ chối tệp quá 2MB.");return}
 try{
  const parsed=JSON.parse(await file.text());
  if(parsed.schemaVersion!=="wiki-g-draft1"||parsed.published!==false||!Array.isArray(parsed.records)||parsed.records.length>162)throw Error("Sai schema hoặc gói đã đánh dấu xuất bản");
  const known=new Map(state.items.map(x=>[x.id,x]));
  const seen=new Set(),pending=[];
  for(const row of parsed.records){
   if(!row||typeof row.id!=="string"||seen.has(row.id))throw Error("Trùng hoặc sai ID");
   seen.add(row.id);const current=known.get(row.id);if(!current||row.kind!==current.kind||row.name!==current.name)throw Error("ID không nằm trong Wiki hiện tại");
   const proposed=blankReview();
   if(!row.review||Object.keys(row.review).some(k=>!Object.hasOwn(proposed,k)))throw Error("Trường dữ liệu không nằm trong schema");
   for(const k of Object.keys(proposed)){
    const raw=row.review[k];if(typeof raw!=="string"||raw.length>4000)throw Error("Giá trị sai định dạng");
    proposed[k]=raw;
   }
   if(!allowedStatuses.has(proposed.status)||!legalLicenses.has(proposed.imageLicense))throw Error("Trạng thái không hợp lệ");
   pending.push([current,proposed]);
  }
  // Atomic apply: reject the entire package before changing any record.
  for(const [current,proposed] of pending){
   if(!state.history.has(current.id))state.history.set(current.id,[]);
   state.history.get(current.id).push({before:{...current.review},field:"import",at:new Date().toISOString()});
   current.review=proposed;
  }
  renderList();renderDetail();msg("Đã nhập "+pending.length+" nháp vào bộ nhớ phiên. Không gửi dữ liệu đi.");
 }catch(err){msg("Nhập thất bại: "+err.message+". Không thay đổi từ tệp này.")}
}
load.addEventListener("click",loadData);
exportBtn.addEventListener("click",downloadDraft);
upload.addEventListener("change",()=>{const f=upload.files?.[0];importDraft(f).finally(()=>{upload.value=""})});
reset.addEventListener("click",()=>{
 if(!authenticated()||!api.loaded)return;
 for(const x of state.items)x.review=blankReview();
 state.history.clear();renderList();renderDetail();msg("Đã khôi phục toàn bộ nháp về mặc định, không tác động dữ liệu công khai.");
});
kindSel.addEventListener("change",()=>{state.filters.kind=kindSel.value;renderList()});
search.addEventListener("input",()=>{state.filters.term=search.value;renderList()});
api.getDraft=()=>packageData();
api.validate=id=>{const item=state.items.find(x=>x.id===id);return item?validate(item.review):null};
api.reset=()=>reset.click();
api.authorized=authenticated;
api.ready=true;
const routeNav=app.querySelector('#sidebar .nav-item[data-view="wiki"]');
function sync(){
 const open=authenticated()&&panel.classList.contains("active");
 root.hidden=!open;
 api.status=!authenticated()?"await_auth":open?"review_ready":"hidden";
}
routeNav?.addEventListener("click",()=>requestAnimationFrame(sync));
new MutationObserver(sync).observe(app,{attributes:true,attributeFilter:["class"]});
new MutationObserver(sync).observe(panel,{attributes:true,attributeFilter:["class"]});
sync();
})();