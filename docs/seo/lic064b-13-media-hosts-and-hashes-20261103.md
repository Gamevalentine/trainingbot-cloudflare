# LIC-06.4B — Xác minh kỹ thuật 13 ảnh từ HTML công khai và nguồn phục vụ

**Ngày:** 03/11/2026 (giờ Việt Nam). **Phạm vi:** đúng 13 URL thiếu bằng chứng quyền trong 24 URL hình đã quan sát bằng GET HTML thực tại LIC-06.4A; không trộn 168 ảnh chỉ là nguồn JS/CSS vào danh sách đã xác nhận.

## 13 URL đã được thử thực tế

Host của 13 URL: `https://trainingbot.io.vn/`. Kiểm thử **HEAD** và **GET** với redirect manual, giới hạn tải mỗi ảnh 8 MiB, ghi loại dữ liệu, dung lượng, SHA-256 và các header HTTP. Kết quả ban đầu: **13/13 HEAD 200 và GET 200**, **13/13 lấy được byte hợp lệ và tính SHA-256**, không lỗi mạng hoặc 302 trong nhóm này.

| Tệp ảnh | HTTP | Nội dung thực | Byte | SHA-256 (rút gọn) | Chú ý |
|---|---:|---|---:|---|---|
| `favicon.svg` | 200 | SVG | 659 | `6086f6844642…` | Nguồn logo/favicon cần chứng từ tạo hình |
| `news-featured-cover.webp` | 200 | WebP | 40,802 | `0ea3eae84279…` | Ảnh bìa tin nổi bật |
| `news-mr-practice-arena-2026-cover.webp` | 200 | WebP | 58,696 | `55943b9ac039…` | Ảnh Esports, cần xác nhận quyền sử dụng |
| `news-playgalaxy-cup-world-final-2026-cover.svg` | 200 | **PNG** | 2,357,132 | `3c1c5854da22…` | **P0: đuôi .svg nhưng MIME và nội dung PNG** |
| `news-pubg-mobile-4-6-bloodline-cover.svg` | 200 | SVG | 11,322 | `27066f3a27e1…` | Kiểm tra vector có nhúng logo/artwork không |
| `news-pubg-mobile-4-6-skins-events.jpg` | 200 | JPEG | 323,150 | `cd7a85d12e1e…` | Ảnh trang phục/sự kiện, cần nguồn gốc |
| `news-pubg-mobile-light-cover.webp` | 200 | WebP | 5,864 | `180fa18f4c58…` | Ảnh PUBG Mobile Light |
| `news-versions-bgmi-lite-cover.webp` | 200 | WebP | 56,304 | `2e35e11fe8d0…` | Ảnh phiên bản BGMI Lite |
| `news-versions-pubg-mobile-4-6-cover.webp` | 200 | WebP | 100,038 | `e80a02798aeb…` | **P0: SHA trùng ảnh đã nghỉ ở LIC-06.3; URL khác vẫn HTTP 200** |
| `news-versions-skin-smelting-cover.webp` | 200 | WebP | 89,542 | `04ac0d25232c…` | Ảnh sự kiện skin smelting |
| `pubg-game-avatar.webp` | 200 | WebP | 4,892 | `8645588d6bab…` | P0 theo tần suất xuất hiện Home/Beta |
| `pubg-mobile-light-avatar.webp` | 200 | WebP | 12,136 | `a9570a189fac…` | P1 avatar PUBG Mobile Light |
| `trainingbot-logo-v110.png` | 200 | PNG | 58,620 | `b73bc72f4c3b…` | Cần hồ sơ nguồn của logo TrainingBot |

**Mã SHA-256 đủ 64 ký tự, vị trí chính xác trên các trang và kết quả header cho từng URL** lưu trong `lic064b-audit-artifacts/13-live-media-technical.json` và `.csv` của GitHub Actions; bảng trên cố ý rút gọn để đọc nhanh. Chứng cứ về kỹ thuật **không phải** bằng chứng giấy phép phát hành.

## Hai vấn đề thực sự cần xử lý

1. **P0 — Trùng nội dung đã chuyển hướng:** `/news-versions-pubg-mobile-4-6-cover.webp` có SHA-256 `e80a02798aeb6098aa8d364e06ada9d948f119d7dae6a4c01860aa11663283ca`, trùng với tệp cũ `/news-pubg-mobile-4-6-cover.webp` đã chuyển hướng ở LIC-06.3. Vì quy tắc 302 trước đây theo **URL chính xác**, bản cùng nội dung tại URL thứ hai **vẫn trả HTTP 200**. Không tuyên bố mọi đường công khai của ảnh cũ đã bị loại bỏ; cần đánh giá quyền và bề mặt ảnh ở LIC-06.4C/4D rồi xử lý mà không xóa dữ liệu.
2. **P1 — Sai đuôi/MIME:** `/news-playgalaxy-cup-world-final-2026-cover.svg` trả `Content-Type: image/png` và byte PNG, dung lượng ~2,36 MB. Có thể ảnh được phục vụ bởi R2 override hoặc tệp nguồn bị sai định dạng; chỉ HTTP không chứng minh tầng lưu trữ nào. Cần xác định nguồn tệp chính thức trước khi sửa URL/MIME hoặc đổi ảnh; không tự sửa đường dẫn vì có thể ảnh hưởng SEO/card.

## Nguồn phục vụ Cloudflare / R2

- `functions/_middleware.js` cho biết binding **`VIDEO_BUCKET`**, tra cứu key dạng `site-overrides/<đường-dẫn-đã-mã-hóa>` cho ảnh GET/HEAD; khi không có tệp override sẽ trả luồng Pages thường. **HEAD/GET 200 không cho biết chắc** tệp nào phục vụ từ R2 và tệp nào từ Pages.
- Các URL media đã nghỉ ở LIC-06.3 được middleware chuyển hướng trước bước đọc R2. Bộ hậu kiểm vẫn xác nhận **5 URL x 2 tên miền** 302 qua GET/HEAD; các bài D1 vẫn đọc được.
- Không phát hiện bằng chứng cấu hình tài khoản R2 custom domain công khai riêng trong mã nguồn được quét. **Không có nghĩa domain đó không tồn tại**: còn cần quyền Cloudflare để kiểm tra settings, không đoán URL/bucket và không truy cập quản trị.
- 12 domain nguồn ảnh bên ngoài được thấy dưới dạng **49 ứng viên trong mã nguồn** (`www.pubgmobile.com`, `wstatic-prod-boc.krafton.com`, `raw.githubusercontent.com`, `pbs.twimg.com`, `liquipedia.net` và các trang tin game). **0 URL ngoài được quan sát trong mẫu 14 HTML công khai**; không đủ bằng chứng kết luận không có hotlink ở chế độ JS/thiết bị khác. Không gửi probe tới domain ngoài khi chỉ được yêu cầu xét nguồn website.

## Ranh giới về bản quyền

- **13/13 ảnh chưa có bằng chứng quyền sử dụng gắn với chính SHA-256** trong repository: không được suy ra tất cả vi phạm, cũng không được coi ảnh chỉ vì nằm trên tên miền TrainingBot là do TrainingBot sở hữu.
- `favicon.svg` và `trainingbot-logo-v110.png` có thể là tài sản do chủ website tạo; cần bổ sung file thiết kế, tác giả/ngày tạo, giấy phép font/biểu tượng nếu có.
- Những ảnh giải đấu, trang phục và PUBG/BGMI cần xác minh liệu được đăng theo quy định sử dụng cụ thể, báo chí hoặc cấp phép riêng; chú thích nguồn không đồng nghĩa quyền sao chép.
- Quyết định thay/chặn ở **LIC-06.4D**, sau xác minh quyền LIC-06.4C và kiểm thử các chỗ ảnh xuất hiện; bước B chỉ kiểm tra kỹ thuật và lưu chứng cứ.

## Mốc công việc

| Mã | Kết quả / điều kiện |
|---|---|
| **LIC-06.4B1/B2** | Xác minh đúng 13 URL, HEAD/GET, MIME, SHA và lỗi/redirect — PASS kỹ thuật, lưu JSON/CSV |
| **LIC-06.4B3** | Phân loại 12 domain ngoài và 49 ứng viên JS/CSS — chỉ là tham chiếu nguồn, chưa chứng nhận render thật |
| **LIC-06.4B4** | Truy vết middleware R2/Pages ở mức mã nguồn — PASS; custom domain R2 độc lập **chưa thể xác nhận** |
| **LIC-06.4B5** | Kiểm tra lại 5 URL chuyển hướng, 5 bài D1 và ảnh PNG hợp lệ — PASS |
| **LIC-06.4C** | Thu thập chứng cứ quyền và xác minh 2 rủi ro trùng ảnh/sai định dạng — còn mở |
| **LIC-06.4D** | Chỉ sửa/thay ảnh sau khi kiểm thử được ảnh hưởng — chưa thực hiện |
| **D2.10-FINAL** | Chưa đủ bằng chứng đóng toàn bộ quyền ảnh |

**Giới hạn:** Không truy cập R2 bucket trực tiếp, không kiểm tra mọi chế độ tương tác runtime, không gọi `/api/posts` (GET có thể thực thi compatibility DDL), không sửa nội dung hoặc xóa file cũ. Hồ sơ nguồn và quyền ảnh vẫn chưa được xác nhận.
