ALTER TABLE apps ADD COLUMN monitor_enabled INTEGER NOT NULL DEFAULT 1 CHECK (monitor_enabled IN (0,1));
ALTER TABLE apps ADD COLUMN last_checked_at TEXT NOT NULL DEFAULT '';
ALTER TABLE apps ADD COLUMN last_http_status INTEGER;
ALTER TABLE apps ADD COLUMN last_response_ms INTEGER;
ALTER TABLE apps ADD COLUMN last_error TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS uptime_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id INTEGER NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_up INTEGER NOT NULL CHECK (is_up IN (0,1)),
  http_status INTEGER,
  response_ms INTEGER,
  error TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_uptime_checks_app_time
  ON uptime_checks(app_id, checked_at DESC);
