/* TrainingBot Flash download statistics v194 — public counters, no visitor identifiers. */
(() => {
  "use strict";
  const nodes = [...document.querySelectorAll("[data-flash-download-version]")];
  if (!nodes.length) return;
  const number = new Intl.NumberFormat("vi-VN");
  async function load() {
    try {
      const response = await fetch("/api/flash-download-counts", {cache: "no-store"});
      const data = await response.json();
      if (!response.ok || data.ok !== true || !data.counts) throw new Error("Unavailable");
      nodes.forEach(node => {
        const value = data.counts[node.dataset.flashDownloadVersion];
        node.textContent = Number.isSafeInteger(value) && value >= 0
          ? number.format(value) + " lượt tải"
          : "Chưa có số liệu";
      });
    } catch (error) {
      nodes.forEach(node => {node.textContent = "Chưa có số liệu";});
    }
  }
  window.addEventListener("pageshow", load);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") load();
  });
})();
