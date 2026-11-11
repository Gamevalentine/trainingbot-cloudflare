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

## B.1 configuration and acceptance — PASS, Preview only

- The owner granted a scoped Pages token in GitHub Actions and the Pages API returned HTTP 200.
- The first-party Pages Preview service binding `TRAININGBOT_AI_STAGE_WORKER` points only to `trainingbot-ai-staging`.
- A fresh 256-bit signing secret `TRAININGBOT_AI_PREVIEW_BRIDGE_SECRET` was installed in Pages **Preview** and isolated AI Staging, not website Production. Secret values are never in this repository.
- Production environment config was compared before and after the Pages API update and found **unchanged**. [Configuration workflow PASS](https://github.com/Gamevalentine/trainingbot-ai-core/actions/runs/40790752075).
- After a Preview-only redeployment, `/api/ai-preview/status` returns Visitor ready and Admin false.
- Actual live Pages GET/POST QA proved: no-account guest session, signed HttpOnly cookie, first AI answer, second message with the same conversation ID, guest role spoofing denial, cross-origin rejection, missing cookie denial, and legacy Admin mutation 403. [Live first-party Preview E2E PASS](https://github.com/Gamevalentine/trainingbot-ai-core/actions/runs/40791116172).
- Cloudflare Workers does not implement `redirect: "error"`. A runtime TypeError was found and fixed with `redirect: "manual"`; every non-allowlisted response (including HTTP 3xx) continues to be rejected. The regression has automated coverage.
- [Source/build/Preview middleware CI](https://github.com/Gamevalentine/trainingbot-cloudflare/pull/26) remains on a **Draft, unmerged** pull request.

## B.1 decision and next steps

**B.1 Preview Visitor AI integration: PASS.** Live website `trainingbot.io.vn` still uses the existing Production resources; nothing was merged or released there.

Next **B.2**: improve chat UI, reset/clear conversation, readable error and limit states, loading behavior, PC/mobile layout, and run browser QA. Admin login and Admin AI are separately gated; do not open them as part of Visitor B.2. Before publishing Production, complete abuse/cost controls, vendor/license review and obtain explicit approval.
