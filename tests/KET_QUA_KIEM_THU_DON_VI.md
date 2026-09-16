# Kết quả kiểm thử đơn vị (Unit Test)

Thực hiện lúc: **16/09/2026 23:00**  
Bộ kiểm thử: `tests/unit-tests.mjs`  
Cách chạy: `node tests/unit-tests.mjs`

## 1. Tổng kết

| Chỉ số | Giá trị |
| --- | --- |
| Số ca kiểm thử | **48** |
| Đạt | **48** |
| Không đạt | **0** |
| Tỷ lệ đạt | **100.0%** |

## 2. Kết quả theo nhóm hàm

| # | Nhóm hàm | Hàm được kiểm thử | Số ca | Đạt | Kết quả |
| --- | --- | --- | ---: | ---: | --- |
| 1 | Định dạng hiển thị (formatVND, formatDate, calculateDiscountPercent) | `formatVND`, `formatDate`, `calculateDiscountPercent` | 16 | 16 | Đạt |
| 2 | Trạng thái tồn kho (getStockStatus, ngưỡng 100) | `getStockStatus`, `LOW_STOCK_THRESHOLD` | 12 | 12 | Đạt |
| 3 | Mã khuyến mãi (evaluatePromotion) | `evaluatePromotion` | 20 | 20 | Đạt |

## 3. Chi tiết từng ca kiểm thử

### Nhóm 1 — Định dạng hiển thị (formatVND, formatDate, calculateDiscountPercent)

| Mã | Mô tả | Kết quả mong đợi | Kết quả |
| --- | --- | --- | --- |
| TC-U-FMT-01 | Giá 0 đồng | 0 ₫ | Đạt |
| TC-U-FMT-02 | Giá 25.000 đồng (giá bìa một cuốn Doraemon) | 25.000 ₫ | Đạt |
| TC-U-FMT-03 | Giá 1.250.000 đồng (dùng dấu chấm phân cách nghìn) | 1.250.000 ₫ | Đạt |
| TC-U-FMT-04 | Giá rất lớn 1.000.000.000 đồng vẫn hiển thị đúng | 1.000.000.000 ₫ | Đạt |
| TC-U-FMT-05 | Số lẻ 25.500,7 được làm tròn thành 25.501 (không hiện phần thập phân) | 25.501 ₫ | Đạt |
| TC-U-FMT-06 | Số âm -50.000 vẫn định dạng được (không sập) | -50.000 ₫ | Đạt |
| TC-U-FMT-07 | Chuỗi rỗng trả về chuỗi rỗng (không hiện "Invalid Date") | chuỗi rỗng | Đạt |
| TC-U-FMT-08 | null trả về chuỗi rỗng | chuỗi rỗng | Đạt |
| TC-U-FMT-09 | Ngày 16/09/2026 có hiện đúng ngày tháng năm | chuỗi chứa "16", "09", "2026" | Đạt |
| TC-U-FMT-10 | Không có giá khuyến mãi (undefined) thì giảm 0% | 0 | Đạt |
| TC-U-FMT-11 | Giá khuyến mãi bằng giá gốc thì giảm 0% | 0 | Đạt |
| TC-U-FMT-12 | Giá khuyến mãi CAO HƠN giá gốc thì giảm 0% (không hiện số âm) | 0 | Đạt |
| TC-U-FMT-13 | Giảm đúng 20% (100.000 → 80.000) | 20 | Đạt |
| TC-U-FMT-14 | Giảm đúng 50% (100.000 → 50.000) | 50 | Đạt |
| TC-U-FMT-15 | Làm tròn đúng: 100.000 → 66.666 là 33% (33,334% làm tròn thành 33) | 33 | Đạt |
| TC-U-FMT-16 | Giá khuyến mãi = 0 nghĩa là KHÔNG có khuyến mãi → giảm 0% | 0 | Đạt |

### Nhóm 2 — Trạng thái tồn kho (getStockStatus, ngưỡng 100)

| Mã | Mô tả | Kết quả mong đợi | Kết quả |
| --- | --- | --- | --- |
| TC-U-STK-01 | Ngưỡng cảnh báo mặc định là 100 cuốn | 100 | Đạt |
| TC-U-STK-02 | Hết hàng: stock = 0 | OUT_OF_STOCK | Đạt |
| TC-U-STK-03 | BIÊN DƯỚI: stock = 1 là sắp hết (không phải hết hàng) | LOW_STOCK | Đạt |
| TC-U-STK-04 | BIÊN TRÊN: stock = 100 vẫn là sắp hết (≤ ngưỡng) | LOW_STOCK | Đạt |
| TC-U-STK-05 | BIÊN: stock = 101 là còn hàng (> ngưỡng) | IN_STOCK | Đạt |
| TC-U-STK-06 | Tồn kho rất lớn 5.000 vẫn là còn hàng | IN_STOCK | Đạt |
| TC-U-STK-07 | Số âm -5 được coi là hết hàng (dữ liệu bẩn không gây sập) | OUT_OF_STOCK | Đạt |
| TC-U-STK-08 | Chuỗi "50" được chuyển thành số 50 → sắp hết | LOW_STOCK | Đạt |
| TC-U-STK-09 | Giá trị rác "abc" coi như 0 → hết hàng | OUT_OF_STOCK | Đạt |
| TC-U-STK-10 | null coi như 0 → hết hàng | OUT_OF_STOCK | Đạt |
| TC-U-STK-11 | Ngưỡng tuỳ chỉnh: stock=5, ngưỡng=10 → sắp hết | LOW_STOCK | Đạt |
| TC-U-STK-12 | Ngưỡng tuỳ chỉnh: stock=5, ngưỡng=3 → còn hàng | IN_STOCK | Đạt |

### Nhóm 3 — Mã khuyến mãi (evaluatePromotion)

| Mã | Mô tả | Kết quả mong đợi | Kết quả |
| --- | --- | --- | --- |
| TC-U-PRM-01 | Mã không tồn tại thì báo lỗi rõ ràng | ok=false, giảm 0, báo "không tồn tại" | Đạt |
| TC-U-PRM-02 | Mã đang tạm dừng (is_active=0) không dùng được | ok=false, giảm 0 | Đạt |
| TC-U-PRM-03 | Giảm 20% của đơn 100.000 = 20.000 | ok=true, giảm 20.000 | Đạt |
| TC-U-PRM-04 | BIÊN: đơn 0 đồng, giảm 20% = 0 (không âm) | giảm 0 | Đạt |
| TC-U-PRM-05 | Giảm 20% của 1.000.000 = 200.000 nhưng bị chặn trần 30.000 | giảm 30.000 (chạm trần) | Đạt |
| TC-U-PRM-06 | Chưa chạm trần: giảm 20% của 100.000 = 20.000 | giảm 20.000 | Đạt |
| TC-U-PRM-07 | Giảm cố định 20.000 cho đơn 150.000 | giảm 20.000 | Đạt |
| TC-U-PRM-08 | Giảm cố định LỚN HƠN đơn hàng thì chỉ giảm tối đa bằng đơn (không âm) | giảm 150.000 (bằng đơn) | Đạt |
| TC-U-PRM-09 | BIÊN DƯỚI: đơn 149.999 chưa đạt mức tối thiểu 150.000 | ok=false, giảm 0 | Đạt |
| TC-U-PRM-10 | BIÊN: đơn đúng 150.000 ĐẠT mức tối thiểu (dùng được) | ok=true | Đạt |
| TC-U-PRM-11 | Thông báo lỗi có nêu số tiền tối thiểu | thông báo chứa "150.000" | Đạt |
| TC-U-PRM-12 | BIÊN: đã dùng đủ 100/100 lượt thì hết lượt | ok=false, giảm 0 | Đạt |
| TC-U-PRM-13 | BIÊN: dùng 99/100 lượt vẫn còn dùng được | ok=true | Đạt |
| TC-U-PRM-14 | usage_limit=0 nghĩa là KHÔNG giới hạn lượt | ok=true | Đạt |
| TC-U-PRM-15 | Mã đã hết hạn (ngày kết thúc là hôm qua) không dùng được | ok=false, giảm 0 | Đạt |
| TC-U-PRM-16 | Mã chưa tới ngày bắt đầu (ngày mai) không dùng được | ok=false, giảm 0 | Đạt |
| TC-U-PRM-17 | Mã đang trong thời gian hiệu lực dùng được | ok=true | Đạt |
| TC-U-PRM-18 | Đơn chưa đủ mức tối thiểu thì dừng ngay (không xét giảm giá) | ok=false, giảm 0 | Đạt |
| TC-U-PRM-19 | Đơn đủ điều kiện: 20% của 500.000 = 100.000, chặn trần 50.000 | giảm 50.000 | Đạt |
| TC-U-PRM-20 | Kết quả giảm giá luôn là SỐ NGUYÊN (không có phần thập phân) | số nguyên | Đạt |

## 4. Kết luận

Toàn bộ **48/48 ca kiểm thử đạt (100%)**. Các hàm kiểm thử đơn vị
đều là hàm thuần túy, cho kết quả đúng và ổn định ở mọi trường hợp đã kiểm thử, bao gồm:

- Giá trị biên (0, 1, đúng ngưỡng, trên ngưỡng một đơn vị)
- Dữ liệu bất thường (số âm, chuỗi rác, `null`, `undefined`)
- Kết hợp nhiều điều kiện nghiệp vụ cùng lúc

Không phát hiện lỗi nào cần khắc phục trong phạm vi kiểm thử đơn vị.
