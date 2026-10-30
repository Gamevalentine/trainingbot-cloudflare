# SEO-11 — Audit ban đầu và bản sửa SEO trang Beta (31/10/2026)

## Phạm vi
- Chỉ kiểm tra và sửa metadata của trang /ban-cap-nhat và alias /updates. Không sửa giao diện, URL, Admin, Worker, D1, lịch phát hành hoặc dữ liệu bài viết.
- Nguồn kiểm tra: website công khai trainingbot.io.vn và mã nguồn GitHub cùng ngày. Kết quả Google Search Console chưa truy cập được, nên không xác nhận trạng thái index thực tế hay thứ hạng.

## Kết quả quan sát công khai
- /: canonical https://trainingbot.io.vn/ ; robots index,follow; có liên kết đến trang Beta và bài PUBG Mobile 4.7 Beta 1.
- /ban-cap-nhat: canonical tự tham chiếu; robots index,follow. Trước sửa, title "Bản cập nhật PUBG Mobile & bản Beta – TrainingBot" thiếu trọng tâm PUBG Mobile Beta. Trang hiện có danh sách phiên bản, trạng thái tải và hướng dẫn APK/XAPK.
- /wiki: canonical tự tham chiếu; tiêu đề Wiki và mô tả riêng.
- Hai bài Beta 4.7 có URL riêng; bài Beta 1 có canonical, ngày xuất bản và liên kết nội bộ.
- robots.txt khai báo sitemap.xml và sitemap-posts.xml; công cụ đọc công khai phát hiện 22 URL tĩnh và 5 URL bài viết ở thời điểm kiểm tra (không đồng nghĩa 27 URL đã được Google lập chỉ mục).

## Thay đổi đề xuất / thực hiện trong nhánh kiểm thử
- Title Beta: PUBG Mobile Beta: Phiên bản và hướng dẫn tải | TrainingBot
- Description Beta: Khám phá PUBG Mobile Beta: các phiên bản thử nghiệm, trạng thái tải và hướng dẫn cài APK/XAPK trên Android. Theo dõi thông tin tại TrainingBot.
- Áp dụng đồng bộ cho hai file HTML được build là ban-cap-nhat.html và updates.html, vẫn quy về canonical /ban-cap-nhat.
- Bổ sung QA không triển khai, xác minh title, description, canonical, indexable và liên kết hiện có.

## Việc chưa làm / cần xác minh
- Chưa có số liệu lượt nhấp, hiển thị, CTR và vị trí thực từ Google Search Console.
- Chưa kiểm tra toàn bộ phiên bản tải và độ chính xác của bản Beta đang hiển thị so với dữ liệu nguồn.
- Hero của trang Beta dùng H1 tên phiên bản (như V4.6.4) trong khi có nhiều phiên bản khác trên trang; cần đánh giá kỹ nội dung và thiết kế trước khi thay đổi.
- Chưa triển khai Production; chỉ mở nhánh QA độc lập. Tránh thay URL để giữ liên kết và canonical đã có.

## Bước kế tiếp
1. Nghiệm thu build trên nhánh QA, kiểm tra không tác động Admin/D1.
2. Khi được phép phát hành, đồng bộ mã nguồn metadata vào main và xác nhận phản hồi trực tiếp của website.
3. Tiếp tục SEO-11 C: biên tập một trang thông tin Beta trung tâm, liên kết bài 4.7 dựa trên nội dung thực và nguồn, không tạo trang trùng lặp.
