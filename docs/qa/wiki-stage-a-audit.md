# TrainingBot Wiki V2 — Giai đoạn A: kiểm kê, chuẩn hóa và nguồn xác minh

**Ngày kiểm kê:** 29/10/2026  
**Phạm vi:** dữ liệu Wiki và các lớp vá hiện có; không sửa UI Production, Worker, D1, R2 hoặc thông số trò chơi.  
**Tình trạng:** Đã xác định schema, tạo script kiểm kê nguồn và QA browser của dữ liệu cuối cùng; bằng chứng chạy CI được đính kèm PR.

## A.1. Kiểm kê bốn kho

| Kho | Dữ liệu gốc trong `wiki.html` | Dữ liệu sau các lớp vá (mục tiêu kiểm tra runtime) | Lý do lệch |
|---|---:|---:|---|
| Vũ khí | 56 | 61 | `wiki_catalog_verified_v147.js` bổ sung M1 Garand, DSR, Dual MP7, Tactical Crossbow, Mortar |
| Phụ kiện | 49 | 51 | `wiki_verified_data_v145.js` bổ sung Nòng kéo dài (Súng bắn tỉa), Báng súng nặng |
| Phương tiện | 26 | 26 | `wiki_audit_v149.js` đổi mục BRDM-2 thành Tracked Amphicarrier |
| Bản đồ | 8 | 8 | Không tìm thấy bước bổ sung bản đồ tương đương |

Số lượng nêu trên là **kiểm kê bản ghi trong mã nguồn**, không phải tuyên bố rằng mọi loại vũ khí/phụ kiện ngoài thực tế đều có mặt trong game hiện hành. Kết quả chạy trên trình duyệt trong `wiki-stage-a-artifacts/runtime-snapshot.json` được dùng để kiểm tra số thực sự người xem nhận được.

**Vấn đề cần quan tâm:**
- Cùng một bản ghi có thể bị nhiều lớp `v145`, `v146`, `v147`, `v148`, `v149` sửa trong quá trình mở trang. Ví dụ `v147` gán đạn P90 thành `9mm` trong khi `v149` ghi lại `5.7mm`. Đây là **xung đột ghi đè mã nguồn**; kiểm thử phải chụp giá trị **sau cùng**.
- `BRDM-2` được đổi tên thành `Tracked Amphicarrier`, cần ghi thành lịch sử/biến thể chứ không xóa vĩnh viễn mã định danh cũ khi chuyển cơ sở dữ liệu.
- Hiện một số thông số, tốc độ xe và ảnh được tải từ tài nguyên web ngoài. Một URL tồn tại trong mã **không chứng minh ảnh tải được, đúng đối tượng hoặc có quyền sử dụng**.
- Nhiều thẻ vũ khí cơ bản thiếu thông tin chi tiết độc lập; dữ liệu `wiki_weapon_detail_v144.js` còn sử dụng **điểm số chung theo nhóm** (`stats`), không được sử dụng như thông số thực nghiệm của từng súng.
- Sơ đồ lưu trữ theo mảng `[tên, nhóm, ...]` chưa có ID ổn định hoặc bằng chứng nguồn theo trường, dễ bị lỗi khi thêm/vá dữ liệu.

## A.2. Danh sách nguồn và thứ tự ưu tiên

1. **Đầu vào:** `overrides/wiki.html` chứa `const DATA`.
2. **Giao diện và dữ liệu hiển thị:** `wiki_reference_v136.js`, `wiki_weapon_detail_v144.js`, `wiki_vehicle_map_detail_v148.js`, `wiki_compare_p1.js`.
3. **Lớp vá dữ liệu:** `wiki_verified_data_v145.js`, `wiki_verified_fix_v146.js`, `wiki_catalog_verified_v147.js`, `wiki_audit_v149.js`.
4. **Hình ảnh / bản dịch / fallback:** `wiki_real_images_v137.js`, `wiki_completion_v138.js`, `wiki_missing_images_v141.js`, `wiki_clean_mobile_weapons_v142.js` và các lớp khác.
5. **Kết quả cuối:** `DATA` thật trong trình duyệt, sau toàn bộ script load và vá. Không được suy diễn trạng thái cuối chỉ từ dữ liệu gốc hoặc tên tệp.

## A.3. Schema chuẩn hoá (chưa ghi đè dữ liệu cũ)

Xem `docs/wiki/wiki-stage-a-schema.json`. Mỗi bản ghi có:
- `id` duy nhất theo kho và tên chuẩn hóa; lưu `aliases` cho tên tiếng Việt/tiếng Anh và tên cũ.
- `kind`, `name`, `category`, `rawFields` để giữ nguyên dữ liệu gốc nhằm đối chiếu.
- `fields` cho từng thuộc tính; mỗi thuộc tính có `value`, `unit`, `status`, `sourceTitle`, `sourceUrl`, `gameVersion`, `checkedAt` và `note`.
- `image` có địa chỉ và trạng thái xác minh tách riêng.
- `provenance` ghi file gốc và các trường bị thay đổi sau runtime; `review` lưu tình trạng biên tập.

**Đây là schema kiểm kê, không phải migration Production.** Script `tools/wiki/stage-a-audit.mjs` xuất `catalog.json`, `issues.json` và `README.md` để người phụ trách kiểm tra từng mục.

## A.4. Quy tắc xác minh nguồn

- Dữ liệu trong mã, dù file có chữ “verified”, **mặc định là `unverified`**. Một mô tả có nhắc PUBG MOBILE nhưng thiếu đường dẫn cụ thể vẫn chưa phải bằng chứng đã kiểm chứng.
- Chỉ dùng `verified_official` khi có **URL chính thức cụ thể, tiêu đề nguồn, phiên bản áp dụng và ngày kiểm chứng**, đồng thời nội dung nguồn hỗ trợ chính xác trường dữ liệu đó.
- Có thể dùng `source_claimed` cho nguồn tham khảo có dẫn nguồn rõ, nhưng phân biệt với nguồn chính thức.
- Giá trị chưa xác minh được để `null` ở catalog chuẩn hóa, giữ giá trị thô ở `rawFields` để không làm mất thông tin; không điền 0 hoặc tạo dữ liệu giả.
- Không coi ảnh từ website bên thứ ba là “đã xác minh”; cần kiểm tra đúng vật phẩm, điều khoản sử dụng, thời hạn và độ ổn định trước khi phát hành thư viện mới.

## Tiêu chí đóng giai đoạn A

- [x] Đã dựng schema và registry nguồn.
- [x] Đã tạo script kiểm kê bốn loại dữ liệu, trùng tên, trường thiếu/placeholder và các thay đổi runtime.
- [x] Đã tạo browser QA kiểm tra dữ liệu cuối cùng, tổng số thẻ, P90/Dual MP7/Tracked Amphicarrier trên site build.
- [ ] Thay đổi nhãn **đã kiểm chứng** cho từng thông số trò chơi: **không thực hiện** vì chưa có nguồn đủ cụ thể (sẽ theo A.4 editorial/Stage C).
- [ ] Thay đổi dữ liệu Wiki trên Production: **không nằm trong phạm vi A**.

**Đầu ra bắt buộc để xác nhận A:** workflow thành công, `wiki-stage-a-artifacts/` chứa danh mục đã chuẩn hóa và báo cáo vấn đề, không ghi vào dữ liệu/Worker/Production.
