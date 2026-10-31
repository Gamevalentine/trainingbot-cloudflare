# LIC-06.1 — Phân loại chính xác 35 tệp dùng ảnh chia sẻ cũ

**Kiểm tra thực tế:** GitHub Actions build `CF_PAGES_BRANCH=main`, audit riêng chỉ đọc `node tools/seo/lic061-classify-shared-image.mjs`, đối chiếu thêm với LIC-05. Ngày 31/10/2026, bản code trên PR #74. Không gọi API ghi, không thay ảnh hoặc D1/R2.

## Nguyên nhân cấu hình

Trong `build.sh` có biến `defaultShareImage` bằng `https://trainingbot.io.vn/news-pubg-mobile-4-6-cover.webp`. Vòng lặp SEO áp dụng mặc định cho trang không chọn ảnh bài riêng, tạo thẻ `og:image`, `twitter:image` và `WebPage.primaryImageOfPage` trong JSON-LD; riêng tin PUBG Mobile 4.6 có thêm `NewsArticle.image` JSON-LD.

## Kết quả đã kiểm chứng

- **35/35 tệp** khớp mốc kiểm toán LIC-05, tổng **106 tham chiếu**: 35 OpenGraph, 35 Twitter, 36 JSON-LD.
- **0 lần** tham chiếu ảnh cũ trong `<img>`, CSS background, script hiển thị, liên kết hoặc tài sản tĩnh JS/CSS.
- **16 tệp indexable** (6 trang điều hướng chính + 10 trang công khai khác), **19 tệp noindex** (14 mobile cũ + 3 Wiki phục hồi + 1 account + 1 alias Beta).
- Dữ liệu báo cáo có cả số dòng, snippet nguồn, canonical, robots và loại tham chiếu; được upload artifact từ workflow LIC-06.1. Không suy số trang này là toàn bộ website.
- Các tệp ảnh cũ vẫn trả HTTP 200 theo LIC-05, chưa xác minh quyền sử dụng; phân loại không được coi là chứng cứ cấp phép.

## Danh sách 35 tệp và từng vai trò

| Tệp | Phạm vi | Robots | Tham chiếu ảnh cũ |
|---|---|---|---|
| `ban-cap-nhat.html` | main_navigation | index,follow | OG, Twitter, JSON-LD |
| `community.html` | main_navigation | index,follow | OG, Twitter, JSON-LD |
| `contact.html` | main_navigation | index,follow | OG, Twitter, JSON-LD |
| `index.html` | main_navigation | index,follow | OG, Twitter, JSON-LD |
| `news.html` | main_navigation | index,follow | OG, Twitter, JSON-LD |
| `wiki.html` | main_navigation | index,follow | OG, Twitter, JSON-LD |
| `news-analysis.html` | other_public | index,follow | OG, Twitter, JSON-LD |
| `news-community.html` | other_public | index,follow | OG, Twitter, JSON-LD |
| `news-esports.html` | other_public | index,follow | OG, Twitter, JSON-LD |
| `news-featured.html` | other_public | index,follow | OG, Twitter, JSON-LD |
| `news-pubg-mobile-4-6.html` | other_public | index,follow | OG, Twitter, JSON-LD ×2 |
| `news-update.html` | other_public | index,follow | OG, Twitter, JSON-LD |
| `news-versions.html` | other_public | index,follow | OG, Twitter, JSON-LD |
| `privacy.html` | other_public | index,follow | OG, Twitter, JSON-LD |
| `terms.html` | other_public | index,follow | OG, Twitter, JSON-LD |
| `tim-dong-doi.html` | other_public | index,follow | OG, Twitter, JSON-LD |
| `mobile/community.html` | legacy_mobile | noindex,follow | OG, Twitter, JSON-LD |
| `mobile/contact.html` | legacy_mobile | noindex,follow | OG, Twitter, JSON-LD |
| `mobile/detail.html` | legacy_mobile | noindex,follow | OG, Twitter, JSON-LD |
| `mobile/index.html` | legacy_mobile | noindex,follow | OG, Twitter, JSON-LD |
| `mobile/news.html` | legacy_mobile | noindex,follow | OG, Twitter, JSON-LD |
| `mobile/updates.html` | legacy_mobile | noindex,follow | OG, Twitter, JSON-LD |
| `mobile/wiki.html` | legacy_mobile | noindex,follow | OG, Twitter, JSON-LD |
| `mobile_recovered_v79/community.html` | legacy_mobile | noindex,follow | OG, Twitter, JSON-LD |
| `mobile_recovered_v79/contact.html` | legacy_mobile | noindex,follow | OG, Twitter, JSON-LD |
| `mobile_recovered_v79/detail.html` | legacy_mobile | noindex,follow | OG, Twitter, JSON-LD |
| `mobile_recovered_v79/index.html` | legacy_mobile | noindex,follow | OG, Twitter, JSON-LD |
| `mobile_recovered_v79/news.html` | legacy_mobile | noindex,follow | OG, Twitter, JSON-LD |
| `mobile_recovered_v79/updates.html` | legacy_mobile | noindex,follow | OG, Twitter, JSON-LD |
| `mobile_recovered_v79/wiki.html` | legacy_mobile | noindex,follow | OG, Twitter, JSON-LD |
| `wiki_recovered/v37/wiki-m416-skins.html` | legacy_recovered_wiki | noindex,follow | OG, Twitter, JSON-LD |
| `wiki_recovered/v37/wiki-m416.html` | legacy_recovered_wiki | noindex,follow | OG, Twitter, JSON-LD |
| `wiki_recovered/v38/wiki-m416-skins.html` | legacy_recovered_wiki | noindex,follow | OG, Twitter, JSON-LD |
| `account.html` | account | noindex,follow | OG, Twitter, JSON-LD |
| `updates.html` | duplicate_beta_alias | noindex,follow | OG, Twitter, JSON-LD |

## Quyết định cho LIC-06.2

**Đủ điều kiện kỹ thuật để thay một điểm cấu hình SEO**, thay vì chỉnh 35 HTML file. Tuy nhiên phải đáp ứng đủ:

1. Tạo một PNG 1200 × 630 của **TrainingBot nói chung**, thiết kế gốc không chèn ảnh nhân vật, logo thương mại, screenshot, game-art hoặc font được cấp phép mơ hồ. Không dùng ảnh Erangel/Beta cho trang Wiki/Cộng đồng.
2. Đổi `defaultShareImage` trong `build.sh`; không đổi canonical, robots, title/description, URL bài viết, D1/R2 hoặc backup; không tự đổi những ảnh bài viết có ảnh riêng.
3. Test mọi tệp build: 35 `og:image` + 35 `twitter:image` + 36 JSON-LD chuyển sang URL PNG mới, zero ảnh dùng chung cũ trong những tệp này; kiểm tra PNG 1200×630 HTTP 200 và `Content-Type=image/png` trên Preview.
4. Kiểm thử SEO, Wiki desktop/mobile, D2 integrity và Cloudflare Pages; chỉ merge khi PASS. Hậu kiểm các trang chính, trang noindex cũ và các bài D1 vẫn hiển thị đúng ảnh riêng.
5. Không xóa/chặn URL ảnh cũ trước kiểm toán LIC-06.3 riêng; quyền ảnh cũ vẫn UNVERIFIED và Issue #61 vẫn mở cho đến khi giải quyết phạm vi tồn dư.

**Trạng thái:** LIC-06.1 hoàn thành phần phân loại; LIC-06.2 chưa thực hiện phát hành hay sửa ảnh. Không đóng D2.10-FINAL tại bước này.
