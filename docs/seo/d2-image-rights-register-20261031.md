# D2.9-LIC — Sổ kiểm kê tài sản ảnh của 5 bài D1

**Ngày kiểm kê:** 31/10/2026 (theo giờ Việt Nam). **Phương pháp:** GitHub Actions chỉ GET 5 bài Production và ảnh công khai; tạo SHA-256 và đọc định dạng/kích thước từ tệp. **Không sửa D1, R2, ảnh hoặc nội dung bài.**

## Bằng chứng kỹ thuật đã xác nhận

5 bài có **9 URL ảnh đang được tham chiếu**, gồm **5 tệp ảnh nhị phân khác nhau**. Bốn ảnh bài viết được trả nguyên byte trên cả `trainingbot.io.vn` và `trainingbot-cloudflare.pages.dev`. Tất cả 9 URL đều HTTP 200, Content-Type là ảnh.

| Bài / vai trò | Đường dẫn tài sản | Định dạng & kích thước | SHA-256 (tệp gốc) | Giấy phép |
| --- | --- | --- | --- | --- |
| Erangel — ảnh chia sẻ OG mặc định | `/news-pubg-mobile-4-6-cover.webp` | WebP, chưa trích được kích thước trong parser | `e80a02798aeb6098aa8d364e06ada9d948f119d7dae6a4c01860aa11663283ca` | **UNVERIFIED** |
| PUBG Mobile 4.7 Beta 1 | `/user-posts/pubg-mobile-4-7-beta-1-chinh-thuc-khoi-dong-hang-loat-thay-doi-gameplay--1790303973793.jpg` | JPEG, 1330 × 800 | `744ef11ed78510019a5e6196790c7e41608772d668ca351e3cdd2bb3ef47cafa` | **UNVERIFIED** |
| M416 Glacier Switch Effect | `/user-posts/pubg-mobile-xac-nhan-m416-glacier-switch-effect-gan-hoan-thien-viet-nam--1790048495762.jpg` | JPEG, 1290 × 1612 | `1f0720ab754e1a1285bb1bb9d0dfa436f11c3c2d615efbab688aa4eb0d8af5a5` | **UNVERIFIED** |
| Midnight Hunters 4.6 | `/user-posts/pubg-mobile-4-6-chinh-thuc-cap-nhat-hom-nay-midnight-hunters-da-den-tay--1788837512881.png` | PNG, 1672 × 941 | `72a274d093734c273aed7bcb8ac8b8b865873366b1baf014ad8c3d2a640b9859` | **UNVERIFIED** |
| PUBG Mobile × One-Punch Man | `/user-posts/pubg-mobile-one-punch-man-chinh-thuc-duoc-cong-bo-saitama-do-bo-erangel--1788593701812.jpg` | JPEG, 1280 × 730 | `6eb70dd77d128130e4643806b9f34afea4519ad3273568960a6c5158506d315f` | **UNVERIFIED**, có thể liên quan IP bên thứ ba trong hợp tác |

Bằng chứng có thể tái chạy qua `node tools/seo/d2-image-evidence.mjs` trong GitHub Actions. Artifact kết quả `d2-audit-artifacts/image-evidence.json` được lưu 14 ngày để đối chiếu thay đổi/nhân bản tài sản.

## Phạm vi quyền sử dụng — KHÔNG suy diễn

- Tên miền, đường dẫn `/user-posts/`, HTTP 200, ảnh có thể xem được, SHA-256 trùng hay có ghi nguồn trong bài **không** chứng minh quyền sở hữu hoặc giấy phép sử dụng.
- Hướng dẫn sáng tạo của **PUBG: BATTLEGROUNDS trên PC/console** có nhắc đến fan sites và một số hình thức tạo thu nhập thụ động, nhưng có điều kiện và không tự xác nhận quyền của mọi ảnh **PUBG Mobile** hoặc **IP One-Punch Man**. Xem https://pubg.com/en/clause/content_creation_guideline.
- Thỏa thuận PUBG MOBILE quy định quyền đối với tài sản, ảnh và nội dung của bên phát hành; việc truy cập tài sản không đồng nghĩa được phép phát hành lại vô điều kiện. Tham khảo https://www.pubgmobile.com/PK/terms.shtml.
- Trường hợp game hợp tác One-Punch Man phải rà cả tài sản của anime/đối tác, không tự suy luận PUBG có thể cấp toàn bộ quyền.
- Các nguyên tắc ở đây là quản trị rủi ro quyền sử dụng, **không phải nhận định rằng website đã vi phạm bản quyền**.

## Hồ sơ quyền còn thiếu và điều kiện nghiệm thu

Cho **mỗi tệp ảnh theo SHA-256**, cần có đủ: (1) tác giả/nguồn tạo thực tế và đường dẫn gốc, (2) người nắm quyền hợp pháp, (3) bằng chứng cho phép đăng ảnh trên trang thông tin này (bao gồm quảng cáo nếu có), (4) yêu cầu ghi nguồn/không liên kết chính thức/không sửa đổi, (5) ngày và phiên bản quy định/giấy phép, (6) quyết định giữ, xin phép hay thay bằng ảnh có quyền.

Khi không đủ bằng chứng, giữ trạng thái `UNVERIFIED`, không tạo giấy phép giả, không tự xóa R2 hay thay cover trong D1. Có thể soạn liên hệ xin phép bên liên quan; gửi đi phải được kiểm tra danh tính người nhận và nội dung trước. Đóng D2.9-LIC chỉ khi 5 hồ sơ đáp ứng tiêu chí hoặc tài sản đã được thay bằng ảnh được xác minh quyền và được QA lại.

**Vấn đề cần giải quyết tiếp theo:** issue https://github.com/Gamevalentine/trainingbot-cloudflare/issues/61.
