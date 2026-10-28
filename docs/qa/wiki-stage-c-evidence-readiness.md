# TrainingBot Wiki V2 — Giai đoạn C: hồ sơ vũ khí theo nguồn

**Triển khai:** nhánh `aion-trainingbot-wiki-stage-c-20261029`, base Stage B PR #22, mà Stage B base trên Stage A PR #21.

## Phạm vi C.1–C.6

- **C.1 — Dữ liệu cơ bản:** đọc trực tiếp 61 tên/nhóm/loại đạn/chế độ bắn từ `DATA.weapons`. Mọi thông tin game chưa đối chiếu nguồn độc lập đều gắn nhãn “Chưa kiểm chứng hiện hành”.
- **C.2 — Thông số nâng cao:** thêm khu vực nguồn rõ, chỉ hiển thị con số nếu nguồn chính thức hỗ trợ riêng. Ẩn hoàn toàn biểu đồ 0–100 cũ của `wiki_weapon_detail_v144.js` vì đây là điểm nhóm ước lượng, không phải sát thương/tốc độ bắn/độ giật đo thực tế. Phần chưa có bằng chứng ghi rõ “Chưa xác minh”.
- **C.3 — Phân tích sử dụng:** không tạo đánh giá hoặc xếp hạng vũ khí mới không có nguồn. Giữ phần mô tả cũ nhưng ghi rõ tham khảo, bổ sung ghi chú lịch sử cho những khẩu được ghi trong patch notes.
- **C.4 — Phụ kiện:** giữ ảnh/lưới sẵn có để không phá tính năng; đổi thành “Phụ kiện gợi ý từ Wiki (chưa xác minh tương thích)”, tránh khẳng định tương thích chính thức.
- **C.5 — Phiên bản:** file `wiki-stage-c-evidence.json` gồm ghi chú **chính thức phiên bản 2.4 năm 2023**, với URL gốc, ngày phát hành, ngày đối chiếu và `isCurrent:false`. Các số không được gắn nhãn là thông số mới nhất của PUBG MOBILE 4.x.
- **C.6 — Hình ảnh:** giữ ảnh hiện tại và nêu rõ cần xác minh hình ảnh/bản quyền; không tải thêm ảnh, không giả định ảnh đã được cấp phép.

## Ghi chú chính thức đã đối chiếu

Nguồn PUBG MOBILE chính thức (04/01/2023):
https://www.pubgmobile.com/webplat/info/news_version3/35372/60662/60663/60724/60725/m22521/202301/928128.shtml

Bằng chứng **lịch sử, không phải giá trị hiện hành**:
- QBZ: sát thương cơ bản từ 41 lên 42, thay đạn băng rỗng 3.1 giây, nạp chiến thuật 2.5 giây.
- FAMAS: giảm 20% độ tản đạn khi di chuyển; thay đạn băng rỗng 3.6 giây, nạp chiến thuật 2.5 giây.
- PP-19 Bizon: sát thương cơ bản từ 35 lên 37; giảm 20% tản đạn khi di chuyển.
- UZI: tốc độ chuyển vũ khí tăng 35%, tản đạn khi di chuyển giảm 30%.
- UMP45: tốc độ chuyển vũ khí tăng 35%, tản đạn khi di chuyển giảm 20%.
- Honey Badger: sử dụng đạn 7.62mm, bản 2.4 mô tả thiên về cận chiến và xuất hiện tại Erangel, Sanhok và Livik.

Phạm vi phiên bản: 2.4. Không coi là xác minh cho bản mới nhất của trò chơi.

## Kiến trúc và an toàn

`overrides/wiki-stage-c-weapon.js` nạp JSON nguồn chính thức cùng domain, gắn thêm bảng nguồn vào overlay vũ khí hiện có, giữ nguyên các handler chi tiết, chọn mục, back/forward trong Wiki. `overrides/wiki-stage-c-weapon.css` chỉ tác động vào overlay `.tb-wd`; `postbuild.sh` kiểm tra asset rồi tải lớp C sau B.

Không sửa `DATA`, Worker, API, Admin, D1/R2, không restore database, không merge Production.

## Kết quả nghiệm thu và phần còn mở

- [x] Đã lập bảng đối chiếu nguồn chính thức cho 6 vũ khí.
- [x] Đã tạo lớp hồ sơ áp dụng cho 61 vũ khí, không tự tạo thông số mới.
- [x] Đã viết browser QA desktop/tablet/phone và kiểm thử hồi quy B/SEO/D1.
- [ ] **Chưa thể ghi nhận toàn bộ 61 hồ sơ là đã được xác minh chính thức.** Chỉ 6 mục có thông tin lịch sử được dẫn chứng.
- [ ] **Thông số bản PUBG MOBILE mới nhất:** còn cần nguồn và đối chiếu theo từng phiên bản.
- [ ] **Tương thích phụ kiện / bản đồ / bản quyền ảnh:** còn chờ xác minh chính xác; không nhận là đã hoàn thiện.
- [ ] Kiểm thử CI và Cloudflare Preview: cập nhật theo kết quả thực tế sau khi chạy.

## Kế hoạch tiếp theo

1. Tiếp tục bổ sung nguồn chính thức **từng vũ khí** (C dữ liệu, không tự đoán).
2. Chạy đối chiếu phiên bản mới nhất, xử lý các khác biệt và thời hạn áp dụng.
3. Sau khi C được nghiệm thu đủ, chuyển D — phụ kiện, xe cộ và bản đồ. Lỗi so sánh nhiều súng từ B giữ lại ở E.
