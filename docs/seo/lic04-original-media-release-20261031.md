# LIC-04 — Thay ảnh công khai của 5 bài D1 bằng ảnh biên tập gốc

## Thiết kế, nguồn gốc và giới hạn quyền
- Năm SVG được tạo trực tiếp trong repository bằng gradient, lưới, hình học và chữ. Không nhúng ảnh game/anime, logo chính thức, screenshot, font bên ngoài hoặc URL ảnh ngoài.
- Ảnh chia sẻ OpenGraph/Twitter được sinh ra mỗi lần build dưới dạng PNG 1200×630 từ Node.js thuần: không dùng font bên ngoài, ảnh Internet, dịch vụ AI hoặc thư viện nhận tài sản bên thứ ba.
- Banner ghi rõ đây là hình minh họa biên tập TrainingBot, không phải artwork chính thức. Tên chủ đề game chỉ dùng mô tả bài viết.
- SVG/PNG có mã nguồn đủ kiểm toán, nhưng không tuyên bố bản quyền độc quyền tuyệt đối hoặc tự động cấp phép tác phẩm gốc của hãng game/anime.

## Bản đồ thay thế hiện thị
| Bài | Ảnh cover SVG | Ảnh chia sẻ PNG |
|---|---|---|
| Erangel | /editorial-original-erangel.svg | /editorial-original-erangel.png |
| PUBG Mobile 4.7 Beta 1 | /editorial-original-beta-47.svg | /editorial-original-beta-47.png |
| M416 Glacier | /editorial-original-m416-glacier.svg | /editorial-original-m416-glacier.png |
| Midnight Hunters 4.6 | /editorial-original-midnight-hunters.svg | /editorial-original-midnight-hunters.png |
| One-Punch Man | /editorial-original-one-punch-man.svg | /editorial-original-one-punch-man.png |

## Các bề mặt bị ảnh hưởng
- functions/bai-viet/[slug].js: chỉ thay ảnh ở lớp hiển thị. Các trường D1 nguyên gốc, dữ liệu backup, nội dung bài và canonical không đổi.
- functions/api/posts.js: chỉ đổi cover_url của năm bài trong JSON hiển thị cho các cards Tin tức/Trang chủ, không cập nhật row D1.
- Build tạo PNG từ tools/seo/lic04-build-png.mjs, còn SVG được sao chép từ overrides.
- Mọi bài ngoài năm slug không bị tác động. Các đường dẫn ảnh cũ còn lưu trong D1/R2 để đối chiếu, không được coi là có phép và không tự xóa.

## Điều kiện nghiệm thu
1. Npm build và đúng 5 SVG + PNG thực, SVG XML parse PASS, PNG có chữ ký chuẩn 1200x630.
2. QA mock D1: 5 bài đúng SVG cover và PNG social, public API feed đúng ảnh, không sửa row D1, bài ngoài phạm vi không thay.
3. SEO/D1/Wiki và Pages Preview PASS trước merge.
4. Sau merge: public GET 5/5 bài và 10 ảnh từ Production HTTP 200, canonical/source panel đúng, không hiển thị URL /user-posts/ của năm bài; không có thao tác D1/R2 ghi.
5. Chưa đóng Issue #61 cho những ảnh lưu trữ/chia sẻ khác chưa có giấy phép; không tuyên bố toàn website sạch bản quyền từ phạm vi năm bài.

## Quyết định
LIC-04 chỉ được đánh dấu PASS cho bề mặt đã thực sự thay ảnh mới và QA Production thành công. D2.10 chỉ có thể đóng sau khi phạm vi tồn dư và bằng chứng quyền ảnh được giải quyết/ghi nhận đầy đủ. Không xóa D1, R2 hay bản sao lưu gốc.
