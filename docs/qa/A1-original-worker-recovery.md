# A.1 — TrainingBot original login Worker source recovery audit

**Status: BLOCKED — source not recovered; Production unchanged.** Date: 2026-10-29.

## Verified sources

1. The site `functions/api/[[path]].js` forwards requests to `https://trainingbot-cloud.ai-vn.workers.dev`. The public packaged `account.html` calls `GET /api/v49/me`, plus POST `/api/v49/login`, `/api/v49/register`, `/api/v49/profile` and `/api/v49/logout`.
2. `GET /api/v49/me` returned 404 through the Production domain **and** direct upstream Worker when called anonymously. HTTP 404 does not prove the original cookie session scheme, which remains unknown.
3. Account-scoped Cloudflare API confirmed its Workers subdomain is `ai-vn`. Under that same account, **script**, **deployment history** and **Worker versions** lookup for `trainingbot-cloud` all returned HTTP **404**, not a recoverable version. The script is absent from the accessible Workers inventory. Evidence: [read-only workflow](https://github.com/Gamevalentine/trainingbot-ai-core/actions/runs/40781496792). No content, secrets or user data was retrieved.
4. All reachable historical Git branches and deleted file names were enumerated. No original v49 Worker source file was found. Evidence: [Git history audit](https://github.com/Gamevalentine/trainingbot-cloudflare/actions/runs/40781075322).
5. Git history includes deleted `functions/_lib/admin_auth.js` and `functions/api/admin-auth/[[path]].js` (e.g. [historical commit](https://github.com/Gamevalentine/trainingbot-cloudflare/commit/75377a407f3fbfd7c4708a4451ca1edabf286937)). They implement a **single fixed Admin identity** linked to a shared upstream `ADMIN_TOKEN`, not the user database's per-person v49 login. **Do not restore or treat as a per-person verifier**.
6. Website Production D1 `trainingbot-db` still has `users_v49` and `user_sessions_v49`, including account status, session identity, expiry and revocation structure. Only PRAGMA/table metadata was inspected, no user records or passwords were accessed, no data written. [Schema-only evidence](https://github.com/Gamevalentine/trainingbot-ai-core/actions/runs/40777382109).
7. The [GitHub encrypted D1 backup plan](docs/qa/p3-1-github-encrypted-d1-backup.md) concerns **database exports**, not Worker source, and explicitly was not executed as a Worker code backup. No backup was restored or Production D1 export initiated.

## Direct technical conclusion

Original v49 Worker source and deployed version **cannot currently be recovered from the connected GitHub/Cloudflare resources**. Another owner-controlled offline archive or Cloudflare Support might change that; no claim is made that the original code is permanently lost.

The old Admin source does not solve v49 personal authentication. Presence of D1 account tables alone does not validate login cookies/passwords; rebuilding must not assume the old hash/cookie scheme or copy real account records into AI Staging.

## Approved safety boundary

- **Do not modify** website Production, Production D1, current login behavior, deployment routes or user roles.
- Keep [AI Preview Draft PR #26](https://github.com/Gamevalentine/trainingbot-cloudflare/pull/26) separate and fail-closed until a trustworthy, tested per-person authentication service exists.
- Do not introduce a public token-issuance endpoint using client-submitted identity or shared Admin token.

## Next under original plan A.1, subject to explicit owner direction

**Path R — external recovery:** Owner provides an authentic archive/repository/deployment export or evidence of an additional account containing the Worker. Verify ownership and code history first; restore only to isolated staging.

**Path N — replacement:** If original source remains unavailable, implement a *new* authentication backend under a new **separate Staging-only Worker**, based on a reviewed account/session/security specification; use synthetic test accounts and isolated D1, not Production account records. Demonstrate login/logout, cookie security, session expiry/revocation, account suspension, role changes and individual Admin role. This would be a **replacement**, not recovered original source, and requires the owner's explicit approval before changing the architecture or Production behavior.

**A.1 acceptance gate:** only claim original-source restoration after actual source identity and trusted test evidence, or formally accept a new Staging replacement architecture with full tests. Do not confuse the already-passing synthetic AI Core tests with real TrainingBot user login.

## Progress reporting

A.1 is **PARTIAL / BLOCKED**. A.7 real-account authentication remains **BLOCKED**. A.8 Staging synthetic auth is PASS, not real-account acceptance. A.9 license audit remains pending full acceptance. Next phase B not started as Production-ready.
