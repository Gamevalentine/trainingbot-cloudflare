# TrainingBot Wiki V2 — I.1–I.6: Biên bản nghiệm thu/phát hành

Ngày 29/10/2026. Phạm vi **nhánh I Preview kế thừa H**, chưa merge, chưa thay Production.

## I.1 — Audit mã A–H
Tám PR xếp chuỗi: A #21 → B #22 → C #23 → D #24 → E #25 → F #27 → G #28 → H #29. Mỗi PR hiện **Draft / chưa merge**; QA tích hợp cuối H [run #40780614841](https://github.com/Gamevalentine/trainingbot-cloudflare/actions/runs/40780614841) PASS. PR xếp chuỗi không tự biến thành bản phát hành Production. Ngay trước khi merge cần rà lại base của từng PR và CI của HEAD tương ứng.

## I.2 — Bảo mật và ranh giới máy chủ
- Hàm `functions/_middleware.js` chặn mọi thao tác ghi/đường dẫn Admin trên Preview pages.dev, chỉ cho phép GET công khai có whitelist; QA D1 không ghi đã PASS.
- Workbench Admin G là **bộ soạn nháp trong bộ nhớ**: nhập/xuất JSON, Undo, cảnh báo thiếu nguồn; chưa có server-side CMS write endpoint, phân quyền từng vai trò, audit trail lâu dài và rollback dữ liệu. **Không được coi là một hệ thống xuất bản thật hoặc thay thế backup.**
- Quy tắc trước khi có bất kỳ CMS write nào: server-side session/role checks, deny-by-default và kiểm thử 401/403, chống CSRF/XSS, optimistic revision/idempotency, thay đổi có nhật ký, sao lưu và restore diễn tập thành công.

## I.3 — Chất lượng dữ liệu & bản quyền
- Dữ liệu C chỉ có một số ghi chú phiên bản 2.4 và 4.6, chưa xác minh mọi thông số hiện hành.
- D xác nhận **0/51 phụ kiện** có bảng tương thích được chứng minh, **0/51 quyền ảnh** được xác minh, **0/26 xe** có hồ sơ thông số đầy đủ.
- F chứa 16 bài luyện biên tập có gắn nhãn, không tự khẳng định độ chính xác chỉ số PUBG hiện hành.
- Không tự tìm/copy/thay quyền ảnh khi chưa có giấy phép. Không dùng điểm so sánh giả.

## I.4 — Bản phát hành và rollback
**Preview:** chạy nghiệm thu như H/G/F, lấy artifact JSON + screenshot. **Thiết bị thực:** vẫn thiếu nghiệm thu của chủ dự án trên mobile/tablet/PC và tài khoản Admin thực. Có thể kiểm tra bằng Preview, không dùng token Production trong tự động hóa.

**Trước bất kỳ thao tác Production nào:**
1. Chốt commit đã được phê duyệt, chụp/ghi lại nội dung trang và tuyến API trọng yếu, xuất bản sao mã nguồn + cấu hình deploy và KV/secret *reference*, **không đưa secret vào artifact**.
2. Tạo và **xác minh** snapshot D1 & R2 theo hướng dẫn Cloudflare, kiểm tra có thể restore trong môi trường cách ly. Không giả định Git revert phục hồi được D1/R2.
3. Xác nhận thao tác deploy tại tài khoản Cloudflare nào và nút rollback, quyền thực thi, người chịu trách nhiệm.
4. Triển khai sau chấp thuận rõ ràng, thử /, /wiki, /news, /bai-viet, Admin read, /robots.txt, /sitemap.xml và /sitemap-posts.xml, bảo đảm không có API ghi ngoài dự kiến.
5. Nếu lỗi nghiêm trọng: phục hồi bản deploy Pages đã biết tốt; chỉ khôi phục D1/R2 nếu có thay đổi dữ liệu và sau khi kiểm tra snapshot.

**Tình trạng:** không có bằng chứng snapshot/restore thành công hay nghiệm thu thiết bị thật trong giai đoạn này. Các bước trên là kế hoạch, **không phải backup đã hoàn tất**.

## I.5 — Quyết định GO/NO-GO
`tools/wiki/stage-i-release-audit.mjs` tạo `wiki-stage-i-artifacts/release-gate.json`: tập hợp bằng chứng và blocker dựa trên file thực.
**NO-GO** cho phát hành Wiki V2 đầy đủ, cho đến khi xử lý dữ liệu chưa xác minh, hình ảnh, CMS RBAC/persistence, sao lưu/rollback, QA thực và xác nhận tình trạng Google Indexing.
**QA kỹ thuật PASS không có nghĩa release GO.**

## I.6 — Phát hành
**Chưa làm, có chủ ý**: chỉ triển khai khi I.5 được xác nhận GO và chủ website cho phép rõ ràng. Không tự merge chuỗi PR hoặc thay đổi Production.

## Kế hoạch tiếp theo — SEO Recovery
SEO-R.1 kiểm tra hiện trạng Google/Sitemap trực tiếp và báo cáo Search Console; SEO-R.2 sửa metadata/trang chủ nhận diện thương hiệu với JSON-LD đáng tin; SEO-R.3 audit sitemap và trang bài viết trả 200/canonical; SEO-R.4 QA không index nhầm Preview; SEO-R.5 lập PR Draft, nghiệm thu, chỉ đưa Production khi được phép.
