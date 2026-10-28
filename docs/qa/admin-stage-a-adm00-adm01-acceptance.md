# TRAININGBOT ADMIN CENTER — GIAI ĐOẠN A: ADM-00 / ADM-01
Ngày: 2026-10-28. Loại: Preview-only, phát triển trên nhánh tách riêng `aion-trainingbot-admin-stage-a-20261028` từ Production `d3292150abd1dc01f6051b177808be4805bf94b9`.

## A.1 — ADM-00: Kiểm kê (hoàn tất về mã nguồn)

- Runtime Admin hiện hành: 16 mảnh base64/gzip trong `overrides/admin-v2-runtime`, dựng từ `overrides/admin.html`; giải nén ~84.328 byte. Studio đóng gói riêng. Gói tĩnh gốc dựng từ 31 mảnh `source_parts`; `build.sh` và `postbuild.sh` tạo ra `public/` (artifact sinh, không phải nguồn chỉnh sửa).
- Các view: dashboard, content, studio, media, wiki, users, inbox, analytics, security, system; view posts được thêm bởi loader, visitor-tracking được thêm bởi script bên ngoài. Routing cũ dùng hash.
- Các nguồn có thể sửa trực tiếp mà không viết lại backend: `overrides/admin_beta_versions_v175.js`, `admin_posts_manual_v171.js`, `admin_visitor_tracking_v177.js`, và `postbuild.sh`.
- Admin sử dụng `ADMIN_TOKEN` + Pages/D1 ở một số API, và một số endpoint qua Worker lịch sử. Không tự suy đoán mọi Worker có cùng quyền và dữ liệu.
- `tools/admin/audit-runtime.mjs` cho phép tái hiện việc kiểm kê bằng lệnh `node tools/admin/audit-runtime.mjs --states --dashboard --auth`; không đăng nhập, không xuất secret, không ghi DB.
- Không chỉnh sửa bất kỳ mảnh runtime gốc, ZIP nguồn, schema D1, hoặc Worker nào.

## A.2 — ADM-01: Trạng thái đăng nhập và dữ liệu (hoàn tất mã nguồn và kiểm thử mô phỏng)

| Thành phần | Chỉnh sửa chính | Kiểm chứng |
| --- | --- | --- |
| Quản lý Beta | Chưa đăng nhập khác 401 hết phiên / 403 không quyền; 503 và mất mạng là lỗi; trạng thái chờ tải và chưa có dữ liệu không được hiển thị như danh sách rỗng. Chỉ API GET thành công với mảng hợp lệ mới xác nhận 0. Có nút tải lại, giữ biểu mẫu khi lỗi. | PASS với API giả |
| Danh sách bài viết | Lỗi tải/401/403/mất mạng không giả báo 0 bài hoặc giữ danh sách cũ mà không ghi rõ. Kết quả thực sự rỗng hiển thị riêng. | PASS với API giả |
| Theo dõi truy cập | Bốn KPI khởi tạo là “—”, không phải 0. Lỗi kết nối/hết phiên/không quyền đặt về “—”. Kết quả GET thành công bằng 0 mới là số 0 thật. | PASS với API giả |
| Tổng quan | Tránh mặc định 0 khi hai API người dùng/hộp thư không đáp ứng; thông báo chưa xác thực, ngăn hành động nói “đã xử lý” khi chưa biết trạng thái. | PASS mock sau đăng nhập giả |
| Trạng thái hệ thống | Thay điểm 100 tuyệt đối bằng `X/3 API kiểm tra`; không coi các phép thử GET là toàn bộ sức khỏe hệ thống. | PASS mock cả đầy đủ và lỗi một phần |

**Phương án mã nguồn:** Runtime gốc vẫn để nguyên, các chỉnh sửa hành vi Dashboard được mô tả bằng quy tắc dễ đọc trong `tools/admin/adm01-runtime-transform.mjs`, áp dụng có kiểm tra chính xác vào `public/admin.html` lúc build; nếu mã nguồn runtime thay đổi và không còn khớp, build thất bại thay vì tự sửa nhầm. Những chỉnh sửa trạng thái khác đặt trong các file JS đọc được dưới `overrides/`. Không vá tay blob base64, không thay đổi quyền API, không tự tạo tài khoản.

## A.3 — Kiểm thử và bằng chứng

- GitHub Actions: `TrainingBot Admin Stage A — state audit and mock QA`, run `40608839168`: **SUCCESS**. https://github.com/Gamevalentine/trainingbot-cloudflare/actions/runs/40608839168
- Build `npm run build` PASS; script syntax PASS; mã nguồn runtime audit và patch an toàn PASS.
- Trình duyệt Playwright trên local host, API giả, kiểm tra Beta (chưa login, 401, 403, 503, zero, có dữ liệu, offline, dữ liệu sai cấu trúc): PASS.
- Danh sách bài viết và KPI khách truy cập: tương tự, PASS.
- Form login thật của Admin chạy với **mật khẩu giả và route GET giả**, không gọi server thật; ba trường hợp Dashboard `zero`, `data`, `partialFailure` đều PASS.
- Trong bài test các lượt gọi giả cho Beta/bài viết/khách: 23 đọc, **0 ghi**; các bài test Dashboard riêng cũng **0 ghi**.
- Không có test xóa, gửi tin, phát hành bài viết hoặc sửa bất kỳ dữ liệu Production nào.

## A.4 — Phạm vi nghiệm thu và giới hạn Production

- **Đã nghiệm thu:** build riêng, các trạng thái chuẩn và lỗi, dữ liệu đã xác thực, 5 Pages Functions gốc (mã handler Production) được thực thi với `ADMIN_TOKEN` giả và D1 cách ly, kèm đăng nhập Admin gốc từ trình duyệt. Đây là kiểm thử tích hợp API thật nhưng môi trường/database mô phỏng, không phải xác minh tài khoản Production.
- **Chưa xác nhận:** đăng nhập bằng tài khoản quản trị thật trong môi trường có đủ quyền, Worker cũ ở production và phép lưu/đăng bài bằng dữ liệu thử được cho phép. Chưa thể lấy kết quả thực tế này thay cho việc thử bằng mock.
- **Kết luận giai đoạn A: HOÀN TẤT (mã nguồn + build + tích hợp kiểm thử cách ly, QA PASS)**. Không chia tiếp ADM-00/ADM-01. Việc kiểm tra Production bằng tài khoản thật thuộc cổng phát hành toàn dự án, không được suy diễn từ kết quả kiểm thử này; chưa có phê duyệt merge/deploy.
- Giai đoạn B (ADM-02/03) chưa bắt đầu trong **nhánh A**. Những thay đổi sớm ở PR #8 vẫn Draft riêng, không merge/copy vào A. Không chuyển B tự động.

## A.5 — Phạm vi an toàn / Quay lui

- Chỉ thay đổi `overrides/admin_beta_versions_v175.js`, `admin_posts_manual_v171.js`, `admin_visitor_tracking_v177.js`, `postbuild.sh`, `tools/admin/`, workflow QA và tài liệu. Không thêm công cụ sao lưu.
- Để hủy các thay đổi Admin Stage A, không merge PR hoặc revert commit giao diện trên branch; không can thiệp hoặc phục hồi database. Không cần làm thay đổi dữ liệu.
- Chỉ phát hành Production khi người dùng duyệt rõ bản Preview, và QA có bằng chứng đăng nhập/chức năng thật phù hợp với quyền dữ liệu.


## A.6 — Kiểm thử tích hợp API THẬT trong môi trường cách ly (hoàn thành 2026-10-28)

- `tools/admin/adm01-real-handler-integration.mjs` import trực tiếp **mã nguồn Pages Functions thật** và chạy các endpoint `users`, `beta-versions`, `posts`, `visitor-events`, `studio/content` với token thử và D1 giả nằm trong bộ nhớ; không tải server Production và không có biến môi trường bí mật.
- Với **cả 5 handler**, không có token hoặc token sai cho HTTP 401 **trước khi đọc/ghi DB**, đúng token thử trả HTTP 200 và cấu trúc JSON hợp lệ: **PASS**.
- Đã chạy **form đăng nhập từ runtime Admin gốc** trong Playwright, thử token sai (không vào được Admin) rồi token hợp lệ (vào được và tải được Dashboard + Beta từ handler thực): **PASS**.
- Nguồn bên ngoài được chặn trước khi gửi request, và mọi POST/PATCH/DELETE từ trình duyệt đều bị chặn: **0 thao tác HTTP ghi**, **0 kết nối ngoài**. Một yêu cầu tải tài nguyên bên ngoài bị intercept/abort.
- Phát hiện quan trọng khi kiểm tra: một số GET handler thật chạy `CREATE TABLE IF NOT EXISTS`/schema initialization. Trong test này, các lệnh đó chỉ được gọi vào **D1 giả trong RAM**; không gọi D1 Production. Đây là lý do **không thực hiện thử API GET Admin trực tiếp trên Production** khi chưa có quyền tác động dữ liệu thật.
- Lần QA cuối cho mã tích hợp: [GitHub Actions #40609818732](https://github.com/Gamevalentine/trainingbot-cloudflare/actions/runs/40609818732) — **SUCCESS**. Kết quả này bổ sung, không thay thế các test UI và Dashboard thành công trước đó.

## A.7 — Quyết định chốt chặng

**ADM-00 + ADM-01: ĐÃ XONG về triển khai và QA tích hợp trong môi trường cách ly.**

Giai đoạn A không còn công việc lập trình/kiểm thử mô phỏng treo lại. PR #9 vẫn Draft vì đó là **cổng phát hành Production riêng**, không phải yêu cầu tiếp tục tách giai đoạn A. Giai đoạn B/PR #8 không được đưa lẫn vào PR #9. Không dùng token thật, không sửa DB, không làm sao lưu.
