# TrainingBot — SEO-06 đến SEO-10, ngày 29/10/2026

**Phạm vi:** sửa nội dung các danh mục quá mỏng, kiểm toán SEO/sitemap và chuẩn bị dữ liệu so sánh GSC. Bản sửa ở nhánh `aion-trainingbot-seo-06-10-20261029`, base `main` sau khi Wiki V2 đã phát hành.

## SEO-06: Indexing / Google Search Console
- **Chưa xác minh được bằng công cụ:** GSC Wizard báo `payment_required`, trial hết hiệu lực. Không thể truy cập chỉ mục, URL Inspection hoặc hiệu suất chi tiết qua plugin này.
- Ảnh chụp GSC do chủ trang cung cấp thể hiện tổng 35 clicks trong khoảng thời gian biểu đồ, gần 0 ở phần cuối, và cảnh báo một bài PUBG Mobile 4.7 Beta giảm 87% *impressions*. Không dùng ảnh này suy diễn là deindex.
- Chỉ chủ property hoặc quyền GSC phù hợp mới thực hiện URL Inspection/Request indexing từ tài khoản Google.

## SEO-07: Kiểm tra ba URL trọng yếu
- `https://trainingbot.io.vn/`
- `https://trainingbot.io.vn/wiki`
- `https://trainingbot.io.vn/bai-viet/pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay-dang-chu-y`

Cả ba đã được kiểm tra trực tiếp: trang tải được, canonical khớp URL chính, robot meta `index,follow`, nhưng **Google-selected canonical, trạng thái indexed, Last crawl chưa biết**.

## SEO-08: Bổ sung nội dung thật ở ba trang mỏng
`tools/seo/seo-category-enhance.mjs` chạy sau build, bảo tồn giao diện và canonical. Nó thay phần mô tả tạm bằng nội dung hữu ích và chèn một mục có ba liên kết thật:
- `/news-analysis`: cách đọc thay đổi Beta, liên kết bài 4.6, bài Beta 4.7 và Wiki.
- `/news-featured`: bài PUBG 4.7 Beta, Erangel Subzero 4.7.2, M416 Glacier Switch.
- `/news-update`: minh bạch rằng **chưa có phỏng vấn đã kiểm chứng**; mời gửi thông tin và liên kết Community/Contact/Góc nhìn người chơi, không bịa trích dẫn.

Không đưa các số liệu không có nguồn, không thay đổi nội dung các bài gốc. Browser QA 390/768/1440 kiểm tra hiển thị, 3 liên kết/mục, focus bàn phím, không tràn ngang.

## SEO-09: Sitemap
- Sitemap tĩnh trên Production có **22** URL, sitemap bài đăng có **5** URL tại lúc kiểm tra; robots trỏ đến cả hai.
- Các URL trên sitemap có canonical thuộc domain và đường dẫn không trùng trong build. Việc khai báo `index,follow` **không đảm bảo Google chọn index**.
- Không gửi sitemap hay bấm Request indexing thay chủ tài khoản vì chưa có quyền GSC API. Sau khi có quyền truy cập: mở [Google Search Console](https://search.google.com/search-console) → Sơ đồ trang web → nhập `sitemap.xml`, `sitemap-posts.xml` nếu chưa gửi; kiểm tra `Success`, `Last read` và `Discovered URLs`. Dùng URL Inspection cho ba URL chính.
- Google nêu rõ request crawling không bảo đảm được index hoặc ranking.

## SEO-10: Mốc đo 7/14/28 ngày
**Mốc tính:** 29/10/2026. Lưu mẫu JSON ở `seo-06-10-artifacts/technical-and-gsc-baseline.json` sau CI; không tạo giả dữ liệu hiệu suất.

| Mốc | Ngày | Clicks | Impressions | CTR | Avg position |
|---|---|---|---|---|---|
| Baseline screenshot | 29/10 | 35 (tổng trong biểu đồ, khoảng thời gian chưa xác thực) | chưa có | chưa có | chưa có |
| +7 ngày | 05/11 | — | — | — | — |
| +14 ngày | 12/11 | — | — | — | — |
| +28 ngày | 26/11 | — | — | — | — |

Khi có GSC, so sánh **các khoảng cùng độ dài**, tách query `trainingbot`, `trainingbot.io.vn`, `pubg mobile trainingbot`, trang chủ, Wiki và bài 4.7 Beta. GSC có thể trễ số liệu; tuyệt đối không gán mọi thay đổi trong SEO cho một nguyên nhân khi chưa đối chiếu.

## Điều kiện nghiệm thu và kế hoạch tiếp theo

- [x] SEO-06/07: kiểm tra nguồn hiện có và ghi rõ phần không thể đọc từ GSC.
- [x] SEO-08: tạo code nâng cấp ba chuyên mục và UI/browser QA.
- [x] SEO-09: tạo kiểm thử sitemap/URL/canonical, không tự gửi lên GSC.
- [x] SEO-10: tạo biểu mẫu baseline và ngày đánh giá.
- [ ] CI SEO + hồi quy Wiki PASS trên commit cuối.
- [ ] Cloudflare Preview và Production sau merge được xác minh trực tiếp.
- [ ] Google indexed status và bản đồ lỗi trang (Search Console) **chưa có bằng chứng**.
- [ ] Actual Google sitemap submission, URL indexing requests và mốc tương lai: **chưa diễn ra**.

**Tiếp theo:** lấy báo cáo GSC Pages/URL Inspection; sửa cụ thể các lỗi được xác nhận (404, canonical, noindex, crawled-not-indexed, thin content) theo ưu tiên; đo 7/14/28 ngày; kiểm toán các category pages khác và tăng chất lượng nguồn/ảnh Wiki.
