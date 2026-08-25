(() => {
  "use strict";

  const SEARCH_SELECTOR = '.header-actions button[aria-label="Tìm kiếm"], .header-actions .icon-button[aria-label*="Tìm"]';
  let searchIndexPromise = null;
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
        <p class="tb-search-status">Nhập ít nhất 2 ký tự để tìm trên TrainingBot.</p>
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
      searchIndexPromise = fetch("/search-index-v152.json", { cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then((data) => Array.isArray(data) ? data : [])
        .catch(() => []);
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
    const q = String(query || "").trim();
    if (q.length < 2) {
      results.innerHTML = "";
      status.textContent = "Nhập ít nhất 2 ký tự để tìm trên TrainingBot.";
      return;
    }

    status.textContent = "Đang tìm…";
    const index = await loadIndex();
    const matches = index
      .map((item) => ({ item, score: scoreItem(item, q) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || String(a.item.title).localeCompare(String(b.item.title), "vi"))
      .slice(0, 10);

    if (!matches.length) {
      status.textContent = `Không tìm thấy kết quả cho “${q}”.`;
      results.innerHTML = '<div class="tb-search-empty">Thử từ khóa ngắn hơn hoặc tìm theo tên bài viết, phiên bản, Wiki.</div>';
      return;
    }

    status.textContent = `${matches.length} kết quả phù hợp`;
    results.innerHTML = matches.map(({ item }) => `
      <a class="tb-search-result" href="${escapeHtml(item.url)}">
        <span class="tb-search-result-type">${escapeHtml(item.type || "TrainingBot")}</span>
        <strong>${escapeHtml(item.title || "TrainingBot")}</strong>
        <p>${escapeHtml(item.description || "")}</p>
        <span class="tb-search-result-link">Mở nội dung →</span>
      </a>`).join("");
  }

  async function openSearch() {
    ensureModal();
    overlay.hidden = false;
    document.body.classList.add("tb-search-open");
    status.textContent = "Đang chuẩn bị tìm kiếm…";
    await loadIndex();
    status.textContent = input.value.trim().length >= 2
      ? status.textContent
      : "Nhập ít nhất 2 ký tự để tìm trên TrainingBot.";
    requestAnimationFrame(() => input.focus());
  }

  function closeSearch() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.classList.remove("tb-search-open");
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
