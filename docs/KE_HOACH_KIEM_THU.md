# KẾ HOẠCH KIỂM THỬ (TEST PLAN)

**Dự án:** Website Bán Sách Trực Tuyến & Quản Lý Bán Sách — NXB Kim Đồng
**Phiên bản tài liệu:** 1.0
**Ngày lập:** 16/09/2026
**Người lập:** Nhóm phát triển

---

## 1. Giới thiệu

### 1.1 Mục đích

Tài liệu này xác định phạm vi, chiến lược, phương pháp, nguồn lực và lịch trình kiểm thử cho hệ thống bán sách trực tuyến. Kế hoạch nhằm đảm bảo:

- Các chức năng nghiệp vụ hoạt động đúng theo yêu cầu (đặt hàng, quản lý kho, khuyến mãi, đánh giá…).
- Dữ liệu tồn kho và doanh thu luôn chính xác sau mọi thao tác.
- Phân quyền 3 vai trò được thực thi đúng, không có lỗ hổng truy cập trái phép.
- API trả về đúng mã HTTP và định dạng JSON theo thiết kế.

### 1.2 Đối tượng đọc

Giảng viên hướng dẫn, thành viên nhóm phát triển, người kiểm thử.

### 1.3 Tài liệu tham khảo

| Tài liệu | Đường dẫn |
|---|---|
| Đặc tả cơ sở dữ liệu | `database/schema.sql` |
| Dữ liệu mẫu | `database/seed.sql` |
| Định nghĩa tuyến API | `server/src/routes/api.ts` |
| Hướng dẫn cài đặt | `README.md` |

---

## 2. Tổng quan hệ thống cần kiểm thử

### 2.1 Kiến trúc

| Thành phần | Công nghệ | Phiên bản |
|---|---|---|
| Frontend | React.js, Vite, Tailwind CSS, TypeScript | React 18.3.1 · Vite 5.4.21 · Tailwind 3.4.19 |
| Backend | Node.js, Express, TypeScript (RESTful API) | Node v26.7.0 · Express 4.22.3 |
| Cơ sở dữ liệu | MySQL / MariaDB | 10.4.32 (XAMPP) |
| Xác thực | JWT (jsonwebtoken) + bcryptjs | JWT 9.0.3 · bcryptjs 2.4.3 |

### 2.2 Quy mô

- **65 endpoint** RESTful (26 GET, 15 POST, 16 PUT, 8 DELETE)
- **18 nhóm chức năng** (controller)
- **15 bảng** dữ liệu
- **3 vai trò:** ADMIN, EMPLOYEE, CUSTOMER

### 2.3 Giao diện kiểm thử

| Giao diện | Địa chỉ | Mô tả |
|---|---|---|
| Giao diện người dùng | `http://localhost:3000` | React SPA |
| Giao diện API | `http://localhost:5000/api` | RESTful API |

### 2.4 Tài khoản kiểm thử

| Vai trò | Email | Mật khẩu |
|---|---|---|
| ADMIN | `admin@kimdong.vn` | `admin123` |
| EMPLOYEE | `nhanvien@kimdong.vn` | `admin123` |
| CUSTOMER | `khachhang@gmail.com` | `user123` |

---

## 3. Phạm vi kiểm thử

### 3.1 Trong phạm vi

| # | Module | Endpoint | Ưu tiên | Trọng tâm kiểm thử |
|---|---|---|---|---|
| 1 | Xác thực (Auth) | 5 | Cao | Đăng ký, đăng nhập, JWT, đổi mật khẩu, cập nhật hồ sơ |
| 2 | Sách (Books) | 6 | Cao | CRUD, validate dữ liệu, xoá mềm, lọc/tìm kiếm |
| 3 | Danh mục (Categories) | 4 | Trung bình | CRUD, chặn xoá khi còn sách |
| 4 | Tác giả & NXB | 5 | Trung bình | CRUD tác giả, danh sách NXB |
| 5 | Banner | 5 | Thấp | CRUD, bật/tắt hiển thị |
| 6 | Khuyến mãi (Promotions) | 7 | Trung bình | Mã hết hạn, hết lượt, giảm giá, bật/tắt |
| 7 | Tài khoản nhân viên (Users) | 5 | Trung bình | Admin tạo tài khoản, đổi vai trò |
| 8 | Khách hàng (Customers) | 3 | Trung bình | Danh sách, chi tiết, cập nhật |
| 9 | Giỏ hàng (Cart) | 6 | Trung bình | Thêm/sửa/xoá, tách giỏ theo người dùng |
| 10 | **Đơn hàng (Orders)** | 7 | **Cao nhất** | Đặt hàng, trừ kho, xác nhận, **huỷ + hoàn kho** |
| 11 | **Quản lý kho (Inventory)** | 5 | **Cao** | Nhập kho, kiểm kê, tính chênh lệch |
| 12 | Đánh giá (Reviews) | 4 | Trung bình | Chỉ đánh giá khi **đã mua + đơn hoàn thành** |
| 13 | Yêu thích (Wishlist) | 2 | Thấp | Thêm/bỏ yêu thích |
| 14 | Thống kê (Dashboard) | 1 | Trung bình | Doanh thu ngày/tháng/năm, theo danh mục |
| 15 | Phân quyền (xuyên module) | — | **Cao** | 3 vai trò × 65 endpoint |
| 16 | Bảo mật & Validate chung | — | Cao | Token, dữ liệu đầu vào, SQL Injection |

### 3.2 Ngoài phạm vi

- Kiểm thử hiệu năng / chịu tải (không thuộc yêu cầu đồ án).
- Kiểm thử tương thích đa trình duyệt (chỉ kiểm thử trên Chrome/Edge).
- Kiểm thử bảo mật chuyên sâu (penetration test).
- Tích hợp cổng thanh toán thật (dự án dùng phương thức mô phỏng COD/BANKING).

---

## 4. Môi trường kiểm thử

### 4.1 Phần cứng & phần mềm

| Thành phần | Cấu hình |
|---|---|
| Hệ điều hành | Windows |
| Node.js | v26.7.0 |
| npm | 11.19.0 |
| Web server DB | XAMPP (MariaDB 10.4.32) |
| Trình duyệt | Chrome / Edge bản mới nhất |

### 4.2 Cơ sở dữ liệu kiểm thử

> ⚠️ **Quan trọng:** kiểm thử tạo đơn hàng, trừ tồn kho và xoá dữ liệu. Vì vậy **phải dùng database riêng**, không chạy trên database demo để tránh làm hỏng dữ liệu nộp bài.

```bash
# Tạo database kiểm thử
mysql -u root -e "CREATE DATABASE kimdong_bookstore_test CHARACTER SET utf8mb4"

# Nạp cấu trúc + dữ liệu mẫu
mysql -u root -D kimdong_bookstore_test < database/schema.sql
mysql -u root -D kimdong_bookstore_test < database/seed.sql
```

Cấu hình khi chạy kiểm thử: đặt biến môi trường `DB_NAME=kimdong_bookstore_test`.

### 4.3 Quy trình khôi phục dữ liệu

Trước **mỗi lượt chạy kiểm thử**, khôi phục database về trạng thái ban đầu:

```bash
mysql -u root -e "DROP DATABASE kimdong_bookstore_test; CREATE DATABASE kimdong_bookstore_test CHARACTER SET utf8mb4"
mysql -u root -D kimdong_bookstore_test < database/schema.sql
mysql -u root -D kimdong_bookstore_test < database/seed.sql
```

**Dữ liệu gốc tham chiếu** (lấy từ `database/seed.sql` — dùng để đối chiếu kết quả):

| Sách | Danh mục | Tồn kho | Giá nhập | Đã bán |
|---|---|---|---|---|
| ID 1 — Doraemon Tập 1 | Doraemon | 150 | 12.000 | 890 |
| ID 2 — Doraemon Tập 2 | Doraemon | 120 | 12.000 | 650 |
| ID 3 — Doraemon Bóng Chày Tập 1 | Doraemon | 80 | 15.000 | 420 |
| ID 4 — Conan Tập 100 | Thám Tử Conan | 200 | 15.000 | 1.540 |
| ID 5 — Conan Tập 101 | Thám Tử Conan | 140 | 15.000 | 780 |
| ID 6 — One Piece Tập 105 | One Piece | 300 | 18.000 | 2.100 |
| ID 7 — One Piece Tập 106 | One Piece | 180 | 18.000 | 950 |
| ID 8 — Dragon Ball Tập 1 | Dragon Ball | 90 | 15.000 | 560 |
| ID 9 — Cho Tôi Xin Một Vé Đi Tuổi Thơ | Văn Học Việt Nam | 110 | 45.000 | 1.350 |
| ID 10 — Dế Mèn Phiêu Lưu Ký | Văn Học Việt Nam | 60 | 80.000 | 430 |
| ID 11 — Đắc Nhân Tâm | Sách Kỹ Năng | 250 | 50.000 | 3.400 |
| ID 12 — Tôi Thấy Hoa Vàng Trên Cỏ Xanh | Văn Học Việt Nam | 140 | 50.000 | 1.120 |

Tổng: **12 sách**, tất cả ở trạng thái `ACTIVE`.

**Dữ liệu khác:**

| Loại | Số lượng | Ghi chú |
|---|---|---|
| Đơn hàng mẫu | 2 | ID 1 `DELIVERED` (COD, chưa thanh toán) · ID 2 `SHIPPING` (BANKING, đã thanh toán) |
| Chi tiết đơn hàng | 4 | Đơn 1: sách 1, 4 · Đơn 2: sách 9, 11 |
| Đánh giá | 3 | Sách 1, 4, 9 — đều 5 sao, đã duyệt |
| Khuyến mãi | 2 | `KIMDONG20` (giảm 20%, đơn từ 150k) · `FREESHIP30` (giảm 20k, đơn từ 200k) |
| Banner | 3 | Đang hiển thị |
| Danh mục | 13 | 5 danh mục cha + 8 danh mục con |
| Tác giả | 7 | |
| Nhà xuất bản | 3 | ID 1 = NXB Kim Đồng |
| Tài khoản | 3 | 1 ADMIN, 1 EMPLOYEE, 1 CUSTOMER |

> 📌 **Lưu ý:** database kiểm thử nạp từ `seed.sql` có **12 sách đều đang bán**, khác với database phát triển hiện tại (10 sách, do một sách đã bị xoá mềm và một sách không có trong bản chạy). Vì vậy **mọi kết quả mong đợi phải đối chiếu theo `seed.sql`**, không theo dữ liệu đang xem trên giao diện.

---

## 5. Chiến lược kiểm thử

### 5.1 Phân tầng theo mức độ ưu tiên

| Tầng | Loại kiểm thử | Phạm vi | Công cụ | Tỷ trọng |
|---|---|---|---|---|
| **1** | **API / Tích hợp** | 65 endpoint, toàn bộ nghiệp vụ | Postman + Newman, script Node | **60%** |
| **2** | **Giao diện (thủ công)** | Các màn hình chính | Thủ công + ảnh chụp | **30%** |
| **3** | **Đơn vị (Unit)** | Hàm thuần | Script Node tự viết (không cần cài thêm) | **10%** |

### 5.2 Lý do chọn API test làm trọng tâm

Backend là **REST API thuần**, toàn bộ logic nghiệp vụ (tính tiền, trừ kho, hoàn kho, phân quyền, validate) nằm ở tầng API. Kiểm thử qua API:

- Bao phủ được **toàn bộ nghiệp vụ** chỉ với 1 công cụ.
- Chạy **tự động, lặp lại được**, không phụ thuộc giao diện.
- Phát hiện lỗi ở tầng controller, middleware, câu lệnh SQL và dữ liệu.
- Không cần giả lập (mock) database → kiểm thử sát thực tế.

### 5.3 Hạn chế của Unit test trong dự án này

Logic nghiệp vụ nằm rải trong controller kết hợp câu lệnh SQL trực tiếp, **không tách thành hàm thuần** nên khó unit test. Do đó chỉ unit test các hàm tiện ích thật sự thuần:

| Hàm | Vị trí | Nội dung kiểm thử | Trạng thái |
|---|---|---|---|
| `formatVND()` | `client/src/utils/format.ts` | Định dạng tiền tệ VNĐ | **Đã kiểm thử** |
| `formatDate()` | `client/src/utils/format.ts` | Định dạng ngày giờ, xử lý chuỗi rỗng | **Đã kiểm thử** |
| `calculateDiscountPercent()` | `client/src/utils/format.ts` | Tính % giảm giá | **Đã kiểm thử** |
| `getStockStatus()` | `server/src/config/constants.ts` | Phân loại tồn kho theo ngưỡng 100 | **Đã kiểm thử** |
| `evaluatePromotion()` | `server/src/controllers/promotionController.ts` | Duyệt mã khuyến mãi: hạn dùng, lượt dùng, đơn tối thiểu, trần giảm | **Đã kiểm thử** |
| Tính phí vận chuyển | `server/src/controllers/orderController.ts` | Miễn phí ≥ 200.000đ, ngược lại 20.000đ | Chưa tách hàm riêng |
| Tính tổng tiền | `server/src/controllers/orderController.ts` | `max(0, tạm tính − giảm giá + phí ship)` | Chưa tách hàm riêng |

**Kết quả:** 48/48 ca đạt (100%) — xem [Kết quả kiểm thử đơn vị](../tests/KET_QUA_KIEM_THU_DON_VI.md).

Hai mục cuối (phí vận chuyển, tổng tiền) hiện nằm lẫn trong `createOrder` nên
chưa tách riêng để gọi trực tiếp được. Đây là hướng mở rộng tiếp theo: tách thành
hàm thuần `calculateShippingFee()` và `calculateOrderTotal()` rồi bổ sung test.

### 5.4 Kỹ thuật thiết kế test case

| Kỹ thuật | Áp dụng cụ thể trong dự án |
|---|---|
| **Phân vùng tương đương** | Lý do huỷ đơn: rỗng / 1–4 ký tự / 5–500 ký tự / >500 ký tự |
| **Phân tích giá trị biên** | Số lượng mua: 0, 1, bằng tồn kho, tồn kho + 1 · Đơn 199.999đ vs 200.000đ (mốc freeship) · Tồn kho 0 / 99 / 100 (ngưỡng cảnh báo) |
| **Bảng quyết định** | Huỷ đơn: trạng thái đơn × vai trò → cho phép / từ chối |
| **Chuyển trạng thái** | Đơn hàng: `PENDING → CONFIRMED → PROCESSING → SHIPPING → DELIVERED`, nhánh `CANCELLED` |
| **Kiểm thử luồng nghiệp vụ** | Đặt hàng → xác nhận → đóng gói → giao → huỷ (hoàn kho) |
| **Kiểm thử hộp đen** | Toàn bộ API test |
| **Kiểm thử hộp trắng** | Rà nhánh xử lý trong controller cho luồng huỷ đơn và hoàn kho |

### 5.5 Quy tắc nghiệp vụ then chốt cần kiểm chứng

Đây là các quy tắc **dễ sai nhất**, phải có test case riêng:

1. **Tồn kho bị trừ ngay khi đặt hàng** (không phải khi xác nhận đơn).
2. **Huỷ đơn phải hoàn lại đúng số lượng** sách vào kho, và **chỉ hoàn đúng 1 lần**.
3. **Không huỷ được đơn `DELIVERED`** (đã giao thành công).
4. **Huỷ đơn bắt buộc nhập lý do**, tối thiểu 5 ký tự, tối đa 500 ký tự.
5. **Đơn đã thanh toán** khi huỷ phải chuyển sang trạng thái **cần hoàn tiền**.
6. **Chỉ được đánh giá sách khi đã mua** và đơn ở trạng thái **hoàn thành**.
7. **Phí vận chuyển:** miễn phí khi tạm tính ≥ 200.000đ, ngược lại 20.000đ.
8. **Ngưỡng cảnh báo tồn kho = 100** (dùng chung cho Dashboard và Quản lý kho).
9. **Kiểm kê kho** phải tính đúng chênh lệch giữa số hệ thống và số thực tế.
10. **Giỏ hàng tách riêng theo từng người dùng**, không dùng chung.

---

## 6. Tiêu chí bắt đầu và kết thúc
### 6.1 Tiêu chí bắt đầu (Entry Criteria)

- Backend chạy được tại `http://localhost:5000`, kết nối MySQL thành công.
- Frontend chạy được tại `http://localhost:3000`.
- Database kiểm thử đã nạp `schema.sql` + `seed.sql`.
- 3 tài khoản kiểm thử đăng nhập được.
- Bộ test case đã được thiết kế và phê duyệt.

### 6.2 Tiêu chí kết thúc (Exit Criteria)

- **100%** test case đã được thực thi.
- Tỷ lệ đạt **≥ 95%**.
- **Không còn lỗi mức nghiêm trọng (Critical) hoặc cao (High)** chưa xử lý.
- Toàn bộ 65 endpoint đã được kiểm thử ít nhất một lần.
- Các hàm thuần túy chính đã có kiểm thử đơn vị.
- Báo cáo kết quả kiểm thử đã hoàn thành.

### 6.3 Tiêu chí tạm dừng (Suspend Criteria)

- Backend hoặc database không khởi động được.
- Phát hiện lỗi Critical khiến không thể kiểm thử tiếp các chức năng phụ thuộc.

### 6.4 Kết quả đối chiếu tiêu chí kết thúc

| Tiêu chí | Yêu cầu | Thực tế | Kết luận |
|---|---|---|---|
| Tỷ lệ thực thi | 100% | 253/253 test case | **Đạt** |
| Tỷ lệ đạt | ≥ 95% | 100% (253/253 và 601/601) | **Đạt** |
| Lỗi Critical/High còn tồn | 0 | 0 — 5 lỗi phát hiện đều đã sửa và kiểm thử lại | **Đạt** |
| Endpoint được kiểm thử | 65/65 | 65/65 | **Đạt** |
| Kiểm thử đơn vị hàm thuần | Có | 48/48 ca đạt (100%) | **Đạt** |
| Báo cáo kết quả | Đã hoàn thành | `tests/KET_QUA_KIEM_THU.md`, `tests/KET_QUA_POSTMAN.md`, `tests/KET_QUA_KIEM_THU_DON_VI.md` | **Đạt** |

**5 lỗi thực tế phát hiện được và đã sửa trong mã nguồn:**

| Mã lỗi | Mức độ | Mô tả | Vị trí sửa |
|---|---|---|---|
| BUG-001 | Cao | Cập nhật hồ sơ với body thiếu trường gây lỗi 500 do mysql2 không nhận giá trị `undefined` | `authController.updateProfile` — dùng `COALESCE(?, field)` |
| BUG-002 | Cao | Đăng ký chấp nhận email sai định dạng và mật khẩu 2 ký tự | `authController.register` — thêm kiểm tra định dạng |
| BUG-003 | Cao | Thêm vào giỏ hàng chấp nhận số lượng 0 và số âm | `cartController.addToCart` — kiểm tra số nguyên dương |
| BUG-004 | Cao | Đặt hàng chấp nhận số lượng 0 | `orderController.createOrder` — kiểm tra số nguyên dương |
| BUG-005 | Trung bình | Thêm sách không tồn tại vào yêu thích gây lỗi 500 do vi phạm khoá ngoại | `wishlistController.toggleWishlist` — kiểm tra tồn tại trước |

Đây là minh chứng cụ thể cho giá trị của kiểm thử: cả 5 lỗi đều nằm ở **tầng
validate dữ liệu đầu vào**, loại lỗi rất khó phát hiện khi chỉ bấm tay trên giao
diện vì giao diện đã tự giới hạn giá trị nhập.

---

## 7. Phân bổ test case

Bảng dưới đây là số test case **thực tế đã xây dựng** cho bộ kiểm thử API tự động
(`tests/api-tests.mjs`), đã chạy và đạt 100%.

| # | Module | Endpoint | Số test case |
|---|---|---|---|
| 1 | Xác thực | 5 | 17 |
| 2 | Sách | 6 | 21 |
| 3 | Danh mục | 4 | 10 |
| 4 | Tác giả & NXB | 5 | 10 |
| 5 | Banner | 5 | 10 |
| 6 | Khuyến mãi | 7 | 16 |
| 7 | Tài khoản nhân viên | 5 | 14 |
| 8 | Khách hàng | 3 | 9 |
| 9 | Giỏ hàng | 6 | 16 |
| 10 | **Đơn hàng** | 7 | **51** |
| 11 | **Quản lý kho** | 5 | **24** |
| 12 | Đánh giá | 4 | 12 |
| 13 | Yêu thích | 2 | 5 |
| 14 | Thống kê | 1 | 12 |
| 15 | Phân quyền (xuyên module) | — | 14 |
| 16 | Bảo mật & Validate chung | — | 12 |
| | **TỔNG** | **65** | **253** |

Nhóm Đơn hàng và Quản lý kho chiếm tỷ trọng lớn nhất vì đây là nơi tập trung các
quy tắc nghiệp vụ quan trọng nhất: trừ kho khi đặt hàng, hoàn kho khi huỷ, kiểm
tra tồn kho trước khi xác nhận, và phân tích giá trị biên của lý do huỷ đơn.

### Quy ước mã test case

`TC-<MODULE>-<số thứ tự>` — ví dụ: `TC-ORD-01`, `TC-INV-05`, `TC-SEC-03`

---

## 8. Lịch trình kiểm thử

| Giai đoạn | Nội dung | Thời lượng | Sản phẩm | Trạng thái |
|---|---|---|---|---|
| 1 | Lập kế hoạch kiểm thử | 1 ngày | Tài liệu này | **Xong** |
| 2 | Thiết kế test case cho 16 module | 3 ngày | Bảng test case | **Xong** |
| 3 | Chuẩn bị môi trường + database kiểm thử | 0,5 ngày | Môi trường sẵn sàng | **Xong** |
| 4 | Xây dựng bộ API test tự động | 2 ngày | Postman collection + script Node | **Xong** |
| 5 | Thực thi API test, ghi nhận lỗi | 2 ngày | Nhật ký lỗi | **Xong** — 253/253 và 601/601 đạt |
| 6 | Kiểm thử giao diện thủ công | 2 ngày | Ảnh chụp + kết quả | Chờ thực hiện |
| 7 | Unit test các hàm tiện ích | 1 ngày | Báo cáo độ phủ | **Xong** — 48/48 đạt |
| 8 | Kiểm thử lại sau khi sửa lỗi | 1 ngày | Kết quả vòng 2 | **Xong** — 5 lỗi đã sửa và xác nhận |
| 9 | Tổng hợp báo cáo kết quả | 1 ngày | Test Summary | **Xong** |
| | **Tổng** | **~13,5 ngày** | | |

---

## 9. Rủi ro và biện pháp xử lý

| # | Rủi ro | Mức độ | Biện pháp |
|---|---|---|---|
| 1 | Kiểm thử làm hỏng dữ liệu demo | Cao | Dùng database riêng `kimdong_bookstore_test`, khôi phục trước mỗi lượt chạy |
| 2 | Test phụ thuộc thứ tự chạy (test này tạo dữ liệu cho test kia) | Trung bình | Mỗi test tự tạo dữ liệu riêng, tự dọn dẹp sau khi chạy |
| 3 | Trạng thái đơn hàng không đặt lại được về ban đầu | Trung bình | Tạo đơn mới cho mỗi test case thay vì dùng lại đơn cũ |
| 4 | Tồn kho bị lệch sau nhiều lượt chạy | Cao | Ghi nhận tồn kho gốc trước khi test, đối chiếu và khôi phục sau khi test |
| 5 | Mật khẩu tài khoản demo bị đổi trong lúc test | Trung bình | Không dùng tài khoản demo để test chức năng đổi mật khẩu; tạo tài khoản riêng |
| 6 | Kết quả test phụ thuộc ngày giờ hệ thống | Trung bình | Test doanh thu theo kỳ phải tính mốc ngày động, không ghi cứng ngày |

---

## 10. Vai trò và trách nhiệm

| Vai trò | Trách nhiệm |
|---|---|
| Trưởng nhóm | Phê duyệt kế hoạch, theo dõi tiến độ, quyết định kết thúc kiểm thử |
| Người thiết kế test | Viết test case, chuẩn bị dữ liệu kiểm thử |
| Người thực thi test | Chạy test, ghi nhận kết quả và lỗi |
| Lập trình viên | Sửa lỗi, xác nhận lỗi đã được khắc phục |

---

## 11. Sản phẩm bàn giao

| # | Sản phẩm | Định dạng | Trạng thái |
|---|---|---|---|
| 1 | Kế hoạch kiểm thử | Tài liệu này | **Đã có** — `docs/KE_HOACH_KIEM_THU.md` |
| 2 | Hướng dẫn kiểm thử | Markdown | **Đã có** — `docs/HUONG_DAN_KIEM_THU.md` |
| 3 | Bộ API test tự động bằng Node (253 test case) | Script `.mjs` | **Đã có** — `tests/api-tests.mjs` |
| 4 | Bộ sưu tập Postman (249 request, 601 kiểm tra) | JSON + script sinh | **Đã có** — `tests/KIMDONG_API.postman_collection.json` |
| 5 | Script chạy kiểm thử tự động | PowerShell | **Đã có** — `tests/run-tests.ps1` |
| 6 | Báo cáo kết quả kiểm thử | Markdown | **Đã có** — `tests/KET_QUA_KIEM_THU.md`, `tests/KET_QUA_POSTMAN.md` |
| 7 | Nhật ký lỗi | Markdown | **Đã có** — nằm trong báo cáo kết quả |
| 8 | Bộ kiểm thử đơn vị (48 test case) | Script `.mjs` | **Đã có** — `tests/unit-tests.mjs` |
| 9 | Báo cáo kết quả kiểm thử đơn vị | Markdown | **Đã có** — `tests/KET_QUA_KIEM_THU_DON_VI.md` |
| 10 | Ảnh chụp minh hoạ kiểm thử giao diện | Thư mục ảnh | Chờ thực hiện |

---

## 12. Bảng test case

Bảng test case **đầy đủ 253 dòng** được sinh tự động trong báo cáo kết quả, mục
"3. Chi tiết từng test case" của file [`tests/KET_QUA_KIEM_THU.md`](../tests/KET_QUA_KIEM_THU.md).
Mỗi dòng gồm: mã test case, module, mô tả, kết quả mong đợi, kết quả thực tế và
trạng thái đạt/không đạt.

Dưới đây là một số mẫu tiêu biểu minh hoạ cách viết test case:

| Mã TC | Module | Mô tả | Tiền điều kiện | Các bước | Dữ liệu vào | Kết quả mong đợi |
|---|---|---|---|---|---|---|
| TC-AUTH-01 | Xác thực | Đăng nhập đúng thông tin | Đã có tài khoản ADMIN | 1. Gọi `POST /auth/login` | `admin@kimdong.vn` / `admin123` | HTTP 200, trả về JWT token |
| TC-AUTH-02 | Xác thực | Đăng nhập sai mật khẩu | Đã có tài khoản ADMIN | 1. Gọi `POST /auth/login` | `admin@kimdong.vn` / `sai123` | HTTP 401, thông báo lỗi |
| TC-SEC-01 | Phân quyền | Khách hàng truy cập API quản trị | Đã đăng nhập CUSTOMER | 1. Gọi `GET /admin/statistics` | Token CUSTOMER | HTTP 403, từ chối truy cập |
| TC-ORD-01 | Đơn hàng | Đặt hàng trừ tồn kho ngay | Sách ID 3 tồn 80 | 1. Gọi `POST /orders` mua 5 cuốn ID 3 | `book_id: 3, quantity: 5` | Tồn kho còn **75** |
| TC-ORD-02 | Đơn hàng | Huỷ đơn thì hoàn lại kho | Đơn ở trạng thái CONFIRMED | 1. Gọi `PUT /orders/:id/cancel` | Lý do ≥ 5 ký tự | Trạng thái `CANCELLED`, hoàn đủ kho, lưu lý do |
| TC-ORD-03 | Đơn hàng | Không huỷ được đơn đã giao | Đơn ở trạng thái DELIVERED | 1. Gọi `PUT /orders/:id/cancel` | Lý do hợp lệ | HTTP 400, **không** hoàn kho |
| TC-ORD-04 | Đơn hàng | Huỷ 2 lần không cộng kho 2 lần | Đơn đã bị huỷ | 1. Gọi huỷ lần thứ hai | Lý do hợp lệ | HTTP 400, tồn kho **không đổi** |
| TC-ORD-05 | Đơn hàng | Lý do huỷ ở giá trị biên | Đơn ở trạng thái CONFIRMED | 1. Huỷ với lý do 4 ký tự<br>2. Huỷ với lý do 5 ký tự | `"huyy"` / `"huy ne"` | 4 ký tự → **400**<br>5 ký tự → **200** |
| TC-INV-01 | Quản lý kho | Kiểm kê lệch tồn kho | Sách ID 2 tồn hệ thống 120 | 1. Gọi `PUT /inventory/2/stock` | Số thực tế: 111 | Chênh lệch **−9**, tồn về 111 |
| TC-RVW-01 | Đánh giá | Không đánh giá được khi chưa mua | Tài khoản chưa mua sách | 1. Gọi `POST /reviews` | `book_id` chưa mua | Từ chối, báo chưa mua hàng |
| TC-SHIP-01 | Đơn hàng | Mốc miễn phí vận chuyển | — | 1. Đặt đơn tạm tính 199.999đ<br>2. Đặt đơn tạm tính 200.000đ | — | 199.999đ → phí **20.000đ**<br>200.000đ → phí **0đ** |

---

## 13. Nhật ký lỗi

Mẫu ghi nhận lỗi:

| Mã lỗi | Mô tả | Module | Mức độ | Các bước tái hiện | Kết quả mong đợi | Kết quả thực tế | Ảnh | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| BUG-001 | | | Critical / High / Medium / Low | | | | | Mới / Đang sửa / Đã sửa / Đóng |

**5 lỗi thực tế đã phát hiện và khắc phục** trong đợt kiểm thử này:

| Mã lỗi | Mô tả | Module | Mức độ | Kết quả mong đợi | Kết quả thực tế (trước khi sửa) | Trạng thái |
|---|---|---|---|---|---|---|
| BUG-001 | Cập nhật hồ sơ với body thiếu trường gây lỗi hệ thống | Xác thực | High | HTTP 200, các trường không gửi giữ nguyên | HTTP 500 — mysql2 không nhận giá trị `undefined` | Đã sửa |
| BUG-002 | Đăng ký chấp nhận email sai định dạng và mật khẩu quá ngắn | Xác thực | High | Email sai định dạng → 400<br>Mật khẩu < 6 ký tự → 400 | Chấp nhận cả hai, tài khoản vẫn được tạo | Đã sửa |
| BUG-003 | Thêm vào giỏ hàng chấp nhận số lượng 0 và số âm | Giỏ hàng | High | Số lượng ≤ 0 → HTTP 400 | Số 0 bị đổi thành 1; số âm được ghi thẳng vào giỏ | Đã sửa |
| BUG-004 | Đặt hàng chấp nhận số lượng 0 | Đơn hàng | High | Số lượng ≤ 0 → HTTP 400 | Đơn hàng với số lượng 0 vẫn được tạo | Đã sửa |
| BUG-005 | Thêm sách không tồn tại vào yêu thích gây lỗi hệ thống | Yêu thích | Medium | HTTP 404, báo không tìm thấy sách | HTTP 500 — vi phạm khoá ngoại | Đã sửa |

Cả 5 lỗi đều đã được sửa trong mã nguồn và **kiểm thử lại thành công**; các test
case tương ứng hiện đều đạt.

---

## 14. Phê duyệt

| Vai trò | Họ tên | Chữ ký | Ngày |
|---|---|---|---|
| Người lập kế hoạch | | | |
| Trưởng nhóm | | | |
| Giảng viên hướng dẫn | | | |
