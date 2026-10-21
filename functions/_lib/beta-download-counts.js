// Persistent, version-specific counters for PUBG MOBILE BETA releases.
// Counts initial download requests; not unique users or completed APKs.
export function normalizeBetaVersion(value) {
  const version = String(value || "").trim().toUpperCase();
  return /^V\d+\.\d+\.\d+$/.test(version) ? version : null;
}

export function isInitialBetaDownloadRequest(request) {
  if (request.method !== "GET") return false;
  const range = request.headers.get("Range");
  return !range || /^bytes=0-\s*$/i.test(range);
}

export async function ensureBetaDownloadCounts(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS tb_beta_download_counts_v1 (
    version TEXT PRIMARY KEY,
    downloads INTEGER NOT NULL DEFAULT 0 CHECK(downloads >= 0)
  )`).run();
}

export async function recordBetaDownload(db, version) {
  const value = normalizeBetaVersion(version);
  if (!value) throw new Error("Invalid beta version for download count");
  await ensureBetaDownloadCounts(db);
  await db.prepare(`INSERT INTO tb_beta_download_counts_v1(version, downloads)
    VALUES(?, 1) ON CONFLICT(version) DO UPDATE SET downloads=downloads + 1`)
    .bind(value).run();
}

export async function listBetaDownloadCounts(db) {
  await ensureBetaDownloadCounts(db);
  const result = await db.prepare(
    "SELECT version, downloads FROM tb_beta_download_counts_v1"
  ).all();
  const counts = {};
  for (const row of result.results || []) {
    const version = normalizeBetaVersion(row.version);
    if (version) counts[version] = Math.max(0, Number(row.downloads) || 0);
  }
  return counts;
}
