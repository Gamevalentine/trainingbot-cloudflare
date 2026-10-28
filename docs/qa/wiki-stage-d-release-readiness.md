# Wiki V2 — Giai đoạn D.1–D.4 (Phụ kiện · Xe cộ · Bản đồ)

Ngày thực hiện: 29/10/2026.
Cơ sở dữ liệu: Stage A kiểm kê 51 phụ kiện, 26 phương tiện, 8 bản đồ. Stage C làm rõ nguồn vũ khí và lưu ledger 61 bản ghi. D sử dụng dữ liệu hiện có và bổ sung các khối dẫn nguồn **theo phiên bản**; không suy đoán thống kê.

## D.1 — Phụ kiện (51 mục)
- Hiển thị rõ công dụng đã ghi trong Wiki hiện tại (dữ liệu gốc, chưa xác minh theo patch hiện hành).
- Thêm trạng thái **“tương thích từng súng chưa xác minh”**, không khẳng định mọi gợi ý phụ kiện của v145 là chính thức.
- Ghi rõ dữ liệu hình ảnh, tác dụng định lượng, quyền dùng ảnh chưa kiểm chứng; không tự động nhập ảnh bên ngoài.
- Liên kết điều hướng từ chi tiết phụ kiện sang danh sách Vũ khí, dùng tab gốc để giữ nguyên lịch sử người dùng.

## D.2 — Xe cộ (26 mục hiện có)
- Giữ danh mục 26 xe, thông tin số chỗ, loại, bản đồ ở mức dữ liệu đã có (nếu chưa có nguồn thì không được xem là chính thức).
- Bổ sung nguồn bản 4.6 cho **BRDM-2** ở Nhà Xe Tự Chọn; vì bảng cũ đã đổi nhãn thành `Tracked Amphicarrier`, gắn **cần đối chiếu ánh xạ tên**, không tự xem là hai dữ liệu độc lập.
- Ghi lại thiếu sót kiểm kê: bản 4.6 bổ sung **Thuyền Cao Su 4 chỗ**, có thể triển khai/thu hồi và chèo từ ghế phụ. Vật phẩm chưa nằm trong 26 dòng cũ; giữ là **hạng mục cần bổ sung vào kho** thay vì tự tạo dòng hoặc thay đổi số liệu B.
- Tốc độ, độ bền và vùng xuất hiện ở bản mới nhất chưa có đủ nguồn để tuyên bố chính xác.

## D.3 — Bản đồ (8 mục hiện có)
- Giữ bản đồ cũ, bổ sung nguồn chính thức theo *chế độ cụ thể* cho **Erangel, Livik, Sanhok**: ba bản đồ có chế độ **Thợ Săn Huyết Dạ** trong bản 4.6.
- Không suy rộng thành vị trí spawn, tỷ lệ loot hoặc quy tắc của toàn bộ Classic. Thông số số người chơi, thời lượng, loot... chỉ là dữ liệu Wiki hiện hữu nếu chưa có nguồn riêng.
- Với bản đồ ngoài 3 nguồn hiện có: hiển thị rõ cần đối chiếu.

## D.4 — Liên kết và phạm vi tích hợp
- Các màn mở từ danh sách Wiki giữ cách trình bày gốc `tbWikiModal` và `wiki_vehicle_map_detail_v148.js`.
- Khi mở chi tiết Phụ kiện / Xe / Bản đồ sẽ có panel phụ “Nguồn và trạng thái kiểm chứng” và nút tra cứu nhóm liên quan.
- CSS chỉ áp dụng với `body.tb-wiki-stage-d`, không thay đổi navigation hoặc trang Admin.
- `wiki-stage-d-evidence.json` là sổ đăng ký chứng cứ theo phiên bản, không phải lệnh cập nhật D1/R2.

## Nguồn chính thức đã được kiểm tra
- [PUBG MOBILE VN — Thông Báo Cập Nhật 4.6 (07/09/2026)](https://pubgm.vnggames.com/tin-tuc/thong-bao-cap-nhat/thong-bao-cap-nhat-phien-ban-4-6.html), phần Cập Nhật Chế Độ Cổ Điển và bản đồ Chế Độ Chủ Đề. Nguồn này xác nhận nội dung **4.6**, không xác nhận thông tin riêng cho Beta 4.7.

## Điều kiện nghiệm thu
- [x] Có lớp dữ liệu nguồn và trạng thái đối chiếu cho 85 bản ghi (51/26/8); không lấy tên file Verified làm bằng chứng.
- [x] Có kiểm thử trình duyệt thật 390/768/1440 và regression giai đoạn B/C + SEO + D1 (báo cáo PASS chỉ sau CI).
- [ ] **Chưa xác minh đầy đủ** 51/51 phụ kiện, 26/26 xe, 8/8 bản đồ theo mỗi thông số hiện hành.
- [ ] **Chưa cấp phép / kiểm tra quyền sử dụng từng hình ảnh.**
- [ ] **Thuyền Cao Su** còn nằm trong sổ “chưa có trong catalog”; cần xử lý bổ sung bản ghi ở giai đoạn quản trị/migration sau khi thống nhất chuẩn ID.

## Bước kế tiếp
E — công cụ so sánh thực tế, giải quyết xung đột listener chọn súng từ Stage B với v145. Sau đó F — hướng dẫn có nguồn; G — Admin Wiki, H — SEO/hiệu năng, I — nghiệm thu phát hành.

Không merge hoặc deploy Production khi chưa nghiệm thu cuối.
