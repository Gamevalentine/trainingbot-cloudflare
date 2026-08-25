const UPSTREAM_URL = "http://k.gjacky.com/1375135419/230/apkupdate/4.6.4.21455/1375135419_230_4.6.4.21455_20260824160548_128024679_apkupdate.apk";
const FILE_NAME = "PUBG_MOBILE_BETA_V4.6.4_x64.apk";

export async function onRequest({ request }) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const headers = new Headers();
  const range = request.headers.get("Range");
  const ifRange = request.headers.get("If-Range");
  if (range) headers.set("Range", range);
  if (ifRange) headers.set("If-Range", ifRange);
  headers.set("Accept", "*/*");
  headers.set("User-Agent", request.headers.get("User-Agent") || "Mozilla/5.0");

  let upstream;
  try {
    upstream = await fetch(UPSTREAM_URL, {
      method: request.method,
      headers,
      redirect: "follow",
    });
  } catch (error) {
    return new Response("Không thể kết nối tới máy chủ tải PUBG.", { status: 502 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new Response("Máy chủ nguồn không trả về tệp tải.", {
      status: upstream.status || 502,
    });
  }

  const out = new Headers();
  const passthrough = [
    "Content-Length",
    "Content-Range",
    "Accept-Ranges",
    "ETag",
    "Last-Modified",
  ];
  for (const name of passthrough) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }

  out.set(
    "Content-Type",
    upstream.headers.get("Content-Type") || "application/vnd.android.package-archive"
  );
  out.set("Content-Disposition", `attachment; filename="${FILE_NAME}"`);
  out.set("Cache-Control", "no-store");
  out.set("X-Content-Type-Options", "nosniff");

  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: out,
  });
}
