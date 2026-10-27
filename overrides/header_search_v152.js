(() => {
  "use strict";

  const SEARCH_SELECTOR = '.header-actions button[aria-label="Tìm kiếm"], .header-actions .icon-button[aria-label*="Tìm"]';
  let searchIndexPromise = null;
  let previousFocus = null;
  let renderVersion = 0;
  let overlay = null;
  let input = null;
  let results = null;
  let status = null;

  const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();

  const escapeHtml = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  // Search entries must be first-party routes. Reject external/javascript/data links,
  // including protocol-relative URLs, from both the static index and D1 posts.
  function safeRoute(value) {
    const raw=String(value||"").trim();
    if (!raw.startsWith("/") || raw.startsWith("//") || /[\\\u0000-\u001f]/.test(raw) || raw.length>512) return "";
    try {
      const parsed=new URL(raw,location.origin);
      if(parsed.origin!==location.origin) return "";
      return parsed.pathname+parsed.search+parsed.hash;
    } catch { return ""; }
  }
  function ensureModal() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "tb-search-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <section class="tb-search-panel" role="dialog" aria-modal="true" aria-label="Tìm kiếm TrainingBot">
        <div class="tb-search-head">
          <div>
            <span class="tb-search-kicker">TRAININGBOT</span>
            <h2>Tìm kiếm</h2>
          </div>
          <button class="tb-search-close" type="button" aria-label="Đóng tìm kiếm">×</button>
        </div>
        <label class="tb-search-box">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3-3"></path></svg>
          <input type="search" autocomplete="off" spellcheck="false" placeholder="Tìm tin tức, bản cập nhật, Wiki..." aria-label="Nhập nội dung cần tìm">
          <kbd>ESC</kbd>
        </label>
        <p class="tb-search-status" role="status" aria-live="polite">Nhập ít nhất 2 ký tự để tìm trên TrainingBot.</p>
        <div class="tb-search-results" aria-live="polite"></div>
      </section>`;
    document.body.appendChild(overlay);
    input = overlay.querySelector("input");
    results = overlay.querySelector(".tb-search-results");
    status = overlay.querySelector(".tb-search-status");

    overlay.querySelector(".tb-search-close").addEventListener("click", closeSearch);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeSearch();
    });
    input.addEventListener("input", () => render(input.value));
  }

  function loadIndex() {
    if (!searchIndexPromise) {
      const staticIndex = fetch("/search-index-v152.json", { cache: "default" })
        .then(response => {if(!response.ok)throw Error("Static index unavailable");return response.json();})
        .then(data => {if(!Array.isArray(data))throw Error("Invalid index");return data;});
      const adminPosts = fetch("/api/posts?limit=100&search=1", { cache: "no-store" })
        .then(response => {if(!response.ok)throw Error("Posts unavailable");return response.json();})
        .then(data => {
          if(!data.ok || !Array.isArray(data.posts))throw Error("Invalid posts");
          return data.posts.map(post=>({
            title:post.title||"Bài viết TrainingBot",
            description:post.summary||"",
            text:[post.title,post.summary,post.category,post.content].filter(Boolean).join(" ").slice(0,12000),
            url:post.url||(post.slug?`/bai-viet/${post.slug}`:"/news"),
            type:post.category||"Tin tức"
          }));
        });
      searchIndexPromise=Promise.allSettled([staticIndex,adminPosts]).then(outcomes=>{
        if(outcomes.every(item=>item.status==="rejected"))throw Error("Both index sources unavailable");
        const merged=new Map();
        for(const outcome of outcomes){
          if(outcome.status!=="fulfilled")continue;
          for(const item of outcome.value){
            const route=safeRoute(item?.url);
            if(!route)continue;
            merged.set(route,{...item,url:route});
          }
        }
        return [...merged.values()];
      }).catch(error=>{
        searchIndexPromise=null; // Retry on next use; never cache failed requests as empty results.
        throw error;
      });
    }
    return searchIndexPromise;
  }

  function scoreItem(item, query) {
    const q = normalize(query);
    const title = normalize(item.title);
    const description = normalize(item.description);
    const text = normalize(item.text);
    if (!q) return 0;

    let score = 0;
    if (title === q) score += 160;
    if (title.startsWith(q)) score += 100;
    if (title.includes(q)) score += 70;
    if (description.includes(q)) score += 34;
    if (text.includes(q)) score += 22;

    for (const term of q.split(" ").filter((term) => term.length > 1)) {
      if (title.includes(term)) score += 20;
      if (description.includes(term)) score += 9;
      if (text.includes(term)) score += 4;
    }
    return score;
  }

  async function render(query) {
    ensureModal();
    const token=++renderVersion,q=String(query||"").trim();
    if(q.length<2){
      results.replaceChildren();
      status.textContent="Nhập ít nhất 2 ký tự để tìm trên TrainingBot.";
      return;
    }
    status.textContent="Đang tìm…";
    results.replaceChildren();
    try{
      const index=await loadIndex();
      if(token!==renderVersion || overlay.hidden)return;
      const matches=index.map(item=>({item,score:scoreItem(item,q)}))
        .filter(result=>result.score>0)
        .sort((a,b)=>b.score-a.score||String(a.item.title).localeCompare(String(b.item.title),"vi"))
        .slice(0,10);
      if(!matches.length){
        status.textContent=`Không tìm thấy kết quả cho “${q}”.`;
        results.innerHTML='<div class="tb-search-empty">Thử từ khóa ngắn hơn hoặc tìm theo tên bài viết, phiên bản, Wiki.</div>';
        return;
      }
      status.textContent=`${matches.length} kết quả phù hợp`;
      results.innerHTML=matches.map(({item})=>`
        <a class="tb-search-result" href="${escapeHtml(item.url)}">
          <span class="tb-search-result-type">${escapeHtml(item.type||"TrainingBot")}</span>
          <strong>${escapeHtml(item.title||"TrainingBot")}</strong>
          <p>${escapeHtml(item.description||"")}</p>
          <span class="tb-search-result-link">Mở nội dung →</span>
        </a>`).join("");
    }catch(error){
      if(token!==renderVersion || overlay.hidden)return;
      status.textContent="Không thể tải dữ liệu tìm kiếm. Hãy kiểm tra kết nối và thử lại.";
      results.innerHTML='<div class="tb-search-empty">Dữ liệu tìm kiếm tạm thời gián đoạn. <button type="button" class="tb-search-retry">Thử lại</button></div>';
      results.querySelector(".tb-search-retry")?.addEventListener("click",()=>{
        searchIndexPromise=null;render(input.value);
      });
    }
  }

  function openSearch() {
    ensureModal();
    if(overlay.hidden)previousFocus=document.activeElement;
    overlay.hidden=false;
    document.body.classList.add("tb-search-open");
    if(input.value.trim().length>=2)render(input.value);
    else{status.textContent="Nhập ít nhất 2 ký tự để tìm trên TrainingBot.";results.replaceChildren();}
    requestAnimationFrame(()=>input.focus());
  }

  function closeSearch() {
    if(!overlay || overlay.hidden)return;
    overlay.hidden=true;
    ++renderVersion;
    document.body.classList.remove("tb-search-open");
    if(previousFocus?.isConnected && typeof previousFocus.focus==="function")previousFocus.focus();
    previousFocus=null;
  }

  function addMobileContact(searchButton) {
    const actions = searchButton && searchButton.closest(".header-actions");
    if (!actions || actions.querySelector(".tb-mobile-contact-button")) return;

    const contact = document.createElement("a");
    contact.className = "tb-mobile-contact-button";
    contact.href = "/contact";
    contact.setAttribute("aria-label", "Liên hệ");
    contact.title = "Liên hệ";
    contact.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4z"></path><path d="m4 7 8 6 8-6"></path></svg>';
    searchButton.insertAdjacentElement("afterend", contact);
  }

  function init() {
    const buttons = [...document.querySelectorAll(SEARCH_SELECTOR)];
    buttons.forEach((button) => {
      if (button.dataset.tbSearchReady === "1") return;
      button.dataset.tbSearchReady = "1";
      button.removeAttribute("data-toast");
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        openSearch();
      }, true);
      addMobileContact(button);
    });

    document.addEventListener("keydown", (event) => {
      if(overlay && !overlay.hidden && event.key==="Tab"){
        const controls=[...overlay.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href]')];
        const first=controls[0],last=controls.at(-1);
        if(!first || !last)return;
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
      }
      if (event.key === "Escape" && overlay && !overlay.hidden) closeSearch();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
