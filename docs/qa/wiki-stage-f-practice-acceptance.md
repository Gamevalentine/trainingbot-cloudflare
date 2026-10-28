# TrainingBot Wiki V2 — Stage F.1–F.6: Hướng dẫn thực chiến

**Nhánh:** `aion-trainingbot-wiki-stage-f-20261029` · **Phụ thuộc:** Stage E PR #25 · **Môi trường:** Preview-only, không merge Production.

## Nội dung đã triển khai

| Mục | Mã và tiêu chí |
|---|---|
| F.1 | `wiki-stage-f-guides.json`: 16 bài luyện, 4 nhóm vũ khí / phụ kiện / bản đồ / phương tiện; ID ổn định, tìm kiếm không dấu và bộ lọc. |
| F.2 | Các bài thực hành thao tác với QBZ, ACE32, PP-19 Bizon, UMP45, Honey Badger và phương pháp tự thử vũ khí. Nguồn C chỉ dành cho **ghi chú lịch sử từng phiên bản**, không xác thực toàn bộ mẹo tập. |
| F.3 | Ba bài hướng dẫn cách lựa chọn/kiểm chứng phụ kiện dựa trên điều kiện thực tế trong game, **không tự viết bảng tương thích** giữa 51 phụ kiện và 61 súng. |
| F.4 | Bài về Erangel/Livik/Sanhok và cách kiểm tra nguồn theo chế độ, kèm giải thích **Thợ Săn Huyết Dạ ở 4.6 không đồng nghĩa Classic**. |
| F.5 | Overlay `wiki-stage-f-guides.js` và CSS riêng: cẩm nang gập/mở không đẩy danh mục cũ xuống, thao tác từng bước, nguồn chính thức theo registry C/D, bấm điều hướng vào hồ sơ Wiki thật, link chia sẻ `?guide=` theo whitelist. Không sửa handlers v145/E/D. |
| F.6 | `tools/wiki/stage-f-browser-qa.mjs` kiểm tra 390/768/1440, nội dung, sơ đồ nguồn, UI, tìm kiếm, link, navigation thực tế, dữ liệu giả, cách ly Admin / request ghi API. Workflow chạy hồi quy E/D/C/B, SEO và D1. |

## Quy tắc nguồn và nội dung

- **Bài tập:** Nhãn `editorial_training`, được xác định rõ là hướng dẫn luyện tập do TrainingBot biên tập, **không phải kết luận PUBG MOBILE chính thức**.
- **Thông báo phát hành:** Chỉ lấy qua source ID có thật trong `wiki-stage-c-evidence.json` / `wiki-stage-d-evidence.json`; hiển thị URL gốc, ngày, phiên bản và ghi chú tương ứng. Không trộn bản 2.4 / 4.6 / Beta 4.7.
- **Thiếu nguồn:** Không tự điền sát thương, độ giật, phụ kiện, vị trí loot, khả năng xuất hiện Classic hay độ mạnh/yếu. Không tạo ảnh không rõ quyền sử dụng.
- **Thuyền Cao Su:** Mới có trong ghi chú nguồn D, **không tự thêm vào kho 26 xe**.
- **Khả năng truy cập:** Bài trong HTML dạng details/summary, nút focus được, role/status, tìm kiếm tiếng Việt không dấu, trực tiếp khôi phục guide từ liên kết hợp lệ; link sai bị xóa.

## Điều kiện nghiệm thu kỹ thuật

- [x] Mã F, CSS, JSON, build loader và workflow được đưa vào branch F.
- [ ] Browser QA F ở 390px / 768px / 1440px có kết quả CI PASS.
- [ ] Hồi quy E/D/C/B/SEO/D1 trên build tích hợp có kết quả CI PASS.
- [ ] Lưu screenshot artifact và xác nhận không có API ghi ngoài telemetry mock.
- [ ] Kiểm tra Cloudflare Pages Preview ứng với HEAD và nghiệm thu UI.
- [ ] PR Draft, không merge hoặc thay đổi Production.

**Giới hạn:** Đạt F về chức năng hướng dẫn không có nghĩa dữ liệu 61 súng, 51 phụ kiện, 26 xe, 8 bản đồ đã được kiểm chứng toàn bộ; quyền hình ảnh/hiệu năng game thực tế tiếp tục nằm trong backlog C/D/E.

## Kế hoạch tiếp theo — Giai đoạn G (Admin Wiki)

1. **G.1:** Kiểm kê router/quyền Admin hiện hữu, sơ đồ cập nhật dữ liệu Wiki; không tự tạo endpoint.
2. **G.2:** Giao diện quản lý danh mục và trạng thái xuất bản, có thao tác Preview, kiểm chứng vai trò đăng nhập.
3. **G.3:** Quy trình nguồn, hình ảnh, bản quyền và phiên bản; bắt buộc trường minh chứng với các tuyên bố chuyên sâu.
4. **G.4:** Lịch sử thay đổi, kiểm tra hợp lệ, cảnh báo khi đăng nội dung thiếu nguồn và khả năng rollback.
5. **G.5:** Kiểm thử bảo mật, read/write isolation, phân quyền và chống phát hành nhầm dữ liệu.
6. **G.6:** QA tổng hợp trên Admin Preview, nghiệm thu rồi mới chuyển H (SEO/hiệu năng) và I (phát hành).

**Điều kiện chuyển G:** QA F PASS và Preview được kiểm tra; toàn bộ PR A–F giữ Draft cho đến khi được phép phát hành.
