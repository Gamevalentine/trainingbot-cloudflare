/* TrainingBot homepage video shelf v191 — draggable horizontal video scroll thumb */
(() => {
  "use strict";

  const FALLBACK = [];

  const host = document.querySelector(".hero-tiktok");
  const heroLayout = host?.closest(".tb202-video-stage");
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
        created_at: String(item?.created_at || ""),
        kind: /\/photo\/\d{10,25}(?:[/?]|$)/.test(String(item?.url || "")) ? "photo" : "video",
        thumbnail_url: String(item?.thumbnail_url || "").trim()
      }))
      .filter(item => /^\d{10,25}$/.test(item.external_id) && !seen.has(item.external_id) && seen.add(item.external_id));
  }

  function canonicalUrl(video) {
    try {
      const url = new URL(video.url);
      if ((url.hostname === "tiktok.com" || url.hostname.endsWith(".tiktok.com")) && /\/(?:video|photo)\/\d{10,25}(?:\/|$)/.test(url.pathname)) return `${url.origin}${url.pathname}`;
    } catch {}
    return `https://www.tiktok.com/@trainingbbot`;
  }

  const genericTitle = title => !title || /^(?:TikTok(?:\s*-\s*Make Your Day)?|Make Your Day)$/i.test(title);
  const mediaName = video => video.kind === "photo" ? "Bộ ảnh TikTok" : "Video TikTok";
  const fallbackCover = "/pubg-game-avatar.webp?v=140";

  async function hydrateClientPreviews(items) {
    const videos = normalize(items);
    await Promise.all(videos.slice(0, 12).map(async video => {
      if (genericTitle(video.title)) video.title = "";
      try {
        const match = new URL(canonicalUrl(video)).pathname.match(/^\/@([\w.]+)\/(video|photo)\/(\d{10,25})(?:\/|$)/);
        if (!match) return;
        const params = new URLSearchParams({user: match[1], kind: match[2], id: match[3]});
        const response = await fetch("/api/home-video-preview?" + params.toString(), {
          cache: "default", signal: AbortSignal.timeout(6500)
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data?.ok && data.thumbnail_url) video.thumbnail_url = data.thumbnail_url;
        if (data?.ok && genericTitle(video.title) && !genericTitle(data.title)) video.title = data.title;
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
  // Photos are primarily presented as image covers + official post links.
  // Video players are user-triggered; TikTok error events restore a usable fallback.
  function mainPreview(video) {
    const container = document.createElement("div");
    container.className = "tb-home-video-preview";

    const externalLink = (label = "Mở bài gốc trên TikTok") => {
      const link = document.createElement("a");
      link.className = "tb-home-video-external";
      link.href = canonicalUrl(video);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = label;
      return link;
    };

    const showPoster = (error = "") => {
      const poster = document.createElement("div");
      poster.className = "tb-home-video-poster";
      if (video.thumbnail_url) poster.classList.add("is-real");
      const image = document.createElement("img");
      image.src = video.thumbnail_url || fallbackCover;
      image.alt = video.title || mediaName(video);
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("error", () => {
        if (image.src.endsWith(fallbackCover)) return;
        image.src = fallbackCover;
        poster.classList.remove("is-real");
      });
      const overlay = document.createElement("div");
      overlay.className = "tb-home-video-overlay";
      const type = document.createElement("span");
      type.className = "tb-home-video-kind";
      type.textContent = video.kind === "photo" ? "BÀI ĐĂNG ẢNH" : "VIDEO";
      const heading = document.createElement("h3");
      heading.textContent = video.title || mediaName(video);
      overlay.append(type, heading);
      if (error) {
        const note = document.createElement("p");
        note.className = "tb-home-video-error";
        note.textContent = "TikTok chưa cho phát nội dung này trên website. Bạn vẫn có thể mở bài đăng gốc.";
        overlay.append(note);
      }
      if (video.kind === "video") {
        const play = document.createElement("button");
        play.type = "button";
        play.className = "tb-home-video-play-button";
        play.textContent = "▶ Phát video";
        play.setAttribute("aria-label", "Phát " + (video.title || "video TikTok"));
        play.addEventListener("click", showPlayer);
        overlay.append(play);
      }
      overlay.append(externalLink(video.kind === "photo" ? "Xem đầy đủ bộ ảnh trên TikTok" : "Mở video trên TikTok"));
      poster.append(image, overlay);
      container.replaceChildren(poster);
    };

    const showPlayer = () => {
      let frame = mainFrame(video);
      const controls = document.createElement("div");
      controls.className = "tb-home-video-controls";
      const close = document.createElement("button");
      close.type = "button";
      close.textContent = "Đóng trình phát";
      const onMessage = event => {
        if (event.origin !== "https://www.tiktok.com" || event.source !== frame.contentWindow) return;
        if (event.data?.["x-tiktok-player"] && (event.data.type === "onPlayerError" || event.data.type === "onError")) {
          cleanup();
          showPoster("embed");
        }
      };
      const cleanup = () => window.removeEventListener("message", onMessage);
      close.addEventListener("click", () => { cleanup(); showPoster(); });
      window.addEventListener("message", onMessage);
      controls.append(close, externalLink("Mở video trên TikTok"));
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
    card.setAttribute("aria-label", `Xem ${video.title || `${mediaName(video)} ${index + 1}`}`);

    const thumb = document.createElement("div");
    thumb.className = "tb-home-video-thumb";

    const image = document.createElement("img");
    image.src = video.thumbnail_url || fallbackCover;
    image.alt = video.title || mediaName(video);
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => { image.src = fallbackCover; });

    const play = document.createElement("span");
    play.className = "tb-home-video-play";
    play.setAttribute("aria-hidden", "true");
    play.textContent = video.kind === "photo" ? "▣" : "▶";

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
    const title = document.createElement("div");
    title.className = "tb-home-video-title";
    title.textContent = video.title || mediaName(video);
    card.append(title);
    return card;
  }

  function render(items) {
    const videos = normalize(items);
    if (!videos.length) {
      host.innerHTML = '<div class="tb-home-video-empty">Chưa có bài đăng TikTok. <a href="https://www.tiktok.com/@trainingbbot" target="_blank" rel="noopener noreferrer">Xem kênh TrainingBot</a></div>';
      return;
    }

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
      render(await hydrateClientPreviews(data.videos));
    } catch {
      render(FALLBACK);
    }
  }

  load();
})();
