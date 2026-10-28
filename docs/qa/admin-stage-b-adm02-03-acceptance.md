# TrainingBot Admin Center — NGHIỆM THU GIAI ĐOẠN B (ADM-02 + ADM-03)

**Ngày:** 28/10/2026  
**Nhánh phát triển:** `aion-trainingbot-admin-stage-b-20261028`  
**Nhánh gốc:** `aion-trainingbot-admin-stage-a-20261028` (PR #9, mã nguồn ADM-00/01 đã PASS, chưa merge Production).  
**Phạm vi:** chỉ Stage B; không chỉnh backend hoặc gộp các hạng mục ADM-04/05/06 thuộc giai đoạn khác.

## 1. Trạng thái

| Hạng mục | Phạm vi thực hiện | Trạng thái nghiệm thu |
| --- | --- | --- |
| **ADM-02.1** | Menu sáu nhóm, nhãn chức năng rõ ràng | **PASS** |
| **ADM-02.2** | Giữ nguyên mười màn Admin gốc và hai màn động `posts`, `visitor-tracking` | **PASS** |
| **ADM-02.3** | Bảo toàn nút và sự kiện xử lý gốc khi di chuyển menu | **PASS** |
| **ADM-02.4** | Chuyển màn, URL hash, Back/Forward, mở trực tiếp `#posts` sau đăng nhập | **PASS** |
| **ADM-03.1** | Bố cục tối màu nhất quán, sidebar, topbar, trạng thái đang chọn | **PASS** |
| **ADM-03.2** | Responsive trên 360, 390, 768, 1024, 1440 px; không tràn ngang | **PASS** |
| **ADM-03.3** | Bàn phím Enter, focus rõ ràng, Escape đóng menu trên mobile, nút bỏ qua menu | **PASS** |
| **ADM-03.4** | Giữ màn đăng nhập và nguồn dữ liệu cũ, không thay quyền truy cập | **PASS** |
| **Regression A** | Chạy lại tất cả bài kiểm thử ADM-01 và 5 API thật với DB/token giả | **PASS** |

### Sáu nhóm menu

1. **TỔNG QUAN** — Tổng quan.
2. **NỘI DUNG** — Bài viết, Trang web, Wiki, Studio V2.
3. **THƯ VIỆN** — Thư viện media.
4. **CỘNG ĐỒNG** — Người dùng, Hộp thư.
5. **THỐNG KÊ** — Thống kê, Theo dõi truy cập.
6. **CÀI ĐẶT** — Bảo mật, Hệ thống.

Các nút Bài viết và Theo dõi truy cập được bộ mã cũ thêm sau khi nạp trang. Stage B giữ nút DOM gốc, cập nhật vị trí khi có nút mới, không tạo bản sao hay thay các listener hiện có. Studio và phần quản lý Beta cũ **không bị xóa/chuyển sang một backend mới**. Trang riêng của Beta và các chức năng biên tập thuộc giai đoạn C, chưa thực hiện trong B.

## 2. File đã thay đổi của riêng Stage B

- `overrides/admin-stage-b-ui.js`: JavaScript UI dễ đọc, chỉ xử lý bố cục, menu, nhãn và điều hướng; không gọi API, không lưu thông tin đăng nhập.
- `postbuild.sh`: gắn script UI Stage B sau loader Admin lịch sử trên bản `public/admin.html` được dựng từ source; vẫn giữ nguyên 16 mảnh runtime nén và bản vá trạng thái đã PASS của Stage A.
- `tools/admin/adm02-03-ui-qa.mjs`: 5 viewport, 12 đích, login fake, Back/Forward, deep link, responsive và bàn phím.
- `.github/workflows/trainingbot-admin-stage-b-qa.yml`: yêu cầu **đồng thời** Stage-A regression PASS và Stage-B acceptance PASS; lưu hai ảnh screenshot chỉ chứa số liệu/tài khoản giả, giữ tối đa 7 ngày.
- Tài liệu này.

## 3. Bằng chứng thực thi

- **Actions run #40611896579: SUCCESS.** https://github.com/Gamevalentine/trainingbot-cloudflare/actions/runs/40611896579
- Các kích thước `360 / 390 / 768 / 1024 / 1440` đều có dòng `ADM-02/03 ... PASS` trong log, 12 đích điều hướng được kích hoạt từng lượt, không chỉ kiểm tra có nút.
- Bài test mới mở tab riêng tại `/admin.html#posts`, đăng nhập bằng token giả, xác nhận panel Bài viết thực sự được kích hoạt và tiêu đề chính xác; PASS.
- Stage-A data/auth/backend test được chạy lại độc lập và PASS, bao gồm các trường hợp thiếu token/401/403/mất mạng.
- Ảnh đối chiếu giao diện giả lập: `admin-stage-b-synthetic-desktop-mobile`, 390px và 1440px, chỉ nội dung giả. https://github.com/Gamevalentine/trainingbot-cloudflare/actions/runs/40611896579/artifacts/12783651814
- **Không có POST/PATCH/DELETE, không có kết nối từ test ra hệ thống thật, không ghi Cloudflare D1**. Tài nguyên ngoài được chặn, API được giả lập trong test trình duyệt.

## 4. Giới hạn, không đánh đồng PASS với Production

- Đã hoàn tất **mã nguồn, build, kiểm thử tự động và browser responsive giả lập** của giai đoạn B. Chưa nghiệm thu trực tiếp bằng thiết bị vật lý hoặc phiên đăng nhập Admin Production.
- Các phần thuộc C/D/E như quản lý bài viết hoàn chỉnh, tách hẳn Beta, biên tập nháp/xuất bản, chức năng phụ, phát hành Production **không được tuyên bố đã hoàn thành**.
- Không sửa `main`, không merge PR #9 hoặc PR #8, không cấp thêm quyền, không đổi schema, không khôi phục sao lưu.
- PR Stage B nên đặt **base là nhánh Stage A**, không trực tiếp vào main, để chỉ hiển thị delta ADM-02/03; khi A được phê duyệt và merge thì cập nhật base phù hợp.

## 5. Kết luận và chặng kế tiếp

**Giai đoạn B (ADM-02/03): HOÀN TẤT MỨC MÃ NGUỒN + QA TÍCH HỢP CÁCH LY.** Không còn hạng mục B nào đang chạy.

**Tiếp theo: Giai đoạn C** (chỉ khi người dùng yêu cầu) — hoàn thiện Tổng quan, các khu vực nội dung và trình biên tập (ADM-04, ADM-05, ADM-06). Không tự tiếp tục, không triển khai Production khi chưa được phê duyệt.
