CREATE TABLE IF NOT EXISTS search_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  date TEXT NOT NULL,
  searches INTEGER NOT NULL DEFAULT 0,
  zero_results INTEGER NOT NULL DEFAULT 0,
  last_result_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(normalized_query, date)
);

CREATE TABLE IF NOT EXISTS category_analytics (
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (category_id, date)
);
CREATE TABLE IF NOT EXISTS admin_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  event_key TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(date, event_key)
);

CREATE INDEX IF NOT EXISTS idx_search_analytics_date ON search_analytics(date);
CREATE INDEX IF NOT EXISTS idx_category_analytics_date ON category_analytics(date);
CREATE INDEX IF NOT EXISTS idx_admin_activity_date ON admin_activity(date);
