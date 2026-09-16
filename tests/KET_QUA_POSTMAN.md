# Kết quả chạy bộ sưu tập Postman

Báo cáo được sinh tự động bởi `tests/run-postman.mjs`.

- **Thời điểm chạy:** 16/09/2026 23:00:27
- **Địa chỉ API:** `http://localhost:5099/api`
- **Bộ sưu tập:** `tests/KIMDONG_API.postman_collection.json`
- **Số folder:** 13
- **Số request:** 249
- **Số kiểm tra:** 601

## 1. Tổng hợp

| Chỉ số | Giá trị |
| --- | --- |
| Kiểm tra đã chạy | 601 |
| Đạt | 601 |
| Không đạt | 0 |
| Tỷ lệ đạt | 100.0% |

## 2. Kết quả theo nhóm chức năng

| Nhóm chức năng | Request | Kiểm tra | Đạt | Không đạt | Kết luận |
| --- | ---: | ---: | ---: | ---: | --- |
| 00. Xác thực & Lấy token | 16 | 38 | 38 | 0 | Đạt |
| 01. Quản lý sách (Books) | 21 | 50 | 50 | 0 | Đạt |
| 02. Danh mục (Categories) | 10 | 23 | 23 | 0 | Đạt |
| 03. Tác giả & Nhà xuất bản | 10 | 23 | 23 | 0 | Đạt |
| 04. Banner | 10 | 23 | 23 | 0 | Đạt |
| 05. Khuyến mãi (Promotions) | 16 | 39 | 39 | 0 | Đạt |
| 06. Tài khoản nhân viên & Khách hàng | 23 | 51 | 51 | 0 | Đạt |
| 07. Giỏ hàng (Cart) | 21 | 52 | 52 | 0 | Đạt |
| 08. Đơn hàng (Orders) — QUAN TRỌNG NHẤT | 50 | 127 | 127 | 0 | Đạt |
| 09. Quản lý kho (Inventory) | 25 | 60 | 60 | 0 | Đạt |
| 10. Đánh giá & Yêu thích | 16 | 37 | 37 | 0 | Đạt |
| 11. Thống kê / Dashboard | 10 | 29 | 29 | 0 | Đạt |
| 12. Phân quyền & Bảo mật | 21 | 49 | 49 | 0 | Đạt |

## 3. Chi tiết từng kiểm tra

### 00. Xác thực & Lấy token

| Request | HTTP | Thời gian | Kiểm tra | Kết quả |
| --- | ---: | ---: | ---: | --- |
| TC-AUTH-01 · Đăng nhập ADMIN | 200 | 85 ms | 4 | Đạt |
| TC-AUTH-02 · Đăng nhập NHÂN VIÊN | 200 | 97 ms | 3 | Đạt |
| TC-AUTH-03 · Đăng nhập KHÁCH HÀNG | 200 | 83 ms | 3 | Đạt |
| TC-AUTH-04 · Đăng nhập SAI mật khẩu | 401 | 86 ms | 2 | Đạt |
| TC-AUTH-05 · Email KHÔNG tồn tại | 401 | 2 ms | 2 | Đạt |
| TC-AUTH-06 · Đăng nhập THIẾU mật khẩu | 400 | 1 ms | 2 | Đạt |
| TC-AUTH-07 · Đăng nhập THIẾU email | 400 | 2 ms | 2 | Đạt |
| TC-AUTH-08 · Lấy hồ sơ cá nhân | 200 | 2 ms | 3 | Đạt |
| TC-AUTH-09 · Lấy hồ sơ KHÔNG có token | 401 | 1 ms | 2 | Đạt |
| TC-AUTH-10 · Token GIẢ MẠO | 401 | 1 ms | 2 | Đạt |
| TC-AUTH-11 · Cập nhật hồ sơ cá nhân | 200 | 7 ms | 2 | Đạt |
| TC-AUTH-17 · Cập nhật hồ sơ CHỈ 1 TRƯỜNG | 200 | 2 ms | 3 | Đạt |
| TC-AUTH-12 · Đổi mật khẩu với mật khẩu cũ SAI | 400 | 88 ms | 2 | Đạt |
| TC-AUTH-13 · Đăng ký TRÙNG email | 400 | 2 ms | 2 | Đạt |
| TC-VAL-08 · Đăng ký EMAIL SAI ĐỊNH DẠNG | 400 | 1 ms | 2 | Đạt |
| TC-VAL-09 · Đăng ký MẬT KHẨU QUÁ NGẮN | 400 | 1 ms | 2 | Đạt |

### 01. Quản lý sách (Books)

| Request | HTTP | Thời gian | Kiểm tra | Kết quả |
| --- | ---: | ---: | ---: | --- |
| TC-BOOK-01 · Danh sách sách | 200 | 3 ms | 3 | Đạt |
| TC-BOOK-02 · Đủ 12 sách theo seed | 200 | 2 ms | 3 | Đạt |
| TC-BOOK-03 · Chi tiết sách theo ID | 200 | 2 ms | 3 | Đạt |
| TC-BOOK-04 · Chi tiết sách theo SLUG | 200 | 4 ms | 2 | Đạt |
| TC-BOOK-05 · Sách KHÔNG tồn tại | 404 | 2 ms | 2 | Đạt |
| TC-BOOK-06 · Lọc sách theo danh mục | 200 | 2 ms | 3 | Đạt |
| TC-BOOK-07 · Tìm kiếm sách theo từ khoá | 200 | 2 ms | 3 | Đạt |
| TC-BOOK-08 · Lọc sách theo khoảng giá | 200 | 2 ms | 2 | Đạt |
| TC-BOOK-09 · Sách theo nhóm trang chủ | 200 | 5 ms | 2 | Đạt |
| TC-BOOK-10 · Tạo sách mới (ADMIN) | 201 | 3 ms | 3 | Đạt |
| TC-BOOK-11 · Tạo sách THIẾU tiêu đề | 400 | 1 ms | 2 | Đạt |
| TC-BOOK-12 · KHÁCH HÀNG tạo sách | 403 | 1 ms | 2 | Đạt |
| TC-BOOK-13 · NHÂN VIÊN được tạo sách | 201 | 3 ms | 3 | Đạt |
| TC-BOOK-13b · Dọn dẹp sách nhân viên vừa tạo | 200 | 2 ms | 2 | Đạt |
| TC-BOOK-14 · Cập nhật sách (một phần) | 200 | 2 ms | 2 | Đạt |
| TC-BOOK-15 · Cập nhật sách KHÔNG tồn tại | 404 | 1 ms | 2 | Đạt |
| TC-BOOK-16 · Trạng thái sách KHÔNG hợp lệ | 400 | 1 ms | 2 | Đạt |
| TC-BOOK-17 · Trạng thái sách hợp lệ (INACTIVE) | 200 | 2 ms | 2 | Đạt |
| TC-BOOK-18 · Xoá sách (xoá mềm) | 200 | 2 ms | 2 | Đạt |
| TC-BOOK-19 · Sách đã xoá không còn trong danh sách | 200 | 3 ms | 3 | Đạt |
| TC-BOOK-20 · KHÁCH HÀNG xoá sách | 403 | 1 ms | 2 | Đạt |

### 02. Danh mục (Categories)

| Request | HTTP | Thời gian | Kiểm tra | Kết quả |
| --- | ---: | ---: | ---: | --- |
| TC-CAT-01 · Danh sách danh mục | 200 | 1 ms | 3 | Đạt |
| TC-CAT-02 · Đủ 13 danh mục theo seed | 200 | 2 ms | 3 | Đạt |
| TC-CAT-03 · Tạo danh mục mới | 201 | 2 ms | 3 | Đạt |
| TC-CAT-04 · Tạo danh mục THIẾU tên | 400 | 1 ms | 2 | Đạt |
| TC-CAT-05 · Cập nhật danh mục | 200 | 2 ms | 2 | Đạt |
| TC-CAT-06 · Cập nhật danh mục KHÔNG tồn tại | 404 | 1 ms | 2 | Đạt |
| TC-CAT-07 · KHÁCH HÀNG tạo danh mục | 403 | 1 ms | 2 | Đạt |
| TC-CAT-08 · Chặn xoá danh mục còn sách | 400 | 2 ms | 2 | Đạt |
| TC-CAT-09 · Xoá danh mục rỗng | 200 | 3 ms | 2 | Đạt |
| TC-CAT-10 · Xoá danh mục KHÔNG tồn tại | 404 | 1 ms | 2 | Đạt |

### 03. Tác giả & Nhà xuất bản

| Request | HTTP | Thời gian | Kiểm tra | Kết quả |
| --- | ---: | ---: | ---: | --- |
| TC-AUT-01 · Danh sách tác giả | 200 | 2 ms | 3 | Đạt |
| TC-AUT-02 · Danh sách nhà xuất bản | 200 | 1 ms | 3 | Đạt |
| TC-AUT-03 · Tạo tác giả mới | 201 | 3 ms | 3 | Đạt |
| TC-AUT-04 · Tạo tác giả THIẾU tên | 400 | 2 ms | 2 | Đạt |
| TC-AUT-05 · Cập nhật tác giả | 200 | 2 ms | 2 | Đạt |
| TC-AUT-06 · Cập nhật tác giả KHÔNG tồn tại | 404 | 2 ms | 2 | Đạt |
| TC-AUT-07 · KHÁCH HÀNG tạo tác giả | 403 | 1 ms | 2 | Đạt |
| TC-AUT-08 · Xoá tác giả | 200 | 2 ms | 2 | Đạt |
| TC-AUT-09 · Xoá tác giả KHÔNG tồn tại | 404 | 2 ms | 2 | Đạt |
| TC-AUT-10 · Không đăng nhập không tạo được | 401 | 0 ms | 2 | Đạt |

### 04. Banner

| Request | HTTP | Thời gian | Kiểm tra | Kết quả |
| --- | ---: | ---: | ---: | --- |
| TC-BAN-01 · Banner đang hiển thị (công khai) | 200 | 2 ms | 3 | Đạt |
| TC-BAN-02 · Toàn bộ banner (quản trị) | 200 | 1 ms | 3 | Đạt |
| TC-BAN-03 · KHÁCH HÀNG xem toàn bộ banner | 403 | 1 ms | 2 | Đạt |
| TC-BAN-04 · Tạo banner mới | 201 | 2 ms | 3 | Đạt |
| TC-BAN-05 · Tạo banner THIẾU tiêu đề | 400 | 1 ms | 2 | Đạt |
| TC-BAN-10 · Tạo banner THIẾU cta_link | 400 | 1 ms | 2 | Đạt |
| TC-BAN-06 · Cập nhật banner | 200 | 2 ms | 2 | Đạt |
| TC-BAN-07 · Cập nhật banner KHÔNG tồn tại | 404 | 1 ms | 2 | Đạt |
| TC-BAN-09 · KHÁCH HÀNG tạo banner | 403 | 1 ms | 2 | Đạt |
| TC-BAN-08 · Xoá banner | 200 | 2 ms | 2 | Đạt |

### 05. Khuyến mãi (Promotions)

| Request | HTTP | Thời gian | Kiểm tra | Kết quả |
| --- | ---: | ---: | ---: | --- |
| TC-PRM-01 · Mã đang hoạt động (công khai) | 200 | 1 ms | 3 | Đạt |
| TC-PRM-02 · Toàn bộ mã (quản trị) | 200 | 1 ms | 3 | Đạt |
| TC-PRM-03 · Kiểm tra mã HỢP LỆ | 200 | 1 ms | 4 | Đạt |
| TC-PRM-04 · Mã khi đơn CHƯA ĐỦ giá trị tối thiểu | 400 | 1 ms | 2 | Đạt |
| TC-PRM-05 · Mã KHÔNG TỒN TẠI | 400 | 1 ms | 2 | Đạt |
| TC-PRM-06 · Kiểm tra mã THIẾU tham số | 400 | 1 ms | 2 | Đạt |
| TC-PRM-16 · Mã giảm theo SỐ TIỀN CỐ ĐỊNH | 200 | 1 ms | 3 | Đạt |
| TC-PRM-07 · Tạo mã giảm giá mới | 201 | 2 ms | 3 | Đạt |
| TC-PRM-08 · Tạo mã TRÙNG code | 400 | 2 ms | 2 | Đạt |
| TC-PRM-09 · Tạo mã THIẾU code | 400 | 1 ms | 2 | Đạt |
| TC-PRM-10 · Cập nhật mã giảm giá | 200 | 3 ms | 2 | Đạt |
| TC-PRM-11 · Cập nhật mã KHÔNG tồn tại | 404 | 1 ms | 2 | Đạt |
| TC-PRM-12 · Bật/tắt mã | 200 | 2 ms | 3 | Đạt |
| TC-PRM-13 · Mã bị TẠM DỪNG thì không dùng được | 400 | 1 ms | 2 | Đạt |
| TC-PRM-15 · KHÁCH HÀNG tạo mã | 403 | 1 ms | 2 | Đạt |
| TC-PRM-14 · Xoá mã giảm giá | 200 | 2 ms | 2 | Đạt |

### 06. Tài khoản nhân viên & Khách hàng

| Request | HTTP | Thời gian | Kiểm tra | Kết quả |
| --- | ---: | ---: | ---: | --- |
| TC-EMP-01 · Danh sách tài khoản (ADMIN) | 200 | 2 ms | 3 | Đạt |
| TC-EMP-02 · NHÂN VIÊN xem danh sách tài khoản | 403 | 1 ms | 2 | Đạt |
| TC-EMP-03 · KHÁCH HÀNG xem danh sách tài khoản | 403 | 0 ms | 2 | Đạt |
| TC-EMP-04 · Tạo tài khoản nhân viên | 201 | 80 ms | 3 | Đạt |
| TC-EMP-05 · Tài khoản vừa tạo đăng nhập được | 200 | 81 ms | 2 | Đạt |
| TC-EMP-06 · Tạo tài khoản TRÙNG email | 400 | 1 ms | 2 | Đạt |
| TC-EMP-07 · Tạo tài khoản THIẾU mật khẩu | 400 | 1 ms | 2 | Đạt |
| TC-EMP-08 · Cập nhật thông tin nhân viên | 200 | 3 ms | 2 | Đạt |
| TC-EMP-09 · Cập nhật tài khoản KHÔNG tồn tại | 404 | 1 ms | 2 | Đạt |
| TC-EMP-10 · Đổi vai trò tài khoản | 200 | 2 ms | 2 | Đạt |
| TC-EMP-13 · Không thể HẠ QUYỀN chính mình | 400 | 1 ms | 2 | Đạt |
| TC-EMP-14 · Không thể XOÁ chính mình | 400 | 1 ms | 2 | Đạt |
| TC-EMP-12 · NHÂN VIÊN tạo tài khoản | 403 | 1 ms | 2 | Đạt |
| TC-EMP-11 · Xoá tài khoản nhân viên | 200 | 2 ms | 2 | Đạt |
| TC-CUS-01 · Danh sách khách hàng | 200 | 2 ms | 3 | Đạt |
| TC-CUS-02 · Danh sách chỉ gồm vai trò khách hàng | 200 | 1 ms | 3 | Đạt |
| TC-CUS-03 · NHÂN VIÊN xem được danh sách khách hàng | 200 | 2 ms | 2 | Đạt |
| TC-CUS-04 · KHÁCH HÀNG xem danh sách khách hàng | 403 | 1 ms | 2 | Đạt |
| TC-CUS-05 · Chi tiết khách hàng | 200 | 7 ms | 3 | Đạt |
| TC-CUS-06 · Chi tiết khách hàng KHÔNG tồn tại | 404 | 1 ms | 2 | Đạt |
| TC-CUS-07 · Cập nhật thông tin khách hàng | 200 | 3 ms | 2 | Đạt |
| TC-CUS-08 · NHÂN VIÊN sửa khách hàng | 403 | 1 ms | 2 | Đạt |
| TC-CUS-09 · Cập nhật khách hàng KHÔNG tồn tại | 404 | 1 ms | 2 | Đạt |

### 07. Giỏ hàng (Cart)

| Request | HTTP | Thời gian | Kiểm tra | Kết quả |
| --- | ---: | ---: | ---: | --- |
| TC-CART-01 · Xoá sạch giỏ hàng | 200 | 2 ms | 2 | Đạt |
| TC-CART-02 · Giỏ hàng rỗng | 200 | 1 ms | 3 | Đạt |
| TC-CART-03 · Thêm sách vào giỏ | 200 | 3 ms | 2 | Đạt |
| TC-CART-04 · Giỏ có đúng 1 sản phẩm | 200 | 2 ms | 4 | Đạt |
| TC-CART-05 · Thêm cùng sách thì CỘNG DỒN số lượng | 200 | 3 ms | 2 | Đạt |
| TC-CART-05b · Kiểm tra số lượng đã cộng dồn (2 + 3 = 5) | 200 | 1 ms | 3 | Đạt |
| TC-CART-06 · Thêm sách KHÔNG tồn tại | 404 | 1 ms | 2 | Đạt |
| TC-CART-07 · Thêm số lượng 0 | 400 | 2 ms | 2 | Đạt |
| TC-CART-08 · Thêm số lượng ÂM | 400 | 1 ms | 2 | Đạt |
| TC-CART-09 · Thêm VƯỢT tồn kho | 400 | 1 ms | 2 | Đạt |
| TC-CART-10 · Cập nhật số lượng trong giỏ | 200 | 3 ms | 2 | Đạt |
| TC-CART-11 · Số lượng đã cập nhật thành 4 | 200 | 1 ms | 3 | Đạt |
| TC-CART-12 · Xoá một sản phẩm khỏi giỏ | 200 | 2 ms | 2 | Đạt |
| TC-CART-13 · Giỏ trống sau khi xoá | 200 | 1 ms | 3 | Đạt |
| TC-CART-14a · Thêm sách 2 vào giỏ | 200 | 2 ms | 2 | Đạt |
| TC-CART-14b · Thêm sách 4 vào giỏ | 200 | 3 ms | 2 | Đạt |
| TC-CART-14c · Lấy id các mục trong giỏ | 200 | 2 ms | 4 | Đạt |
| TC-CART-14 · Xoá nhiều sản phẩm cùng lúc | 200 | 3 ms | 2 | Đạt |
| TC-CART-14d · Giỏ trống sau khi xoá nhiều | 200 | 1 ms | 3 | Đạt |
| TC-CART-16 · Xoá với danh sách RỖNG | 400 | 1 ms | 2 | Đạt |
| TC-CART-15 · Giỏ tách riêng theo từng người dùng | 200 | 2 ms | 3 | Đạt |

### 08. Đơn hàng (Orders) — QUAN TRỌNG NHẤT

| Request | HTTP | Thời gian | Kiểm tra | Kết quả |
| --- | ---: | ---: | ---: | --- |
| B1 · Ghi nhận tồn kho sách 3 TRƯỚC khi đặt | 200 | 2 ms | 3 | Đạt |
| TC-ORD-01 · Đặt hàng (trừ kho ngay) | 201 | 7 ms | 4 | Đạt |
| TC-ORD-02 · Tồn kho sách 3 đã GIẢM 5 cuốn | 200 | 1 ms | 3 | Đạt |
| TC-ORD-03 · Đơn mới ở trạng thái CHỜ XÁC NHẬN | 200 | 1 ms | 3 | Đạt |
| TC-ORD-04 · Danh sách đơn hàng | 200 | 12 ms | 3 | Đạt |
| TC-ORD-05 · Danh sách kèm tồn kho hiện tại | 200 | 13 ms | 3 | Đạt |
| TC-ORD-06 · KHÁCH HÀNG chỉ thấy đơn của CHÍNH MÌNH | 200 | 12 ms | 3 | Đạt |
| TC-ORD-07 · Không đăng nhập xem đơn | 401 | 1 ms | 2 | Đạt |
| TC-ORD-08 · Kiểm tra thông tin đơn trước xác nhận | 200 | 3 ms | 3 | Đạt |
| TC-ORD-09 · Đơn hợp lệ thì cho phép xác nhận | 200 | 2 ms | 3 | Đạt |
| TC-ORD-10 · Xác nhận đơn hàng | 200 | 4 ms | 2 | Đạt |
| TC-ORD-11 · Đơn chuyển sang ĐÃ XÁC NHẬN | 200 | 1 ms | 3 | Đạt |
| TC-ORD-12 · Xác nhận LẠI đơn đã xác nhận | 200 | 1 ms | 3 | Đạt |
| TC-ORD-13 · Xác nhận đơn KHÔNG tồn tại | 404 | 1 ms | 2 | Đạt |
| TC-ORD-14 · KHÁCH HÀNG xác nhận đơn | 403 | 1 ms | 2 | Đạt |
| TC-ORD-51 · KHÁCH HÀNG xem kiểm tra đơn | 403 | 1 ms | 2 | Đạt |
| TC-ORD-15 · Chuyển sang ĐANG ĐÓNG GÓI | 200 | 3 ms | 2 | Đạt |
| TC-ORD-16 · Chuyển sang ĐANG GIAO HÀNG | 200 | 3 ms | 2 | Đạt |
| TC-ORD-17 · Trạng thái KHÔNG hợp lệ | 400 | 1 ms | 2 | Đạt |
| TC-ORD-30 · Huỷ qua API đổi trạng thái cũ | 400 | 1 ms | 2 | Đạt |
| TC-ORD-18 · HUỶ ĐƠN kèm lý do | 200 | 6 ms | 3 | Đạt |
| TC-ORD-19 · Đơn chuyển sang ĐÃ HUỶ | 200 | 2 ms | 3 | Đạt |
| TC-ORD-20 · Lý do huỷ được LƯU LẠI | 200 | 2 ms | 3 | Đạt |
| TC-ORD-21 · Thời điểm huỷ được ghi nhận | 200 | 2 ms | 3 | Đạt |
| TC-ORD-22 · Tồn kho sách 3 đã HOÀN LẠI | 200 | 3 ms | 3 | Đạt |
| TC-ORD-24 · Huỷ đơn LẦN HAI | 400 | 2 ms | 2 | Đạt |
| TC-ORD-25 · Tồn kho KHÔNG bị cộng hai lần | 200 | 2 ms | 3 | Đạt |
| TC-ORD-31a · Tạo đơn mới để kiểm thử biên lý do huỷ | 201 | 6 ms | 3 | Đạt |
| TC-ORD-31 · Lý do huỷ RỖNG | 400 | 1 ms | 2 | Đạt |
| TC-ORD-32 · Lý do huỷ toàn KHOẢNG TRẮNG | 400 | 2 ms | 2 | Đạt |
| TC-ORD-33 · Lý do huỷ 4 ký tự — DƯỚI BIÊN | 400 | 1 ms | 2 | Đạt |
| TC-ORD-34 · Lý do huỷ ĐÚNG 5 ký tự — TẠI BIÊN | 200 | 5 ms | 2 | Đạt |
| TC-ORD-35a · Tạo đơn mới để kiểm thử biên trên | 201 | 6 ms | 3 | Đạt |
| TC-ORD-35 · Lý do huỷ 501 ký tự — VƯỢT BIÊN | 400 | 2 ms | 2 | Đạt |
| TC-ORD-35b · Đơn vẫn huỷ được với lý do dài hợp lệ | 200 | 4 ms | 2 | Đạt |
| TC-ORD-37 · Huỷ đơn KHÔNG tồn tại | 404 | 2 ms | 2 | Đạt |
| TC-ORD-38 · Đặt hàng KHÔNG có sản phẩm | 400 | 1 ms | 2 | Đạt |
| TC-ORD-39 · Đặt hàng VƯỢT tồn kho | 400 | 2 ms | 2 | Đạt |
| TC-ORD-40 · Đặt hàng THIẾU thông tin người nhận | 400 | 1 ms | 2 | Đạt |
| TC-ORD-41 · Đặt hàng SỐ LƯỢNG 0 | 400 | 1 ms | 2 | Đạt |
| TC-ORD-43 · Đơn dưới 200.000đ phải chịu phí 20.000đ | 201 | 5 ms | 3 | Đạt |
| TC-ORD-43b · Kiểm tra phí vận chuyển = 20.000đ | 200 | 2 ms | 3 | Đạt |
| TC-ORD-44 · Đơn từ 200.000đ được MIỄN phí vận chuyển | 201 | 5 ms | 3 | Đạt |
| TC-ORD-44b · Kiểm tra phí vận chuyển = 0đ | 200 | 2 ms | 3 | Đạt |
| TC-ORD-45 · Tổng tiền = tạm tính − giảm giá + phí ship | 200 | 7 ms | 3 | Đạt |
| TC-ORD-47 · Huỷ đơn ĐÃ THANH TOÁN thì đánh dấu cần hoàn tiền | 201 | 6 ms | 3 | Đạt |
| TC-ORD-47b · Huỷ đơn chuyển khoản | 200 | 6 ms | 2 | Đạt |
| TC-ORD-47c · Trạng thái thanh toán là REFUNDED | 200 | 3 ms | 3 | Đạt |
| TC-ORD-49 · KHÁCH HÀNG tự huỷ đơn | 403 | 2 ms | 2 | Đạt |
| TC-ORD-50 · Không đăng nhập huỷ đơn | 401 | 0 ms | 2 | Đạt |

### 09. Quản lý kho (Inventory)

| Request | HTTP | Thời gian | Kiểm tra | Kết quả |
| --- | ---: | ---: | ---: | --- |
| TC-INV-01 · Danh sách tồn kho | 200 | 3 ms | 3 | Đạt |
| TC-INV-02 · Có thống kê tổng hợp | 200 | 2 ms | 3 | Đạt |
| TC-INV-03 · Ngưỡng cảnh báo tồn kho = 100 | 200 | 3 ms | 3 | Đạt |
| TC-INV-04 · Sách tồn thấp được xếp lên đầu | 200 | 3 ms | 3 | Đạt |
| TC-INV-05 · Lọc kho theo trạng thái | 200 | 2 ms | 2 | Đạt |
| TC-INV-06 · Tồn kho theo danh mục | 200 | 2 ms | 2 | Đạt |
| TC-INV-07 · Chi tiết một sách trong kho | 200 | 2 ms | 3 | Đạt |
| TC-INV-08 · Sách KHÔNG tồn tại | 404 | 2 ms | 2 | Đạt |
| TC-INV-09 · KHÁCH HÀNG xem kho | 403 | 1 ms | 2 | Đạt |
| TC-INV-10a · Ghi nhận tồn kho sách 3 ngay trước khi nhập | 200 | 1 ms | 3 | Đạt |
| TC-INV-10 · Nhập kho thêm số lượng | 200 | 4 ms | 2 | Đạt |
| TC-INV-11 · Tồn kho tăng đúng sau khi nhập | 200 | 2 ms | 3 | Đạt |
| TC-INV-12 · Nhập kho số lượng ÂM | 400 | 2 ms | 2 | Đạt |
| TC-INV-13 · Nhập kho số lượng 0 | 400 | 2 ms | 2 | Đạt |
| TC-INV-14 · Nhập kho vượt giới hạn | 400 | 3 ms | 2 | Đạt |
| TC-INV-15 · KIỂM KÊ điều chỉnh tồn kho | 200 | 4 ms | 3 | Đạt |
| TC-INV-16 · Chênh lệch kiểm kê được tính đúng | 200 | 2 ms | 3 | Đạt |
| TC-INV-18 · Kiểm kê KHÔNG đổi thì chênh lệch bằng 0 | 200 | 2 ms | 3 | Đạt |
| TC-INV-19 · Kiểm kê số ÂM | 400 | 1 ms | 2 | Đạt |
| TC-INV-20 · Kiểm kê số THẬP PHÂN | 400 | 1 ms | 2 | Đạt |
| TC-INV-21 · Kiểm kê CHỮ CÁI | 400 | 2 ms | 2 | Đạt |
| TC-INV-22 · Kiểm kê số QUÁ LỚN | 400 | 1 ms | 2 | Đạt |
| TC-INV-23 · NHÂN VIÊN được điều chỉnh tồn kho | 200 | 2 ms | 2 | Đạt |
| TC-INV-25 · KHÁCH HÀNG nhập kho | 403 | 1 ms | 2 | Đạt |
| TC-INV-24 · KHÁCH HÀNG điều chỉnh kho | 403 | 1 ms | 2 | Đạt |

### 10. Đánh giá & Yêu thích

| Request | HTTP | Thời gian | Kiểm tra | Kết quả |
| --- | ---: | ---: | ---: | --- |
| TC-RVW-01 · Đánh giá của một cuốn sách (công khai) | 200 | 1 ms | 3 | Đạt |
| TC-RVW-02 · Sách 1 có đánh giá theo seed | 200 | 1 ms | 3 | Đạt |
| TC-RVW-03 · Kiểm tra quyền đánh giá sách CHƯA MUA | 200 | 2 ms | 3 | Đạt |
| TC-RVW-04 · Đánh giá sách CHƯA MUA | 403 | 3 ms | 2 | Đạt |
| TC-RVW-05 · Danh sách sách đã mua có thể đánh giá | 200 | 1 ms | 3 | Đạt |
| TC-RVW-06 · Đánh giá sách ĐÃ MUA và đơn hoàn thành | 200 | 3 ms | 2 | Đạt |
| TC-RVW-07 · Số sao NGOÀI khoảng 1-5 | 400 | 1 ms | 2 | Đạt |
| TC-RVW-08 · Số sao bằng 0 | 400 | 1 ms | 2 | Đạt |
| TC-RVW-09 · Nội dung đánh giá QUÁ NGẮN | 400 | 1 ms | 2 | Đạt |
| TC-RVW-10 · Không đăng nhập đánh giá | 401 | 1 ms | 2 | Đạt |
| TC-RVW-12 · Đánh giá sách KHÔNG tồn tại | 404 | 1 ms | 2 | Đạt |
| TC-WSH-01 · Danh sách yêu thích | 200 | 1 ms | 3 | Đạt |
| TC-WSH-02 · Thêm sách vào yêu thích | 200 | 2 ms | 2 | Đạt |
| TC-WSH-03 · Bỏ yêu thích (bấm lần hai) | 200 | 4 ms | 2 | Đạt |
| TC-WSH-05 · Yêu thích sách KHÔNG tồn tại | 404 | 1 ms | 2 | Đạt |
| TC-WSH-04 · Không đăng nhập dùng yêu thích | 401 | 1 ms | 2 | Đạt |

### 11. Thống kê / Dashboard

| Request | HTTP | Thời gian | Kiểm tra | Kết quả |
| --- | ---: | ---: | ---: | --- |
| TC-DASH-01 · Lấy dữ liệu thống kê | 200 | 6 ms | 3 | Đạt |
| TC-DASH-05 · Biểu đồ theo NGÀY (30 điểm) | 200 | 6 ms | 3 | Đạt |
| TC-DASH-06 · Biểu đồ theo THÁNG (12 điểm) | 200 | 6 ms | 3 | Đạt |
| TC-DASH-07 · Biểu đồ theo NĂM (5 điểm) | 200 | 6 ms | 3 | Đạt |
| TC-DASH-09 · Doanh thu theo danh mục có dữ liệu | 200 | 6 ms | 3 | Đạt |
| TC-DASH-10 · Tổng doanh thu danh mục = tổng từng dòng | 200 | 6 ms | 3 | Đạt |
| TC-DASH-11 · Ngưỡng cảnh báo tồn kho thấp = 100 | 200 | 7 ms | 3 | Đạt |
| TC-DASH-04 · Có số liệu tổng khách hàng | 200 | 7 ms | 3 | Đạt |
| TC-DASH-03 · Có số liệu tổng số sách | 200 | 6 ms | 3 | Đạt |
| TC-DASH-12 · KHÁCH HÀNG xem thống kê | 403 | 1 ms | 2 | Đạt |

### 12. Phân quyền & Bảo mật

| Request | HTTP | Thời gian | Kiểm tra | Kết quả |
| --- | ---: | ---: | ---: | --- |
| TC-SEC-01 · Không token · GET /users | 401 | 1 ms | 2 | Đạt |
| TC-SEC-02 · Không token · GET /customers | 401 | 0 ms | 2 | Đạt |
| TC-SEC-03 · Không token · GET /admin/statistics | 401 | 1 ms | 2 | Đạt |
| TC-SEC-04 · Không token · GET /inventory | 401 | 0 ms | 2 | Đạt |
| TC-SEC-05 · Không token · GET /orders | 401 | 1 ms | 2 | Đạt |
| TC-SEC-06 · KHÁCH HÀNG · thống kê | 403 | 0 ms | 2 | Đạt |
| TC-SEC-07 · KHÁCH HÀNG · kho | 403 | 1 ms | 2 | Đạt |
| TC-SEC-08 · KHÁCH HÀNG · tài khoản | 403 | 1 ms | 2 | Đạt |
| TC-SEC-09 · NHÂN VIÊN · kho | 200 | 1 ms | 2 | Đạt |
| TC-SEC-10 · NHÂN VIÊN · thống kê | 200 | 6 ms | 2 | Đạt |
| TC-SEC-11 · NHÂN VIÊN · tài khoản | 403 | 1 ms | 2 | Đạt |
| TC-VAL-01 · SQL Injection ở tìm kiếm | 200 | 1 ms | 3 | Đạt |
| TC-VAL-02 · SQL Injection dạng UNION | 200 | 2 ms | 3 | Đạt |
| TC-VAL-03 · SQL Injection ở đăng nhập | 401 | 1 ms | 2 | Đạt |
| TC-VAL-04 · Mật khẩu KHÔNG bị lộ trong phản hồi | 200 | 81 ms | 3 | Đạt |
| TC-VAL-05 · ID không phải số | 404 | 1 ms | 3 | Đạt |
| TC-VAL-07 · Giá sách ÂM bị từ chối | 400 | 1 ms | 2 | Đạt |
| TC-VAL-10 · Chuỗi RẤT DÀI không làm sập hệ thống | 401 | 1 ms | 3 | Đạt |
| TC-VAL-11 · Tạo danh mục có tên tiếng Việt | 201 | 3 ms | 3 | Đạt |
| TC-VAL-11b · Tiếng Việt có dấu được lưu đúng | 200 | 1 ms | 3 | Đạt |
| Dọn dẹp · Xoá danh mục tiếng Việt vừa tạo | 200 | 2 ms | 2 | Đạt |

## 4. Danh sách kiểm tra không đạt

Không có kiểm tra nào không đạt.

---

*Bộ kiểm thử tự động đầy đủ (253 test case) nằm ở `tests/api-tests.mjs`.*
