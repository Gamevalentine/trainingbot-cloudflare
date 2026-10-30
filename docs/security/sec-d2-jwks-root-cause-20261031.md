# SEC-D2 — Nguyên nhân JWKS 401 và bản sửa không phụ thuộc khóa tạm

**Ngày:** 31/10/2026.

## Bằng chứng thực nghiệm

Cloudflare Pages Preview đã được cài Function chỉ đọc `/sec-d2-egress`. Khi gọi cả bốn URL công khai (GitHub JWKS, OIDC discovery, Cloudflare Docs, example.com) với `fetch(url,{redirect:"error"})`, tất cả đều ném:

`TypeError: Invalid redirect value, must be one of "follow" or "manual" ...`

Đây là lỗi cấu hình API ngay trước kết nối HTTP, không phải bằng chứng máy chủ không có đường Internet. Mã bảo trì Erangel trước đó dùng cùng `redirect:"error"`, khiến OIDC chỉ hoạt động nhờ JWKS công khai ghim ngắn hạn, hết hạn 31/10/2026 20:20 UTC.

## Khắc phục

- Sửa `fetch` sang `redirect:"manual"`: Cloudflare hỗ trợ chế độ này và trả nguyên phản hồi 3xx mà **không tự động chuyển hướng**.
- Nếu HTTP không thành công, JWKS bị lỗi, không có khóa `kid` hợp lệ, RSA không xác minh được, hoặc JWT sai issuer / audience / repository / workflow / branch / time range, API **trả 401**.
- **Gỡ bộ khóa công khai ghim và thời gian hết hạn**, chỉ lấy JWKS từ URL GitHub cố định. Không chấp nhận `jwk`, `jku`, `x5u` do JWT đưa tới để chuyển nguồn khóa.
- Giữ nguyên `D1_ERANGEL_WRITE_ENABLED` mặc định khóa. Workflow D2 chỉ đọc, không thay D1 hoặc backup.
- QA giả lập gồm token hợp lệ, sai workflow, sai issuer/audience/branch, chữ ký sai, issuer trả 302, issuer mất kết nối, JWKS rỗng và token chứa `jku`.
- **Điều kiện nghiệm thu cuối:** Pages Preview `fetch(...,{redirect:"manual"})` với GitHub JWKS HTTP 200; CI SEO/Wiki PASS; sau khi merge Production Cloudflare deploy PASS và signed GET D1 Production HTTP 200 với backup nguyên vẹn, ghi vẫn bị khóa.

## Nguồn kỹ thuật
- https://developers.cloudflare.com/workers/runtime-apis/fetch/
- https://docs.github.com/en/actions/reference/security/oidc
- https://token.actions.githubusercontent.com/.well-known/openid-configuration

**Không mở lại quyền ghi D1 và không phát hành nếu QA hoặc signed GET chưa đạt.**
