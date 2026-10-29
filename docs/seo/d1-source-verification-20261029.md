# Kiểm chứng nguồn cho 5 bài D1 — 29/10/2026

## Kết luận ưu tiên

**LỖI NGHIÊM TRỌNG đã xác nhận:** Bài `battlegrounds-mo-rong-erangel-subzero-trong-pubg-mobile-bgmi-voi-ban-beta-4-7-2` ghi các thay đổi **PUBG: BATTLEGROUNDS trên PC/console, bản 39.2 (06/01/2026)** thành “PUBG Mobile/BGMI Beta 4.7.2” (10/10/2026). Các chi tiết **Satellite Crash 4 lần**, **10 HP/s**, **Frost Zone Bomb 14 HP/s bán kính 20 m**, **Thermal Protection Suit** khớp nguyên văn chủ đề và số liệu PC chính thức. PUBG Mobile công bố Erangel Subzero trong **V4.7 Beta Test 2** nhưng đề cập các phần khác (Stalber, Liquid Nitrogen Tanks, Snow Mist Ammo, snowboard, snowmobile/snowbike, G36C).

- PUBG PC patch gốc: https://www.pubg.com/en/news/9635
- Thông báo chính thức PUBG Mobile Beta Test 2: https://www.pubgmobile.com/en-US/news-detail.shtml?from=news&gid=om6ct49bmmb2wvz95pl2t8lu&pid=om6ct49bmmb2wvz95pl2t8lu_en
- Bản lưu chi tiết thông báo Beta 2: https://event.bittopup.com/news/v4-7-beta-test-2-update-announcement

**Biện pháp:** thay phần tiêu đề/nội dung *hiển thị công khai* của bài nhầm lẫn bằng bản đính chính rõ ràng, giữ nguyên URL đã được Google phát hiện và nguyên bản dòng D1 để đối chiếu. Nội dung mới tránh nhập nhằng PC vs Mobile, nêu trạng thái Beta không phải thông số chính thức. Metadata title/description/dateModified phản ánh bản đính chính; nguồn bằng liên kết trực tiếp (không đăng lại toàn văn có bản quyền).

## Bốn bài còn lại

| Bài | Đối chiếu | Phân loại |
|---|---|---|
| PUBG Mobile 4.7 Beta 1 | Thông báo 23/09/2026 tại https://www.pubgmobile.com/en-US/news.shtml ; nội dung bản lưu https://event.bittopup.com/news/v4-7-beta-test-1-update-announcement | Khớp các thay đổi Beta, không áp dụng vĩnh viễn cho bản chính thức |
| M416 Glacier Switch Effect | PUBG MOBILE Global có lời thông báo gần hoàn thiện; bản lưu https://www.dearplayers.com/en-US/updates/pubg-mobile-global/2102005997917417884 | Có bằng chứng cho tuyên bố đang làm; chưa xác minh ngày ra mắt, áp dụng VN, chi phí hay phương thức sở hữu. DearPlayers là trang lưu lại, **không phải website chính hãng** |
| PUBG Mobile 4.6 Midnight Hunters | Nhà phát hành Việt Nam: https://pubgm.vnggames.com/tin-tuc/thong-bao-cap-nhat/thong-bao-cap-nhat-phien-ban-4-6.html ; thông cáo https://press.levelinfinite.com/en/PUBG-MOBILE-UNLEASHES-A-VAMPIRE-UPRISING-WITH-MIDNIGHT-HUNTERS-MODE-IN | Đã xác minh cập nhật bắt đầu 08/09/2026. Giờ 07:00 UTC và dung lượng 1,16 GB/3,50 GB trong bài gốc chưa được xác minh từ tài liệu này |
| PUBG Mobile × One-Punch Man | Website anime chính thức: https://onepunchman-anime.net/news/archives/7790 | Đã xác nhận sự kiện 20/09–19/10/2026, toàn cầu trừ Trung Quốc đại lục; dữ kiện lịch sử |

## Quy trình, kiểm thử và giới hạn

- Thêm `VERIFIED_EDITORIAL_SOURCES` vào Pages Function `functions/bai-viet/[slug].js` để xuất khối “Nguồn đối chiếu & trạng thái kiểm chứng” cùng liên kết nguồn của **5 bài**.
- Chỉ `GET`/SELECT dữ liệu; không tạo/migrate bảng, không UPDATE/DELETE bài gốc trong D1, không sửa R2, không thay canonical URL. Khi Admin có công cụ biên tập nguồn chính thức, có thể chuyển bản đính chính Erangel vào D1 và bỏ override.
- Có QA `tools/seo/seo-source-verification-qa.mjs`: mock D1 với 5 bài, kiểm tra nguồn, canonical, robots, trường hợp đính chính, metadata và D1 không ghi. Hồi quy SEO/Wiki chạy ở GitHub CI.
- Không phát biểu “SEO đã hồi phục” khi GSC không truy cập được hoặc khi chưa có dữ liệu sau đợt sửa. Theo dõi theo lịch 05/11, 12/11 và 26/11.
- **Bản quyền hình ảnh**: kiểm tra nguồn *thông tin* không đồng nghĩa đã mua giấy phép ảnh/video. Nội dung sử dụng ảnh trong D1 chưa được kiểm tra quyền dùng; không tuyên bố bản quyền sạch.

## Bước tiếp theo duy nhất

Sau khi bản đính chính phát hành, ưu tiên **kiểm toán nguồn gốc và quyền sử dụng hình ảnh của 5 bài D1**, rồi mới tối ưu thêm các bài viết khác. Không bắt chủ website tiếp tục chụp GSC từng bước.
