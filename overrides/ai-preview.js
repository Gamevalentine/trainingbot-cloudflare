"use strict";
(() => {
  const get = id => document.getElementById(id);
  const surface = document.body.dataset.aiSurface === "admin" ? "admin" : "visitor";
  const statusElement = get("readiness");
  const statusLabel = get("access-label");
  const prompt = get("prompt");
  const submit = get("send");
  const form = get("chat-form");
  const help = get("composer-help");
  const thread = get("thread");
  let ready = false;
  let conversationId = null;
  function renderStatus(message, detail) {
    statusElement.querySelector("strong").textContent = message;
    statusElement.querySelector("p").textContent = detail;
  }
  function message(role, content, sources = []) {
    const item = document.createElement("article");
    const label = document.createElement("strong");
    label.textContent = role === "user" ? "Bạn" : "TrainingBot AI";
    const body = document.createElement("p");
    body.textContent = content;
    item.append(label, body);
    // Source metadata is supplied by the server-only Worker bridge. Render only
    // text nodes and allowlisted source URLs; never interpret model text as HTML.
    if (role === "assistant" && Array.isArray(sources) && sources.length) {
      const section = document.createElement("section");
      section.setAttribute("aria-label", "Nguồn và trạng thái xác minh");
      section.style.cssText = "border-top:1px solid #294563;padding-top:10px;font-size:.85em";
      const head = document.createElement("strong");
      head.textContent = "Nguồn tra cứu và phiên bản";
      section.append(head);
      const list = document.createElement("ul");
      for (const source of sources.slice(0, 6)) {
        if (!source || !["wiki_snapshot", "editorial_tactics", "official_claim"].includes(source.type)) continue;
        const li = document.createElement("li");
        const name = typeof source.title === "string" ? source.title.slice(0, 160) : "Nguồn";
        const wikiUrl = typeof source.url === "string" &&
          (/^https:\/\/github\.com\/Gamevalentine\/trainingbot-cloudflare\/blob\/[a-f0-9]{40}\/overrides\/wiki\.html$/.test(source.url) ||
           /^https:\/\/github\.com\/Gamevalentine\/trainingbot-cloudflare\/actions\/runs\/40763409109$/.test(source.url));
        const officialUrl = typeof source.url === "string" &&
          /^https:\/\/www\.pubgmobile\.com\/en\/event\/(?:PUBG-MOBILE-Version-430|PUBG-MOBILE-Version-400|Official-Transformers-Collaboration|260Devnotes|250Devnotes|270Devnotes)\/$/.test(source.url);
        if ((wikiUrl && source.type === "wiki_snapshot") || (officialUrl && source.type === "official_claim")) {
          const anchor = document.createElement("a");
          anchor.href = source.url;
          anchor.target = "_blank";
          anchor.rel = "noopener noreferrer";
          anchor.textContent = name;
          li.append(anchor);
        } else {
          li.textContent = name;
        }
        const note = document.createElement("span");
        note.textContent = source.type === "editorial_tactics"
          ? " — Gợi ý biên tập, không phải dữ kiện chính thức"
          : source.type === "official_claim"
            ? " — Mệnh đề được dẫn nguồn chính thức; bản " + (source.gameVersion || "chưa rõ") +
              (source.checkedAt ? "; đối chiếu " + source.checkedAt : "")
            : " — Wiki nội bộ (bản runtime), không phải xác minh game; phiên bản từng trường chưa xác minh" +
              (source.snapshotDate ? "; chụp " + source.snapshotDate : "");
        li.append(note); list.append(li);
      }
      section.append(list); item.append(section);
    }
    item.style.cssText = "border:1px solid #294563;background:#12233b;border-radius:14px;padding:12px 16px;white-space:pre-wrap";
    thread.append(item);
    item.scrollIntoView({block:"end",behavior:"smooth"});
  }
  async function check() {
    try {
      const response = await fetch("/api/ai-preview/status", {cache:"no-store",credentials:"same-origin",redirect:"error",headers:{"Accept":"application/json"}});
      const status = await response.json();
      // Readiness and roles come exclusively from the same-origin server, never local storage or user input.
      ready = response.ok && status?.ready === true && status?.surfaces?.[surface] === true &&
        (surface === "visitor" ? status?.anonymousVisitorReady === true : status?.identityVerified === true);
      if (!ready) throw Error("IDENTITY_BRIDGE_NOT_READY");
      if (surface === "visitor") {
        const session = await fetch("/api/ai-preview/session", {
          method:"POST",credentials:"same-origin",cache:"no-store",redirect:"error",
          headers:{"content-type":"application/json","accept":"application/json"},
          body:"{}"
        });
        if (!session.ok) {
          const payload=await session.json().catch(()=>({}));
          const allowed=[
            "SESSION_RATE_STORE_UNAVAILABLE","SESSION_DATABASE_UNAVAILABLE",
            "SESSION_BRIDGE_AUTH_FAILURE","SESSION_BRIDGE_PROTOCOL_FAILURE",
            "SESSION_CONFLICT","SESSION_BRIDGE_TRANSPORT_FAILURE",
            "SESSION_INVALID_UPSTREAM_RESPONSE","SESSION_STAGING_UNAVAILABLE"
          ];
          const detail=allowed.includes(payload?.error?.code)?payload.error.code:"SESSION_UNKNOWN";
          throw Error(session.status===429?"VISITOR_SESSION_RATE_LIMITED":"VISITOR_SESSION_UNAVAILABLE:"+detail);
        }
      }
      statusLabel.textContent = surface === "admin" ? "Phiên Admin đã xác minh" : "Visitor AI sẵn sàng";
      renderStatus("Dịch vụ đã sẵn sàng", surface === "admin" ? "Máy chủ đã xác minh tài khoản Admin." : "Bạn có thể trò chuyện mà không cần tài khoản.");
      prompt.disabled = false; submit.disabled = false;
      prompt.placeholder = "Nhập câu hỏi cho TrainingBot AI…";
      help.textContent = surface === "admin" ? "Đang dùng tài khoản Admin đã xác thực." : "Không cần đăng nhập. Có giới hạn sử dụng để bảo vệ dịch vụ.";
    } catch (error) {
      ready = false;
      const errorCode = error instanceof Error ? error.message : "";
      const quota = surface === "visitor" && errorCode === "VISITOR_SESSION_RATE_LIMITED";
      const sessionUnavailable = surface === "visitor" && errorCode.startsWith("VISITOR_SESSION_UNAVAILABLE:");
      const reason=sessionUnavailable?errorCode.split(":")[1]:"";
      const reasonText={
        SESSION_RATE_STORE_UNAVAILABLE:"Không truy cập được kho lưu giới hạn lượt (D1).",
        SESSION_DATABASE_UNAVAILABLE:"Kho lưu phiên trò chuyện (D1) đang không sẵn sàng.",
        SESSION_BRIDGE_AUTH_FAILURE:"Xác thực kết nối giữa Preview và Worker đã bị từ chối.",
        SESSION_BRIDGE_PROTOCOL_FAILURE:"Giao thức tạo phiên giữa Preview và Worker bị lỗi.",
        SESSION_CONFLICT:"Máy chủ báo phiên trùng, không tự tạo lại để tránh lạm dụng.",
        SESSION_BRIDGE_TRANSPORT_FAILURE:"Không kết nối được đến Worker Staging.",
        SESSION_INVALID_UPSTREAM_RESPONSE:"Worker không trả về xác nhận tạo phiên hợp lệ.",
        SESSION_STAGING_UNAVAILABLE:"Worker Staging chưa cấp được phiên.",
        SESSION_UNKNOWN:"Máy chủ từ chối cấp phiên; chưa xác định được nguyên nhân."
      }[reason]||"Máy chủ chưa cấp được phiên.";
      statusLabel.textContent = surface === "admin" ? "Chưa xác thực" : quota ? "Đã giới hạn lượt" : sessionUnavailable ? "Lỗi tạo phiên" : "Chưa mở";
      renderStatus(surface === "admin" ? "Chưa kết nối xác thực Admin" :
        quota ? "Đã đạt giới hạn khởi tạo phiên" :
        sessionUnavailable ? "Chưa tạo được phiên trò chuyện" : "Visitor AI chưa mở",
        surface === "admin"
          ? "Cần xác thực quyền Admin riêng cho từng tài khoản. Không chấp nhận token quản trị dùng chung."
          : quota
            ? "Máy chủ đang giới hạn lượt truy cập để bảo vệ quota miễn phí. Hãy thử lại sau; không cần đăng nhập."
            : sessionUnavailable
              ? reasonText+" Mã kiểm tra: "+reason+". Chat vẫn được khóa an toàn."
              : "Máy chủ chưa xác nhận dịch vụ Visitor có thể sử dụng an toàn.");
      prompt.disabled = true; submit.disabled = true;
      help.textContent = quota
        ? "Không tự động tạo lại phiên để tránh tăng tải lên máy chủ."
        : "Không nhập mật khẩu, cookie hoặc token vào ô chat.";
    }
  }
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if(!ready || !prompt.value.trim() || prompt.disabled) return;
    const text = prompt.value.trim();
    if(text.length>3000)return;
    prompt.value = "";submit.disabled = true;
    message("user",text);
    try {
      // First-party BFF only. No direct call to the isolated Worker, no browser-managed API token.
      const response=await fetch("/api/ai-preview/chat", {method:"POST",credentials:"same-origin",cache:"no-store",
        redirect:"error",headers:{"content-type":"application/json","accept":"application/json"},
        body:JSON.stringify({surface,message:text,...(conversationId?{conversationId}:{})})});
      if(!response.ok)throw Error(response.status === 429 ? "CHAT_RATE_LIMITED" : "UNAVAILABLE");
      const result=await response.json();
      if(typeof result.reply!=="string" || result.reply.length>16000)throw Error("INVALID_REPLY");
      if(typeof result.conversationId === "string" && /^[A-Za-z0-9_-]{8,100}$/.test(result.conversationId))
        conversationId=result.conversationId;
      message("assistant",result.reply,result.sources);
    } catch (error) {
      const quota = error instanceof Error && error.message === "CHAT_RATE_LIMITED";
      message("assistant", quota
        ? "Bạn đã đạt giới hạn số câu hỏi của phiên này. Hãy thử lại sau; hệ thống sẽ không tự tăng quota."
        : "Dịch vụ AI tạm thời chưa thể trả lời. Vui lòng thử lại sau.");
      if (quota) {
        ready = false;
        prompt.disabled = true;
        statusLabel.textContent = "Đã giới hạn lượt";
        renderStatus("Đã đạt giới hạn hội thoại",
          "Giới hạn được kiểm tra trên máy chủ để bảo vệ dịch vụ miễn phí.");
        help.textContent = "Không tự động gửi lại câu hỏi.";
      } else {
        conversationId = null;
        await check();
      }
    } finally {submit.disabled = !ready;}
  });
  void check();
})();