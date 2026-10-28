# TrainingBot — SEO Recovery (sau giai đoạn I)

**Ngày:** 29/10/2026. **Nhánh:** `aion-trainingbot-seo-recovery-20261029`, base I PR #30, Preview-only. **Không merge Production.**

## Những gì đã biết (evidence)
- Google Search Console screenshot của chủ trang: property `trainingbot.io.vn`, **35 lượt click** trong biểu đồ, gần 0 ở cuối khoảng đang xem; GSC cảnh báo một bài PUBG MOBILE 4.7 Beta giảm **87% lượt hiển thị**. Đây **không chứng minh trang bị deindex** hay thứ hạng từ khóa `trainingbot` giảm do nguyên nhân cụ thể.
- Kiểm tra trực tiếp gần nhất: `/` và `/wiki` tải được, canonical trỏ `trainingbot.io.vn`, `index,follow` trên Production, robots cho phép, DNS còn hoạt động. Static sitemap có 22 URL; dynamic sitemap bài viết có 5 URL tại thời điểm đối chiếu. Số lượng và crawl status có thể thay đổi.
- Đã có kết quả tìm kiếm `site:trainingbot.io.vn` trả về một số trang từ công cụ tìm kiếm ngoài Search Console; **không dùng đó để khẳng định URL indexed bởi Google**.
- Công cụ GSC Wizard kết nối không thể truy cập do trial/subscription hết hiệu lực. Google Search Console chính thức miễn phí và vẫn sử dụng được; **chưa có URL Inspection/Pages report** để tìm lý do thực tế.

## SEO-R.1 — Trạng thái chỉ mục
Giữ nguyên các tín hiệu phù hợp đã có. Không gửi yêu cầu lập chỉ mục hàng loạt hay chỉnh robots tùy tiện.

Để xác định thật:
- Search Console → **Kiểm tra URL**: `https://trainingbot.io.vn/`, `https://trainingbot.io.vn/wiki` và bài 4.7 Beta bị cảnh báo; ghi `Page indexing`, `Google-selected canonical`, `last crawl`.
- Search Console → **Lập chỉ mục → Trang**: số Indexed / Not indexed, lý do `crawled - currently not indexed`, `discovered - currently not indexed`, `duplicate`, `blocked`, `404`, `soft 404`.
- **Hiệu suất** → tìm kiếm `trainingbot`, `trainingbot.io.vn`, `pubg mobile trainingbot`; so sánh impressions, CTR, vị trí và click trước/sau 19/10. Bật bộ lọc trang chủ riêng.
- **Sitemap**: xác nhận `sitemap.xml` và `sitemap-posts.xml` đã được Google đọc, số URL và lỗi. Chỉ yêu cầu lập chỉ mục lại khi URL đúng canonical và đủ điều kiện.

## SEO-R.2 — Nhận diện thương hiệu
- Sửa mô tả trang chủ và đoạn hero để nói rõ TrainingBot là trang tin/Wiki PUBG Mobile bằng tiếng Việt; title vẫn bắt đầu bằng TrainingBot.
- Giữ `Organization`/`WebSite` JSON-LD, URL/logo/canonical đã có; không tự chèn `sameAs` nếu chưa xác minh chính chủ.
- Không dùng `meta keywords` vô ích hoặc hứa đạt Top 1 Google.

## SEO-R.3 — Technical sitemap, index và API
- Middleware trả `X-Robots-Tag: noindex,nofollow` cho **toàn bộ Pages Preview branch** (kể cả static HTML/admin/sitemap), nhưng giữ nguyên phản hồi `trainingbot.io.vn`.
- `GET /sitemap-posts.xml` nay **chỉ đọc** bảng bài viết đã tồn tại; không tự `CREATE TABLE`/`ALTER TABLE` khi robot crawl. Đó là việc của migration riêng.
- QA giả lập D1, từ chối mọi write trên request GET; xác minh sitemap chỉ gồm slug hợp lệ, canonical Production, ngày lastmod có thể kiểm tra.
- Lưu ý trang chủ và trang Wiki Production chưa nhận được thay đổi SEO cho tới khi PR được chấp thuận và phát hành.

## SEO-R.4 — QA/bằng chứng
- Workflow `trainingbot-seo-recovery.yml`: build SEO Preview, kiểm tra brand/canonical/sitemap/preview noindex, P1 SEO, D1 Preview isolation, I NO-GO gate, H/G Browser regression, loại mã G/H khỏi build main, artifact JSON và screenshots.
- Chưa có bằng chứng thực tế Google xếp hạng cải thiện hoặc phục hồi 87%; đây là công việc ngoài phạm vi kỹ thuật, cần dữ liệu GSC sau khi sửa được phát hành.

## SEO-R.5 — Kế hoạch tiếp theo
1. Thu 3 kết quả URL Inspection và báo cáo Trang của Search Console; phân loại lỗi cụ thể, không suy đoán.
2. Sửa đúng URL/sitemap/canonical/404/nội dung nếu GSC xác nhận lỗi; chỉ sau review & chấp thuận mới triển khai.
3. Sau release, gửi sitemap trong Search Console chính thức và yêu cầu index các URL đủ điều kiện. Google không bảo đảm lập chỉ mục/rank.
4. Theo dõi impressions/CTR/vị trí với cùng khoảng đo 7/14/28 ngày, tách brand vs non-brand và bài PUBG 4.7 Beta.
5. Tiếp tục khóa phát hành toàn bộ Wiki V2 theo I NO-GO cho tới khi CMS, bản quyền/nguồn và backup đủ điều kiện.

**NO-GO cho phát hành toàn bộ Wiki V2 chưa được gỡ. SEO Preview chỉ để kiểm tra thay đổi, không tự merge Production.**
