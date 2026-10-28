# TRAININGBOT ADMIN CENTER — GIAI ĐOẠN C (ADM-04 / ADM-05 / ADM-06)
Ngày nghiệm thu: 28/10/2026. Nhánh: `aion-trainingbot-admin-stage-c-20261028`. Base là nhánh Stage B `aion-trainingbot-admin-stage-b-20261028`, không phải Production.

## 1. TRẠNG THÁI TỪNG MỤC

| Mã | Mục | Thực hiện | Kết quả |
| --- | --- | --- | --- |
| ADM-04.1 | Tổng quan | Bỏ banner giới thiệu và shortcut trùng; hiển thị KPI gốc, trung tâm hành động và phép kiểm tra API như thực tế | **PASS giả lập** |
| ADM-04.2 | Điều hướng tác vụ | Bốn lối tắt: Bài viết, Trang web, Theo dõi truy cập, Hộp thư; dùng nút/handler cũ | **PASS giả lập** |
| ADM-04.3 | Trạng thái hệ thống | Giữ cách ghi điểm `X/3 API kiểm tra` của Stage A, không coi 3 API là toàn bộ website | **PASS giả lập** |
| ADM-05.1 | Bài viết | Danh sách bài được tải lại khi vào mục sau đăng nhập, tìm kiếm tiêu đề/chuyên mục/slug | **PASS giả lập** |
| ADM-05.2 | Bộ lọc | Lọc `Tất cả`, `Bản nháp`, `Đã xuất bản`, không coi lỗi API là 0 bài | **PASS giả lập** |
| ADM-05.3 | Beta | Chuyển form/list Beta *đang có* khỏi Trang web sang mục Beta riêng, form thêm/sửa thu gọn mặc định | **PASS giả lập** |
| ADM-05.4 | Tin nổi bật | Không cho hiển thị thao tác ghim bài nháp; đồng bộ nút ghim sau khi tải lại bài | **PASS giả lập** |
| ADM-05.5 | Wiki / Trang web / Studio | Giữ các màn và API cũ, không tái viết backend, không đổi tuyến đường phát hành | **Kiểm thử tương thích** |
| ADM-06.1 | Tạo bài | Hai lựa chọn `Lưu nháp` và `Xuất bản`, có xác nhận khi đóng bản soạn chưa lưu | **PASS giả lập** |
| ADM-06.2 | Biên tập giàu định dạng | Tách `Lưu nháp` / `Xuất bản`; cảnh báo thay đổi chưa lưu và giữ nội dung khi API báo lỗi | **PASS giả lập** |
| ADM-06.3 | Backend | Dùng cột D1 `status` đang tồn tại (draft/published), không tạo bảng mới | **PASS in-memory D1** |
| ADM-06.4 | Công khai | Bài nháp không xuất hiện tại `/api/posts` và `/bai-viet/<slug>`; xuất bản mới hiển thị | **PASS real handlers, fake DB** |
| ADM-06.5 | Quyền truy cập | Token sai bị 401 trước D1, trạng thái không hợp lệ 400; không thể ghim bài nháp (409) | **PASS real handlers, fake DB** |

## 2. TÌNH TRẠNG KIỂM THỬ

- **CI thành công:** [GitHub Actions #40613404368](https://github.com/Gamevalentine/trainingbot-cloudflare/actions/runs/40613404368) — Build PASS, kiểm tra cú pháp PASS, real Pages Functions PASS, regression Stage A PASS, Stage C Playwright PASS.
- **Kiểm thử Pages Function thật:** `tools/admin/adm06-draft-handler-qa.mjs` dùng D1 giả trong RAM, tạo nháp → API công khai không thấy → xuất bản → xuất hiện → chuyển về nháp → công khai 404 → không cho ghim nháp.
- **Kiểm thử Admin UI giả lập:** `tools/admin/adm04-06-browser-qa.mjs` chạy tại 390/768/1440px bằng token giả và API bị intercept. Chạy tính năng menu, Beta, tìm/lọc bài, tạo nháp, đóng form chưa lưu, mở Rich Editor, lưu nháp và xuất bản.
- **Regression A:** xác thực token/401/403/mạng lỗi và các API User/Posts/Beta/Visitor/Studio vẫn PASS.
- **Regression B:** chưa thay đổi 12 nút gốc; từ Stage C thêm mục Beta mới thành 13 mục; giữ navigation/back/forward & CSS của B. Các bước Stage B cũ đã PASS trước đó, chưa chạy lại nguyên bộ 12-nút do tăng có chủ đích.
- **Không có HTTP ghi ngoài môi trường mock, không kết nối backend thật, không đọc/ghi D1 Production.**

## 3. FILES / GIẢI PHÁP

- `functions/api/v71/admin/posts.js`: hỗ trợ tạo/đổi bài `draft` hoặc `published` thông qua cột status đang có; ngăn ghim nháp, cập nhật published_at khi xuất bản lần đầu.
- `overrides/admin_posts_manual_v171.js`: bộ lọc, tìm kiếm, tạo nháp/đăng bài, nhắc thay đổi chưa lưu, làm mới sau đăng nhập.
- `overrides/admin_posts_editor_v183.js`: Editor giữ nội dung khi lỗi, có thao tác nháp/xuất bản, chặn đóng nội dung đang sửa.
- `overrides/admin_posts_feature_v173.js`: không ghim nháp, đồng bộ sau tải lại.
- `overrides/admin-stage-b-ui.js`: bổ sung mục Beta vào đúng nhóm Nội dung (không đổi menu cũ).
- `overrides/admin-stage-c-ui.js`: Dashboard gọn và menu Beta riêng, dùng chính DOM/listener hiện tại. Không tự gọi API ghi.
- `postbuild.sh`: gắn script C *sau* script B, giữ 16 phần runtime cũ nguyên bản.
- `tools/admin/adm06-draft-handler-qa.mjs`, `adm04-06-browser-qa.mjs`, `adm01-state-qa.mjs`: QA có bằng chứng.
- `.github/workflows/trainingbot-admin-stage-c-qa.yml`: CI độc lập và cổng chấp nhận.

## 4. RANH GIỚI VÀ VIỆC CÒN LẠI

- **C đã hoàn thành phát triển và QA tích hợp cách ly.** Không có hạng mục C bỏ dở ở mức mã nguồn/CI.
- Chưa đăng nhập Admin Production bằng token thật, chưa thao tác lưu nháp lên D1 thật. Đây là **cổng nghiệm thu thực địa trước phát hành**, không được gộp thành thành tích PASS.
- **Không đổi schema D1**, nhưng phần API backend sẽ có hành vi mới khi *và chỉ khi* được merge/deploy; bản nháp vẫn nằm trong cùng bảng `tb_manual_posts_v1`.
- Một số URL và Workflow cũ sử dụng Worker lịch sử ngoài repo, chưa có bằng chứng chúng tương thích với thay đổi ở D1 Production. Không tự thử hoặc sửa chúng.
- PR phải để **Draft**, base là nhánh B; các Stage A/B và PR #8 vẫn ở trạng thái riêng. Không merge, không phát hành Production khi chưa có duyệt cụ thể.
- Không khởi động lại việc sao lưu D1 đã dừng; không ghi API admin thật, không khôi phục database.
- **Chặng tiếp theo theo kế hoạch: D (ADM-07/08/09)** — đồng bộ chức năng phụ, kiểm thử toàn bộ và chuẩn bị cổng nghiệm thu phát hành, chỉ khi người dùng yêu cầu.

**KẾT LUẬN: ADM-04 + ADM-05 + ADM-06 — DONE (CODE + ISOLATED QA PASS), PRODUCTION HOLD.**
