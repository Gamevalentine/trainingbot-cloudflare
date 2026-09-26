(() => {
  const params = new URLSearchParams(location.search);
  if (params.get("adtest") !== "1") return;

  const STYLE_ID = "tb-ad-test-style";
  const AD_CLASS = "tb-ad-test-slot";
  const GRID_CLASS = "tb-ad-test-grid";
  const state = { rendered: false };

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = \`
      .${AD_CLASS}{
        box-sizing:border-box;
        width:min(1180px,calc(100% - 32px));
        min-height:112px;
        margin:28px auto;
        border:1px dashed rgba(129,145,190,.52);
        border-radius:16px;
        background:
          linear-gradient(135deg,rgba(99,102,241,.08),rgba(34,211,238,.05)),
          rgba(12,17,29,.72);
        display:flex;
        align-items:center;
        justify-content:center;
        position:relative;
        overflow:hidden;
        color:#dce5f6;
        text-align:center;
        padding:28px 18px 20px;
      }
      .${AD_CLASS}::before{
        content:"QUẢNG CÁO · BẢN TEST";
        position:absolute;
        top:10px;
        left:12px;
        padding:4px 7px;
        border:1px solid rgba(148,163,184,.24);
        border-radius:999px;
        color:#8fa0bd;
        background:rgba(8,12,21,.82);
        font:800 10px/1.1 Inter,system-ui,sans-serif;
        letter-spacing:.08em;
      }
      .${AD_CLASS} .tb-ad-test-copy{max-width:620px}
      .${AD_CLASS} .tb-ad-test-title{
        display:block;
        margin:0 0 6px;
        color:#f4f7ff;
        font:800 16px/1.25 Inter,system-ui,sans-serif;
      }
      .${AD_CLASS} .tb-ad-test-note{
        display:block;
        color:#8795af;
        font:600 12px/1.45 Inter,system-ui,sans-serif;
      }
      .${AD_CLASS}.${GRID_CLASS}{
        grid-column:1/-1!important;
        width:100%;
        max-width:none;
        margin:10px 0 18px;
      }
      #tb-ad-test-exit{
        position:fixed;
        right:16px;
        bottom:16px;
        z-index:99999;
        border:1px solid rgba(124,140,184,.35);
        border-radius:999px;
        background:rgba(10,14,24,.94);
        color:#f5f7ff;
        padding:10px 14px;
        font:800 12px/1 Inter,system-ui,sans-serif;
        box-shadow:0 12px 34px rgba(0,0,0,.38);
        cursor:pointer;
      }
      @media(max-width:640px){
        .${AD_CLASS}{
          width:calc(100% - 22px);
          min-height:100px;
          margin:20px auto;
          border-radius:13px;
          padding:26px 12px 16px;
        }
        .${AD_CLASS}.${GRID_CLASS}{width:100%;margin:8px 0 14px}
        .${AD_CLASS} .tb-ad-test-title{font-size:14px}
        .${AD_CLASS} .tb-ad-test-note{font-size:11px}
        #tb-ad-test-exit{right:10px;bottom:10px;padding:9px 12px;font-size:11px}
      }
    \`;
    document.head.appendChild(style);
  }

  function ad(label, grid = false) {
    const node = document.createElement("div");
    node.className = AD_CLASS + (grid ? " " + GRID_CLASS : "");
    node.dataset.adTest = label;
    node.innerHTML =
      '<span class="tb-ad-test-copy">' +
        '<strong class="tb-ad-test-title">Vị trí quảng cáo thử nghiệm</strong>' +
        '<span class="tb-ad-test-note">' + label + ' · Chưa kết nối mạng quảng cáo · Không phát sinh chi phí</span>' +
      '</span>';
    return node;
  }

  function has(label) {
    return !!document.querySelector('.' + AD_CLASS + '[data-ad-test="' + CSS.escape(label) + '"]');
  }

  function insertAfter(target, node) {
    if (!target || !target.parentNode) return false;
    target.parentNode.insertBefore(node, target.nextSibling);
    return true;
  }

  function homepage() {
    if (has("Trang chủ")) return;
    const anchor = document.querySelector(".stats-strip") || document.querySelector(".hero");
    if (anchor) insertAfter(anchor, ad("Trang chủ"));
  }

  function news() {
    const grid = document.querySelector(".tb-latest-grid-v157, .tb-latest-grid, [class*='tb-latest-grid']");
    if (!grid) return;
    const cards = [...grid.children].filter((el) => !el.classList.contains(AD_CLASS));
    if (cards.length >= 3 && !has("Tin tức · sau bài 3")) {
      insertAfter(cards[2], ad("Tin tức · sau bài 3", true));
    }
    if (cards.length >= 6 && !has("Tin tức · sau bài 6")) {
      insertAfter(cards[5], ad("Tin tức · sau bài 6", true));
    }
  }

  function wiki() {
    const grid = document.getElementById("wikiGrid");
    if (!grid || has("Wiki · sau mục 12")) return;
    const cards = [...grid.children].filter((el) => el.classList && el.classList.contains("wiki-card"));
    if (cards.length >= 12) insertAfter(cards[11], ad("Wiki · sau mục 12", true));
  }

  function updates() {
    if (has("Bản cập nhật")) return;
    const target = document.getElementById("versions");
    const main = target && target.parentNode;
    if (target && main) main.insertBefore(ad("Bản cập nhật · sau khu tải phiên bản"), target);
  }

  function article() {
    const path = location.pathname;
    if (!path.startsWith("/bai-viet/") && !document.querySelector(".tb-article")) return;
    const root = document.querySelector(".tb-article, article, main");
    if (!root) return;
    const paragraphs = [...root.querySelectorAll("p")].filter((p) => {
      const text = (p.textContent || "").trim();
      return text.length >= 70 && p.offsetParent !== null;
    });
    if (paragraphs.length >= 3 && !has("Bài viết · sau phần mở đầu")) {
      insertAfter(paragraphs[2], ad("Bài viết · sau phần mở đầu"));
    }
    if (paragraphs.length >= 8 && !has("Bài viết · giữa bài")) {
      const mid = paragraphs[Math.max(5, Math.floor(paragraphs.length / 2))];
      if (mid) insertAfter(mid, ad("Bài viết · giữa bài"));
    }
  }

  function render() {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    if (path === "/" || path === "/index" || path === "/index.html") homepage();
    if (path === "/news" || path === "/news.html") news();
    if (path === "/wiki" || path === "/wiki.html") wiki();
    if (path === "/ban-cap-nhat" || path === "/ban-cap-nhat.html" || path === "/updates" || path === "/updates.html") updates();
    article();
    state.rendered = true;
  }

  function keepTestModeOnInternalLinks() {
    document.addEventListener("click", (event) => {
      const a = event.target.closest && event.target.closest("a[href]");
      if (!a || a.hasAttribute("download")) return;
      const raw = a.getAttribute("href") || "";
      if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("javascript:")) return;
      let url;
      try { url = new URL(a.href, location.href); } catch (_) { return; }
      if (url.origin !== location.origin || url.pathname.startsWith("/download/")) return;
      url.searchParams.set("adtest", "1");
      a.href = url.toString();
    }, true);
  }

  function addExit() {
    if (document.getElementById("tb-ad-test-exit")) return;
    const btn = document.createElement("button");
    btn.id = "tb-ad-test-exit";
    btn.type = "button";
    btn.textContent = "Thoát chế độ test quảng cáo";
    btn.addEventListener("click", () => {
      const url = new URL(location.href);
      url.searchParams.delete("adtest");
      location.href = url.pathname + (url.search ? url.search : "") + url.hash;
    });
    document.body.appendChild(btn);
  }

  function watchDynamicAreas() {
    const targets = [
      document.querySelector(".tb-latest-grid-v157, .tb-latest-grid, [class*='tb-latest-grid']"),
      document.getElementById("wikiGrid")
    ].filter(Boolean);
    if (!targets.length) return;
    const observer = new MutationObserver(() => {
      window.clearTimeout(observer._timer);
      observer._timer = window.setTimeout(render, 80);
    });
    targets.forEach((target) => observer.observe(target, { childList: true }));
    window.setTimeout(() => observer.disconnect(), 12000);
  }

  function init() {
    addStyle();
    addExit();
    keepTestModeOnInternalLinks();
    render();
    watchDynamicAreas();
    window.setTimeout(render, 450);
    window.setTimeout(render, 1400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();