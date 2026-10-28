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
      ready = response.ok && status?.ready === true && status?.identityVerified === true &&
        status?.surfaces?.[surface] === true;
      if (!ready) throw Error("IDENTITY_BRIDGE_NOT_READY");
      statusLabel.textContent = "Phiên đã xác minh";
      renderStatus("Đã xác minh", "Máy chủ xác nhận phiên đăng nhập hợp lệ.");
      prompt.disabled = false; submit.disabled = false;
      prompt.placeholder = "Nhập câu hỏi cho TrainingBot AI…";
      help.textContent = "Đang dùng phiên máy chủ đã xác thực.";
    } catch {
      ready = false;
      statusLabel.textContent = "Chưa xác thực";
      renderStatus("Chưa kết nối đăng nhập cá nhân", surface === "admin" ?
        "Cần xác thực quyền Admin riêng cho từng tài khoản. Không chấp nhận token quản trị dùng chung." :
        "Chờ kết nối hệ thống đăng nhập TrainingBot từ máy chủ. Chat vẫn được khóa an toàn.");
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
      message("assistant","Phiên AI chưa sẵn sàng. Hãy thử lại sau khi kết nối đăng nhập được xác minh.");
      await check();
    } finally {submit.disabled = !ready;}
  });
  void check();
})();