# TrainingBot Wiki V2 — giới hạn phát hành UI, nội dung có nhãn xác minh

**Được người dùng cho phép đưa những phần đã làm lên web chính ngày 29/10/2026.**

## Bao gồm trong lần phát hành
- Wiki V2 A–F: hồ sơ vũ khí có nguồn và phiên bản lịch sử, dữ liệu phụ kiện/phương tiện/bản đồ có cảnh báo độ xác minh, so sánh 2–3 vũ khí, cẩm nang 16 bài và đường link chia sẻ.
- G: workbench trong Admin hiện có **chỉ sửa nháp trong phiên, xuất JSON, Undo**, tuyệt đối không ghi lên D1/R2 hay tự xuất bản. Đăng nhập Admin cũ giữ nguyên.
- H: metadata Wiki, SEO CollectionPage, lazy images và giảm CLS; chạy trên `main` bằng cổng build đã bật rõ ràng.
- SEO hotfix PR #32 đã phát hành trước đó, nay đồng bộ chính xác vào release branch: headline/description nhận diện TrainingBot, Pages Preview noindex, GET sitemap-posts chỉ đọc.

## Chưa được công nhận
- Release audit I vẫn **NO-GO đối với hồ sơ dữ liệu đáng tin và CMS xuất bản**: nguồn vũ khí hiện hành chưa đủ, tương thích 0/51 phụ kiện, quyền ảnh 0/51, 0/26 hồ sơ xe đầy đủ, không có server CMS RBAC + lịch sử lâu dài, chưa thực hiện backup/restore D1/R2.
- Do release chỉ thêm lớp trình bày/read-only, **không có migration D1/R2**, nên rollback ứng dụng thông qua trả commit Pages/Git về mốc `88090d7bb9122df00f3f5d211d1be163cdc930f5`; không giả vờ rằng Git rollback sẽ khôi phục dữ liệu.
- Mốc backup **git ref**: `trainingbot-production-before-wiki-v2-20261029` trỏ đúng `88090d7`.
- Những số liệu thiếu chính thức **phải hiển thị nhãn**; không tự dùng số liệu 2.4 làm chỉ số hiện hành.

## Quy trình triển khai
1. Build bản main-shaped `CF_PAGES_BRANCH=main`, kiểm tra G/H nạp thật, test SEO và nguồn, browser H/G/F/E/D/C/B 390/768/1440, D1 isolation.
2. Ghi CI logs và commit cụ thể; khi PASS mới merge PR phát hành vào main.
3. Đối chiếu trang chủ, Wiki, sitemap và blog trên Production, báo thành công/thất bại thực tế.
4. Nếu lỗi nghiêm trọng, khôi phục Pages deploy tốt trước đó hoặc revert commit merge; không động vào D1/R2.
5. SEO tiếp tục qua GSC Indexing/Pages và URL inspection, không phỏng đoán deindex.

## Bảo vệ
- Cloudflare Preview (pages.dev) vẫn bị `X-Robots-Tag: noindex, nofollow`.
- Không tạo tài khoản cho khách, không chỉnh Worker đăng nhập, không tạo API CMS ghi mới.
- **Không tuyên bố toàn bộ nội dung Wiki đã được kiểm chứng**.
