# TrainingBot — P2 public release acceptance

Scope: the Draft PR #6 preview branch only. Production domain: `trainingbot.io.vn`.
This file is a release checklist; it does not authorize merging or deploying.

## Checked in CI

- Search: meaningful loading/empty/error/retry states; static + dynamic merged; relative same-origin routes only; text escaped; keyboard focus restoration; mobile 375px and desktop 1280px
- Performance: search index is fetched only after users type; cache refresh <=5 minutes; active carousel poster loads eagerly; critical content remains in place. Lab DOMContentLoaded and resource request counts are reported by CI on a **local** server, not measured real-user Web Vitals.
- Security (public static): HSTS, X-Frame-Options, nosniff, Referrer/Permissions Policy retained; CSP adds only safe baseline directives `base-uri`, `object-src`, `frame-ancestors`. A full script CSP is not enabled, because legacy scripts and TikTok must be audited first.
- Regression: all P0 and P1 scripted tests, 375/430/768/1280px, download HEAD tests. Builds must pass on both GitHub Actions and Cloudflare Preview.
- Preview live header probe logs Cloudflare response values; release review must inspect logs and investigate missing headers. Cloudflare Pages static `_headers` rules do **not** automatically protect dynamic Function responses.

## Must remain on HOLD before production merge

- P0: contact form actual end-to-end D1 write and staff inbox read in production-equivalent test environment is not confirmed; Preview has no writable D1. No real submission has been done.
- P0: actual complete APK/XAPK download, file integrity and safe provenance for current versions not verified. HEAD=200 is not proof of file integrity/security.
- P1: per-weapon Wiki version/source/verification date has not been editorially confirmed. Display the uncertainty instead of inventing values.
- P1: dynamic D1 article template tests PASS with mock data, but Preview proxies the current production article HTML; verify the new template in an environment with test D1 prior to merge.
- P2: live field performance (Core Web Vitals under real CDN/device conditions), script-src CSP assessment, admin/API authorization, rate-limiting at edge, and independent security penetration tests remain out of scope for this public-only Preview.
- Final owner approval, backup/rollback confirmation and explicit publish authorization have not been given.

**Safety:** No production DB mutation, no APK GET or real contact form POST, no admin changes, no merge.
