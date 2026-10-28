# TRAININGBOT ADMIN CENTER — HƯỚNG DẪN VẬN HÀNH (ADM-10)

Phiên bản bàn giao: 28/10/2026 · Phạm vi: nhánh Admin Stage E kế thừa A → B → C → D. Đây là tài liệu cho chức năng đang được phát triển **trên Preview**, không phải xác nhận đã đưa lên Production.

## 1. Vào trang quản trị và chọn chức năng

1. Dùng đường dẫn quản trị **đã được cấu hình và cấp phép** (`/admin.html` hoặc alias `/admin` nếu đã kiểm chứng trong môi trường tương ứng).
2. Đăng nhập bằng thông tin được cấp bởi người quản trị; **không** gửi token, mật khẩu qua tin nhắn và **không** đặt token vào ảnh chụp, report hay query URL.
3. Menu hiện có 6 nhóm, 13 màn:
   - **TỔNG QUAN:** Tổng quan.
   - **NỘI DUNG:** Bài viết, Trang web, Wiki, Studio V2, Phiên bản Beta.
   - **THƯ VIỆN:** Media.
   - **CỘNG ĐỒNG:** Người dùng, Hộp thư.
   - **THỐNG KÊ:** Thống kê, Theo dõi truy cập.
   - **CÀI ĐẶT:** Bảo mật, Hệ thống.
4. Trên điện thoại, mở/đóng thanh điều hướng bằng các nút menu; tránh tải lại hoặc thoát khi form đang báo nội dung chưa lưu.

**Lưu ý:** Các màn cùng nhóm không có cùng quyền thực hiện thao tác. Nút hiện ra không thay thế kiểm soát quyền ở server.

## 2. Tạo bài viết mới, lưu nháp, xuất bản

1. Trong **Nội dung → Bài viết**, chọn **Tạo bài đăng**.
2. Nhập tiêu đề, nội dung và các trường form yêu cầu; kiểm tra slug, chuyên mục, hình bìa và nội dung trước khi quyết định.
3. Chọn **Lưu nháp** để chưa công khai hoặc **Xuất bản** để đưa bài lên trang công khai. Chỉ coi đã lưu khi thấy phản hồi **thành công** từ API; không bấm lặp trong lúc có trạng thái đang lưu.
4. Dùng ô tìm kiếm (tiêu đề/chuyên mục/slug) hoặc lọc **Tất cả / Bản nháp / Đã xuất bản** để tìm lại bài.
5. Với bài đã có, dùng **Chỉnh sửa** để mở Rich Editor. Rich Editor cũng có hai thao tác **Lưu nháp** và **Xuất bản**. Việc cập nhật bài đang công khai có thể tác động ngay trang công khai; xác nhận lại trạng thái trước khi bấm.
6. Nếu lưu thất bại, **không đóng editor hoặc xóa bản soạn**. Ghi thông báo lỗi (không gồm token) và thử lại sau khi xác định tình trạng API. Form có cảnh báo khi đóng khi còn sửa đổi chưa lưu, nhưng **chưa được chứng minh có tính năng tự phục hồi nội dung sau đóng tab/mất điện**.
7. Bài nháp không xuất hiện trong `/api/posts` và trang bài viết công khai ở hợp đồng backend hiện có. Trước khi phát hành thực tế phải kiểm chứng lại trên môi trường staging được cách ly.

## 3. Chỉnh sửa nội dung trang web

1. Vào **Nội dung → Trang web**. Chọn đúng đối tượng trong danh sách trang hiện có (Trang chủ, Bản cập nhật, Tin tức, Wiki, Cộng đồng, Liên hệ) rồi chọn **Chỉnh sửa** theo thao tác có thật.
2. Nếu trang đó mở **Studio V2**, kiểm tra tiêu đề/URL và thành phần cần sửa trước khi lưu. **Không giả định** mọi vùng trên trang đều có API chỉnh sửa được.
3. Xem trước thay đổi bằng chức năng có sẵn, nếu môi trường và API hỗ trợ; nếu chỉ có **Mở trang** thì đây là trang hiện công khai, **không** phải Preview nháp.
4. Chỉ lưu sau khi người vận hành được phép cập nhật môi trường đó, và phải kiểm tra phản hồi server cùng trang đích. Không thực hiện kiểm thử ghi trên Production hoặc Preview đang nối cùng Worker/D1 thật.

## 4. Quản lý phiên bản Beta

1. Vào **Nội dung → Phiên bản Beta**. Danh sách, thao tác **Sửa** / **Xóa** và form thêm/cập nhật tách khỏi màn Trang web.
2. Mở phần biểu mẫu thêm/sửa, nhập phiên bản, kiến trúc, trạng thái và URL tải đúng theo form; chỉ chọn trạng thái **Đã phát hành** sau khi kiểm tra liên kết tải thực tế bằng cách an toàn và được phép.
3. Kiểm tra bản cần sửa trước khi bấm **Lưu**; thao tác cập nhật/xóa có thể làm thay đổi danh sách bản tải trên website công khai.
4. Nếu hệ thống trả **Phiên đăng nhập không hợp lệ hoặc đã hết hạn**, không tiếp tục gửi form. Giữ nội dung đang nhập, đăng nhập lại ở môi trường được phép và kiểm tra trạng thái trước khi thao tác lại.
5. Tránh tạo phiên bản giả hoặc dùng đường dẫn tải chưa kiểm chứng. Lỗi trùng phiên bản, URL sai, quy tắc so sánh version và việc phát hành thật phải được nghiệm thu trên staging với D1 riêng trước khi chốt Production.

## 5. Thư viện, người dùng, hộp thư, thống kê

- **Thư viện:** danh mục media có thể chỉ là dữ liệu lưu ở *trình duyệt đang dùng*, **không** phải bản kiểm kê toàn bộ R2/server. Không xóa hoặc phục hồi ảnh đang được bài viết tham chiếu nếu chưa kiểm tra.
- **Người dùng:** chỉ tin số liệu sau khi API thành công; nếu màn báo lỗi/không xác nhận, ngừng xuất CSV hoặc thay trạng thái tài khoản cho tới khi tải lại thành công. Không thử khóa tài khoản thật để nghiệm thu.
- **Hộp thư:** trạng thái đến từ Worker cũ. Nút **Trả lời** mở Gmail để soạn, **không tự gửi** và không tự đánh dấu đã trả lời. Nếu nạp dữ liệu lỗi, không dọn hộp thư.
- **Thống kê:** số liệu thiếu/mạng lỗi là **chưa có dữ liệu đã xác thực**, không đồng nghĩa bằng 0. Nút **Làm mới dữ liệu nguồn** hiện tải lại nguồn Người dùng/Hộp thư cũ.
- **Hệ thống/Bảo mật:** kiểm tra nhanh hiện chỉ bao quát 3 API (Người dùng, Hộp thư, Studio). Ba API đạt không có nghĩa toàn bộ Pages, Worker, D1, R2, download và chức năng ghi đều tốt.

## 6. Xử lý sự cố phiên và thao tác

| Tình huống | Người vận hành cần làm |
| --- | --- |
| 401 / hết phiên | Dừng gửi thao tác ghi; bảo toàn bản soạn; đăng nhập lại khi có môi trường được phép, rồi kiểm tra đã lưu hay chưa |
| 403 / không có quyền | Dừng thao tác; yêu cầu người có quyền kiểm tra phân quyền server, không dùng token khác tùy tiện hoặc tắt auth |
| API 5xx / mất mạng | Ghi màn hình và thời điểm, thử lại thao tác GET an toàn; không bấm POST liên tiếp khi chưa rõ server đã ghi hay chưa |
| Thông báo “Đã lưu” nhưng dữ liệu không hiện | Kiểm tra lại bằng GET sau khi xác thực; ghi request-id nếu có, không lặp ghi ngay |
| Lỗi đăng nhập/lưu bài sau phát hành | Thực hiện runbook rollback do người phụ trách phát hành quản lý; không tự phục hồi DB |
| Nghi mất dữ liệu hoặc sai quyền | Dừng triển khai; báo sự cố P0, bảo toàn chứng cứ, dùng bản phát hành đã xác minh trước đó theo quy trình |

## 7. Nguyên tắc bắt buộc

- Mọi thử nghiệm **lưu/xuất bản/xóa/khóa tài khoản/gửi tin** phải có môi trường staging được chứng minh là độc lập với Production, quyền phù hợp và dữ liệu giả.
- Không truy vấn/ghi Production chỉ để chụp ảnh nghiệm thu. Một số handler **GET cũng có thể chạy CREATE TABLE IF NOT EXISTS**, vì vậy ngay cả đọc API quản trị cũng không mặc định vô hại.
- Tuyệt đối không bật lại workflow sao lưu D1 từng bị dừng, không đặt secrets vào GitHub, không thay Cloudflare bindings và không tắt auth nhằm vượt lỗi.
- Khi báo lỗi, ghi: **màn hình – thao tác – thời điểm – kết quả mong đợi – kết quả thực tế – trình duyệt/kích thước – mã HTTP (nếu có)**. Loại bỏ token, email riêng tư, thông tin tài khoản và nội dung nhạy cảm.

Tài liệu kỹ thuật, checklist phát hành và rollback: `docs/qa/admin-stage-e-adm10-release-readiness.md`.
