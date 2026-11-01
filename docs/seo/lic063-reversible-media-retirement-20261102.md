# LIC-06.3 — Giới hạn truy cập công khai 5 ảnh cũ bằng chuyển hướng đảo ngược được

Ngày: 02/11/2026. Quyền của 5 bản ảnh cũ vẫn chưa được xác nhận; trước khi sửa, cả 5 URL trả HTTP 200 và SHA-256 khớp hồ sơ LIC-05.

## Phạm vi xử lý

Middleware Cloudflare Pages `functions/_middleware.js` nhận GET/HEAD, kiểm tra **chính xác** 5 URL đã lập sổ LIC-02/LIC-05, gồm 4 đường `/user-posts/` và ảnh dùng chung `/news-pubg-mobile-4-6-cover.webp`.
Đối với 5 URL này, trả HTTP **302** tới `https://trainingbot.io.vn/editorial-original-trainingbot-share.png`, `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`, không có body ảnh cũ.
Những URL khác vẫn đi qua các đường middleware/R2/Pages thông thường. Kiểm tra dùng được trên cả Production và Preview, không phụ thuộc cookie, tài khoản hay CORS.

## Vì sao chọn 302 tạm thời thay vì xóa hoặc 410 vĩnh viễn

- Không xóa dữ liệu R2, D1, nội dung bài hoặc backup; hoàn tác bằng revert commit của middleware và chạy lại QA.
- 302 sang ảnh TrainingBot tự tạo giúp các đường nhúng hình bên ngoài vẫn tải được một đồ họa hợp lệ; link không bị 404.
- `no-store` tránh khách/cache trung gian lưu một quyết định chưa xử lý xong về quyền ảnh. `noindex` hạn chế việc tiếp tục lập chỉ mục URL gốc.
- Kết quả không chứng minh rằng từng tệp được cấp phép hoặc không còn tồn tại ở nguồn lưu khác; chỉ xác minh đường public Pages đã ngừng trả byte gốc.

## Bằng chứng an toàn từ LIC-04 → LIC-06.2

- Năm bài D1 có ảnh SVG riêng và PNG OG/Twitter riêng; metadata của 35 trang khác đã chuyển sang ảnh gốc chung. Các tệp build đã kiểm tra không còn tham chiếu ảnh cũ.
- API `functions/api/posts.js` trả cover SVG của đúng 5 bài cho cards công khai, trong khi dữ liệu D1 `cover_url` gốc được giữ nguyên.
- Bộ kiểm thử mock chặn 5 URL trên hai hostname Production và một hostname Preview, GET/HEAD, kể cả đường dẫn `%75ser-posts` mã hóa.
- Bộ kiểm thử đảm bảo URL minh họa mới, đường Wiki, News và đường ảnh khác vẫn đi qua middleware như trước, không đọc bucket R2 cho URL đã nghỉ.
- QA Production sau release kiểm chứng 5 URL × 2 hostname × GET/HEAD, đúng 302, cả 5 bài D1 công khai vẫn đọc và hiển thị ảnh riêng.

## Giới hạn và việc còn lại

Không tự nhận bản quyền của các tệp gốc. Chưa kiểm toán toàn bộ ảnh khác của TrainingBot, chưa kiểm soát URL gốc có thể tồn tại trên R2 endpoint độc lập, và chưa có chứng cứ cấp phép của tất cả ảnh ngoài phạm vi 5 tệp này.
Giữ Issue #61 và #72 mở cho LIC-06.4: kiểm kê ảnh ngoài phạm vi, kiểm tra endpoint storage/CDN độc lập và xử lý hồ sơ quyền thực tế. D2.10 chỉ được nghiệm thu phù hợp phạm vi có bằng chứng, không tuyên bố toàn website sạch bản quyền.

Rollback không yêu cầu truy cập R2: bỏ `LIC063_RETIRED_MEDIA` và lệnh early-return middleware trong PR này; mặc định SEO vẫn giữ ảnh TrainingBot tự tạo để không tái đăng ảnh chưa rõ quyền.
