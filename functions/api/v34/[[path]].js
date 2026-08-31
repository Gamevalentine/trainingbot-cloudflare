const JSON_HEADERS = {
  "content-type": "application/json; charset=UTF-8",
  "cache-control": "no-store, max-age=0",
  "x-content-type-options": "nosniff"
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extraHeaders } });
}

function text(value, maxLength = 5000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value) && value.length <= 160;
}

function maskIp(ip) {
  const value = text(ip, 100);
  if (!value) return "unknown";
  if (value.includes(":")) {
    const parts = value.split(":").filter(Boolean);
    return `${parts.slice(0, 3).join(":")}:*`;
  }
  const parts = value.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.*`;
  return "unknown";
}

function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() || "";
}

function tokenFrom(request) {
  const authorization = request.headers.get("Authorization") || "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i);
  return text(bearer?.[1] || request.headers.get("X-Admin-Token"), 500);
}

function constantTimeEqual(a, b) {
  const left = new TextEncoder().encode(String(a || ""));
  const right = new TextEncoder().encode(String(b || ""));
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) diff |= (left[index] || 0) ^ (right[index] || 0);
  return diff === 0;
}

function requireAdmin(request, env) {
  if (!env.ADMIN_TOKEN) return json({ ok: false, message: "Chưa cấu hình ADMIN_TOKEN trên Cloudflare." }, 503);
  const supplied = tokenFrom(request);
  if (!supplied || !constantTimeEqual(supplied, env.ADMIN_TOKEN)) {
    return json({ ok: false, message: "Mật khẩu quản trị không đúng." }, 401, { "www-authenticate": 'Bearer realm="TrainingBot Admin"' });
  }
  return null;
}

function requireDb(env) {
  if (!env.DB) return json({ ok: false, message: "Cloudflare D1 chưa được liên kết với Pages project." }, 503);
  return null;
}

async function readJson(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("application/json")) throw new Error("Dữ liệu gửi lên phải có định dạng JSON.");
  return request.json();
}

async function submitContact(request, env) {
  const noDb = requireDb(env); if (noDb) return noDb;
  let body;
  try { body = await readJson(request); } catch (error) { return json({ ok: false, message: error.message || "Dữ liệu không hợp lệ." }, 400); }
  const name = text(body.name, 80);
  const email = text(body.email, 160).toLowerCase();
  const message = text(body.message, 5000);
  const page = text(body.page, 300) || "/contact.html";
  const honeypot = text(body.website, 200);
  if (honeypot) return json({ ok: true, message: "Đã gửi liên hệ thành công. TrainingBot sẽ phản hồi trong vòng 24–48 giờ." });
  if (name.length < 2) return json({ ok: false, message: "Tên phải có ít nhất 2 ký tự." }, 400);
  if (!validEmail(email)) return json({ ok: false, message: "Địa chỉ email không hợp lệ." }, 400);
  if (message.length < 10) return json({ ok: false, message: "Nội dung phải có ít nhất 10 ký tự." }, 400);

  const ipMasked = maskIp(clientIp(request));
  const device = text(request.headers.get("User-Agent"), 500) || "unknown";
  const now = new Date();
  const recent = await env.DB.prepare(`SELECT created_at FROM contact_messages WHERE ip_masked = ? AND device = ? ORDER BY created_at DESC LIMIT 1`).bind(ipMasked, device).first();
  if (recent?.created_at) {
    const elapsed = now.getTime() - Date.parse(recent.created_at);
    if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < 25000) return json({ ok: false, message: "Bạn vừa gửi một liên hệ. Vui lòng chờ khoảng 25 giây rồi thử lại." }, 429);
  }
  const id = `tb-contact-${crypto.randomUUID()}`;
  await env.DB.prepare(`INSERT INTO contact_messages (id, name, email, message, status, page, ip_masked, device, created_at, updated_at) VALUES (?, ?, ?, ?, 'new', ?, ?, ?, ?, ?)`).bind(id, name, email, message, page, ipMasked, device, now.toISOString(), now.toISOString()).run();
  return json({ ok: true, id, message: "Đã gửi liên hệ thành công. TrainingBot sẽ phản hồi trong vòng 24–48 giờ." }, 201);
}

async function listContacts(request, env) {
  const noDb = requireDb(env); if (noDb) return noDb;
  const unauthorized = requireAdmin(request, env); if (unauthorized) return unauthorized;
  const url = new URL(request.url);
  const requestedLimit = Number.parseInt(url.searchParams.get("limit") || "100", 10);
  const limit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 100, 200));
  const status = text(url.searchParams.get("status"), 20);
  const allowedStatuses = new Set(["new", "read", "replied"]);
  const statement = allowedStatuses.has(status)
    ? env.DB.prepare(`SELECT id, name, email, message, status, page, ip_masked, device, created_at, updated_at FROM contact_messages WHERE status = ? ORDER BY created_at DESC LIMIT ?`).bind(status, limit)
    : env.DB.prepare(`SELECT id, name, email, message, status, page, ip_masked, device, created_at, updated_at FROM contact_messages ORDER BY created_at DESC LIMIT ?`).bind(limit);
  const [messagesResult, countsResult] = await env.DB.batch([
    statement,
    env.DB.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS unread, SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) AS read_count, SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) AS replied FROM contact_messages`)
  ]);
  const counts = countsResult.results?.[0] || { total: 0, unread: 0, read_count: 0, replied: 0 };
  return json({ ok: true, messages: messagesResult.results || [], counts: { total: Number(counts.total || 0), unread: Number(counts.unread || 0), read: Number(counts.read_count || 0), replied: Number(counts.replied || 0) } });
}

async function updateContactStatus(request, env) {
  const noDb = requireDb(env); if (noDb) return noDb;
  const unauthorized = requireAdmin(request, env); if (unauthorized) return unauthorized;
  let body;
  try { body = await readJson(request); } catch (error) { return json({ ok: false, message: error.message || "Dữ liệu không hợp lệ." }, 400); }
  const id = text(body.id, 120), status = text(body.status, 20);
  if (!id || !["new", "read", "replied"].includes(status)) return json({ ok: false, message: "ID hoặc trạng thái không hợp lệ." }, 400);
  const result = await env.DB.prepare(`UPDATE contact_messages SET status = ?, updated_at = ? WHERE id = ?`).bind(status, new Date().toISOString(), id).run();
  if (!result.meta?.changes) return json({ ok: false, message: "Không tìm thấy thư liên hệ." }, 404);
  return json({ ok: true, message: "Đã cập nhật trạng thái." });
}

async function deleteContact(request, env) {
  const noDb = requireDb(env); if (noDb) return noDb;
  const unauthorized = requireAdmin(request, env); if (unauthorized) return unauthorized;
  let body;
  try { body = await readJson(request); } catch (error) { return json({ ok: false, message: error.message || "Dữ liệu không hợp lệ." }, 400); }
  const id = text(body.id, 120);
  if (!id) return json({ ok: false, message: "Thiếu ID của thư." }, 400);
  const result = await env.DB.prepare("DELETE FROM contact_messages WHERE id = ?").bind(id).run();
  if (!result.meta?.changes) return json({ ok: false, message: "Không tìm thấy thư liên hệ." }, 404);
  return json({ ok: true, message: "Đã xóa thư liên hệ." });
}

async function clearContacts(request, env) {
  const noDb = requireDb(env); if (noDb) return noDb;
  const unauthorized = requireAdmin(request, env); if (unauthorized) return unauthorized;
  let body;
  try { body = await readJson(request); } catch (error) { return json({ ok: false, message: error.message || "Dữ liệu không hợp lệ." }, 400); }
  if (body.confirm !== "DELETE_ALL") return json({ ok: false, message: "Thiếu mã xác nhận xóa toàn bộ." }, 400);
  const result = await env.DB.prepare("DELETE FROM contact_messages").run();
  return json({ ok: true, deleted: Number(result.meta?.changes || 0), message: "Đã xóa toàn bộ thư liên hệ." });
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method.toUpperCase();
  if (method === "OPTIONS") return new Response(null, { status: 204, headers: { allow: "GET, POST, OPTIONS", "cache-control": "no-store" } });
  const path = Array.isArray(params.path) ? params.path.join("/") : String(params.path || "");
  if (path === "contact-message" && method === "POST") return submitContact(request, env);
  if (path === "admin-contacts" && method === "GET") return listContacts(request, env);
  if (path === "contact-status" && method === "POST") return updateContactStatus(request, env);
  if (path === "delete-contact" && method === "POST") return deleteContact(request, env);
  if (path === "clear-contacts" && method === "POST") return clearContacts(request, env);
  return json({ ok: false, message: "Không tìm thấy API V34." }, 404);
}
