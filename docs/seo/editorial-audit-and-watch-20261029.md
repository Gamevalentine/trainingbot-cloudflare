# TrainingBot — kiểm toán bài PUBG, liên kết và SEO (29/10/2026)

**Phạm vi:** 22 trang HTML canonical trong sitemap, 5 bài viết D1 đã published trong `sitemap-posts.xml`, các bài PUBG cũ và các URL được Search Console báo giảm lượt hiển thị.

## 1. Bằng chứng GSC đã có
- Hai kỳ 7 ngày: **13–19/10** so với **20–26/10/2026**.
- Tổng website: impressions **99 → 51**, clicks **2 → 0**, vị trí trung bình **6,4 → 8,7**.
- PUBG Mobile 4.7 Beta 1: impressions **39 → 9** (−30), vị trí TB **6,9 → 7,1**.
- 4.6 Skins & Events: impressions **16 → 5** (−11), vị trí TB **5,6 → 5,2**.
- Hai bài vẫn trả canonical đúng, index/follow và có nội dung. Chưa có bằng chứng Google phạt hay deindex.
- Google Search Console nguồn thật hiện không đọc được qua connector; không khẳng định thay đổi sau 29/10 đã cải thiện ranking.

## 2. Các lỗi / nội dung đã xử lý
- Bài PUBG Mobile 4.6 Beta (01/09/2026) thêm ngữ cảnh phiên bản lịch sử và dẫn tới bài 4.6 phát hành và trang Bản cập nhật.
- Bài PUBG Mobile LIGHT (28/08/2026) ghi rõ lịch ra mắt tháng 11/2026 là kế hoạch tại thời điểm đăng, chưa thể tự xác nhận ngày chính thức.
- Bốn bài D1 cũ được gắn cảnh báo biên tập có giới hạn: Erangel Subzero Beta 4.7.2, PUBG Mobile 4.6 cập nhật "hôm nay" (08/09), M416 Glacier, One-Punch Man (20/09). Không sửa nội dung gốc đã lưu trong D1.
- Beta 4.7 Beta 1 giữ khối dẫn sang bài cũ đã triển khai ở PR #45.
- Footer mọi bài D1 được sửa: **Điều khoản → /terms**, **Quyền riêng tư → /privacy**, thay vì cùng dẫn tới /contact.
- Không thêm nguồn gốc tưởng tượng. **Cả 5 bài D1 đang hiển thị thông báo chưa có liên kết nguồn trực tiếp**; kiểm chứng nguồn gốc và quyền ảnh vẫn là công việc biên tập cần có bằng chứng, không được tự ghi là đã hoàn tất.

## 3. Kiểm thử
`tools/seo/seo-editorial-audit.mjs`:
- Kiểm toán các URL và canonical của sitemap tĩnh; nhận diện link nội bộ thiếu đích và xuất JSON artifacts.
- Kiểm tra hai bài tĩnh cần nhãn lịch sử và link đến trang canonical.
- Render giả lập cả 5 bài D1 (SELECT-only) và kiểm tra canonical, robots, footer pháp lý, nội dung ngữ cảnh và liên kết hữu ích.
- Từ chối mọi CREATE/ALTER/UPDATE/DELETE D1 trong đường đọc GET.
- Không sửa admin, token, D1/R2, slug, bài gốc, canonical, sitemap hay robots.txt.

## 4. Giám sát kết quả
Báo cáo baseline JSON được xuất tại `seo-editorial-artifacts/audit.json` để kiểm chứng sau build. Hai nhiệm vụ giám sát SEO 7/14 ngày và 28 ngày đã được đặt trong cuộc trò chuyện trước đó, **không tạo bản trùng**.

- 05/11/2026: đánh giá 7 ngày.
- 12/11/2026: đánh giá 14 ngày.
- 26/11/2026: đánh giá 28 ngày.
- So sánh các kỳ **cùng độ dài**; tách query `trainingbot`, website tổng và hai bài giảm impressions. Không dùng số liệu 99/51 của tháng 10 để kết luận về thời kỳ sau phát hành.

## 5. Kế hoạch duy nhất tiếp theo
**QA nguồn và cập nhật bài viết có bằng chứng**: kiểm tra link nguồn chính thức cho 5 bài D1; phân biệt thông tin Beta/lịch dự kiến với xác nhận phiên bản hiện hành, ưu tiên bài Erangel Subzero và M416 Glacier. Trước khi có chứng cứ không đổi thông số, ngày phát hành, hoặc hình ảnh vì mục đích SEO.
