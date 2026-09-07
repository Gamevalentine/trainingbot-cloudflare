PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'folder',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS apps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  production_url TEXT NOT NULL,
  admin_url TEXT NOT NULL DEFAULT '',
  github_repo TEXT NOT NULL DEFAULT '',
  cloudflare_project TEXT NOT NULL DEFAULT '',
  icon_key TEXT NOT NULL DEFAULT '',
  cover_key TEXT NOT NULL DEFAULT '',
  short_description TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  primary_use TEXT NOT NULL DEFAULT '',
  audience TEXT NOT NULL DEFAULT '',
  features TEXT NOT NULL DEFAULT '',
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'development' CHECK (status IN ('active','development','beta','paused','archived','offline')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public','private')),
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  pricing_type TEXT NOT NULL DEFAULT 'free',
  platform TEXT NOT NULL DEFAULT 'web',
  tech_stack TEXT NOT NULL DEFAULT '',
  version TEXT NOT NULL DEFAULT '',
  search_keywords TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_tags (
  app_id INTEGER NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (app_id, tag_id)
);

CREATE TABLE IF NOT EXISTS screenshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id INTEGER NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id INTEGER NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  opens INTEGER NOT NULL DEFAULT 0,
  UNIQUE(app_id, date)
);

CREATE TABLE IF NOT EXISTS app_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id INTEGER NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_apps_visibility_status ON apps(visibility, status);
CREATE INDEX IF NOT EXISTS idx_apps_category ON apps(category_id);
CREATE INDEX IF NOT EXISTS idx_apps_updated ON apps(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_app_date ON analytics(app_id, date);
CREATE INDEX IF NOT EXISTS idx_screenshots_app ON screenshots(app_id, sort_order);
