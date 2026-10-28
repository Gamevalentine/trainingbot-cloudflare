/* TrainingBot Admin: evidence-based attribution, never treats missing referrer as Direct. */
(()=>{
  "use strict";
  const tokenKeys=["tb-admin-center-token-v2","tb-admin-center-token-v1","tb-cloud-admin-token-v40","tb-cloud-admin-token-v39"];
  const el=id=>document.getElementById(id);
  const escape=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const fmt=value=>Number(value||0).toLocaleString("vi-VN");
  const when=value=>{
    const date=new Date(value);
    return Number.isNaN(date.getTime())?"—":new Intl.DateTimeFormat("vi-VN",{timeZone:"Asia/Ho_Chi_Minh",dateStyle:"short",timeStyle:"short"}).format(date);
  };
  const token=()=>{try{return tokenKeys.map(k=>sessionStorage.getItem(k)).find(Boolean)||"";}catch{return "";}};
  const region=code=>{
    if(!code||code==="ZZ")return "Chưa xác định";
    try{return new Intl.DisplayNames(["vi"],{type:"region"}).of(code)||code;}catch{return code;}
  };
  const state={source:"all",country:"ALL",activity:"all",page:1,serial:0};
  let loading=false;
  function build(){
    const host=el("tbVisitorInsights");
    if(!host||el("tbTrafficSources"))return false;
    const section=document.createElement("section");
    section.id="tbTrafficSources";
    section.className="tb-audience-panel tb-traffic-panel";
    section.innerHTML=`
      <div class="tb-audience-head"><div><h3>🔗 Nguồn truy cập TrainingBot</h3><small>Referrer, UTM và trang đầu tiên theo từng lượt ghé</small></div><button id="tbTrafficRefresh" type="button">↻ Làm mới</button></div>
      <p class="tb-traffic-note">Nguồn UTM là thông tin từ đường link, không phải xác minh bởi nền tảng. Không có referrer/UTM được ghi "Không rõ nguồn", không tự nhận là truy cập trực tiếp. Lượt ghé Admin không tính vào báo cáo này.</p>
      <div id="tbTrafficStatus" role="status" aria-live="polite">Đang tải dữ liệu nguồn truy cập…</div>
      <div class="tb-traffic-sources" id="tbTrafficSourcesList"></div>
      <div class="tb-traffic-filter">
        <label>Nguồn<select id="tbTrafficSource"><option value="all">Tất cả nguồn</option></select></label>
        <label>Quốc gia<select id="tbTrafficCountry"><option value="ALL">Tất cả quốc gia</option></select></label>
        <label>Hành vi<select id="tbTrafficActivity"><option value="all">Tất cả</option><option value="single_page">Mã khách mới chỉ xem một trang</option></select></label>
      </div>
      <div id="tbTrafficCount" class="tb-traffic-small"></div>
      <div class="tb-audience-scroll"><table class="tb-audience-table tb-traffic-table">
        <thead><tr><th>Khách</th><th>Nguồn / Bằng chứng</th><th>Quốc gia</th><th>Trang đầu</th><th>Trang giới thiệu</th><th>UTM</th><th>Lượt xem của mã khách</th><th>Lần ghé</th></tr></thead>
        <tbody id="tbTrafficRows"><tr><td colspan="8">Chưa có dữ liệu.</td></tr></tbody>
      </table></div>
      <div class="tb-audience-pages"><button type="button" id="tbTrafficPrev">← Trước</button><span id="tbTrafficPage">Trang 1</span><button type="button" id="tbTrafficNext">Sau →</button></div>
      <details class="tb-traffic-legacy"><summary>Referrer lịch sử đã lưu (không đồng nghĩa nguồn lần đầu)</summary>
        <div id="tbTrafficLegacy"></div></details>
      <p class="tb-traffic-note">Chỉ xem một trang là tín hiệu cần kiểm tra, không chứng minh đó là bot. Trường "Lượt xem" tính theo toàn bộ lịch sử mã khách, không phải một lượt ghé. Các lượt ghé trước khi nâng cấp chưa thể khôi phục UTM.</p>`;
    const style=document.createElement("style");
    style.textContent=`
      .tb-traffic-panel{margin-top:14px}
      .tb-traffic-panel #tbTrafficRefresh{padding:9px 12px;border:1px solid #344764;border-radius:9px;background:#15233a;color:#e1ebf8;cursor:pointer}
      .tb-traffic-note{font-size:11px!important;color:#94a3b8;line-height:1.65;margin:7px 0 12px}
      #tbTrafficStatus{font-size:11px;color:#c5d6e9;margin:9px 0}
      #tbTrafficStatus.error{color:#ffb4b4}
      .tb-traffic-sources{display:flex;flex-wrap:wrap;gap:8px;margin:13px 0}
      .tb-traffic-source{padding:10px 12px;border:1px solid #2a3f5a;border-radius:11px;background:#101c30;display:grid;gap:4px;min-width:145px}
      .tb-traffic-source strong{font-size:12px;color:#e7eef9}.tb-traffic-source small{color:#8fa7bd;font-size:10px}
      .tb-traffic-source b{color:#a5f3fc;font-size:16px}
      .tb-traffic-filter{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}
      .tb-traffic-filter label{font-size:11px;color:#aabbd4;display:grid;gap:6px;min-width:185px}
      .tb-traffic-filter select{border:1px solid #344764;background:#111c30;color:#e4edf9;padding:9px;border-radius:9px;max-width:300px}
      .tb-traffic-table{min-width:1130px}.tb-traffic-table td{max-width:240px;overflow-wrap:anywhere}
      .tb-traffic-small{font-size:11px;color:#aabbd4;margin:9px 0}
      .tb-traffic-legacy{margin-top:14px;color:#aabbd4;font-size:11px}
      .tb-traffic-legacy summary{cursor:pointer;color:#c4d4ea}
    `;
    document.head.append(style);
    host.appendChild(section);
    for(const [id,field] of [["tbTrafficSource","source"],["tbTrafficCountry","country"],["tbTrafficActivity","activity"]]){
      el(id).addEventListener("change",event=>{state[field]=event.target.value;state.page=1;load();});
    }
    el("tbTrafficRefresh").addEventListener("click",load);
    el("tbTrafficPrev").addEventListener("click",()=>{if(state.page>1){state.page--;load();}});
    el("tbTrafficNext").addEventListener("click",()=>{state.page++;load();});
    const parent=el("tbVisitorPanel");
    let wasActive=parent.classList.contains("active");
    const observer=new MutationObserver(()=>{
      const active=parent.classList.contains("active");
      if(active&&!wasActive)load();
      wasActive=active;
    });
    observer.observe(parent,{attributes:true,attributeFilter:["class"]});
    if(wasActive)load();
    setInterval(()=>{if(parent.classList.contains("active"))load();},30000);
    return true;
  }
  async function load(){
    const auth=token(),serial=++state.serial;
    if(!auth){el("tbTrafficStatus").textContent="Đăng nhập Admin để xem nguồn truy cập.";return;}
    const params=new URLSearchParams({source:state.source,country:state.country,activity:state.activity,page:String(state.page),limit:"30"});
    el("tbTrafficStatus").textContent="Đang cập nhật nguồn truy cập…";
    try{
      const response=await fetch("/api/v72/admin/traffic-sources?"+params,{headers:{Authorization:"Bearer "+auth},cache:"no-store"});
      const data=await response.json().catch(()=>({}));
      if(serial!==state.serial)return;
      if(!response.ok||!data.ok)throw Error(data.message||"API không trả dữ liệu nguồn truy cập.");
      if(!data.ready){
        el("tbTrafficStatus").textContent=data.message||"Chưa có dữ liệu nguồn.";
        el("tbTrafficRows").innerHTML='<tr><td colspan="8">Chưa có dữ liệu UTM/referrer theo lượt ghé.</td></tr>';
        return;
      }
      el("tbTrafficStatus").textContent="Cập nhật "+when(data.generated_at)+". Nguồn bắt đầu được ghi theo cơ chế mới kể từ khi phát hành.";
      const sources=data.sources||[];
      el("tbTrafficSourcesList").innerHTML=sources.length?sources.map(x=>`<div class="tb-traffic-source"><strong>${escape(x.source_label||x.source_key)}</strong><small>${escape(x.source_channel)} · ${escape(x.source_evidence==="utm"?"UTM tự khai báo":x.source_evidence==="referrer"?"Referrer":"Không rõ bằng chứng")}</small><b>${fmt(x.visits)} lượt ghé</b><small>${fmt(x.visitors)} mã khách</small></div>`).join(""):'<span class="tb-traffic-small">Chưa ghi nhận lượt ghé mới.</span>';
      const sourceBox=el("tbTrafficSource"),sourceValue=state.source;
      const opts=new Map(sources.map(x=>[x.source_key,x.source_label||x.source_key]));
      sourceBox.innerHTML='<option value="all">Tất cả nguồn</option>'+[...opts].map(([key,value])=>`<option value="${escape(key)}">${escape(value)}</option>`).join("");
      sourceBox.value=sourceValue;
      const countryBox=el("tbTrafficCountry"),countryValue=state.country;
      const countries=[...new Set((data.visits||[]).map(v=>v.country).filter(Boolean))];
      // Keep current country selection even when absent from this page.
      if(countryValue!=="ALL"&&!countries.includes(countryValue))countries.push(countryValue);
      countryBox.innerHTML='<option value="ALL">Tất cả quốc gia</option>'+countries.map(code=>`<option value="${escape(code)}">${escape(region(code))}</option>`).join("");
      countryBox.value=countryValue;
      const evidence=x=>x==="utm"?"UTM tự khai báo":x==="referrer"?"Referrer":"Không rõ";
      el("tbTrafficRows").innerHTML=(data.visits||[]).map(v=>`<tr>
        <td><code>#${escape(String(v.visitor_id||"").slice(0,10).toUpperCase())}</code></td>
        <td><strong>${escape(v.source_label||"Không rõ nguồn")}</strong><div class="tb-traffic-small">${escape(v.source_channel)} · ${escape(evidence(v.source_evidence))}</div></td>
        <td>${escape(region(v.country))}</td>
        <td><code>${escape(v.entry_path||"/")}</code></td>
        <td>${escape(v.referrer||"Không có / không được gửi")}</td>
        <td>${escape([v.utm_source,v.utm_medium,v.utm_campaign].filter(Boolean).join(" / ")||"—")}</td>
        <td>${fmt(v.visitor_page_views)}${Number(v.visitor_page_views)===1?' · Cần kiểm tra':""}</td>
        <td>${escape(when(v.first_seen_at))}</td>
      </tr>`).join("")||'<tr><td colspan="8">Không có lượt ghé khớp bộ lọc.</td></tr>';
      el("tbTrafficCount").textContent=`Khớp bộ lọc: ${fmt(data.total)} lượt ghé · ${fmt(data.legacy_visit_count)} lượt ghé V2 cũ chưa có bằng chứng nguồn.`;
      el("tbTrafficPage").textContent="Trang "+data.page;
      el("tbTrafficPrev").disabled=data.page===1;
      el("tbTrafficNext").disabled=!data.has_more;
      el("tbTrafficLegacy").innerHTML=(data.legacy_referrers||[]).length
        ?(data.legacy_referrers||[]).map(x=>`<div>${escape(x.referrer)} · ${fmt(x.visitors)} mã khách từng có referrer này</div>`).join("")
        :"Không có referrer lịch sử nào được lưu.";
      el("tbTrafficStatus").classList.remove("error");
    }catch(error){
      if(serial!==state.serial)return;
      el("tbTrafficStatus").classList.add("error");
      el("tbTrafficStatus").textContent=String(error.message||error)+" (không tự hiển thị số 0 giả)";
    }
  }
  const timer=setInterval(()=>{if(build())clearInterval(timer);},350);
})();
