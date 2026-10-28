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
- [x] H.1/H.4 static SEO và source-link audit PASS, 16 guide links và 11 registry evidence references.
- [x] H.2/H.3 Chromium PASS 390/768/1440, CLS <= 0.1, có FCP/LCP/CLS và screenshots trong artifact; no-JS HTML hiển thị.
- [x] H.5 hồi quy G/F/E/D/C/B + SEO/D1 và Production exclusion PASS trên commit mã f5e92db.
- [x] Cloudflare Pages thông báo Deploy successful cho commit f5e92db: https://d98f0bff.trainingbot-cloudflare.pages.dev/wiki. Sau commit biên bản này cần đối chiếu Preview mới.
- [ ] Nghiệm thu UX trực tiếp trên Cloudflare Pages bằng thiết bị thật: cần kiểm tra thêm nếu chưa có thử nghiệm độc lập.

## Biên bản kết quả đã xác nhận (mã f5e92db)

- [CI #40780345758](https://github.com/Gamevalentine/trainingbot-cloudflare/actions/runs/40780345758): **SUCCESS**, lint/build, H.1/H.4, Chromium H ở 3 viewport, no-JS, G/F/E/D/C/B 3 viewport, P1 SEO, P3.1 D1 isolation, Production exclusion.
- [Artifact đo H](https://github.com/Gamevalentine/trainingbot-cloudflare/actions/runs/40780345758/artifacts/12857455760) `trainingbot-wiki-stage-h-qa`: `lab-metrics.json`, `link-audit.json`, `seo-build.json`, ảnh 3 màn hình.
- **390px**: FCP 444 ms, LCP 1.132 ms, CLS 0,0006.
- **768px**: FCP 200 ms, LCP 628 ms, CLS 0.
- **1440px**: FCP 208 ms, LCP 692 ms, CLS 0.
- Đã giảm CLS bằng trạng thái chờ bố cục có giới hạn và fallback 3,2 giây; không ẩn trang khi JS bị tắt. Bộ QA có ngưỡng bắt buộc CLS <= 0,1.
- Cloudflare [Preview #d98f0bff](https://d98f0bff.trainingbot-cloudflare.pages.dev/wiki) được bot thông báo deploy thành công. **Chưa có kiểm tra độc lập UX/người dùng thật ở host Pages**.
- Không đo field INP/CrUX, chưa đo Lighthouse thực địa hoặc Core Web Vitals ngoài CI. Chưa xác minh live tất cả URL nguồn ngoài và quyền ảnh. H không tự phát hành Production.

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
