# TRAFFIC-06 — Ray ID correlation Staging acceptance

## Scope and safety
- This code is **disabled by default**. Production does not write to `tb_traffic_ingest_ray_audit_v1` unless both `TRAFFIC_RAY_AUDIT_ENABLED=1` and `TRAFFIC_RAY_AUDIT_STAGE_HOST=<isolated-staging-host>` are deliberately set on an **isolated non-Production host**. Production and Pages Preview hosts are hard-denied.
- The Ray comes from the **POST /api/visitor-events** request. It **does not identify the prior GET /** HTML request. A Cloudflare security challenge/block can prevent the POST entirely, so the lack of a Ray record cannot clear or condemn any traffic.
- A Ray ID may be reused, and Security Events can be sampled. The Admin lookup explicitly returns `none`, `single` or `ambiguous`, never an automatic bot verdict.
- This is optional debugging data: `ray_id, visitor_id, visit_id, created_at, request_path`; **no IP, full User-Agent, GPS, fingerprint, cookies, or authentication tokens**.
- Only the last **7 days** are shown; old rows are opportunistically pruned when Stage receives a valid page_view. Clear the table after testing.
- Does not alter any existing visits, events, Admin identity or anti-bot/WAF settings.

## Isolated live Staging preconditions
1. Use a **separate Staging deployment** with a **separate D1 database** and Staging Admin token, not the public Production D1 binding.
2. Set `TRAFFIC_RAY_AUDIT_ENABLED=1` **and** `TRAFFIC_RAY_AUDIT_STAGE_HOST=<your-staging-hostname>` only in that Staging environment. Code hard-denies `trainingbot.io.vn`, the canonical Pages host, and Pages branch previews even if the flag is accidentally enabled.
3. IMPORTANT: TrainingBot's current Cloudflare Pages branch Preview middleware **blocks all POST /api/** routes. A plain branch Pages Preview is intentionally NOT a functional write-enabled Staging environment. Do not disable this protection or point Preview at Production D1.
4. Arrange a separately isolated Staging Worker/Pages project if live Ray tests are required. The branch CI currently verifies code with SQLite without writing to Cloudflare.
5. Do not use remote browser checks against the public homepage to simulate visitors; QA should occur on isolated Staging.

## Acceptance tests
- From an isolated Staging browser page, make a single normal `page_view` POST with Cloudflare-generated `Cf-Ray`; verify the diagnostic table receives exactly one row with `request_path=/api/visitor-events`.
- Verify `GET /api/v72/admin/traffic-ray-audit?ray=...` without token returns 401, with Staging Admin auth returns `single` or `ambiguous`; disabled mode returns 404.
- A repeated heartbeat must not create a row. A missing/invalid Ray must not create a row.
- Two records sharing Ray must return `ambiguous`.
- Verify same visit + visitor counters and D1 events before/after diagnostic request, compare D1 query cost/latency before considering any public deployment.
- Validate that the created Ray is an **ingest request Ray**, not the navigation GET Ray, and cannot automatically set `verified_automated` or `verified_test`.
- After testing, unset the environment flag and delete diagnostic rows in the isolated Staging D1 if no longer needed.

## Historical event investigation
- 2026-10-29 **06:10–06:55 ICT** = 2026-10-28 **19:10–19:55 EDT** = 2026-10-28 23:10–23:55 UTC.
- Filter exact Host/US/Path / only if the Cloudflare interface confirms all applied. Cloudflare events are not a complete request log.
- D1 visitor IDs do not have historical Ray IDs. **Do not relabel the previously flagged 54 visits without exact evidence.**

## Current status
- [x] GitHub branch with isolated optional Ray metadata feature.
- [x] Automated SQLite regression and disabled-by-default tests.
- [ ] Live separate D1 Staging smoke test (requires isolated staging runtime, not branch Preview).
- [ ] Admin-authenticated Production read-only acceptance (remote browser was blocked by Cloudflare verification).
- [ ] Production latency/D1 quota assessment (requires real D1 telemetry).

Production release gate: do not merge solely because unit tests pass; the optional debug feature must be verified with an isolated runtime first.
