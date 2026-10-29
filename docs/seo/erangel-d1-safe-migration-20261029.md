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

## D1.2 — Chẩn đoán mạng và xác thực ngày 30/10/2026

- Cloudflare Pages đã báo triển khai `1be3ba7` thành công, nhưng hai lần migration OIDC ngày 29/10 vẫn dừng trước khi ghi D1.
- Sau PR #56, GitHub Actions chạy nhánh `main` và kiểm tra 12 thuộc tính JWT đều khớp; API Production Pages trả 401 và tên miền tùy chỉnh trả 403.
- QA thực tế trên Pages Preview: `fetch()` từ Function đến GitHub API, Cloudflare Docs, GitHub OIDC Discovery và GitHub JWKS đều ném `TypeError` ngay tại bước kết nối. Ngược lại, `crypto.subtle.importKey()` nhập được public RSA JWK chính thức do GitHub Actions cung cấp.
- Phương án sửa trong PR riêng: ký xác thực JWT bằng bộ **khóa công khai** GH OIDC được GitHub runner tải trực tiếp từ issuer HTTPS và pin trong source, chỉ dùng nếu tải JWKS trực tiếp thất bại. Không pin private key, token, mật khẩu hoặc dữ liệu Admin.
- Các điều kiện bắt buộc vẫn là RS256, chữ ký hợp lệ, đúng issuer/audience/repository/workflow/nhánh `main`/sự kiện push và thời hạn JWT. Bộ khóa ghim **hết hiệu lực ngày 31/10/2026 20:20 UTC**; sau đó nếu không tải được JWKS sẽ từ chối xác thực. Không cho Preview sử dụng quyền Production.
- Workflow trong PR #56 vẫn **chỉ GET**; có thêm retry hữu hạn để đợi bản Pages mới triển khai. Tuyệt đối không cho phép tự ghi hoặc rollback D1 trong bước kiểm thử này.
- Chỉ chuyển sang migration riêng sau khi API Production đọc được trạng thái thật và các kiểm thử QA/SEO/Wiki/Preview qua hết. Cơ chế fallback công khai được giữ nguyên đến khi D1 thật có bản ghi đúng và bản sao lưu.

## D1.3 — Quy trình ghi duy nhất sau khi D1.2 đã đọc được Production

**Tiền điều kiện đã đo:** Signed GET nhánh main trả HTTP 200 trên Pages Production, `migration_state=not_applied`, `backup_exists=false`, `stored_correction=false`, `public_fallback_required=true`.

Workflow D1.3 chỉ được merge sau khi kiểm thử offline/SEO/Wiki/Pages PASS. Khi chạy trên main, nó:

1. Yêu cầu JWT mới từ GitHub OIDC và kiểm tra trạng thái D1 Production bằng GET.
2. Nếu D1 đã áp dụng và có backup thì không ghi lại; nếu chưa áp dụng thì yêu cầu đúng `not_applied/false/false/true`, sai bất kỳ giá trị nào thì dừng.
3. POST đúng `apply` cùng revision khóa `erangel-pc39-2-to-mobile47-20261029` đến hostname Pages Production. API D1 giới hạn đúng slug Erangel, lưu nguyên bản và ghi bản đính chính trong D1.batch có compare-and-set.
4. Không retry POST mù quáng khi bị lỗi hoặc đứt kết nối. Sau phản hồi thành công, GET bằng token mới và chỉ chấp nhận `applied/true/true/false`.
5. Xác minh bài công khai có tiêu đề đính chính, giữ nguyên fallback bảo vệ cho tới khi có quyết định khác.

Không áp dụng thay đổi cho bài khác, không chạm R2, không xóa bản gốc và không chạy rollback trên Production để thử nghiệm.
