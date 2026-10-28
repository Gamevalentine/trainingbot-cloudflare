# TrainingBot Admin Center — ADM-00 inventory and ADM-01…05 initial implementation

Date: 2026-10-28. Scope: private development branch `aion-trainingbot-admin-rework-20261028`; **no Production deployment or data operations**.

## Actual baseline
- Source repo: `Gamevalentine/trainingbot-cloudflare` (public); production baseline `main` at `d3292150abd1dc01f6051b177808be4805bf94b9` when branch was created. The commit hashes written in the older assignment are not rollback targets.
- Build: `npm run build` = `bash build.sh && bash postbuild.sh`. The 31 pieces under `source_parts/` reassemble the historical static archive. `overrides/` wins over unpacked files; never edit generated `public/` and expect it to persist.
- Admin loader: `overrides/admin.html`, decompresses **16** ordered text/base64/gzip chunks under `overrides/admin-v2-runtime/`; decoded payload ~84,328 bytes. The Studio loader has its own **13** chunks. Source snippets can be regenerated locally by `node tools/admin/audit-runtime.mjs --extract` (untracked local artifact), not committed as a replacement runtime.
- Original Admin sections: `dashboard`, `content`, `studio`, `media`, `wiki`, `users`, `inbox`, `analytics`, `security`, `system`. A post-build loader enhancement also adds `posts`. The UI uses hash-based routing and legacy navigation handlers.
- Admin read/write routes are split among Pages Functions (`/api/v40/admin/*`, `/api/v49/admin/users`, `/api/v71/admin/{beta-versions,posts,contact-messages,...}`) and older routes backed by the `trainingbot-cloud.ai-vn.workers.dev` Worker. **Do not assume that all Worker source or auth policies are in this repository.**
- Beta form comes from readable `overrides/admin_beta_versions_v175.js`, is originally inserted into the `content` panel, and requests `/api/v71/admin/beta-versions` with a bearer token from sessionStorage. Server requires `ADMIN_TOKEN` and D1 binding for this API. Preview is intentionally read-only and denies admin writes.
- Readable post manager/editor scripts are `admin_posts_manual_v171.js`, `admin_posts_feature_v173.js`, `admin_posts_editor_v183.js`; Admin and Studio runtime are distinct from these extras.
- The old runtime has a locally derived posts queue and a single health score indicator. Neither should be treated as authoritative server-side moderation or total platform health.

## Completed on development branch
- ADM-00: reproducible source/packed loader audit in `tools/admin/audit-runtime.mjs`, GitHub Actions independent build workflow; no decoded runtime or secrets committed.
- ADM-01 (scoped): Beta manager now distinguishes **not signed in**, **loading**, **successful zero results**, **401 expired/invalid**, **403 no permission**, and other API errors; status remains visible and retryable. Does not change authentication, API, D1 or token storage. Live authenticated session and error conditions still require owner-controlled staging QA.
- ADM-02/03: six navigation groups with existing view buttons retained for compatibility; Studio remains accessible from editing context but is no longer a standalone sidebar entry. Readable progressive enhancement, not base64 patching.
- ADM-04 (scoped): hide promotional dashboard hero and duplicate shortcut grid; explain limitations of per-service health checks rather than showing an unqualified 100 score; keep existing live data binding.
- ADM-05 (scoped): visually separate Beta into its own view/list, with form initially collapsed; moving the same DOM node preserves original Beta API listeners and editor logic.
- ADM-08: mock-only local browser UI smoke test for 360px/390px/768px/1440px; no real login or D1. Verify GitHub Actions before considering these items accepted.

## Pending / blockers before any Production release
- Proper article list/search/filter, draft/create/publish action fidelity and unsaved-form protection (ADM-05/06).
- Confirm the original Admin V2 routing semantics for Back/Forward, direct hashes including new `#beta`, focus and keyboard navigation across full UI; verify any compatibility bug on real authorized staging environment.
- Consolidate Media, Users, Inbox, Stats, Security/System without inventing unsupported APIs (ADM-07).
- Full authenticated staging workflow for Beta create/update and content editing using **test data only**; no permission to write Production.
- Real backend auth/session-state test: distinguish 401/403 under actual Worker and Pages binding without disabling auth. Source for some Worker APIs is not under version control here.
- Full browser screenshots and regression checks (ADM-08/09) plus concise help/manual/rollback (ADM-10).

## Safety
Never merge into `main` or deploy the admin rewrite without separate owner authorization for the exact Preview. Never run database backup (owner explicitly stopped backup work), schema migration, data restore, admin account change, or production content mutation. If a future change requires a database migration, stop and seek a separate plan. Keep `/admin` and `/admin.html` on the same protected loader and verify login protection.

Testing note: Local mocked UI checks **do not prove** authenticated behavior or successful D1 persistence.
