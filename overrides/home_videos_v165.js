/* TrainingBot homepage video shelf v191 — draggable horizontal video scroll thumb */
(() => {
  "use strict";

  const FALLBACK = [
    {
      external_id: "7681293376775277832",
      url: "https://www.tiktok.com/@trainingbot.ai2/video/7681293376775277832?is_from_webapp=1&sender_device=pc",
      title: "HỢP TÁC PUBG MOBILE x LINCOLN",
      created_at: "2026-09-03T13:08:20Z"
    },
    {
      external_id: "7680817497632820501",
      url: "https://www.tiktok.com/@trainingbot.ai2/video/7680817497632820501?is_from_webapp=1&sender_device=pc",
      title: "",
      created_at: "2026-09-03T13:00:00Z"
    },
    {
      external_id: "7677790316665031957",
      url: "https://www.tiktok.com/@trainingbot.ai2/video/7677790316665031957",
      title: "",
      created_at: "2026-09-01T00:00:00Z"
    }
  ];

  const host = document.querySelector(".hero-tiktok");
  const heroLayout = host?.closest(".hero-layout");
  if (!host || !heroLayout) return;

  const playerUrl = (id, compact = false) =>
    `https://www.tiktok.com/player/v1/${encodeURIComponent(id)}?controls=${compact ? 0 : 1}&description=${compact ? 0 : 1}&music_info=0&rel=0&autoplay=0`;

  function normalize(items) {
    const seen = new Set();
    return (Array.isArray(items) ? items : [])
      .map(item => ({
        external_id: String(item?.external_id || "").trim(),
        url: String(item?.url || "").trim(),
        title: String(item?.title || "").replace(/\s+/g, " ").trim().slice(0, 140),
        created_at: String(item?.created_at || "")
      }))
      .filter(item => /^\d{10,25}$/.test(item.external_id) && !seen.has(item.external_id) && seen.add(item.external_id));
  }

  function canonicalUrl(video) {
    try {
      const url = new URL(video.url);
      if ((url.hostname === "tiktok.com" || url.hostname.endsWith(".tiktok.com")) && /\/(?:video|photo)\/\d{10,25}(?:\/|$)/.test(url.pathname)) return `${url.origin}${url.pathname}`;
    } catch {}
    return `https://www.tiktok.com/@trainingbot.ai2/video/${video.external_id}`;
  }

  async function hydrateClientTitles(items) {
    const videos = normalize(items);
    await Promise.all(videos.map(async video => {
      if (video.title) return;
      try {
        const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(canonicalUrl(video))}`, {cache: "force-cache"});
        if (!response.ok) return;
        const data = await response.json();
        video.title = String(data?.title || "").replace(/\s+/g, " ").trim().slice(0, 140);
      } catch {}
    }));
    return videos;
  }

  function mainFrame(video) {
    const iframe = document.createElement("iframe");
    iframe.className = "tb-home-video-main-frame";
    iframe.src = playerUrl(video.external_id, false);
    iframe.title = video.title || "Video TikTok nổi bật của TrainingBot";
    iframe.loading = "lazy";
    iframe.allow = "fullscreen; autoplay; encrypted-media; picture-in-picture";
    return iframe;
  }


  // A poster is shown initially. The third-party player is loaded only after a click.
  function mainPreview(video) {
    const container = document.createElement("div");
    container.className = "tb-home-video-preview";

    const externalLink = () => {
      const link = document.createElement("a");
      link.className = "tb-home-video-external";
      link.href = canonicalUrl(video);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Mở trên TikTok";
      return link;
    };

    const showPoster = () => {
      const poster = document.createElement("div");
      poster.className = "tb-home-video-poster";
      const image = document.createElement("img");
      image.src = "/pubg-game-avatar.webp?v=140";
      image.alt = "Ảnh đại diện PUBG MOBILE";
      image.loading = "lazy";
      const caption = document.createElement("div");
      caption.className = "tb-home-video-overlay";
      const heading = document.createElement("h3");
      heading.textContent = video.title || "Video PUBG MOBILE nổi bật";
      const play = document.createElement("button");
      play.type = "button";
      play.className = "tb-home-video-play-button";
      play.textContent = "▶ Phát video";
      play.setAttribute("aria-label", "Phát " + (video.title || "video nổi bật"));
      play.addEventListener("click", showPlayer);
      caption.append(heading, play, externalLink());
      poster.append(image, caption);
      container.replaceChildren(poster);
    };

    const showPlayer = () => {
      const frame = mainFrame(video);
      const controls = document.createElement("div");
      controls.className = "tb-home-video-controls";
      const close = document.createElement("button");
      close.type = "button";
      close.textContent = "Đóng trình phát";
      close.addEventListener("click", showPoster);
      controls.append(close, externalLink());
      container.replaceChildren(frame, controls);
    };

    showPoster();
    return container;
  }

  function miniCard(video, index, select) {
    const card = document.createElement("article");
    card.className = "tb-home-video-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Xem ${video.title || `video ${index + 1}`}`);

    const thumb = document.createElement("div");
    thumb.className = "tb-home-video-thumb";

    const image = document.createElement("img");
    image.src = "/pubg-game-avatar.webp?v=140";
    image.alt = "";
    image.loading = "lazy";

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

    thumb.append(image, play);
    card.append(thumb);
    if (video.title) {
      const title = document.createElement("div");
      title.className = "tb-home-video-title";
      title.textContent = video.title;
      card.append(title);
    }
    return card;
  }

  function render(items) {
    const videos = normalize(items);
    if (!videos.length) return;

    let activeId = videos[0].external_id;
    const main = document.createElement("div");
    main.className = "tb-home-video-main";
    host.replaceChildren(main);

    let shelf = document.querySelector(".tb-home-video-shelf");
    if (!shelf) {
      shelf = document.createElement("div");
      shelf.className = "tb-home-video-shelf";
      heroLayout.insertAdjacentElement("afterend", shelf);
    }

    const strip = document.createElement("div");
    strip.className = "tb-home-video-strip";
    strip.setAttribute("aria-label", "Các video trước của TrainingBot");
    strip.id = "tbHomeVideoStrip";
    strip.tabIndex = 0;
    const track = document.createElement("div");
    track.className = "tb-home-video-scroll-track";
    track.tabIndex = 0;
    track.setAttribute("role", "scrollbar");
    track.setAttribute("aria-label", "Kéo sang trái hoặc phải để xem thêm video");
    track.setAttribute("aria-controls", strip.id);
    track.setAttribute("aria-orientation", "horizontal");
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    const thumb = document.createElement("div");
    thumb.className = "tb-home-video-scroll-thumb";
    track.appendChild(thumb);
    shelf.replaceChildren(strip, track);

    const updateTrack = () => {
      const maxScroll = Math.max(0, strip.scrollWidth - strip.clientWidth);
      track.hidden = maxScroll <= 1;
      if (track.hidden) return;
      const trackWidth = track.clientWidth;
      const width = Math.max(48, Math.min(trackWidth, trackWidth * strip.clientWidth / strip.scrollWidth));
      const available = Math.max(0, trackWidth - width);
      const progress = Math.max(0, Math.min(1, strip.scrollLeft / maxScroll));
      thumb.style.width = `${width}px`;
      thumb.style.transform = `translateX(${available * progress}px)`;
      track.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
      track.setAttribute("aria-valuetext", `${Math.round(progress * 100)}% danh sách video`);
    };

    const moveTrack = (clientX, offset) => {
      const box = track.getBoundingClientRect();
      const travel = Math.max(0, track.clientWidth - thumb.offsetWidth);
      if (!travel) return;
      const progress = Math.max(0, Math.min(1, (clientX - box.left - offset) / travel));
      strip.scrollLeft = progress * Math.max(0, strip.scrollWidth - strip.clientWidth);
      updateTrack();
    };

    let dragging = false;
    let dragOffset = 0;
    track.addEventListener("pointerdown", event => {
      if (event.button !== 0 || track.hidden) return;
      dragging = true;
      const thumbRect = thumb.getBoundingClientRect();
      dragOffset = event.target === thumb ? event.clientX - thumbRect.left : thumbRect.width / 2;
      track.setPointerCapture(event.pointerId);
      moveTrack(event.clientX, dragOffset);
      event.preventDefault();
    });
    track.addEventListener("pointermove", event => {
      if (dragging) moveTrack(event.clientX, dragOffset);
    });
    const stopDragging = () => { dragging = false; };
    track.addEventListener("pointerup", stopDragging);
    track.addEventListener("pointercancel", stopDragging);
    track.addEventListener("lostpointercapture", stopDragging);
    track.addEventListener("keydown", event => {
      const jump = Math.max(80, strip.clientWidth * .7);
      const maxScroll = Math.max(0, strip.scrollWidth - strip.clientWidth);
      let next = strip.scrollLeft;
      if (event.key === "ArrowRight") next += 100;
      else if (event.key === "ArrowLeft") next -= 100;
      else if (event.key === "PageDown") next += jump;
      else if (event.key === "PageUp") next -= jump;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = maxScroll;
      else return;
      event.preventDefault();
      strip.scrollLeft = Math.max(0, Math.min(maxScroll, next));
      updateTrack();
    });
    strip.addEventListener("scroll", updateTrack, {passive: true});
    window.addEventListener("resize", updateTrack);
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(updateTrack);
      observer.observe(strip);
      observer.observe(shelf);
    }

    const paint = () => {
      const active = videos.find(video => video.external_id === activeId) || videos[0];
      main.replaceChildren(mainPreview(active));
      strip.replaceChildren();
      const others = videos.filter(video => video.external_id !== active.external_id);
      shelf.hidden = others.length === 0;
      others.forEach((video, index) => strip.appendChild(miniCard(video, index, id => {
        activeId = id;
        paint();
        window.scrollTo({top: host.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth"});
      })));
      requestAnimationFrame(updateTrack);
    };

    paint();
  }

  async function load() {
    try {
      const response = await fetch("/api/home-videos", {cache: "no-store"});
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error("home videos unavailable");
      render(await hydrateClientTitles(data.videos));
    } catch {
      render(await hydrateClientTitles(FALLBACK));
    }
  }

  load();
})();
