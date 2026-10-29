/* TRAFFIC-05: read-only Admin acceptance and D1 quality overview.
 * No database mutations, bot verdicts, or production synthetic visits.
 */
(()=>{
  "use strict";
  const el=id=>document.getElementById(id);
  const keys=["tb-admin-center-token-v2","tb-admin-center-token-v1","tb-cloud-admin-token-v40","tb-cloud-admin-token-v39"];
  const auth=()=>{try{return keys.map(key=>sessionStorage.getItem(key)).find(Boolean)||"";}catch{return "";}};
  const fmt=value=>Number(value||0).toLocaleString("vi-VN");
  const safe=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const dt=value=>{
    if(!value)return "Chưa có dữ liệu";
    const date=new Date(value);
    return Number.isNaN(date.valueOf())?"Không rõ thời gian":new Intl.DateTimeFormat("vi-VN",{timeZone:"Asia/Ho_Chi_Minh",dateStyle:"short",timeStyle:"medium"}).format(date);
  };
  let serial=0;
  function setup(){
    if(el("tbTrafficQuality"))return true;
    const parent=el("tbTrafficAnomalies"),container=el("tbVisitorInsights");
    if(!parent||!container)return false;
    const section=document.createElement("section");
    section.id="tbTrafficQuality";
    section.className="tb-audience-panel tb-quality-panel";
    section.innerHTML=`
      <div class="tb-audience-head"><div><h3>📋 Chất lượng truy cập & tình trạng dữ liệu D1</h3>
        <small>Kiểm chứng API Admin và đối chiếu 24 giờ hiện tại với 24 giờ trước · Chỉ đọc</small></div>
        <button id="tbQualityRefresh" type="button">↻ Kiểm tra</button></div>
      <p class="tb-quality-note">Các con số dưới đây là lượt ghé ẩn danh, không phải số người. “Chưa xác minh” không đồng nghĩa bot. Kết quả Cloudflare Security (HTTP requests) không được cộng vào số lượt ghé D1.</p>
      <div id="tbQualityStatus" role="status" aria-live="polite">Chưa kiểm tra phiên Admin.</div>
      <div class="tb-quality-cards">
        <div><small>LƯỢT GHÉ 24 GIỜ</small><strong id="tbQualityToday">—</strong></div>
        <div><small>24 GIỜ TRƯỚC</small><strong id="tbQualityYesterday">—</strong></div>
        <div><small>MÃ KHÁCH ẨN DANH 24 GIỜ</small><strong id="tbQualityIds">—</strong></div>
        <div><small>CHƯA XÁC MINH 24 GIỜ</small><strong id="tbQualityUnknown">—</strong></div>
      </div>
      <div id="tbQualityDetails" class="tb-quality-note">Các nhóm đã xác minh chỉ được tính khi có nhãn điều tra cụ thể.</div>
      <div class="tb-quality-checks" id="tbQualityChecks"></div>
      <p class="tb-quality-note">Thời gian đọc D1 chỉ đo lệnh API hiện tại, không phản ánh tốc độ tải trang của độc giả. Các trạng thái phía dưới chỉ xác nhận API đọc được, không thay thế nghiệm thu thao tác của Admin trên từng dữ liệu thực.</p>`;
    const style=document.createElement("style");
    style.textContent=`
      .tb-quality-panel{margin-top:14px}
      .tb-quality-panel #tbQualityRefresh{padding:9px 12px;border:1px solid #344764;border-radius:9px;background:#15233a;color:#e1ebf8;cursor:pointer}
      .tb-quality-note{color:#94a3b8;font-size:11px!important;line-height:1.7;margin:9px 0}
      #tbQualityStatus{font-size:11px;color:#bfd4e8;margin:10px 0}
      .tb-quality-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
      .tb-quality-cards>div{border:1px solid #2b405e;background:#101d32;border-radius:11px;padding:12px}
      .tb-quality-cards small{display:block;color:#a8bad2;font-size:10px}
      .tb-quality-cards strong{display:block;color:#e4f1fc;font-size:21px;margin-top:6px;font-variant-numeric:tabular-nums}
      .tb-quality-checks{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
      .tb-quality-check{padding:8px 11px;font-size:11px;border:1px solid #31455d;border-radius:8px;color:#d8e6f3}
      .tb-quality-check.ok{color:#86efac;border-color:#246c52}
      .tb-quality-check.fail{color:#ffc9c9;border-color:#925b59}
      @media(max-width:790px){.tb-quality-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;
    document.head.append(style);
    parent.insertAdjacentElement("afterend",section);
    el("tbQualityRefresh").addEventListener("click",load);
    const panel=el("tbVisitorPanel");
    let wasActive=panel.classList.contains("active");
    const observer=new MutationObserver(()=>{
      const active=panel.classList.contains("active");
      if(active&&!wasActive)load();
      wasActive=active;
    });
    observer.observe(panel,{attributes:true,attributeFilter:["class"]});
    if(wasActive)load();
    return true;
  }
  async function load(){
    const n=++serial,token=auth(),status=el("tbQualityStatus");
    if(!token){status.textContent="Chưa có phiên Admin hợp lệ. Đăng nhập để kiểm tra.";return;}
    status.textContent="Đang xác minh các API Admin (chỉ đọc)…";
    const targets=[
      {name:"D1 & báo cáo chất lượng",url:"/api/v72/admin/traffic-health",required:d=>d.ok&&d.ready&&d.db_query_success},
      {name:"Nguồn và V2 lịch sử",url:"/api/v72/admin/traffic-sources?page=1&limit=10",required:d=>d.ok&&d.ready&&Array.isArray(d.visits)&&Array.isArray(d.legacy_review_candidates)},
      {name:"Nhóm 5 phút",url:"/api/v72/admin/traffic-anomalies?days=1",required:d=>d.ok&&d.ready&&Array.isArray(d.groups)&&!!d.review_summary},
      {name:"Nhãn có chứng cứ",url:"/api/v72/admin/traffic-visit-review",required:d=>d.ok&&Array.isArray(d.reviews)}
    ];
    const results=await Promise.all(targets.map(async t=>{
      const started=Date.now();
      try{
        const response=await fetch(t.url,{headers:{Authorization:"Bearer "+token},cache:"no-store",credentials:"same-origin"});
        const data=await response.json().catch(()=>({}));
        return {name:t.name,good:response.ok&&t.required(data),status:response.status,
          elapsed:Date.now()-started,data};
      }catch(error){return {name:t.name,good:false,status:0,elapsed:Date.now()-started,error:String(error.message||error)};}
    }));
    if(n!==serial)return;
    const health=results[0],d=health.good?health.data:null;
    const fields=[["tbQualityToday",d?.counters?.visits_24h],
      ["tbQualityYesterday",d?.counters?.visits_previous_24h],
      ["tbQualityIds",d?.counters?.anonymous_ids_24h],
      ["tbQualityUnknown",d?.counters?.unresolved_24h]];
    for(const [key,value] of fields)el(key).textContent=value===undefined?"—":fmt(value);
    el("tbQualityDetails").textContent=d
      ?`Trong 24 giờ: ${fmt(d.counters.verified_test_24h)} lượt kiểm thử đã đối chiếu · ${fmt(d.counters.verified_automated_24h)} lượt tự động đã đối chiếu · ${fmt(d.counters.cleared_24h)} lượt bỏ nghi vấn. D1 phản hồi ${fmt(d.query_duration_ms)} ms. Lần có hoạt động gần nhất: ${dt(d.last_seen_at)}.`
      :"Không có kết quả D1 đáng tin cậy; không sử dụng số 0 giả.";
    el("tbQualityChecks").innerHTML=results.map(x=>`<span class="tb-quality-check ${x.good?"ok":"fail"}">${x.good?"✓":"!"} ${safe(x.name)} · ${x.good?"Đọc được":"Không xác nhận"} · HTTP ${fmt(x.status)} · ${fmt(x.elapsed)} ms</span>`).join("");
    const pass=results.filter(x=>x.good).length;
    status.textContent=`Kiểm tra ${pass}/${targets.length} API đọc dữ liệu Admin · ${dt(new Date().toISOString())}. ${pass===targets.length?"Các API đọc được; cần kiểm tra nội dung thực tế trước khi kết luận hoàn toàn PASS.":"Có API chưa đạt; không đánh dấu nghiệm thu PASS."}`;
  }
  const timer=setInterval(()=>{if(setup())clearInterval(timer);},350);
})();
