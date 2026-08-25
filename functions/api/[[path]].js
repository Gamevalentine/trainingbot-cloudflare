import {readSession,json} from "../_lib/admin_auth.js";

const API_ORIGIN = "https://trainingbot-cloud.ai-vn.workers.dev";

function isAdminApi(pathname){
  return /^\/api\/v\d+\/admin(?:\/|$)/.test(pathname) ||
    /^\/api\/v34\/(admin-contacts|contact-status|delete-contact|clear-contacts)(?:\/|$)/.test(pathname);
}

export async function onRequest({ request }) {
  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, API_ORIGIN);
  const headers = new Headers(request.headers);

  if (isAdminApi(incoming.pathname)) {
    const session = await readSession(request);
    if (session.authenticated && session.token) {
      headers.set("Authorization", `Bearer ${session.token}`);
    } else {
      const auth = headers.get("Authorization") || "";
      if (!auth || auth === "Bearer SESSION_V23") {
        return json({ok:false,message:"Phiên Admin đã hết hạn. Hãy đăng nhập lại bằng tài khoản + 2FA."},401);
      }
    }
  }

  headers.delete("cookie");
  const upstreamRequest = new Request(target.toString(), {
    method: request.method,
    headers,
    body: ["GET","HEAD"].includes(request.method) ? undefined : request.body,
    redirect: "manual"
  });
  const upstreamResponse = await fetch(upstreamRequest);
  const outHeaders = new Headers(upstreamResponse.headers);
  outHeaders.set("Cache-Control","no-store");
  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: outHeaders,
  });
}
