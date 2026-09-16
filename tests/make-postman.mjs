#!/usr/bin/env node
/**
 * Sinh bộ sưu tập Postman cho API website bán sách NXB Kim Đồng.
 *
 *   node tests/make-postman.mjs
 *   -> tests/KIMDONG_API.postman_collection.json
 *
 * Bộ sưu tập dùng để kiểm thử thủ công / khám phá API trên Postman, chụp ảnh
 * minh hoạ cho báo cáo, hoặc chạy tự động bằng Newman:
 *
 *   npx newman run tests/KIMDONG_API.postman_collection.json
 *
 * Bộ kiểm thử tự động đầy đủ 253 test case nằm ở tests/api-tests.mjs.
 *
 * THIẾT KẾ: toàn bộ test case khai báo dưới dạng BẢNG DỮ LIỆU (mảng), không
 * viết tay từng đối tượng request. Nhờ vậy file ngắn gọn và không thể sai ngoặc.
 *
 * Cấu trúc một dòng trong bảng:
 *   [ mã, mô tả ngắn, method, đường dẫn, quyền, body, mong đợi, kiểm tra thêm, ghi chú ]
 *   - quyền      : 'A' = ADMIN (mặc định), 'E' = nhân viên, 'C' = khách hàng, '-' = không cần đăng nhập
 *   - body       : object hoặc null
 *   - mong đợi   : số (mã trạng thái) | mảng số (chấp nhận nhiều mã) | null (không kiểm tra mã)
 *   - kiểm tra thêm : mảng các khối kiểm tra do hàm chk() tạo ra (bỏ qua nếu không cần)
 *   - ghi chú    : chú thích hiển thị trong Postman (bỏ qua nếu không cần)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'KIMDONG_API.postman_collection.json');

// ============================================================ Hàm hỗ trợ =====

/** Tạo một khối pm.test gồm nhiều dòng lệnh. */
const chk = (label, ...body) => [
  `pm.test(${JSON.stringify(label)}, function () {`,
  ...body.map((l) => '    ' + l),
  '});'
];

/** Kiểm tra mã trạng thái (dùng cho mảng "kiểm tra thêm" khi cần kiểm tra kèm). */
const st = (code, label) => chk(label || `Mã trạng thái ${code}`, `pm.response.to.have.status(${code});`);

/** Kiểm tra không trả về lỗi hệ thống 500. */
const no500 = () => chk('Không trả về lỗi hệ thống 500', 'pm.response.to.not.have.status(500);');

/** Kiểm tra phản hồi có một trường. */
const has = (p, label) =>
  chk(label || `Có trường ${p}`, `pm.expect(pm.response.json()).to.have.nested.property("${p}");`);

/** Kiểm tra một mảng có đúng n phần tử. */
const len = (p, n, label) =>
  chk(label || `${p} có đúng ${n} phần tử`, `pm.expect(pm.response.json()${p}).to.have.lengthOf(${n});`);

/** Kiểm tra giá trị của một trường trong đối tượng `order`. */
const orderIs = (field, value, label) =>
  chk(label || `order.${field} = ${JSON.stringify(value)}`,
    `pm.expect(pm.response.json().order.${field}).to.eql(${JSON.stringify(value)});`);

/**
 * Kiểm tra một trường số của `order`.
 * MySQL trả về cột DECIMAL dưới dạng chuỗi ("20000.00") nên phải ép kiểu số trước khi so sánh.
 */
const orderNum = (field, value, label) =>
  chk(label || `order.${field} = ${value}`,
    `pm.expect(Number(pm.response.json().order.${field})).to.eql(${value});`);

/** Lưu một giá trị từ phản hồi vào biến của bộ sưu tập. */
const save = (p, v) => [
  'const _j = pm.response.json();',
  `const _v = ${JSON.stringify(p)}.split(".").reduce((o, k) => (o || {})[k], _j);`,
  `if (_v !== undefined && _v !== null) pm.collectionVariables.set(${JSON.stringify(v)}, _v);`
];

// ======================================================= Dữ liệu dùng lại =====
const ORD = (items, pay) => ({
  customer_name: 'Nguyễn Văn An',
  customer_email: 'khachhang@gmail.com',
  customer_phone: '0987654321',
  shipping_address: '123 Nguyễn Trãi',
  shipping_province: 'TP. Hồ Chí Minh',
  shipping_district: 'Quận 1',
  shipping_ward: 'Bến Thành',
  payment_method: pay || 'COD',
  items
});

const ME = {
  full_name: 'Nguyễn Văn An', email: 'khachhang@gmail.com',
  phone: '0987654321', address: '123 Nguyễn Trãi',
  province: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Bến Thành'
};

const BK = {
  title: 'Sách Kiểm Thử Postman', category_id: 6, author_id: 1, publisher_id: 1,
  price: 50000, sale_price: 45000, stock: 10, import_price: 30000,
  publication_year: 2024, num_pages: 100, cover_type: 'Bìa mềm',
  dimensions: '13 x 20 cm', weight: 200, description: 'Sách dùng cho kiểm thử.'
};

const PRM = (over) => Object.assign({
  code: 'KMKT2026', title: 'Mã Kiểm Thử', discount_type: 'PERCENTAGE',
  discount_value: 10, min_order_value: 100000, max_discount: 30000,
  start_date: '2026-01-01', end_date: '2026-12-31', usage_limit: 100, is_active: 1
}, over || {});

const FIXED_ORDER = ORD([{ book_id: 3, quantity: 5 }, { book_id: 7, quantity: 3 }]);
const BAD_ORDER = (items) => Object.assign(ORD(items), {});

// ================================================================== BẢNG ======
// Mỗi phần tử: { name: tên folder, rows: [ ...dòng test case... ] }
const GROUPS = [

  // ------------------------------------------------ 00. Xác thực & token ----
  {
    name: '00. Xác thực & Lấy token',
    note: 'Chạy folder này TRƯỚC để lấy token, hoặc để Pre-request Script của bộ sưu tập tự đăng nhập.',
    rows: [
      ['TC-AUTH-01', 'Đăng nhập ADMIN', 'POST', '/auth/login', '-',
        { email: 'admin@kimdong.vn', password: 'admin123' }, 200,
        [has('token', 'Trả về JWT token'), chk('Lưu token ADMIN vào biến adminToken', ...save('token', 'adminToken'))],
        'Token được lưu vào biến {{adminToken}} để dùng cho các request sau.'],

      ['TC-AUTH-02', 'Đăng nhập NHÂN VIÊN', 'POST', '/auth/login', '-',
        { email: 'nhanvien@kimdong.vn', password: 'admin123' }, 200,
        [chk('Lưu token NHÂN VIÊN vào biến empToken', ...save('token', 'empToken'))]],

      ['TC-AUTH-03', 'Đăng nhập KHÁCH HÀNG', 'POST', '/auth/login', '-',
        { email: 'khachhang@gmail.com', password: 'user123' }, 200,
        [chk('Lưu token KHÁCH HÀNG vào biến cusToken', ...save('token', 'cusToken'))]],

      ['TC-AUTH-04', 'Đăng nhập SAI mật khẩu', 'POST', '/auth/login', '-',
        { email: 'admin@kimdong.vn', password: 'sai_mat_khau' }, 401],

      ['TC-AUTH-05', 'Email KHÔNG tồn tại', 'POST', '/auth/login', '-',
        { email: 'khongton@kimdong.vn', password: 'admin123' }, 401],

      ['TC-AUTH-06', 'Đăng nhập THIẾU mật khẩu', 'POST', '/auth/login', '-',
        { email: 'admin@kimdong.vn' }, 400],

      ['TC-AUTH-07', 'Đăng nhập THIẾU email', 'POST', '/auth/login', '-',
        { password: 'admin123' }, 400],

      ['TC-AUTH-08', 'Lấy hồ sơ cá nhân', 'GET', '/auth/me', 'A', null, 200,
        [has('user.email', 'Trả về email người dùng')]],

      ['TC-AUTH-09', 'Lấy hồ sơ KHÔNG có token', 'GET', '/auth/me', '-', null, 401],

      ['TC-AUTH-10', 'Token GIẢ MẠO', 'GET', '/auth/me', '-', null, [401, 403], null,
        'Gửi header Authorization chứa token không hợp lệ.'],

      ['TC-AUTH-11', 'Cập nhật hồ sơ cá nhân', 'PUT', '/auth/me', 'C', ME, 200],

      ['TC-AUTH-17', 'Cập nhật hồ sơ CHỈ 1 TRƯỜNG', 'PUT', '/auth/me', 'C',
        { full_name: 'Nguyễn Văn An' }, 200, [no500()],
        'Lỗi BUG-001 đã sửa: gửi thiếu trường từng gây lỗi 500 vì mysql2 không nhận giá trị undefined. Nay dùng COALESCE nên trả 200 và giữ nguyên các trường không gửi.'],

      ['TC-AUTH-12', 'Đổi mật khẩu với mật khẩu cũ SAI', 'PUT', '/auth/change-password', 'C',
        { current_password: 'sai_hoan_toan', new_password: 'matkhau_moi_123' }, 400, null,
        'Lưu ý: tên trường là current_password / new_password (không phải old_password).'],

      ['TC-AUTH-13', 'Đăng ký TRÙNG email', 'POST', '/auth/register', '-',
        { full_name: 'Trùng Email', email: 'admin@kimdong.vn', password: 'test123456' }, 400],

      ['TC-VAL-08', 'Đăng ký EMAIL SAI ĐỊNH DẠNG', 'POST', '/auth/register', '-',
        { full_name: 'Email Sai', email: 'khong-phai-email', password: 'test123456' }, 400, null,
        'Lỗi BUG-002 đã sửa: trước đây API chấp nhận email không hợp lệ.'],

      ['TC-VAL-09', 'Đăng ký MẬT KHẨU QUÁ NGẮN', 'POST', '/auth/register', '-',
        { full_name: 'MK Ngắn', email: 'ngan@test.vn', password: '12' }, 400, null,
        'Lỗi BUG-002 đã sửa: trước đây API chấp nhận mật khẩu 2 ký tự.']
    ]
  },

  // ------------------------------------------------------------ 01. Sách --
  {
    name: '01. Quản lý sách (Books)',
    rows: [
      ['TC-BOOK-01', 'Danh sách sách', 'GET', '/books', '-', null, 200, [has('books')]],
      ['TC-BOOK-02', 'Đủ 12 sách theo seed', 'GET', '/books?limit=100', '-', null, 200,
        [len('.books', 12, 'Có đúng 12 sách theo dữ liệu mẫu')]],
      ['TC-BOOK-03', 'Chi tiết sách theo ID', 'GET', '/books/1', '-', null, 200, [has('book.title')]],
      ['TC-BOOK-04', 'Chi tiết sách theo SLUG', 'GET', '/books/doraemon-tap-1', '-', null, 200],
      ['TC-BOOK-05', 'Sách KHÔNG tồn tại', 'GET', '/books/999999', '-', null, 404],
      ['TC-BOOK-06', 'Lọc sách theo danh mục', 'GET', '/books?category_id=6', '-', null, 200,
        [chk('Chỉ trả về sách thuộc danh mục 6',
          'const books = pm.response.json().books || [];',
          'pm.expect(books.length).to.be.above(0);',
          'books.forEach(b => pm.expect(Number(b.category_id)).to.eql(6));')]],
      ['TC-BOOK-07', 'Tìm kiếm sách theo từ khoá', 'GET', '/books?q=Doraemon', '-', null, 200,
        [chk('Có kết quả tìm kiếm', 'pm.expect((pm.response.json().books || []).length).to.be.above(0);')]],
      ['TC-BOOK-08', 'Lọc sách theo khoảng giá', 'GET', '/books?min_price=20000&max_price=30000', '-', null, 200],
      ['TC-BOOK-09', 'Sách theo nhóm trang chủ', 'GET', '/books/sections/home', '-', null, 200],

      ['TC-BOOK-10', 'Tạo sách mới (ADMIN)', 'POST', '/books', 'A', BK, 201,
        [chk('Lưu id sách vừa tạo', ...save('bookId', 'newBookId'))],
        'Lưu ý: API vẫn bắt buộc trường publisher_id dù giao diện quản trị đã ẩn trường này đi.'],

      ['TC-BOOK-11', 'Tạo sách THIẾU tiêu đề', 'POST', '/books', 'A', { price: 50000 }, 400],
      ['TC-BOOK-12', 'KHÁCH HÀNG tạo sách', 'POST', '/books', 'C', { title: 'X', price: 1000 }, 403],

      ['TC-BOOK-13', 'NHÂN VIÊN được tạo sách', 'POST', '/books', 'E',
        { title: 'Sách Nhân Viên Tạo', category_id: 6, author_id: 1, publisher_id: 1, price: 30000, stock: 5 },
        201, [chk('Lưu id sách nhân viên tạo', ...save('bookId', 'newBookId2'))]],

      ['TC-BOOK-13b', 'Dọn dẹp sách nhân viên vừa tạo', 'DELETE', '/books/{{newBookId2}}', 'A', null, 200, null,
        'Xoá ngay để không làm sai lệch số liệu thống kê ở các bước sau.'],

      ['TC-BOOK-14', 'Cập nhật sách (một phần)', 'PUT', '/books/{{newBookId}}', 'A',
        { title: 'Sách Kiểm Thử Postman (Đã Sửa)', price: 55000 }, 200, null,
        'Trường không gửi sẽ giữ nguyên giá trị cũ.'],

      ['TC-BOOK-15', 'Cập nhật sách KHÔNG tồn tại', 'PUT', '/books/999999', 'A', { title: 'Không tồn tại' }, 404],
      ['TC-BOOK-16', 'Trạng thái sách KHÔNG hợp lệ', 'PUT', '/books/{{newBookId}}', 'A', { status: 'SAI_TRANG_THAI' }, 400],
      ['TC-BOOK-17', 'Trạng thái sách hợp lệ (INACTIVE)', 'PUT', '/books/{{newBookId}}', 'A', { status: 'INACTIVE' }, 200],
      ['TC-BOOK-18', 'Xoá sách (xoá mềm)', 'DELETE', '/books/{{newBookId}}', 'A', null, 200],
      ['TC-BOOK-19', 'Sách đã xoá không còn trong danh sách', 'GET', '/books?limit=100', '-', null, 200,
        [chk('Sách đã xoá không xuất hiện nữa',
          'const id = Number(pm.collectionVariables.get("newBookId"));',
          'const books = pm.response.json().books || [];',
          'pm.expect(books.some(b => Number(b.id) === id)).to.be.false;')]],
      ['TC-BOOK-20', 'KHÁCH HÀNG xoá sách', 'DELETE', '/books/2', 'C', null, 403]
    ]
  },

  // -------------------------------------------------------- 02. Danh mục --
  {
    name: '02. Danh mục (Categories)',
    rows: [
      ['TC-CAT-01', 'Danh sách danh mục', 'GET', '/categories', '-', null, 200, [has('categories')],
        'Trả về `categories` (dạng cây) và `raw` (danh sách phẳng).'],
      ['TC-CAT-02', 'Đủ 13 danh mục theo seed', 'GET', '/categories', '-', null, 200,
        [len('.raw', 13, 'Có đúng 13 danh mục (kể cả danh mục con)')],
        'Lưu ý: `categories` chỉ gồm danh mục cha, phải dùng `raw` mới đủ 13.'],
      ['TC-CAT-03', 'Tạo danh mục mới', 'POST', '/categories', 'A',
        { name: 'Danh Mục Kiểm Thử Postman', description: 'Dùng cho kiểm thử' }, 201,
        [chk('Lưu id danh mục vừa tạo', ...save('categoryId', 'newCategoryId'))],
        'Slug được sinh tự động từ tên, có xử lý dấu tiếng Việt.'],
      ['TC-CAT-04', 'Tạo danh mục THIẾU tên', 'POST', '/categories', 'A', { description: 'Thiếu tên' }, 400],
      ['TC-CAT-05', 'Cập nhật danh mục', 'PUT', '/categories/{{newCategoryId}}', 'A',
        { name: 'Danh Mục Kiểm Thử (Đã Sửa)' }, 200],
      ['TC-CAT-06', 'Cập nhật danh mục KHÔNG tồn tại', 'PUT', '/categories/999999', 'A', { name: 'X' }, 404],
      ['TC-CAT-07', 'KHÁCH HÀNG tạo danh mục', 'POST', '/categories', 'C', { name: 'X' }, 403],
      ['TC-CAT-08', 'Chặn xoá danh mục còn sách', 'DELETE', '/categories/6', 'A', null, 400, null,
        'Danh mục Doraemon đang có sách nên không xoá được.'],
      ['TC-CAT-09', 'Xoá danh mục rỗng', 'DELETE', '/categories/{{newCategoryId}}', 'A', null, 200],
      ['TC-CAT-10', 'Xoá danh mục KHÔNG tồn tại', 'DELETE', '/categories/999999', 'A', null, 404]
    ]
  },

  // ------------------------------------------------- 03. Tác giả & NXB ----
  {
    name: '03. Tác giả & Nhà xuất bản',
    rows: [
      ['TC-AUT-01', 'Danh sách tác giả', 'GET', '/authors', '-', null, 200,
        [len('.authors', 7, 'Có đúng 7 tác giả theo seed')]],
      ['TC-AUT-02', 'Danh sách nhà xuất bản', 'GET', '/publishers', '-', null, 200,
        [len('.publishers', 3, 'Có đúng 3 nhà xuất bản theo seed')]],
      ['TC-AUT-03', 'Tạo tác giả mới', 'POST', '/authors', 'A',
        { name: 'Tác Giả Kiểm Thử', bio: 'Dùng cho kiểm thử' }, 201,
        [chk('Lưu id tác giả vừa tạo', ...save('authorId', 'newAuthorId'))]],
      ['TC-AUT-04', 'Tạo tác giả THIẾU tên', 'POST', '/authors', 'A', { bio: 'Thiếu tên' }, 400],
      ['TC-AUT-05', 'Cập nhật tác giả', 'PUT', '/authors/{{newAuthorId}}', 'A',
        { name: 'Tác Giả Kiểm Thử (Đã Sửa)' }, 200],
      ['TC-AUT-06', 'Cập nhật tác giả KHÔNG tồn tại', 'PUT', '/authors/999999', 'A', { name: 'X' }, 404],
      ['TC-AUT-07', 'KHÁCH HÀNG tạo tác giả', 'POST', '/authors', 'C', { name: 'X' }, 403],
      ['TC-AUT-08', 'Xoá tác giả', 'DELETE', '/authors/{{newAuthorId}}', 'A', null, 200],
      ['TC-AUT-09', 'Xoá tác giả KHÔNG tồn tại', 'DELETE', '/authors/999999', 'A', null, 404],
      ['TC-AUT-10', 'Không đăng nhập không tạo được', 'POST', '/authors', '-', { name: 'X' }, 401]
    ]
  },

  // ----------------------------------------------------------- 04. Banner -
  {
    name: '04. Banner',
    rows: [
      ['TC-BAN-01', 'Banner đang hiển thị (công khai)', 'GET', '/banners', '-', null, 200, [has('banners')]],
      ['TC-BAN-02', 'Toàn bộ banner (quản trị)', 'GET', '/banners/all', 'A', null, 200,
        [len('.banners', 3, 'Có đúng 3 banner theo seed')]],
      ['TC-BAN-03', 'KHÁCH HÀNG xem toàn bộ banner', 'GET', '/banners/all', 'C', null, 403],
      ['TC-BAN-04', 'Tạo banner mới', 'POST', '/banners', 'A',
        {
          title: 'Banner Kiểm Thử', subtitle: 'Dùng cho kiểm thử',
          image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000',
          cta_link: '/books', display_order: 9, is_active: 1
        }, 201, [chk('Lưu id banner vừa tạo', ...save('bannerId', 'newBannerId'))],
        'Lưu ý: API bắt buộc trường cta_link (đường dẫn nút CTA), không phải link_url.'],
      ['TC-BAN-05', 'Tạo banner THIẾU tiêu đề', 'POST', '/banners', 'A', { subtitle: 'Thiếu tiêu đề' }, 400],
      ['TC-BAN-10', 'Tạo banner THIẾU cta_link', 'POST', '/banners', 'A', { title: 'Thiếu CTA' }, 400],
      ['TC-BAN-06', 'Cập nhật banner', 'PUT', '/banners/{{newBannerId}}', 'A',
        { title: 'Banner Kiểm Thử (Đã Sửa)', cta_link: '/books' }, 200],
      ['TC-BAN-07', 'Cập nhật banner KHÔNG tồn tại', 'PUT', '/banners/999999', 'A',
        { title: 'X', cta_link: '/books' }, 404],
      ['TC-BAN-09', 'KHÁCH HÀNG tạo banner', 'POST', '/banners', 'C', { title: 'X' }, 403],
      ['TC-BAN-08', 'Xoá banner', 'DELETE', '/banners/{{newBannerId}}', 'A', null, 200]
    ]
  },

  // ------------------------------------------------------ 05. Khuyến mãi -
  {
    name: '05. Khuyến mãi (Promotions)',
    rows: [
      ['TC-PRM-01', 'Mã đang hoạt động (công khai)', 'GET', '/promotions', '-', null, 200, [has('promotions')]],
      ['TC-PRM-02', 'Toàn bộ mã (quản trị)', 'GET', '/promotions/all', 'A', null, 200,
        [len('.promotions', 2, 'Có đúng 2 mã theo seed')]],
      ['TC-PRM-03', 'Kiểm tra mã HỢP LỆ', 'POST', '/promotions/validate', '-',
        { code: 'KIMDONG20', subtotal: 500000 }, 200,
        [has('discount_amount', 'Trả về số tiền được giảm'),
         chk('Số tiền giảm lớn hơn 0', 'pm.expect(pm.response.json().discount_amount).to.be.above(0);')],
        'Lưu ý: tham số là `subtotal` (không phải `order_total`). Mã hợp lệ trả về HTTP 200.'],
      ['TC-PRM-04', 'Mã khi đơn CHƯA ĐỦ giá trị tối thiểu', 'POST', '/promotions/validate', '-',
        { code: 'KIMDONG20', subtotal: 50000 }, 400, null,
        'Mã KIMDONG20 yêu cầu đơn từ 150.000đ. Mã không dùng được trả về HTTP 400 kèm lý do.'],
      ['TC-PRM-05', 'Mã KHÔNG TỒN TẠI', 'POST', '/promotions/validate', '-',
        { code: 'MA_KHONG_TON_TAI', subtotal: 500000 }, 400],
      ['TC-PRM-06', 'Kiểm tra mã THIẾU tham số', 'POST', '/promotions/validate', '-', {}, 400],
      ['TC-PRM-16', 'Mã giảm theo SỐ TIỀN CỐ ĐỊNH', 'POST', '/promotions/validate', '-',
        { code: 'FREESHIP30', subtotal: 300000 }, 200,
        [chk('Giảm đúng 20.000đ', 'pm.expect(pm.response.json().discount_amount).to.eql(20000);')]],
      ['TC-PRM-07', 'Tạo mã giảm giá mới', 'POST', '/promotions', 'A', PRM(), 201,
        [chk('Lưu id mã vừa tạo', ...save('promotionId', 'newPromotionId'))]],
      ['TC-PRM-08', 'Tạo mã TRÙNG code', 'POST', '/promotions', 'A',
        { code: 'KIMDONG20', title: 'Trùng mã', discount_type: 'PERCENTAGE', discount_value: 5 }, 400],
      ['TC-PRM-09', 'Tạo mã THIẾU code', 'POST', '/promotions', 'A', { title: 'Thiếu code' }, 400],
      ['TC-PRM-10', 'Cập nhật mã giảm giá', 'PUT', '/promotions/{{newPromotionId}}', 'A',
        PRM({ title: 'Mã Kiểm Thử (Đã Sửa)', discount_value: 15, max_discount: 40000, usage_limit: 50 }), 200,
        null, 'Lưu ý: API yêu cầu gửi đầy đủ các trường, không hỗ trợ cập nhật một phần.'],
      ['TC-PRM-11', 'Cập nhật mã KHÔNG tồn tại', 'PUT', '/promotions/999999', 'A',
        { code: 'X', title: 'X' }, 404],
      ['TC-PRM-12', 'Bật/tắt mã', 'PUT', '/promotions/{{newPromotionId}}/toggle', 'A', null, 200,
        [has('is_active', 'Trả về trạng thái mới')]],
      ['TC-PRM-13', 'Mã bị TẠM DỪNG thì không dùng được', 'POST', '/promotions/validate', '-',
        { code: 'KMKT2026', subtotal: 500000 }, 400],
      ['TC-PRM-15', 'KHÁCH HÀNG tạo mã', 'POST', '/promotions', 'C', { code: 'X', title: 'X' }, 403],
      ['TC-PRM-14', 'Xoá mã giảm giá', 'DELETE', '/promotions/{{newPromotionId}}', 'A', null, 200]
    ]
  },

  // ---------------------------------- 06. Tài khoản nhân viên & Khách hàng
  {
    name: '06. Tài khoản nhân viên & Khách hàng',
    rows: [
      ['TC-EMP-01', 'Danh sách tài khoản (ADMIN)', 'GET', '/users', 'A', null, 200, [has('users')]],
      ['TC-EMP-02', 'NHÂN VIÊN xem danh sách tài khoản', 'GET', '/users', 'E', null, 403],
      ['TC-EMP-03', 'KHÁCH HÀNG xem danh sách tài khoản', 'GET', '/users', 'C', null, 403],
      ['TC-EMP-04', 'Tạo tài khoản nhân viên', 'POST', '/users', 'A',
        {
          full_name: 'Nhân Viên Kiểm Thử', email: 'nv_kiemthu@kimdong.vn',
          password: 'nhanvien123', role_id: 2, phone: '0900000001'
        }, 201, [chk('Lưu id tài khoản vừa tạo', ...save('userId', 'newUserId'))]],
      ['TC-EMP-05', 'Tài khoản vừa tạo đăng nhập được', 'POST', '/auth/login', '-',
        { email: 'nv_kiemthu@kimdong.vn', password: 'nhanvien123' }, 200],
      ['TC-EMP-06', 'Tạo tài khoản TRÙNG email', 'POST', '/users', 'A',
        { full_name: 'Trùng', email: 'nv_kiemthu@kimdong.vn', password: 'abc123456', role_id: 2 }, 400],
      ['TC-EMP-07', 'Tạo tài khoản THIẾU mật khẩu', 'POST', '/users', 'A',
        { full_name: 'Thiếu MK', email: 'thieu_mk@kimdong.vn', role_id: 2 }, 400],
      ['TC-EMP-08', 'Cập nhật thông tin nhân viên', 'PUT', '/users/{{newUserId}}', 'A',
        { full_name: 'Nhân Viên Kiểm Thử (Đã Sửa)', email: 'nv_kiemthu@kimdong.vn', phone: '0900000002' }, 200],
      ['TC-EMP-09', 'Cập nhật tài khoản KHÔNG tồn tại', 'PUT', '/users/999999', 'A',
        { full_name: 'X', email: 'x@t.vn' }, 404],
      ['TC-EMP-10', 'Đổi vai trò tài khoản', 'PUT', '/users/{{newUserId}}/role', 'A', { role_id: 1 }, 200, null,
        'Lưu ý: chỉ chuyển đổi được giữa ADMIN (1) và EMPLOYEE (2).'],
      ['TC-EMP-13', 'Không thể HẠ QUYỀN chính mình', 'PUT', '/users/1/role', 'A', { role_id: 2 }, 400],
      ['TC-EMP-14', 'Không thể XOÁ chính mình', 'DELETE', '/users/1', 'A', null, 400],
      ['TC-EMP-12', 'NHÂN VIÊN tạo tài khoản', 'POST', '/users', 'E',
        { full_name: 'X', email: 'x@t.vn', password: 'abc123' }, 403],
      ['TC-EMP-11', 'Xoá tài khoản nhân viên', 'DELETE', '/users/{{newUserId}}', 'A', null, 200],

      ['TC-CUS-01', 'Danh sách khách hàng', 'GET', '/customers', 'A', null, 200, [has('customers')]],
      ['TC-CUS-02', 'Danh sách chỉ gồm vai trò khách hàng', 'GET', '/customers', 'A', null, 200,
        [chk('Tất cả đều có role_id = 3',
          'const list = pm.response.json().customers || [];',
          'pm.expect(list.length).to.be.above(0);',
          'list.forEach(c => pm.expect(Number(c.role_id)).to.eql(3));')]],
      ['TC-CUS-03', 'NHÂN VIÊN xem được danh sách khách hàng', 'GET', '/customers', 'E', null, 200],
      ['TC-CUS-04', 'KHÁCH HÀNG xem danh sách khách hàng', 'GET', '/customers', 'C', null, 403],
      ['TC-CUS-05', 'Chi tiết khách hàng', 'GET', '/customers/3', 'A', null, 200,
        [has('stats', 'Kèm thống kê mua hàng')]],
      ['TC-CUS-06', 'Chi tiết khách hàng KHÔNG tồn tại', 'GET', '/customers/999999', 'A', null, 404],
      ['TC-CUS-07', 'Cập nhật thông tin khách hàng', 'PUT', '/customers/3', 'A', ME, 200],
      ['TC-CUS-08', 'NHÂN VIÊN sửa khách hàng', 'PUT', '/customers/3', 'E', { full_name: 'X' }, 403],
      ['TC-CUS-09', 'Cập nhật khách hàng KHÔNG tồn tại', 'PUT', '/customers/999999', 'A',
        { full_name: 'X', email: 'x@t.vn' }, 404]
    ]
  },

  // -------------------------------------------------------- 07. Giỏ hàng -
  {
    name: '07. Giỏ hàng (Cart)',
    rows: [
      ['TC-CART-01', 'Xoá sạch giỏ hàng', 'DELETE', '/cart/clear', 'C', null, 200],
      ['TC-CART-02', 'Giỏ hàng rỗng', 'GET', '/cart', 'C', null, 200, [len('.items', 0, 'Giỏ trống')]],
      ['TC-CART-03', 'Thêm sách vào giỏ', 'POST', '/cart/items', 'C', { book_id: 1, quantity: 2 }, 200],
      ['TC-CART-04', 'Giỏ có đúng 1 sản phẩm', 'GET', '/cart', 'C', null, 200,
        [len('.items', 1, 'Có đúng 1 sản phẩm'),
         chk('Lưu id mục giỏ hàng', ...save('items.0.id', 'cartItemId'))]],
      ['TC-CART-05', 'Thêm cùng sách thì CỘNG DỒN số lượng', 'POST', '/cart/items', 'C',
        { book_id: 1, quantity: 3 }, 200],
      ['TC-CART-05b', 'Kiểm tra số lượng đã cộng dồn (2 + 3 = 5)', 'GET', '/cart', 'C', null, 200,
        [chk('Số lượng trong giỏ bằng 5',
          'pm.expect(Number(pm.response.json().items[0].quantity)).to.eql(5);')]],
      ['TC-CART-06', 'Thêm sách KHÔNG tồn tại', 'POST', '/cart/items', 'C',
        { book_id: 999999, quantity: 1 }, 404],
      ['TC-CART-07', 'Thêm số lượng 0', 'POST', '/cart/items', 'C', { book_id: 2, quantity: 0 }, 400, null,
        'Lỗi BUG-003 đã sửa: trước đây `parseInt(quantity) || 1` biến số 0 thành 1 và vẫn thêm vào giỏ.'],
      ['TC-CART-08', 'Thêm số lượng ÂM', 'POST', '/cart/items', 'C', { book_id: 2, quantity: -5 }, 400, null,
        'Lỗi BUG-003 đã sửa: trước đây số âm được ghi thẳng vào giỏ hàng.'],
      ['TC-CART-09', 'Thêm VƯỢT tồn kho', 'POST', '/cart/items', 'C', { book_id: 3, quantity: 99999 }, 400],
      ['TC-CART-10', 'Cập nhật số lượng trong giỏ', 'PUT', '/cart/items/{{cartItemId}}', 'C',
        { quantity: 4 }, 200, null, 'Biến {{cartItemId}} được lấy ở bước TC-CART-04.'],
      ['TC-CART-11', 'Số lượng đã cập nhật thành 4', 'GET', '/cart', 'C', null, 200,
        [chk('Số lượng trong giỏ bằng 4',
          'pm.expect(Number(pm.response.json().items[0].quantity)).to.eql(4);')]],
      ['TC-CART-12', 'Xoá một sản phẩm khỏi giỏ', 'DELETE', '/cart/items/{{cartItemId}}', 'C', null, 200],
      ['TC-CART-13', 'Giỏ trống sau khi xoá', 'GET', '/cart', 'C', null, 200, [len('.items', 0, 'Giỏ đã trống')]],

      // Phải thêm sách trở lại giỏ trước khi kiểm thử xoá nhiều mục.
      ['TC-CART-14a', 'Thêm sách 2 vào giỏ', 'POST', '/cart/items', 'C', { book_id: 2, quantity: 1 }, 200],
      ['TC-CART-14b', 'Thêm sách 4 vào giỏ', 'POST', '/cart/items', 'C', { book_id: 4, quantity: 1 }, 200],
      ['TC-CART-14c', 'Lấy id các mục trong giỏ', 'GET', '/cart', 'C', null, 200,
        [len('.items', 2, 'Có đúng 2 sản phẩm'),
         chk('Lưu id hai mục giỏ hàng',
           'const items = pm.response.json().items || [];',
           'pm.collectionVariables.set("cartItemIdA", items[0].id);',
           'pm.collectionVariables.set("cartItemIdB", items[1].id);')]],
      ['TC-CART-14', 'Xoá nhiều sản phẩm cùng lúc', 'POST', '/cart/items/remove', 'C',
        { ids: ['{{cartItemIdA}}', '{{cartItemIdB}}'] }, 200, null,
        'Lưu ý: tham số là `ids` (mảng số), không phải `item_ids`.'],
      ['TC-CART-14d', 'Giỏ trống sau khi xoá nhiều', 'GET', '/cart', 'C', null, 200,
        [len('.items', 0, 'Đã xoá hết các mục đã chọn')]],
      ['TC-CART-16', 'Xoá với danh sách RỖNG', 'POST', '/cart/items/remove', 'C', { ids: [] }, 400],
      ['TC-CART-15', 'Giỏ tách riêng theo từng người dùng', 'GET', '/cart', 'E', null, 200,
        [len('.items', 0, 'Giỏ của nhân viên không lẫn với giỏ khách hàng')]]
    ]
  },

  // --------------------------------------------------------- 08. Đơn hàng -
  {
    name: '08. Đơn hàng (Orders) — QUAN TRỌNG NHẤT',
    note: 'Nhóm chức năng trọng tâm: đặt hàng, trừ kho, xác nhận, huỷ đơn và hoàn kho. Đây là nơi tập trung các quy tắc nghiệp vụ quan trọng nhất.',
    rows: [
      ['B1', 'Ghi nhận tồn kho sách 3 TRƯỚC khi đặt', 'GET', '/inventory/3', 'A', null, 200,
        [chk('Lưu tồn kho ban đầu của sách 3', ...save('book.stock', 'stock3Before'))]],

      ['TC-ORD-01', 'Đặt hàng (trừ kho ngay)', 'POST', '/orders', 'C', FIXED_ORDER, 201,
        [has('orderCode', 'Trả về mã đơn hàng'),
         chk('Lưu id đơn hàng', ...save('orderId', 'orderId'))],
        'NGHIỆP VỤ: tồn kho bị trừ NGAY khi đặt hàng (không phải khi xác nhận đơn).'],

      ['TC-ORD-02', 'Tồn kho sách 3 đã GIẢM 5 cuốn', 'GET', '/inventory/3', 'A', null, 200,
        [chk('Tồn kho giảm đúng 5 cuốn so với trước khi đặt',
          'const before = Number(pm.collectionVariables.get("stock3Before"));',
          'const after = Number(pm.response.json().book.stock);',
          'pm.expect(after).to.eql(before - 5);')]],

      ['TC-ORD-03', 'Đơn mới ở trạng thái CHỜ XÁC NHẬN', 'GET', '/orders/{{orderId}}', 'A', null, 200,
        [orderIs('order_status', 'PENDING', 'Trạng thái là PENDING')]],
      ['TC-ORD-04', 'Danh sách đơn hàng', 'GET', '/orders', 'A', null, 200, [has('orders')]],
      ['TC-ORD-05', 'Danh sách kèm tồn kho hiện tại', 'GET', '/orders', 'A', null, 200,
        [chk('Mỗi sản phẩm đều có current_stock',
          'const orders = pm.response.json().orders || [];',
          'orders.forEach(o => (o.items || []).forEach(i =>',
          '    pm.expect(i.current_stock).to.be.a("number")));')]],
      ['TC-ORD-06', 'KHÁCH HÀNG chỉ thấy đơn của CHÍNH MÌNH', 'GET', '/orders', 'C', null, 200,
        [chk('Mọi đơn đều thuộc về khách hàng đang đăng nhập (user 3)',
          'const orders = pm.response.json().orders || [];',
          'orders.forEach(o => pm.expect(Number(o.user_id)).to.eql(3));')],
        'API tự lọc theo user_id — đây là hành vi đúng, không phải lỗi phân quyền.'],
      ['TC-ORD-07', 'Không đăng nhập xem đơn', 'GET', '/orders', '-', null, 401],
      ['TC-ORD-08', 'Kiểm tra thông tin đơn trước xác nhận', 'GET', '/orders/{{orderId}}/verification', 'A', null, 200,
        [has('checks', 'Trả về kết quả kiểm tra')]],
      ['TC-ORD-09', 'Đơn hợp lệ thì cho phép xác nhận', 'GET', '/orders/{{orderId}}/verification', 'A', null, 200,
        [chk('can_confirm = true', 'pm.expect(pm.response.json().checks.can_confirm).to.be.true;')]],
      ['TC-ORD-10', 'Xác nhận đơn hàng', 'PUT', '/orders/{{orderId}}/confirm', 'A', null, 200],
      ['TC-ORD-11', 'Đơn chuyển sang ĐÃ XÁC NHẬN', 'GET', '/orders/{{orderId}}', 'A', null, 200,
        [orderIs('order_status', 'CONFIRMED', 'Trạng thái là CONFIRMED')]],
      ['TC-ORD-12', 'Xác nhận LẠI đơn đã xác nhận', 'PUT', '/orders/{{orderId}}/confirm', 'A', null, 200,
        [chk('Phản hồi cho biết đơn đã được xác nhận trước đó',
          'pm.expect(pm.response.json().already_confirmed).to.be.true;')],
        'Gọi xác nhận lần hai không được trừ kho thêm lần nữa.'],
      ['TC-ORD-13', 'Xác nhận đơn KHÔNG tồn tại', 'PUT', '/orders/999999/confirm', 'A', null, 404],
      ['TC-ORD-14', 'KHÁCH HÀNG xác nhận đơn', 'PUT', '/orders/{{orderId}}/confirm', 'C', null, 403],
      ['TC-ORD-51', 'KHÁCH HÀNG xem kiểm tra đơn', 'GET', '/orders/{{orderId}}/verification', 'C', null, 403],
      ['TC-ORD-15', 'Chuyển sang ĐANG ĐÓNG GÓI', 'PUT', '/orders/{{orderId}}/status', 'A',
        { order_status: 'PROCESSING' }, 200],
      ['TC-ORD-16', 'Chuyển sang ĐANG GIAO HÀNG', 'PUT', '/orders/{{orderId}}/status', 'A',
        { order_status: 'SHIPPING' }, 200],
      ['TC-ORD-17', 'Trạng thái KHÔNG hợp lệ', 'PUT', '/orders/{{orderId}}/status', 'A',
        { order_status: 'SAI_TRANG_THAI' }, 400],
      ['TC-ORD-30', 'Huỷ qua API đổi trạng thái cũ', 'PUT', '/orders/{{orderId}}/status', 'A',
        { order_status: 'CANCELLED' }, 400, null,
        'Phải dùng chức năng "Huỷ đơn hàng" để hệ thống hoàn lại tồn kho.'],
      ['TC-ORD-18', 'HUỶ ĐƠN kèm lý do', 'PUT', '/orders/{{orderId}}/cancel', 'A',
        { reason: 'Khách hàng yêu cầu hủy đơn' }, 200,
        [has('restored_items', 'Trả về danh sách sách được hoàn kho')]],
      ['TC-ORD-19', 'Đơn chuyển sang ĐÃ HUỶ', 'GET', '/orders/{{orderId}}', 'A', null, 200,
        [orderIs('order_status', 'CANCELLED', 'Trạng thái là CANCELLED')]],
      ['TC-ORD-20', 'Lý do huỷ được LƯU LẠI', 'GET', '/orders/{{orderId}}', 'A', null, 200,
        [orderIs('cancel_reason', 'Khách hàng yêu cầu hủy đơn', 'Lý do huỷ được ghi nhận đầy đủ')]],
      ['TC-ORD-21', 'Thời điểm huỷ được ghi nhận', 'GET', '/orders/{{orderId}}', 'A', null, 200,
        [chk('Có trường cancelled_at', 'pm.expect(pm.response.json().order.cancelled_at).to.not.be.null;')]],
      ['TC-ORD-22', 'Tồn kho sách 3 đã HOÀN LẠI', 'GET', '/inventory/3', 'A', null, 200,
        [chk('Tồn kho trở về ĐÚNG số ban đầu',
          'const before = Number(pm.collectionVariables.get("stock3Before"));',
          'pm.expect(Number(pm.response.json().book.stock)).to.eql(before);')]],
      ['TC-ORD-24', 'Huỷ đơn LẦN HAI', 'PUT', '/orders/{{orderId}}/cancel', 'A',
        { reason: 'Hủy lần thứ hai' }, 400],
      ['TC-ORD-25', 'Tồn kho KHÔNG bị cộng hai lần', 'GET', '/inventory/3', 'A', null, 200,
        [chk('Tồn kho vẫn đúng số ban đầu (không cộng dồn)',
          'const before = Number(pm.collectionVariables.get("stock3Before"));',
          'pm.expect(Number(pm.response.json().book.stock)).to.eql(before);')]],

      // Các kiểm thử giá trị biên của lý do huỷ cần một đơn MỚI,
      // vì đơn ở trên đã bị huỷ nên mọi lần huỷ lại đều bị từ chối.
      ['TC-ORD-31a', 'Tạo đơn mới để kiểm thử biên lý do huỷ', 'POST', '/orders', 'C',
        ORD([{ book_id: 5, quantity: 1 }]), 201,
        [chk('Lưu id đơn hàng', ...save('orderId', 'boundaryOrderId'))]],
      ['TC-ORD-31', 'Lý do huỷ RỖNG', 'PUT', '/orders/{{boundaryOrderId}}/cancel', 'A', { reason: '' }, 400],
      ['TC-ORD-32', 'Lý do huỷ toàn KHOẢNG TRẮNG', 'PUT', '/orders/{{boundaryOrderId}}/cancel', 'A',
        { reason: '     ' }, 400],
      ['TC-ORD-33', 'Lý do huỷ 4 ký tự — DƯỚI BIÊN', 'PUT', '/orders/{{boundaryOrderId}}/cancel', 'A',
        { reason: 'huyy' }, 400, null, 'Phân tích giá trị biên: lý do phải từ 5 đến 500 ký tự.'],
      ['TC-ORD-34', 'Lý do huỷ ĐÚNG 5 ký tự — TẠI BIÊN', 'PUT', '/orders/{{boundaryOrderId}}/cancel', 'A',
        { reason: 'huy ne' }, 200],

      ['TC-ORD-35a', 'Tạo đơn mới để kiểm thử biên trên', 'POST', '/orders', 'C',
        ORD([{ book_id: 5, quantity: 1 }]), 201,
        [chk('Lưu id đơn hàng', ...save('orderId', 'longReasonOrderId'))]],
      ['TC-ORD-35', 'Lý do huỷ 501 ký tự — VƯỢT BIÊN', 'PUT', '/orders/{{longReasonOrderId}}/cancel', 'A',
        { reason: 'x'.repeat(501) }, 400],
      ['TC-ORD-35b', 'Đơn vẫn huỷ được với lý do dài hợp lệ', 'PUT', '/orders/{{longReasonOrderId}}/cancel', 'A',
        { reason: 'x'.repeat(500) }, 200, null, 'Kiểm tra lại biên trên: đúng 500 ký tự thì hợp lệ.'],

      ['TC-ORD-37', 'Huỷ đơn KHÔNG tồn tại', 'PUT', '/orders/999999/cancel', 'A',
        { reason: 'Đơn không tồn tại' }, 404],
      ['TC-ORD-38', 'Đặt hàng KHÔNG có sản phẩm', 'POST', '/orders', 'C',
        ORD([]), 400],
      ['TC-ORD-39', 'Đặt hàng VƯỢT tồn kho', 'POST', '/orders', 'C',
        ORD([{ book_id: 3, quantity: 999999 }]), 400],
      ['TC-ORD-40', 'Đặt hàng THIẾU thông tin người nhận', 'POST', '/orders', 'C',
        { items: [{ book_id: 1, quantity: 1 }] }, 400],
      ['TC-ORD-41', 'Đặt hàng SỐ LƯỢNG 0', 'POST', '/orders', 'C',
        ORD([{ book_id: 6, quantity: 0 }]), 400, null,
        'Lỗi BUG-004 đã sửa: trước đây đơn với số lượng 0 vẫn được tạo thành công do điều kiện kiểm tra tồn kho không chặn số 0.'],

      ['TC-ORD-43', 'Đơn dưới 200.000đ phải chịu phí 20.000đ', 'POST', '/orders', 'C',
        ORD([{ book_id: 3, quantity: 1 }]), 201,
        [chk('Lưu id đơn hàng', ...save('orderId', 'shipOrderId'))],
        'Sách 3 giá 25.000đ -> dưới mốc miễn phí vận chuyển.'],
      ['TC-ORD-43b', 'Kiểm tra phí vận chuyển = 20.000đ', 'GET', '/orders/{{shipOrderId}}', 'A', null, 200,
        [orderNum('shipping_fee', 20000, 'Phí vận chuyển đúng 20.000đ')]],
      ['TC-ORD-44', 'Đơn từ 200.000đ được MIỄN phí vận chuyển', 'POST', '/orders', 'C',
        ORD([{ book_id: 6, quantity: 8 }]), 201,
        [chk('Lưu id đơn hàng', ...save('orderId', 'freeShipOrderId'))],
        'Sách 6 giá 28.000đ × 8 = 224.000đ -> vượt mốc 200.000đ nên miễn phí.'],
      ['TC-ORD-44b', 'Kiểm tra phí vận chuyển = 0đ', 'GET', '/orders/{{freeShipOrderId}}', 'A', null, 200,
        [orderNum('shipping_fee', 0, 'Được miễn phí vận chuyển')]],
      ['TC-ORD-45', 'Tổng tiền = tạm tính − giảm giá + phí ship', 'GET', '/orders/{{freeShipOrderId}}', 'A', null, 200,
        [chk('Công thức tính tổng tiền đúng',
          'const o = pm.response.json().order;',
          'const expected = Math.max(0, Number(o.subtotal) - Number(o.discount_amount) + Number(o.shipping_fee));',
          'pm.expect(Math.abs(Number(o.total_amount) - expected)).to.be.below(1);')]],
      ['TC-ORD-47', 'Huỷ đơn ĐÃ THANH TOÁN thì đánh dấu cần hoàn tiền', 'POST', '/orders', 'C',
        ORD([{ book_id: 7, quantity: 2 }], 'BANKING'), 201,
        [chk('Lưu id đơn hàng', ...save('orderId', 'refundOrderId'))]],
      ['TC-ORD-47b', 'Huỷ đơn chuyển khoản', 'PUT', '/orders/{{refundOrderId}}/cancel', 'A',
        { reason: 'Khách hàng yêu cầu hủy đơn' }, 200],
      ['TC-ORD-47c', 'Trạng thái thanh toán là REFUNDED', 'GET', '/orders/{{refundOrderId}}', 'A', null, 200,
        [orderIs('payment_status', 'REFUNDED', 'Đánh dấu cần hoàn tiền')]],
      ['TC-ORD-49', 'KHÁCH HÀNG tự huỷ đơn', 'PUT', '/orders/2/cancel', 'C',
        { reason: 'Khách tự huỷ đơn hàng' }, 403],
      ['TC-ORD-50', 'Không đăng nhập huỷ đơn', 'PUT', '/orders/2/cancel', '-',
        { reason: 'Không đăng nhập mà huỷ' }, 401]
    ]
  },

  // -------------------------------------------------------- 09. Quản lý kho
  {
    name: '09. Quản lý kho (Inventory)',
    rows: [
      ['TC-INV-01', 'Danh sách tồn kho', 'GET', '/inventory', 'A', null, 200, [has('books')]],
      ['TC-INV-02', 'Có thống kê tổng hợp', 'GET', '/inventory', 'A', null, 200, [has('summary')]],
      ['TC-INV-03', 'Ngưỡng cảnh báo tồn kho = 100', 'GET', '/inventory', 'A', null, 200,
        [chk('Ngưỡng cảnh báo đúng 100', 'pm.expect(Number(pm.response.json().threshold)).to.eql(100);')]],
      ['TC-INV-04', 'Sách tồn thấp được xếp lên đầu', 'GET', '/inventory', 'A', null, 200,
        [chk('Danh sách sắp xếp tăng dần theo tồn kho',
          'const stocks = (pm.response.json().books || []).map(b => Number(b.stock));',
          'pm.expect(stocks[0]).to.be.at.most(stocks[stocks.length - 1]);')]],
      ['TC-INV-05', 'Lọc kho theo trạng thái', 'GET', '/inventory?status=OUT_OF_STOCK', 'A', null, 200],
      ['TC-INV-06', 'Tồn kho theo danh mục', 'GET', '/inventory/by-category', 'A', null, 200],
      ['TC-INV-07', 'Chi tiết một sách trong kho', 'GET', '/inventory/3', 'A', null, 200, [has('book.stock')]],
      ['TC-INV-08', 'Sách KHÔNG tồn tại', 'GET', '/inventory/999999', 'A', null, 404],
      ['TC-INV-09', 'KHÁCH HÀNG xem kho', 'GET', '/inventory', 'C', null, 403],
      ['TC-INV-10a', 'Ghi nhận tồn kho sách 3 ngay trước khi nhập', 'GET', '/inventory/3', 'A', null, 200,
        [chk('Lưu tồn kho trước khi nhập', ...save('book.stock', 'stock3PreImport'))]],
      ['TC-INV-10', 'Nhập kho thêm số lượng', 'POST', '/inventory/3/import', 'A',
        { quantity: 20, import_price: 15000 }, 200],
      ['TC-INV-11', 'Tồn kho tăng đúng sau khi nhập', 'GET', '/inventory/3', 'A', null, 200,
        [chk('Tồn kho tăng đúng 20 cuốn',
          'const before = Number(pm.collectionVariables.get("stock3PreImport"));',
          'pm.expect(Number(pm.response.json().book.stock)).to.eql(before + 20);')]],
      ['TC-INV-12', 'Nhập kho số lượng ÂM', 'POST', '/inventory/3/import', 'A', { quantity: -5 }, 400],
      ['TC-INV-13', 'Nhập kho số lượng 0', 'POST', '/inventory/3/import', 'A', { quantity: 0 }, 400],
      ['TC-INV-14', 'Nhập kho vượt giới hạn', 'POST', '/inventory/3/import', 'A', { quantity: 999999 }, 400],
      ['TC-INV-15', 'KIỂM KÊ điều chỉnh tồn kho', 'PUT', '/inventory/3/stock', 'A',
        { stock: 75, reason: 'Kiểm kê thực tế' }, 200, [has('difference', 'Trả về chênh lệch kiểm kê')]],
      ['TC-INV-16', 'Chênh lệch kiểm kê được tính đúng', 'PUT', '/inventory/3/stock', 'A',
        { stock: 70, reason: 'Kiểm kê lại' }, 200,
        [chk('Chênh lệch bằng -5 so với lần kiểm kê trước',
          'pm.expect(Number(pm.response.json().difference)).to.eql(-5);')]],
      ['TC-INV-18', 'Kiểm kê KHÔNG đổi thì chênh lệch bằng 0', 'PUT', '/inventory/3/stock', 'A',
        { stock: 70, reason: 'Nhập lại số cũ' }, 200,
        [chk('Chênh lệch bằng 0', 'pm.expect(Number(pm.response.json().difference)).to.eql(0);')]],
      ['TC-INV-19', 'Kiểm kê số ÂM', 'PUT', '/inventory/3/stock', 'A', { stock: -10 }, 400],
      ['TC-INV-20', 'Kiểm kê số THẬP PHÂN', 'PUT', '/inventory/3/stock', 'A', { stock: 10.5 }, 400],
      ['TC-INV-21', 'Kiểm kê CHỮ CÁI', 'PUT', '/inventory/3/stock', 'A', { stock: 'abc' }, 400],
      ['TC-INV-22', 'Kiểm kê số QUÁ LỚN', 'PUT', '/inventory/3/stock', 'A', { stock: 99999999 }, 400],
      ['TC-INV-23', 'NHÂN VIÊN được điều chỉnh tồn kho', 'PUT', '/inventory/3/stock', 'E',
        { stock: 70, reason: 'Nhân viên kiểm kê' }, 200],
      ['TC-INV-25', 'KHÁCH HÀNG nhập kho', 'POST', '/inventory/3/import', 'C', { quantity: 5 }, 403],
      ['TC-INV-24', 'KHÁCH HÀNG điều chỉnh kho', 'PUT', '/inventory/3/stock', 'C', { stock: 10 }, 403]
    ]
  },

  // ------------------------------------------- 10. Đánh giá & Yêu thích --
  {
    name: '10. Đánh giá & Yêu thích',
    rows: [
      ['TC-RVW-01', 'Đánh giá của một cuốn sách (công khai)', 'GET', '/books/1/reviews', '-', null, 200,
        [has('reviews')]],
      ['TC-RVW-02', 'Sách 1 có đánh giá theo seed', 'GET', '/books/1/reviews', '-', null, 200,
        [chk('Có ít nhất 1 đánh giá', 'pm.expect(Number(pm.response.json().count)).to.be.above(0);')]],
      ['TC-RVW-03', 'Kiểm tra quyền đánh giá sách CHƯA MUA', 'GET', '/reviews/eligibility/12', 'C', null, 200,
        [has('can_review')]],
      ['TC-RVW-04', 'Đánh giá sách CHƯA MUA', 'POST', '/reviews', 'C',
        { book_id: 12, rating: 5, comment: 'Sách này tôi chưa từng mua' }, [400, 403], null,
        'NGHIỆP VỤ: chỉ được đánh giá khi ĐÃ MUA và đơn đã hoàn thành.'],
      ['TC-RVW-05', 'Danh sách sách đã mua có thể đánh giá', 'GET', '/reviews/my-books', 'C', null, 200,
        [has('books')]],
      ['TC-RVW-06', 'Đánh giá sách ĐÃ MUA và đơn hoàn thành', 'POST', '/reviews', 'C',
        { book_id: 4, rating: 4, comment: 'Sách kiểm thử đánh giá tự động' }, [200, 201, 400], null,
        'Sách 4 nằm trong đơn 1 (trạng thái DELIVERED) của khách hàng nên được phép đánh giá.'],
      ['TC-RVW-07', 'Số sao NGOÀI khoảng 1-5', 'POST', '/reviews', 'C',
        { book_id: 1, rating: 9, comment: 'Số sao không hợp lệ' }, 400],
      ['TC-RVW-08', 'Số sao bằng 0', 'POST', '/reviews', 'C',
        { book_id: 1, rating: 0, comment: 'Không có sao nào' }, 400],
      ['TC-RVW-09', 'Nội dung đánh giá QUÁ NGẮN', 'POST', '/reviews', 'C',
        { book_id: 1, rating: 5, comment: 'ok' }, 400],
      ['TC-RVW-10', 'Không đăng nhập đánh giá', 'POST', '/reviews', '-',
        { book_id: 1, rating: 5, comment: 'Không đăng nhập mà đánh giá' }, 401],
      ['TC-RVW-12', 'Đánh giá sách KHÔNG tồn tại', 'POST', '/reviews', 'C',
        { book_id: 999999, rating: 5, comment: 'Sách không tồn tại đâu' }, [400, 404]],
      ['TC-WSH-01', 'Danh sách yêu thích', 'GET', '/wishlist', 'C', null, 200, [has('wishlist')]],
      ['TC-WSH-02', 'Thêm sách vào yêu thích', 'POST', '/wishlist/toggle', 'C', { book_id: 2 }, 200],
      ['TC-WSH-03', 'Bỏ yêu thích (bấm lần hai)', 'POST', '/wishlist/toggle', 'C', { book_id: 2 }, 200],
      ['TC-WSH-05', 'Yêu thích sách KHÔNG tồn tại', 'POST', '/wishlist/toggle', 'C', { book_id: 999999 }, 404, null,
        'Lỗi BUG-005 đã sửa: trước đây vi phạm khoá ngoại và trả về lỗi 500.'],
      ['TC-WSH-04', 'Không đăng nhập dùng yêu thích', 'GET', '/wishlist', '-', null, 401]
    ]
  },

  // --------------------------------------------------------- 11. Thống kê
  {
    name: '11. Thống kê / Dashboard',
    rows: [
      ['TC-DASH-01', 'Lấy dữ liệu thống kê', 'GET', '/admin/statistics', 'A', null, 200, [has('summary')]],
      ['TC-DASH-05', 'Biểu đồ theo NGÀY (30 điểm)', 'GET', '/admin/statistics', 'A', null, 200,
        [len('.ordersChart.daily', 30, 'Biểu đồ ngày có đúng 30 điểm dữ liệu')]],
      ['TC-DASH-06', 'Biểu đồ theo THÁNG (12 điểm)', 'GET', '/admin/statistics', 'A', null, 200,
        [len('.ordersChart.monthly', 12, 'Biểu đồ tháng có đúng 12 điểm dữ liệu')]],
      ['TC-DASH-07', 'Biểu đồ theo NĂM (5 điểm)', 'GET', '/admin/statistics', 'A', null, 200,
        [len('.ordersChart.yearly', 5, 'Biểu đồ năm có đúng 5 điểm dữ liệu')]],
      ['TC-DASH-09', 'Doanh thu theo danh mục có dữ liệu', 'GET', '/admin/statistics', 'A', null, 200,
        [chk('Có dữ liệu doanh thu theo danh mục',
          'pm.expect(pm.response.json().revenueByCategory.rows.length).to.be.above(0);')]],
      ['TC-DASH-10', 'Tổng doanh thu danh mục = tổng từng dòng', 'GET', '/admin/statistics', 'A', null, 200,
        [chk('Tổng các dòng khớp với số tổng',
          'const rc = pm.response.json().revenueByCategory;',
          'const sum = rc.rows.reduce((s, r) => s + Number(r.revenue), 0);',
          'pm.expect(Math.abs(sum - Number(rc.summary.totalRevenue))).to.be.below(1);')]],
      ['TC-DASH-11', 'Ngưỡng cảnh báo tồn kho thấp = 100', 'GET', '/admin/statistics', 'A', null, 200,
        [chk('Ngưỡng cảnh báo đúng 100',
          'pm.expect(Number(pm.response.json().lowStock.threshold)).to.eql(100);')]],
      ['TC-DASH-04', 'Có số liệu tổng khách hàng', 'GET', '/admin/statistics', 'A', null, 200,
        [has('summary.totalCustomers')]],
      ['TC-DASH-03', 'Có số liệu tổng số sách', 'GET', '/admin/statistics', 'A', null, 200,
        [has('summary.totalBooks')]],
      ['TC-DASH-12', 'KHÁCH HÀNG xem thống kê', 'GET', '/admin/statistics', 'C', null, 403]
    ]
  },

  // ------------------------------------------ 12. Phân quyền & Bảo mật ----
  {
    name: '12. Phân quyền & Bảo mật',
    rows: [
      ['TC-SEC-01', 'Không token · GET /users', 'GET', '/users', '-', null, 401],
      ['TC-SEC-02', 'Không token · GET /customers', 'GET', '/customers', '-', null, 401],
      ['TC-SEC-03', 'Không token · GET /admin/statistics', 'GET', '/admin/statistics', '-', null, 401],
      ['TC-SEC-04', 'Không token · GET /inventory', 'GET', '/inventory', '-', null, 401],
      ['TC-SEC-05', 'Không token · GET /orders', 'GET', '/orders', '-', null, 401],
      ['TC-SEC-06', 'KHÁCH HÀNG · thống kê', 'GET', '/admin/statistics', 'C', null, 403],
      ['TC-SEC-07', 'KHÁCH HÀNG · kho', 'GET', '/inventory', 'C', null, 403],
      ['TC-SEC-08', 'KHÁCH HÀNG · tài khoản', 'GET', '/users', 'C', null, 403],
      ['TC-SEC-09', 'NHÂN VIÊN · kho', 'GET', '/inventory', 'E', null, 200],
      ['TC-SEC-10', 'NHÂN VIÊN · thống kê', 'GET', '/admin/statistics', 'E', null, 200],
      ['TC-SEC-11', 'NHÂN VIÊN · tài khoản', 'GET', '/users', 'E', null, 403],

      ['TC-VAL-01', 'SQL Injection ở tìm kiếm', 'GET', '/books?q=%27%20OR%201%3D1%20--', '-', null, 200,
        [chk('Không lộ thông báo lỗi SQL',
          'pm.expect(pm.response.text().toLowerCase()).to.not.include("sql syntax");')],
        'Hệ thống phải xử lý an toàn, không sập và không lộ câu lệnh SQL.'],

      ['TC-VAL-02', 'SQL Injection dạng UNION', 'GET', '/books?q=%27%20UNION%20SELECT%20*%20FROM%20users%20--', '-', null, 200,
        [chk('Không lộ lỗi câu lệnh SQL',
          'pm.expect(pm.response.text().toLowerCase()).to.not.include("sql syntax");')]],

      ['TC-VAL-03', 'SQL Injection ở đăng nhập', 'POST', '/auth/login', '-',
        { email: "admin@kimdong.vn' OR '1'='1", password: "' OR '1'='1" }, [400, 401]],

      ['TC-VAL-04', 'Mật khẩu KHÔNG bị lộ trong phản hồi', 'POST', '/auth/login', '-',
        { email: 'admin@kimdong.vn', password: 'admin123' }, 200,
        [chk('Phản hồi không chứa hash mật khẩu',
          'const body = pm.response.text();',
          'pm.expect(body).to.not.include("password_hash");',
          'pm.expect(body).to.not.include("$2a$");',
          'pm.expect(body).to.not.include("$2b$");')]],

      ['TC-VAL-05', 'ID không phải số', 'GET', '/books/abc', '-', null, 404, [no500()]],

      ['TC-VAL-07', 'Giá sách ÂM bị từ chối', 'POST', '/books', 'A',
        { title: 'Sách giá âm', price: -50000, category_id: 6 }, 400],

      ['TC-VAL-10', 'Chuỗi RẤT DÀI không làm sập hệ thống', 'POST', '/auth/login', '-',
        { email: 'a'.repeat(5000) + '@t.vn', password: 'x'.repeat(5000) }, [400, 401, 413], [no500()]],

      ['TC-VAL-11', 'Tạo danh mục có tên tiếng Việt', 'POST', '/categories', 'A',
        { name: 'Danh Mục Tiếng Việt Có Dấu', description: 'Kiểm tra dấu: ăâđêôơư' }, 201,
        [chk('Lưu id danh mục tiếng Việt', ...save('categoryId', 'viCategoryId'))],
        'API tạo danh mục chỉ trả về id, nên phải đọc lại danh sách để kiểm tra dấu.'],

      ['TC-VAL-11b', 'Tiếng Việt có dấu được lưu đúng', 'GET', '/categories', '-', null, 200,
        [chk('Tên danh mục giữ đúng dấu tiếng Việt',
          'const all = pm.response.json().raw || [];',
          'pm.expect(JSON.stringify(all)).to.include("Danh Mục Tiếng Việt Có Dấu");')]],

      ['Dọn dẹp', 'Xoá danh mục tiếng Việt vừa tạo', 'DELETE', '/categories/{{viCategoryId}}', 'A', null, 200]
    ]
  }
];

// ================================================== Dựng đối tượng Postman ==

/** Chuyển một dòng bảng thành request của Postman. */
function buildRequest(row) {
  const [code, name, method, fullPath, role, body, expect, extra, note] = row;

  // Tách query string ra khỏi đường dẫn
  const qIndex = fullPath.indexOf('?');
  const urlPath = qIndex === -1 ? fullPath : fullPath.slice(0, qIndex);
  const queryPairs = qIndex === -1
    ? []
    : fullPath.slice(qIndex + 1).split('&').filter(Boolean).map((p) => {
        const eq = p.indexOf('=');
        return eq === -1 ? [p, ''] : [p.slice(0, eq), p.slice(eq + 1)];
      });

  const descriptionParts = [];
  if (note) descriptionParts.push(note);
  if (expect !== null && expect !== undefined) {
    const codes = Array.isArray(expect) ? expect : [expect];
    descriptionParts.push(`Mong đợi: HTTP ${codes.join(' hoặc ')}`);
  }

  const item = {
    name: `${code} · ${name}`,
    request: {
      method,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      url: {
        raw: '{{baseUrl}}' + fullPath,
        host: ['{{baseUrl}}'],
        path: urlPath.replace(/^\//, '').split('/').filter(Boolean),
        ...(queryPairs.length
          ? { query: queryPairs.map(([k, v]) => ({ key: k, value: v })) }
          : {})
      },
      ...(descriptionParts.length ? { description: descriptionParts.join('\n\n') } : {})
    },
    response: []
  };

  if (body !== null && body !== undefined) {
    item.request.body = {
      mode: 'raw',
      raw: JSON.stringify(body, null, 2),
      options: { raw: { language: 'json' } }
    };
  }

  if (role === '-') {
    item.request.auth = { type: 'noauth' };
  } else if (role === 'C') {
    item.request.auth = {
      type: 'bearer', bearer: [{ key: 'token', value: '{{cusToken}}', type: 'string' }]
    };
  } else if (role === 'E') {
    item.request.auth = {
      type: 'bearer', bearer: [{ key: 'token', value: '{{empToken}}', type: 'string' }]
    };
  }
  // role === 'A' -> kế thừa auth cấp bộ sưu tập ({{adminToken}})

  const script = [no500()];
  if (expect !== null && expect !== undefined) {
    const codes = Array.isArray(expect) ? expect : [expect];
    if (codes.length === 1) {
      script.push(st(codes[0]));
    } else {
      script.push(chk(`Mã trạng thái thuộc ${codes.join('/')}`,
        `pm.expect([${codes.join(', ')}]).to.include(pm.response.code);`));
    }
  }
  if (Array.isArray(extra)) script.push(...extra);

  item.event = [{ listen: 'test', script: { type: 'text/javascript', exec: script.flat() } }];

  return item;
}

const folders = GROUPS.map((g) => ({
  name: g.name,
  item: g.rows.map(buildRequest),
  ...(g.note ? { description: g.note } : {})
}));

// ---------------------------------------------------- Pre-request script -----
const preRequest = [
  '// Tự động đăng nhập và lưu token trước khi chạy bộ sưu tập,',
  '// nhờ vậy chỉ cần bấm "Run collection" là chạy được ngay.',
  'const baseUrl = pm.collectionVariables.get("baseUrl");',
  '',
  'const accounts = [',
  '    { email: "admin@kimdong.vn",    password: "admin123", v: "adminToken" },',
  '    { email: "nhanvien@kimdong.vn", password: "admin123", v: "empToken"   },',
  '    { email: "khachhang@gmail.com", password: "user123",  v: "cusToken"   }',
  '];',
  '',
  '// Chỉ đăng nhập khi token chưa có, để không gọi lại nhiều lần.',
  'if (!pm.collectionVariables.get("adminToken")) {',
  '    for (const acc of accounts) {',
  '        try {',
  '            const res = await pm.sendRequest({',
  '                url: baseUrl + "/auth/login",',
  '                method: "POST",',
  '                header: { "Content-Type": "application/json" },',
  '                body: {',
  '                    mode: "raw",',
  '                    raw: JSON.stringify({ email: acc.email, password: acc.password })',
  '                }',
  '            });',
  '            if (res.code === 200) {',
  '                pm.collectionVariables.set(acc.v, res.json().token);',
  '            }',
  '        } catch (e) {',
  '            console.log("Không đăng nhập được " + acc.email + ": " + e.message);',
  '        }',
  '    }',
  '}'
];

// -------------------------------------------------------------- Xuất file ----
const collection = {
  info: {
    _postman_id: 'a7c3e9f1-2b4d-4e6a-9c8f-1d5b7a3e6c20',
    name: 'NXB Kim Đồng · API Kiểm Thử',
    description: [
      'Bộ sưu tập Postman cho RESTful API của website bán sách NXB Kim Đồng.',
      '',
      '### Cách dùng',
      '1. Bật backend: `npm run dev:server` (mặc định cổng 5000).',
      '2. Khôi phục dữ liệu mẫu: chạy `tests/reset-test-db.ps1`.',
      '3. Import file này vào Postman.',
      '4. Kiểm tra biến `baseUrl` (mặc định `http://localhost:5000/api`).',
      '5. Bấm **Run** để chạy toàn bộ, hoặc chạy từng request.',
      '',
      'Token được **tự động lấy** nhờ Pre-request Script của bộ sưu tập.',
      '',
      '### Chạy bằng dòng lệnh (Newman)',
      '```',
      'npx newman run tests/KIMDONG_API.postman_collection.json',
      '```',
      '',
      '### Lưu ý về môi trường',
      'Nên chạy trên **database kiểm thử riêng** (`kimdong_bookstore_test`) vì bộ sưu tập',
      'có tạo và xoá dữ liệu. Xem hướng dẫn trong `docs/KE_HOACH_KIEM_THU.md`.',
      '',
      '### Thứ tự chạy',
      'Các request được đánh số và **cần chạy theo thứ tự** vì nhiều request dùng biến do',
      'request trước tạo ra, ví dụ `{{newBookId}}`, `{{cartItemId}}`, `{{orderId}}`.',
      '',
      'Bộ kiểm thử tự động đầy đủ (253 test case) nằm ở `tests/api-tests.mjs`.'
    ].join('\n'),
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  auth: {
    type: 'bearer',
    bearer: [{ key: 'token', value: '{{adminToken}}', type: 'string' }]
  },
  event: [{ listen: 'prerequest', script: { type: 'text/javascript', exec: preRequest } }],
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5000/api', type: 'string' },
    { key: 'adminToken', value: '', type: 'string' },
    { key: 'empToken', value: '', type: 'string' },
    { key: 'cusToken', value: '', type: 'string' },
    { key: 'newBookId', value: '1', type: 'string' },
    { key: 'newBookId2', value: '1', type: 'string' },
    { key: 'newCategoryId', value: '1', type: 'string' },
    { key: 'newAuthorId', value: '1', type: 'string' },
    { key: 'newBannerId', value: '1', type: 'string' },
    { key: 'newPromotionId', value: '1', type: 'string' },
    { key: 'newUserId', value: '1', type: 'string' },
    { key: 'cartItemId', value: '1', type: 'string' },
    { key: 'cartItemIdA', value: '1', type: 'string' },
    { key: 'cartItemIdB', value: '1', type: 'string' },
    { key: 'orderId', value: '1', type: 'string' },
    { key: 'boundaryOrderId', value: '1', type: 'string' },
    { key: 'longReasonOrderId', value: '1', type: 'string' },
    { key: 'shipOrderId', value: '1', type: 'string' },
    { key: 'freeShipOrderId', value: '1', type: 'string' },
    { key: 'refundOrderId', value: '1', type: 'string' },
    { key: 'stock3PreImport', value: '0', type: 'string' },
    { key: 'stock3Before', value: '0', type: 'string' },
    { key: 'viCategoryId', value: '1', type: 'string' }
  ],
  item: folders
};

fs.writeFileSync(OUT, JSON.stringify(collection, null, 2), 'utf8');

// ------------------------------------------------------------------ Tổng kết -
const countReqs = (items) => items.reduce((n, it) => n + (it.item ? countReqs(it.item) : 1), 0);
const countTests = (items) =>
  items.reduce((n, it) => {
    if (it.item) return n + countTests(it.item);
    const ev = (it.event || []).find((e) => e.listen === 'test');
    return n + (ev ? ev.script.exec.filter((l) => l.trim().startsWith('pm.test(')).length : 0);
  }, 0);

console.log('Da tao bo suu tap Postman:');
console.log('  File          : ' + OUT);
console.log('  So folder     : ' + folders.length);
console.log('  So request    : ' + countReqs(folders));
console.log('  So kiem thu   : ' + countTests(folders));
console.log('  Dung luong    : ' + (fs.statSync(OUT).size / 1024).toFixed(1) + ' KB');
