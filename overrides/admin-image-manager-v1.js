/* TB_ADMIN_IMAGE_MANAGER_V1 */
(() => {
  "use strict";

  const TOKEN_KEYS = ["tb-admin-center-token-v2","tb-admin-center-token-v1","tb-cloud-admin-token-v40","tb-cloud-admin-token-v39"];
  const API_REPLACE = "/api/v71/admin/image-replace";
  const API_RESTORE = "/api/v71/admin/image-restore";
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#039;"}[c]));

  let selectedTarget = "";

  function token() {
    return TOKEN_KEYS.map(k => sessionStorage.getItem(k)).find(Boolean) || "";
  }

  function normalizeTarget(raw) {
    const value = String(raw || "").trim();
    if (!value) return "";
    try {
      const u = new URL(value, location.origin);
      if (u.origin !== location.origin) return "";
      return u.pathname;
    } catch {
      return value.startsWith("/") ? value.split(/[?#]/)[0] : "";
    }
  }

  function setStatus(message, type = "") {
    const node = $("tbImgStatus");
    if (!node) return;
    node.textContent = message || "";
    node.className = `tb-img-status ${type}`;
  }

  async function api(url, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token()}`);
    if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
    const response = await fetch(url, {...options, headers, cache:"no-store"});
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.message || `Yêu cầu thất bại (${response.status}).`);
    return data;
  }

  function style() {
    if ($("tbImageManagerStyle")) return;
    const node = document.createElement("style");
    node.id = "tbImageManagerStyle";
    node.textContent = `
      .tb-img-modal{position:fixed;inset:0;z-index:100000;display:grid;place-items:center;padding:18px;background:rgba(2,5,14,.82);backdrop-filter:blur(14px)}
      .tb-img-modal.hidden{display:none}.tb-img-box{width:min(980px,100%);max-height:min(860px,92vh);overflow:auto;border:1px solid rgba(124,105,255,.3);border-radius:24px;background:#090f1f;box-shadow:0 30px 100px rgba(0,0,0,.55);padding:22px}
      .tb-img-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:18px}.tb-img-head h2{margin:4px 0 6px;font-size:28px}.tb-img-head p{margin:0;color:#91a0ba;font-size:12px}.tb-img-close{width:40px;height:40px;border:1px solid #28344e;border-radius:12px;background:#10182a;color:#fff;font-size:22px;cursor:pointer}
      .tb-img-tools{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;margin-bottom:12px}.tb-img-tools input{width:100%;min-height:44px;border:1px solid #28344e;border-radius:12px;background:#071022;color:#fff;padding:0 13px;outline:none}.tb-img-tools button,.tb-img-manual button,.tb-img-card button{min-height:42px;border:0;border-radius:12px;padding:0 16px;background:linear-gradient(135deg,#745cff,#2acbea);color:#fff;font-weight:800;cursor:pointer}
      .tb-img-manual{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:12px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.025)}.tb-img-manual input{min-height:42px;border:1px solid #28344e;border-radius:10px;background:#071022;color:#fff;padding:0 12px}
      .tb-img-status{min-height:20px;margin:10px 0;color:#91a0ba;font-size:11px}.tb-img-status.ok{color:#86efac}.tb-img-status.error{color:#fda4af}
      .tb-img-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;margin-top:14px}.tb-img-card{overflow:hidden;border:1px solid #202c43;border-radius:16px;background:#071022}.tb-img-preview{height:130px;background:#050912;display:grid;place-items:center;overflow:hidden}.tb-img-preview img{width:100%;height:100%;object-fit:cover}.tb-img-body{padding:11px}.tb-img-body b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px}.tb-img-body code{display:block;margin:7px 0 10px;color:#7f91ad;font-size:9px;word-break:break-all;white-space:normal}.tb-img-actions{display:grid;grid-template-columns:1fr auto;gap:7px}.tb-img-card button.restore{background:#111b2e;border:1px solid #2b3852;color:#b9c5d8}
      @media(max-width:700px){.tb-img-box{padding:15px;border-radius:18px}.tb-img-tools,.tb-img-manual{grid-template-columns:1fr}.tb-img-grid{grid-template-columns:1fr 1fr}.tb-img-head h2{font-size:22px}}
      @media(max-width:440px){.tb-img-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(node);
  }

  function modal() {
    if ($("tbImageManagerModal")) return;
    const wrap = document.createElement("div");
    wrap.id = "tbImageManagerModal";
    wrap.className = "tb-img-modal hidden";
    wrap.innerHTML = `
      <section class="tb-img-box" role="dialog" aria-modal="true" aria-labelledby="tbImgTitle">
        <div class="tb-img-head"><div><span class="eyebrow">ẢNH WEBSITE</span><h2 id="tbImgTitle">Sửa ảnh trực tiếp</h2><p>Quét một trang, chọn đúng ảnh và tải ảnh mới lên. URL trên website không đổi.</p></div><button class="tb-img-close" id="tbImgClose" type="button">×</button></div>
        <div class="tb-img-tools"><input id="tbImgPage" value="/news" placeholder="Trang cần quét, ví dụ /news"><button id="tbImgScan" type="button">Quét ảnh</button></div>
        <div class="tb-img-manual"><input id="tbImgManualPath" placeholder="Hoặc nhập đường dẫn ảnh, ví dụ /news-...-cover.svg"><button id="tbImgManualReplace" type="button">Chọn ảnh mới</button></div>
        <div id="tbImgStatus" class="tb-img-status"></div>
        <input id="tbImgFile" type="file" accept="image/*" hidden>
        <div id="tbImgGrid" class="tb-img-grid"></div>
      </section>`;
    document.body.appendChild(wrap);

    $("tbImgClose").addEventListener("click", close);
    wrap.addEventListener("click", e => { if (e.target === wrap) close(); });
    $("tbImgScan").addEventListener("click", scan);
    $("tbImgManualReplace").addEventListener("click", () => {
      const path = normalizeTarget($("tbImgManualPath").value);
      if (!path) return setStatus("Đường dẫn ảnh không hợp lệ.", "error");
      choose(path);
    });
    $("tbImgFile").addEventListener("change", e => replace(e.target.files?.[0]));
    $("tbImgGrid").addEventListener("click", e => {
      const button = e.target.closest("button[data-target]");
      if (!button) return;
      const path = decodeURIComponent(button.dataset.target || "");
      if (button.dataset.action === "restore") restore(path, button);
      else choose(path);
    });
  }

  function open() {
    style(); modal();
    $("tbImageManagerModal").classList.remove("hidden");
    scan();
  }
  function close() { $("tbImageManagerModal")?.classList.add("hidden"); }

  function choose(path) {
    selectedTarget = normalizeTarget(path);
    if (!selectedTarget) return setStatus("Không xác định được đường dẫn ảnh.", "error");
    const input = $("tbImgFile");
    input.value = "";
    input.click();
  }

  async function scan() {
    const page = String($("tbImgPage")?.value || "/news").trim() || "/news";
    setStatus("Đang quét ảnh trên trang…");
    const grid = $("tbImgGrid");
    grid.innerHTML = "";
    try {
      const response = await fetch(page, {cache:"no-store"});
      if (!response.ok) throw new Error(`Không mở được trang (${response.status}).`);
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const seen = new Set();
      const rows = [];
      for (const img of doc.querySelectorAll("img[src]")) {
        const src = normalizeTarget(img.getAttribute("src"));
        if (!src || seen.has(src)) continue;
        seen.add(src);
        rows.push({src, alt:(img.getAttribute("alt") || "Ảnh website").trim()});
      }
      if (!rows.length) {
        setStatus("Không tìm thấy thẻ ảnh trên trang này.", "error");
        return;
      }
      grid.innerHTML = rows.map(item => {
        const encoded = encodeURIComponent(item.src);
        return `<article class="tb-img-card"><div class="tb-img-preview"><img src="${esc(item.src)}?tbimg=${Date.now()}" alt=""></div><div class="tb-img-body"><b>${esc(item.alt || "Ảnh website")}</b><code>${esc(item.src)}</code><div class="tb-img-actions"><button type="button" data-target="${encoded}" data-action="replace">Thay ảnh</button><button type="button" class="restore" data-target="${encoded}" data-action="restore" title="Khôi phục ảnh trong source">↶</button></div></div></article>`;
      }).join("");
      setStatus(`Tìm thấy ${rows.length} ảnh. Chọn “Thay ảnh” ở đúng ảnh cần sửa.`, "ok");
    } catch (error) {
      setStatus(error.message || "Không quét được trang.", "error");
    }
  }

  async function replace(file) {
    if (!file || !selectedTarget) return;
    if (!String(file.type || "").startsWith("image/")) return setStatus("Bạn phải chọn file ảnh.", "error");
    const form = new FormData();
    form.append("target", selectedTarget);
    form.append("file", file);
    setStatus(`Đang thay ${selectedTarget}…`);
    try {
      await api(API_REPLACE, {method:"POST", body:form});
      setStatus(`✓ Đã thay ảnh: ${selectedTarget}`, "ok");
      await scan();
    } catch (error) {
      setStatus(error.message || "Không thay được ảnh.", "error");
    } finally {
      selectedTarget = "";
    }
  }

  async function restore(path, button) {
    if (!confirm(`Khôi phục ảnh gốc cho ${path}?`)) return;
    button.disabled = true;
    setStatus(`Đang khôi phục ${path}…`);
    try {
      await api(API_RESTORE, {method:"POST", body:JSON.stringify({target:path})});
      setStatus(`✓ Đã khôi phục ảnh gốc: ${path}`, "ok");
      await scan();
    } catch (error) {
      setStatus(error.message || "Không khôi phục được ảnh.", "error");
    } finally { button.disabled = false; }
  }

  function injectButton() {
    if ($("tbImageManagerOpen")) return true;
    const panel = document.querySelector('[data-view-panel="media"]');
    const title = panel?.querySelector(".section-title");
    if (!title) return false;
    const holder = title.querySelector(".button-row") || title;
    const button = document.createElement("button");
    button.id = "tbImageManagerOpen";
    button.type = "button";
    button.className = "btn primary";
    button.textContent = "🖼 Sửa ảnh website";
    button.addEventListener("click", open);
    const existing = title.querySelector("#addMediaUrl");
    if (existing) existing.before(button); else holder.appendChild(button);
    return true;
  }

  let tries = 0;
  function boot() {
    style(); modal();
    if (injectButton()) return;
    if (++tries < 80) setTimeout(boot, 150);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true}); else boot();
})();