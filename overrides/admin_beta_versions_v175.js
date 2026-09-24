/* TrainingBot Admin - beta version manager v175 */
(()=>{
  "use strict";
  const TOKEN_KEYS=["tb-admin-center-token-v2","tb-admin-center-token-v1","tb-cloud-admin-token-v40","tb-cloud-admin-token-v39"];
  const $=id=>document.getElementById(id);
  const token=()=>TOKEN_KEYS.map(key=>sessionStorage.getItem(key)).find(Boolean)||"";
  let rows=[],editingId="";

  function style(){
    if($("tbBetaAdminStyle"))return;
    const node=document.createElement("style");
    node.id="tbBetaAdminStyle";
    node.textContent=`
.tb-beta-admin{margin:0 0 16px;padding:18px;border:1px solid #24324b;border-radius:18px;background:#0b1220}
.tb-beta-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}.tb-beta-head h3{margin:2px 0 5px;font-size:18px}.tb-beta-head p{margin:0;color:#7f8da5;font-size:10px!important}.tb-beta-open{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 13px;border:1px solid #2a3853;border-radius:10px;background:#111b2e;color:#d5def0;font-weight:850;text-decoration:none;white-space:nowrap}
.tb-beta-form{display:grid;grid-template-columns:150px 120px 150px minmax(220px,1fr) auto;gap:9px;align-items:end}.tb-beta-field{display:grid;gap:6px}.tb-beta-field label{color:#8290a8;font-size:9px;font-weight:900}.tb-beta-field input,.tb-beta-field select{width:100%;min-height:42px;box-sizing:border-box;border:1px solid #2a3750;border-radius:10px;background:#071022;color:#fff;padding:0 11px;outline:none;font:inherit}.tb-beta-field input:focus,.tb-beta-field select:focus{border-color:#745cff}
.tb-beta-save{min-height:42px;padding:0 15px;border:0;border-radius:10px;background:linear-gradient(135deg,#745cff,#2acbea);color:#fff;font-weight:900;cursor:pointer}.tb-beta-save:disabled{opacity:.55;cursor:wait}.tb-beta-cancel{display:none;min-height:42px;padding:0 13px;border:1px solid #2a3750;border-radius:10px;background:#111b2e;color:#cbd5e1;font-weight:850;cursor:pointer}.tb-beta-cancel.show{display:block}
.tb-beta-note{margin:9px 0 2px;color:#6f7e97;font-size:9px}.tb-beta-status{min-height:18px;margin:8px 0;color:#7f8da5;font-size:10px}.tb-beta-status.ok{color:#86efac}.tb-beta-status.error{color:#fda4af}
.tb-beta-list{display:grid;gap:8px;margin-top:10px}.tb-beta-row{display:grid;grid-template-columns:120px 90px minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 12px;border:1px solid #202c43;border-radius:12px;background:#071022}.tb-beta-version{font-size:13px;font-weight:950}.tb-beta-badge{display:inline-flex;width:max-content;padding:4px 8px;border-radius:999px;background:rgba(245,158,11,.12);color:#fbbf24;font-size:9px;font-weight:900}.tb-beta-badge.released{background:rgba(34,211,238,.1);color:#aef5ff}.tb-beta-link{min-width:0;color:#73819a;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tb-beta-actions{display:flex;gap:7px}.tb-beta-edit,.tb-beta-delete{min-height:32px;padding:0 10px;border-radius:9px;font-size:9px;font-weight:900;cursor:pointer}.tb-beta-edit{border:1px solid #2a3750;background:#111b2e;color:#cbd5e1}.tb-beta-delete{border:1px solid rgba(244,63,94,.32);background:rgba(244,63,94,.08);color:#fda4af}.tb-beta-empty{padding:18px;border:1px dashed #26344d;border-radius:12px;color:#7e8da7;text-align:center;font-size:10px}
@media(max-width:980px){.tb-beta-form{grid-template-columns:1fr 1fr}.tb-beta-field.link{grid-column:1/-1}.tb-beta-save,.tb-beta-cancel{width:100%}.tb-beta-row{grid-template-columns:110px 90px minmax(0,1fr)}}@media(max-width:650px){.tb-beta-head{flex-direction:column}.tb-beta-open{width:100%;box-sizing:border-box}.tb-beta-form{grid-template-columns:1fr}.tb-beta-field.link{grid-column:auto}.tb-beta-row{grid-template-columns:1fr}.tb-beta-actions{display:grid;grid-template-columns:1fr 1fr}.tb-beta-edit,.tb-beta-delete{width:100%}}
`;
    document.head.appendChild(node);
  }

  function status(message,type=""){
    const el=$("tbBetaStatus");if(!el)return;
    el.textContent=message||"";el.className=`tb-beta-status ${type}`;
  }
  async function api(method="GET",body){
    const headers={Authorization:`Bearer ${token()}`};
    if(body!==undefined)headers["Content-Type"]="application/json";
    const response=await fetch("/api/v71/admin/beta-versions",{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:"no-store"});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data.ok===false)throw new Error(data.message||`Yêu cầu thất bại (${response.status}).`);
    return data;
  }
  function render(){
    const list=$("tbBetaList");if(!list)return;
    list.replaceChildren();
    if(!rows.length){const e=document.createElement("div");e.className="tb-beta-empty";e.textContent="Chưa có phiên bản beta.";list.appendChild(e);return;}
    rows.forEach(row=>{
      const item=document.createElement("article");item.className="tb-beta-row";
      const v=document.createElement("div");v.className="tb-beta-version";v.textContent=row.version;
      const badge=document.createElement("span");badge.className=`tb-beta-badge ${row.status==="released"?"released":""}`;badge.textContent=row.status==="released"?"Đã phát hành":"Sắp ra mắt";
      const link=document.createElement("div");link.className="tb-beta-link";link.textContent=row.download_url||"Chưa có link tải";
      const actions=document.createElement("div");actions.className="tb-beta-actions";
      const edit=document.createElement("button");edit.type="button";edit.className="tb-beta-edit";edit.textContent="Sửa";edit.dataset.editBeta=row.id;
      const del=document.createElement("button");del.type="button";del.className="tb-beta-delete";del.textContent="Xóa";del.dataset.deleteBeta=row.id;
      actions.append(edit,del);item.append(v,badge,link,actions);list.appendChild(item);
    });
  }
  async function load(){
    if(!token())return status("Phiên quản trị không còn hợp lệ.","error");
    status("Đang tải phiên bản…");
    try{const data=await api();rows=data.versions||[];render();status(`${rows.length} phiên bản beta đang được quản lý.`);}
    catch(error){status(error.message||"Không tải được phiên bản.","error");}
  }
  function reset(){
    editingId="";
    $("tbBetaForm")?.reset();
    if($("tbBetaArch"))$("tbBetaArch").value="x64";
    if($("tbBetaState"))$("tbBetaState").value="coming_soon";
    if($("tbBetaSave"))$("tbBetaSave").textContent="Thêm phiên bản";
    $("tbBetaCancel")?.classList.remove("show");
    toggleLink();
  }
  function toggleLink(){
    const released=$("tbBetaState")?.value==="released";
    const input=$("tbBetaLink");if(!input)return;
    input.disabled=!released;
    input.placeholder=released?"Dán link APK tại đây":"Không cần link khi đang Sắp ra mắt";
    if(!released)input.value="";
  }
  function edit(id){
    const row=rows.find(x=>x.id===id);if(!row)return;
    editingId=id;$("tbBetaVersion").value=row.version||"";$("tbBetaArch").value=row.arch||"x64";$("tbBetaState").value=row.status||"coming_soon";$("tbBetaLink").value=row.download_url||"";
    $("tbBetaSave").textContent="Lưu thay đổi";$("tbBetaCancel").classList.add("show");toggleLink();$("tbBetaVersion").focus();
  }
  async function remove(id){
    const row=rows.find(x=>x.id===id);if(!row||!confirm(`Xóa ${row.version} khỏi danh sách beta?`))return;
    status(`Đang xóa ${row.version}…`);
    try{const data=await api("DELETE",{id});rows=data.versions||[];render();if(editingId===id)reset();status(`✓ Đã xóa ${row.version}.`,"ok");}
    catch(error){status(error.message||"Không xóa được phiên bản.","error");}
  }
  async function submit(event){
    event.preventDefault();
    const button=$("tbBetaSave"),body={version:$("tbBetaVersion").value.trim(),arch:$("tbBetaArch").value.trim(),status:$("tbBetaState").value,download_url:$("tbBetaLink").value.trim()};
    if(editingId)body.id=editingId;
    button.disabled=true;status(editingId?"Đang lưu thay đổi…":"Đang thêm phiên bản…");
    try{
      const data=await api(editingId?"PATCH":"POST",body);rows=data.versions||[];render();
      const name=body.version.toUpperCase();reset();status(`✓ Đã lưu ${name}. Trang Bản cập nhật sẽ tự đồng bộ.`,"ok");
    }catch(error){status(error.message||"Không lưu được phiên bản.","error");}
    finally{button.disabled=false;}
  }
  function field(labelText,input,className=""){
    const wrap=document.createElement("div");wrap.className=`tb-beta-field ${className}`;
    const label=document.createElement("label");label.textContent=labelText;wrap.append(label,input);return wrap;
  }
  function inject(){
    if($("tbBetaAdmin"))return true;
    const panel=document.querySelector('[data-view-panel="content"]')||document.querySelector('[data-view-panel="posts"]');
    if(!panel)return false;
    const box=document.createElement("section");box.className="tb-beta-admin";box.id="tbBetaAdmin";
    const head=document.createElement("div");head.className="tb-beta-head";
    head.innerHTML='<div><span class="eyebrow">PUBG MOBILE BETA</span><h3>Quản lý phiên bản Beta</h3><p>Thêm phiên bản, trạng thái phát hành và link APK. Nhóm V4.x được tạo tự động từ số phiên bản.</p></div>';
    const open=document.createElement("a");open.className="tb-beta-open";open.href="/ban-cap-nhat";open.target="_blank";open.rel="noopener";open.textContent="Mở trang cập nhật ↗";head.appendChild(open);

    const form=document.createElement("form");form.className="tb-beta-form";form.id="tbBetaForm";
    const version=document.createElement("input");version.id="tbBetaVersion";version.required=true;version.placeholder="V4.8.1";version.autocomplete="off";
    const arch=document.createElement("input");arch.id="tbBetaArch";arch.value="x64";arch.placeholder="x64";
    const state=document.createElement("select");state.id="tbBetaState";state.innerHTML='<option value="coming_soon">Sắp ra mắt</option><option value="released">Đã phát hành</option>';
    const link=document.createElement("input");link.id="tbBetaLink";link.type="url";link.placeholder="Không cần link khi đang Sắp ra mắt";
    const save=document.createElement("button");save.type="submit";save.className="tb-beta-save";save.id="tbBetaSave";save.textContent="Thêm phiên bản";
    const cancel=document.createElement("button");cancel.type="button";cancel.className="tb-beta-cancel";cancel.id="tbBetaCancel";cancel.textContent="Hủy sửa";
    form.append(field("PHIÊN BẢN",version),field("KIẾN TRÚC",arch),field("TRẠNG THÁI",state),field("LINK APK",link,"link"),save,cancel);

    const note=document.createElement("div");note.className="tb-beta-note";note.textContent="Ví dụ: nhập V4.8.1 thì website tự tạo nhóm V4.8. Phiên bản cao nhất sẽ được mở mặc định.";
    const stat=document.createElement("div");stat.className="tb-beta-status";stat.id="tbBetaStatus";
    const list=document.createElement("div");list.className="tb-beta-list";list.id="tbBetaList";
    box.append(head,form,note,stat,list);

    const title=panel.querySelector(".section-title");if(title)title.insertAdjacentElement("afterend",box);else panel.prepend(box);
    state.addEventListener("change",toggleLink);cancel.addEventListener("click",reset);form.addEventListener("submit",submit);
    list.addEventListener("click",event=>{const e=event.target.closest("[data-edit-beta]");if(e)edit(e.dataset.editBeta);const d=event.target.closest("[data-delete-beta]");if(d)remove(d.dataset.deleteBeta);});
    toggleLink();load();return true;
  }

  style();let tries=0;const boot=()=>{inject();if(++tries<100&&!$("tbBetaAdmin"))setTimeout(boot,150);};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
