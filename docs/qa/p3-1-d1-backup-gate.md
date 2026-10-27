# P3.1 · TrainingBot D1 data protection and backup gate

Date: 2026-10-28. Scope: **Preview branch only**, never change Production until owner approval.

## Audit findings

- Source of truth: production D1 as bound to the deployed `trainingbot.io.vn` Functions. Database **name, ID, actual table counts, storage version and Time Travel bookmark cannot be verified from GitHub or public APIs**.
- Read-only public endpoints for beta versions, posts, home videos and counters responded successfully on both Production and Preview, where Preview proxies permitted GET requests. This is **NOT a full database backup or a proof that all rows and private tables exist**.
- No `wrangler.toml` / `wrangler.json` in the tracked Preview Git tree; actual Pages Production/Preview bindings require authenticated Cloudflare account inspection.
- Existing public GET handlers, e.g. `/api/posts`, `/api/beta-versions`, and `/api/team-finder`, may perform `CREATE TABLE IF NOT EXISTS`, seed or `ALTER TABLE` operations. Treat these as **migration risks**: read-only HTTP GET should not be assumed to be SQL read-only.
- Legacy `functions/api/[[path]].js` forwards arbitrary API methods to the `trainingbot-cloud.ai-vn.workers.dev` upstream. P3.1 Preview middleware now **denies non-read methods and all nonallowlisted API reads before any handler**, even if misconfigured with production bindings. Admin and legacy API GET requests on Preview are denied.
- Explicit download GET/HEAD routes still redirect to Production's existing counted download endpoints only on user request. Live Production domain remains unchanged.

## Current statuses

| Gate | Status |
| --- | --- |
| Public Production data accessible | VERIFIED at public API level |
| Preview read-only code gate | IMPLEMENTED + mocked CI |
| Confirm exact Production/Preview D1 binding names/IDs | BLOCKED: no authenticated Cloudflare connection |
| Record D1 Time Travel bookmark | BLOCKED |
| Export full DB SQL with table data | BLOCKED — **NOT BACKED UP** |
| Verify backup integrity and table counts | BLOCKED |
| Restore validation to separate staging D1 | BLOCKED |
| Production migration/merge | NOT AUTHORIZED |

## Safe backup sequence when authenticated account access becomes available

1. Confirm that Cloudflare project `trainingbot-cloudflare` is the Pages project for custom domain `trainingbot.io.vn`. Record Production and Preview bindings, variable names, database names and UUIDs via **Settings → Bindings**. Do **not** attach Production D1 to Preview.
2. Determine actual production DB name from authenticated Cloudflare. Run `npx wrangler d1 info "<ACTUAL_DB_NAME>"` and confirm `version: production`. Record UTC timestamp and current bookmark using `npx wrangler d1 time-travel info "<ACTUAL_DB_NAME>"`. A bookmark is a rollback point, not an exported full backup.
3. Schedule a low-traffic window: Cloudflare's full D1 export **temporarily blocks database requests**. Export schema+data with `npx wrangler d1 export "<ACTUAL_DB_NAME>" --remote --output="./trainingbot-D1-YYYYMMDDTHHMMSSZ.sql"`. Never fill in a guessed name or remove `--remote`.
4. Store the SQL privately, encrypted and offline or in controlled backup storage; **never commit it to GitHub**, expose it as a public download or paste admin/customer fields into chat.
5. Record file size and SHA-256, enumerate tables and compare per-table row counts with authenticated read-only D1 queries. `PRAGMA integrity_check` is appropriate only on a separate restored SQLite copy, not by mutating the live DB.
6. Validate by importing a sanitized private copy to an **independent staging D1 database** (separate name and ID), verify schema + counts and admin/public read paths against staging. Never test restore by overwriting Production.
7. Only after accepted backup plus user approval can future production release be considered. Rollback of frontend code and D1 database restoration are separate operations. **Never invoke `wrangler d1 time-travel restore` against Production without explicit authorization**, since it replaces current data.

Cloudflare references:
- https://developers.cloudflare.com/d1/best-practices/import-export-data/
- https://developers.cloudflare.com/d1/reference/time-travel/
- https://developers.cloudflare.com/pages/functions/bindings/

**No production/admin/D1 changes were performed as part of this check.**
