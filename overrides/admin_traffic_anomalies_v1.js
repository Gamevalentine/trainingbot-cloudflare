/* Evidence-only traffic burst audit in Admin: NO automatic bot verdict or blocking. */
(()=>{
  "use strict";
  const KEYS=["tb-admin-center-token-v2","tb-admin-center-token-v1","tb-cloud-admin-token-v40","tb-cloud-admin-token-v39"];
  const el=id=>document.getElementById(id);
  const escape=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const count=n=>Number(n||0).toLocaleString("vi-VN");
  const formatDate=s=>{
    const d=new Date(s);
    return Number.isNaN(d.valueOf())?"—":new Intl.DateTimeFormat("vi-VN",{dateStyle:"short",timeStyle:"short",timeZone:"Asia/Ho_Chi_Minh"}).format(d);
  };
  const token=()=>{try{return KEYS.map(k=>sessionStorage.getItem(k)).find(Boolean)||"";}catch{return "";}};
  const state={days:1,country:"ALL",serial:0};
  const region=code=>{
    if(!code||code==="ZZ")return "Chưa xác định";
    try{return new Intl.DisplayNames(["vi"],{type:"region"}).of(code)||code;}catch{return code;}
  };
  function setup(){
    const after=el("tbTrafficSources");
    const host=el("tbVisitorInsights");
    if(!after||!host||el("tbTrafficAnomalies"))return false;
    const section=document.createElement("section");
    section.id="tbTrafficAnomalies";
    section.className="tb-audience-panel tb-anomaly-panel";
    section.innerHTML=`
      <div class="tb-audience-head"><div>
        <h3>🔍 Kiểm tra các đợt truy cập bất thường</h3>
        <small>Chỉ phân tích dữ liệu D1, không theo dõi IP hoặc định danh thiết bị vật lý</small>
      </div><button type="button" id="tbAnomalyRefresh">↻ Làm mới</button></div>
      <p class="tb-anomaly-explain">Nhóm các mã khách theo 5 phút, quốc gia, thiết bị, trình duyệt và trang đầu. Thiếu referrer hoặc chỉ xem một trang <strong>không chứng minh là bot</strong>. Chưa tự chặn, xóa hoặc loại khách khỏi thống kê.</p>
      <div class="tb-anomaly-controls">
        <label>Khoảng thời gian<select id="tbAnomalyDays"><option value="1">24 giờ qua</option><option value="7">7 ngày qua</option></select></label>
        <label>Quốc gia<select id="tbAnomalyCountry"><option value="ALL">Mọi quốc gia</option><option value="US">Hoa Kỳ</option><option value="VN">Việt Nam</option></select></label>
      </div>
      <div id="tbAnomalyStatus" role="status" aria-live="polite">Đang kiểm tra các đợt truy cập…</div>
      <div class="tb-anomaly-summary" id="tbAnomalySummary"></div>
      <div class="tb-audience-scroll"><table class="tb-audience-table tb-anomaly-table">
        <thead><tr><th>Thời điểm</th><th>Quốc gia / Mẫu truy cập</th><th>Mã khách / Lượt ghé</th><th>Thiếu bằng chứng nguồn</th><th>Chỉ 1 trang</th><th>Ưu tiên điều tra</th></tr></thead>
        <tbody id="tbAnomalyRows"><tr><td colspan="6">Đang tải…</td></tr></tbody>
      </table></div>
      <p class="tb-anomaly-foot">Mỗi nhóm chỉ là những <strong>đặc điểm giống nhau</strong> trong cùng 5 phút, không chứng minh cùng một người hay cùng bot. Cloudflare Bot Score/WAF chưa được kết nối để đối chiếu; không hiển thị điểm bot giả. Chỉ trả tối đa 40 nhóm để tránh truy vấn nặng.</p>`;
    const style=document.createElement("style");
    style.textContent=`
      .tb-anomaly-panel{margin-top:14px}
      .tb-anomaly-panel #tbAnomalyRefresh{padding:9px 12px;border:1px solid #344764;border-radius:9px;background:#15233a;color:#e1ebf8;cursor:pointer}
      .tb-anomaly-explain,.tb-anomaly-foot{font-size:11px!important;color:#99acc4;line-height:1.7;margin:9px 0 14px}
      .tb-anomaly-controls{display:flex;flex-wrap:wrap;gap:12px;margin:10px 0 13px}
      .tb-anomaly-controls label{font-size:11px;color:#aabbd4;display:grid;gap:6px;min-width:185px}
      .tb-anomaly-controls select{border:1px solid #344764;background:#111c30;color:#e4edf9;padding:9px;border-radius:9px}
      #tbAnomalyStatus{color:#a9bbce;font-size:11px;margin:10px 0}
      #tbAnomalyStatus.error{color:#ffb4b4}
      .tb-anomaly-summary{font-size:11px;color:#aabbd4;margin:10px 0}
      .tb-anomaly-table{min-width:950px}
      .tb-anomaly-table td{max-width:280px;overflow-wrap:anywhere}
      .tb-anomaly-table small{display:block;font-size:10px;color:#97a9bf;line-height:1.6;margin-top:4px}
      .tb-anomaly-tag{display:inline-block;border:1px solid #36506e;border-radius:7px;padding:4px 8px;font-size:10px;color:#cfdef2}
      .tb-anomaly-tag.review{border-color:#b98836;color:#ffd596}
      .tb-anomaly-tag.priority{border-color:#d9826e;color:#ffc0a5}
    `;
    document.head.append(style);
    after.insertAdjacentElement("afterend",section);
    el("tbAnomalyRefresh").addEventListener("click",load);
    el("tbAnomalyDays").addEventListener("change",e=>{state.days=Number(e.target.value)===7?7:1;load();});
    el("tbAnomalyCountry").addEventListener("change",e=>{state.country=e.target.value;load();});
    const panel=el("tbVisitorPanel");
    let wasActive=panel.classList.contains("active");
    const observer=new MutationObserver(()=>{
      const active=panel.classList.contains("active");
      if(active&&!wasActive)load();
      wasActive=active;
    });
    observer.observe(panel,{attributes:true,attributeFilter:["class"]});
    if(wasActive)load();
    setInterval(()=>{if(panel.classList.contains("active"))load();},60000);
    return true;
  }
  async function load(){
    const auth=token(),n=++state.serial;
    if(!auth){el("tbAnomalyStatus").textContent="Đăng nhập Admin để xem phân tích.";return;}
    el("tbAnomalyStatus").textContent="Đang phân tích các đợt truy cập…";
    try{
      const q=new URLSearchParams({days:String(state.days),country:state.country,min_visitors:"3"});
      const r=await fetch("/api/v72/admin/traffic-anomalies?"+q,{headers:{Authorization:"Bearer "+auth},cache:"no-store"});
      const data=await r.json().catch(()=>({}));
      if(n!==state.serial)return;
      if(!r.ok||!data.ok)throw Error(data.message||"Không đọc được báo cáo.");
      if(!data.ready){
        el("tbAnomalyRows").innerHTML='<tr><td colspan="6">Chưa có dữ liệu để phân tích.</td></tr>';
        el("tbAnomalyStatus").textContent=data.message||"Chưa có lượt ghé.";
        return;
      }
      const groups=data.groups||[];
      const titles={observe:"Ghi nhận",review:"Cần kiểm tra",priority:"Ưu tiên kiểm tra"};
      el("tbAnomalyStatus").classList.remove("error");
      el("tbAnomalyStatus").textContent="Cập nhật "+formatDate(data.generated_at)+" · Mốc 5 phút · Không phải kết luận về bot.";
      el("tbAnomalySummary").textContent=`Tìm thấy ${count(groups.length)} nhóm có từ 3 mã khách giống mẫu trở lên trong ${state.days===1?"24 giờ":"7 ngày"} (tối đa 40 nhóm). Điểm bot Cloudflare: chưa có dữ liệu.`;
      el("tbAnomalyRows").innerHTML=groups.map(g=>{
        const level=["observe","review","priority"].includes(g.priority)?g.priority:"observe";
        const why=(g.reasons||[]).map(x=>escape(x)).join(" · ");
        return `<tr>
          <td>${escape(formatDate(g.window_start))}<small>Nhóm 5 phút</small></td>
          <td><strong>${escape(region(g.country))}</strong><small>${escape(g.device)} · ${escape(g.os)} · ${escape(g.browser)}</small><small>Trang: ${escape(g.entry_path)}</small></td>
          <td><strong>${count(g.visitors)} mã khách</strong><small>${count(g.visits)} lượt ghé</small></td>
          <td>${count(Number(g.missing_source_visits)+Number(g.legacy_visits))} / ${count(g.visits)}<small>${count(g.legacy_visits)} lượt lịch sử chưa đo nguồn</small></td>
          <td>${count(g.single_page_visits)} / ${count(g.visits)}</td>
          <td><span class="tb-anomaly-tag ${level}">${escape(titles[level])}</span><small>${why}</small></td>
        </tr>`;
      }).join("")||'<tr><td colspan="6">Không thấy nhóm nào đạt ngưỡng 3 mã khách trong khoảng đã chọn.</td></tr>';
    }catch(error){
      if(n!==state.serial)return;
      el("tbAnomalyStatus").classList.add("error");
      el("tbAnomalyStatus").textContent=String(error.message||error)+" — chưa có kết quả xác minh.";
    }
  }
  const timer=setInterval(()=>{if(setup())clearInterval(timer);},350);
})();
