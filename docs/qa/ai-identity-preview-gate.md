# TrainingBot AI — Preview login gate

This branch is isolated from Pages Production. Never merge to main until the authoritative per-user login authority is available and verified.

## Prepared
- /ai-preview.html: responsive Visitor AI interface, pending real login.
- /ai-admin-preview.html: separate Admin AI interface, individually verified Admin role required.
- /api/ai-preview/status: Preview-host-only read-only readiness endpoint, always `identityVerified:false` until the backend has a real per-person account verifier.
- Preview middleware continues to reject all POST/mutations and non-allowlisted API GET requests. Only GET /api/ai-preview/status passes to the isolated handler.
- No source code, cookie, token, password, or D1 Production data is shared with the AI Worker or browser.

## Backend dependency (HOLD)
Main website uses a Pages API fallback proxy to a separate `trainingbot-cloud.ai-vn.workers.dev`. Current source repo does not provide that upstream Worker's account-session verifier, revocation event, Admin role source, or a trusted preview-only authentication connector. Admin Pages' shared ADMIN_TOKEN is not individual identity.

The matching AI Core change `d487cd2` provides an internal live-status guard with tests: suspensions revoke Visitor/Admin; Admin role removal revokes Admin only; logout invalidates both. **Those tests are mocked; real website account lifecycle is not yet integrated.**

## Integration acceptance
1. Obtain upstream auth source/specification and implement trusted server-only per-person verification, with a distinct Preview-only test cohort.
2. Cross-check CSRF, cookie SameSite/HttpOnly, no client-stored bearer keys, replay/expiry, and role changes.
3. Add server-side first-party AI BFF, then enable the readiness flag only if verification is live. Keep API deny-by-default otherwise.
4. Prove real users, account lock, Admin downgrade, logout, D1 isolation and browsing experience before any release to Production.
