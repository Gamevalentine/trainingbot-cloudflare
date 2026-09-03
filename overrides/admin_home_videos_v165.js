/* TrainingBot Admin - homepage videos v167 */
(() => {
  "use strict";

  const TOKEN_KEYS=["tb-admin-center-token-v2","tb-admin-center-token-v1","tb-cloud-admin-token-v40","tb-cloud-admin-token-v39"];
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const token=()=>TOKEN_KEYS.map(key=>sessionStorage.getItem(key)).find(Boolean)||"";

  function style(){
    if($("tbHomeVideosAdminStyle"))return;
    const node=document.createElement("style");
    node.id="tbHomeVideosAdminStyle";
    node.textContent=`
      .tb-hv-admin{margin:0 0 16px;padding:16px;border:1px solid rgba(118,92,255,.22);border-radius:18px;background:rgba(8,15,30,.86)}
      .tb-hv-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:12px}.tb-hv-head h3{margin:3px 0 4px;font-size:18px}.tb-hv-head p{margin:0;color:#8391a9;font-size:10px!important}.tb-hv-edit{min-height:38px;border:0;border-radius:11px;padding:0 14px;background:linear-gradient(135deg,#745cff,#2acbea);color:#fff;font-weight:800;cursor:pointer;white-space:nowrap}
      .tb-hv-add{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px}.tb-hv-add input{min-height:42px;border:1px solid #28344e;border-radius:11px;background:#071022;color:#fff;padding:0 12px;outline:none}.tb-hv-add button,.tb-hv-row button{min-height:42px;border:0;border-radius:11px;padding:0 15px;background:linear-gradient(135deg,#745cff,#2acbea);color:#fff;font-weight:800;cursor:pointer}
      .tb-hv-status{min-height:18px;margin:9px 0;color:#8391a9;font-size:10px}.tb-hv-status.ok{color:#86efac}.tb-hv-status.error{color:#fda4af}
      .tb-hv-list{display:grid;gap:8px}.tb-hv-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;padding:10px;border:1px solid #202c43;border-radius:13px;background:#071022}.tb-hv-order{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:#121d33;color:#aebbd1;font-size:10px;font-weight:900}.tb-hv-copy{min-width:0}.tb-hv-copy b{display:flex;align-items:center;gap:7px;font-size:11px}.tb-hv-copy small{display:block;margin-top:4px;color:#718098;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tb-hv-new{padding:3px 6px;border-radius:999px;background:rgba(38,211,238,.11);color:#aef5ff;font-size:8px;font-weight:900}.tb-hv-row button{min-height:34px;padding:0 11px;background:#111b2e;border:1px solid #2b3852;color:#c4cde0}
      .tb-dashboard-empty{padding:18px;border:1px dashed #26344d;border-radius:14px;color:#8290a8;text-align:center;font-size:11px}
      @media(max-width:650px){.tb-hv-head{align-items:stretch;flex-direction:column}.tb-hv-edit{width:100%}.tb-hv-add{grid-template-columns:1fr}.tb-hv-row{grid-template-columns:auto minmax(0,1fr)}.tb-hv-row button{grid-column:1/-1}}
    `;
    document.head.appendChild(node);
  }

  function status(message,type=""){
    const node=$("tbHomeVideosStatus");
    if(!node)return;
    node.textContent=message||"";
    node.className=`tb-hv-status ${type}`;
  }

  async function adminApi(options={}){
    const headers=new Headers(options.headers||{});
    headers.set("Authorization",`Bearer ${token()}`);
    headers.set("Content-Type","application/json");
    const response=await fetch("/api/v71/admin/home-videos",{...options,headers,cache:"no-store"});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data.ok===false)throw new Error(data.message||`Yêu cầu thất bại (${response.status}).`);
    return data;
  }

  function rows(videos){
    const list=$("tbHomeVideosList");
    if(!list)return;
    if(!videos?.length){list.innerHTML='<div class="notice">Chưa có video trang chủ.</div>';return;}
    list.innerHTML=videos.map((video,index)=>`
      <article class="tb-hv-row">
        <span class="tb-hv-order">${index+1}</span>
        <div class="tb-hv-copy"><b>Video TikTok ${index===0?'<span class="tb-hv-new">MỚI NHẤT</span>':''}</b><small>${esc(video.url||video.external_id)}</small></div>
        <button type="button" data-delete-video="${esc(video.external_id)}">Xóa</button>
      </article>`).join("");
  }

  async function load(){
    try{
      const response=await fetch("/api/home-videos",{cache:"no-store"});
      const data=await response.json();
      if(!response.ok||!data?.ok)throw new Error(data?.message||"Không tải được danh sách video.");
      rows(data.videos||[]);
    }catch(error){status(error.message||"Không tải được video.","error");}
  }

  async function saveUrl(url,message="Đang thêm video…"){
    const value=String(url||"").trim();
    if(!value)return status("Dán link TikTok trước khi cập nhật.","error");
    status(message);
    try{
      const data=await adminApi({method:"POST",body:JSON.stringify({url:value})});
      rows(data.videos||[]);
      status("✓ Đã cập nhật. Video này đang là video mới nhất trên trang chủ.","ok");
      return true;
    }catch(error){status(error.message||"Không cập nhật được video.","error");return false;}
  }

  async function add(){
    const input=$("tbHomeVideoUrl");
    if(await saveUrl(input?.value,"Đang thêm video…"))input.value="";
  }

  async function editLatest(){
    const url=prompt("Dán link TikTok muốn đặt làm video mới nhất:","");
    if(url===null)return;
    await saveUrl(url,"Đang cập nhật video mới nhất…");
  }

  async function remove(id,button){
    if(!confirm("Xóa video này khỏi trang chủ?"))return;
    button.disabled=true;
    status("Đang xóa video…");
    try{
      const data=await adminApi({method:"DELETE",body:JSON.stringify({external_id:id})});
      rows(data.videos||[]);
      status("✓ Đã xóa video.","ok");
    }catch(error){status(error.message||"Không xóa được video.","error");}
    finally{button.disabled=false;}
  }

  function inject(){
    if($("tbHomeVideosAdmin"))return true;
    const panel=document.querySelector('[data-view-panel="media"]');
    if(!panel)return false;
    const box=document.createElement("section");
    box.id="tbHomeVideosAdmin";
    box.className="tb-hv-admin";
    box.innerHTML=`
      <div class="tb-hv-head"><div><span class="eyebrow">TRANG CHỦ</span><h3>Video TikTok</h3><p>Video mới nhất ở khung lớn. Các video cũ tự xếp ngang bên dưới.</p></div><button id="tbHomeVideoEdit" class="tb-hv-edit" type="button">Sửa video mới nhất</button></div>
      <div class="tb-hv-add"><input id="tbHomeVideoUrl" type="url" placeholder="Dán link TikTok mới"><button id="tbHomeVideoAdd" type="button">Thêm video</button></div>
      <div id="tbHomeVideosStatus" class="tb-hv-status"></div>
      <div id="tbHomeVideosList" class="tb-hv-list"></div>`;
    const title=panel.querySelector(".section-title");
    if(title)title.after(box);else panel.prepend(box);
    $("tbHomeVideoEdit").addEventListener("click",editLatest);
    $("tbHomeVideoAdd").addEventListener("click",add);
    $("tbHomeVideoUrl").addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();add();}});
    $("tbHomeVideosList").addEventListener("click",event=>{
      const button=event.target.closest("button[data-delete-video]");
      if(button)remove(button.dataset.deleteVideo,button);
    });
    load();
    return true;
  }

  const cleanText=node=>String(node?.textContent||"").replace(/\s+/g," ").trim();
  const findText=(selector,text)=>[...document.querySelectorAll(selector)].find(node=>cleanText(node)===text);

  function cleanupDashboard(){
    if(!location.hash.includes("dashboard"))return;

    const studio=findText("a,button","Mở Studio V2");
    const media=findText("a,button","Tải media");
    if(studio&&media&&studio.parentElement===media.parentElement){
      studio.parentElement.hidden=true;
    }else{
      if(studio)studio.hidden=true;
      if(media)media.hidden=true;
    }

    const quickTitle=findText("h1,h2,h3,h4,b,strong","Lối tắt quản trị");
    const quickPanel=quickTitle?.closest(".panel");
    if(quickPanel)quickPanel.hidden=true;

    const recentTitle=findText("h1,h2,h3,h4,b,strong","Hoạt động cộng đồng");
    const recentPanel=recentTitle?.closest(".panel");
    if(recentPanel)recentPanel.style.gridColumn="1 / -1";

    const actionTitle=findText("h1,h2,h3,h4,b,strong","Trung tâm hành động");
    const actionPanel=actionTitle?.closest(".panel");
    if(!actionPanel)return;
    const rows=[...actionPanel.querySelectorAll(".action-row")];
    const inactive=["Không có thư mới","Không có đăng ký mới","0 mục trong Media Library","Studio V2 sẵn sàng"];
    rows.forEach(row=>{row.hidden=inactive.some(text=>cleanText(row).includes(text));});
    let empty=actionPanel.querySelector(".tb-dashboard-empty");
    const allHidden=rows.length>0&&rows.every(row=>row.hidden);
    if(allHidden&&!empty){
      empty=document.createElement("div");
      empty.className="tb-dashboard-empty";
      empty.textContent="Không có việc cần xử lý lúc này.";
      const last=rows.at(-1);
      if(last)last.insertAdjacentElement("afterend",empty);
    }else if(empty){
      empty.hidden=!allHidden;
    }
  }

  style();
  let tries=0;
  const boot=()=>{inject();cleanupDashboard();if(++tries<100)setTimeout(boot,150);};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.addEventListener("hashchange",()=>setTimeout(cleanupDashboard,0));
})();
