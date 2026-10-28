/* TrainingBot Admin audience v2: unique anonymous browser IDs, visits, countries. */
(()=>{
  "use strict";
  const KEYS=["tb-admin-center-token-v2","tb-admin-center-token-v1","tb-cloud-admin-token-v40","tb-cloud-admin-token-v39"];
  const get=id=>document.getElementById(id);
  const escape=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const format=value=>Number(value||0).toLocaleString("vi-VN");
  // Same 5-minute activity definition as the existing Admin online KPI.
  // A timestamp cannot prove a live connection; it indicates recent activity.
  const isRecentlyActive=value=>{
    const timestamp=Date.parse(String(value||""));
    const elapsed=Date.now()-timestamp;
    return Number.isFinite(timestamp)&&elapsed>=-60000&&elapsed<=5*60*1000;
  };
  const date=value=>{
    if(!value||Number.isNaN(Date.parse(value)))return "—";
    return new Intl.DateTimeFormat("vi-VN",{timeZone:"Asia/Ho_Chi_Minh",dateStyle:"short",timeStyle:"short"}).format(new Date(value));
  };
  const region=code=>{
    if(!code||code==="ZZ")return "Chưa xác định";
    try{return new Intl.DisplayNames(["vi"],{type:"region"}).of(code)||code;}catch{return code;}
  };
  const token=()=>{
    try{return KEYS.map(k=>sessionStorage.getItem(k)).find(Boolean)||"";}catch{return "";}
  };
  const state={page:1,audience:"all",country:"ALL",serial:0};
  function setup(){
    const original=get("tbVisitorPanel");
    if(!original||get("tbVisitorInsights"))return false;
    const view=document.createElement("div");
    view.id="tbVisitorInsights";
    view.innerHTML=`
      <div class="tb-audience-kpis">
        <div><small>KHÁCH DUY NHẤT (TOÀN THỜI GIAN)</small><strong id="tbAudTotal">—</strong></div>
        <div><small>KHÁCH MỚI HÔM NAY</small><strong id="tbAudNewToday">—</strong></div>
        <div><small>KHÁCH CÓ HOẠT ĐỘNG HÔM NAY</small><strong id="tbAudToday">—</strong></div>
      </div>
      <div class="tb-audience-grid">
        <section class="tb-audience-panel">
          <div class="tb-audience-head"><h3>🌐 Quốc gia truy cập</h3><small>Đếm khách duy nhất, không đếm tab</small></div>
          <div id="tbAudCountries" class="tb-audience-chips"></div>
        </section>
        <section class="tb-audience-panel">
          <div class="tb-audience-head"><h3>💻 Thiết bị truy cập</h3><small>Đếm mã khách theo loại thiết bị</small></div>
          <div id="tbAudDevices" class="tb-audience-chips"></div>
        </section>
      </div>
      <section class="tb-audience-panel">
        <div class="tb-audience-head"><h3>Khách mới và khách quay lại</h3><small>Phiên ghé thăm: ngắt 30 phút không hoạt động</small></div>
        <div class="tb-audience-filters">
          <label>Loại khách<select id="tbAudType"><option value="all">Tất cả</option><option value="admin">Admin</option><option value="new">Khách mới</option><option value="returning">Khách quay lại</option><option value="unknown">Dữ liệu cũ chưa xác định</option></select></label>
          <label>Quốc gia<select id="tbAudCountry"><option value="ALL">Tất cả quốc gia</option></select></label>
        </div>
        <div class="tb-audience-presence-legend" aria-label="Chú giải trạng thái hoạt động">
          <span class="tb-audience-presence is-online"><i aria-hidden="true"></i>Đang online</span>
          <span class="tb-audience-presence is-offline"><i aria-hidden="true"></i>Offline</span>
          <small>Online = có hoạt động trong 5 phút gần nhất · tự cập nhật mỗi 30 giây</small>
        </div>
        <div class="tb-audience-meta" id="tbAudMeta">Đang tải thống kê…</div>
        <div id="tbAudError" role="status" aria-live="polite"></div>
        <div class="tb-audience-scroll">
          <table class="tb-audience-table">
            <thead><tr><th>Khách ẩn danh</th><th>Trạng thái</th><th>Phân loại</th><th>Quốc gia</th><th>Thiết bị</th><th>Lượt ghé đã đo</th><th>Lần xem trang</th><th>Lần đầu</th><th>Gần nhất</th><th>Trang cuối</th></tr></thead>
            <tbody id="tbAudRows"><tr><td colspan="10">Đang tải…</td></tr></tbody>
          </table>
        </div>
        <div class="tb-audience-pages"><button type="button" id="tbAudPrev">← Trước</button><span id="tbAudPage">Trang 1</span><button type="button" id="tbAudNext">Sau →</button></div>
        <p class="tb-audience-note">Trình duyệt đã được Admin xác minh được gắn nhãn Admin và không tính vào tổng khách công khai, quốc gia và thiết bị. “Khách” là mã ẩn danh trong một trình duyệt, không phải định danh người hoặc máy vật lý. Xóa dữ liệu trình duyệt, đổi trình duyệt hoặc chế độ ẩn danh có thể tạo mã khách mới. Lượt ghé chỉ được đo chính xác từ lúc bản thống kê mới hoạt động; dữ liệu cũ được giữ nhưng không tự suy đoán số lần quay lại.</p>
      </section>`;
    const style=document.createElement("style");
    style.textContent=`
      #tbVisitorPanel.tb-audience-ready>.tb-vis-grid,
      #tbVisitorPanel.tb-audience-ready>.tb-vis-table-panel{display:none!important}
      .tb-audience-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:12px 0}
      .tb-audience-kpis>div,.tb-audience-panel{border:1px solid #202c43;border-radius:15px;background:#0d1423;padding:17px;min-width:0}
      .tb-audience-kpis small{font-size:10px;color:#94a3b8;display:block}.tb-audience-kpis strong{font-size:27px;font-weight:800;color:#fff;display:block;margin-top:7px}
      .tb-audience-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:13px}
      .tb-audience-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px}
      .tb-audience-head h3{font-size:17px;margin:0;color:#e5ecfa}.tb-audience-head small{font-size:10px;color:#94a3b8}
      .tb-audience-chips{display:flex;gap:8px;flex-wrap:wrap}
      .tb-audience-chip{background:#111e33;border:1px solid #25344d;border-radius:9px;padding:7px 9px;font-size:11px;color:#d7e0f0}
      .tb-audience-chip b{margin-left:8px;color:#a5b4fc;font-variant-numeric:tabular-nums}
      .tb-audience-filters{display:flex;gap:12px;flex-wrap:wrap;margin:10px 0 13px}
      .tb-audience-filters label{font-size:11px;color:#a9b8d2;display:flex;flex-direction:column;gap:6px;min-width:170px}
      .tb-audience-filters select{background:#101c30;border:1px solid #33415e;color:#eaf0fb;border-radius:9px;padding:9px;max-width:260px}
      .tb-audience-meta{color:#a6b4cb;font-size:11px;margin:8px 0}
      #tbAudError{font-size:11px;color:#ffb4b4;margin-bottom:8px}
      .tb-audience-scroll{overflow:auto;max-width:100%;border:1px solid #24324a;border-radius:11px}
      .tb-audience-table{width:100%;min-width:1200px;border-collapse:collapse}
      .tb-audience-table th,.tb-audience-table td{text-align:left;padding:10px 12px;font-size:11px;border-bottom:1px solid #202c43;vertical-align:top}
      .tb-audience-table th{background:#141d30;color:#a9b9ce;white-space:nowrap}
      .tb-audience-table td{color:#e3ebf6}.tb-audience-table code{color:#c5baff}
      .tb-admin-tag{display:inline-block;margin:0 6px 0 0;padding:3px 6px;border:1px solid #48b8b1;border-radius:6px;color:#86fff0;font-size:10px;font-weight:800}
      .tb-audience-presence-legend{display:flex;align-items:center;flex-wrap:wrap;gap:8px 17px;margin:8px 0 12px}
      .tb-audience-presence-legend small{font-size:10px;color:#8ca1bb}
      .tb-audience-presence{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:700;white-space:nowrap}
      .tb-audience-presence i{display:inline-block;width:9px;height:9px;border-radius:50%;flex-shrink:0}
      .tb-audience-presence.is-online{color:#72ebaa}
      .tb-audience-presence.is-online i{background:#34d399;box-shadow:0 0 0 3px rgba(52,211,153,.13)}
      .tb-audience-presence.is-offline{color:#8997ad}
      .tb-audience-presence.is-offline i{background:#64748b}
      .tb-audience-pages{display:flex;justify-content:flex-end;align-items:center;gap:12px;margin-top:12px;font-size:12px;color:#a8b7cc}
      .tb-audience-pages button{background:#17243b;color:#eff4ff;border:1px solid #30405c;border-radius:9px;padding:8px 14px;cursor:pointer}
      .tb-audience-pages button:disabled{opacity:.4;cursor:default}
      .tb-audience-note{font-size:10px!important;color:#8997ab;line-height:1.6;margin:13px 0 0}
      @media(max-width:700px){.tb-audience-grid{grid-template-columns:1fr}.tb-audience-kpis{grid-template-columns:1fr}.tb-audience-head{align-items:flex-start;flex-direction:column}.tb-audience-filters label{flex:1 1 150px}}
    `;
    document.head.append(style);
    const firstGrid=original.querySelector(".tb-vis-grid");
    if(firstGrid)firstGrid.before(view);else original.append(view);
    get("tbAudType").addEventListener("change",e=>{state.audience=e.target.value;state.page=1;load();});
    get("tbAudCountry").addEventListener("change",e=>{state.country=e.target.value;state.page=1;load();});
    get("tbAudPrev").addEventListener("click",()=>{if(state.page>1){state.page--;load();}});
    get("tbAudNext").addEventListener("click",()=>{state.page++;load();});
    get("tbVisitorRefresh")?.addEventListener("click",load);
    let wasActive=original.classList.contains("active");
    const observer=new MutationObserver(()=>{
      const active=original.classList.contains("active");
      if(active&&!wasActive)load();
      wasActive=active;
    });
    observer.observe(original,{attributes:true,attributeFilter:["class"]});
    if(wasActive)load();
    setInterval(()=>{if(original.classList.contains("active"))load();},30000);
    return true;
  }
  function chips(target,list,key,renderKey){
    get(target).innerHTML=list.length?list.map(row=>`<span class="tb-audience-chip">${escape(renderKey?renderKey(row[key]):row[key])}<b>${format(row.total)}</b></span>`).join(""):"<span class='tb-audience-chip'>Chưa có dữ liệu</span>";
  }
  async function load(){
    const n=++state.serial;
    const auth=token();
    if(!auth){get("tbAudError").textContent="Chưa đăng nhập Admin.";return;}
    const params=new URLSearchParams({audience:state.audience,country:state.country,page:String(state.page),limit:"50"});
    get("tbAudMeta").textContent="Đang cập nhật…";
    try{
      const res=await fetch("/api/v72/admin/visitor-summary?"+params.toString(),{cache:"no-store",headers:{Authorization:"Bearer "+auth}});
      const data=await res.json().catch(()=>({}));
      if(n!==state.serial)return;
      if(!res.ok||data.ok!==true)throw Error(data.message||"API thống kê chưa sẵn sàng ("+res.status+").");
      const s=data.summary;
      get("tbAudTotal").textContent=format(s.total_visitors);
      get("tbAudNewToday").textContent=format(s.today_new);
      get("tbAudToday").textContent=format(s.today_active);
      chips("tbAudCountries",data.countries||[],"country",region);
      chips("tbAudDevices",data.devices||[],"device");
      const select=get("tbAudCountry"),selected=state.country;
      select.innerHTML='<option value="ALL">Tất cả quốc gia</option>'+(data.countries||[]).map(x=>`<option value="${escape(x.country)}">${escape(region(x.country))} (${format(x.total)})</option>`).join("");
      select.value=selected;
      const names={admin:"Admin",new:"Mới",returning:"Quay lại",unknown:"Chưa xác định"};
      get("tbAudRows").innerHTML=(data.visitors||[]).map(v=>{
        const active=isRecentlyActive(v.last_seen_at);
        const status=active?"Đang online":"Offline";
        return `<tr>
        <td>${v.is_admin?'<span class="tb-admin-tag">ADMIN</span>':""}<code>#${escape(String(v.visitor_id).slice(0,10).toUpperCase())}</code></td>
        <td><span class="tb-audience-presence ${active?"is-online":"is-offline"}" title="${active?"Có hoạt động trong 5 phút gần nhất":"Không có hoạt động trong 5 phút gần nhất"}" aria-label="${status}"><i aria-hidden="true"></i>${status}</span></td>
        <td>${escape(names[v.visitor_type]||"Chưa xác định")}</td>
        <td>${escape(region(v.country))}</td>
        <td>${escape(v.device)} · ${escape(v.os)}</td>
        <td>${v.visit_count?format(v.visit_count):"—"}</td>
        <td>${format(v.page_views)}</td>
        <td>${escape(date(v.first_seen_at))}</td>
        <td>${escape(date(v.last_seen_at))}</td>
        <td>${escape(v.current_path)}</td>
      </tr>`;
      }).join("")||'<tr><td colspan="10">Không có khách phù hợp bộ lọc.</td></tr>';
      get("tbAudMeta").textContent=`Khớp bộ lọc: ${format(s.filtered_visitors)} hồ sơ · Admin: ${format(s.admin_visitors)} · Mới: ${format(s.new_visitors)} · Quay lại: ${format(s.returning_visitors)} · Lịch sử chưa rõ: ${format(s.unknown_visitors)}`;
      get("tbAudPage").textContent="Trang "+data.page;
      get("tbAudPrev").disabled=state.page===1;
      get("tbAudNext").disabled=!data.has_more;
      get("tbAudError").textContent="";
      get("tbVisitorPanel").classList.add("tb-audience-ready");
    }catch(error){
      if(n!==state.serial)return;
      get("tbAudError").textContent=String(error.message||error);
      get("tbAudMeta").textContent="Không thể xác minh dữ liệu mới — không hiển thị số 0 giả.";
      get("tbVisitorPanel")?.classList.remove("tb-audience-ready");
    }
  }
  const timer=setInterval(()=>{if(setup())clearInterval(timer);},350);
})();
