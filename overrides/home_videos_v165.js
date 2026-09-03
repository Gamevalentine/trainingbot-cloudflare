/* TrainingBot homepage video shelf v165 */
(() => {
  "use strict";

  const FALLBACK = [
    {
      external_id: "7681293376775277832",
      url: "https://www.tiktok.com/@trainingbot.ai2/video/7681293376775277832?is_from_webapp=1&sender_device=pc",
      created_at: "2026-09-03T13:08:20Z"
    },
    {
      external_id: "7677790316665031957",
      url: "https://www.tiktok.com/player/v1/7677790316665031957",
      created_at: "2026-09-01T00:00:00Z"
    }
  ];

  const host = document.querySelector(".hero-tiktok");
  if (!host) return;

  const playerUrl = (id, compact = false) =>
    `https://www.tiktok.com/player/v1/${encodeURIComponent(id)}?controls=${compact ? 0 : 1}&description=${compact ? 0 : 1}&music_info=0&rel=0&autoplay=0`;

  function normalize(items) {
    const seen = new Set();
    return (Array.isArray(items) ? items : [])
      .map(item => ({
        external_id: String(item?.external_id || "").trim(),
        url: String(item?.url || "").trim(),
        created_at: String(item?.created_at || "")
      }))
      .filter(item => /^\d{10,25}$/.test(item.external_id) && !seen.has(item.external_id) && seen.add(item.external_id));
  }

  function mainFrame(video) {
    const iframe = document.createElement("iframe");
    iframe.className = "tb-home-video-main-frame";
    iframe.src = playerUrl(video.external_id, false);
    iframe.title = "Video TikTok nổi bật của TrainingBot";
    iframe.loading = "eager";
    iframe.allow = "fullscreen; autoplay; encrypted-media; picture-in-picture";
    return iframe;
  }

  function miniCard(video, index, select) {
    const card = document.createElement("article");
    card.className = "tb-home-video-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Xem video cũ ${index + 1}`);

    const iframe = document.createElement("iframe");
    iframe.src = playerUrl(video.external_id, true);
    iframe.title = "";
    iframe.tabIndex = -1;
    iframe.loading = "lazy";
    iframe.setAttribute("aria-hidden", "true");

    const play = document.createElement("span");
    play.className = "tb-home-video-play";
    play.setAttribute("aria-hidden", "true");
    play.textContent = "▶";

    const choose = () => select(video.external_id);
    card.addEventListener("click", choose);
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose();
      }
    });

    card.append(iframe, play);
    return card;
  }

  function render(items) {
    const videos = normalize(items);
    if (!videos.length) return;

    let activeId = videos[0].external_id;
    const root = document.createElement("div");
    root.className = "tb-home-videos";
    const main = document.createElement("div");
    main.className = "tb-home-video-main";
    const strip = document.createElement("div");
    strip.className = "tb-home-video-strip";
    strip.setAttribute("aria-label", "Các video trước của TrainingBot");
    root.append(main, strip);
    host.replaceChildren(root);

    const paint = () => {
      const active = videos.find(video => video.external_id === activeId) || videos[0];
      main.replaceChildren(mainFrame(active));
      strip.replaceChildren();
      const older = videos.filter(video => video.external_id !== active.external_id);
      strip.hidden = older.length === 0;
      older.forEach((video, index) => strip.appendChild(miniCard(video, index, id => {
        activeId = id;
        paint();
      })));
    };

    paint();
  }

  async function load() {
    try {
      const response = await fetch("/api/home-videos", {cache: "no-store"});
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error("home videos unavailable");
      render(data.videos);
    } catch {
      render(FALLBACK);
    }
  }

  load();
})();
