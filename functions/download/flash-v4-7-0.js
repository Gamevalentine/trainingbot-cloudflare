// TrainingBot: stream the public 4.7.0 APK through a same-site download endpoint.
// The public homepage no longer links to a Google Drive page.
const FILE_ID = "1Qd9M4Mwi97hqmWgygXHl_KS-xr6Od5Tx";
const FILE_NAME = "PUBG_MOBILE_FLASH_BETA_v4.7.0.apk";
const UPSTREAM = "https://drive.usercontent.google.com/download?id=" +
  encodeURIComponent(FILE_ID) + "&export=download&confirm=t";

function failure(message, status = 502) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function onRequest({ request }) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const headers = new Headers({
    Accept: "application/octet-stream,application/vnd.android.package-archive,*/*",
    "User-Agent": "Mozilla/5.0",
  });

  for (const name of ["Range", "If-Range"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  let upstream;
  try {
    upstream = await fetch(UPSTREAM, {
      method: request.method,
      headers,
      redirect: "follow",
      cache: "no-store",
    });
  } catch (error) {
    console.error("Flash Beta 4.7.0 upstream connection", error);
    return failure("Không kết nối được máy chủ lưu trữ APK. Hãy thử lại sau.");
  }

  if (upstream.status !== 200 && upstream.status !== 206) {
    console.error("Flash Beta 4.7.0 upstream status", upstream.status);
    return failure("Máy chủ lưu trữ hiện không cung cấp tệp APK.", 502);
  }

  const type = (upstream.headers.get("Content-Type") || "").toLowerCase();
  if (type.includes("text/html") || type.includes("application/json") || type.includes("text/plain")) {
    upstream.body?.cancel().catch(() => {});
    return failure("Nguồn tải đang yêu cầu xác nhận hoặc giới hạn tải. Không thể tải tự động.");
  }

  const responseHeaders = new Headers({
    "Content-Type": "application/vnd.android.package-archive",
    "Content-Disposition": 'attachment; filename="' + FILE_NAME + '"',
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });

  for (const name of ["Content-Length", "Content-Range", "Accept-Ranges", "ETag", "Last-Modified"]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
