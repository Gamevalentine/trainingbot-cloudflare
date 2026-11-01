# LIC-06.2 — Thay ảnh chia sẻ dùng chung của TrainingBot

Ngày triển khai: 02/11/2026. Phạm vi: 35 tệp SEO metadata đã kiểm toán tại LIC-06.1. Không đổi giao diện, URL bài, canonical, robots, D1 hoặc R2.

## Nguồn tạo ảnh

- PNG 1200 × 630 `editorial-original-trainingbot-share.png` được tạo bởi `tools/seo/lic04-build-png.mjs`, có thiết kế hình học + chữ `TRAININGBOT`, `NEWS / WIKI` và màu xanh trên nền tối, không tải ảnh hoặc font ngoài.
- Không chứa artwork game, biểu trưng PUBG/anime hoặc ảnh chụp. Nhắc đến chủ đề website bằng chữ mô tả; không hàm ý quan hệ chính thức với nhà phát hành.
- Bản cũ `news-pubg-mobile-4-6-cover.webp` có SHA-256 `e80a02798aeb6098aa8d364e06ada9d948f119d7dae6a4c01860aa11663283ca`, **không được sửa hay xóa**. Quyền sử dụng ảnh cũ vẫn UNVERIFIED.

## Thay đổi chính xác

- `build.sh`: thay duy nhất `defaultShareImage` bằng `https://trainingbot.io.vn/editorial-original-trainingbot-share.png`. Đây là mặc định SEO cho các trang tĩnh không có cover riêng.
- Khi build: 35 thẻ OG và 35 Twitter cùng 36 giá trị JSON-LD được kiểm tra trỏ sang ảnh mới. Không thay thẻ `<img>` trong nội dung.
- 19 trang `noindex` vẫn `noindex`, 16 trang có thể lập chỉ mục vẫn giữ nguyên canonical/robots. SEO không hứa hẹn tăng thứ hạng.
- Năm bài D1 đã thay SVG/PNG riêng ở LIC-04 tiếp tục sử dụng ảnh của từng bài; không bị ảnh chia sẻ chung ghi đè.
- Không thay dữ liệu lưu trữ D1, bản sao lưu Erangel, tài nguyên R2, hoặc URL ảnh cũ đang có người truy cập.

## Điều kiện nghiệm thu

1. Preview: `npm run build`, `lic061-classify-shared-image.mjs`, `lic062-default-share-qa.mjs`, `lic04-original-media-qa.mjs`, `seo-source-verification-qa.mjs` PASS; không còn tham chiếu ảnh cũ trong 35 tệp.
2. SEO, Wiki, D2 technical và Cloudflare Pages Preview PASS.
3. Sau merge: Cloudflare Pages Production PASS; kiểm tra PNG thật HTTP 200 Content-Type image/png, đúng 1200×630; kiểm tra ít nhất 8 đường SEO chính và 5 bài D1 (nguồn, canonical, ảnh độc lập).
4. LIC-06.2 PASS sau hậu kiểm Production, lưu artifact. Issue #72 và #61 vẫn mở cho LIC-06.3 (5 ảnh cũ còn truy cập trực tiếp, quyền chưa được chứng minh).

## Phương án quay lại

Khôi phục `defaultShareImage` từ GitHub để quay lại chia sẻ cũ nếu có lỗi nghiêm trọng (không phải giải pháp quyền ảnh), chạy lại bộ QA; không cần rollback D1/R2. Có thể dùng ảnh đồ họa khác tự sở hữu thay cho ảnh cũ nếu cần.

**Không được báo đã làm sạch quyền ảnh toàn bộ TrainingBot chỉ vì đã chuyển ảnh chia sẻ mặc định.**
