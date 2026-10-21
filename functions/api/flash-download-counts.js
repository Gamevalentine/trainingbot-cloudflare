import { readFlashDownloads } from "../_lib/flash-download-counts.js";

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

export async function onRequestGet({env}) {
  if (!env.DB) {
    return new Response(JSON.stringify({ok: false, message: "Thống kê tải chưa sẵn sàng."}),
      {status: 503, headers: HEADERS});
  }
  try {
    const counts = await readFlashDownloads(env.DB);
    return new Response(JSON.stringify({ok: true, counts, metric: "download_starts"}),
      {status: 200, headers: HEADERS});
  } catch (error) {
    console.error("TrainingBot Flash download counts read", error);
    return new Response(JSON.stringify({ok: false, message: "Chưa thể đọc số lượt tải."}),
      {status: 503, headers: HEADERS});
  }
}
