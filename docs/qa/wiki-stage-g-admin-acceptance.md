# TrainingBot Wiki V2 — Giai đoạn G.1–G.6: Quản trị Wiki (Preview)

**Ngày:** 29/10/2026. **Base:** nhánh F, PR #27. **Nhánh:** `aion-trainingbot-wiki-stage-g-20261029`. **Phát hành:** PR Draft, không thay đổi Production.

## G.1 — Kiểm kê kiến trúc Admin, dữ liệu và ranh giới bảo mật

- Mục Nội dung → Wiki đã tồn tại trong Admin V5 (six-groups) và router cũ. Admin có `#adminApp.hidden` khi chưa đăng nhập, `[data-view-panel="wiki"]` chỉ được kích hoạt bởi router cũ. Giữ nguyên các handler, session và API.
- Dữ liệu trang Wiki hiện tại là `DATA` trên client, được vá bởi nhiều lớp v147–v149. G tạo `wiki-stage-g-snapshot.js` **chỉ đọc** danh mục **runtime cuối 61 vũ khí, 51 phụ kiện, 26 phương tiện, 8 bản đồ** từ chính trang Wiki trong iframe cùng origin khi Admin được yêu cầu tải. Không tự dùng bản baseline 56/49 làm dữ liệu cuối.
- Kho hướng dẫn F: 16 bài JSON, source registries C/D có trạng thái xác minh theo phiên bản; chưa có CMS API ghi Wiki được phân quyền và nghiệm thu riêng. Không mạo nhận chức năng gửi sang D1/R2 đã hoạt động.

## G.2 — Khu vực quản lý trong Admin

- `admin-wiki-stage-g.js`/CSS: thêm workbench riêng bên trong trang Wiki Admin hiện hữu, **không thay thế menu V5 hoặc trang Posts**.
- Xem/lọc/tìm không dấu 146 mục dữ liệu gốc + 16 hướng dẫn, sửa nháp kiểm duyệt của từng bản ghi. Không thay tên, ID hay trường mô tả Wiki đang được phát trên Production.
- Chỉ hiển thị sau khi Admin được mở bằng cơ chế đăng nhập gốc. Nhánh G hoặc `TRAININGBOT_LOCAL_G_QA=1` mới gắn module thông qua `postbuild.sh`; main và các nhánh khác **không nạp module**.

## G.3 — Nguồn, hình ảnh, bản quyền và phiên bản

- Trường nháp: tình trạng, ghi chú, URL nguồn, phiên bản, ngày công bố, URL ảnh, loại quyền ảnh và URL dẫn chứng quyền sử dụng.
- Kiểm tra URL chỉ HTTPS, thiếu ngày/phiên bản/URL khi đề xuất đủ điều kiện, thiếu giấy phép hay nguồn quyền ảnh. Trạng thái **đề xuất đủ điều kiện không đồng nghĩa đã được server xác nhận hay xuất bản**.
- Không tự sao chép hình ảnh, không upload R2, không tự cấp phép sử dụng ảnh.

## G.4 — Nhật ký và phục hồi

- Nhật ký trước/sau theo từng bản ghi nằm **trong phiên JavaScript**, giới hạn 40 lần gần nhất mỗi mục; nút Undo phục hồi một lần chỉnh sửa.
- Xuất gói `wiki-g-draft1` JSON với `published:false`. Nhập gói kiểm tra đầy đủ schema, ID từ catalog runtime và định dạng. Toàn bộ gói nhập được kiểm tra trước khi áp dụng (atomic reject), hỗ trợ reset các nháp.
- **Không lưu bền vững:** tải lại trang sẽ mất những chỉnh sửa chưa xuất ra JSON. Không có phiên bản lịch sử máy chủ/rollback Production. Đây là công cụ soạn và kiểm tra nháp để chuẩn bị G bản có backend sau này.

## G.5 — Bảo mật & giới hạn quyền

- Giữ login gốc; không thêm endpoint, token hoặc ghi API. Tải dữ liệu chỉ khi Admin đang authenticated. Browser QA sử dụng token giả và intercept API trên loopback; không dùng credential thật.
- G không cấp thêm quyền truy cập máy chủ. Phân quyền **server-side** vẫn phải audit triển khai trước khi có CMS write thật (RBAC, CSRF, revision, audit trail, signed assets và rollback).
- Các tệp chỉ được attach trên G Preview / QA; không sửa Worker, API, D1/R2 hay nội dung công khai trên nhánh Production.

## G.6 — Điều kiện nghiệm thu

- [x] Đã viết workbench, schema, bridge, kiểm tra dữ liệu, Undo, nhập/xuất và build gate.
- [x] Đã viết Playwright kiểm tra Admin thật (login giả với API mock) tại 390/768/1440, dữ liệu 61/51/26/8+16, nguồn, lỗi, Undo, gói JSON và không có ghi API.
- [ ] GitHub Actions CI cho HEAD cuối phải **PASS** G và hồi quy F/E/D/C/B, SEO, D1.
- [ ] Cloudflare Pages Preview cho commit cuối phải **SUCCESS**.
- [ ] Kiểm tra thực tế UX trên host Preview / Admin có người đăng nhập hợp lệ: chưa thực hiện, không cho phép dùng dữ liệu Production để QA.
- [ ] API write CMS có server auth và phục hồi Production: **ngoài phạm vi G bản Preview này**; không được ghi hoàn tất như hệ thống xuất bản thật.

## Kế hoạch tiếp theo — H.1–H.5

1. **H.1:** Audit SEO các đường dẫn Wiki, canonical, sitemap, meta và các guide links cần index.
2. **H.2:** Tối ưu tài nguyên JavaScript/CSS và hình ảnh, xác minh tải lần đầu & lazy load ở các màn hình.
3. **H.3:** Kiểm tra accessibility, Core Web Vitals, responsive và tìm kiếm không dấu.
4. **H.4:** Kiểm tra liên kết nội bộ, nguồn ngoài, trạng thái lỗi và bộ nhớ trình duyệt.
5. **H.5:** QA tích hợp A–G, SEO/Preview isolation, lập PR Draft Preview. Sau đó chuyển I (nghiệm thu phát hành) khi dữ liệu/giấy phép và kế hoạch rollback đủ điều kiện.

**Không tự merge/đổi Production trước khi bạn cho phép.**
