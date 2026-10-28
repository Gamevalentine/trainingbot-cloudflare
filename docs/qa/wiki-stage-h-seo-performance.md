# TrainingBot Wiki V2 — Giai đoạn H.1–H.5: SEO và hiệu năng

**Ngày:** 29/10/2026. **Nhánh:** `aion-trainingbot-wiki-stage-h-20261029` kế thừa PR #28 (G) đang Draft, Preview trước Production.

## Phạm vi thay đổi

| Mục | Nội dung và bằng chứng |
|---|---|
| H.1 | `tools/wiki/stage-h-build.mjs`: cập nhật title, description, OG/Twitter và CollectionPage/ItemList JSON-LD từ **16 bài F có thật** trên trang Wiki, giữ **1 canonical /wiki**. Không giả mạo URL bài viết HTML riêng hay đưa `?guide` vào sitemap khi nội dung hiện render client-side. |
| H.2 | `wiki-stage-h-perf.js`: ảnh thẻ Wiki từ thứ 5 trở đi được gợi ý lazy/low priority, 4 ảnh đầu giữ eager; decode async; MutationObserver có phạm vi grid, không sửa dữ liệu game. `wiki-stage-f-guides.js` dùng cache HTTP mặc định cho JSON tĩnh thay vì no-store mỗi lần vào. |
| H.3 | `tools/wiki/stage-h-browser-qa.mjs`: Chromium headless đo FCP, LCP quan sát được, CLS không do tương tác và thời gian thực thi phản hồi click mẫu; kiểm tra tràn giao diện và điều khiển hướng dẫn ở 390/768/1440px, xuất JSON/screenshots. |
| H.4 | `tools/wiki/stage-h-link-audit.mjs`: kiểm tra source registry C/D, URL HTTPS nằm trong host allowlist, 16 ID permalink, tài nguyên trong build, canonical, sitemap/robots. Link bên ngoài **không được ping** và quyền sử dụng ảnh **chưa được kiểm chứng**. |
| H.5 | GitHub Actions workflow mới: build H + G, thử link/SEO, đo Chromium, hồi quy G/F/E/D/C/B, SEO/D1, build giả lập main xác nhận không phát tán G/H, lưu artifact QA. |

## Chất lượng số liệu

- Chỉ gọi số liệu đo trong CI là **local headless browser lab**, không được quảng cáo là Core Web Vitals thực tế. Không có CrUX, field INP, throttling thiết bị thật, mạng di động thật hoặc Lighthouse Score chuẩn khi chưa chạy đo tương ứng.
- Quy trình thử nghiệm chặn hình ảnh/Google Fonts ngoài origin; điều đó giới hạn kết luận về LCP thực tế, chất lượng tải ảnh và kết nối mạng.
- 16 liên kết hướng dẫn `?guide=id` là trạng thái giao diện trong một trang canonical. Muốn SEO riêng từng hướng dẫn phải tạo HTML URL độc lập có nội dung crawlable, rồi chỉnh sitemap/canonical trong giai đoạn tiếp theo.
- Không được công nhận nguồn thông số hoặc giấy phép hình ảnh chỉ vì DNS, cú pháp URL và registry C/D hợp lệ.

## Tiêu chí nghiệm thu

- [x] Tệp mã H, QA và workflow được thêm trên nhánh riêng; không chỉnh Worker/D1/R2/Production.
- [ ] H.1/H.4 static SEO và source-link audit PASS.
- [ ] H.2/H.3 Chromium chạy PASS đủ 390/768/1440 và có file số đo **thực** trong artifact.
- [ ] H.5 hồi quy G/F/E/D/C/B + SEO/D1 và Production exclusion PASS.
- [ ] Cloudflare Pages Preview đúng HEAD cuối `Deploy successful` và có địa chỉ nghiệm thu.
- [ ] Nghiệm thu UX trực tiếp trên Cloudflare Pages bằng thiết bị thật: cần kiểm tra thêm nếu chưa có thử nghiệm độc lập.

## Kế hoạch tiếp theo — Giai đoạn I: chuẩn bị phát hành Wiki V2

| Mục | Công việc kế tiếp |
|---|---|
| I.1 | Kiểm toán toàn bộ thay đổi A–H, conflict PR nhánh kế thừa và schema nguồn dữ liệu. |
| I.2 | Kiểm tra bảo mật đăng nhập Admin, quyền ghi server-side, chống XSS/CSRF và audit trail; không tự xuất bản khi thiếu backend CMS thật. |
| I.3 | Xác minh chính xác nguồn/cập nhật phiên bản, quyền hình ảnh, chất lượng bộ phụ kiện, xe/bản đồ; chốt backlog còn thiếu. |
| I.4 | Đối chiếu thực tế Cloudflare Preview trên mobile/tablet/desktop; chuẩn bị manifest, sao lưu và rollback nếu phát hành. |
| I.5 | Lập biên bản Go/No-Go, yêu cầu quyền phát hành Production riêng trước khi merge hoặc deploy. |
| I.6 | Chỉ sau chấp thuận: triển khai từng bước Production, theo dõi số liệu, xác minh trang và rollback nếu lỗi. |

**Ranh giới:** Có CI PASS không đồng nghĩa Production đã phát hành hoặc dữ liệu đã đạt chuẩn. Không tự merge Production.
