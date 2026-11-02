# LIC-06.4A — Kiểm kê ảnh đang dùng và ứng viên tài sản hình ảnh TrainingBot

**Ngày nghiệm thu kiểm toán:** 02/11/2026. **Kết luận:** phần kiểm kê theo phạm vi đã đo đạt; **chưa** chứng minh giấy phép cho toàn bộ tài sản, **không** đóng Issue #61 hay D2.10-FINAL.

## Phạm vi đã kiểm chứng

- Dùng `npm run build` với `CF_PAGES_BRANCH=main` để tái dựng đúng thư mục `public` từ source archive và `overrides`.
- Đọc **157 tệp** công khai đủ điều kiện quét: 40 HTML, 55 CSS, 58 JS, 4 JSON; có 29 tệp di sản (mobile/Wiki cũ) được gắn nhóm riêng. **33 tệp Admin/private được loại khỏi phạm vi công khai**.
- Gửi GET **14 trang HTML công khai thành công**: 9 khu vực chính và 5 bài trong `sitemap-posts.xml`. Không gọi GET `/api/posts` vì endpoint có khả năng tạo schema D1 khi đọc.
- Bổ sung Chromium kiểm tra 5 trang Home, Wiki, Beta, News, Esports trên bản build local; giả lập API và chặn mạng ngoài, vì vậy đây là **bằng chứng giao diện thử nghiệm**, không phải tổng số ảnh thực tế người dùng Production đã xem.
- Tất cả hoạt động kiểm kê và hậu kiểm LIC-06.2/LIC-06.3 đều chỉ đọc, không cập nhật/xóa D1, R2, ảnh lưu trữ hoặc nội dung bài.

## Số liệu từ GitHub Actions

| Chỉ tiêu | Kết quả | Diễn giải |
|---|---:|---|
| Đường dẫn ảnh khác nhau | **228** | Hợp nhất tham chiếu từ tệp build và HTML Production; không khẳng định 228 ảnh được hiển thị |
| Số lần tham chiếu | **547** | Lần sử dụng trong các nguồn đã quét |
| Đường dẫn thấy trong HTML Production | **24** | HTML được tải trực tiếp; chưa nhất thiết nằm trong viewport |
| Trong HTML Production, còn thiếu bằng chứng quyền | **13** | Cần phân loại ở LIC-06.4C; chưa có nghĩa là đã vi phạm |
| Ảnh mới có mã nguồn tự tạo | **11** | 5 cặp SVG/PNG từ LIC-04 và 1 PNG TrainingBot mặc định; cần kiểm tra hồ sơ sở hữu nếu muốn khẳng định quyền rộng hơn |
| Ứng viên chỉ thấy trong CSS/JS source | **168** | Phải kiểm tra runtime / còn dùng hay không |
| Tài sản chưa đủ bằng chứng quyền trong toàn bộ phạm vi | **217** | Bao gồm phần lớn ứng viên nguồn; **không** tương đương 217 ảnh đang hiển thị hoặc 217 vi phạm |
| Tên miền ngoài có tham chiếu | **12** | Mới là tham chiếu; không đồng nghĩa đã tải về máy chủ hay có quyền đăng lại |
| Chromium local với API giả lập | **16 URL ảnh** | 5 trang mẫu, 8 URL có bằng chứng box geometry hiển thị; **không** thay thế dữ liệu Production |

### Tham chiếu có tần suất cao (không phải mức ưu tiên pháp lý tự động)

| Đường ảnh | Số lần xuất hiện trong vùng kiểm kê | Hướng rà soát |
|---|---:|---|
| `/editorial-original-trainingbot-share.png` | 100 | Hình mới tự tạo, đã có code, làm đối chứng |
| `/favicon.svg` | 100 | Kiểm tra nguồn thiết kế logo/icon của TrainingBot |
| `/pubg-game-avatar.webp` | 41 | **Ưu tiên P0:** ảnh hiển thị liên tục tại Home/Beta; đối chiếu nguồn, bản quyền |
| `/news-playgalaxy-cup-world-final-2026-cover.svg` | 15 | Kiểm tra nguồn và khả năng có artwork/branding của giải đấu |
| `/news-pubg-mobile-4-6-skins-events.jpg` | 11 | Kiểm tra tác giả/sự kiện/giấy phép đăng tin |
| `/news-mr-practice-arena-2026-cover.webp` | 9 | Rà nguồn ảnh giải đấu và sự cho phép |
| `/news-pubg-mobile-4-6-bloodline-cover.svg` | 9 | Kiểm tra hình SVG có chứa nội dung sao chép hay không |
| `/news-pubg-mobile-light-cover.webp` | 8 | Kiểm tra ảnh sự kiện PUBG Mobile Light |
| `/news-skin-smelting-cover.webp` | 5 | Rà nguồn và quyền ảnh bìa |
| `/pubg-mobile-light-avatar.webp` | 5 | Rà nguồn hình đại diện phiên bản nhẹ |
| `/trainingbot-logo-v110.png` | 5 | Thu thập bằng chứng sở hữu file logo/nguồn tạo |

### Tài sản có tham chiếu từ hệ thống bên ngoài

Các tên miền được tìm thấy: `www.pubgmobile.com`, `wstatic-prod-boc.krafton.com`, `pbs.twimg.com`, `img.gurugamer.com`, `cdn-www.bluestacks.com`, `cdn.topuplive.com`, `liquipedia.net`, `image.idn.media`, `pic.bittopup.com`, `raw.githubusercontent.com`, `static-cdn.manabuy.com`, `staticg.sportskeeda.com`. Trong bản kiểm kê hiện tại **49 URL ngoài là ứng viên chỉ có trong mã nguồn**; cần kiểm tra các luồng DOM thực tế trước khi kết luận có hotlink hoặc đăng lại.

## Những điều KHÔNG được suy ra

- Ảnh trả HTTP 200, ảnh được nhúng hoặc có chú thích nguồn không chứng minh giấy phép.
- Nội dung trong JS có URL ảnh không chứng minh ảnh được tải hoặc nhìn thấy bởi người dùng; lịch sử Wiki cũ khác UI đang phục vụ.
- Chromium local mô phỏng API để không kích hoạt D1; không chứng minh đầy đủ thẻ ảnh được render từ nguồn `/api/posts` thật.
- Không có quyền liệt kê toàn bộ R2, không có kết quả media origin/CDN private, không có dữ liệu bản quyền nội bộ hoặc kiểm tra thủ công từng ảnh; không thể tuyên bố kiểm kê tuyệt đối toàn bộ website.
- Chưa thay ảnh, xóa/chặn thêm URL, đổi canonical, sitemap, D1 hoặc R2 trong giai đoạn A.

## File bằng chứng và cách nghiệm thu

- Máy đọc: artifact `lic064a-audit-artifacts/sitewide-assets.json` gồm danh mục URL, vai trò xuất hiện, vị trí và phân loại source/built/live.
- Bảng lọc: `lic064a-audit-artifacts/sitewide-assets.csv`, mỗi hàng là một URL ảnh và các vị trí đã phát hiện.
- Bằng chứng trình duyệt: `lic064a-audit-artifacts/browser-observed.json` (mock API, external network blocked), chỉ dùng để phát hiện ảnh có khả năng do JS tạo.
- Build và QA gồm LIC-06.1 (35 metadata), LIC-06.2 (PNG mới), LIC-06.3 (đúng 5 chuyển hướng, không xóa R2), SEO/Wiki/Cloudflare.

## Kế hoạch tiếp theo

| Mã | Công việc | Điều kiện hoàn thành |
|---|---|---|
| **LIC-06.4B** | Với 24 URL thấy trong HTML, ưu tiên 13 ảnh thiếu bằng chứng; kiểm tra HTTP, redirect, loại tệp, nhà cung cấp; kiểm tra 12 domain ngoài và chỗ có thể hotlink | Có registry kỹ thuật và rủi ro theo URL, không nhầm source candidate với ảnh hiển thị |
| **LIC-06.4C** | Thu thập nguồn gốc/điều khoản/giấy phép từng ảnh được dùng công khai; phân nhóm đồ họa gốc, bên thứ ba có giấy phép, chưa rõ quyền | Có bằng chứng gắn với URL và mã hash; không dùng suy luận thay giấy phép |
| **LIC-06.4D** | Chỉ thay những ảnh phải thay bằng hình gốc hoặc được cấp quyền; kiểm thử các trang hiện ảnh, metadata, nguồn, SEO/Wiki | PASS trên Preview và Production, rollback được, không xóa D1/R2 khi chưa có lý do |
| **D2.10-FINAL** | Đối chiếu danh sách rủi ro tồn dư (5 tài sản cũ lưu trong R2 và ảnh khác) | Chỉ đóng khi các yêu cầu quyền trong phạm vi được xử lý đầy đủ |
| **D3.2** | Tiếp tục nguồn và danh mục Wiki sau nghiệm thu D2 | Có nguồn, version, QA đầy đủ |

**Trạng thái:** LIC-06.4A nghiệm thu phần **kiểm kê có giới hạn và báo cáo minh bạch**; LIC-06.4B/C/D và D2.10 chưa nghiệm thu.
