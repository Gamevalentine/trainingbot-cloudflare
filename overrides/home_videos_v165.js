/* TrainingBot homepage video shelf v191 — draggable horizontal video scroll thumb */
(() => {
  "use strict";

  const FALLBACK = [];

  const host = document.querySelector(".hero-tiktok");
  const heroLayout = host?.closest(".tb202-video-stage");
  if (!host || !heroLayout) return;

  const playerUrl = (id, compact = false) =>
    `https://www.tiktok.com/player/v1/${encodeURIComponent(id)}?controls=${compact ? 0 : 1}&description=${compact ? 0 : 1}&music_info=0&rel=0&autoplay=1&muted=1`;

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
    iframe.loading = "eager";
    iframe.allow = "fullscreen; autoplay; encrypted-media; picture-in-picture";
    return iframe;
  }


  // A poster is shown initially. The third-party player is loaded only after a click.
  // Photos are primarily presented as image covers + official post links.
  // Video players are user-triggered; TikTok error events restore a usable fallback.
  // Play the real TikTok embed when the media enters the viewport.
  // Muted autoplay is necessary for modern browser autoplay policies.
  function mainPreview(video) {
    const container = document.createElement("div");
    container.className = "tb-home-video-preview";
    let frame = null;
    let observer = null;
    let inView = false;
    let manuallyClosed = false;
    let failed = false;
    let disposed = false;
    let messageHandler = null;

    const externalLink = (label = "Mở bài đăng trên TikTok") => {
      const link = document.createElement("a");
      link.className = "tb-home-video-external";
      link.href = canonicalUrl(video);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = label;
      return link;
    };

    const command = type => {
      try {
        frame?.contentWindow?.postMessage({"x-tiktok-player": true, type}, "https://www.tiktok.com");
      } catch {}
    };

    const detach = () => {
      if (frame) command("pause");
      frame = null;
      if (messageHandler) window.removeEventListener("message", messageHandler);
      messageHandler = null;
    };

    const showPoster = (reason = "") => {
      if (disposed) return;
      detach();
      const poster = document.createElement("div");
      poster.className = "tb-home-video-poster";
      if (video.thumbnail_url) poster.classList.add("is-real");
      if (video.kind === "photo" && !video.thumbnail_url) poster.classList.add("is-photo-unavailable");
      const image = document.createElement("img");
      const defaultCover = video.kind === "photo" ? "/trainingbot-logo-v110.png" : fallbackCover;
      image.src = video.thumbnail_url || defaultCover;
      image.alt = video.title || mediaName(video);
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("error", () => {
        if (image.src !== new URL(defaultCover, location.href).href) image.src = defaultCover;
      });
      const overlay = document.createElement("div");
      overlay.className = "tb-home-video-overlay";
      const type = document.createElement("span");
      type.className = "tb-home-video-kind";
      type.textContent = video.kind === "photo" ? "BÀI ĐĂNG ẢNH" : "VIDEO";
      const heading = document.createElement("h3");
      heading.textContent = video.title || mediaName(video);
      overlay.append(type, heading);
      if (reason) {
        const note = document.createElement("p");
        note.className = "tb-home-video-error";
        note.textContent = reason === "autoplay"
          ? "Trình duyệt chặn tự phát. Bấm nút bên dưới để xem nội dung."
          : "Trình phát tạm thời không khả dụng. Bạn vẫn có thể mở bài gốc trên TikTok.";
        overlay.append(note);
      }
      const play = document.createElement("button");
      play.type = "button";
      play.className = "tb-home-video-play-button";
      play.textContent = video.kind === "photo" ? "▣ Xem bộ ảnh" : "▶ Phát video";
      play.addEventListener("click", () => {
        manuallyClosed = false;
        failed = false;
        showPlayer();
      });
      overlay.append(play, externalLink());
      poster.append(image, overlay);
      container.replaceChildren(poster);
    };

    const showPlayer = () => {
      if (disposed || frame) return;
      failed = false;
      const player = mainFrame(video);
      frame = player;
      const controls = document.createElement("div");
      controls.className = "tb-home-video-controls";
      const close = document.createElement("button");
      close.type = "button";
      close.textContent = "Đóng trình phát";
      close.addEventListener("click", () => {
        manuallyClosed = true;
        showPoster();
      });
      messageHandler = event => {
        if (event.origin !== "https://www.tiktok.com" || event.source !== player.contentWindow) return;
        const message = event.data;
        if (!message?.["x-tiktok-player"]) return;
        if (message.type === "onPlayerReady") {
          command("mute");
          if (inView && !document.hidden) command("play");
        } else if (message.type === "onPlayerError" || message.type === "onError") {
          failed = true;
          showPoster(message.value?.errorCode === 3002 ? "autoplay" : "unavailable");
        }
      };
      window.addEventListener("message", messageHandler);
      controls.append(close, externalLink(video.kind === "photo" ? "Mở bộ ảnh trên TikTok" : "Mở video trên TikTok"));
      container.replaceChildren(player, controls);
    };

    const updateVisibility = visible => {
      if (disposed) return;
      inView = visible;
      if (visible && !document.hidden) {
        if (!frame && !failed && !manuallyClosed) showPlayer();
        else if (frame) command("play");
      } else if (frame) {
        command("pause");
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        if (frame) command("pause");
      } else if (inView) {
        updateVisibility(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    showPoster();

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(entries => {
        const entry = entries[0];
        const visible = !!entry?.isIntersecting && entry.intersectionRatio >= 0.18;
        if (!entry?.isIntersecting) manuallyClosed = false;
        updateVisibility(visible);
      }, {threshold: [0, 0.18, 0.4]});
      observer.observe(container);
    } else {
      updateVisibility(true);
    }

    container.tbCleanup = () => {
      disposed = true;
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      detach();
    };
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
    image.src = video.thumbnail_url || (video.kind === "photo" ? "/trainingbot-logo-v110.png" : fallbackCover);
    image.alt = video.title || mediaName(video);
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => { image.src = video.kind === "photo" ? "/trainingbot-logo-v110.png" : fallbackCover; });

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
      main.firstElementChild?.tbCleanup?.();
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
