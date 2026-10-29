> B.1 update: Visitor Preview chat is now connected and verified end to end. Production remains unchanged. See B1-visitor-preview-bff.md for evidence. The older notes below are historical.

# TrainingBot AI — A.1/A.7 Preview access requirements (corrected 2026-10-29)

## Owner-confirmed product requirements
1. **Visitor:** Public website and Visitor AI must not ask guests to register or login.
2. **Admin:** Admin Center and Admin AI require an authenticated Admin account. Shared ADMIN_TOKEN alone is not a per-person Admin account.
3. Guest account registration/login UI and v49 user tables are legacy/mistaken website features; **do not delete Production UI/data without owner approval or dependency audit**.

## Preview implementation in this branch
- Visitor UI text and readiness checks now accept server-side `anonymousVisitorReady` **instead of an authenticated personal identity**.
- Admin UI still requires `identityVerified:true`, `surfaces.admin:true` and `ready:true`.
- The read-only Preview status explicitly returns `anonymousVisitorReady:false`, `ready:false`, `surfaces.visitor:false`, `surfaces.admin:false`: **neither chat is publicly enabled**.
- Pages Preview middleware still blocks POST/chat and non-allowlisted API GET; no Production D1/Worker routes are forwarded.
- Existing synthetic signed Visitor/Admin Staging E2E tests PASS but **do not** constitute anonymous Visitor readiness or real Admin account verification.

## Remaining A-phase gates
- **A.1:** Determine the live Admin identity mechanism (currently Pages admin APIs use shared token; historic two-factor Admin source is not individual v49 user login). Track obsolete guest-account links without deleting them.
- **A.7 Visitor:** Build a separate anonymous access policy with bounded per-client identity, server-side rate/cost enforcement, bot-defense, safe session management, no guest registration and no client-controlled role claims. QA should prove requests cannot evade controls by issuing unlimited new visitor sessions.
- **A.7 Admin:** Separately verify one real individual Admin account against trusted server authority, proper session creation/expiry/revocation, and role downgrade.
- **A.8:** Cloudflare Staging end-to-end for anonymous Visitor and authenticated Admin, including cross-role denial, DoS/rate-limit cases, D1 isolation and cleanup.
- **A.9:** Code provenance/license audit and acceptance sign-off.
- Website and AI Production must not be changed before explicit owner permission. PR #26 remains Draft.

## Reason earlier plan was wrong
Guest login source recovery was mistakenly made a prerequisite to Visitor AI; owner confirmed guest accounts were added to the website in error. Finding original v49 guest login Worker is **no longer the critical path**. Its absence remains a legacy-code inventory finding, not a justification to hold the whole AI Core architecture hostage.
