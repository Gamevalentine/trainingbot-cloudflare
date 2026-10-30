# TrainingBot D2 — kiểm toán sau migration Erangel (31/10/2026)

## Phạm vi an toàn
- Chỉ đánh giá trạng thái D1 Production và backup bằng GET có xác thực; không xuất nội dung `original_json`, không đưa token vào log, không chạy rollback trên Production.
- Rà 5 bài hiện có, kiểm tra canonical, meta, nguồn thông tin, ảnh bìa / ảnh chia sẻ công khai. **Không chứng nhận bản quyền ảnh nếu không có bằng chứng cấp phép.**
- Thêm khóa an toàn `D1_ERANGEL_WRITE_ENABLED` mặc định tắt cho mọi POST bảo trì, kể cả actor OIDC và Admin token. Chỉ thay đổi khi chính chủ có kế hoạch phục hồi, xác minh backup và kích hoạt môi trường chủ động.
- Không thay R2, D1, nguồn bài viết khác, bản ảnh hiện có hoặc SEO canonical.

## D2.1 — Bằng chứng dữ liệu
- D1.3 đã được ghi vào Production trong run https://github.com/Gamevalentine/trainingbot-cloudflare/actions/runs/40949400778, GET hậu ghi `applied / backup_exists=true / stored_correction=true / public_fallback_required=false`.
- D1.4 đã hậu kiểm bằng GET sau phát hành tại commit `061f90a`, cùng trạng thái và bài Erangel công khai HTTP 200.
- D2 bổ sung đối chiếu **nội dung bản sao lưu theo điều kiện logic**: đọc `original_json` trong D1, xác nhận đúng slug, revision, tiêu đề gốc, thời gian gốc, các chỉ dấu nguồn PC cũ, và kiểm tra 7 trường bất biến của dòng trước/sau migration.
- Trả về 2 cờ `backup_integrity_ok` và `immutable_fields_match` cho phiên xác thực, không bao giờ trả toàn bộ backup.
- Điều kiện nghiệm thu D2.1 trên Production: signed GET từ `main` trả `HTTP 200 / applied / backup_exists=true / backup_integrity_ok=true / immutable_fields_match=true / stored_correction=true / public_fallback_required=false`. Lưu log chạy thực tế làm bằng chứng.

## D2.2 — Kiểm toán 5 bài đã xuất bản

| Bài | Nguồn chứng thực thông tin | Hạn chế nội dung cần theo dõi | Quyền ảnh |
| --- | --- | --- | --- |
| Erangel Subzero | https://www.pubg.com/en/news/9635 và PUBG Mobile Beta 2 | Đã đính chính sai lẫn PC/Mobile; giữ công khai bản đúng | Chưa xác minh |
| PUBG Mobile 4.7 Beta 1 | https://www.pubgmobile.com/en-US/news.shtml | Beta lịch sử, không đồng nhất chính thức | Chưa xác minh |
| M416 Glacier Switch Effect | https://www.dearplayers.com/en-US/updates/pubg-mobile-global/2102005997917417884 | Trang DearPlayers là bản lưu, không phải cơ quan phát hành; không khẳng định ngày bán hay áp dụng Việt Nam | Chưa xác minh |
| PUBG Mobile 4.6 Midnight Hunters | https://pubgm.vnggames.com/tin-tuc/thong-bao-cap-nhat/thong-bao-cap-nhat-phien-ban-4-6.html | Chưa chứng thực giờ và dung lượng cập nhật đã nêu trong bài cũ | Chưa xác minh |
| PUBG Mobile × One-Punch Man | https://onepunchman-anime.net/news/archives/7790 | Sự kiện 20/09–19/10, là dữ kiện lịch sử | Chưa xác minh |

Mọi ảnh có tên file hoặc xuất hiện trên URL của TrainingBot **không tự chứng minh quyền sử dụng**. `og:image`, ảnh chụp game, ảnh trích nguồn chính thức, watermark, cũng không thay thế giấy phép hay sự cho phép. Mỗi ảnh cần hồ sơ riêng: URL nguồn gốc, chủ sở hữu, quyền sử dụng lại trên website, phạm vi thương mại, điều kiện ghi nguồn, bằng chứng phép hoặc tự tạo, ngày xác minh. Nếu thiếu hồ sơ thì giữ trạng thái **UNVERIFIED**, không công bố "đã xử lý bản quyền".

Nguồn chính sách tham khảo:
- PUBG: BATTLEGROUNDS content creation guideline: https://pubg.com/en/clause/content_creation_guideline
- BGMI content creation guideline: https://www.battlegroundsmobileindia.com/ccg
- PUBG Mobile terms: https://www.pubgmobile.com/PK/terms.shtml

Bộ kiểm thử `tools/seo/d2-five-posts-audit.mjs` đọc chính xác 5 URL công khai, lưu JSON chỉ chứa tên/slug/metadata/canonical/đường ảnh và kết quả nguồn. Báo cáo quyền ảnh là `unverified`, cho tới khi có bằng chứng xác thực; đây là **đầu việc cần chủ sở hữu/đơn vị cấp quyền bổ sung**, không được đánh tráo bằng QA thành PASS.

## D2.3 — Quy trình bảo vệ API
- Workflow ghi một lần D1.3 đã ngừng tại PR #59; workflow hiện tại chỉ GET.
- Không có endpoint công khai nào được phép POST nếu `D1_ERANGEL_WRITE_ENABLED` không chủ động được bật.
- API chỉ có quyền cho phép GET thông tin trạng thái qua Admin hoặc GitHub OIDC hợp lệ, giữ nguyên kiểm tra RSA, issuer/audience/repository/workflow/nhánh và thời gian JWT.
- Bộ khóa công khai dự phòng hết hạn 31/10/2026 20:20 UTC; khi Cloudflare egress còn lỗi, OIDC sẽ fail-closed. Đây là giới hạn có chủ ý, không được tự động gia hạn.
- Trường hợp khôi phục khẩn cấp: đánh giá bằng chứng backup, sửa nguyên nhân, mở quyền có thời hạn ngắn qua cấu hình nội bộ và nghiệm thu riêng; **không** chạy rollback thử trên Production.

## D2.4 — Nghiệm thu
Cần có bằng chứng tất cả: API D1 read-only trên Production PASS; test D1 mock PASS; kiểm thử 5 URL, metadata và nguồn PASS; Cloudflare Pages deploy PASS; bộ SEO/Wiki CI PASS. Riêng bản quyền hình ảnh chỉ được đánh dấu xong khi có giấy phép hợp lệ hoặc thay bằng ảnh có quyền sử dụng đã chứng minh.

## Quyết định sau D2
- Có thể hoàn thành D2.1, D2.3 và D2.4 kỹ thuật mà không động dữ liệu.
- **Không được đóng D2 toàn phần** nếu D2.2 còn ảnh chưa có giấy phép hoặc không có bằng chứng cấp quyền.
- Giữ backup, không sửa/xóa bài gốc; D3 SEO chỉ bắt đầu khi bảng rủi ro quyền ảnh đã được xử lý hoặc tách thành hạng mục còn mở có quyết định rõ.
