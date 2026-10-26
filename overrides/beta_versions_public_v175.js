/* TrainingBot public beta versions - managed from Admin */
(()=>{
  "use strict";
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const nums=value=>{
    const m=String(value||"").toUpperCase().match(/^V(\d+)\.(\d+)(?:\.(\d+))?$/);
    return m?[Number(m[1]),Number(m[2]),Number(m[3]||0)]:[0,0,0];
  };
  const cmp=(a,b)=>{
    const A=nums(a),B=nums(b);
    return A[0]-B[0]||A[1]-B[1]||A[2]-B[2];
  };
  const downloadsText = row => row.status === "released" && row.download_url
    ? `<span class="beta-download-count" data-beta-count-version="${esc(row.version)}" title="Lượt bắt đầu tải từ khi bật thống kê; không phải số người duy nhất">Đang tải số liệu…</span>`
    : '<span class="beta-download-count beta-download-unavailable">Chưa mở tải</span>';

  const displayCounts = async () => {
    const els = [...document.querySelectorAll("[data-beta-count-version]")];
    if (!els.length) return;
    try {
      const response = await fetch("/api/beta-download-counts", {cache:"no-store"});
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok || !data.counts) throw new Error("Counts unavailable");
      const nf = new Intl.NumberFormat("vi-VN");
      els.forEach(el => {
        const count = data.counts[el.dataset.betaCountVersion] ?? 0;
        el.textContent = Number.isSafeInteger(count) && count >= 0
          ? nf.format(count) + " lượt tải"
          : "Chưa có số liệu";
      });
    } catch {
      els.forEach(el => {el.textContent = "Chưa có số liệu";});
    }
  };

  const card=row=>{
    const released=row.status==="released"&&row.download_url;
    const proxyUrl=`/download/beta/${encodeURIComponent(row.version)}`;
    const action=released
      ? `<a class="beta-build-btn primary" href="${proxyUrl}" download="PUBG_MOBILE_BETA_${esc(row.version)}_${esc(row.arch||"x64")}.apk">Tải ngay đây</a>`
      : '<span class="beta-build-btn primary coming-soon" aria-disabled="true" title="Phiên bản này chưa phát hành">Sắp ra mắt</span>';
    const article=document.createElement("article");
    article.className="beta-build-card";
    article.innerHTML=`<div class="beta-build-art"><img src="/pubg-game-avatar.webp?v=140" alt="PUBG Mobile ${esc(row.version)}" loading="lazy"></div><div class="beta-build-body"><div class="beta-build-title">PUBG MOBILE BETA</div><div class="beta-build-version-row"><span class="beta-build-version">${esc(row.version)}</span><span class="beta-build-arch">${esc(row.arch||"x64")}</span></div><div class="beta-build-actions">${action}${downloadsText(row)}</div></div>`;
    return article;
  };
  async function load(){
    const list=document.querySelector(".beta-version-list");
    const details=document.querySelector(".beta-versions");
    if(!list||!details)return;
    try{
      const response=await fetch("/api/beta-versions",{cache:"no-store"});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok||!Array.isArray(data.versions)||!data.versions.length){await displayCounts();return;}

      const staticMajors=[...list.querySelectorAll(".beta-version-item")].map(el=>el.textContent.trim()).filter(Boolean);
      const grouped=new Map();
      data.versions.forEach(row=>{
        if(!row?.major)return;
        if(!grouped.has(row.major))grouped.set(row.major,[]);
        grouped.get(row.major).push(row);
      });
      grouped.forEach(rows=>rows.sort((a,b)=>cmp(a.version,b.version)));

      const majors=[...new Set([...staticMajors,...grouped.keys()])].sort(cmp);
      list.replaceChildren();
      majors.forEach(major=>{
        const hasRows=grouped.has(major);
        const el=document.createElement(hasRows?"button":"span");
        el.className="beta-version-item";
        el.textContent=major;
        if(hasRows){
          el.type="button";
          el.dataset.betaMajor=major.replace(/^V/i,"");
        }
        list.appendChild(el);
      });

      document.querySelectorAll(".beta-build-group").forEach(node=>node.remove());
      const frag=document.createDocumentFragment();
      [...grouped.keys()].sort(cmp).forEach(major=>{
        const group=document.createElement("div");
        group.className="beta-build-grid beta-build-group";
        group.dataset.betaMajor=major.replace(/^V/i,"");
        group.hidden=true;
        grouped.get(major).forEach(row=>group.appendChild(card(row)));
        frag.appendChild(group);
      });
      details.after(frag);

      const buttons=[...list.querySelectorAll("button[data-beta-major]")];
      const groups=[...document.querySelectorAll(".beta-build-group[data-beta-major]")];
      const show=major=>{
        groups.forEach(group=>{group.hidden=group.dataset.betaMajor!==major});
        buttons.forEach(button=>button.classList.toggle("is-active",button.dataset.betaMajor===major));
      };
      buttons.forEach(button=>button.addEventListener("click",()=>show(button.dataset.betaMajor)));

      const ordered=[...data.versions].sort((a,b)=>cmp(a.version,b.version));
      // The hero must point to the newest actually downloadable release.
      // Future versions remain visible as "Sắp ra mắt" in the version grid.
      const latest=ordered.filter(row=>row.status==="released"&&row.download_url).at(-1)||ordered.at(-1);
      const highestMajor=[...grouped.keys()].sort(cmp).at(-1);
      if(highestMajor)show(highestMajor.replace(/^V/i,""));

      if(latest){
        const hero=document.querySelector(".release-hero");
        const title=hero?.querySelector(".version-row h1");
        const arch=hero?.querySelector(".version-row .arch");
        const primary=hero?.querySelector(".hero-actions .btn.primary");
        const image=hero?.querySelector(".game-avatar");
        const counter=hero?.querySelector(".hero-actions .beta-download-count");
        if(counter){
          if(latest.status==="released"&&latest.download_url){
            counter.dataset.betaCountVersion=latest.version;
            counter.classList.remove("beta-download-unavailable");
            counter.textContent="Đang tải số liệu…";
          }else{
            delete counter.dataset.betaCountVersion;
            counter.classList.add("beta-download-unavailable");
            counter.textContent="Chưa mở tải";
          }
        }
        if(title)title.textContent=latest.version;
        if(arch)arch.textContent=latest.arch||"x64";
        if(image)image.alt=`PUBG Mobile ${latest.version}`;
        if(primary){
          if(latest.status==="released"&&latest.download_url){
            primary.textContent="Tải ngay đây";
            primary.href=`/download/beta/${encodeURIComponent(latest.version)}`;
            primary.setAttribute("download",`PUBG_MOBILE_BETA_${latest.version}_${latest.arch||"x64"}.apk`);
            primary.removeAttribute("aria-disabled");
          }else{
            primary.textContent="Sắp ra mắt";
            primary.removeAttribute("href");
            primary.removeAttribute("download");
            primary.setAttribute("aria-disabled","true");
          }
        }
      }
      await displayCounts();
    }catch(error){
      console.warn("beta versions",error);
      await displayCounts();
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load,{once:true});else load();
  window.addEventListener("pageshow",event=>{if(event.persisted)displayCounts();});
})();
