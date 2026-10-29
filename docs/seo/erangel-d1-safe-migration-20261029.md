# Erangel — di chuyển bản đính chính từ lớp hiển thị sang D1

**Ngày chuẩn bị:** 29/10/2026. **Trạng thái:** đã tạo mã migration và kiểm thử trên D1 giả lập; **chưa thực thi trên D1 Production** nếu không có bằng chứng `GET status` trả `migration_state=applied`.

## Phạm vi

- Chỉ đúng một slug: `battlegrounds-mo-rong-erangel-subzero-trong-pubg-mobile-bgmi-voi-ban-beta-4-7-2`.
- Giữ nguyên `id`, `slug`, `status`, `category`, `published_at`, `created_at`, `featured_at`.
- Thay đúng các trường: `title`, `summary`, `content`, `rich_content`, `cover_url`, `updated_at`; nội dung sửa lấy trực tiếp từ `ERANGEL_D1_CORRECTION` đã qua QA.
- Lưu một bản gốc đầy đủ vào bảng D1 riêng `tb_editorial_erangel_backup_v1`: `original_json`, `original_updated_at`, `correction_updated_at`, `state`, dấu thời gian.
- Không phát hành lại nội dung sai dù rollback: lớp bảo vệ công khai vẫn hiển thị đính chính nếu D1 chưa khớp. Khi D1 khớp, renderer trả thẳng row D1 thay vì ghi đè.
- Không tự xóa bản sao lưu. Không mở POST này cho tài khoản khách, Preview hoặc các hành động thiếu xác nhận revision.

## API bảo trì bảo vệ sẵn có

**Chỉ chạy trên domain Production**, yêu cầu `Authorization: Bearer <ADMIN_TOKEN>` đang được cấu hình sẵn trong môi trường Cloudflare. Không bao giờ ghi hoặc đưa token vào GitHub, báo cáo, chat hay URL. Không tạo token mới và không dùng quyền công khai.

- `GET /api/v71/admin/erangel-correction`: kiểm tra trạng thái đọc-only, yêu cầu token. Trả `stored_correction`, `migration_state`, `backup_exists`, `public_fallback_required`, không trả toàn văn bản sao lưu.
- `POST /api/v71/admin/erangel-correction` với nội dung JSON gồm `action: "apply"`, `confirm: "erangel-pc39-2-to-mobile47-20261029"`: nếu slug, phiên bản gốc và dấu thời gian khớp, ghi đè đúng trường biên tập; sao lưu bản gốc trong cùng D1.batch. Idempotent khi áp dụng lại.
- `action: "rollback"` với confirm như trên: khôi phục các trường biên tập từ snapshot nếu record chưa bị ai sửa sau migration; cập nhật `state=restored`. Lúc đó website **vẫn hiển thị bản đính chính nhờ fallback**.
- Có cơ chế từ chối khi có chỉnh sửa Admin sau migration hoặc backup xung đột. **Không cố retry mù quáng**, không phục hồi đè lên bản mới.

## Điều kiện gỡ bỏ hoàn toàn fallback

Chỉ triển khai PR thứ hai xóa `verifiedArticleView` override **sau khi**:

1. API trạng thái trên Production trả `migration_state=applied`, `backup_exists=true`, `stored_correction=true`, `public_fallback_required=false`.
2. API bài công khai trả tiêu đề, nội dung đính chính từ D1; canonical, `index,follow`, nguồn được kiểm chứng và `dateModified` đúng.
3. Xác minh bản sao lưu riêng tồn tại, rollback được mô phỏng PASS; không dùng rollback thật trên Production chỉ để thử.
4. CI SEO + Wiki, Preview và nghiệm thu website chính sau cutover PASS.
5. Chỉ gỡ fallback **khi không thể trả nội dung sai của bài Erangel nếu D1 bị rollback hoặc đổi ngoài dự kiến**. Nếu chưa có lớp bảo vệ công khai khác, giữ fallback thay vì xóa.

## Giới hạn công cụ

Các công cụ trong hội thoại hiện cho phép sửa repo và kiểm thử GitHub Actions/Cloudflare Preview, **không có phiên được ủy quyền đọc/ghi trực tiếp D1 Production hoặc token Admin**. Remote Desktop của chủ trang không online. Vì thế có thể triển khai API, QA và cơ chế rollback, nhưng không được tuyên bố đã viết D1 cho đến khi API Production phản hồi xác nhận.

## Ghi chú sau PR #54 — truy cập D1 không cần đăng nhập Cloudflare

- Xác thực bổ sung bằng JWT RS256 của GitHub Actions OIDC: kiểm chữ ký theo JWKS chính thức, issuer, audience, repository, workflow, nhánh main, sự kiện push và thời hạn. Không lưu API token dài hạn.
- Địa chỉ `trainingbot.io.vn` đang trả HTTP 403 trước API khi gọi từ GitHub Actions; địa chỉ Production gốc `trainingbot-cloudflare.pages.dev` trả HTTP 401 trực tiếp từ API. GitHub workflow dùng đúng hostname Production gốc để tránh lớp chặn không liên quan tới JWT.
- Chỉ chấp nhận hai hostname chính xác cho thao tác bảo trì; nhánh Preview `*.trainingbot-cloudflare.pages.dev` vẫn bị từ chối, không sử dụng alias có tên nhánh.
- **Không được coi migration đã chạy** nếu chưa thấy workflow Production có kết quả PASS với `migration_state=applied`, `stored_correction=true`, `backup_exists=true`.
