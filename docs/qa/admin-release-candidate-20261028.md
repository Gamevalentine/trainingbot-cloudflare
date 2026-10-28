# TRAININGBOT — RELEASE CANDIDATE ADMIN A–E

**Ngày:** 28/10/2026. **Repository:** Gamevalentine/trainingbot-cloudflare. **Branch:** `aion-trainingbot-admin-release-candidate-20261028`, lấy từ Stage E `51bbf2ed5fafbdd21ceb9be0eee21950a5c42f6b`.

**HỒ SƠ TRIỂN KHAI — KHÔNG PHẢI CHỨNG NHẬN ĐÃ PHÁT HÀNH.**
Trạng thái hiện tại: **HOLD / NO-GO** đối với Production, dù đã có đồng ý tiến hành bước chuẩn bị. Chỉ chuyển GO khi các điều kiện vận hành dưới đây được chứng minh và được phê duyệt cho SHA cụ thể.

## 1. Phạm vi đóng gói

- Gộp nội dung **Admin A → B → C → D → E** đã CI PASS trong một bản ứng viên, độc lập với PR #8.
- `main` quan sát khi tạo RC: `d3292150abd1dc01f6051b177808be4805bf94b9`. Đây là HEAD Git, **không phải xác nhận deployment đang nhận lưu lượng Production**.
- Chỉ thay đổi frontend Admin và `functions/api/v71/admin/posts.js` (draft/publish), cùng test, docs và `postbuild.sh`. Không thay Worker trực tiếp, không tự đổi secret/binding/D1/R2 và không thay các tuyến công khai `functions/api/posts.js` hoặc `functions/bai-viet/[slug].js` từ `main`.
- **Không tích hợp Demo PR #14**. Không có `admin-demo.html`, `admin-demo-runtime.js`, loader Demo, hoặc biến môi trường `TRAININGBOT_LOCAL_DEMO` trong RC. Không nhập test posts/Beta của Demo vào DB.
- Không bật lại helper/workflow backup D1 trước đây bị gỡ; không xóa hoặc ghi lại dữ liệu Production.

## 2. Những gì đã nghiệm thu được trước RC

- A–E GitHub CI PASS ở nhánh riêng, Playwright local với API fake, D1/R2 giả, bản HTML A–D, màn 360–1440 px, 13 route, editor nháp/xuất bản, chức năng các màn phụ.
- Cloudflare Pages Stage E Preview đã được báo Deploy SUCCESS tại `51bbf2e`. Có smoke HTML `/admin` chưa đăng nhập. Demo Preview đã được nghiệm thu tương tác nhưng **không phải** backend của Admin thật.
- File `functions/_middleware.js` hiện chặn mọi request API Admin trên các hostname `*.trainingbot-cloudflare.pages.dev` (GET admin và mọi phương thức ghi 403). Chỉ allowlist đọc dữ liệu **công khai** được proxy, không gửi Authorization/Cookie. Điều đó giúp ngăn Preview đụng API Admin thật, nhưng **cũng không thể kiểm thử Admin nghiệp vụ thật trên Preview này**.
- `functions/api/[[path]].js` (fallback trên Production) trỏ Worker `trainingbot-cloud.ai-vn.workers.dev`. Phải xác minh endpoint, phân quyền và cấu hình Worker thực tế trước phát hành.

## 3. Các cổng release cần hoàn tất (chủ website/người có quyền Cloudflare)

| Cổng | Điều kiện/việc cần chứng minh | Trạng thái |
| --- | --- | --- |
| RC-01 | Mã nguồn/commit và build tái tạo, không có Demo, không hồi sinh backup | Chờ CI RC |
| RC-02 | Hồi quy Admin A/B/C/D và public route/mobile, P3 D1 Preview isolation PASS trên cùng SHA | Chờ CI RC |
| RC-03 | Cloudflare Pages Preview được build đúng SHA RC, /admin load được không cần token thật, không tự ghi API | Chờ Cloudflare check/kiểm tra HTML |
| RC-04 | Môi trường staging độc lập khỏi Production D1, R2, Worker, token/quyền; hoặc môi trường tương đương được duyệt có kiểm soát viết | **P0 — Chưa có bằng chứng** |
| RC-05 | Đăng nhập 401/403/200, tạo/nháp/xuất bản bài và sửa Trang web/Beta với tài khoản, DB thử; kiểm tra không lộ draft qua public | **P0 — Chưa nghiệm thu staging thật** |
| RC-06 | Xác nhận schema, binds, Worker hiện hành, snapshot/backup phù hợp nếu có thao tác dữ liệu, artifact Production khỏe + kế hoạch hoàn tác được thử | **P0 — Chưa có bằng chứng** |
| RC-07 | Chủ website chốt *exact SHA* + cửa sổ phát hành, quyền thực hiện, mức chấp nhận rủi ro, người theo dõi và cách dừng | **P0 — Chưa chốt** |
| RC-08 | Sau release: login, session, đọc/ghi được phép, Admin/Beta/public links, CDN/cache/errors, theo dõi P0 | Chỉ thực hiện sau GO và deploy |

**Cảnh báo:** Không biến Preview thành staging bằng cách gỡ `functions/_middleware.js` hoặc nối Preview với bindings Production. Nếu cần QA có ghi, phải tạo **môi trường staging riêng**, không có quyền đụng tài nguyên thật.

## 4. Quy trình GO / phát hành / rollback

1. Chụp snapshot metadata SHA `main`, bản deployment thực đang nhận traffic, Cloudflare env/bindings (chỉ tên binding, không log giá trị secret). Review diff toàn bộ RC, loại bỏ PR #8/#14 và mọi thay đổi public khác đang phát triển.
2. Hoàn thành CI ở SHA RC và smoke Preview read-only. Nếu CI fail, dừng và sửa trên RC, không hotfix main.
3. Người có quyền Cloudflare xác nhận staging isolation, quyền và nghiệp vụ với test records. Kiểm chứng tính tương thích Worker, Pages Functions và DB; nếu dữ liệu cần backup, thực hiện qua quy trình bảo mật riêng được cho phép, có bằng chứng khôi phục.
4. Ký GO cho **SHA và Preview URL cụ thể**. Merge/deploy theo workflow Cloudflare đang dùng; không force push, không tự động migrate/sao lưu, không tự động gộp PR #8/14 hoặc public P0 chưa nghiệm thu.
5. Theo dõi logs (Pages/Worker), status 401/403/5xx, dashboard Admin, bài viết/Beta, 6 trang public, link tải. Xác minh bằng tài khoản/đối tượng thử được phép; ghi deployment ID, timestamp và kết quả.
6. Nếu sai quyền, mất dữ liệu, không đăng nhập/lưu được, hoặc public lỗi nghiêm trọng: **dừng phát hành, phục hồi deployment code cũ đã chứng minh khỏe**, bảo toàn bằng chứng. Rollback code **không rollback D1/R2**; cần phê duyệt và kế hoạch phục hồi dữ liệu riêng nếu thực sự cần.
7. Không bật lại workflow sao lưu D1 đã dừng. Không khẳng định “hoàn thành Production” nếu không có kết quả RC-08.

## 5. Tài liệu/QA đính kèm

- `docs/qa/admin-stage-e-adm10-release-readiness.md`: runbook A–E.
- `docs/operations/trainingbot-admin-adm10-operator-guide.md`: hướng dẫn quản trị.
- `.github/workflows/trainingbot-admin-release-candidate-qa.yml`: build + hồi quy Admin/public + cổng NO-GO (không deploy).
- `tools/admin/adm10-release-preflight.mjs`: kiểm tra source và xuất JSON có `releaseDecision: HOLD`.

## 6. Kết luận

**Có thể bàn giao ứng viên mã nguồn và kết quả CI/Preview cho review. Chưa đủ bằng chứng để merge lên main/Production.** Đặc biệt cần xác thực staging/vận hành và rollback thực, không dùng Demo hoặc GitHub CI làm bằng chứng thay thế.
