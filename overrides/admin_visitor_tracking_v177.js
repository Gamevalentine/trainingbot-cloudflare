/* TrainingBot Admin - visitor tracking v177 */
(()=>{
  "use strict";

  const TOKEN_KEYS=["tb-admin-center-token-v2","tb-admin-center-token-v1","tb-cloud-admin-token-v40","tb-cloud-admin-token-v39"];
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const token=()=>TOKEN_KEYS.map(key=>sessionStorage.getItem(key)).find(Boolean)||"";
  let loading=false;

  function style(){
    if($("tbVisitorAdminStyle"))return;
    const node=document.createElement("style");
    node.id="tbVisitorAdminStyle";
    node.textContent=`
      .tb-vis-nav span{font-size:14px}
      .tb-vis-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px}
      .tb-vis-head h2{margin:3px 0 6px;font-size:25px}.tb-vis-head p{max-width:760px;margin:0;color:#7f8da5;font-size:11px!important;line-height:1.6}
      .tb-vis-refresh{min-height:40px;padding:0 14px;border:1px solid #2a3750;border-radius:11px;background:#111b2e;color:#d7def0;font-weight:900;cursor:pointer;white-space:nowrap}.tb-vis-refresh:hover{border-color:#745cff;color:#fff}.tb-vis-refresh:disabled{opacity:.55;cursor:wait}
      .tb-vis-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin-bottom:14px}
      .tb-vis-kpi{display:flex;align-items:center;gap:12px;min-height:94px;padding:16px;border:1px solid #202c43;border-radius:16px;background:#0d1423}
      .tb-vis-kpi>span{width:40px;height:40px;display:grid;place-items:center;flex:0 0 auto;border-radius:12px;background:rgba(118,92,255,.12);color:#cfc7ff;font-size:17px}.tb-vis-kpi.online>span{background:rgba(38,211,238,.10);color:#aef5ff}
      .tb-vis-kpi div{display:grid}.tb-vis-kpi small{color:#77859c;font-size:9px!important}.tb-vis-kpi strong{margin-top:2px;font:800 27px/1 "Space Grotesk",Inter,sans-serif}.tb-vis-kpi em{margin-top:6px;color:#63718a;font-size:9px;font-style:normal}
      .tb-vis-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
      .tb-vis-panel{padding:17px;border:1px solid #202c43;border-radius:16px;background:#0d1423}.tb-vis-panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.tb-vis-panel-head h3{margin:2px 0 0;font-size:17px}.tb-vis-panel-head span{color:#718098;font-size:9px}
      .tb-vis-chips{display:flex;flex-wrap:wrap;gap:8px}.tb-vis-chip{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #202c43;border-radius:10px;background:#09111f;color:#b7c1d3;font-size:10px}.tb-vis-chip b{color:#fff}.tb-vis-chip em{color:#718098;font-style:normal}
      .tb-vis-table-panel{padding:17px;border:1px solid #202c43;border-radius:16px;background:#0d1423}.tb-vis-status{min-height:17px;margin:0 0 9px;color:#718098;font-size:10px}.tb-vis-status.error{color:#fda4af}.tb-vis-status.ok{color:#86efac}
      .tb-vis-table-wrap{overflow:auto;border:1px solid #202c43;border-radius:12px;background:#071022}.tb-vis-table{width:100%;min-width:1120px;border-collapse:collapse}.tb-vis-table th,.tb-vis-table td{padding:11px 12px;border-bottom:1px solid #1b263a;text-align:left;vertical-align:top;font-size:10px}.tb-vis-table th{position:sticky;top:0;z-index:1;background:#0e1728;color:#7f8da5;font-size:9px;letter-spacing:.04em;text-transform:uppercase}.tb-vis-table tbody tr:hover{background:rgba(118,92,255,.045)}.tb-vis-table tbody tr:last-child td{border-bottom:0}
      .tb-vis-time strong,.tb-vis-time small{display:block;white-space:nowrap}.tb-vis-time small{margin-top:4px;color:#65748d;font-size:8px}.tb-vis-id{display:flex;align-items:center;gap:7px}.tb-vis-id code{padding:5px 7px;border-radius:8px;background:#111b2e;color:#cdd6ea;font-size:9px}.tb-vis-dot{width:7px;height:7px;border-radius:50%;background:#4b5563}.tb-vis-dot.online{background:#34d399;box-shadow:0 0 0 4px rgba(52,211,153,.08)}
      .tb-vis-journey{min-width:290px;max-width:480px;line-height:1.55;color:#c5cee0}.tb-vis-muted{color:#6f7e96}.tb-vis-empty{padding:34px;border:1px dashed #26344d;border-radius:12px;color:#7e8da7;text-align:center;font-size:11px}
      @media(max-width:1100px){.tb-vis-kpis{grid-template-columns:1fr 1fr}.tb-vis-grid{grid-template-columns:1fr}}
      @media(max-width:650px){.tb-vis-head{flex-direction:column}.tb-vis-refresh{width:100%}.tb-vis-kpis{grid-template-columns:1fr}.tb-vis-table-panel,.tb-vis-panel{padding:13px}}
    `;
    document.head.appendChild(node);
  }

  function pathLabel(value){
    let path=String(value||"/").split("?")[0].replace(/\.html$/i,"");
    const map={
      "/":"Trang chủ",
      "/index":"Trang chủ",
      "/news":"Tin tức",
      "/updates":"Cập nhật",
      "/wiki":"Wiki",
      "/community":"Cộng đồng",
      "/tim-dong-doi":"Tìm đồng đội",
      "/account":"Tài khoản",
      "/contact":"Liên hệ"
    };
    if(map[path])return map[path];
    if(/^\/news[-/]/i.test(path))return "Bài viết";
    const last=decodeURIComponent(path.split("/").filter(Boolean).pop()||"Trang chủ");
    return last.replace(/[-_]+/g," ").replace(/\b\w/g,m=>m.toUpperCase()).slice(0,44);
  }

  function journey(session){
    const parts=[];
    const add=value=>{
      const text=String(value||"").replace(/\s+/g," ").trim().slice(0,52);
      if(!text)return;
      if(parts.length&&parts[parts.length-1].toLocaleLowerCase("vi")===text.toLocaleLowerCase("vi"))return;
      parts.push(text);
    };
    for(const event of session.events||[]){
      if(event.event_type==="navigation")add(event.label||pathLabel(event.target));
      else if(event.event_type==="page_view")add(pathLabel(event.path));
    }
    if(!parts.length)add(pathLabel(session.current_path));
    return parts.join(" → ");
  }

  function fmtTime(value){
    const date=new Date(value);
    if(Number.isNaN(date.getTime()))return "—";
    return new Intl.DateTimeFormat("vi-VN",{timeZone:"Asia/Ho_Chi_Minh",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(date);
  }

  function isOnline(session){
    const t=new Date(session.last_seen_at).getTime();
    return Number.isFinite(t)&&Date.now()-t<=5*60*1000;
  }

  function genderLabel(value){
    if(value==="male")return "Nam";
    if(value==="female")return "Nữ";
    return "Chưa xác định";
  }

  function setStatus(message,type=""){
    const el=$("tbVisitorStatus");
    if(!el)return;
    el.textContent=message||"";
    el.className=`tb-vis-status ${type}`;
  }

  function renderChips(id,rows,key){
    const box=$(id);
    if(!box)return;
    if(!rows?.length){box.innerHTML='<span class="tb-vis-muted">Chưa có dữ liệu.</span>';return;}
    box.innerHTML=rows.map(row=>`<span class="tb-vis-chip"><b>${esc(row[key]||"Khác")}</b><em>${Number(row.total||0).toLocaleString("vi-VN")}</em></span>`).join("");
  }

  function render(data){
    const s=data.summary||{};
    const set=(id,value)=>{const el=$(id);if(el)el.textContent=Number(value||0).toLocaleString("vi-VN");};
    set("tbVisitorTodayPeople",s.today_visitors);
    set("tbVisitorTodaySessions",s.today_sessions);
    set("tbVisitorOnline",s.online_visitors);
    set("tbVisitorRecent",(data.sessions||[]).length);
    renderChips("tbVisitorDevices",data.devices||[],"device");
    renderChips("tbVisitorOS",data.oses||[],"os");

    const body=$("tbVisitorRows");
    if(!body)return;
    const sessions=data.sessions||[];
    if(!sessions.length){
      body.innerHTML='<tr><td colspan="7"><div class="tb-vis-empty">Chưa có lượt truy cập mới. Dữ liệu sẽ xuất hiện khi khách mở website.</div></td></tr>';
      return;
    }
    body.innerHTML=sessions.map(session=>{
      const route=journey(session);
      const online=isOnline(session);
      return `<tr>
        <td class="tb-vis-time"><strong>${esc(fmtTime(session.first_seen_at))}</strong><small>Cập nhật ${esc(fmtTime(session.last_seen_at))}</small></td>
        <td><div class="tb-vis-id"><i class="tb-vis-dot ${online?"online":""}"></i><code>#${esc(String(session.visitor_id||"").slice(0,8).toUpperCase())}</code></div></td>
        <td>${esc(session.device||"Khác")}</td>
        <td>${esc(session.os||"Khác")}</td>
        <td>${esc(session.browser||"Khác")}</td>
        <td>${esc(genderLabel(session.gender))}</td>
        <td class="tb-vis-journey" title="${esc(route)}">${esc(route)}</td>
      </tr>`;
    }).join("");
  }

  async function load(){
    if(loading)return;
    const auth=token();
    if(!auth)return setStatus("Phiên quản trị không còn hợp lệ. Hãy đăng nhập lại.","error");
    loading=true;
    const refresh=$("tbVisitorRefresh");
    if(refresh)refresh.disabled=true;
    setStatus("Đang tải dữ liệu truy cập…");
    try{
      const response=await fetch("/api/v71/admin/visitor-events?limit=150",{headers:{Authorization:`Bearer ${auth}`},cache:"no-store"});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok)throw new Error(data.message||`Không tải được dữ liệu (${response.status}).`);
      render(data);
      setStatus(`Cập nhật lúc ${new Intl.DateTimeFormat("vi-VN",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(new Date())}.`,"ok");
    }catch(error){
      setStatus(error.message||"Không tải được dữ liệu truy cập.","error");
    }finally{
      loading=false;
      if(refresh)refresh.disabled=false;
    }
  }

  function buildPanel(){
    if($("tbVisitorPanel"))return $("tbVisitorPanel");
    const firstView=document.querySelector(".view[data-view-panel]");
    const host=firstView?.parentElement;
    if(!host)return null;

    const panel=document.createElement("section");
    panel.id="tbVisitorPanel";
    panel.className="view tb-visitors-view";
    panel.dataset.viewPanel="visitor-tracking";
    panel.innerHTML=`
      <div class="tb-vis-head">
        <div><span class="eyebrow">THEO DÕI TRUY CẬP</span><h2>Khách đang vào TrainingBot</h2><p>Theo dõi thời gian, thiết bị, hệ điều hành, trình duyệt và hành trình trang/menu bằng mã khách ẩn danh. Không lưu IP và không tự suy đoán giới tính.</p></div>
        <button id="tbVisitorRefresh" class="tb-vis-refresh" type="button">↻ Làm mới</button>
      </div>
      <div class="tb-vis-kpis">
        <article class="tb-vis-kpi"><span>◎</span><div><small>KHÁCH HÔM NAY</small><strong id="tbVisitorTodayPeople">0</strong><em>Khách ẩn danh duy nhất</em></div></article>
        <article class="tb-vis-kpi"><span>▱</span><div><small>PHIÊN HÔM NAY</small><strong id="tbVisitorTodaySessions">0</strong><em>Số phiên truy cập</em></div></article>
        <article class="tb-vis-kpi online"><span>●</span><div><small>ĐANG ONLINE</small><strong id="tbVisitorOnline">0</strong><em>Có hoạt động trong 5 phút</em></div></article>
        <article class="tb-vis-kpi"><span>↗</span><div><small>ĐANG HIỂN THỊ</small><strong id="tbVisitorRecent">0</strong><em>Phiên gần nhất</em></div></article>
      </div>
      <div class="tb-vis-grid">
        <section class="tb-vis-panel"><div class="tb-vis-panel-head"><div><span class="eyebrow">THIẾT BỊ</span><h3>Thiết bị truy cập</h3></div></div><div id="tbVisitorDevices" class="tb-vis-chips"></div></section>
        <section class="tb-vis-panel"><div class="tb-vis-panel-head"><div><span class="eyebrow">HỆ ĐIỀU HÀNH</span><h3>iOS, Android và máy tính</h3></div></div><div id="tbVisitorOS" class="tb-vis-chips"></div></section>
      </div>
      <section class="tb-vis-table-panel">
        <div class="tb-vis-panel-head"><div><span class="eyebrow">PHIÊN GẦN NHẤT</span><h3>Lịch sử truy cập</h3></div><span>Tự làm mới mỗi 30 giây khi đang mở</span></div>
        <div id="tbVisitorStatus" class="tb-vis-status"></div>
        <div class="tb-vis-table-wrap"><table class="tb-vis-table"><thead><tr><th>Thời gian</th><th>Khách</th><th>Thiết bị</th><th>Hệ điều hành</th><th>Trình duyệt</th><th>Giới tính</th><th>Hành trình</th></tr></thead><tbody id="tbVisitorRows"><tr><td colspan="7"><div class="tb-vis-empty">Mở mục này để tải dữ liệu truy cập.</div></td></tr></tbody></table></div>
      </section>`;
    host.appendChild(panel);
    $("tbVisitorRefresh")?.addEventListener("click",load);
    return panel;
  }

  function setTopTitle(){
    const title=document.querySelector(".topbar-left h1");
    if(title)title.textContent="Theo dõi truy cập";
  }

  function show(event){
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const panel=buildPanel();
    if(!panel)return;
    document.querySelectorAll(".nav-item").forEach(item=>item.classList.remove("active"));
    $("tbVisitorNav")?.classList.add("active");
    document.querySelectorAll(".view").forEach(view=>view.classList.remove("active"));
    panel.classList.add("active");
    setTopTitle();
    load();
  }

  function inject(){
    if($("tbVisitorNav"))return true;
    const navItems=[...document.querySelectorAll(".nav-item")];
    if(!navItems.length)return false;

    const button=document.createElement("button");
    button.id="tbVisitorNav";
    button.type="button";
    button.className="nav-item tb-vis-nav";
    button.innerHTML="<span>◎</span><b>Theo dõi truy cập</b>";
    button.addEventListener("click",show);

    const stats=navItems.find(item=>/Thống kê/i.test(item.textContent||""));
    const security=navItems.find(item=>/Bảo mật/i.test(item.textContent||""));
    if(stats)stats.insertAdjacentElement("afterend",button);
    else if(security)security.insertAdjacentElement("beforebegin",button);
    else navItems[navItems.length-1].insertAdjacentElement("afterend",button);

    buildPanel();
    return true;
  }

  style();
  let tries=0;
  const boot=()=>{inject();if(++tries<100&&!$("tbVisitorNav"))setTimeout(boot,150);};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();

  setInterval(()=>{
    const panel=$("tbVisitorPanel");
    if(panel?.classList.contains("active"))load();
  },30000);
})();
