# TrainingBot Wiki V2 — Giai đoạn B (B.1–B.6)

**Thời điểm:** 29/10/2026. **Cơ sở:** nhánh Wiki A đã kiểm kê 146 bản ghi.  
**Đầu ra:** trang Wiki mới trên Preview; không đổi bảng `DATA`, API, Worker, D1/R2, Admin, thao tác phát hành.

## B.1 — Tổng quan Wiki
- Giữ header chung đã chuẩn hóa; cải tiến tiêu đề theo danh mục và rút gọn lời giới thiệu.
- Thanh tìm kiếm dễ thấy, hướng dẫn rõ dữ liệu tham khảo, không giả làm số liệu chính thức.
- Thống kê tổng số mục lấy trực tiếp từ `DATA`, không có số cứng.

## B.2 — Danh mục
- Giữ bốn kho Vũ khí, Phụ kiện, Xe cộ, Bản đồ.
- Tự đồng bộ bộ đếm trên bốn tab với độ dài dữ liệu hiệu lực sau các bản vá: 61/51/26/8.
- Không che giấu bản ghi chưa được kiểm chứng.

## B.3 — Thẻ vật phẩm
- Ảnh/ví dụ cũ được giữ. Cải thiện phân cấp ảnh, tiêu đề, loại, thông tin ngắn.
- Chỉ hiện các trường **có sẵn trong bản ghi**, không bịa sát thương, tốc độ hoặc độ giật.
- Vũ khí: đạn, chế độ bắn. Phụ kiện: nhóm. Xe: chỗ, bản đồ. Bản đồ: diện tích/nhịp chơi.
- Thẻ vẫn có thể mở thông tin chi tiết và sử dụng trong chế độ so sánh đang tồn tại.
- Biểu tượng, màu và kích thước thẻ nhất quán, chữ tiếng Việt rõ.

## B.4 — Tìm kiếm, lọc và sắp xếp
- Tìm tên tiếng Việt **không dấu, có dấu**, xử lý `đ/Đ`; tìm cả tên, loại, mô tả và dữ liệu thẻ.
- Bộ lọc theo danh mục và các loại hiện có không bị thay thế.
- Sắp xếp Mặc định / A–Z / Z–A / Theo nhóm; giữ event handler gốc khi đổi thứ tự thẻ.
- Bộ đếm kết quả, trạng thái rỗng, nút xóa truy vấn, phím `/` tìm nhanh và Escape xóa từ khóa.
- Thông báo kết quả rõ ràng, không thay đổi dữ liệu `DATA`.

## B.5 — Responsive, truy cập
- Desktop tối đa năm cột; tablet bốn/ba; điện thoại hai hoặc một cột tùy kích thước.
- Hình ảnh tỉ lệ đúng, không bị cắt mất tên/thông tin; có trạng thái focus, phù hợp giảm chuyển động.
- Font hệ thống hỗ trợ tiếng Việt; không phụ thuộc phông tải ngoài.
- Chỉ sửa khu vực Wiki công khai, không ảnh hưởng các trang khác.

## B.6 — Kiểm thử và nghiệm thu
- Build đầy đủ, kiểm tra 146 bản ghi và bộ đếm từ DOM cuối, 4 tab, filter, sắp xếp, tìm không dấu.
- Mở các màn chi tiết vũ khí hiện có và chế độ so sánh.
- Chụp ảnh desktop và mobile; kiểm tra overflow, lỗi JavaScript và yêu cầu ghi API.
- Chạy lại kiểm kê giai đoạn A và kiểm tra SEO / Preview isolation.
- Bản Preview sẽ kiểm thử trước, PR đặt **Draft**. Chỉ merge lên Production sau khi có yêu cầu của chủ website.

## Giới hạn
- Những dữ liệu chưa có chứng cứ độc lập vẫn được coi là dữ liệu từ Wiki hiện có, **không khẳng định đã xác minh chính thức**.
- Không triển khai hồ sơ chi tiết nâng cao của từng vũ khí (thuộc giai đoạn C).
- Không đổi nguồn ảnh, không tạo số liệu giả, không sửa D1/R2.


## B.6 — Ghi nhận nghiệm thu và tồn đọng

- Browser QA trên build thật đã PASS ở **390, 768 và 1440px**, bao gồm kiểm tra đúng 61/51/26/8 mục, tìm không dấu, lọc, sắp xếp và mở lại hộp chi tiết vũ khí.
- Có ảnh chụp desktop/mobile và kiểm thử không phát sinh request ghi dữ liệu ngoài telemetry cũ đã được giả lập.
- **Tồn đọng tiền nhiệm:** thao tác chọn 2 vũ khí để so sánh trên cùng lưới có thể bị listener xem chi tiết `wiki_verified_data_v145.js` bắt trước (capture phase). B chỉ đảm bảo nút đổi sang chế độ So sánh và màn chi tiết không mất chức năng, **không nhận đã sửa quy trình chọn vũ khí**. Việc thay công cụ So sánh có nguồn thuộc giai đoạn E.
- Đầu ra của A là schema/kiểm kê, và **54 vấn đề cần rà soát về dữ liệu/nguồn vẫn tồn tại**. Thẻ mới chỉ trình bày lại trường hiện có; không chuyển các số liệu chưa xác minh thành số liệu chính thức.
- PR dành cho **Preview / nghiệm thu**, chưa merge và chưa ghi Production.
