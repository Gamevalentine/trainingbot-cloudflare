# TrainingBot Admin Demo — Preview cách ly

**Ngày:** 28/10/2026 · **Nhánh:** `aion-trainingbot-admin-demo-20261028` (phát triển từ Stage E, KHÔNG MERGE vào Production).

## Cách mở

- URL phát hành theo build Preview của nhánh Demo: `/admin-demo` hoặc `/admin-demo.html`.
- **Không dùng** `/admin` hoặc `/admin.html` để thử nghiệm giả lập. Những đường dẫn này vẫn là Admin thật và có thể kết nối API hiện hành.
- Vào `/admin-demo` là tự mở Admin với token giả nội bộ, không phải nhập mật khẩu thật.
- Nút **Làm lại Demo** ở góc màn hình tải lại để đưa dữ liệu mẫu về trạng thái ban đầu.

## Phạm vi thực tế

- Sử dụng đúng Admin đã build qua A → B → C → D, gồm 6 nhóm, 13 màn quản trị, Dashboard và các editor/Beta hiện có.
- Các request `fetch('/api/...')` bị trả dữ liệu trong **RAM của tab**; không chuyển tiếp tới Cloudflare/Worker/D1/R2. `XMLHttpRequest`, `sendBeacon`, WebSocket và mở cửa sổ bên ngoài được chặn. Các form không gửi mặc định nhờ CSP.
- Session/localStorage được mô phỏng riêng trên Demo page, không đọc token quản trị đã lưu.
- Dữ liệu mẫu: 2 bài viết (1 published, 1 draft), 2 phiên bản Beta, 1 tài khoản giả và 1 thư giả. Không dùng email, hồ sơ hay bí mật thật.
- Hỗ trợ tạo bài, lưu nháp, sửa và giả lập xuất bản (POST/PATCH), tìm kiếm/lọc bài; Beta giả lập thêm/sửa/xóa. Những thay đổi chỉ sống trong tab và mất khi reload.
- Thao tác không có mock nghiệp vụ đầy đủ (upload R2, gửi Gmail, thay đổi cấu hình hệ thống, quản trị Worker...) sẽ **không chạy thật**. Một số view được hiển thị để đánh giá layout, không đồng nghĩa backend nghiệp vụ đã được nghiệm thu.
- Link công khai, download, mở tab ngoài bị chặn ở giao diện Demo; không thể dùng dữ liệu Demo để kiểm tra tải tệp thật.

## Cơ chế build chống lẫn Production

- `postbuild.sh` chỉ tạo `public/admin-demo.html` nếu `CF_PAGES_BRANCH=aion-trainingbot-admin-demo-20261028`, hoặc QA cục bộ có `TRAININGBOT_LOCAL_DEMO=1`.
- Mọi build khác xóa `admin-demo-runtime.js` và `admin-demo.html` khỏi output, kể cả lỡ mang source Demo vào nhánh Production.
- `tools/admin/build-demo.mjs` bắt đầu từ `public/admin.html` đã được build A–D và chỉ chèn fake interceptor **vào bản copy Demo**. Nó bảo vệ `admin.html` khỏi thay đổi.
- Build command vẫn là `npm run build`; Cloudflare Pages thường cấp `CF_PAGES_BRANCH` tại build. Nếu nhánh không khớp sẽ **không** tạo Demo để tránh xuất bản nhầm.
- Source thực tế: `overrides/admin-demo-runtime.js`, `tools/admin/build-demo.mjs`, `tools/admin/admin-demo-qa.mjs`, và workflow QA riêng.

## Nghiệm thu và ranh giới bằng chứng

- Pipeline `.github/workflows/trainingbot-admin-demo-qa.yml` kiểm tra **hai build**: kiểu Production phải không có Demo, kiểu Preview tạo Demo và không tiêm script vào Admin thật.
- Playwright kiểm thử 390px và 1440px: login giả, 6 nhóm/13 màn, bài nháp, giả lập xuất bản, Beta, reset dữ liệu sau refresh và **không có HTTP request `/api`/cross-origin**.
- Chạy hồi quy A/C/D trên Admin thật với token và API giả; QA thực hiện trên local server chứ không dùng Production.
- Cloudflare Preview URL chỉ được coi hợp lệ sau khi check **đúng SHA** và GET trang Demo đã thành công.
- Không có kiểm thử đăng nhập tài khoản thật, Worker live, D1/R2 Production hay quyền ghi nghiệp vụ thực. Demo PASS không thay thế staging QA; cổng phát hành E vẫn HOLD.
- **Production main và PR #9–#13 vẫn không merge**; không khôi phục sao lưu D1 đã dừng, không cập nhật secrets, không thay Worker, không xóa dữ liệu.

**Tóm lại:** Đây là Demo tương tác nhằm giúp chủ website nghiệm thu thiết kế và thao tác giao diện, không phải Admin Preview có quyền ghi dữ liệu thật.
