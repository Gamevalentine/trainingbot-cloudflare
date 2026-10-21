// Shared counters for the two TrainingBot homepage Flash Beta download cards.
// A count represents a started download request, NOT a unique downloader or completed transfer.
export const FLASH_VERSIONS = ["v4.6.1", "v4.7.0"];

export async function ensureFlashCountsTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS tb_flash_download_counts_v1 (
    version TEXT PRIMARY KEY,
    downloads INTEGER NOT NULL DEFAULT 0 CHECK(downloads >= 0)
  )`).run();
}

export async function countFlashDownload(db, version) {
  if (!FLASH_VERSIONS.includes(version)) throw new Error("Unknown Flash version");
  await ensureFlashCountsTable(db);
  await db.prepare(`INSERT INTO tb_flash_download_counts_v1 (version, downloads)
    VALUES (?, 1) ON CONFLICT(version) DO UPDATE SET downloads = downloads + 1`)
    .bind(version).run();
}

export async function readFlashDownloads(db) {
  await ensureFlashCountsTable(db);
  const response = await db.prepare(
    "SELECT version, downloads FROM tb_flash_download_counts_v1 WHERE version IN ('v4.6.1','v4.7.0')"
  ).all();
  const counts = {"v4.6.1": 0, "v4.7.0": 0};
  for (const row of response.results || []) {
    if (FLASH_VERSIONS.includes(row.version)) counts[row.version] = Math.max(0, Number(row.downloads) || 0);
  }
  return counts;
}

export function isInitialDownloadRequest(request) {
  if (request.method !== "GET") return false;
  const range = request.headers.get("Range");
  return !range || /^bytes=0-\s*$/i.test(range);
}
