/* TrainingBot Admin - manual post creator v172 */
(()=>{
  "use strict";
  const TOKEN_KEYS=["tb-admin-center-token-v2","tb-admin-center-token-v1","tb-cloud-admin-token-v40","tb-cloud-admin-token-v39"];
  const $=id=>document.getElementById(id);
  const token=()=>TOKEN_KEYS.map(key=>sessionStorage.getItem(key)).find(Boolean)||"";
  const slugify=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/gi,"d").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,72)||"bai-viet";
  const extFor=file=>({"image/png":"png","image/webp":"webp","image/gif":"gif","image/avif":"avif"}[file?.type]||"jpg");
  const make=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};

  function addStyle(){
    if($("tbManualPostStyle"))return;
    const style=document.createElement("style");style.id="tbManualPostStyle";style.textContent=`
.tb-post-create-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 16px;border:0;border-radius:12px;background:linear-gradient(135deg,#745cff,#2acbea);color:#fff;font-weight:900;cursor:pointer;white-space:nowrap;box-shadow:0 12px 30px rgba(72,103,255,.18)}
.tb-post-create-btn:hover{transform:translateY(-1px);filter:brightness(1.08)}
.tb-post-modal{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(2,6,18,.78);backdrop-filter:blur(8px)}.tb-post-modal.open{display:flex}
.tb-post-dialog{width:min(860px,100%);max-height:min(880px,94vh);overflow:auto;border:1px solid #27344d;border-radius:20px;background:#0b1220;box-shadow:0 30px 90px rgba(0,0,0,.5)}
.tb-post-dialog-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:17px 20px;border-bottom:1px solid #202c43;background:#0b1220}.tb-post-dialog-head h3{margin:0;font-size:20px}.tb-post-close{width:38px;height:38px;border:1px solid #2a3750;border-radius:10px;background:#111b2e;color:#cbd5e1;font-size:20px;cursor:pointer}
.tb-post-form{display:grid;gap:15px;padding:20px}.tb-post-grid{display:grid;grid-template-columns:1fr 240px;gap:13px}.tb-post-field{display:grid;gap:7px}.tb-post-field label{color:#9aa9c1;font-size:11px;font-weight:800}.tb-post-field input,.tb-post-field select,.tb-post-field textarea{width:100%;box-sizing:border-box;border:1px solid #2a3750;border-radius:11px;background:#071022;color:#fff;padding:11px 12px;outline:none;font:inherit}.tb-post-field input:focus,.tb-post-field select:focus,.tb-post-field textarea:focus{border-color:#745cff}.tb-post-field textarea{min-height:280px;resize:vertical;line-height:1.6}.tb-post-help{color:#6f809a;font-size:10px;line-height:1.5}.tb-post-actions{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding-top:4px}.tb-post-cancel,.tb-post-submit{min-height:42px;padding:0 16px;border-radius:11px;font-weight:900;cursor:pointer}.tb-post-cancel{border:1px solid #2a3750;background:#111b2e;color:#cbd5e1}.tb-post-submit{border:0;background:linear-gradient(135deg,#745cff,#2acbea);color:#fff}.tb-post-submit:disabled{opacity:.55;cursor:wait}.tb-post-status{min-height:20px;color:#91a0b7;font-size:11px}.tb-post-status.error{color:#fda4af}.tb-post-status.ok{color:#86efac}.tb-post-status a{color:#aef5ff;font-weight:900}
.tb-post-manager{margin:0 0 14px;padding:16px;border:1px solid #202c43;border-radius:16px;background:#0b1220}.tb-post-manager-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.tb-post-manager-head h3{margin:0;font-size:16px}.tb-post-manager-head small{display:block;margin-top:4px;color:#75849d;font-size:10px}.tb-post-refresh{min-height:34px;padding:0 11px;border:1px solid #2a3750;border-radius:9px;background:#111b2e;color:#cbd5e1;font-weight:800;cursor:pointer}.tb-post-manager-status{min-height:16px;margin:4px 0 8px;color:#7888a2;font-size:10px}.tb-post-manager-status.error{color:#fda4af}.tb-post-manager-status.ok{color:#86efac}.tb-post-list{display:grid;gap:8px}.tb-post-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px;border:1px solid #202c43;border-radius:12px;background:#071022}.tb-post-row h4{margin:0 0 5px;font-size:12px}.tb-post-row p{margin:0;color:#74839c;font-size:9px!important}.tb-post-row-actions{display:flex;gap:7px}.tb-post-open,.tb-post-delete{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 11px;border-radius:9px;font-size:10px;font-weight:900;text-decoration:none;cursor:pointer}.tb-post-open{border:1px solid #2a3750;background:#111b2e;color:#cbd5e1}.tb-post-delete{border:1px solid rgba(244,63,94,.34);background:rgba(244,63,94,.09);color:#fda4af}.tb-post-delete:disabled{opacity:.5;cursor:wait}.tb-post-empty{padding:18px;border:1px dashed #26344d;border-radius:12px;color:#7e8da7;text-align:center;font-size:10px}
@media(max-width:720px){.tb-post-modal{padding:10px}.tb-post-dialog{max-height:96vh}.tb-post-grid{grid-template-columns:1fr}.tb-post-actions{display:grid;grid-template-columns:1fr 1fr}.tb-post-create-btn{width:100%;margin-top:12px}.tb-post-field textarea{min-height:230px}.tb-post-manager-head{align-items:stretch;flex-direction:column}.tb-post-refresh{width:100%}.tb-post-row{grid-template-columns:1fr}.tb-post-row-actions{display:grid;grid-template-columns:1fr 1fr}.tb-post-open,.tb-post-delete{width:100%;box-sizing:border-box}}
`;document.head.appendChild(style);
  }

  function field(labelText,input,help){
    const wrap=make("div","tb-post-field");wrap.append(make("label","",labelText),input);if(help)wrap.append(make("div","tb-post-help",help));return wrap;
  }

  function buildModal(){
    if($("tbManualPostModal"))return;
    const modal=make("div","tb-post-modal");modal.id="tbManualPostModal";
    const dialog=make("div","tb-post-dialog");dialog.setAttribute("role","dialog");dialog.setAttribute("aria-modal","true");
    const head=make("div","tb-post-dialog-head");head.append(make("h3","","Tạo bài đăng"));const x=make("button","tb-post-close","×");x.type="button";x.dataset.closePost="1";head.append(x);
    const form=make("form","tb-post-form");form.id="tbManualPostForm";
    const title=document.createElement("input");title.id="tbPostTitle";title.maxLength=180;title.required=true;title.placeholder="Nhập tiêu đề bài viết";
    const summary=document.createElement("input");summary.id="tbPostSummary";summary.maxLength=260;summary.placeholder="Bỏ trống để tự lấy từ nội dung";
    const category=document.createElement("select");category.id="tbPostCategory";["Tin mới","Bản cập nhật","Giải đấu & Esports","Cộng đồng","Hướng dẫn"].forEach(value=>{const option=document.createElement("option");option.value=value;option.textContent=value;category.appendChild(option);});
    const cover=document.createElement("input");cover.id="tbPostCover";cover.type="file";cover.accept="image/png,image/jpeg,image/webp,image/gif,image/avif";
    const content=document.createElement("textarea");content.id="tbPostContent";content.required=true;content.placeholder="Viết nội dung ở đây...\n\n## Tiêu đề phụ\nNội dung đoạn văn\n\n- Gạch đầu dòng";
    const grid=make("div","tb-post-grid");grid.append(field("MÔ TẢ NGẮN",summary),field("CHUYÊN MỤC",category));
    const status=make("div","tb-post-status");status.id="tbPostStatus";
    const actions=make("div","tb-post-actions");const cancel=make("button","tb-post-cancel","Hủy");cancel.type="button";cancel.dataset.closePost="1";const submit=make("button","tb-post-submit","Đăng bài");submit.type="submit";submit.id="tbPostSubmit";actions.append(cancel,submit);
    form.append(field("TIÊU ĐỀ *",title),grid,field("ẢNH BÌA",cover,"Có thể bỏ trống. Ảnh được lưu vào kho ảnh hiện có của TrainingBot."),field("NỘI DUNG *",content,"Dùng ## cho tiêu đề phụ, - cho gạch đầu dòng, **chữ** để in đậm."),status,actions);
    dialog.append(head,form);modal.appendChild(dialog);document.body.appendChild(modal);
    modal.addEventListener("click",event=>{if(event.target===modal||event.target.closest("[data-close-post]"))closeModal();});
    form.addEventListener("submit",publish);
  }

  function setStatus(message,type="",link=""){
    const el=$("tbPostStatus");if(!el)return;el.className=`tb-post-status ${type}`;el.replaceChildren(document.createTextNode(message||""));
    if(link){el.append(document.createTextNode(" "));const a=make("a","","Mở bài ↗");a.href=link;a.target="_blank";a.rel="noopener";el.appendChild(a);}
  }
  function managerStatus(message,type=""){
    const el=$("tbPostManagerStatus");if(!el)return;el.textContent=message||"";el.className=`tb-post-manager-status ${type}`;
  }
  function openModal(){buildModal();$("tbManualPostModal").classList.add("open");setTimeout(()=>$("tbPostTitle")?.focus(),0);}
  function closeModal(){$("tbManualPostModal")?.classList.remove("open");}

  async function uploadCover(file,title){
    if(!file)return "";
    if(file.size>12*1024*1024)throw new Error("Ảnh bìa vượt quá 12 MB.");
    const target=`/user-posts/${slugify(title)}-${Date.now()}.${extFor(file)}`;
    const formData=new FormData();formData.set("target",target);formData.set("file",file);
    const response=await fetch("/api/v71/admin/image-replace",{method:"POST",headers:{Authorization:`Bearer ${token()}`},body:formData});
    const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw new Error(data.message||"Không tải được ảnh bìa.");return data.url||target;
  }

  function renderPosts(posts){
    const list=$("tbPostPublishedList");if(!list)return;
    list.replaceChildren();
    if(!posts?.length){list.append(make("div","tb-post-empty","Chưa có bài nào được tạo trực tiếp từ Admin."));return;}
    posts.forEach(post=>{
      const row=make("article","tb-post-row");
      const copy=make("div","");copy.append(make("h4","",post.title||"Bài viết"));
      const date=new Date(post.published_at);const dateText=Number.isNaN(date.getTime())?"":date.toLocaleDateString("vi-VN");copy.append(make("p","",`${post.category||"Tin mới"}${dateText?` · ${dateText}`:""}`));
      const actions=make("div","tb-post-row-actions");
      const open=make("a","tb-post-open","Mở bài");open.href=post.url;open.target="_blank";open.rel="noopener";
      const del=make("button","tb-post-delete","Xóa");del.type="button";del.dataset.deletePost=post.id;del.dataset.postTitle=post.title||"Bài viết";
      actions.append(open,del);row.append(copy,actions);list.appendChild(row);
    });
  }

  async function loadPosts(){
    const auth=token();if(!auth)return managerStatus("Phiên quản trị không còn hợp lệ.","error");
    managerStatus("Đang tải bài đã đăng…");
    try{
      const response=await fetch("/api/v71/admin/posts",{headers:{Authorization:`Bearer ${auth}`},cache:"no-store"});
      const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw new Error(data.message||"Không tải được danh sách bài.");
      renderPosts(data.posts||[]);managerStatus(`${(data.posts||[]).length} bài do Admin tạo.`);
    }catch(error){managerStatus(error.message||"Không tải được danh sách bài.","error");}
  }

  async function deletePost(id,title,button){
    if(!id||!confirm(`Xóa vĩnh viễn bài “${title}”?`))return;
    button.disabled=true;managerStatus("Đang xóa bài…");
    try{
      const response=await fetch("/api/v71/admin/posts",{method:"DELETE",headers:{Authorization:`Bearer ${token()}`,"Content-Type":"application/json"},body:JSON.stringify({id})});
      const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw new Error(data.message||"Không xóa được bài.");
      managerStatus("✓ Đã xóa bài khỏi website.","ok");await loadPosts();
    }catch(error){managerStatus(error.message||"Không xóa được bài.","error");button.disabled=false;}
  }

  async function publish(event){
    event.preventDefault();const auth=token();if(!auth)return setStatus("Phiên quản trị không còn hợp lệ. Hãy đăng nhập lại.","error");
    const title=$("tbPostTitle").value.trim(),content=$("tbPostContent").value.trim();if(title.length<4||content.length<20)return setStatus("Cần nhập tiêu đề và nội dung đầy đủ.","error");
    const submit=$("tbPostSubmit");submit.disabled=true;setStatus("Đang đăng bài…");
    try{
      const coverUrl=await uploadCover($("tbPostCover").files[0],title);
      const response=await fetch("/api/v71/admin/posts",{method:"POST",headers:{Authorization:`Bearer ${auth}`,"Content-Type":"application/json"},body:JSON.stringify({title,summary:$("tbPostSummary").value.trim(),category:$("tbPostCategory").value,content,cover_url:coverUrl})});
      const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw new Error(data.message||"Không đăng được bài.");
      $("tbManualPostForm").reset();setStatus("✓ Đã đăng bài.","ok",data.post.url);loadPosts();
    }catch(error){setStatus(error.message||"Không đăng được bài.","error");}finally{submit.disabled=false;}
  }

  function inject(){
    if($("tbManualPostCreate"))return true;
    const panel=document.querySelector('[data-view-panel="posts"]');const head=panel?.querySelector(".section-title");if(!head)return false;
    const button=make("button","tb-post-create-btn","＋ Tạo bài đăng");button.id="tbManualPostCreate";button.type="button";button.addEventListener("click",openModal);head.appendChild(button);
    const manager=make("section","tb-post-manager");manager.id="tbPostManager";
    const managerHead=make("div","tb-post-manager-head");const copy=make("div","");copy.append(make("h3","","Bài đã đăng"),make("small","","Các bài được tạo trực tiếp từ Admin. Có thể mở hoặc xóa vĩnh viễn."));
    const refresh=make("button","tb-post-refresh","Làm mới");refresh.type="button";refresh.addEventListener("click",loadPosts);managerHead.append(copy,refresh);
    const status=make("div","tb-post-manager-status");status.id="tbPostManagerStatus";const list=make("div","tb-post-list");list.id="tbPostPublishedList";
    list.addEventListener("click",event=>{const del=event.target.closest("button[data-delete-post]");if(del)deletePost(del.dataset.deletePost,del.dataset.postTitle,del);});
    manager.append(managerHead,status,list);head.insertAdjacentElement("afterend",manager);loadPosts();return true;
  }

  addStyle();let tries=0;const boot=()=>{inject();if(++tries<100&&!$("tbManualPostCreate"))setTimeout(boot,150);};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
