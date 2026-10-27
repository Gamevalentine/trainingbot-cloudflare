# TrainingBot P3.2–P3.5 — Consolidated Acceptance (Preview only)

Date: 2026-10-28. Owner authorized **combined QA and narrowly justified corrections** on Draft PR #6, **not** a production deployment or any D1 write.

## Scope and current evidence

| Track | Automated verification | Real-data limitations |
| --- | --- | --- |
| P3.2 Contact | Mock D1 persistence/validation, rate-limit, admin inbox auth, and browser form failure/success feedback; required-field labels clarified. | Preview deliberately denies POST /api/contact. A real D1 write and private admin inbox check are **not** performed. |
| P3.3 Beta & Flash download | Official public HEAD probes: 28 Oct 2026, Beta V4.7.3 HTTP 200 APK, Flash V4.6.1 HTTP 200 GitHub release asset, Flash V4.7.0 HTTP 200 APK. Local fake-stream tests cover counter updates only on initial GET, never HEAD/range; unreleased releases must not have download anchors. | HEAD success is **not** proof of a complete, safe or correct APK/XAPK. No full binary was downloaded, checksum/security provenance not yet independently verified. |
| P3.4 Wiki & news | M416/AKM select comparison, provenance uncertainty label, article source links, related articles, canonical/structured metadata, and malicious URL rejection; local browser news navigation. | Per-weapon editorial values and live D1 article template are **not** verified on production-equivalent D1. |
| P3.5 Sitewide | GitHub Actions local Playwright checks at 375/430/768/1280px, functional home, Wiki, contact, updates, news, search and security; Cloudflare Preview build; read-only public desktop browser navigation across five pages. | Real-device mobile, full Web Vitals, security audit and administrative operations remain outside this public Preview QA. |

## Corrections in this combined QA
1. Contact form shows an explicit required-field explanation and `*` on 4 required fields.
2. Article sanitizer rejects protocol-relative, control-character and backslash-based links, dangerous URL schemes and unsafe cover URLs.
3. One new Playwright suite runs contact UI, Beta release/no-download states, Wiki/news and responsive checks together with completely mocked API responses.
4. Website release branch **does not** contain the D1 backup workflow or exporter. User expressly stopped the backup work. Do **not** restore or invoke it.

## Preview safety
- Never send a real contact POST, download APK GET, mutate D1 or R2, query administrator routes, or merge PR #6 without explicit owner approval.
- Public Preview remains GET read-through on a strict allowlist. Download links are shown but automated QA does not click them.
- GitHub Actions run `node tools/qa/p3-2-5-regression.mjs` on local static files; the test aborts all non-local network requests and intercepts all API calls.
- CI and Pages build statuses must be checked on PR #6. A passing test **does not waive** the real-data limitations in the table.

## Release status
**HOLD — Draft PR #6 is not merged into production.** Functional Preview QA is a release-readiness step, not authorization to publish.
