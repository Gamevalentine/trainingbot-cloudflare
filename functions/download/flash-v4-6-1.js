import { countFlashDownload, isInitialDownloadRequest } from "../_lib/flash-download-counts.js";

const RELEASE_FILE = "https://github.com/Gamevalentine/trainingbot-cloudflare/releases/download/pubgm-flash-v1/PUBGM-FLASH.xapk";

// Count the first request and let GitHub Releases deliver the original XAPK.
export async function onRequest({request, env}) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {status: 405, headers: {Allow: "GET, HEAD"}});
  }
  if (env.DB && isInitialDownloadRequest(request)) {
    try {
      await countFlashDownload(env.DB, "v4.6.1");
    } catch (error) {
      // Analytics must not break the download itself.
      console.error("Flash v4.6.1 download counter", error);
    }
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: RELEASE_FILE,
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
