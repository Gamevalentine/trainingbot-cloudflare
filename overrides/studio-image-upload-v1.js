/* TrainingBot Studio: direct image replacement, loaded after Studio V2 is ready. */
(() => {
  "use strict";

  const TOKEN_KEYS = [
    "tb-admin-center-token-v2",
    "tb-admin-center-token-v1",
    "tb-cloud-admin-token-v40",
    "tb-cloud-admin-token-v39"
  ];
  const API = "/api/v71/admin/image-replace";

  const $ = id => document.getElementById(id);

  function token() {
    return TOKEN_KEYS.map(key => sessionStorage.getItem(key)).find(Boolean) || "";
  }

  function targetPath(raw) {
    const value = String(raw || "").trim();
    if (!value) return "";
    try {
      const url = new URL(value, location.origin);
      if (url.origin !== location.origin) return "";
      return url.pathname;
    } catch {
      return value.startsWith("/") ? value.split(/[?#]/)[0] : "";
    }
  }

  function isImageSelected() {
    return /^img(?:#|\.|\s|$)/i.test(String($("elementTitle")?.textContent || "").trim());
  }

  function setStatus(message, type = "") {
    const node = $("tbStudioImageStatus");
    if (!node) return;
    node.textContent = message || "";
    node.style.color = type === "error" ? "#fb7185" : type === "ok" ? "#86efac" : "#8fa0bc";
  }

  function syncVisibility() {
    const row = $("tbStudioImageUploadRow");
    if (!row) return;
    row.hidden = !isImageSelected();
    if (!row.hidden) setStatus("Chọn ảnh từ máy để thay trực tiếp ảnh đang chọn.");
  }

  function inject() {
    const section = $("urlSection");
    const urlInput = $("urlValue");
    if (!section || !urlInput) return false;
    if ($("tbStudioImageUploadRow")) {
      syncVisibility();
      return true;
    }

    const row = document.createElement("div");
    row.id = "tbStudioImageUploadRow";
    row.hidden = true;
    row.style.marginTop = "10px";
    row.innerHTML = `
      <input id="tbStudioImageFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif" hidden>
      <button id="tbStudioImagePick" type="button" class="primary" style="width:100%;margin-bottom:7px">🖼 Chọn ảnh từ máy</button>
      <div id="tbStudioImageStatus" style="font-size:10px;line-height:1.45;color:#8fa0bc"></div>
    `;

    const saveButton = $("saveUrl");
    if (saveButton) saveButton.after(row);
    else section.appendChild(row);

    $("tbStudioImagePick").addEventListener("click", () => {
      const path = targetPath(urlInput.value);
      if (!path || !/\.(?:png|jpe?g|webp|gif|svg|avif)$/i.test(path)) {
        setStatus("Đường dẫn ảnh hiện tại không hợp lệ.", "error");
        return;
      }
      const fileInput = $("tbStudioImageFile");
      fileInput.value = "";
      fileInput.click();
    });

    $("tbStudioImageFile").addEventListener("change", async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!String(file.type || "").startsWith("image/")) {
        setStatus("File được chọn không phải ảnh.", "error");
        return;
      }

      const path = targetPath(urlInput.value);
      if (!path) {
        setStatus("Không xác định được ảnh cần thay.", "error");
        return;
      }

      const auth = token();
      if (!auth) {
        setStatus("Phiên Admin chưa có token. Hãy đăng nhập lại Studio.", "error");
        return;
      }

      const form = new FormData();
      form.append("target", path);
      form.append("file", file);
      setStatus(`Đang tải ${file.name}…`);
      const button = $("tbStudioImagePick");
      button.disabled = true;

      try {
        const response = await fetch(API, {
          method: "POST",
          headers: {Authorization: `Bearer ${auth}`},
          body: form,
          cache: "no-store"
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.ok === false) {
          throw new Error(data.message || `Thay ảnh thất bại (${response.status}).`);
        }
        setStatus(`✓ Đã thay ảnh bằng ${file.name}`, "ok");
        const frame = $("previewFrame");
        if (frame?.contentWindow) {
          setTimeout(() => frame.contentWindow.location.reload(), 250);
        }
      } catch (error) {
        setStatus(error.message || "Không thay được ảnh.", "error");
      } finally {
        button.disabled = false;
      }
    });

    const title = $("elementTitle");
    if (title) new MutationObserver(syncVisibility).observe(title, {childList:true,subtree:true,characterData:true});
    new MutationObserver(syncVisibility).observe(section, {attributes:true,attributeFilter:["class"]});
    syncVisibility();
    return true;
  }

  let tries = 0;
  function boot() {
    if (inject()) return;
    if (++tries < 120) setTimeout(boot, 100);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
