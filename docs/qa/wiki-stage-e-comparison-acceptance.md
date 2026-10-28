# TrainingBot Wiki V2 — Giai đoạn E.1–E.6: so sánh vũ khí

**Ngày:** 29/10/2026 — **nền tảng:** Wiki A–D (PR #21–#24) — **triển khai:** nhánh Preview, không thay đổi D1/R2/API/Production.

## E.1 — Khắc phục xung đột chọn nhiều vũ khí
Lớp `wiki_verified_data_v145.js` trước đây bắt click trên `window` ở capture phase và `stopImmediatePropagation()`, khiến nút so sánh cũ mở màn chi tiết trước khi chọn được súng. Guard mới chỉ bỏ qua listener này khi `window.__TB_WIKI_E__.selecting` là true. Ngoài chế độ chọn, click vũ khí vẫn mở màn v145 bình thường.

## E.2 — Lựa chọn 2–3 vũ khí
Nút So sánh bật chế độ chọn. Thẻ có trạng thái `aria-pressed`, nút trong thanh chọn có thể xóa từng khẩu. Giới hạn đúng tối đa 3. Nút xem kết quả chỉ mở khi >=2; Escape/đóng/thoát hoạt động độc lập với modal chi tiết cũ.

## E.3 — Bảng so sánh và biểu đồ có nguồn
Dữ liệu gốc hiển thị: nhóm, loại đạn, chế độ bắn, ghi rõ **chưa được đối chiếu phiên bản hiện hành**. Các bảng số liệu được lấy từ `wiki-stage-c-evidence.json` và ghi **phiên bản** ngay trong tiêu chí. Biểu đồ chỉ hiển thị khi **ít nhất hai giá trị số cùng metric, cùng phiên bản, cùng sourceId và cùng đơn vị**, không ghép bản 2.4 với 4.6. Biểu đồ đầu tiên có thể kiểm chứng là QBZ và PP-19 Bizon ở sát thương cơ bản **trong ghi chú bản 2.4 năm 2023** (42 và 37). Đây **không** phải tuyên bố sức mạnh hiện hành hay xếp hạng toàn diện.

Nếu thiếu giá trị, bảng hiển thị “Chưa xác minh”; biểu đồ báo không đủ dữ liệu thay vì vẽ điểm 0–100 ước lượng.

## E.4 — Phụ kiện, ưu/nhược điểm
Không tồn tại bảng tương thích chính thức đầy đủ cho 61 súng trong nguồn hiện tại. So sánh dành dòng riêng cho phụ kiện và ưu/nhược nhưng **đánh dấu chưa xác minh**. Không tự điền từ điểm nhóm mặc định hay suy đoán từ tên. Lịch sử thay đổi theo nguồn có thể đọc ở phần ghi chú từng súng.

## E.5 — Minh bạch và liên kết nguồn
Hiển thị danh sách nguồn theo từng vũ khí, tên ghi chú, URL chính thức, phiên bản và ngày phát hành. Cảnh báo mọi suy rộng sang bản khác, bao gồm Beta 4.7. CSS và JS không chạm cơ sở dữ liệu hay Worker; nguồn được fetch cùng origin.

## E.6 — Chia sẻ, hỗ trợ thiết bị và QA
Liên kết có dạng `/wiki?compare=QBZ%2CPP-19+Bizon`, sử dụng tên thuộc whitelist DATA 61 súng; dữ liệu sai/ trùng/ quá 3 bị từ chối. Mở liên kết chỉ **khôi phục lựa chọn**, không tự bật pop-up; người dùng bấm “Xem so sánh” để xem. Nút sao chép có fallback chọn đường dẫn nếu Clipboard không cho phép.

QA thiết kế trong `tools/wiki/stage-e-browser-qa.mjs` dùng Chromium 390/768/1440 px, kiểm tra 2/3 giới hạn, xung đột v145, chọn bằng bàn phím, nguồn cùng phiên bản, URL chia sẻ, ảnh, không gửi yêu cầu ghi dữ liệu và hồi quy D/C/B/SEO/cách ly D1.

## Điều kiện nghiệm thu
- [x] Có mã nguồn E.1–E.6, lớp CSS riêng, asset load sau D.
- [x] Có QA browser và GitHub workflow riêng cho E; kết quả CI thực tế mới quyết định PASS.
- [ ] Xác minh **mức độ phù hợp** các số đo giữa vũ khí khác nhóm trong điều kiện giao tranh: chưa có nguồn thử nghiệm riêng; không đưa ra đánh giá “khẩu nào mạnh hơn”.
- [ ] Bảng tương thích phụ kiện chính thức trên mọi phiên bản còn thiếu. Không được đánh dấu phần này là đã hoàn thiện dữ liệu.
- [ ] Không merge Production khi chưa nghiệm thu và kiểm tra đầy đủ các giai đoạn phụ thuộc.

## E.7–E.10 — nghiệm thu kỹ thuật bổ sung (29/10/2026)

**E.7 — chức năng và xử lý liên kết:** Tăng cường Playwright xác nhận hộp thoại đóng bằng Escape mà vẫn giữ lựa chọn, và từ chối link chia sẻ chứa tên không tồn tại, vũ khí trùng hoặc quá 3 tên. Kiểm tra 2/3 lựa chọn, cap 3, v145 guard, đọc nguồn và restore tiếp tục PASS.

**E.8 — responsive:** Chạy ở 390px / 768px / 1440px, đo thực tế bounding boxes của dialog, thanh chia sẻ và vùng bảng (tránh tràn ngang viewport). Trên màn hình 390px bảng có vùng cuộn ngang độc lập. Screenshot mẫu được xuất cho cả ba kích thước.

**E.9 — hồi quy:** Gọi lại bộ browser QA B/C/D ở đủ ba viewport, kiểm tra SEO và D1 isolation. Không được gọi endpoint ghi dữ liệu Production.

**E.10 — nghiệm thu:** [GitHub Actions run #40774648541](https://github.com/Gamevalentine/trainingbot-cloudflare/actions/runs/40774648541) **SUCCESS** trên HEAD `b9da2575c0f7f4b7f2d3b4eccb6c367b20b723ac`. Log xác nhận Wiki E/B/C/D 390/768/1440 PASS, P1 SEO PASS, P3.1 D1 Preview isolation PASS, artifact `trainingbot-wiki-stage-e-qa` đã lưu. Test cập nhật có sẵn tại `tools/wiki/stage-e-browser-qa.mjs`. Workflow đã bổ sung trigger PR synchronize, vẫn giữ push-to-preview.

**Giới hạn nghiệm thu:** đây là QA trình duyệt tự động trong build tĩnh, chưa phải kiểm tra độc lập toàn bộ độ chính xác số liệu, giấy phép hình ảnh, tương thích phụ kiện theo phiên bản hiện hành hoặc nghiệm thu Production. PR #25 vẫn Draft; không tự merge.

**Điều kiện để chuyển F:** Giai đoạn E đạt nghiệm thu kỹ thuật tính năng/CI; những thiếu sót dữ liệu C/D/E phải chuyển sang backlog xác minh riêng, không ngầm coi đã giải quyết.

## Tiếp theo
Giai đoạn F — hướng dẫn thực chiến có nguồn, sau đó G — Admin Wiki, H — SEO/hiệu năng, I — nghiệm thu phát hành. Đồng thời tiếp tục tồn đọng C/D về số liệu, ảnh và quyền sử dụng; không giấu phần chưa hoàn thành.
