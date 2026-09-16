# KẾT QUẢ KIỂM THỬ API

**Dự án:** Website Bán Sách Trực Tuyến — NXB Kim Đồng  
**Địa chỉ API:** `http://localhost:5099/api`  
**Thời điểm chạy:** 17:50:50 16/9/2026  
**Công cụ:** Bộ kiểm thử tự động `tests/api-tests.mjs`

---

## 1. Tổng hợp kết quả

| Chỉ tiêu | Giá trị |
|---|---|
| Tổng số test case | 253 |
| Đạt | 253 |
| Không đạt | 0 |
| Tỷ lệ đạt | **100.0%** |

## 2. Kết quả theo module

| Module | Số test case | Đạt | Không đạt | Tỷ lệ |
|---|---|---|---|---|
| Xác thực | 17 | 17 | 0 | 100% |
| Sách | 21 | 21 | 0 | 100% |
| Danh mục | 10 | 10 | 0 | 100% |
| Tác giả | 10 | 10 | 0 | 100% |
| Banner | 10 | 10 | 0 | 100% |
| Khuyến mãi | 16 | 16 | 0 | 100% |
| Tài khoản | 14 | 14 | 0 | 100% |
| Khách hàng | 9 | 9 | 0 | 100% |
| Giỏ hàng | 16 | 16 | 0 | 100% |
| Đơn hàng | 51 | 51 | 0 | 100% |
| Quản lý kho | 24 | 24 | 0 | 100% |
| Đánh giá | 12 | 12 | 0 | 100% |
| Yêu thích | 5 | 5 | 0 | 100% |
| Thống kê | 12 | 12 | 0 | 100% |
| Phân quyền | 14 | 14 | 0 | 100% |
| Bảo mật | 12 | 12 | 0 | 100% |
| **Tổng** | **253** | **253** | **0** | **100.0%** |

## 3. Chi tiết từng test case

| Mã TC | Module | Mô tả | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|
| TC-AUTH-01 | Xác thực | Đăng nhập ADMIN đúng thông tin | HTTP 200 + có token | 200 | ✅ Đạt |
| TC-AUTH-02 | Xác thực | Đăng nhập NHÂN VIÊN đúng thông tin | HTTP 200 | 200 | ✅ Đạt |
| TC-AUTH-03 | Xác thực | Đăng nhập KHÁCH HÀNG đúng thông tin | HTTP 200 | 200 | ✅ Đạt |
| TC-AUTH-04 | Xác thực | Đăng nhập sai mật khẩu | HTTP 401 | 401 | ✅ Đạt |
| TC-AUTH-05 | Xác thực | Đăng nhập email không tồn tại | HTTP 401 | 401 | ✅ Đạt |
| TC-AUTH-06 | Xác thực | Đăng nhập thiếu mật khẩu | HTTP 400 | 400 | ✅ Đạt |
| TC-AUTH-07 | Xác thực | Đăng nhập thiếu email | HTTP 400 | 400 | ✅ Đạt |
| TC-AUTH-08 | Xác thực | Lấy hồ sơ bằng token hợp lệ | HTTP 200 + đúng email | {"status":200,"email":"admin@kimdong.vn"} | ✅ Đạt |
| TC-AUTH-09 | Xác thực | Lấy hồ sơ khi không gửi token | HTTP 401 | 401 | ✅ Đạt |
| TC-AUTH-10 | Xác thực | Lấy hồ sơ với token giả mạo | HTTP 401 hoặc 403 | 403 | ✅ Đạt |
| TC-AUTH-11 | Xác thực | Cập nhật hồ sơ cá nhân (đầy đủ trường) | HTTP 200 | 200 | ✅ Đạt |
| TC-AUTH-17 | Xác thực | Cập nhật hồ sơ chỉ gửi 1 trường (payload một phần) | HTTP 200 hoặc 400 (không được 500) | 200 | ✅ Đạt |
| TC-AUTH-12 | Xác thực | Đổi mật khẩu với mật khẩu cũ sai | HTTP 400 | 400 | ✅ Đạt |
| TC-AUTH-13 | Xác thực | Đăng ký trùng email đã tồn tại | HTTP 400 | 400 | ✅ Đạt |
| TC-AUTH-14 | Xác thực | Đăng ký tài khoản mới hợp lệ | HTTP 200 hoặc 201 | 201 | ✅ Đạt |
| TC-AUTH-15 | Xác thực | Đổi mật khẩu với mật khẩu cũ đúng | HTTP 200 | 200 | ✅ Đạt |
| TC-AUTH-16 | Xác thực | Đăng nhập bằng mật khẩu vừa đổi | HTTP 200 | 200 | ✅ Đạt |
| TC-BOOK-01 | Sách | Lấy danh sách sách | HTTP 200 + có mảng books | {"status":200,"count":[{"id":12,"category_id":12,"author_id":5,"publisher_id":1,"title":"T?i Th?y Hoa V?ng Tr?n C? Xanh","slug":"toi-thay-hoa-vang-tre… | ✅ Đạt |
| TC-BOOK-02 | Sách | Danh sách có đủ 12 sách theo seed | Đúng 12 sách | 12 | ✅ Đạt |
| TC-BOOK-03 | Sách | Lấy chi tiết sách theo ID | HTTP 200 + đúng ID | {"status":200,"id":1} | ✅ Đạt |
| TC-BOOK-04 | Sách | Lấy chi tiết sách theo slug | HTTP 200 | 200 | ✅ Đạt |
| TC-BOOK-05 | Sách | Lấy sách không tồn tại | HTTP 404 | 404 | ✅ Đạt |
| TC-BOOK-06 | Sách | Lọc sách theo danh mục | HTTP 200 + chỉ sách danh mục 6 | {"status":200,"ok":true} | ✅ Đạt |
| TC-BOOK-07 | Sách | Tìm kiếm sách theo từ khoá | HTTP 200 + có kết quả | {"status":200,"count":3} | ✅ Đạt |
| TC-BOOK-08 | Sách | Lọc sách theo khoảng giá | HTTP 200 | 200 | ✅ Đạt |
| TC-BOOK-09 | Sách | Lấy sách theo danh mục nổi bật trang chủ | HTTP 200 | 200 | ✅ Đạt |
| TC-BOOK-10 | Sách | Tạo sách mới với quyền ADMIN | HTTP 200 hoặc 201 | 201 | ✅ Đạt |
| TC-BOOK-11 | Sách | Tạo sách thiếu tiêu đề | HTTP 400 | 400 | ✅ Đạt |
| TC-BOOK-12 | Sách | KHÁCH HÀNG không được tạo sách | HTTP 403 | 403 | ✅ Đạt |
| TC-BOOK-13 | Sách | NHÂN VIÊN được tạo sách | HTTP 200 hoặc 201 | 201 | ✅ Đạt |
| TC-BOOK-14 | Sách | Cập nhật thông tin sách | HTTP 200 | 200 | ✅ Đạt |
| TC-BOOK-15 | Sách | Cập nhật sách không tồn tại | HTTP 404 | 404 | ✅ Đạt |
| TC-BOOK-16 | Sách | Cập nhật trạng thái sách không hợp lệ | HTTP 400 | 400 | ✅ Đạt |
| TC-BOOK-17 | Sách | Cập nhật trạng thái sách hợp lệ (INACTIVE) | HTTP 200 | 200 | ✅ Đạt |
| TC-BOOK-18 | Sách | Xoá sách (xoá mềm) | HTTP 200 | 200 | ✅ Đạt |
| TC-BOOK-19 | Sách | Sách đã xoá không còn trong danh sách | Không còn sách đã xoá | false | ✅ Đạt |
| TC-BOOK-20 | Sách | Khách hàng không được xoá sách | HTTP 403 | 403 | ✅ Đạt |
| TC-BOOK-21 | Sách | Dọn dẹp sách do nhân viên tạo ở TC-BOOK-13 | HTTP 200 | 200 | ✅ Đạt |
| TC-CAT-01 | Danh mục | Lấy danh sách danh mục | HTTP 200 + có dữ liệu | {"status":200,"count":5} | ✅ Đạt |
| TC-CAT-02 | Danh mục | Seed có 13 danh mục (gồm cả danh mục con) | Đúng 13 | 13 | ✅ Đạt |
| TC-CAT-03 | Danh mục | Tạo danh mục mới | HTTP 200 hoặc 201 | 201 | ✅ Đạt |
| TC-CAT-04 | Danh mục | Tạo danh mục thiếu tên | HTTP 400 | 400 | ✅ Đạt |
| TC-CAT-05 | Danh mục | Cập nhật danh mục | HTTP 200 | 200 | ✅ Đạt |
| TC-CAT-06 | Danh mục | Cập nhật danh mục không tồn tại | HTTP 404 | 404 | ✅ Đạt |
| TC-CAT-07 | Danh mục | KHÁCH HÀNG không được tạo danh mục | HTTP 403 | 403 | ✅ Đạt |
| TC-CAT-08 | Danh mục | Chặn xoá danh mục còn sách | HTTP 400 | 400 | ✅ Đạt |
| TC-CAT-09 | Danh mục | Xoá danh mục rỗng thành công | HTTP 200 | 200 | ✅ Đạt |
| TC-CAT-10 | Danh mục | Xoá danh mục không tồn tại | HTTP 404 | 404 | ✅ Đạt |
| TC-AUT-01 | Tác giả | Lấy danh sách tác giả | HTTP 200 + 7 tác giả | {"status":200,"count":7} | ✅ Đạt |
| TC-AUT-02 | Tác giả | Lấy danh sách nhà xuất bản | HTTP 200 + 3 NXB | {"status":200,"count":3} | ✅ Đạt |
| TC-AUT-03 | Tác giả | Tạo tác giả mới | HTTP 200 hoặc 201 | 201 | ✅ Đạt |
| TC-AUT-04 | Tác giả | Tạo tác giả thiếu tên | HTTP 400 | 400 | ✅ Đạt |
| TC-AUT-05 | Tác giả | Cập nhật tác giả | HTTP 200 | 200 | ✅ Đạt |
| TC-AUT-06 | Tác giả | Cập nhật tác giả không tồn tại | HTTP 404 | 404 | ✅ Đạt |
| TC-AUT-07 | Tác giả | KHÁCH HÀNG không được tạo tác giả | HTTP 403 | 403 | ✅ Đạt |
| TC-AUT-08 | Tác giả | Xoá tác giả vừa tạo | HTTP 200 | 200 | ✅ Đạt |
| TC-AUT-09 | Tác giả | Xoá tác giả không tồn tại | HTTP 404 | 404 | ✅ Đạt |
| TC-AUT-10 | Tác giả | Không đăng nhập không tạo được tác giả | HTTP 401 | 401 | ✅ Đạt |
| TC-BAN-01 | Banner | Lấy banner đang hiển thị (công khai) | HTTP 200 + có dữ liệu | {"status":200,"count":3} | ✅ Đạt |
| TC-BAN-02 | Banner | Lấy toàn bộ banner (quản trị) | HTTP 200 + 3 banner | {"status":200,"count":3} | ✅ Đạt |
| TC-BAN-03 | Banner | KHÁCH HÀNG không xem được toàn bộ banner | HTTP 403 | 403 | ✅ Đạt |
| TC-BAN-04 | Banner | Tạo banner mới | HTTP 200 hoặc 201 | 201 | ✅ Đạt |
| TC-BAN-05 | Banner | Tạo banner thiếu tiêu đề | HTTP 400 | 400 | ✅ Đạt |
| TC-BAN-06 | Banner | Cập nhật banner | HTTP 200 | 200 | ✅ Đạt |
| TC-BAN-07 | Banner | Cập nhật banner không tồn tại | HTTP 404 | 404 | ✅ Đạt |
| TC-BAN-10 | Banner | Tạo banner thiếu đường dẫn CTA | HTTP 400 | 400 | ✅ Đạt |
| TC-BAN-08 | Banner | Xoá banner | HTTP 200 | 200 | ✅ Đạt |
| TC-BAN-09 | Banner | KHÁCH HÀNG không tạo được banner | HTTP 403 | 403 | ✅ Đạt |
| TC-PRM-01 | Khuyến mãi | Lấy mã đang hoạt động | HTTP 200 + có dữ liệu | {"status":200,"count":2} | ✅ Đạt |
| TC-PRM-02 | Khuyến mãi | Lấy toàn bộ mã (quản trị) | HTTP 200 + 2 mã | {"status":200,"count":2} | ✅ Đạt |
| TC-PRM-03 | Khuyến mãi | Kiểm tra mã hợp lệ đủ điều kiện | HTTP 200 + có số tiền giảm | {"status":200,"discount":50000} | ✅ Đạt |
| TC-PRM-04 | Khuyến mãi | Mã không dùng được khi đơn dưới giá trị tối thiểu | HTTP 400 | 400 | ✅ Đạt |
| TC-PRM-05 | Khuyến mãi | Kiểm tra mã không tồn tại | HTTP 400 | 400 | ✅ Đạt |
| TC-PRM-06 | Khuyến mãi | Kiểm tra mã thiếu tham số | HTTP 400 | 400 | ✅ Đạt |
| TC-PRM-07 | Khuyến mãi | Tạo mã giảm giá mới | HTTP 200 hoặc 201 | 201 | ✅ Đạt |
| TC-PRM-08 | Khuyến mãi | Tạo mã trùng code đã tồn tại | HTTP 400 | 400 | ✅ Đạt |
| TC-PRM-09 | Khuyến mãi | Tạo mã thiếu code | HTTP 400 | 400 | ✅ Đạt |
| TC-PRM-10 | Khuyến mãi | Cập nhật mã giảm giá | HTTP 200 | 200 | ✅ Đạt |
| TC-PRM-11 | Khuyến mãi | Cập nhật mã không tồn tại | HTTP 404 | 404 | ✅ Đạt |
| TC-PRM-12 | Khuyến mãi | Bật/tắt trạng thái mã | HTTP 200 | 200 | ✅ Đạt |
| TC-PRM-13 | Khuyến mãi | Mã bị tạm dừng thì không dùng được nữa | HTTP 400 | 400 | ✅ Đạt |
| TC-PRM-14 | Khuyến mãi | Xoá mã giảm giá | HTTP 200 | 200 | ✅ Đạt |
| TC-PRM-15 | Khuyến mãi | KHÁCH HÀNG không tạo được mã | HTTP 403 | 403 | ✅ Đạt |
| TC-PRM-16 | Khuyến mãi | Mã giảm giá theo số tiền cố định | HTTP 200 + giảm đúng 20.000đ | {"status":200,"discount":20000} | ✅ Đạt |
| TC-EMP-01 | Tài khoản | ADMIN lấy danh sách tài khoản | HTTP 200 + có dữ liệu | {"status":200,"count":4} | ✅ Đạt |
| TC-EMP-02 | Tài khoản | NHÂN VIÊN không xem được danh sách tài khoản | HTTP 403 | 403 | ✅ Đạt |
| TC-EMP-03 | Tài khoản | KHÁCH HÀNG không xem được danh sách tài khoản | HTTP 403 | 403 | ✅ Đạt |
| TC-EMP-04 | Tài khoản | ADMIN tạo tài khoản nhân viên | HTTP 200 hoặc 201 | 201 | ✅ Đạt |
| TC-EMP-05 | Tài khoản | Tài khoản nhân viên vừa tạo đăng nhập được | HTTP 200 | 200 | ✅ Đạt |
| TC-EMP-06 | Tài khoản | Tạo tài khoản trùng email | HTTP 400 | 400 | ✅ Đạt |
| TC-EMP-07 | Tài khoản | Tạo tài khoản thiếu mật khẩu | HTTP 400 | 400 | ✅ Đạt |
| TC-EMP-08 | Tài khoản | Cập nhật thông tin nhân viên | HTTP 200 | 200 | ✅ Đạt |
| TC-EMP-09 | Tài khoản | Cập nhật tài khoản không tồn tại | HTTP 404 | 404 | ✅ Đạt |
| TC-EMP-10 | Tài khoản | Đổi vai trò tài khoản | HTTP 200 | 200 | ✅ Đạt |
| TC-EMP-13 | Tài khoản | Không thể hạ quyền chính mình | HTTP 400 | 400 | ✅ Đạt |
| TC-EMP-14 | Tài khoản | Không thể xoá chính tài khoản đang đăng nhập | HTTP 400 | 400 | ✅ Đạt |
| TC-EMP-11 | Tài khoản | Xoá tài khoản nhân viên | HTTP 200 | 200 | ✅ Đạt |
| TC-EMP-12 | Tài khoản | NHÂN VIÊN không tạo được tài khoản | HTTP 403 | 403 | ✅ Đạt |
| TC-CUS-01 | Khách hàng | Lấy danh sách khách hàng | HTTP 200 + có dữ liệu | {"status":200,"count":2} | ✅ Đạt |
| TC-CUS-02 | Khách hàng | Danh sách chỉ gồm vai trò khách hàng | Tất cả role_id = 3 | true | ✅ Đạt |
| TC-CUS-03 | Khách hàng | NHÂN VIÊN xem được danh sách khách hàng | HTTP 200 | 200 | ✅ Đạt |
| TC-CUS-04 | Khách hàng | KHÁCH HÀNG không xem được danh sách | HTTP 403 | 403 | ✅ Đạt |
| TC-CUS-05 | Khách hàng | Xem chi tiết khách hàng | HTTP 200 + đúng ID | {"status":200,"id":3} | ✅ Đạt |
| TC-CUS-06 | Khách hàng | Xem chi tiết khách hàng không tồn tại | HTTP 404 | 404 | ✅ Đạt |
| TC-CUS-07 | Khách hàng | Cập nhật thông tin khách hàng | HTTP 200 | 200 | ✅ Đạt |
| TC-CUS-08 | Khách hàng | NHÂN VIÊN không sửa được khách hàng | HTTP 403 | 403 | ✅ Đạt |
| TC-CUS-09 | Khách hàng | Cập nhật khách hàng không tồn tại | HTTP 404 | 404 | ✅ Đạt |
| TC-CART-01 | Giỏ hàng | Xoá giỏ trước khi kiểm thử | HTTP 200 | 200 | ✅ Đạt |
| TC-CART-02 | Giỏ hàng | Lấy giỏ hàng rỗng | HTTP 200 + 0 sản phẩm | {"status":200,"count":0} | ✅ Đạt |
| TC-CART-03 | Giỏ hàng | Thêm sách vào giỏ | HTTP 200 hoặc 201 | 200 | ✅ Đạt |
| TC-CART-04 | Giỏ hàng | Giỏ có 1 sản phẩm sau khi thêm | Đúng 1 sản phẩm | 1 | ✅ Đạt |
| TC-CART-05 | Giỏ hàng | Thêm cùng sách thì cộng dồn số lượng | Số lượng = 5 | 5 | ✅ Đạt |
| TC-CART-06 | Giỏ hàng | Thêm sách không tồn tại | HTTP 404 hoặc 400 | 404 | ✅ Đạt |
| TC-CART-07 | Giỏ hàng | Thêm sách với số lượng 0 | HTTP 400 | 400 | ✅ Đạt |
| TC-CART-08 | Giỏ hàng | Thêm sách với số lượng âm | HTTP 400 | 400 | ✅ Đạt |
| TC-CART-09 | Giỏ hàng | Thêm sách vượt tồn kho | HTTP 400 | 400 | ✅ Đạt |
| TC-CART-10 | Giỏ hàng | Cập nhật số lượng sản phẩm trong giỏ | HTTP 200 | 200 | ✅ Đạt |
| TC-CART-11 | Giỏ hàng | Số lượng trong giỏ đã cập nhật | Số lượng = 4 | 4 | ✅ Đạt |
| TC-CART-12 | Giỏ hàng | Xoá một sản phẩm khỏi giỏ | HTTP 200 | 200 | ✅ Đạt |
| TC-CART-13 | Giỏ hàng | Giỏ trống sau khi xoá sản phẩm | 0 sản phẩm | 0 | ✅ Đạt |
| TC-CART-14 | Giỏ hàng | Xoá nhiều sản phẩm cùng lúc | HTTP 200 | 200 | ✅ Đạt |
| TC-CART-16 | Giỏ hàng | Xoá nhiều sản phẩm với danh sách rỗng | HTTP 400 | 400 | ✅ Đạt |
| TC-CART-15 | Giỏ hàng | Giỏ tách riêng theo người dùng | Giỏ khách khác không bị ảnh hưởng | true | ✅ Đạt |
| TC-ORD-01 | Đơn hàng | Đặt hàng thành công | HTTP 201 + có mã đơn | {"status":201,"code":"DH5585031690"} | ✅ Đạt |
| TC-ORD-02 | Đơn hàng | Tồn kho bị trừ NGAY khi đặt hàng | Sách 3 giảm 5 cuốn (80 → 75) | 75 | ✅ Đạt |
| TC-ORD-03 | Đơn hàng | Đơn mới ở trạng thái CHỜ XÁC NHẬN | PENDING | PENDING | ✅ Đạt |
| TC-ORD-04 | Đơn hàng | Xem danh sách đơn hàng | HTTP 200 + có dữ liệu | {"status":200,"count":3} | ✅ Đạt |
| TC-ORD-05 | Đơn hàng | Danh sách đơn kèm thông tin tồn kho hiện tại | Có current_stock | true | ✅ Đạt |
| TC-ORD-06 | Đơn hàng | KHÁCH HÀNG chỉ thấy đơn hàng của chính mình | Tất cả đơn thuộc user 3 | {"status":200,"ok":true} | ✅ Đạt |
| TC-ORD-51 | Đơn hàng | KHÁCH HÀNG không xem được chi tiết đơn kiểm tra | HTTP 403 | 403 | ✅ Đạt |
| TC-ORD-07 | Đơn hàng | Không đăng nhập không xem được đơn | HTTP 401 | 401 | ✅ Đạt |
| TC-ORD-08 | Đơn hàng | Kiểm tra thông tin đơn trước xác nhận | HTTP 200 + có checks | {"status":200,"checks":{"phone_valid":true,"email_valid":true,"address_valid":true,"stock_ok":true,"can_confirm":true,"item_count":2,"total_quantity":… | ✅ Đạt |
| TC-ORD-09 | Đơn hàng | Đơn hợp lệ thì cho phép xác nhận | can_confirm = true | true | ✅ Đạt |
| TC-ORD-10 | Đơn hàng | Xác nhận đơn hàng | HTTP 200 | 200 | ✅ Đạt |
| TC-ORD-11 | Đơn hàng | Đơn chuyển sang ĐÃ XÁC NHẬN | CONFIRMED | CONFIRMED | ✅ Đạt |
| TC-ORD-12 | Đơn hàng | Xác nhận lại đơn đã xác nhận (bất biến) | HTTP 200 + đánh dấu đã xác nhận | {"status":200,"already":true} | ✅ Đạt |
| TC-ORD-13 | Đơn hàng | Xác nhận đơn không tồn tại | HTTP 404 | 404 | ✅ Đạt |
| TC-ORD-14 | Đơn hàng | KHÁCH HÀNG không xác nhận được đơn | HTTP 403 | 403 | ✅ Đạt |
| TC-ORD-15 | Đơn hàng | Chuyển trạng thái sang ĐANG ĐÓNG GÓI | HTTP 200 | 200 | ✅ Đạt |
| TC-ORD-16 | Đơn hàng | Chuyển trạng thái sang ĐANG GIAO HÀNG | HTTP 200 | 200 | ✅ Đạt |
| TC-ORD-17 | Đơn hàng | Trạng thái không hợp lệ bị từ chối | HTTP 400 | 400 | ✅ Đạt |
| TC-ORD-18 | Đơn hàng | Huỷ đơn ở trạng thái ĐANG GIAO | HTTP 200 | 200 | ✅ Đạt |
| TC-ORD-19 | Đơn hàng | Đơn chuyển sang ĐÃ HUỶ | CANCELLED | CANCELLED | ✅ Đạt |
| TC-ORD-20 | Đơn hàng | Lý do huỷ được lưu lại | Đúng lý do đã nhập | Khách hàng yêu cầu hủy đơn | ✅ Đạt |
| TC-ORD-21 | Đơn hàng | Thời điểm huỷ được ghi nhận | Có cancelled_at | 2026-09-16T10:50:50.000Z | ✅ Đạt |
| TC-ORD-22 | Đơn hàng | HOÀN LẠI tồn kho sách 3 (5 cuốn) | Sách 3 về 80 | 80 | ✅ Đạt |
| TC-ORD-23 | Đơn hàng | HOÀN LẠI tồn kho sách 7 (3 cuốn) | Sách 7 về 180 | 180 | ✅ Đạt |
| TC-ORD-24 | Đơn hàng | Huỷ đơn lần thứ hai bị từ chối | HTTP 400 | 400 | ✅ Đạt |
| TC-ORD-25 | Đơn hàng | Tồn kho KHÔNG bị cộng hai lần | Sách 3 vẫn là 80 | 80 | ✅ Đạt |
| TC-ORD-26 | Đơn hàng | KHÔNG huỷ được đơn đã giao thành công | HTTP 400 | 400 | ✅ Đạt |
| TC-ORD-27 | Đơn hàng | Đơn đã giao giữ nguyên trạng thái | DELIVERED | DELIVERED | ✅ Đạt |
| TC-ORD-28 | Đơn hàng | Không hoàn kho khi huỷ thất bại | Sách 8 = 88 (đã trừ 2, chưa hoàn) | 88 | ✅ Đạt |
| TC-ORD-29 | Đơn hàng | Giao thành công khi chưa giao bị từ chối | HTTP 400 | 400 | ✅ Đạt |
| TC-ORD-30 | Đơn hàng | Huỷ qua API đổi trạng thái cũ bị chặn | HTTP 400 | 400 | ✅ Đạt |
| TC-ORD-31 | Đơn hàng | Lý do huỷ rỗng bị từ chối | HTTP 400 | 400 | ✅ Đạt |
| TC-ORD-32 | Đơn hàng | Lý do huỷ toàn khoảng trắng bị từ chối | HTTP 400 | 400 | ✅ Đạt |
| TC-ORD-33 | Đơn hàng | Lý do huỷ 4 ký tự (dưới biên) bị từ chối | HTTP 400 | 400 | ✅ Đạt |
| TC-ORD-34 | Đơn hàng | Lý do huỷ đúng 5 ký tự (tại biên) được chấp nhận | HTTP 200 | 200 | ✅ Đạt |
| TC-ORD-35 | Đơn hàng | Lý do huỷ 501 ký tự (vượt biên) bị từ chối | HTTP 400 | 400 | ✅ Đạt |
| TC-ORD-36 | Đơn hàng | Thiếu hẳn trường lý do huỷ | HTTP 400 | 400 | ✅ Đạt |
| TC-ORD-37 | Đơn hàng | Huỷ đơn không tồn tại | HTTP 404 | 404 | ✅ Đạt |
| TC-ORD-38 | Đơn hàng | Đặt hàng không có sản phẩm | HTTP 400 | 400 | ✅ Đạt |
| TC-ORD-39 | Đơn hàng | Đặt hàng vượt quá tồn kho | HTTP 400 | 400 | ✅ Đạt |
| TC-ORD-40 | Đơn hàng | Đặt hàng thiếu thông tin người nhận | HTTP 400 | 400 | ✅ Đạt |
| TC-ORD-41 | Đơn hàng | Đặt hàng số lượng bằng 0 | HTTP 400 | 400 | ✅ Đạt |
| TC-ORD-42 | Đơn hàng | Đặt hàng với sách không tồn tại | HTTP 404 hoặc 400 | 400 | ✅ Đạt |
| TC-ORD-43 | Đơn hàng | Đơn dưới 200.000đ phải chịu phí 20.000đ | Phí = 20000 | 20000 | ✅ Đạt |
| TC-ORD-44 | Đơn hàng | Đơn từ 200.000đ được MIỄN phí vận chuyển | Phí = 0 | 0 | ✅ Đạt |
| TC-ORD-45 | Đơn hàng | Tổng tiền = tạm tính − giảm giá + phí ship | Công thức đúng | true | ✅ Đạt |
| TC-ORD-46 | Đơn hàng | Đơn thanh toán chuyển khoản được đánh dấu ĐÃ THANH TOÁN | PAID | PAID | ✅ Đạt |
| TC-ORD-47 | Đơn hàng | Huỷ đơn đã thanh toán thì đánh dấu cần hoàn tiền | REFUNDED | REFUNDED | ✅ Đạt |
| TC-ORD-48 | Đơn hàng | NHÂN VIÊN huỷ được đơn hàng | HTTP 200 | 200 | ✅ Đạt |
| TC-ORD-49 | Đơn hàng | KHÁCH HÀNG không huỷ được đơn | HTTP 403 | 403 | ✅ Đạt |
| TC-ORD-50 | Đơn hàng | Không đăng nhập không huỷ được đơn | HTTP 401 | 401 | ✅ Đạt |
| TC-INV-01 | Quản lý kho | Lấy danh sách tồn kho | HTTP 200 + có dữ liệu | {"status":200,"count":12} | ✅ Đạt |
| TC-INV-02 | Quản lý kho | Có thống kê tổng hợp tồn kho | Có summary | {"status":200,"hasSummary":true} | ✅ Đạt |
| TC-INV-03 | Quản lý kho | Ngưỡng cảnh báo tồn kho = 100 | threshold = 100 | 100 | ✅ Đạt |
| TC-INV-04 | Quản lý kho | Sách dưới ngưỡng được xếp lên đầu | Sách tồn thấp đứng trước | true | ✅ Đạt |
| TC-INV-05 | Quản lý kho | Lọc kho theo trạng thái hết hàng | HTTP 200 | 200 | ✅ Đạt |
| TC-INV-06 | Quản lý kho | Tồn kho theo danh mục | HTTP 200 + có dữ liệu | {"status":200,"count":6} | ✅ Đạt |
| TC-INV-07 | Quản lý kho | Xem chi tiết một sách trong kho | HTTP 200 | {"status":200,"id":3} | ✅ Đạt |
| TC-INV-08 | Quản lý kho | Xem sách không tồn tại trong kho | HTTP 404 | 404 | ✅ Đạt |
| TC-INV-09 | Quản lý kho | KHÁCH HÀNG không xem được kho | HTTP 403 | 403 | ✅ Đạt |
| TC-INV-10 | Quản lý kho | Nhập kho thêm số lượng | HTTP 200 | 200 | ✅ Đạt |
| TC-INV-11 | Quản lý kho | Tồn kho tăng đúng sau khi nhập | Sách 3 tăng 20 cuốn | true | ✅ Đạt |
| TC-INV-12 | Quản lý kho | Nhập kho số lượng âm bị từ chối | HTTP 400 | 400 | ✅ Đạt |
| TC-INV-13 | Quản lý kho | Nhập kho số lượng 0 bị từ chối | HTTP 400 | 400 | ✅ Đạt |
| TC-INV-14 | Quản lý kho | Nhập kho số lượng vượt giới hạn bị từ chối | HTTP 400 | 400 | ✅ Đạt |
| TC-INV-15 | Quản lý kho | Kiểm kê điều chỉnh tồn kho | HTTP 200 + có chênh lệch | {"status":200,"hasDiff":true} | ✅ Đạt |
| TC-INV-16 | Quản lý kho | Chênh lệch kiểm kê tính đúng | Chênh lệch = −7 | -7 | ✅ Đạt |
| TC-INV-17 | Quản lý kho | Tồn kho cập nhật đúng số thực tế | Tồn = số vừa nhập | true | ✅ Đạt |
| TC-INV-18 | Quản lý kho | Kiểm kê không đổi thì báo không thay đổi | unchanged = true | true | ✅ Đạt |
| TC-INV-19 | Quản lý kho | Kiểm kê số âm bị từ chối | HTTP 400 | 400 | ✅ Đạt |
| TC-INV-20 | Quản lý kho | Kiểm kê số thập phân bị từ chối | HTTP 400 | 400 | ✅ Đạt |
| TC-INV-21 | Quản lý kho | Kiểm kê chữ cái bị từ chối | HTTP 400 | 400 | ✅ Đạt |
| TC-INV-22 | Quản lý kho | Kiểm kê số quá lớn bị từ chối | HTTP 400 | 400 | ✅ Đạt |
| TC-INV-23 | Quản lý kho | NHÂN VIÊN được điều chỉnh tồn kho | HTTP 200 | 200 | ✅ Đạt |
| TC-INV-24 | Quản lý kho | KHÁCH HÀNG không điều chỉnh được tồn kho | HTTP 403 | 403 | ✅ Đạt |
| TC-RVW-01 | Đánh giá | Lấy đánh giá của một cuốn sách | HTTP 200 | 200 | ✅ Đạt |
| TC-RVW-02 | Đánh giá | Seed có 3 đánh giá cho sách 1 | Có ít nhất 1 đánh giá | 1 | ✅ Đạt |
| TC-RVW-03 | Đánh giá | Kiểm tra quyền đánh giá sách chưa mua | Không đủ điều kiện | false | ✅ Đạt |
| TC-RVW-04 | Đánh giá | Không đánh giá được sách chưa mua | HTTP 403 hoặc 400 | 403 | ✅ Đạt |
| TC-RVW-05 | Đánh giá | Danh sách sách đã mua có thể đánh giá | HTTP 200 | 200 | ✅ Đạt |
| TC-RVW-06 | Đánh giá | Đánh giá sách đã mua và đơn hoàn thành | HTTP 200 hoặc 201 | 200 | ✅ Đạt |
| TC-RVW-07 | Đánh giá | Đánh giá với số sao ngoài khoảng 1-5 | HTTP 400 | 400 | ✅ Đạt |
| TC-RVW-08 | Đánh giá | Đánh giá với số sao bằng 0 | HTTP 400 | 400 | ✅ Đạt |
| TC-RVW-09 | Đánh giá | Đánh giá với nội dung quá ngắn | HTTP 400 | 400 | ✅ Đạt |
| TC-RVW-10 | Đánh giá | Không đăng nhập không đánh giá được | HTTP 401 | 401 | ✅ Đạt |
| TC-RVW-11 | Đánh giá | Đánh giá công khai hiển thị cho mọi người | HTTP 200 khi không đăng nhập | 200 | ✅ Đạt |
| TC-RVW-12 | Đánh giá | Đánh giá sách không tồn tại | HTTP 404 hoặc 400 | 404 | ✅ Đạt |
| TC-WSH-01 | Yêu thích | Lấy danh sách yêu thích | HTTP 200 | 200 | ✅ Đạt |
| TC-WSH-02 | Yêu thích | Thêm sách vào yêu thích | HTTP 200 | 200 | ✅ Đạt |
| TC-WSH-03 | Yêu thích | Bỏ yêu thích (bấm lần hai) | HTTP 200 | 200 | ✅ Đạt |
| TC-WSH-04 | Yêu thích | Không đăng nhập không dùng được yêu thích | HTTP 401 | 401 | ✅ Đạt |
| TC-WSH-05 | Yêu thích | Yêu thích sách không tồn tại | HTTP 404 hoặc 400 | 404 | ✅ Đạt |
| TC-DASH-01 | Thống kê | Lấy dữ liệu thống kê | HTTP 200 | 200 | ✅ Đạt |
| TC-DASH-02 | Thống kê | Có số liệu tổng quan | Có summary | true | ✅ Đạt |
| TC-DASH-03 | Thống kê | Tổng số sách đúng theo seed (12) | totalBooks = 12 | 12 | ✅ Đạt |
| TC-DASH-04 | Thống kê | Tổng khách hàng khớp danh sách khách hàng | Khớp số liệu | true | ✅ Đạt |
| TC-DASH-05 | Thống kê | Có biểu đồ theo ngày (30 điểm) | daily = 30 điểm | 30 | ✅ Đạt |
| TC-DASH-06 | Thống kê | Có biểu đồ theo tháng (12 điểm) | monthly = 12 điểm | 12 | ✅ Đạt |
| TC-DASH-07 | Thống kê | Có biểu đồ theo năm (5 điểm) | yearly = 5 điểm | 5 | ✅ Đạt |
| TC-DASH-08 | Thống kê | Doanh thu tháng khớp tổng đơn không huỷ | Khớp số liệu | true | ✅ Đạt |
| TC-DASH-09 | Thống kê | Doanh thu theo danh mục có dữ liệu | Có rows | true | ✅ Đạt |
| TC-DASH-10 | Thống kê | Tổng doanh thu danh mục = tổng từng dòng | Khớp tổng | true | ✅ Đạt |
| TC-DASH-11 | Thống kê | Cảnh báo tồn kho thấp dùng ngưỡng 100 | threshold = 100 | 100 | ✅ Đạt |
| TC-DASH-12 | Thống kê | KHÁCH HÀNG không xem được thống kê | HTTP 403 | 403 | ✅ Đạt |
| TC-SEC-01 | Phân quyền | Không đăng nhập bị chặn ở GET /users | HTTP 401 | 401 | ✅ Đạt |
| TC-SEC-02 | Phân quyền | Không đăng nhập bị chặn ở GET /customers | HTTP 401 | 401 | ✅ Đạt |
| TC-SEC-03 | Phân quyền | Không đăng nhập bị chặn ở GET /admin/statistics | HTTP 401 | 401 | ✅ Đạt |
| TC-SEC-04 | Phân quyền | Không đăng nhập bị chặn ở GET /inventory | HTTP 401 | 401 | ✅ Đạt |
| TC-SEC-05 | Phân quyền | Không đăng nhập bị chặn ở GET /orders | HTTP 401 | 401 | ✅ Đạt |
| TC-SEC-06 | Phân quyền | KHÁCH HÀNG không vào được API quản trị | HTTP 403 | 403 | ✅ Đạt |
| TC-SEC-07 | Phân quyền | KHÁCH HÀNG không xem được kho | HTTP 403 | 403 | ✅ Đạt |
| TC-SEC-08 | Phân quyền | KHÁCH HÀNG không quản lý được tài khoản | HTTP 403 | 403 | ✅ Đạt |
| TC-SEC-09 | Phân quyền | NHÂN VIÊN xem được kho | HTTP 200 | 200 | ✅ Đạt |
| TC-SEC-10 | Phân quyền | NHÂN VIÊN xem được thống kê | HTTP 200 | 200 | ✅ Đạt |
| TC-SEC-11 | Phân quyền | NHÂN VIÊN không quản lý được tài khoản | HTTP 403 | 403 | ✅ Đạt |
| TC-SEC-12 | Phân quyền | Token sai định dạng bị từ chối | HTTP 401 hoặc 403 | 403 | ✅ Đạt |
| TC-SEC-13 | Phân quyền | Token rỗng bị từ chối | HTTP 401 | 401 | ✅ Đạt |
| TC-SEC-14 | Phân quyền | Header Authorization sai định dạng | HTTP 401 hoặc 403 | 403 | ✅ Đạt |
| TC-VAL-01 | Bảo mật | Thử SQL Injection ở tham số tìm kiếm | Không sập, HTTP 200 | 200 | ✅ Đạt |
| TC-VAL-02 | Bảo mật | SQL Injection không trả về toàn bộ dữ liệu bất thường | HTTP 200 và không lộ lỗi SQL | true | ✅ Đạt |
| TC-VAL-03 | Bảo mật | SQL Injection ở đăng nhập không vượt qua được | HTTP 401 hoặc 400 | 401 | ✅ Đạt |
| TC-VAL-04 | Bảo mật | Mật khẩu không bị trả về trong phản hồi | Không chứa password | true | ✅ Đạt |
| TC-VAL-05 | Bảo mật | ID không phải số bị xử lý an toàn | Không sập (không phải 500) | 404 | ✅ Đạt |
| TC-VAL-06 | Bảo mật | Đặt hàng với ID sách dạng chữ | HTTP 400 hoặc 404 | 400 | ✅ Đạt |
| TC-VAL-07 | Bảo mật | Dữ liệu số âm ở giá sách bị từ chối | HTTP 400 | 400 | ✅ Đạt |
| TC-VAL-08 | Bảo mật | Email sai định dạng khi đăng ký | HTTP 400 | 400 | ✅ Đạt |
| TC-VAL-09 | Bảo mật | Mật khẩu quá ngắn khi đăng ký | HTTP 400 | 400 | ✅ Đạt |
| TC-VAL-10 | Bảo mật | Chuỗi rất dài không làm sập hệ thống | Không phải lỗi 500 | 401 | ✅ Đạt |
| TC-VAL-11 | Bảo mật | Nội dung tiếng Việt được lưu đúng (không lỗi font) | Lưu đúng dấu tiếng Việt | true | ✅ Đạt |
| TC-VAL-12 | Bảo mật | Xoá danh mục vừa tạo để dọn dẹp | HTTP 200 | 200 | ✅ Đạt |

---

## Ghi chú về môi trường kiểm thử

- Bộ kiểm thử chạy trên **database riêng** `kimdong_bookstore_test`, khôi phục từ `schema.sql` + `seed.sql` trước mỗi lượt chạy.
- Sau khi chạy, tồn kho được **khôi phục về số liệu gốc** để không ảnh hưởng lần chạy sau.
- Dữ liệu gốc tham chiếu: 12 sách, 3 tài khoản, 2 đơn hàng, 3 đánh giá, 2 khuyến mãi.
