import { listBetaDownloadCounts } from "../_lib/beta-download-counts.js";

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff"
};

function json(body, status) {
  return new Response(JSON.stringify(body), {status, headers: HEADERS});
}

export async function onRequestGet({env}) {
  if (!env.DB) return json({ok:false, message:"Chưa kết nối được dữ liệu thống kê."}, 503);
  try {
    const counts = await listBetaDownloadCounts(env.DB);
    return json({ok:true, counts, metric:"download_starts"}, 200);
  } catch (error) {
    console.error("PUBG beta download counts", error);
    return json({ok:false, message:"Không tải được lượt tải."}, 503);
  }
}
