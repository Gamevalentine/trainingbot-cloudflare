# TrainingBot — kiểm toán SEO chủ động (29/10/2026)

## Nguồn đối chiếu
- Dữ liệu Search Console chủ website đã cung cấp: 13–19/10 so với 20–26/10: tổng impressions 99 → 51, clicks 2 → 0; vị trí trung bình 6,4 → 8,7.
- Bài PUBG Mobile 4.7 Beta 1: impressions 39 → 9, vị trí TB 6,9 → 7,1.
- Bài PUBG Mobile 4.6 Skins & Events: impressions 16 → 5, vị trí TB 5,6 → 5,2.
- Cả hai bài vẫn truy cập và canonical/index, không có bằng chứng tụt hạng mạnh hoặc bị Google gỡ chỉ mục. Không thể từ mẫu này kết luận nguyên nhân do lỗi mã hay nhu cầu tìm kiếm giảm.

## Các điểm có thể sửa có căn cứ
1. Bài 4.6 cũ từng liên kết trực tiếp tới `/updates` (URL legacy `noindex`). Cần chuyển đường dẫn nội bộ về trang chuẩn `/ban-cap-nhat`.
2. Bài 4.6 là lịch dự kiến tháng 9–11/2026 từ nguồn cộng đồng; người đọc vào từ tìm kiếm cần nhắc rõ tính lịch sử/dự kiến và đường dẫn sang bài Beta 4.7, tin nổi bật, trang cập nhật.
3. Bài Beta 4.7 trên `/bai-viet/:slug` được render từ D1; bổ sung liên kết ngữ cảnh tới các trang cùng chủ đề và cảnh báo Beta 1 là thông tin thử nghiệm, **không tự thay bài đã đăng**.
4. `GET /bai-viet/:slug` trước đây chạy `CREATE TABLE IF NOT EXISTS` và `ALTER TABLE` qua hàm setup mỗi lần crawler ghé trang. Bỏ schema mutation khỏi đường đọc, yêu cầu tạo/migrate bảng ở quy trình Admin/migration riêng. Các bảng hiện tại vẫn được dùng để SELECT dữ liệu bài đăng. Kiểm thử giả lập buộc SQL chỉ đọc.

## Giới hạn an toàn
- Không sửa số liệu PUBG hiện hành nếu chưa có nguồn. Không đánh dấu lịch cũ là lịch đã xác nhận.
- Không đổi slug/canonical của bài đã lập chỉ mục, không chặn URL, không thêm schema mới, không ghi D1/R2.
- Không suy luận thứ hạng đã phục hồi. API Search Console đang không khả dụng từ connector, nhưng có thể theo dõi bằng dữ liệu chủ website cung cấp trước đó.
- Thay đổi qua GitHub PR, chạy CI/QA trên branch rồi mới phát hành. Sau release cần xác minh Production và giữ mốc rollback.

## Kế hoạch tiếp theo duy nhất
**SEO — theo dõi kết quả nội dung sau phát hành:** đo clicks/impressions/vị trí riêng của hai bài sau khi Google thu thập lại, so sánh khoảng đồng độ dài ngày 05/11, 12/11, 26/11/2026; đồng thời xác minh liên kết nội bộ từ trang chủ và các danh mục đang được Google phát hiện. Không cần yêu cầu chủ website gửi ảnh từng ngày nếu connector không đọc được.
