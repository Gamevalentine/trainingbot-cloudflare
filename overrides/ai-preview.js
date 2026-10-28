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
  function renderStatus(message, detail) {
    statusElement.querySelector("strong").textContent = message;
    statusElement.querySelector("p").textContent = detail;
  }
  function message(role, content) {
    const item = document.createElement("article");
    const label = document.createElement("strong");
    label.textContent = role === "user" ? "Bạn" : "TrainingBot AI";
    const body = document.createElement("p");
    body.textContent = content;
    item.append(label, body);
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
      statusLabel.textContent = surface === "admin" ? "Phiên Admin đã xác minh" : "Visitor AI sẵn sàng";
      renderStatus("Dịch vụ đã sẵn sàng", surface === "admin" ? "Máy chủ đã xác minh tài khoản Admin." : "Bạn có thể trò chuyện mà không cần tài khoản.");
      prompt.disabled = false; submit.disabled = false;
      prompt.placeholder = "Nhập câu hỏi cho TrainingBot AI…";
      help.textContent = surface === "admin" ? "Đang dùng tài khoản Admin đã xác thực." : "Không cần đăng nhập. Có giới hạn sử dụng để bảo vệ dịch vụ.";
    } catch {
      ready = false;
      statusLabel.textContent = surface === "admin" ? "Chưa xác thực" : "Chưa mở";
      renderStatus(surface === "admin" ? "Chưa kết nối xác thực Admin" : "Visitor AI chưa mở", surface === "admin" ?
        "Cần xác thực quyền Admin riêng cho từng tài khoản. Không chấp nhận token quản trị dùng chung." :
        "Không cần đăng nhập. Máy chủ còn thiếu cổng bảo vệ và giới hạn sử dụng dành cho khách.");
      prompt.disabled = true; submit.disabled = true;
      help.textContent = "Không nhập mật khẩu, cookie hoặc token vào ô chat.";
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
        body:JSON.stringify({surface,message:text})});
      if(!response.ok)throw Error("UNAVAILABLE");
      const result=await response.json();
      if(typeof result.reply!=="string" || result.reply.length>16000)throw Error("INVALID_REPLY");
      message("assistant",result.reply);
    } catch {
      message("assistant","Dịch vụ AI chưa sẵn sàng. Vui lòng thử lại khi máy chủ được mở.");
      await check();
    } finally {submit.disabled = !ready;}
  });
  void check();
})();