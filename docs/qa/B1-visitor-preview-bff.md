# TrainingBot AI — B.1 Visitor Preview BFF handoff (2026-10-29)

## Confirmed product requirement
- Public visitors must **not** register or log in.
- Admin is a distinct, individually authenticated account; B.1 does NOT unlock Admin AI.
- Website Production must stay unchanged until explicit owner release approval.

## B.1 implemented in PR #26
- `functions/_lib/ai_preview_bff.js`: same-origin Pages Preview BFF. It has **no** Production D1/R2/legacy Worker calls; only the named `env.TRAININGBOT_AI_STAGE_WORKER.fetch()` service binding.
- `GET /api/ai-preview/status`: returns `ready:true` only after the named Staging service binding and 256-bit HMAC secret both exist and the Staging signed readiness check succeeds. No binding => `ready:false`; all Admin readiness remains false.
- `POST /api/ai-preview/session`: zero-argument anonymous session bootstrap, opaque signed `__Host-tb_ai_b1` cookie (Secure, HttpOnly, SameSite=Strict), bound to Preview hostname and hashed visitor IP. Never accepts browser account, role or token.
- `POST /api/ai-preview/chat`: checks Origin, the guest cookie signature/expiry/IP, strict message shape, forwards only visitor ID, optional owned conversation ID and user message to trusted service binding.
- Requests to Staging have HMAC signature over method, exact fixed route, timestamp, nonce, client-IP hash and request-body digest. The shared key never appears in client JavaScript, HTML, logs, URL or Git.
- Preview middleware adds exactly two POST exceptions (Visitor session/chat) and retains existing deny rule for all other Preview mutating API/legacy/Admin requests. Production/custom domains cannot use the BFF.

## Evidence
1. Preview source, isolation and signed mock service binding: [CI PASS](https://github.com/Gamevalentine/trainingbot-cloudflare/actions/runs/40788302661).
2. Cloudflare Staging real Workers AI signed BFF protocol, anonymous model answer, replay/IP/role defense, D1 schema: [LIVE QA PASS](https://github.com/Gamevalentine/trainingbot-ai-core/actions/runs/40788787453).
3. Independent Staging teardown: temporary bridge secret absent, session/replay tables empty and public bridge locked: [cleanup PASS](https://github.com/Gamevalentine/trainingbot-ai-core/actions/runs/40789016383).
4. Cloudflare GitHub PR comment shows **Preview deployed** for commit `2742740`, immutable URL `https://8d5b5e8e.trainingbot-cloudflare.pages.dev`, branch URL `https://preview-ai-identity-bridge.trainingbot-cloudflare.pages.dev`.
5. Read-only live Preview smoke: HTML/JS BFF bootstrap PASS; `/api/ai-preview/status` returns `ready:false` as required until service binding/secret configured; [evidence](https://github.com/Gamevalentine/trainingbot-ai-core/actions/runs/40789293275).
6. Cloudflare Pages project metadata API via the currently provisioned AI Core `CLOUDFLARE_API_TOKEN`: **HTTP 403** (no Pages access). [read-only inventory](https://github.com/Gamevalentine/trainingbot-ai-core/actions/runs/40788541903).

## Exact missing configuration — NOT DONE
1. A **Cloudflare Pages Preview-only** Service Binding named `TRAININGBOT_AI_STAGE_WORKER` pointing to `trainingbot-ai-staging` (NEVER an existing TrainingBot Production Worker).
2. A 256-bit secret `TRAININGBOT_AI_PREVIEW_BRIDGE_SECRET`, matching on **Pages Preview only** and **AI Staging Worker only**. It must be generated and installed through a secure server-side deployment workflow, not emailed/pasted/chat.
3. Verify the Pages project belongs to the expected Cloudflare account and is exactly `trainingbot-cloudflare`; verify production_branch `main` and that Preview and Production deployment configs are separate. Preserve all existing bindings and vars (do not PATCH blindly).
4. Require a credential with Cloudflare **Pages Read/Edit** permission for this account. Current read-only inventory returns HTTP 403; user action is required to authorize Pages settings access before the assistant can configure them. No secret should be pasted in chat.

**Owner action when ready:** Create an account-scoped Cloudflare API token with Cloudflare Pages Edit permission, and save it as **`CLOUDFLARE_PAGES_PREVIEW_TOKEN`** under GitHub repository `Gamevalentine/trainingbot-ai-core` → Settings → Secrets and variables → Actions. Do not replace `CLOUDFLARE_API_TOKEN`, which is used for isolated AI Staging only. Token need not grant D1/Production edit. This connection requires the owner's explicit action and may be restricted by Cloudflare account permissions.

## QA/release constraints
- Never treat no service binding as success; in the deployed Preview status `ready:false` currently.
- A successful Worker-side Staging test alone is **not** an actual Pages-to-Staging service-binding test.
- After Preview-only binding is configured, run browser/real network E2E to confirm anonymous Visitor chat. Then move to B.2. Admin remains separate for B.4.
- Production release and AI widget activation on `trainingbot.io.vn` require independent owner approval and security/cost/abuse checks.

## B.1 acceptance
**Source + real independent Staging Worker protocol PASS. Live first-party Preview-to-Staging binding NOT VERIFIED / BLOCKED BY PAGES PERMISSION.** Do not claim B.1 end-to-end completion until Preview binds are installed and live Pages session/chat passes.
