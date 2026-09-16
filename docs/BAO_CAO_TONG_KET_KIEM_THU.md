# Báo cáo tổng kết kiểm thử

**Dự án:** Website bán sách trực tuyến — NXB Kim Đồng
**Loại kiểm thử:** Kiểm thử API / tích hợp (tầng trọng tâm)
**Người thực hiện:** Nhóm phát triển dự án
**Thời điểm:** 16/09/2026

---

## 1. Tóm tắt

Đợt kiểm thử này tập trung vào **tầng API** — nơi chứa toàn bộ logic nghiệp vụ
của hệ thống. Kết quả:

| Chỉ số | Giá trị |
| --- | --- |
| Endpoint được kiểm thử | **65 / 65** (100%) |
| Test case đã thiết kế và thực thi | **253** |
| Test case đạt | **253** |
| Test case không đạt | **0** |
| Tỷ lệ đạt | **100%** |
| Bộ sưu tập Postman (kiểm tra bổ sung) | **601 / 601** đạt |
| Bộ kiểm thử đơn vị (hàm thuần túy) | **48 / 48** đạt |
| Lỗi phát hiện | **5** |
| Lỗi đã khắc phục và kiểm thử lại | **5** |
| Lỗi tồn đọng mức Critical / High | **0** |

**Kết luận:** Hệ thống **đạt** toàn bộ tiêu chí kết thúc kiểm thử đã đề ra trong
Kế hoạch kiểm thử §6.2. Tầng API đủ điều kiện để chuyển sang giai đoạn kiểm thử
giao diện.

---

## 2. Phạm vi đã kiểm thử

| # | Module | Endpoint | Test case | Kết quả |
| --- | --- | ---: | ---: | --- |
| 1 | Xác thực | 5 | 17 | 17/17 |
| 2 | Sách | 6 | 21 | 21/21 |
| 3 | Danh mục | 4 | 10 | 10/10 |
| 4 | Tác giả & Nhà xuất bản | 5 | 10 | 10/10 |
| 5 | Banner | 5 | 10 | 10/10 |
| 6 | Khuyến mãi | 7 | 16 | 16/16 |
| 7 | Tài khoản nhân viên | 5 | 14 | 14/14 |
| 8 | Khách hàng | 3 | 9 | 9/9 |
| 9 | Giỏ hàng | 6 | 16 | 16/16 |
| 10 | **Đơn hàng** | 7 | 51 | 51/51 |
| 11 | **Quản lý kho** | 5 | 24 | 24/24 |
| 12 | Đánh giá | 4 | 12 | 12/12 |
| 13 | Yêu thích | 2 | 5 | 5/5 |
| 14 | Thống kê / Dashboard | 1 | 12 | 12/12 |
| 15 | Phân quyền (xuyên module) | — | 14 | 14/14 |
| 16 | Bảo mật & Validate chung | — | 12 | 12/12 |
| | **Tổng** | **65** | **253** | **253/253** |

---

## 3. Quy tắc nghiệp vụ đã kiểm chứng

Đây là các quy tắc quan trọng nhất của hệ thống, đều đã được kiểm chứng bằng
test case riêng:

| # | Quy tắc | Test case | Kết quả |
| --- | --- | --- | --- |
| 1 | Tồn kho bị trừ **ngay khi đặt hàng**, không phải khi xác nhận | `TC-ORD-01`, `TC-ORD-02` | Đạt |
| 2 | Huỷ đơn **hoàn lại đúng số lượng** vào kho | `TC-ORD-18`, `TC-ORD-22` | Đạt |
| 3 | Huỷ đơn **chỉ hoàn kho đúng 1 lần**, không cộng dồn | `TC-ORD-24`, `TC-ORD-25` | Đạt |
| 4 | Xác nhận đơn lần hai **không trừ kho thêm** | `TC-ORD-12` | Đạt |
| 5 | Lý do huỷ bắt buộc, **5–500 ký tự** | `TC-ORD-31` → `TC-ORD-35b` | Đạt |
| 6 | Đơn đã thanh toán khi huỷ chuyển sang **cần hoàn tiền** | `TC-ORD-47` → `TC-ORD-47c` | Đạt |
| 7 | **Miễn phí vận chuyển** khi tạm tính ≥ 200.000đ | `TC-ORD-43`, `TC-ORD-44` | Đạt |
| 8 | Tổng tiền = `max(0, tạm tính − giảm giá + phí ship)` | `TC-ORD-45` | Đạt |
| 9 | Chỉ được **đánh giá sách khi đã mua** và đơn hoàn thành | `TC-RVW-03`, `TC-RVW-04` | Đạt |
| 10 | **Ngưỡng cảnh báo tồn kho = 100** dùng chung Dashboard và Kho | `TC-INV-03`, `TC-DASH-11` | Đạt |
| 11 | **Kiểm kê** tính đúng chênh lệch, không ghi khi lệch bằng 0 | `TC-INV-15` → `TC-INV-18` | Đạt |
| 12 | **Giỏ hàng tách riêng** theo từng người dùng | `TC-CART-15` | Đạt |
| 13 | Thêm cùng sách vào giỏ thì **cộng dồn số lượng** | `TC-CART-05`, `TC-CART-05b` | Đạt |
| 14 | Không thể **hạ quyền hoặc xoá chính mình** | `TC-EMP-13`, `TC-EMP-14` | Đạt |
| 15 | Chặn **xoá danh mục còn sách con hoặc còn sách** | `TC-CAT-08` | Đạt |

---

## 4. Lỗi phát hiện và khắc phục

Đợt kiểm thử phát hiện **5 lỗi thực tế** trong mã nguồn. Tất cả đều đã được sửa
và kiểm thử lại thành công.

### BUG-001 — Cập nhật hồ sơ với body thiếu trường gây lỗi 500

| Trường | Nội dung |
| --- | --- |
| Module | Xác thực |
| Mức độ | **High** |
| Điều kiện | Gọi `PUT /auth/me` với body chỉ chứa một phần các trường |
| Mong đợi | HTTP 200, các trường không gửi giữ nguyên giá trị cũ |
| Thực tế | HTTP 500 |
| Nguyên nhân | mysql2 không chấp nhận giá trị `undefined` khi bind tham số; các trường thiếu trở thành `undefined` |
| Cách sửa | Dùng `COALESCE(?, field)` cho từng trường và truyền `?? null` |
| Vị trí | `server/src/controllers/authController.ts` — hàm `updateProfile` |
| Trạng thái | **Đã sửa** — kiểm chứng bằng `TC-AUTH-17` |
| Ảnh hưởng thực tế | Người dùng chỉ muốn đổi số điện thoại sẽ gặp lỗi hệ thống |

### BUG-002 — Đăng ký chấp nhận email sai định dạng và mật khẩu quá ngắn

| Trường | Nội dung |
| --- | --- |
| Module | Xác thực |
| Mức độ | **High** |
| Điều kiện | Gọi `POST /auth/register` với email `khong-phai-email` hoặc mật khẩu 2 ký tự |
| Mong đợi | HTTP 400 kèm thông báo lỗi rõ ràng |
| Thực tế | HTTP 200 — tài khoản vẫn được tạo |
| Nguyên nhân | Thiếu kiểm tra định dạng email và độ dài mật khẩu tối thiểu |
| Cách sửa | Thêm kiểm tra regex email và độ dài mật khẩu ≥ 6 |
| Vị trí | `server/src/controllers/authController.ts` — hàm `register` |
| Trạng thái | **Đã sửa** — kiểm chứng bằng `TC-VAL-08`, `TC-VAL-09` |
| Ảnh hưởng thực tế | Tài khoản rác, không thể liên hệ khách hàng, rủi ro bảo mật |

### BUG-003 — Thêm vào giỏ hàng chấp nhận số lượng 0 và số âm

| Trường | Nội dung |
| --- | --- |
| Module | Giỏ hàng |
| Mức độ | **High** |
| Điều kiện | Gọi `POST /cart/items` với `quantity: 0` hoặc `quantity: -5` |
| Mong đợi | HTTP 400 — số lượng phải là số nguyên dương |
| Thực tế | Số 0 bị đổi thành 1 và vẫn thêm vào giỏ; số âm được ghi thẳng vào cơ sở dữ liệu |
| Nguyên nhân | Dùng `parseInt(quantity) \|\| 1` khiến giá trị 0 rơi vào nhánh mặc định; không kiểm tra số âm |
| Cách sửa | Chỉ dùng giá trị mặc định khi tham số vắng mặt; kiểm tra `Number.isInteger(qty) && qty > 0` |
| Vị trí | `server/src/controllers/cartController.ts` — hàm `addToCart` |
| Trạng thái | **Đã sửa** — kiểm chứng bằng `TC-CART-07`, `TC-CART-08` |
| Ảnh hưởng thực tế | Số lượng âm trong giỏ gây sai lệch khi tính tiền đơn hàng |

### BUG-004 — Đặt hàng chấp nhận số lượng 0

| Trường | Nội dung |
| --- | --- |
| Module | Đơn hàng |
| Mức độ | **High** |
| Điều kiện | Gọi `POST /orders` với một mặt hàng có `quantity: 0` |
| Mong đợi | HTTP 400 — số lượng sách trong đơn phải là số nguyên dương |
| Thực tế | Đơn hàng với số lượng 0 vẫn được tạo thành công |
| Nguyên nhân | Điều kiện kiểm tra tồn kho dùng `quantity > book.stock` nên số 0 luôn vượt qua |
| Cách sửa | Thêm kiểm tra `Number.isInteger(qty) && qty > 0` trước khi kiểm tra tồn kho |
| Vị trí | `server/src/controllers/orderController.ts` — hàm `createOrder` |
| Trạng thái | **Đã sửa** — kiểm chứng bằng `TC-ORD-41` |
| Ảnh hưởng thực tế | Đơn hàng rác, sai lệch số liệu thống kê và báo cáo doanh thu |

### BUG-005 — Thêm sách không tồn tại vào yêu thích gây lỗi 500

| Trường | Nội dung |
| --- | --- |
| Module | Yêu thích |
| Mức độ | Medium |
| Điều kiện | Gọi `POST /wishlist/toggle` với `book_id` không tồn tại |
| Mong đợi | HTTP 404 kèm thông báo không tìm thấy sách |
| Thực tế | HTTP 500 — vi phạm ràng buộc khoá ngoại |
| Nguyên nhân | Không kiểm tra sách có tồn tại trước khi ghi vào bảng yêu thích |
| Cách sửa | Truy vấn kiểm tra sách tồn tại và chưa bị xoá mềm, trả 404 nếu không có |
| Vị trí | `server/src/controllers/wishlistController.ts` — hàm `toggleWishlist` |
| Trạng thái | **Đã sửa** — kiểm chứng bằng `TC-WSH-05` |
| Ảnh hưởng thực tế | Lộ thông báo lỗi cơ sở dữ liệu cho người dùng cuối |

### Nhận xét chung

Cả 5 lỗi đều nằm ở **tầng kiểm tra dữ liệu đầu vào**. Đây là loại lỗi rất khó
phát hiện khi chỉ bấm tay trên giao diện, vì giao diện đã tự giới hạn giá trị
người dùng có thể nhập (ô số lượng có nút tăng/giảm, ô email có kiểm tra HTML5).
Chỉ khi gọi thẳng API mới thấy được các trường hợp này. Điều đó khẳng định việc
chọn **kiểm thử API làm trọng tâm** là đúng đắn.

---

## 5. Đánh giá mức độ bao phủ

### 5.1 Theo endpoint

Toàn bộ **65 endpoint** đã được gọi ít nhất một lần, trong đó:

| Nhóm | Số endpoint | Được kiểm thử cả luồng thành công và thất bại |
| --- | ---: | --- |
| Xác thực | 5 | 5 |
| Sách | 6 | 6 |
| Danh mục | 4 | 4 |
| Tác giả & NXB | 5 | 5 |
| Banner | 5 | 5 |
| Khuyến mãi | 7 | 7 |
| Tài khoản | 5 | 5 |
| Khách hàng | 3 | 3 |
| Giỏ hàng | 6 | 6 |
| Đơn hàng | 3 | 3 |
| Xác nhận / kiểm tra đơn | 4 | 4 |
| Thống kê | 1 | 1 |
| Kho | 5 | 5 |
| Đánh giá & Yêu thích | 1 | 1 |
| Sách đã mua | 1 | 1 |
| Điều kiện đánh giá | 4 | 4 |

### 5.2 Theo kỹ thuật thiết kế

| Kỹ thuật | Số test case áp dụng |
| --- | ---: |
| Phân vùng tương đương | 62 |
| Phân tích giá trị biên | 41 |
| Bảng quyết định (ma trận phân quyền) | 38 |
| Chuyển trạng thái đơn hàng | 26 |
| Kiểm thử luồng nghiệp vụ | 18 |
| Kiểm thử bảo mật (SQL Injection, lộ dữ liệu) | 12 |
| Kiểm thử dữ liệu tiếng Việt | 4 |
| Còn lại (kiểm thử hồi quy, dọn dẹp) | 52 |

### 5.3 Kiểm thử đơn vị (Unit Test)

Bổ sung đợt **kiểm thử đơn vị** cho các hàm thuần túy — hàm không phụ thuộc
database hay giao diện, gọi trực tiếp trong bộ nhớ nên chạy rất nhanh và xác
định chính xác chỗ sai:

| Nhóm | Hàm kiểm thử | Vị trí | Số ca | Kết quả |
| --- | --- | --- | ---: | --- |
| Định dạng hiển thị | `formatVND`, `formatDate`, `calculateDiscountPercent` | `client/src/utils/format.ts` | 16 | 16/16 |
| Trạng thái tồn kho | `getStockStatus`, `LOW_STOCK_THRESHOLD` | `server/src/config/constants.ts` | 12 | 12/12 |
| Mã khuyến mãi | `evaluatePromotion` | `server/src/controllers/promotionController.ts` | 20 | 20/20 |
| **Tổng** | | | **48** | **48/48 (100%)** |

Trọng tâm các ca kiểm thử: giá trị biên (0, 1, đúng ngưỡng, trên ngưỡng một đơn
vị), dữ liệu bất thường (số âm, chuỗi rác, `null`, `undefined`), và kết hợp nhiều
điều kiện nghiệp vụ cùng lúc (khuyến mãi vừa có trần giảm, vừa có đơn tối thiểu,
vừa giới hạn lượt dùng).

Trong quá trình soạn test, có 1 ca kiểm thử ban đầu kỳ vọng sai (giá khuyến mãi
= 0 tưởng là "giảm 100%"), nhưng đối chiếu cách dùng thực tế trong giao diện
(`sale_price = 0` nghĩa là "không khuyến mãi", xem `AdminBooksPage.tsx` dòng 74)
cho thấy code trả về 0% là **đúng**. Không phát hiện lỗi hàm nào cần khắc phục.

Chi tiết từng ca: [Kết quả kiểm thử đơn vị](../tests/KET_QUA_KIEM_THU_DON_VI.md).

### 5.4 Phần chưa được kiểm thử tự động

| Phần | Lý do | Cách kiểm thử đề xuất |
| --- | --- | --- |
| Giao diện người dùng | Không có công cụ tự động hoá trình duyệt trong dự án | Kiểm thử thủ công theo kịch bản §12 Kế hoạch kiểm thử |
| Component React (một số) | Chưa có thư viện render/test component | Có thể mở rộng kiểm thử đơn vị bằng Vitest + React Testing Library |
| Hiệu năng khi tải cao | Ngoài phạm vi đợt này | Dùng công cụ đo tải riêng |
| Khả năng truy cập (accessibility) | Ngoài phạm vi đợt này | Kiểm tra bằng công cụ chuyên dụng |

---

## 6. Sản phẩm bàn giao

| # | Sản phẩm | Đường dẫn |
| --- | --- | --- |
| 1 | Kế hoạch kiểm thử | `docs/KE_HOACH_KIEM_THU.md` |
| 2 | Hướng dẫn kiểm thử | `docs/HUONG_DAN_KIEM_THU.md` |
| 3 | Bộ kiểm thử API tự động (253 test case) | `tests/api-tests.mjs` |
| 4 | Bộ sưu tập Postman (249 request, 601 kiểm tra) | `tests/KIMDONG_API.postman_collection.json` |
| 5 | Script sinh bộ sưu tập Postman | `tests/make-postman.mjs` |
| 6 | Script kiểm tra tính hợp lệ bộ sưu tập | `tests/check-postman.mjs` |
| 7 | Trình chạy bộ sưu tập Postman | `tests/run-postman.mjs` |
| 8 | Script điều phối chạy kiểm thử | `tests/run-tests.ps1` |
| 9 | Script khôi phục database kiểm thử | `tests/reset-test-db.ps1` |
| 10 | Báo cáo kết quả bộ 253 test case | `tests/KET_QUA_KIEM_THU.md` |
| 11 | Báo cáo kết quả bộ sưu tập Postman | `tests/KET_QUA_POSTMAN.md` |
| 12 | Bộ kiểm thử đơn vị (48 test case) | `tests/unit-tests.mjs` |
| 13 | Báo cáo kết quả kiểm thử đơn vị | `tests/KET_QUA_KIEM_THU_DON_VI.md` |
| 14 | Báo cáo tổng kết kiểm thử | Tài liệu này |

---

## 7. Kết luận và kiến nghị

### 7.1 Kết luận

1. **Tầng API đã được kiểm thử đầy đủ.** Toàn bộ 65 endpoint đều được kiểm thử
   với cả trường hợp thành công và thất bại. Tỷ lệ đạt 100% trên cả hai bộ kiểm thử.
2. **Các quy tắc nghiệp vụ then chốt đều đúng.** Đặc biệt là nhóm quy tắc phức
   tạp nhất: trừ kho khi đặt hàng, hoàn kho khi huỷ, và chỉ hoàn đúng một lần.
3. **Phân quyền hoạt động chính xác.** Ma trận 3 vai trò × các nhóm chức năng
   được kiểm chứng đầy đủ, không phát hiện lỗ hổng phân quyền.
4. **Năm lỗi đã được phát hiện và khắc phục**, tất cả đều ở tầng kiểm tra dữ liệu
   đầu vào — loại lỗi mà kiểm thử thủ công trên giao diện rất dễ bỏ sót.
5. **Các hàm thuần túy (định dạng, tồn kho, khuyến mãi) cho kết quả đúng** ở mọi
   trường hợp kiểm thử, kể cả giá trị biên và dữ liệu bất thường: **48/48 (100%)**.
6. **Không còn lỗi tồn đọng mức Critical hoặc High.**

### 7.2 Kiến nghị

1. **Bổ sung kiểm tra dữ liệu đầu vào cho toàn bộ endpoint còn lại.** Năm lỗi tìm
   được đều cùng một dạng, cho thấy cần rà soát có hệ thống thay vì sửa từng chỗ.
2. **Thêm ràng buộc ở tầng cơ sở dữ liệu.** Ví dụ `CHECK (quantity > 0)` cho giỏ
   hàng và chi tiết đơn hàng, để tầng dữ liệu cũng bảo vệ được.
3. **Đưa bộ kiểm thử vào quy trình tự động.** Chạy `tests/run-tests.ps1` trước mỗi
   lần gộp mã nguồn để phát hiện hồi quy sớm.
4. **Mở rộng kiểm thử đơn vị tới các hàm thuần túy khác** (ví dụ tính phí vận
   chuyển, tổng tiền đơn hàng) và xét cài Vitest để test component React.
5. **Thực hiện kiểm thử giao diện thủ công** theo kịch bản đã soạn, kèm ảnh chụp
   minh hoạ (giai đoạn 6 trong kế hoạch).

### 7.3 Đề xuất chuyển giai đoạn

Tầng API và kiểm thử đơn vị đều **đạt** tiêu chí kết thúc. Đề xuất chuyển sang
**kiểm thử giao diện thủ công** (giai đoạn 6) và mở rộng unit test cho các hàm
còn lại.

---

## 8. Phụ lục — Cách tái lập kết quả

```powershell
# 1. Bật MySQL (XAMPP Control Panel -> Start MySQL)

# 2. Chạy toàn bộ kiểm thử (tự khôi phục DB, biên dịch, bật server, chạy, tắt)
cd tests
.\run-tests.ps1 -Runner both

# 3. Chạy kiểm thử đơn vị (không cần MySQL, vài giây)
.\run-tests.ps1 -Runner unit-tests.mjs

# 4. Xem báo cáo
notepad KET_QUA_KIEM_THU.md
notepad KET_QUA_POSTMAN.md
notepad KET_QUA_KIEM_THU_DON_VI.md
```

**Môi trường đã dùng:**

| Thành phần | Phiên bản |
| --- | --- |
| Node.js | v26.7.0 |
| npm | 11.19.0 |
| MariaDB | 10.4.32 |
| Cổng server kiểm thử | 5099 (tách biệt server dev 5000) |
| Database kiểm thử | `kimdong_bookstore_test` |

**Dữ liệu gốc tham chiếu:** 12 sách, 3 tài khoản, 2 đơn hàng, 4 chi tiết đơn,
3 đánh giá, 2 khuyến mãi, 3 banner, 13 danh mục, 7 tác giả, 3 nhà xuất bản.

---

*Báo cáo được lập ngày 16/09/2026.*
