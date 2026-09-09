ALTER TABLE apps ADD COLUMN github_repo_full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE apps ADD COLUMN github_default_branch TEXT NOT NULL DEFAULT '';
ALTER TABLE apps ADD COLUMN github_last_commit_sha TEXT NOT NULL DEFAULT '';
ALTER TABLE apps ADD COLUMN github_last_commit_message TEXT NOT NULL DEFAULT '';
ALTER TABLE apps ADD COLUMN github_last_commit_at TEXT NOT NULL DEFAULT '';
ALTER TABLE apps ADD COLUMN github_last_synced_at TEXT NOT NULL DEFAULT '';
ALTER TABLE apps ADD COLUMN github_sync_error TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_apps_github_synced ON apps(github_last_synced_at);
