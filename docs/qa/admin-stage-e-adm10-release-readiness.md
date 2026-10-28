# TRAININGBOT ADMIN CENTER — GIAI ĐOẠN E / ADM-10
## Release readiness, nghiệm thu Preview và bàn giao vận hành

**Ngày:** 28/10/2026. **Nhánh:** `aion-trainingbot-admin-stage-e-20261028`, kế thừa D tại commit gốc `fa8dd5763e0c0e4930f1521e4864a3204d852098`.

**Kết luận quản trị phát hành hiện tại: HOLD / NO-GO.** Hoàn thiện tài liệu và kiểm tra mã nguồn **không** đồng nghĩa đã nghiệm thu vận hành thật. Không dùng runbook này để tự triển khai vào Production.

## 1. Căn cứ hiện trạng Git, bản phát hành và kiến trúc

- Repository: `Gamevalentine/trainingbot-cloudflare`. Production sử dụng domain `trainingbot.io.vn` theo cấu hình dự án; **phải đối chiếu deployment thực tế của Cloudflare trước khi chọn rollback**.
- Snapshot `main` đọc ngày 28/10: `d3292150abd1dc01f6051b177808be4805bf94b9`, ghi nhận đã bỏ helper sao lưu D1 bị dừng. Đây chỉ là **Git baseline**, chưa xác nhận là deployment cuối đang nhận traffic.
- Chain PR tách biệt, chưa merge: A `#9` (main → A), B `#10` (A → B), C `#11` (B → C), D `#12` (C → D); E (D → E). PR `#8` là thay đổi thử nghiệm cũ, **không** gộp tự động.
- Build: `npm run build` = `bash build.sh && bash postbuild.sh`; output `public/` là **generated**, không sửa như source gốc. `build.sh` ghép archive từ `source_parts/`, ghi đè `overrides/`, xóa alias directory `public/admin/` để giữ `/admin.html`, còn `postbuild.sh` áp dụng patch A, script B, C, D theo thứ tự. Mã Admin lịch sử vẫn đóng gói trong 16 mảnh gzip/base64; các patch A/D có guard nhận dạng.
- Frontend thay đổi: `overrides/admin-stage-b-ui.js`, `admin-stage-c-ui.js`, `admin-stage-d-ui.js`, `admin_posts_manual_v171.js`, `admin_posts_feature_v173.js`, `admin_posts_editor_v183.js`, `admin_beta_versions_v175.js` (một số tệp đã có ở baseline; xác nhận diff trước merge).
- API Pages Functions liên quan: `functions/api/v71/admin/posts.js` (draft/published), `functions/api/posts.js`, `functions/bai-viet/[slug].js` (đọc bài published), `functions/api/v71/admin/beta-versions.js`, `functions/api/v71/admin/contact-messages.js`, `functions/api/v71/admin/image-replace.js`, `functions/api/v71/admin/image-restore.js`; proxy fallback ở `functions/api/[[path]].js`.
- Hợp đồng data D1: bài đăng dùng bảng `tb_manual_posts_v1` và cột `status` sẵn có. **Không có migration/schema mới được thiết kế trong A–D**, nhưng một số GET Pages Functions thực hiện DDL `CREATE TABLE IF NOT EXISTS`; không truy vấn Admin live để thử.
- **Rủi ro Preview P0:** generic API proxy ở `functions/api/[[path]].js` hiện trỏ `https://trainingbot-cloud.ai-vn.workers.dev`. Cloudflare Pages Preview có thể vẫn chạm Worker Production và D1/R2/Secret được chia sẻ. Không kết luận tách biệt chỉ vì URL có `.pages.dev`.
- Không phát hiện mã sửa riêng các Worker Telegram/Discord/Worker legacy trong nhánh Admin; **phiên bản Worker đang chạy/chính xác bindings chưa kiểm chứng**, không được đánh dấu unchanged deployment nếu chưa đối chiếu Cloudflare.
- Không có file cấu hình binding môi trường độc lập được chứng thực từ repository. Chưa kiểm chứng thực tế project Pages, D1, R2 `VIDEO_BUCKET`, `ADMIN_TOKEN`, route Worker hoặc policy triển khai.

## 2. Bằng chứng kiểm thử đã có (KHÔNG thay cho Production QA)

| Mốc | Chứng cứ | Mức độ |
| --- | --- | --- |
| A: ADM-00/01 | PR #9 + GitHub Actions #40609818732 | Build, auth/state, real Pages handlers với D1 giả PASS |
| B: ADM-02/03 | PR #10 + GitHub Actions #40611896579 | UI 6 nhóm + hash/history/keyboard/responsive PASS với API giả |
| C: ADM-04/05/06 | PR #11 + GitHub Actions #40613404368 | Draft/publish + public draft filter, dashboard/editor UI PASS với D1/API giả |
| D: ADM-07/08/09 | PR #12 + GitHub Actions #40615342323 | 13 màn, 5 viewport, Users/Inbox lỗi và khôi phục, handler media D1/R2 giả, Back/Forward/keyboard PASS |
| E: ADM-10 | CI stage E tại `.github/workflows/trainingbot-admin-stage-e-qa.yml` | Kiểm tra build/regression + phát sinh báo cáo preflight **HOLD**; ghi run SHA khi CI hoàn tất |

**Phạm vi:** QA chạy local browser, token giả, D1/R2 in-memory, mọi mutation HTTP bị intercept; ảnh synthetic không chứng minh Preview/Production đang hoạt động. Các trang công khai phải kiểm lại sau khi deploy riêng.

## 3. Cổng phát hành bắt buộc (evidence-driven)

| ID | Cổng bắt buộc | Tình trạng lúc chuẩn bị E |
| --- | --- | --- |
| E-01 | Source và build tái tạo đúng, không đổi packed runtime | Đã có PASS ở D; chờ PASS lại ở E |
| E-02 | CI hồi quy A → D không lỗi; xác nhận tất cả 13 route, keyboard, mobile | Đã có PASS ở D; chờ PASS lại ở E |
| E-03 | Cloudflare Preview **đúng commit E** có URL xác thực và trạng thái deploy thành công | **CHƯA XÁC NHẬN** |
| E-04 | Staging D1, R2, Worker/proxy, Secrets, token thử được cách ly, không trỏ Production; không sửa backup bị dừng | **BLOCKER P0** |
| E-05 | Login 401/403/200 trên môi trường staging, kiểm tra phân quyền và quyền thay đổi theo role | **BLOCKER P0** |
| E-06 | Tạo/lưu nháp/xuất bản/sửa bài, Trang web/Studio/Beta trong staging với data giả; GET công khai phản ánh chính xác | **BLOCKER P0** |
| E-07 | Kiểm tra trang chủ, Bản cập nhật, Tin tức, Wiki, Cộng đồng, Liên hệ, bài viết, link tải và cache/CDN | **CHƯA NGHIỆM THU SAU DEPLOY** |
| E-08 | So sánh cấu hình, schema, Worker, D1/R2 và phiên bản Production; rollback artifact đã được định danh và thử nghiệm | **BLOCKER P0** |
| E-09 | Chấp thuận cụ thể cho commit Preview, người phát hành, cửa sổ theo dõi và đường quay lui | **CHƯA CÓ** |
| E-10 | Kiểm tra sau phát hành: login, GET, sửa/lưu có phép, trang công khai, logs/monitoring; no critical error | **CHƯA THỰC HIỆN** |

**QUY TẮC:** Chỉ được đánh dấu E đã hoàn thành phát hành khi tất cả P0 đều đạt trên môi trường đúng và có bằng chứng. Không ghi “Production PASS” từ CI. Phát hiện lỗi P0 → dừng phát hành và quay về khâu sửa lỗi/QA, không thay schema hay tắt auth để qua cổng.

## 4. Quy trình Preview / staging không ảnh hưởng dữ liệu thật

1. Khóa **mã nguồn candidate** bằng commit SHA và ghi nguyên văn SHA vào phiếu nghiệm thu. Đối chiếu `main` và trạng thái các PR độc lập; không merge PR #8.
2. Kiểm tra Cloudflare deployment Preview tương ứng với **exact SHA**, URL Preview và lịch sử build. Mở trang HTML **chưa đăng nhập** để xác minh tài nguyên tĩnh ở nơi được phép; **không nhập token Production**.
3. Người có quyền Cloudflare phải xác thực **bindings** của Pages Preview và tất cả proxy/Worker downstream: `DB`, `VIDEO_BUCKET`, `ADMIN_TOKEN`, domain Worker, env vars và callback. Nếu chưa chứng minh tách biệt, **dừng trước khi gửi bất kỳ yêu cầu API Admin nào**, kể cả GET có DDL.
4. Đặt test D1/R2/token/Worker riêng bằng quy trình có phép và có khả năng hủy dữ liệu thử. Nếu cách ly không khả thi, chỉ nhận CI mock và tiếp tục HOLD, không “mượn” DB thật.
5. QA staging đúng luồng: login và quyền, bài nháp → published → draft, sửa trang trong phạm vi API thật, Beta với version/link giả, mobile và keyboard, tình huống 401/403/5xx/timeout, tải file hợp lệ/sai loại và lỗi mạng. Mỗi bước ghi evidence và kết quả, không chụp secrets.
6. So sánh công khai tại staging trước khi phát hành: 6 trang công khai, bài viết, link tải thực tế, navbar/search, caching và lịch sử truy cập; link HEAD=200 **không đủ** để chứng minh APK/XAPK tải nguyên vẹn.
7. Chỉ khi P0/P1 đã đạt, người chủ website duyệt **chính xác commit + Preview URL + phương án rollback**. Không suy diễn “Ok làm E” thành quyết định merge/deploy Production.

## 5. Quy trình phát hành (chưa được kích hoạt)

- Đầu vào cần có: quyết định phát hành cụ thể, SHA main và candidate được chốt, CI/QA PASS, bản backup hợp lệ **nếu có thao tác dữ liệu/schema** được kiểm chứng phục hồi theo quy trình được duyệt, snapshot config/bindings có phép, artifact Production cũ đã kiểm tra khỏe.
- Trước merge, xác nhận chain A → B → C → D → E và các khác biệt cùng PR #8/nhánh public đang phát triển. Không merge chồng vào main bỏ qua review; không force push/reset history.
- Người phát hành được ủy quyền thực hiện thay đổi theo cách Cloudflare Pages đang triển khai thực tế (Git integration hoặc artifact). Không cập nhật DNS/Worker/env D1/R2 ngoài phạm vi đã được cho phép; không bật sao lưu trước đó đã dừng.
- Sau deploy, giám sát build logs, Pages Functions/Worker errors, 401/403/5xx, lỗi JS, phản hồi và hành vi giao diện; chọn request/test record **được phép** để nghiệm thu chức năng ghi. Không đăng dữ liệu giả lên trang công khai thật.
- Ký xác nhận trạng thái sau phát hành hoặc kích hoạt rollback; lưu timestamp, SHA, deployment ID, người phê duyệt, người thực hiện và lỗi phát hiện.

## 6. Rollback an toàn và điều kiện kích hoạt

**Kích hoạt rollback/stop-the-line** nếu mất hoặc sửa nhầm dữ liệu, sai quyền/auth, không đăng nhập/lưu được, trang công khai lỗi nghiêm trọng, API trả lỗi quy mô lớn hoặc có nguy cơ lộ nháp/secret.

1. Dừng các thay đổi tiếp theo, lưu logs và commit/deployment ID; không xóa chứng cứ và không gửi thêm thử nghiệm ghi.
2. Người có quyền Cloudflare chọn **deployment Production trước đó đã được chứng thực khỏe** để rollback Pages; không mặc định `main` đang chỉ vào artifact khỏe, không git reset/force-push. Nếu API Worker được phát hành riêng, phải phối hợp đúng phiên bản tương thích, tránh rollback chỉ UI khi API/data đã đổi.
3. Chỉ phục hồi **bản build/code** theo quy trình phù hợp. **Không** xem rollback Pages là rollback D1, R2 hoặc email. Không ghi đè dữ liệu hợp lệ phát sinh sau thời điểm triển khai.
4. Nếu schema/dữ liệu đã thay đổi và phục hồi DB thật là cần thiết, bắt buộc có chủ sở hữu phê duyệt và phương án độc lập theo RPO thực tế. Workflow sao lưu D1 từng dừng **không được tự bật**. Không khởi tạo backup hoặc phục hồi tự động.
5. Sau rollback, kiểm tra lại login/permission, trang công khai, bài viết published/draft, Beta/download và API quan trọng. Nếu vẫn lỗi, giữ HOLD, không lặp rollback vô hạn, điều tra theo incident.
6. Ghi biên bản: thời điểm lỗi, phạm vi ảnh hưởng, SHA/ID trước và sau, log, tác động D1/R2, kết quả sau quay lui, người chịu trách nhiệm.

**Tương thích nháp khi rollback:** hai tuyến công khai `functions/api/posts.js` và `functions/bai-viet/[slug].js` ở snapshot `main` đã lọc `status='published'`; nhưng cần QA lại trên artifact định rollback, tránh làm lộ bản nháp nếu rollback sang phiên bản cũ hơn chưa có lọc này.

## 7. Hồ sơ bàn giao

- Operator guide ADM-10: `docs/operations/trainingbot-admin-adm10-operator-guide.md`.
- Script audit không ghi hệ thống thật: `tools/admin/adm10-release-preflight.mjs`; output `admin-qa-artifacts/adm10-preflight.json` trong CI. Dùng `node tools/admin/adm10-release-preflight.mjs --require-production-ready` sẽ **từ chối với exit 2** trong trạng thái chưa có đầy đủ chứng cứ/approval.
- Gốc báo cáo A/B/C/D: `docs/qa/admin-stage-{a,b,c,d}-*`.
- Quy trình tái tạo local: `npm run build`, test CI theo workflow Stage E; cần Node hiện đại, bash, unzip, Python 3 và Chrome/Playwright cho browser QA. **Không** chạy lệnh deploy/migration/bật backup từ hướng dẫn này.
- Chưa bàn giao được: URL Preview được kiểm chứng, Cloudflare project/bindings & deployment ID, danh sách Worker build/versions thực đang phục vụ, tài khoản/role staging, bằng chứng write-read staging, ảnh review của người vận hành trên staging, approval Production, bản Production sau phát hành.

## 8. Trạng thái hoàn thành của E

**ADM-10 tài liệu + kiểm tra tái tạo:** thực hiện trong nhánh E; chỉ ghi DONE khi CI tương ứng PASS.

**E release readiness:** **HOLD**. P0 chưa được chứng thực. Nhiệm vụ tiếp theo không phải “deploy thử cho biết” mà là cách ly staging, nghiệm thu với dữ liệu có phép, xác nhận deploy Preview đúng commit và chủ website duyệt đích phát hành.
