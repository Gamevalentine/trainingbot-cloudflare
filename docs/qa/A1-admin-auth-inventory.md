# TrainingBot AI — A.1 Admin authentication source inventory

Date: 2026-10-29. Scope: read-only audit of connected GitHub source; website Production unchanged.

## Confirmed functional requirements
- Visitor: no registration or account login.
- Admin: must have a real Admin account and authenticated session to access Admin Center and Admin AI.
- Shared ADMIN_TOKEN is not proof of the identity of an individual administrator.

## Source findings
- overrides/admin.html loads 16 packed Admin V2 UI pieces. Decoded in memory for source analysis, never exported to logs.
- Current Admin login form contains loginForm and adminToken controls.
- The inspected Pages API handlers for users, posts, studio, visitor analytics and beta versions use env.ADMIN_TOKEN for shared-secret access checks.
- Previous deleted admin_auth.js and admin-auth Pages function, recoverable in commit 75377a4, implement one fixed Admin identity with TOTP tied to a shared upstream token; they are not present in current main and cannot establish a per-person Admin account.
- The separate v49 guest login Worker returns 404, but this is not a dependency of anonymous Visitor AI.
- The website D1 has user and session tables, but the personal Admin role authority and actual Admin session validation have not been verified.

## A.1 acceptance
**Source architecture inventory DONE.** Authenticated individual Admin access is **not** yet tested or implemented: it belongs to A.7, not a reason to repeat A.1.

## Next work
1. A.7: Implement a separate person-specific Admin account and revocable session on isolated Staging, with strong authentication, CSRF/brute-force protection, and server-authorized role.
2. A.7: Implement Visitor AI without login, with server-side rate and cost controls.
3. A.8: Test actual Admin sign-in on Staging and anonymous Visitor E2E, denial and revocation, isolated database, secure deployment.
4. A.9: Complete code provenance/license audit and close original phase A according to PASS/FAIL gates; do not modify Production without permission.

## Evidence
- Prior Admin integration tests: https://github.com/Gamevalentine/trainingbot-cloudflare/actions/runs/40609818732 (in-memory simulated credentials).
- Cloudflare original Worker audit: https://github.com/Gamevalentine/trainingbot-ai-core/actions/runs/40781496792
- Existing AI Preview: https://github.com/Gamevalentine/trainingbot-cloudflare/pull/26
