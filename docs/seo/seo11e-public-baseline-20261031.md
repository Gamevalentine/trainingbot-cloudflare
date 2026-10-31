# SEO-11.E — Search performance and technical baseline (31/10/2026)

## Search Console status
**BLOCKED — FIRST-PARTY SEARCH PERFORMANCE NOT ACCESSED.** GSC Wizard account returned `payment_required` / `subscription_required`, so no clicks, impressions, CTR, average position or URL Inspection outcomes could be read. Do **not** write zero or claim indexing has improved. The owner prefers 0đ and should not be asked to pay just for this audit. An optional alternative connector (Windsor.ai) supports GSC when user connects Google; do not assume its costs or permissions.

## Public audit, separate from Google analytics
- Site: https://trainingbot.io.vn/
- Priority: homepage `/`, Wiki `/wiki`, Beta `/ban-cap-nhat`, five article URLs from `/sitemap-posts.xml`.
- `/robots.txt` explicitly links `/sitemap.xml` and `/sitemap-posts.xml`.
- Public pages previously observed: index,follow; canonical equals production URL for homepage, Wiki and Beta.
- Initial public sitemap sample: 22 static URLs and 5 article URLs. These are **URLs published to a sitemap**, not “27 indexed URLs”.
- The CI script `tools/seo/seo11e-public-baseline.mjs` rechecks each URL, canonical and noindex via read-only GET and produces a dated JSON artifact. If the script flags a problem, inspect the artifact. No site code, Cloudflare deploy, Worker, Admin, D1 or images are modified.

## Measurement design (once permission/data becomes available)
- Google Search Console property must be checked using list_sites in whichever connector works; do not guess if it is `sc-domain:trainingbot.io.vn` or a URL-prefix property.
- Use Google Web Search performance, preferably **settled** days (typically 2–3 days old), not the most recent incomplete day.
- Baseline window suggestion: 2026-10-01 to 2026-10-28 (28 days), compare the immediately preceding 28 days when actual data is available. Also produce 7- and 14-day windows with identical completeness rules.
- Report separately for `/`, `/wiki`, `/ban-cap-nhat`, each `/bai-viet/...` page, and relevant non-brand queries `pubg mobile beta`, `pubg mobile wiki`, `pubg mobile 4.7 beta`. Exclude `trainingbot` only through appropriate query filters; Google anonymized queries can make filtered counts incomplete.
- Metrics: clicks, impressions, CTR (%), average position; page-level query rows; site totals must not be guessed from truncated query rows.
- For **indexing**, use GSC URL Inspection / Page Indexing; a public canonical and `index,follow` only mean technical eligibility. Log Google-selected vs user-declared canonical, last crawl, verdict.
- Because SEO-11.B/C/D/D.2 changes were deployed on **31 October 2026**, data ending on or before **28 October** is a pre-change baseline, **not a post-deploy uplift measurement**.
- Do not claim SEO gains on day 0, do not backfill invented Google stats.

## Next action
1. Confirm a Search Console connection that provides readable property data without imposing unexpected charges.
2. Run authenticated 28-day site/page/query performance, plus URL Inspection of five article URLs, homepage, Wiki and Beta.
3. Compare to the baseline after Google has re-crawled and enough settled post-deploy data exists; annotate technical changes on 31 October 2026.
4. Re-run the public audit after production content changes; investigate any non-200 URL, canonical conflict or noindex finding before submission.
