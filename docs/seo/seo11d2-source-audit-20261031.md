# SEO-11.D.2 — Từng bản ghi Wiki / kiểm chứng nguồn (31/10/2026)

## Phạm vi đã rà soát
- Bộ tên sau lớp runtime và dữ liệu bổ sung có **61 vũ khí, 51 phụ kiện, 26 phương tiện, 8 bản đồ**, tổng **146 mục**. Mỗi bản ghi có trạng thái kiểm chứng và khoảng thiếu nguồn trong `docs/wiki/seo11d2-catalog-review-20261031.json`.
- Không biến tập ghi chú có nguồn thành kết luận mọi chỉ số ở phiên bản mới nhất đã chính xác.
- Nguồn vũ khí C: 11 hồ sơ có lịch sử điều chỉnh theo bản; D: 3 bản đồ có ghi chú chế độ 4.6, 26 xe chưa có full specification, 51 ảnh phụ kiện chưa rõ quyền sử dụng.

## Bản đính chính/nguồn chính thức
1. **ACE32**: nguồn PUBG MOBILE 4.6 (09/2026) xác nhận sát thương cơ bản 46 → 47, độ giật giảm. Bỏ mã đè sáu giá trị cũ được gắn nhãn sai là 'CURRENT'; chỉ công bố 47 ở panel chi tiết ACE32 với nhãn bản 4.6. Nguồn: https://www.pubgmobile.com/en/event/Midnight-Hunters/
2. **Full-Auto Mod**: nguồn nhà phát hành phiên bản 2.6 (2023) xác nhận M16A4 và Mk47. Không suy ra hiện hành: https://www.pubgmobile.com/en/event/260Devnotes/
3. **Gun Shield**: nguồn nhà phát hành phiên bản 2.5 (2023) xác nhận DP-28 và M249 (tấm chắn khi nằm sấp). Không suy ra hiện hành: https://www.pubgmobile.com/id/event/Imagiversary/
4. **Thuyền Cao Su**: nguồn Việt Nam phiên bản 4.6 xác nhận 4 chỗ, người ngồi chèo, có thể triển khai/thu hồi. Vẫn là mục nằm ngoài 26 hồ sơ cũ, không tự thay số đếm chưa kiểm kê: https://pubgm.vnggames.com/tin-tuc/thong-bao-cap-nhat/thong-bao-cap-nhat-phien-ban-4-6.html

## Cách hiển thị
- Bốn hồ sơ nguồn trên xuất hiện trong HTML tĩnh có thể đọc mà không cần JavaScript.
- Trong cửa sổ phụ kiện, cặp vũ khí có nguồn chỉ được gắn mốc lịch sử; tất cả tương thích hiện hành vẫn **0 được xác minh**.
- Chưa xác minh giấy phép 51 ảnh, và không tự tải hay sử dụng ảnh mới. Các tốc độ xe không kèm nguồn vẫn mang nhãn tham khảo.

## Chưa giải quyết
- 50 vũ khí chưa có hồ sơ history trong registry C; 49 phụ kiện chưa có cặp tương thích có nguồn lịch sử trong registry D.
- Chưa có hồ sơ đầy đủ 26 xe và 5 bản đồ thiếu nguồn mô tả theo chế độ.
- Khả năng tương thích phụ kiện trong phiên bản hiện hành, ảnh hưởng của bản 4.7 đến dữ liệu bản 4.6 và giấy phép ảnh **chưa được xác minh**. Không tạo thông số hiện hành giả.
- SEO-11.E phải dựa trên số liệu hiệu suất thật của GSC; static page xuất hiện không bảo đảm được index hay lên hạng.
