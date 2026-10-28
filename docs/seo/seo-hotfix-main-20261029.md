# SEO TrainingBot — Hotfix độc lập, base main

**Ngày 29/10/2026.** Nhánh `aion-trainingbot-seo-hotfix-main-20261029` kế thừa trực tiếp `main`. Không chứa các nhánh Wiki V2 A–I chưa nghiệm thu Production.

## Những phần đã sửa
1. **Trang chủ / nhận diện thương hiệu:** Đoạn giới thiệu chính xác hơn: TrainingBot là website tiếng Việt về tin tức, Beta, Wiki PUBG Mobile. Description trang chủ trong `build.sh` đồng nhất. Không thêm keywords bịa hoặc hứa xếp hạng.
2. **Preview không lập chỉ mục:** Middleware gắn `X-Robots-Tag: noindex, nofollow` cho mọi phản hồi Preview branch Pages, cả HTML tĩnh. Production `trainingbot.io.vn` giữ `index,follow`, canonical gốc và không bị can thiệp.
3. **Sitemap bài viết:** Loại bỏ chạy `CREATE TABLE` và `ALTER TABLE` khỏi yêu cầu `GET /sitemap-posts.xml`. Sitemap chỉ đọc các bài `published`; cập nhật schema phải dùng migration riêng, không làm khi bot crawl.
4. **QA:** Kiểm tra title, hero, Organization + WebSite JSON-LD, robots, canonical, sitemap tĩnh/dynamic, Preview noindex, Production index, giả lập D1 không cho phép ghi, và D1 Preview isolation. Đảm bảo không đính kèm Admin/Wiki V2 chưa phát hành.

## Vấn đề chưa thể chốt
- Google Search Console screenshot cho thấy 35 clicks trên biểu đồ và bài PUBG 4.7 Beta bị giảm 87% impressions; số liệu này **không chứng minh deindex**, cũng không xác nhận nguyên nhân giảm hạng.
- Search Console API qua GSC Wizard từ chối truy vấn vì không có subscription; không thể kiểm tra URL Inspection hoặc indexing verdict qua connector. Chủ website có thể xem miễn phí tại `https://search.google.com/search-console`.
- Chưa có bằng chứng thứ hạng từ khóa `trainingbot` phục hồi, không có CTR/impressions mới nhất sau phát hành. Chỉ báo kỹ thuật PASS, không phải Google rank PASS.
- PR này **Preview-only và chưa merge**; không cập nhật website chính cho đến khi bạn chấp thuận.

## Kế hoạch tiếp theo
SEO.1: kiểm tra trực tiếp Indexing > Pages và URL Inspection của trang chủ, Wiki và bài PUBG 4.7 Beta; SEO.2: xác định loại lỗi và sửa URL có thật; SEO.3: nghiệm thu hotfix Preview, sau chấp thuận riêng phát hành; SEO.4: yêu cầu Google thu thập lại các URL đủ điều kiện / nộp sitemap; SEO.5: theo dõi 7/14/28 ngày, so sánh branded impressions/CTR/position trước và sau, không đánh đồng biến động với tác động SEO.
