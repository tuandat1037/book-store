#!/usr/bin/env node
/**
 * ============================================================================
 * BỘ KIỂM THỬ TỰ ĐỘNG API
 * Dự án: Website Bán Sách Trực Tuyến & Quản Lý Bán Sách — NXB Kim Đồng
 * ============================================================================
 *
 * Cách chạy (khuyến nghị — dùng script điều phối, tự khôi phục DB + bật server):
 *     powershell -ExecutionPolicy Bypass -File tests\run-tests.ps1
 *
 * Hoặc chạy trực tiếp khi server đã bật:
 *     node tests/api-tests.mjs
 *
 * Biến môi trường:
 *     API_BASE   Địa chỉ API      (mặc định http://localhost:5000/api)
 *     REPORT     File báo cáo ra  (mặc định tests/KET_QUA_KIEM_THU.md)
 *
 * Mã test case khớp với tài liệu docs/KE_HOACH_KIEM_THU.md
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = process.env.API_BASE || 'http://localhost:5000/api';
const REPORT = process.env.REPORT || path.join(__dirname, 'KET_QUA_KIEM_THU.md');

// ---------------------------------------------------------------- Kết quả ---
const results = [];
let pass = 0;
let fail = 0;
const created = { orders: [], books: [], categories: [], authors: [], banners: [], promotions: [], users: [], reviews: [] };

const C = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', gray: '\x1b[90m', bold: '\x1b[1m'
};

/**
 * Ghi nhận và thực thi một test case.
 * @param code    Mã TC, ví dụ TC-ORD-01
 * @param module  Tên module
 * @param desc    Mô tả ngắn
 * @param expect  Mô tả kết quả mong đợi (hiển thị trong báo cáo)
 * @param pred    Hàm kiểm tra: nhận giá trị thực tế -> boolean
 * @param run     Hàm bất đồng bộ trả về giá trị thực tế
 */
async function T(code, module, desc, expect, pred, run) {
  let actual;
  let ok = false;
  try {
    actual = await run();
    ok = pred(actual);
  } catch (e) {
    actual = 'NGOẠI LỆ: ' + e.message;
    ok = false;
  }
  if (ok) pass++; else fail++;
  results.push({ code, module, desc, expect, actual: short(actual), pass: ok });
  const tag = ok ? `${C.green}PASS${C.reset}` : `${C.red}FAIL${C.reset}`;
  const extra = ok ? `${C.gray}${short(actual)}${C.reset}` : `${C.red}${short(actual)}${C.reset}  (mong đợi: ${expect})`;
  console.log(`${tag}  ${code.padEnd(12)} ${desc}${actual !== undefined && actual !== '' ? '  ' + extra : ''}`);
}

function short(v) {
  if (v === undefined || v === null) return '';
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return s.length > 150 ? s.slice(0, 150) + '…' : s;
}

function section(title) {
  console.log(`\n${C.cyan}${C.bold}── ${title} ${'─'.repeat(Math.max(2, 60 - title.length))}${C.reset}`);
}

// ------------------------------------------------------------------ HTTP ----
async function api(method, url, { token, body, headers } = {}) {
  const h = { 'Content-Type': 'application/json', ...(headers || {}) };
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(API + url, {
    method,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}
const GET = (u, o) => api('GET', u, o);
const POST = (u, o) => api('POST', u, o);
const PUT = (u, o) => api('PUT', u, o);
const DEL = (u, o) => api('DELETE', u, o);

// -------------------------------------------------------------- Tiện ích ----
async function login(email, password) {
  const r = await POST('/auth/login', { body: { email, password } });
  return r.data?.token;
}

async function stockOf(id, token) {
  const r = await GET(`/inventory/${id}`, { token });
  return Number(r.data?.book?.stock);
}

const SHIP = {
  customer_name: 'Nguyễn Văn An',
  customer_email: 'khachhang@gmail.com',
  customer_phone: '0987654321',
  shipping_address: '123 Nguyễn Trãi',
  shipping_province: 'TP. Hồ Chí Minh',
  shipping_district: 'Quận 1',
  shipping_ward: 'Bến Thành',
  payment_method: 'COD'
};

async function mkOrder(items, { token, method = 'COD', ship = {} } = {}) {
  const r = await POST('/orders', { token, body: { ...SHIP, ...ship, payment_method: method, items } });
  const id = r.data?.orderId;
  if (id) created.orders.push(Number(id));
  return { status: r.status, id, data: r.data };
}

// ================================================================== MAIN =====
(async () => {
  console.log(`${C.bold}BỘ KIỂM THỬ API — WEBSITE BÁN SÁCH NXB KIM ĐỒNG${C.reset}`);
  console.log(`${C.gray}API: ${API}${C.reset}`);
  console.log(`${C.gray}Thời điểm: ${new Date().toLocaleString('vi-VN')}${C.reset}`);

  // Kiểm tra server có sống không
  try {
    const ping = await GET('/books');
    if (ping.status !== 200) throw new Error('HTTP ' + ping.status);
  } catch (e) {
    console.error(`\n${C.red}✗ Không kết nối được API tại ${API}${C.reset}`);
    console.error(`  Chi tiết: ${e.message}`);
    console.error(`\n  Cách xử lý:`);
    console.error(`    1. Chạy: powershell -ExecutionPolicy Bypass -File tests\\run-tests.ps1`);
    console.error(`    2. Hoặc bật server thủ công: npm run dev:server`);
    process.exit(2);
  }

  const adminToken = await login('admin@kimdong.vn', 'admin123');
  const empToken = await login('nhanvien@kimdong.vn', 'admin123');
  const cusToken = await login('khachhang@gmail.com', 'user123');

  if (!adminToken) {
    console.error(`${C.red}✗ Không đăng nhập được tài khoản admin. Kiểm tra database đã nạp seed.sql chưa.${C.reset}`);
    process.exit(2);
  }

  // Ảnh chụp tồn kho gốc để đối chiếu
  const invBefore = await GET('/inventory', { token: adminToken });
  const stockSnapshot = {};
  for (const b of invBefore.data.books || []) stockSnapshot[b.id] = Number(b.stock);

  // =========================================================== 1. XÁC THỰC ==
  section('1. XÁC THỰC (AUTH) — TC-AUTH');

  await T('TC-AUTH-01', 'Xác thực', 'Đăng nhập ADMIN đúng thông tin', 'HTTP 200 + có token',
    v => v === 200, async () => (await POST('/auth/login', { body: { email: 'admin@kimdong.vn', password: 'admin123' } })).status);

  await T('TC-AUTH-02', 'Xác thực', 'Đăng nhập NHÂN VIÊN đúng thông tin', 'HTTP 200',
    v => v === 200, async () => (await POST('/auth/login', { body: { email: 'nhanvien@kimdong.vn', password: 'admin123' } })).status);

  await T('TC-AUTH-03', 'Xác thực', 'Đăng nhập KHÁCH HÀNG đúng thông tin', 'HTTP 200',
    v => v === 200, async () => (await POST('/auth/login', { body: { email: 'khachhang@gmail.com', password: 'user123' } })).status);

  await T('TC-AUTH-04', 'Xác thực', 'Đăng nhập sai mật khẩu', 'HTTP 401',
    v => v === 401, async () => (await POST('/auth/login', { body: { email: 'admin@kimdong.vn', password: 'sai_mat_khau' } })).status);

  await T('TC-AUTH-05', 'Xác thực', 'Đăng nhập email không tồn tại', 'HTTP 401',
    v => v === 401, async () => (await POST('/auth/login', { body: { email: 'khongton@kimdong.vn', password: 'admin123' } })).status);

  await T('TC-AUTH-06', 'Xác thực', 'Đăng nhập thiếu mật khẩu', 'HTTP 400',
    v => v === 400, async () => (await POST('/auth/login', { body: { email: 'admin@kimdong.vn' } })).status);

  await T('TC-AUTH-07', 'Xác thực', 'Đăng nhập thiếu email', 'HTTP 400',
    v => v === 400, async () => (await POST('/auth/login', { body: { password: 'admin123' } })).status);

  await T('TC-AUTH-08', 'Xác thực', 'Lấy hồ sơ bằng token hợp lệ', 'HTTP 200 + đúng email',
    v => v.status === 200 && v.email === 'admin@kimdong.vn', async () => {
      const r = await GET('/auth/me', { token: adminToken });
      return { status: r.status, email: r.data?.user?.email || r.data?.email };
    });

  await T('TC-AUTH-09', 'Xác thực', 'Lấy hồ sơ khi không gửi token', 'HTTP 401',
    v => v === 401, async () => (await GET('/auth/me')).status);

  await T('TC-AUTH-10', 'Xác thực', 'Lấy hồ sơ với token giả mạo', 'HTTP 401 hoặc 403',
    v => v === 401 || v === 403, async () => (await GET('/auth/me', { token: 'token.gia.mao' })).status);

  await T('TC-AUTH-11', 'Xác thực', 'Cập nhật hồ sơ cá nhân (đầy đủ trường)', 'HTTP 200',
    v => v === 200, async () => (await PUT('/auth/me', {
      token: cusToken,
      body: {
        full_name: 'Nguyễn Văn An', phone: '0987654321', address: '123 Nguyễn Trãi',
        province: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Bến Thành'
      }
    })).status);

  // LỖI THẬT: gửi thiếu trường thì mysql2 nhận `undefined` và ném lỗi -> 500.
  // Đúng ra phải là 200 (giữ nguyên trường không gửi) hoặc 400 (báo thiếu dữ liệu).
  await T('TC-AUTH-17', 'Xác thực', 'Cập nhật hồ sơ chỉ gửi 1 trường (payload một phần)', 'HTTP 200 hoặc 400 (không được 500)',
    v => v === 200 || v === 400, async () => (await PUT('/auth/me', {
      token: cusToken, body: { full_name: 'Nguyễn Văn An' }
    })).status);

  await T('TC-AUTH-12', 'Xác thực', 'Đổi mật khẩu với mật khẩu cũ sai', 'HTTP 400',
    v => v === 400, async () => (await PUT('/auth/change-password', {
      token: cusToken, body: { current_password: 'sai_hoan_toan', new_password: 'matkhau_moi_123' }
    })).status);

  await T('TC-AUTH-13', 'Xác thực', 'Đăng ký trùng email đã tồn tại', 'HTTP 400',
    v => v === 400, async () => (await POST('/auth/register', {
      body: { full_name: 'Trùng Email', email: 'admin@kimdong.vn', password: 'test123456' }
    })).status);

  const newAcc = { full_name: 'Tài Khoản Kiểm Thử', email: `kiemthu_${Date.now()}@test.vn`, password: 'test123456' };
  await T('TC-AUTH-14', 'Xác thực', 'Đăng ký tài khoản mới hợp lệ', 'HTTP 200 hoặc 201',
    v => v === 200 || v === 201, async () => (await POST('/auth/register', { body: newAcc })).status);

  await T('TC-AUTH-15', 'Xác thực', 'Đổi mật khẩu với mật khẩu cũ đúng', 'HTTP 200',
    v => v === 200, async () => {
      const t = await login(newAcc.email, newAcc.password);
      return (await PUT('/auth/change-password', {
        token: t, body: { current_password: newAcc.password, new_password: 'matkhau_moi_999' }
      })).status;
    });

  await T('TC-AUTH-16', 'Xác thực', 'Đăng nhập bằng mật khẩu vừa đổi', 'HTTP 200',
    v => v === 200, async () => (await POST('/auth/login', {
      body: { email: newAcc.email, password: 'matkhau_moi_999' }
    })).status);

  // ============================================================== 2. SÁCH ==
  section('2. QUẢN LÝ SÁCH (BOOKS) — TC-BOOK');

  await T('TC-BOOK-01', 'Sách', 'Lấy danh sách sách', 'HTTP 200 + có mảng books',
    v => v.status === 200 && Array.isArray(v.count), async () => {
      const r = await GET('/books');
      return { status: r.status, count: r.data?.books };
    });

  await T('TC-BOOK-02', 'Sách', 'Danh sách có đủ 12 sách theo seed', 'Đúng 12 sách',
    v => v === 12, async () => (await GET('/books?limit=100')).data?.books?.length);

  await T('TC-BOOK-03', 'Sách', 'Lấy chi tiết sách theo ID', 'HTTP 200 + đúng ID',
    v => v.status === 200 && Number(v.id) === 1, async () => {
      const r = await GET('/books/1');
      return { status: r.status, id: r.data?.book?.id };
    });

  await T('TC-BOOK-04', 'Sách', 'Lấy chi tiết sách theo slug', 'HTTP 200',
    v => v === 200, async () => (await GET('/books/doraemon-tap-1')).status);

  await T('TC-BOOK-05', 'Sách', 'Lấy sách không tồn tại', 'HTTP 404',
    v => v === 404, async () => (await GET('/books/999999')).status);

  await T('TC-BOOK-06', 'Sách', 'Lọc sách theo danh mục', 'HTTP 200 + chỉ sách danh mục 6',
    v => v.status === 200 && v.ok, async () => {
      const r = await GET('/books?category_id=6');
      const books = r.data?.books || [];
      return { status: r.status, ok: books.length > 0 && books.every(b => Number(b.category_id) === 6) };
    });

  await T('TC-BOOK-07', 'Sách', 'Tìm kiếm sách theo từ khoá', 'HTTP 200 + có kết quả',
    v => v.status === 200 && v.count > 0, async () => {
      const r = await GET('/books?q=Doraemon');
      return { status: r.status, count: (r.data?.books || []).length };
    });

  await T('TC-BOOK-08', 'Sách', 'Lọc sách theo khoảng giá', 'HTTP 200',
    v => v === 200, async () => (await GET('/books?min_price=20000&max_price=30000')).status);

  await T('TC-BOOK-09', 'Sách', 'Lấy sách theo danh mục nổi bật trang chủ', 'HTTP 200',
    v => v === 200, async () => (await GET('/books/sections/home')).status);

  await T('TC-BOOK-10', 'Sách', 'Tạo sách mới với quyền ADMIN', 'HTTP 200 hoặc 201',
    v => v === 200 || v === 201, async () => {
      const r = await POST('/books', {
        token: adminToken,
        body: {
          title: 'Sách Kiểm Thử Tự Động', category_id: 6, author_id: 1, publisher_id: 1,
          price: 50000, sale_price: 45000, stock: 10, import_price: 30000,
          publication_year: 2024, num_pages: 100, cover_type: 'Bìa mềm',
          dimensions: '13 x 20 cm', weight: 200, description: 'Sách dùng cho kiểm thử tự động.'
        }
      });
      const id = r.data?.bookId || r.data?.id;
      if (id) created.books.push(Number(id));
      return r.status;
    });

  await T('TC-BOOK-11', 'Sách', 'Tạo sách thiếu tiêu đề', 'HTTP 400',
    v => v === 400, async () => (await POST('/books', { token: adminToken, body: { price: 50000 } })).status);

  await T('TC-BOOK-12', 'Sách', 'KHÁCH HÀNG không được tạo sách', 'HTTP 403',
    v => v === 403, async () => (await POST('/books', { token: cusToken, body: { title: 'X', price: 1000 } })).status);

  await T('TC-BOOK-13', 'Sách', 'NHÂN VIÊN được tạo sách', 'HTTP 200 hoặc 201',
    v => v === 200 || v === 201, async () => {
      const r = await POST('/books', {
        token: empToken,
        body: { title: 'Sách Nhân Viên Tạo', category_id: 6, author_id: 1, publisher_id: 1, price: 30000, stock: 5 }
      });
      const id = r.data?.bookId || r.data?.id;
      if (id) created.books.push(Number(id));
      return r.status;
    });

  await T('TC-BOOK-14', 'Sách', 'Cập nhật thông tin sách', 'HTTP 200',
    v => v === 200, async () => {
      const id = created.books[0];
      return (await PUT(`/books/${id}`, { token: adminToken, body: { title: 'Sách Kiểm Thử (Đã Sửa)', price: 55000 } })).status;
    });

  await T('TC-BOOK-15', 'Sách', 'Cập nhật sách không tồn tại', 'HTTP 404',
    v => v === 404, async () => (await PUT('/books/999999', { token: adminToken, body: { title: 'Không tồn tại' } })).status);

  await T('TC-BOOK-16', 'Sách', 'Cập nhật trạng thái sách không hợp lệ', 'HTTP 400',
    v => v === 400, async () => (await PUT(`/books/${created.books[0]}`, { token: adminToken, body: { status: 'SAI_TRANG_THAI' } })).status);

  await T('TC-BOOK-17', 'Sách', 'Cập nhật trạng thái sách hợp lệ (INACTIVE)', 'HTTP 200',
    v => v === 200, async () => (await PUT(`/books/${created.books[0]}`, { token: adminToken, body: { status: 'INACTIVE' } })).status);

  await T('TC-BOOK-18', 'Sách', 'Xoá sách (xoá mềm)', 'HTTP 200',
    v => v === 200, async () => (await DEL(`/books/${created.books[0]}`, { token: adminToken })).status);

  await T('TC-BOOK-19', 'Sách', 'Sách đã xoá không còn trong danh sách', 'Không còn sách đã xoá',
    v => v === false, async () => {
      const r = await GET('/books?limit=100');
      return (r.data?.books || []).some(b => Number(b.id) === Number(created.books[0]));
    });

  await T('TC-BOOK-20', 'Sách', 'Khách hàng không được xoá sách', 'HTTP 403',
    v => v === 403, async () => (await DEL('/books/2', { token: cusToken })).status);

  // Dọn dẹp sách do NHÂN VIÊN tạo ở TC-BOOK-13, để các test sau (đặc biệt là
  // thống kê tổng số sách) vẫn đối chiếu được với dữ liệu gốc 12 sách.
  await T('TC-BOOK-21', 'Sách', 'Dọn dẹp sách do nhân viên tạo ở TC-BOOK-13', 'HTTP 200',
    v => v === 200, async () => (await DEL(`/books/${created.books[1]}`, { token: adminToken })).status);

  // ========================================================== 3. DANH MỤC ==
  section('3. DANH MỤC (CATEGORIES) — TC-CAT');

  await T('TC-CAT-01', 'Danh mục', 'Lấy danh sách danh mục', 'HTTP 200 + có dữ liệu',
    v => v.status === 200 && v.count > 0, async () => {
      const r = await GET('/categories');
      return { status: r.status, count: (r.data?.categories || []).length };
    });

  await T('TC-CAT-02', 'Danh mục', 'Seed có 13 danh mục (gồm cả danh mục con)', 'Đúng 13',
    v => v === 13, async () => {
      const r = await GET('/categories');
      return (r.data?.raw || []).length;
    });

  await T('TC-CAT-03', 'Danh mục', 'Tạo danh mục mới', 'HTTP 200 hoặc 201',
    v => v === 200 || v === 201, async () => {
      const r = await POST('/categories', {
        token: adminToken, body: { name: 'Danh Mục Kiểm Thử', slug: `danh-muc-kt-${Date.now()}`, description: 'Dùng cho kiểm thử' }
      });
      const id = r.data?.categoryId || r.data?.id;
      if (id) created.categories.push(Number(id));
      return r.status;
    });

  await T('TC-CAT-04', 'Danh mục', 'Tạo danh mục thiếu tên', 'HTTP 400',
    v => v === 400, async () => (await POST('/categories', { token: adminToken, body: { description: 'Thiếu tên' } })).status);

  await T('TC-CAT-05', 'Danh mục', 'Cập nhật danh mục', 'HTTP 200',
    v => v === 200, async () => (await PUT(`/categories/${created.categories[0]}`, {
      token: adminToken, body: { name: 'Danh Mục Kiểm Thử (Đã Sửa)' }
    })).status);

  await T('TC-CAT-06', 'Danh mục', 'Cập nhật danh mục không tồn tại', 'HTTP 404',
    v => v === 404, async () => (await PUT('/categories/999999', { token: adminToken, body: { name: 'X' } })).status);

  await T('TC-CAT-07', 'Danh mục', 'KHÁCH HÀNG không được tạo danh mục', 'HTTP 403',
    v => v === 403, async () => (await POST('/categories', { token: cusToken, body: { name: 'X' } })).status);

  await T('TC-CAT-08', 'Danh mục', 'Chặn xoá danh mục còn sách', 'HTTP 400',
    v => v === 400, async () => (await DEL('/categories/6', { token: adminToken })).status);

  await T('TC-CAT-09', 'Danh mục', 'Xoá danh mục rỗng thành công', 'HTTP 200',
    v => v === 200, async () => (await DEL(`/categories/${created.categories[0]}`, { token: adminToken })).status);

  await T('TC-CAT-10', 'Danh mục', 'Xoá danh mục không tồn tại', 'HTTP 404',
    v => v === 404, async () => (await DEL('/categories/999999', { token: adminToken })).status);

  // ==================================================== 4. TÁC GIẢ & NXB ==
  section('4. TÁC GIẢ & NHÀ XUẤT BẢN — TC-AUT');

  await T('TC-AUT-01', 'Tác giả', 'Lấy danh sách tác giả', 'HTTP 200 + 7 tác giả',
    v => v.status === 200 && v.count === 7, async () => {
      const r = await GET('/authors');
      return { status: r.status, count: (r.data?.authors || []).length };
    });

  await T('TC-AUT-02', 'Tác giả', 'Lấy danh sách nhà xuất bản', 'HTTP 200 + 3 NXB',
    v => v.status === 200 && v.count === 3, async () => {
      const r = await GET('/publishers');
      return { status: r.status, count: (r.data?.publishers || []).length };
    });

  await T('TC-AUT-03', 'Tác giả', 'Tạo tác giả mới', 'HTTP 200 hoặc 201',
    v => v === 200 || v === 201, async () => {
      const r = await POST('/authors', {
        token: adminToken, body: { name: 'Tác Giả Kiểm Thử', slug: `tac-gia-kt-${Date.now()}`, bio: 'Dùng cho kiểm thử' }
      });
      const id = r.data?.authorId || r.data?.id;
      if (id) created.authors.push(Number(id));
      return r.status;
    });

  await T('TC-AUT-04', 'Tác giả', 'Tạo tác giả thiếu tên', 'HTTP 400',
    v => v === 400, async () => (await POST('/authors', { token: adminToken, body: { bio: 'Thiếu tên' } })).status);

  await T('TC-AUT-05', 'Tác giả', 'Cập nhật tác giả', 'HTTP 200',
    v => v === 200, async () => (await PUT(`/authors/${created.authors[0]}`, {
      token: adminToken, body: { name: 'Tác Giả Kiểm Thử (Đã Sửa)' }
    })).status);

  await T('TC-AUT-06', 'Tác giả', 'Cập nhật tác giả không tồn tại', 'HTTP 404',
    v => v === 404, async () => (await PUT('/authors/999999', { token: adminToken, body: { name: 'X' } })).status);

  await T('TC-AUT-07', 'Tác giả', 'KHÁCH HÀNG không được tạo tác giả', 'HTTP 403',
    v => v === 403, async () => (await POST('/authors', { token: cusToken, body: { name: 'X' } })).status);

  await T('TC-AUT-08', 'Tác giả', 'Xoá tác giả vừa tạo', 'HTTP 200',
    v => v === 200, async () => (await DEL(`/authors/${created.authors[0]}`, { token: adminToken })).status);

  await T('TC-AUT-09', 'Tác giả', 'Xoá tác giả không tồn tại', 'HTTP 404',
    v => v === 404, async () => (await DEL('/authors/999999', { token: adminToken })).status);

  await T('TC-AUT-10', 'Tác giả', 'Không đăng nhập không tạo được tác giả', 'HTTP 401',
    v => v === 401, async () => (await POST('/authors', { body: { name: 'X' } })).status);

  // ============================================================ 5. BANNER ==
  section('5. BANNER — TC-BAN');

  await T('TC-BAN-01', 'Banner', 'Lấy banner đang hiển thị (công khai)', 'HTTP 200 + có dữ liệu',
    v => v.status === 200 && v.count > 0, async () => {
      const r = await GET('/banners');
      return { status: r.status, count: (r.data?.banners || []).length };
    });

  await T('TC-BAN-02', 'Banner', 'Lấy toàn bộ banner (quản trị)', 'HTTP 200 + 3 banner',
    v => v.status === 200 && v.count === 3, async () => {
      const r = await GET('/banners/all', { token: adminToken });
      return { status: r.status, count: (r.data?.banners || []).length };
    });

  await T('TC-BAN-03', 'Banner', 'KHÁCH HÀNG không xem được toàn bộ banner', 'HTTP 403',
    v => v === 403, async () => (await GET('/banners/all', { token: cusToken })).status);

  await T('TC-BAN-04', 'Banner', 'Tạo banner mới', 'HTTP 200 hoặc 201',
    v => v === 200 || v === 201, async () => {
      const r = await POST('/banners', {
        token: adminToken,
        body: {
          title: 'Banner Kiểm Thử', subtitle: 'Dùng cho kiểm thử tự động',
          image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000',
          cta_link: '/books', display_order: 9, is_active: 1
        }
      });
      const id = r.data?.bannerId || r.data?.id;
      if (id) created.banners.push(Number(id));
      return r.status;
    });

  await T('TC-BAN-05', 'Banner', 'Tạo banner thiếu tiêu đề', 'HTTP 400',
    v => v === 400, async () => (await POST('/banners', { token: adminToken, body: { subtitle: 'Thiếu tiêu đề' } })).status);

  await T('TC-BAN-06', 'Banner', 'Cập nhật banner', 'HTTP 200',
    v => v === 200, async () => (await PUT(`/banners/${created.banners[0]}`, {
      token: adminToken, body: { title: 'Banner Kiểm Thử (Đã Sửa)', cta_link: '/books' }
    })).status);

  await T('TC-BAN-07', 'Banner', 'Cập nhật banner không tồn tại', 'HTTP 404',
    v => v === 404, async () => (await PUT('/banners/999999', {
      token: adminToken, body: { title: 'X', cta_link: '/books' }
    })).status);

  await T('TC-BAN-10', 'Banner', 'Tạo banner thiếu đường dẫn CTA', 'HTTP 400',
    v => v === 400, async () => (await POST('/banners', { token: adminToken, body: { title: 'Thiếu CTA' } })).status);

  await T('TC-BAN-08', 'Banner', 'Xoá banner', 'HTTP 200',
    v => v === 200, async () => (await DEL(`/banners/${created.banners[0]}`, { token: adminToken })).status);

  await T('TC-BAN-09', 'Banner', 'KHÁCH HÀNG không tạo được banner', 'HTTP 403',
    v => v === 403, async () => (await POST('/banners', { token: cusToken, body: { title: 'X' } })).status);

  // ======================================================= 6. KHUYẾN MÃI ==
  section('6. KHUYẾN MÃI (PROMOTIONS) — TC-PRM');

  await T('TC-PRM-01', 'Khuyến mãi', 'Lấy mã đang hoạt động', 'HTTP 200 + có dữ liệu',
    v => v.status === 200 && v.count > 0, async () => {
      const r = await GET('/promotions');
      return { status: r.status, count: (r.data?.promotions || []).length };
    });

  await T('TC-PRM-02', 'Khuyến mãi', 'Lấy toàn bộ mã (quản trị)', 'HTTP 200 + 2 mã',
    v => v.status === 200 && v.count === 2, async () => {
      const r = await GET('/promotions/all', { token: adminToken });
      return { status: r.status, count: (r.data?.promotions || []).length };
    });

  await T('TC-PRM-03', 'Khuyến mãi', 'Kiểm tra mã hợp lệ đủ điều kiện', 'HTTP 200 + có số tiền giảm',
    v => v.status === 200 && v.discount > 0, async () => {
      const r = await POST('/promotions/validate', { body: { code: 'KIMDONG20', subtotal: 500000 } });
      return { status: r.status, discount: r.data?.discount_amount };
    });

  await T('TC-PRM-04', 'Khuyến mãi', 'Mã không dùng được khi đơn dưới giá trị tối thiểu', 'HTTP 400',
    v => v === 400, async () => (await POST('/promotions/validate', {
      body: { code: 'KIMDONG20', subtotal: 50000 }
    })).status);

  await T('TC-PRM-05', 'Khuyến mãi', 'Kiểm tra mã không tồn tại', 'HTTP 400',
    v => v === 400, async () => (await POST('/promotions/validate', {
      body: { code: 'MA_KHONG_TON_TAI', subtotal: 500000 }
    })).status);

  await T('TC-PRM-06', 'Khuyến mãi', 'Kiểm tra mã thiếu tham số', 'HTTP 400',
    v => v === 400, async () => (await POST('/promotions/validate', { body: {} })).status);

  await T('TC-PRM-07', 'Khuyến mãi', 'Tạo mã giảm giá mới', 'HTTP 200 hoặc 201',
    v => v === 200 || v === 201, async () => {
      const r = await POST('/promotions', {
        token: adminToken,
        body: {
          code: `KMKT${Date.now() % 100000}`, title: 'Mã Kiểm Thử', discount_type: 'PERCENTAGE',
          discount_value: 10, min_order_value: 100000, max_discount: 30000,
          start_date: '2026-01-01', end_date: '2026-12-31', usage_limit: 100, is_active: 1
        }
      });
      const id = r.data?.promotionId || r.data?.id;
      if (id) created.promotions.push(Number(id));
      return r.status;
    });

  await T('TC-PRM-08', 'Khuyến mãi', 'Tạo mã trùng code đã tồn tại', 'HTTP 400',
    v => v === 400, async () => (await POST('/promotions', {
      token: adminToken, body: { code: 'KIMDONG20', title: 'Trùng mã', discount_type: 'PERCENTAGE', discount_value: 5 }
    })).status);

  await T('TC-PRM-09', 'Khuyến mãi', 'Tạo mã thiếu code', 'HTTP 400',
    v => v === 400, async () => (await POST('/promotions', { token: adminToken, body: { title: 'Thiếu code' } })).status);

  await T('TC-PRM-10', 'Khuyến mãi', 'Cập nhật mã giảm giá', 'HTTP 200',
    v => v === 200, async () => (await PUT(`/promotions/${created.promotions[0]}`, {
      token: adminToken,
      body: {
        code: 'KMKTSUA', title: 'Mã Kiểm Thử (Đã Sửa)', discount_type: 'PERCENTAGE',
        discount_value: 15, min_order_value: 100000, max_discount: 40000,
        start_date: '2026-01-01', end_date: '2026-12-31', usage_limit: 50, is_active: 1
      }
    })).status);

  await T('TC-PRM-11', 'Khuyến mãi', 'Cập nhật mã không tồn tại', 'HTTP 404',
    v => v === 404, async () => (await PUT('/promotions/999999', { token: adminToken, body: { title: 'X' } })).status);

  await T('TC-PRM-12', 'Khuyến mãi', 'Bật/tắt trạng thái mã', 'HTTP 200',
    v => v === 200, async () => (await PUT(`/promotions/${created.promotions[0]}/toggle`, { token: adminToken })).status);

  await T('TC-PRM-13', 'Khuyến mãi', 'Mã bị tạm dừng thì không dùng được nữa', 'HTTP 400',
    v => v === 400, async () => {
      const all = await GET('/promotions/all', { token: adminToken });
      const p = (all.data?.promotions || []).find(x => Number(x.id) === Number(created.promotions[0]));
      if (!p) return 'khong tim thay ma';
      return (await POST('/promotions/validate', { body: { code: p.code, subtotal: 500000 } })).status;
    });

  await T('TC-PRM-14', 'Khuyến mãi', 'Xoá mã giảm giá', 'HTTP 200',
    v => v === 200, async () => (await DEL(`/promotions/${created.promotions[0]}`, { token: adminToken })).status);

  await T('TC-PRM-15', 'Khuyến mãi', 'KHÁCH HÀNG không tạo được mã', 'HTTP 403',
    v => v === 403, async () => (await POST('/promotions', { token: cusToken, body: { code: 'X', title: 'X' } })).status);

  await T('TC-PRM-16', 'Khuyến mãi', 'Mã giảm giá theo số tiền cố định', 'HTTP 200 + giảm đúng 20.000đ',
    v => v.status === 200 && v.discount === 20000, async () => {
      const r = await POST('/promotions/validate', { body: { code: 'FREESHIP30', subtotal: 300000 } });
      return { status: r.status, discount: r.data?.discount_amount };
    });

  // ================================================ 7. TÀI KHOẢN NHÂN VIÊN =
  section('7. TÀI KHOẢN NHÂN VIÊN (USERS) — TC-EMP');

  await T('TC-EMP-01', 'Tài khoản', 'ADMIN lấy danh sách tài khoản', 'HTTP 200 + có dữ liệu',
    v => v.status === 200 && v.count > 0, async () => {
      const r = await GET('/users', { token: adminToken });
      return { status: r.status, count: (r.data?.users || []).length };
    });

  await T('TC-EMP-02', 'Tài khoản', 'NHÂN VIÊN không xem được danh sách tài khoản', 'HTTP 403',
    v => v === 403, async () => (await GET('/users', { token: empToken })).status);

  await T('TC-EMP-03', 'Tài khoản', 'KHÁCH HÀNG không xem được danh sách tài khoản', 'HTTP 403',
    v => v === 403, async () => (await GET('/users', { token: cusToken })).status);

  const empEmail = `nv_kt_${Date.now()}@kimdong.vn`;
  await T('TC-EMP-04', 'Tài khoản', 'ADMIN tạo tài khoản nhân viên', 'HTTP 200 hoặc 201',
    v => v === 200 || v === 201, async () => {
      const r = await POST('/users', {
        token: adminToken,
        body: { full_name: 'Nhân Viên Kiểm Thử', email: empEmail, password: 'nhanvien123', role_id: 2, phone: '0900000001' }
      });
      const id = r.data?.userId || r.data?.id;
      if (id) created.users.push(Number(id));
      return r.status;
    });

  await T('TC-EMP-05', 'Tài khoản', 'Tài khoản nhân viên vừa tạo đăng nhập được', 'HTTP 200',
    v => v === 200, async () => (await POST('/auth/login', { body: { email: empEmail, password: 'nhanvien123' } })).status);

  await T('TC-EMP-06', 'Tài khoản', 'Tạo tài khoản trùng email', 'HTTP 400',
    v => v === 400, async () => (await POST('/users', {
      token: adminToken, body: { full_name: 'Trùng', email: empEmail, password: 'abc123456', role_id: 2 }
    })).status);

  await T('TC-EMP-07', 'Tài khoản', 'Tạo tài khoản thiếu mật khẩu', 'HTTP 400',
    v => v === 400, async () => (await POST('/users', {
      token: adminToken, body: { full_name: 'Thiếu MK', email: `x_${Date.now()}@t.vn`, role_id: 2 }
    })).status);

  await T('TC-EMP-08', 'Tài khoản', 'Cập nhật thông tin nhân viên', 'HTTP 200',
    v => v === 200, async () => (await PUT(`/users/${created.users[0]}`, {
      token: adminToken, body: { full_name: 'Nhân Viên Kiểm Thử (Đã Sửa)', email: empEmail, phone: '0900000002' }
    })).status);

  await T('TC-EMP-09', 'Tài khoản', 'Cập nhật tài khoản không tồn tại', 'HTTP 404',
    v => v === 404, async () => (await PUT('/users/999999', {
      token: adminToken, body: { full_name: 'X', email: 'x@t.vn' }
    })).status);

  await T('TC-EMP-10', 'Tài khoản', 'Đổi vai trò tài khoản', 'HTTP 200',
    v => v === 200, async () => (await PUT(`/users/${created.users[0]}/role`, { token: adminToken, body: { role_id: 1 } })).status);

  await T('TC-EMP-13', 'Tài khoản', 'Không thể hạ quyền chính mình', 'HTTP 400',
    v => v === 400, async () => (await PUT('/users/1/role', { token: adminToken, body: { role_id: 2 } })).status);

  await T('TC-EMP-14', 'Tài khoản', 'Không thể xoá chính tài khoản đang đăng nhập', 'HTTP 400',
    v => v === 400, async () => (await DEL('/users/1', { token: adminToken })).status);

  await T('TC-EMP-11', 'Tài khoản', 'Xoá tài khoản nhân viên', 'HTTP 200',
    v => v === 200, async () => (await DEL(`/users/${created.users[0]}`, { token: adminToken })).status);

  await T('TC-EMP-12', 'Tài khoản', 'NHÂN VIÊN không tạo được tài khoản', 'HTTP 403',
    v => v === 403, async () => (await POST('/users', { token: empToken, body: { full_name: 'X', email: 'x@t.vn', password: 'abc123' } })).status);

  // ======================================================= 8. KHÁCH HÀNG ==
  section('8. QUẢN LÝ KHÁCH HÀNG (CUSTOMERS) — TC-CUS');

  await T('TC-CUS-01', 'Khách hàng', 'Lấy danh sách khách hàng', 'HTTP 200 + có dữ liệu',
    v => v.status === 200 && v.count > 0, async () => {
      const r = await GET('/customers', { token: adminToken });
      return { status: r.status, count: (r.data?.customers || []).length };
    });

  await T('TC-CUS-02', 'Khách hàng', 'Danh sách chỉ gồm vai trò khách hàng', 'Tất cả role_id = 3',
    v => v === true, async () => {
      const r = await GET('/customers', { token: adminToken });
      const list = r.data?.customers || [];
      return list.length > 0 && list.every(c => Number(c.role_id) === 3);
    });

  await T('TC-CUS-03', 'Khách hàng', 'NHÂN VIÊN xem được danh sách khách hàng', 'HTTP 200',
    v => v === 200, async () => (await GET('/customers', { token: empToken })).status);

  await T('TC-CUS-04', 'Khách hàng', 'KHÁCH HÀNG không xem được danh sách', 'HTTP 403',
    v => v === 403, async () => (await GET('/customers', { token: cusToken })).status);

  await T('TC-CUS-05', 'Khách hàng', 'Xem chi tiết khách hàng', 'HTTP 200 + đúng ID',
    v => v.status === 200 && Number(v.id) === 3, async () => {
      const r = await GET('/customers/3', { token: adminToken });
      return { status: r.status, id: r.data?.customer?.id };
    });

  await T('TC-CUS-06', 'Khách hàng', 'Xem chi tiết khách hàng không tồn tại', 'HTTP 404',
    v => v === 404, async () => (await GET('/customers/999999', { token: adminToken })).status);

  await T('TC-CUS-07', 'Khách hàng', 'Cập nhật thông tin khách hàng', 'HTTP 200',
    v => v === 200, async () => (await PUT('/customers/3', {
      token: adminToken,
      body: {
        full_name: 'Nguyễn Văn An', email: 'khachhang@gmail.com', phone: '0987654321',
        address: '123 Nguyễn Trãi', province: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Bến Thành'
      }
    })).status);

  await T('TC-CUS-08', 'Khách hàng', 'NHÂN VIÊN không sửa được khách hàng', 'HTTP 403',
    v => v === 403, async () => (await PUT('/customers/3', { token: empToken, body: { full_name: 'X' } })).status);

  await T('TC-CUS-09', 'Khách hàng', 'Cập nhật khách hàng không tồn tại', 'HTTP 404',
    v => v === 404, async () => (await PUT('/customers/999999', {
      token: adminToken, body: { full_name: 'X', email: 'x@t.vn' }
    })).status);

  // ========================================================= 9. GIỎ HÀNG ==
  section('9. GIỎ HÀNG (CART) — TC-CART');

  await T('TC-CART-01', 'Giỏ hàng', 'Xoá giỏ trước khi kiểm thử', 'HTTP 200',
    v => v === 200, async () => (await DEL('/cart/clear', { token: cusToken })).status);

  await T('TC-CART-02', 'Giỏ hàng', 'Lấy giỏ hàng rỗng', 'HTTP 200 + 0 sản phẩm',
    v => v.status === 200 && v.count === 0, async () => {
      const r = await GET('/cart', { token: cusToken });
      return { status: r.status, count: (r.data?.items || []).length };
    });

  await T('TC-CART-03', 'Giỏ hàng', 'Thêm sách vào giỏ', 'HTTP 200 hoặc 201',
    v => v === 200 || v === 201, async () => (await POST('/cart/items', {
      token: cusToken, body: { book_id: 1, quantity: 2 }
    })).status);

  await T('TC-CART-04', 'Giỏ hàng', 'Giỏ có 1 sản phẩm sau khi thêm', 'Đúng 1 sản phẩm',
    v => v === 1, async () => ((await GET('/cart', { token: cusToken })).data?.items || []).length);

  await T('TC-CART-05', 'Giỏ hàng', 'Thêm cùng sách thì cộng dồn số lượng', 'Số lượng = 5',
    v => v === 5, async () => {
      await POST('/cart/items', { token: cusToken, body: { book_id: 1, quantity: 3 } });
      const r = await GET('/cart', { token: cusToken });
      return Number((r.data?.items || [])[0]?.quantity);
    });

  await T('TC-CART-06', 'Giỏ hàng', 'Thêm sách không tồn tại', 'HTTP 404 hoặc 400',
    v => v === 404 || v === 400, async () => (await POST('/cart/items', {
      token: cusToken, body: { book_id: 999999, quantity: 1 }
    })).status);

  await T('TC-CART-07', 'Giỏ hàng', 'Thêm sách với số lượng 0', 'HTTP 400',
    v => v === 400, async () => (await POST('/cart/items', { token: cusToken, body: { book_id: 2, quantity: 0 } })).status);

  await T('TC-CART-08', 'Giỏ hàng', 'Thêm sách với số lượng âm', 'HTTP 400',
    v => v === 400, async () => (await POST('/cart/items', { token: cusToken, body: { book_id: 2, quantity: -5 } })).status);

  // Hai test dưới đây phát hiện LỖI THẬT: API không kiểm tra số lượng <= 0.
  // Dọn lại giỏ để các test sau không bị ảnh hưởng bởi dữ liệu bẩn này.
  await DEL('/cart/clear', { token: cusToken });
  await POST('/cart/items', { token: cusToken, body: { book_id: 1, quantity: 5 } });

  await T('TC-CART-09', 'Giỏ hàng', 'Thêm sách vượt tồn kho', 'HTTP 400',
    v => v === 400, async () => (await POST('/cart/items', { token: cusToken, body: { book_id: 3, quantity: 99999 } })).status);

  await T('TC-CART-10', 'Giỏ hàng', 'Cập nhật số lượng sản phẩm trong giỏ', 'HTTP 200',
    v => v === 200, async () => {
      const cart = await GET('/cart', { token: cusToken });
      const itemId = (cart.data?.items || [])[0]?.id;
      return (await PUT(`/cart/items/${itemId}`, { token: cusToken, body: { quantity: 4 } })).status;
    });

  await T('TC-CART-11', 'Giỏ hàng', 'Số lượng trong giỏ đã cập nhật', 'Số lượng = 4',
    v => v === 4, async () => Number(((await GET('/cart', { token: cusToken })).data?.items || [])[0]?.quantity));

  await T('TC-CART-12', 'Giỏ hàng', 'Xoá một sản phẩm khỏi giỏ', 'HTTP 200',
    v => v === 200, async () => {
      const cart = await GET('/cart', { token: cusToken });
      const itemId = (cart.data?.items || [])[0]?.id;
      return (await DEL(`/cart/items/${itemId}`, { token: cusToken })).status;
    });

  await T('TC-CART-13', 'Giỏ hàng', 'Giỏ trống sau khi xoá sản phẩm', '0 sản phẩm',
    v => v === 0, async () => ((await GET('/cart', { token: cusToken })).data?.items || []).length);

  await T('TC-CART-14', 'Giỏ hàng', 'Xoá nhiều sản phẩm cùng lúc', 'HTTP 200',
    v => v === 200, async () => {
      await POST('/cart/items', { token: cusToken, body: { book_id: 1, quantity: 1 } });
      await POST('/cart/items', { token: cusToken, body: { book_id: 2, quantity: 1 } });
      const cart = await GET('/cart', { token: cusToken });
      const ids = (cart.data?.items || []).map(i => i.id);
      return (await POST('/cart/items/remove', { token: cusToken, body: { ids } })).status;
    });

  await T('TC-CART-16', 'Giỏ hàng', 'Xoá nhiều sản phẩm với danh sách rỗng', 'HTTP 400',
    v => v === 400, async () => (await POST('/cart/items/remove', { token: cusToken, body: { ids: [] } })).status);

  await T('TC-CART-15', 'Giỏ hàng', 'Giỏ tách riêng theo người dùng', 'Giỏ khách khác không bị ảnh hưởng',
    v => v === true, async () => {
      await POST('/cart/items', { token: cusToken, body: { book_id: 1, quantity: 1 } });
      const empCart = await GET('/cart', { token: empToken });
      return (empCart.data?.items || []).length === 0;
    });

  await DEL('/cart/clear', { token: cusToken });

  // ========================================================= 10. ĐƠN HÀNG ==
  section('10. ĐƠN HÀNG (ORDERS) — TC-ORD');

  const S3 = await stockOf(3, adminToken);
  const S6 = await stockOf(6, adminToken);
  const S7 = await stockOf(7, adminToken);
  const S8 = await stockOf(8, adminToken);
  console.log(`${C.gray}Tồn kho gốc: sách 3 = ${S3}, sách 6 = ${S6}, sách 7 = ${S7}, sách 8 = ${S8}${C.reset}`);

  const o1 = await mkOrder([{ book_id: 3, quantity: 5 }, { book_id: 7, quantity: 3 }], { token: cusToken });
  await T('TC-ORD-01', 'Đơn hàng', 'Đặt hàng thành công', 'HTTP 201 + có mã đơn',
    v => v.status === 201 && !!v.code, async () => ({ status: o1.status, code: o1.data?.orderCode }));

  await T('TC-ORD-02', 'Đơn hàng', 'Tồn kho bị trừ NGAY khi đặt hàng', `Sách 3 giảm 5 cuốn (${S3} → ${S3 - 5})`,
    v => v === S3 - 5, async () => stockOf(3, adminToken));

  await T('TC-ORD-03', 'Đơn hàng', 'Đơn mới ở trạng thái CHỜ XÁC NHẬN', 'PENDING',
    v => v === 'PENDING', async () => (await GET(`/orders/${o1.id}`, { token: adminToken })).data?.order?.order_status);

  await T('TC-ORD-04', 'Đơn hàng', 'Xem danh sách đơn hàng', 'HTTP 200 + có dữ liệu',
    v => v.status === 200 && v.count > 0, async () => {
      const r = await GET('/orders', { token: adminToken });
      return { status: r.status, count: (r.data?.orders || []).length };
    });

  await T('TC-ORD-05', 'Đơn hàng', 'Danh sách đơn kèm thông tin tồn kho hiện tại', 'Có current_stock',
    v => v === true, async () => {
      const r = await GET('/orders', { token: adminToken });
      const ord = (r.data?.orders || []).find(o => Number(o.id) === o1.id);
      return (ord?.items || []).every(i => typeof i.current_stock === 'number');
    });

  // KHÁCH HÀNG xem danh sách đơn của CHÍNH MÌNH là hành vi đúng — API tự lọc theo
  // user_id (orderController.getOrders). Kiểm tra khách chỉ thấy đơn của mình.
  await T('TC-ORD-06', 'Đơn hàng', 'KHÁCH HÀNG chỉ thấy đơn hàng của chính mình', 'Tất cả đơn thuộc user 3',
    v => v.status === 200 && v.ok, async () => {
      const r = await GET('/orders', { token: cusToken });
      const list = r.data?.orders || [];
      return { status: r.status, ok: list.every(o => Number(o.user_id) === 3) };
    });

  // KHÁCH HÀNG không được xem đơn của người khác qua endpoint quản trị
  await T('TC-ORD-51', 'Đơn hàng', 'KHÁCH HÀNG không xem được chi tiết đơn kiểm tra', 'HTTP 403',
    v => v === 403, async () => (await GET(`/orders/${o1.id}/verification`, { token: cusToken })).status);

  await T('TC-ORD-07', 'Đơn hàng', 'Không đăng nhập không xem được đơn', 'HTTP 401',
    v => v === 401, async () => (await GET('/orders')).status);

  await T('TC-ORD-08', 'Đơn hàng', 'Kiểm tra thông tin đơn trước xác nhận', 'HTTP 200 + có checks',
    v => v.status === 200 && !!v.checks, async () => {
      const r = await GET(`/orders/${o1.id}/verification`, { token: adminToken });
      return { status: r.status, checks: r.data?.checks };
    });

  await T('TC-ORD-09', 'Đơn hàng', 'Đơn hợp lệ thì cho phép xác nhận', 'can_confirm = true',
    v => v === true, async () => (await GET(`/orders/${o1.id}/verification`, { token: adminToken })).data?.checks?.can_confirm);

  await T('TC-ORD-10', 'Đơn hàng', 'Xác nhận đơn hàng', 'HTTP 200',
    v => v === 200, async () => (await PUT(`/orders/${o1.id}/confirm`, { token: adminToken })).status);

  await T('TC-ORD-11', 'Đơn hàng', 'Đơn chuyển sang ĐÃ XÁC NHẬN', 'CONFIRMED',
    v => v === 'CONFIRMED', async () => (await GET(`/orders/${o1.id}`, { token: adminToken })).data?.order?.order_status);

  await T('TC-ORD-12', 'Đơn hàng', 'Xác nhận lại đơn đã xác nhận (bất biến)', 'HTTP 200 + đánh dấu đã xác nhận',
    v => v.status === 200 && v.already === true, async () => {
      const r = await PUT(`/orders/${o1.id}/confirm`, { token: adminToken });
      return { status: r.status, already: r.data?.already_confirmed };
    });

  await T('TC-ORD-13', 'Đơn hàng', 'Xác nhận đơn không tồn tại', 'HTTP 404',
    v => v === 404, async () => (await PUT('/orders/999999/confirm', { token: adminToken })).status);

  await T('TC-ORD-14', 'Đơn hàng', 'KHÁCH HÀNG không xác nhận được đơn', 'HTTP 403',
    v => v === 403, async () => (await PUT(`/orders/${o1.id}/confirm`, { token: cusToken })).status);

  await T('TC-ORD-15', 'Đơn hàng', 'Chuyển trạng thái sang ĐANG ĐÓNG GÓI', 'HTTP 200',
    v => v === 200, async () => (await PUT(`/orders/${o1.id}/status`, { token: adminToken, body: { order_status: 'PROCESSING' } })).status);

  await T('TC-ORD-16', 'Đơn hàng', 'Chuyển trạng thái sang ĐANG GIAO HÀNG', 'HTTP 200',
    v => v === 200, async () => (await PUT(`/orders/${o1.id}/status`, { token: adminToken, body: { order_status: 'SHIPPING' } })).status);

  await T('TC-ORD-17', 'Đơn hàng', 'Trạng thái không hợp lệ bị từ chối', 'HTTP 400',
    v => v === 400, async () => (await PUT(`/orders/${o1.id}/status`, { token: adminToken, body: { order_status: 'SAI_TRANG_THAI' } })).status);

  // Huỷ đơn
  await T('TC-ORD-18', 'Đơn hàng', 'Huỷ đơn ở trạng thái ĐANG GIAO', 'HTTP 200',
    v => v === 200, async () => (await PUT(`/orders/${o1.id}/cancel`, { token: adminToken, body: { reason: 'Khách hàng yêu cầu hủy đơn' } })).status);

  await T('TC-ORD-19', 'Đơn hàng', 'Đơn chuyển sang ĐÃ HUỶ', 'CANCELLED',
    v => v === 'CANCELLED', async () => (await GET(`/orders/${o1.id}`, { token: adminToken })).data?.order?.order_status);

  await T('TC-ORD-20', 'Đơn hàng', 'Lý do huỷ được lưu lại', 'Đúng lý do đã nhập',
    v => v === 'Khách hàng yêu cầu hủy đơn', async () => (await GET(`/orders/${o1.id}`, { token: adminToken })).data?.order?.cancel_reason);

  await T('TC-ORD-21', 'Đơn hàng', 'Thời điểm huỷ được ghi nhận', 'Có cancelled_at',
    v => !!v, async () => (await GET(`/orders/${o1.id}`, { token: adminToken })).data?.order?.cancelled_at);

  await T('TC-ORD-22', 'Đơn hàng', 'HOÀN LẠI tồn kho sách 3 (5 cuốn)', `Sách 3 về ${S3}`,
    v => v === S3, async () => stockOf(3, adminToken));

  await T('TC-ORD-23', 'Đơn hàng', 'HOÀN LẠI tồn kho sách 7 (3 cuốn)', `Sách 7 về ${S7}`,
    v => v === S7, async () => stockOf(7, adminToken));

  await T('TC-ORD-24', 'Đơn hàng', 'Huỷ đơn lần thứ hai bị từ chối', 'HTTP 400',
    v => v === 400, async () => (await PUT(`/orders/${o1.id}/cancel`, { token: adminToken, body: { reason: 'Hủy lần thứ hai' } })).status);

  await T('TC-ORD-25', 'Đơn hàng', 'Tồn kho KHÔNG bị cộng hai lần', `Sách 3 vẫn là ${S3}`,
    v => v === S3, async () => stockOf(3, adminToken));

  // Huỷ đơn đã giao
  const o2 = await mkOrder([{ book_id: 8, quantity: 2 }], { token: cusToken });
  await PUT(`/orders/${o2.id}/status`, { token: adminToken, body: { order_status: 'SHIPPING' } });
  await PUT(`/orders/${o2.id}/status`, { token: adminToken, body: { order_status: 'DELIVERED' } });

  await T('TC-ORD-26', 'Đơn hàng', 'KHÔNG huỷ được đơn đã giao thành công', 'HTTP 400',
    v => v === 400, async () => (await PUT(`/orders/${o2.id}/cancel`, { token: adminToken, body: { reason: 'Khách đổi ý muốn trả hàng' } })).status);

  await T('TC-ORD-27', 'Đơn hàng', 'Đơn đã giao giữ nguyên trạng thái', 'DELIVERED',
    v => v === 'DELIVERED', async () => (await GET(`/orders/${o2.id}`, { token: adminToken })).data?.order?.order_status);

  await T('TC-ORD-28', 'Đơn hàng', 'Không hoàn kho khi huỷ thất bại', `Sách 8 = ${S8 - 2} (đã trừ 2, chưa hoàn)`,
    v => v === S8 - 2, async () => stockOf(8, adminToken));

  await T('TC-ORD-29', 'Đơn hàng', 'Giao thành công khi chưa giao bị từ chối', 'HTTP 400',
    v => v === 400, async () => {
      const o = await mkOrder([{ book_id: 6, quantity: 1 }], { token: cusToken });
      return (await PUT(`/orders/${o.id}/status`, { token: adminToken, body: { order_status: 'DELIVERED' } })).status;
    });

  await T('TC-ORD-30', 'Đơn hàng', 'Huỷ qua API đổi trạng thái cũ bị chặn', 'HTTP 400',
    v => v === 400, async () => {
      const o = await mkOrder([{ book_id: 6, quantity: 1 }], { token: cusToken });
      return (await PUT(`/orders/${o.id}/status`, { token: adminToken, body: { order_status: 'CANCELLED' } })).status;
    });

  // Validation lý do huỷ
  await T('TC-ORD-31', 'Đơn hàng', 'Lý do huỷ rỗng bị từ chối', 'HTTP 400',
    v => v === 400, async () => {
      const o = await mkOrder([{ book_id: 6, quantity: 1 }], { token: cusToken });
      return (await PUT(`/orders/${o.id}/cancel`, { token: adminToken, body: { reason: '' } })).status;
    });

  await T('TC-ORD-32', 'Đơn hàng', 'Lý do huỷ toàn khoảng trắng bị từ chối', 'HTTP 400',
    v => v === 400, async () => {
      const o = await mkOrder([{ book_id: 6, quantity: 1 }], { token: cusToken });
      return (await PUT(`/orders/${o.id}/cancel`, { token: adminToken, body: { reason: '     ' } })).status;
    });

  await T('TC-ORD-33', 'Đơn hàng', 'Lý do huỷ 4 ký tự (dưới biên) bị từ chối', 'HTTP 400',
    v => v === 400, async () => {
      const o = await mkOrder([{ book_id: 6, quantity: 1 }], { token: cusToken });
      return (await PUT(`/orders/${o.id}/cancel`, { token: adminToken, body: { reason: 'huyy' } })).status;
    });

  await T('TC-ORD-34', 'Đơn hàng', 'Lý do huỷ đúng 5 ký tự (tại biên) được chấp nhận', 'HTTP 200',
    v => v === 200, async () => {
      const o = await mkOrder([{ book_id: 6, quantity: 1 }], { token: cusToken });
      return (await PUT(`/orders/${o.id}/cancel`, { token: adminToken, body: { reason: 'huy ne' } })).status;
    });

  await T('TC-ORD-35', 'Đơn hàng', 'Lý do huỷ 501 ký tự (vượt biên) bị từ chối', 'HTTP 400',
    v => v === 400, async () => {
      const o = await mkOrder([{ book_id: 6, quantity: 1 }], { token: cusToken });
      return (await PUT(`/orders/${o.id}/cancel`, { token: adminToken, body: { reason: 'x'.repeat(501) } })).status;
    });

  await T('TC-ORD-36', 'Đơn hàng', 'Thiếu hẳn trường lý do huỷ', 'HTTP 400',
    v => v === 400, async () => {
      const o = await mkOrder([{ book_id: 6, quantity: 1 }], { token: cusToken });
      return (await PUT(`/orders/${o.id}/cancel`, { token: adminToken, body: {} })).status;
    });

  await T('TC-ORD-37', 'Đơn hàng', 'Huỷ đơn không tồn tại', 'HTTP 404',
    v => v === 404, async () => (await PUT('/orders/999999/cancel', { token: adminToken, body: { reason: 'Đơn không tồn tại' } })).status);

  await T('TC-ORD-38', 'Đơn hàng', 'Đặt hàng không có sản phẩm', 'HTTP 400',
    v => v === 400, async () => (await POST('/orders', { token: cusToken, body: { ...SHIP, items: [] } })).status);

  await T('TC-ORD-39', 'Đơn hàng', 'Đặt hàng vượt quá tồn kho', 'HTTP 400',
    v => v === 400, async () => (await POST('/orders', {
      token: cusToken, body: { ...SHIP, items: [{ book_id: 3, quantity: 999999 }] }
    })).status);

  await T('TC-ORD-40', 'Đơn hàng', 'Đặt hàng thiếu thông tin người nhận', 'HTTP 400',
    v => v === 400, async () => (await POST('/orders', {
      token: cusToken, body: { items: [{ book_id: 1, quantity: 1 }] }
    })).status);

  await T('TC-ORD-41', 'Đơn hàng', 'Đặt hàng số lượng bằng 0', 'HTTP 400',
    v => v === 400, async () => (await POST('/orders', {
      token: cusToken, body: { ...SHIP, items: [{ book_id: 1, quantity: 0 }] }
    })).status);

  await T('TC-ORD-42', 'Đơn hàng', 'Đặt hàng với sách không tồn tại', 'HTTP 404 hoặc 400',
    v => v === 404 || v === 400, async () => (await POST('/orders', {
      token: cusToken, body: { ...SHIP, items: [{ book_id: 999999, quantity: 1 }] }
    })).status);

  // Phí vận chuyển
  await T('TC-ORD-43', 'Đơn hàng', 'Đơn dưới 200.000đ phải chịu phí 20.000đ', 'Phí = 20000',
    v => v === 20000, async () => {
      const r = await POST('/orders', {
        token: cusToken, body: { ...SHIP, items: [{ book_id: 3, quantity: 1 }] } // 25.000đ
      });
      if (r.data?.orderId) created.orders.push(Number(r.data.orderId));
      const d = await GET(`/orders/${r.data.orderId}`, { token: adminToken });
      return Number(d.data?.order?.shipping_fee);
    });

  await T('TC-ORD-44', 'Đơn hàng', 'Đơn từ 200.000đ được MIỄN phí vận chuyển', 'Phí = 0',
    v => v === 0, async () => {
      const r = await POST('/orders', {
        token: cusToken, body: { ...SHIP, items: [{ book_id: 6, quantity: 8 }] } // 8 x 28.000 = 224.000
      });
      if (r.data?.orderId) created.orders.push(Number(r.data.orderId));
      const d = await GET(`/orders/${r.data.orderId}`, { token: adminToken });
      return Number(d.data?.order?.shipping_fee);
    });

  await T('TC-ORD-45', 'Đơn hàng', 'Tổng tiền = tạm tính − giảm giá + phí ship', 'Công thức đúng',
    v => v === true, async () => {
      const r = await POST('/orders', {
        token: cusToken, body: { ...SHIP, items: [{ book_id: 3, quantity: 2 }] }
      });
      if (r.data?.orderId) created.orders.push(Number(r.data.orderId));
      const d = (await GET(`/orders/${r.data.orderId}`, { token: adminToken })).data?.order;
      const expected = Math.max(0, Number(d.subtotal) - Number(d.discount_amount) + Number(d.shipping_fee));
      return Math.abs(Number(d.total_amount) - expected) < 1;
    });

  // Hoàn tiền
  await T('TC-ORD-46', 'Đơn hàng', 'Đơn thanh toán chuyển khoản được đánh dấu ĐÃ THANH TOÁN', 'PAID',
    v => v === 'PAID', async () => {
      const o = await mkOrder([{ book_id: 7, quantity: 2 }], { token: cusToken, method: 'BANKING' });
      const d = await GET(`/orders/${o.id}`, { token: adminToken });
      return d.data?.order?.payment_status;
    });

  await T('TC-ORD-47', 'Đơn hàng', 'Huỷ đơn đã thanh toán thì đánh dấu cần hoàn tiền', 'REFUNDED',
    v => v === 'REFUNDED', async () => {
      const o = await mkOrder([{ book_id: 7, quantity: 2 }], { token: cusToken, method: 'BANKING' });
      await PUT(`/orders/${o.id}/cancel`, { token: adminToken, body: { reason: 'Khách hàng yêu cầu hủy đơn' } });
      const d = await GET(`/orders/${o.id}`, { token: adminToken });
      return d.data?.order?.payment_status;
    });

  await T('TC-ORD-48', 'Đơn hàng', 'NHÂN VIÊN huỷ được đơn hàng', 'HTTP 200',
    v => v === 200, async () => {
      const o = await mkOrder([{ book_id: 3, quantity: 1 }], { token: cusToken });
      return (await PUT(`/orders/${o.id}/cancel`, { token: empToken, body: { reason: 'Nhân viên huỷ theo yêu cầu' } })).status;
    });

  await T('TC-ORD-49', 'Đơn hàng', 'KHÁCH HÀNG không huỷ được đơn', 'HTTP 403',
    v => v === 403, async () => {
      const o = await mkOrder([{ book_id: 3, quantity: 1 }], { token: cusToken });
      return (await PUT(`/orders/${o.id}/cancel`, { token: cusToken, body: { reason: 'Khách tự huỷ đơn hàng' } })).status;
    });

  await T('TC-ORD-50', 'Đơn hàng', 'Không đăng nhập không huỷ được đơn', 'HTTP 401',
    v => v === 401, async () => {
      const o = await mkOrder([{ book_id: 3, quantity: 1 }], { token: cusToken });
      return (await PUT(`/orders/${o.id}/cancel`, { body: { reason: 'Không đăng nhập mà huỷ' } })).status;
    });

  // ====================================================== 11. QUẢN LÝ KHO ==
  section('11. QUẢN LÝ KHO (INVENTORY) — TC-INV');

  await T('TC-INV-01', 'Quản lý kho', 'Lấy danh sách tồn kho', 'HTTP 200 + có dữ liệu',
    v => v.status === 200 && v.count > 0, async () => {
      const r = await GET('/inventory', { token: adminToken });
      return { status: r.status, count: (r.data?.books || []).length };
    });

  await T('TC-INV-02', 'Quản lý kho', 'Có thống kê tổng hợp tồn kho', 'Có summary',
    v => v.status === 200 && v.hasSummary, async () => {
      const r = await GET('/inventory', { token: adminToken });
      return { status: r.status, hasSummary: !!r.data?.summary };
    });

  await T('TC-INV-03', 'Quản lý kho', 'Ngưỡng cảnh báo tồn kho = 100', 'threshold = 100',
    v => v === 100, async () => Number((await GET('/inventory', { token: adminToken })).data?.threshold));

  await T('TC-INV-04', 'Quản lý kho', 'Sách dưới ngưỡng được xếp lên đầu', 'Sách tồn thấp đứng trước',
    v => v === true, async () => {
      const r = await GET('/inventory', { token: adminToken });
      const stocks = (r.data?.books || []).map(b => Number(b.stock));
      return stocks.length > 1 && stocks[0] <= stocks[stocks.length - 1];
    });

  await T('TC-INV-05', 'Quản lý kho', 'Lọc kho theo trạng thái hết hàng', 'HTTP 200',
    v => v === 200, async () => (await GET('/inventory?status=OUT_OF_STOCK', { token: adminToken })).status);

  await T('TC-INV-06', 'Quản lý kho', 'Tồn kho theo danh mục', 'HTTP 200 + có dữ liệu',
    v => v.status === 200 && v.count > 0, async () => {
      const r = await GET('/inventory/by-category', { token: adminToken });
      return { status: r.status, count: (r.data?.categories || r.data?.items || []).length };
    });

  await T('TC-INV-07', 'Quản lý kho', 'Xem chi tiết một sách trong kho', 'HTTP 200',
    v => v.status === 200 && Number(v.id) === 3, async () => {
      const r = await GET('/inventory/3', { token: adminToken });
      return { status: r.status, id: r.data?.book?.id };
    });

  await T('TC-INV-08', 'Quản lý kho', 'Xem sách không tồn tại trong kho', 'HTTP 404',
    v => v === 404, async () => (await GET('/inventory/999999', { token: adminToken })).status);

  await T('TC-INV-09', 'Quản lý kho', 'KHÁCH HÀNG không xem được kho', 'HTTP 403',
    v => v === 403, async () => (await GET('/inventory', { token: cusToken })).status);

  await T('TC-INV-10', 'Quản lý kho', 'Nhập kho thêm số lượng', 'HTTP 200',
    v => v === 200, async () => (await POST('/inventory/3/import', {
      token: adminToken, body: { quantity: 20, import_price: 15000 }
    })).status);

  await T('TC-INV-11', 'Quản lý kho', 'Tồn kho tăng đúng sau khi nhập', `Sách 3 tăng 20 cuốn`,
    v => v === true, async () => {
      const before = await stockOf(3, adminToken);
      await POST('/inventory/3/import', { token: adminToken, body: { quantity: 10 } });
      const after = await stockOf(3, adminToken);
      return after === before + 10;
    });

  await T('TC-INV-12', 'Quản lý kho', 'Nhập kho số lượng âm bị từ chối', 'HTTP 400',
    v => v === 400, async () => (await POST('/inventory/3/import', { token: adminToken, body: { quantity: -5 } })).status);

  await T('TC-INV-13', 'Quản lý kho', 'Nhập kho số lượng 0 bị từ chối', 'HTTP 400',
    v => v === 400, async () => (await POST('/inventory/3/import', { token: adminToken, body: { quantity: 0 } })).status);

  await T('TC-INV-14', 'Quản lý kho', 'Nhập kho số lượng vượt giới hạn bị từ chối', 'HTTP 400',
    v => v === 400, async () => (await POST('/inventory/3/import', { token: adminToken, body: { quantity: 999999 } })).status);

  await T('TC-INV-15', 'Quản lý kho', 'Kiểm kê điều chỉnh tồn kho', 'HTTP 200 + có chênh lệch',
    v => v.status === 200 && v.hasDiff, async () => {
      const cur = await stockOf(3, adminToken);
      const r = await PUT('/inventory/3/stock', { token: adminToken, body: { stock: cur - 7, reason: 'Kiểm kê thực tế' } });
      return { status: r.status, hasDiff: r.data?.difference !== undefined };
    });

  await T('TC-INV-16', 'Quản lý kho', 'Chênh lệch kiểm kê tính đúng', 'Chênh lệch = −7',
    v => v === -7, async () => {
      const cur = await stockOf(3, adminToken);
      const r = await PUT('/inventory/3/stock', { token: adminToken, body: { stock: cur - 7, reason: 'Kiểm kê lại' } });
      return Number(r.data?.difference);
    });

  await T('TC-INV-17', 'Quản lý kho', 'Tồn kho cập nhật đúng số thực tế', 'Tồn = số vừa nhập',
    v => v === true, async () => {
      const cur = await stockOf(3, adminToken);
      const target = cur + 5;
      await PUT('/inventory/3/stock', { token: adminToken, body: { stock: target, reason: 'Kiểm kê tăng' } });
      return (await stockOf(3, adminToken)) === target;
    });

  await T('TC-INV-18', 'Quản lý kho', 'Kiểm kê không đổi thì báo không thay đổi', 'unchanged = true',
    v => v === true, async () => {
      const cur = await stockOf(3, adminToken);
      const r = await PUT('/inventory/3/stock', { token: adminToken, body: { stock: cur, reason: 'Nhập lại số cũ' } });
      return r.data?.unchanged === true || Number(r.data?.difference) === 0;
    });

  await T('TC-INV-19', 'Quản lý kho', 'Kiểm kê số âm bị từ chối', 'HTTP 400',
    v => v === 400, async () => (await PUT('/inventory/3/stock', { token: adminToken, body: { stock: -10 } })).status);

  await T('TC-INV-20', 'Quản lý kho', 'Kiểm kê số thập phân bị từ chối', 'HTTP 400',
    v => v === 400, async () => (await PUT('/inventory/3/stock', { token: adminToken, body: { stock: 10.5 } })).status);

  await T('TC-INV-21', 'Quản lý kho', 'Kiểm kê chữ cái bị từ chối', 'HTTP 400',
    v => v === 400, async () => (await PUT('/inventory/3/stock', { token: adminToken, body: { stock: 'abc' } })).status);

  await T('TC-INV-22', 'Quản lý kho', 'Kiểm kê số quá lớn bị từ chối', 'HTTP 400',
    v => v === 400, async () => (await PUT('/inventory/3/stock', { token: adminToken, body: { stock: 99999999 } })).status);

  await T('TC-INV-23', 'Quản lý kho', 'NHÂN VIÊN được điều chỉnh tồn kho', 'HTTP 200',
    v => v === 200, async () => {
      const cur = await stockOf(3, adminToken);
      return (await PUT('/inventory/3/stock', { token: empToken, body: { stock: cur, reason: 'Nhân viên kiểm kê' } })).status;
    });

  await T('TC-INV-24', 'Quản lý kho', 'KHÁCH HÀNG không điều chỉnh được tồn kho', 'HTTP 403',
    v => v === 403, async () => (await PUT('/inventory/3/stock', { token: cusToken, body: { stock: 10 } })).status);

  // ======================================================= 12. ĐÁNH GIÁ ==
  section('12. ĐÁNH GIÁ (REVIEWS) — TC-RVW');

  await T('TC-RVW-01', 'Đánh giá', 'Lấy đánh giá của một cuốn sách', 'HTTP 200',
    v => v === 200, async () => (await GET('/books/1/reviews')).status);

  await T('TC-RVW-02', 'Đánh giá', 'Seed có 3 đánh giá cho sách 1', 'Có ít nhất 1 đánh giá',
    v => v > 0, async () => Number((await GET('/books/1/reviews')).data?.count));

  await T('TC-RVW-03', 'Đánh giá', 'Kiểm tra quyền đánh giá sách chưa mua', 'Không đủ điều kiện',
    v => v === false, async () => {
      const r = await GET('/reviews/eligibility/12', { token: cusToken });
      return r.data?.can_review === true && r.data?.reason === undefined;
    });

  await T('TC-RVW-04', 'Đánh giá', 'Không đánh giá được sách chưa mua', 'HTTP 403 hoặc 400',
    v => v === 403 || v === 400, async () => (await POST('/reviews', {
      token: cusToken, body: { book_id: 12, rating: 5, comment: 'Sách này tôi chưa từng mua' }
    })).status);

  await T('TC-RVW-05', 'Đánh giá', 'Danh sách sách đã mua có thể đánh giá', 'HTTP 200',
    v => v === 200, async () => (await GET('/reviews/my-books', { token: cusToken })).status);

  await T('TC-RVW-06', 'Đánh giá', 'Đánh giá sách đã mua và đơn hoàn thành', 'HTTP 200 hoặc 201',
    v => v === 200 || v === 201, async () => {
      // Sách 1, 4 đã có trong đơn 1 (DELIVERED) của khách hàng
      const r = await POST('/reviews', {
        token: cusToken, body: { book_id: 4, rating: 4, comment: 'Sách kiểm thử đánh giá tự động' }
      });
      if (r.data?.reviewId || r.data?.id) created.reviews.push(Number(r.data.reviewId || r.data.id));
      return r.status;
    });

  await T('TC-RVW-07', 'Đánh giá', 'Đánh giá với số sao ngoài khoảng 1-5', 'HTTP 400',
    v => v === 400, async () => (await POST('/reviews', {
      token: cusToken, body: { book_id: 1, rating: 9, comment: 'Số sao không hợp lệ' }
    })).status);

  await T('TC-RVW-08', 'Đánh giá', 'Đánh giá với số sao bằng 0', 'HTTP 400',
    v => v === 400, async () => (await POST('/reviews', {
      token: cusToken, body: { book_id: 1, rating: 0, comment: 'Không có sao nào' }
    })).status);

  await T('TC-RVW-09', 'Đánh giá', 'Đánh giá với nội dung quá ngắn', 'HTTP 400',
    v => v === 400, async () => (await POST('/reviews', {
      token: cusToken, body: { book_id: 1, rating: 5, comment: 'ok' }
    })).status);

  await T('TC-RVW-10', 'Đánh giá', 'Không đăng nhập không đánh giá được', 'HTTP 401',
    v => v === 401, async () => (await POST('/reviews', {
      token: undefined, body: { book_id: 1, rating: 5, comment: 'Không đăng nhập mà đánh giá' }
    })).status);

  await T('TC-RVW-11', 'Đánh giá', 'Đánh giá công khai hiển thị cho mọi người', 'HTTP 200 khi không đăng nhập',
    v => v === 200, async () => (await GET('/books/1/reviews')).status);

  await T('TC-RVW-12', 'Đánh giá', 'Đánh giá sách không tồn tại', 'HTTP 404 hoặc 400',
    v => v === 404 || v === 400, async () => (await POST('/reviews', {
      token: cusToken, body: { book_id: 999999, rating: 5, comment: 'Sách không tồn tại đâu' }
    })).status);

  // ======================================================= 13. YÊU THÍCH ==
  section('13. YÊU THÍCH (WISHLIST) — TC-WSH');

  await T('TC-WSH-01', 'Yêu thích', 'Lấy danh sách yêu thích', 'HTTP 200',
    v => v === 200, async () => (await GET('/wishlist', { token: cusToken })).status);

  await T('TC-WSH-02', 'Yêu thích', 'Thêm sách vào yêu thích', 'HTTP 200',
    v => v === 200, async () => (await POST('/wishlist/toggle', { token: cusToken, body: { book_id: 2 } })).status);

  await T('TC-WSH-03', 'Yêu thích', 'Bỏ yêu thích (bấm lần hai)', 'HTTP 200',
    v => v === 200, async () => (await POST('/wishlist/toggle', { token: cusToken, body: { book_id: 2 } })).status);

  await T('TC-WSH-04', 'Yêu thích', 'Không đăng nhập không dùng được yêu thích', 'HTTP 401',
    v => v === 401, async () => (await GET('/wishlist')).status);

  await T('TC-WSH-05', 'Yêu thích', 'Yêu thích sách không tồn tại', 'HTTP 404 hoặc 400',
    v => v === 404 || v === 400, async () => (await POST('/wishlist/toggle', {
      token: cusToken, body: { book_id: 999999 }
    })).status);

  // ======================================================== 14. THỐNG KÊ ==
  section('14. THỐNG KÊ / DASHBOARD — TC-DASH');

  const stat = await GET('/admin/statistics', { token: adminToken });
  const st = stat.data || {};

  await T('TC-DASH-01', 'Thống kê', 'Lấy dữ liệu thống kê', 'HTTP 200', v => v === 200, async () => stat.status);

  await T('TC-DASH-02', 'Thống kê', 'Có số liệu tổng quan', 'Có summary',
    v => v === true, async () => !!st.summary);

  await T('TC-DASH-03', 'Thống kê', 'Tổng số sách đúng theo seed (12)', 'totalBooks = 12',
    v => v === 12, async () => Number(st.summary?.totalBooks));

  await T('TC-DASH-04', 'Thống kê', 'Tổng khách hàng khớp danh sách khách hàng', 'Khớp số liệu',
    v => v === true, async () => {
      const c = await GET('/customers', { token: adminToken });
      return Number(st.summary?.totalCustomers) === Number(c.data?.summary?.total);
    });

  await T('TC-DASH-05', 'Thống kê', 'Có biểu đồ theo ngày (30 điểm)', 'daily = 30 điểm',
    v => v === 30, async () => (st.ordersChart?.daily || []).length);

  await T('TC-DASH-06', 'Thống kê', 'Có biểu đồ theo tháng (12 điểm)', 'monthly = 12 điểm',
    v => v === 12, async () => (st.ordersChart?.monthly || []).length);

  await T('TC-DASH-07', 'Thống kê', 'Có biểu đồ theo năm (5 điểm)', 'yearly = 5 điểm',
    v => v === 5, async () => (st.ordersChart?.yearly || []).length);

  await T('TC-DASH-08', 'Thống kê', 'Doanh thu tháng khớp tổng đơn không huỷ', 'Khớp số liệu',
    v => v === true, async () => {
      const orders = (await GET('/orders', { token: adminToken })).data?.orders || [];
      const expected = orders
        .filter(o => o.order_status !== 'CANCELLED' && String(o.created_at).slice(0, 7) === new Date().toISOString().slice(0, 7))
        .reduce((s, o) => s + Number(o.total_amount), 0);
      const actual = Number(st.revenueSummary?.thisMonth || 0);
      return Math.abs(actual - expected) < 1;
    });

  await T('TC-DASH-09', 'Thống kê', 'Doanh thu theo danh mục có dữ liệu', 'Có rows',
    v => v === true, async () => (st.revenueByCategory?.rows || []).length > 0);

  await T('TC-DASH-10', 'Thống kê', 'Tổng doanh thu danh mục = tổng từng dòng', 'Khớp tổng',
    v => v === true, async () => {
      const rows = st.revenueByCategory?.rows || [];
      const sum = rows.reduce((s, r) => s + Number(r.revenue), 0);
      return Math.abs(sum - Number(st.revenueByCategory?.summary?.totalRevenue || 0)) < 1;
    });

  await T('TC-DASH-11', 'Thống kê', 'Cảnh báo tồn kho thấp dùng ngưỡng 100', 'threshold = 100',
    v => v === 100, async () => Number(st.lowStock?.threshold));

  await T('TC-DASH-12', 'Thống kê', 'KHÁCH HÀNG không xem được thống kê', 'HTTP 403',
    v => v === 403, async () => (await GET('/admin/statistics', { token: cusToken })).status);

  // ================================================= 15. PHÂN QUYỀN =======
  section('15. PHÂN QUYỀN (SECURITY) — TC-SEC');

  const protectedEndpoints = [
    ['GET', '/users'], ['GET', '/customers'], ['GET', '/admin/statistics'],
    ['GET', '/inventory'], ['GET', '/orders']
  ];

  for (let i = 0; i < protectedEndpoints.length; i++) {
    const [m, u] = protectedEndpoints[i];
    await T(`TC-SEC-0${i + 1}`, 'Phân quyền', `Không đăng nhập bị chặn ở ${m} ${u}`, 'HTTP 401',
      v => v === 401, async () => (await api(m, u)).status);
  }

  await T('TC-SEC-06', 'Phân quyền', 'KHÁCH HÀNG không vào được API quản trị', 'HTTP 403',
    v => v === 403, async () => (await GET('/admin/statistics', { token: cusToken })).status);

  await T('TC-SEC-07', 'Phân quyền', 'KHÁCH HÀNG không xem được kho', 'HTTP 403',
    v => v === 403, async () => (await GET('/inventory', { token: cusToken })).status);

  await T('TC-SEC-08', 'Phân quyền', 'KHÁCH HÀNG không quản lý được tài khoản', 'HTTP 403',
    v => v === 403, async () => (await GET('/users', { token: cusToken })).status);

  await T('TC-SEC-09', 'Phân quyền', 'NHÂN VIÊN xem được kho', 'HTTP 200',
    v => v === 200, async () => (await GET('/inventory', { token: empToken })).status);

  await T('TC-SEC-10', 'Phân quyền', 'NHÂN VIÊN xem được thống kê', 'HTTP 200',
    v => v === 200, async () => (await GET('/admin/statistics', { token: empToken })).status);

  await T('TC-SEC-11', 'Phân quyền', 'NHÂN VIÊN không quản lý được tài khoản', 'HTTP 403',
    v => v === 403, async () => (await GET('/users', { token: empToken })).status);

  await T('TC-SEC-12', 'Phân quyền', 'Token sai định dạng bị từ chối', 'HTTP 401 hoặc 403',
    v => v === 401 || v === 403, async () => (await GET('/orders', { token: 'Bearer_sai_dinh_dang' })).status);

  await T('TC-SEC-13', 'Phân quyền', 'Token rỗng bị từ chối', 'HTTP 401',
    v => v === 401, async () => (await GET('/orders', { token: '' })).status);

  await T('TC-SEC-14', 'Phân quyền', 'Header Authorization sai định dạng', 'HTTP 401 hoặc 403',
    v => v === 401 || v === 403, async () => (await GET('/orders', { headers: { Authorization: 'SaiDinhDang 123' } })).status);

  // ============================================ 16. BẢO MẬT & VALIDATE =====
  section('16. BẢO MẬT & KIỂM TRA DỮ LIỆU — TC-VAL');

  await T('TC-VAL-01', 'Bảo mật', 'Thử SQL Injection ở tham số tìm kiếm', 'Không sập, HTTP 200',
    v => v === 200, async () => (await GET("/books?q=' OR 1=1 --")).status);

  await T('TC-VAL-02', 'Bảo mật', 'SQL Injection không trả về toàn bộ dữ liệu bất thường', 'HTTP 200 và không lộ lỗi SQL',
    v => v === true, async () => {
      const r = await GET("/books?q=' UNION SELECT * FROM users --");
      const body = JSON.stringify(r.data);
      return r.status === 200 && !body.toLowerCase().includes('sql syntax');
    });

  await T('TC-VAL-03', 'Bảo mật', 'SQL Injection ở đăng nhập không vượt qua được', 'HTTP 401 hoặc 400',
    v => v === 401 || v === 400, async () => (await POST('/auth/login', {
      body: { email: "admin@kimdong.vn' OR '1'='1", password: "' OR '1'='1" }
    })).status);

  await T('TC-VAL-04', 'Bảo mật', 'Mật khẩu không bị trả về trong phản hồi', 'Không chứa password',
    v => v === true, async () => {
      const r = await POST('/auth/login', { body: { email: 'admin@kimdong.vn', password: 'admin123' } });
      const body = JSON.stringify(r.data);
      return !body.includes('password_hash') && !body.includes('$2a$') && !body.includes('$2b$');
    });

  await T('TC-VAL-05', 'Bảo mật', 'ID không phải số bị xử lý an toàn', 'Không sập (không phải 500)',
    v => v !== 500, async () => (await GET('/books/abc')).status);

  await T('TC-VAL-06', 'Bảo mật', 'Đặt hàng với ID sách dạng chữ', 'HTTP 400 hoặc 404',
    v => v === 400 || v === 404, async () => (await POST('/orders', {
      token: cusToken, body: { ...SHIP, items: [{ book_id: 'abc', quantity: 1 }] }
    })).status);

  await T('TC-VAL-07', 'Bảo mật', 'Dữ liệu số âm ở giá sách bị từ chối', 'HTTP 400',
    v => v === 400, async () => (await POST('/books', {
      token: adminToken, body: { title: 'Sách giá âm', price: -50000, category_id: 6 }
    })).status);

  await T('TC-VAL-08', 'Bảo mật', 'Email sai định dạng khi đăng ký', 'HTTP 400',
    v => v === 400, async () => (await POST('/auth/register', {
      body: { full_name: 'Email Sai', email: 'khong-phai-email', password: 'test123456' }
    })).status);

  await T('TC-VAL-09', 'Bảo mật', 'Mật khẩu quá ngắn khi đăng ký', 'HTTP 400',
    v => v === 400, async () => (await POST('/auth/register', {
      body: { full_name: 'MK Ngắn', email: `ngan_${Date.now()}@t.vn`, password: '12' }
    })).status);

  await T('TC-VAL-10', 'Bảo mật', 'Chuỗi rất dài không làm sập hệ thống', 'Không phải lỗi 500',
    v => v !== 500, async () => (await POST('/auth/login', {
      body: { email: 'a'.repeat(5000) + '@t.vn', password: 'x'.repeat(5000) }
    })).status);

  await T('TC-VAL-11', 'Bảo mật', 'Nội dung tiếng Việt được lưu đúng (không lỗi font)', 'Lưu đúng dấu tiếng Việt',
    v => v === true, async () => {
      const r = await POST('/categories', {
        token: adminToken,
        body: { name: 'Danh Mục Tiếng Việt Có Dấu', slug: `tv-${Date.now()}`, description: 'Kiểm tra dấu: ăâđêôơư' }
      });
      const id = r.data?.categoryId || r.data?.id;
      if (id) {
        created.categories.push(Number(id));
        const list = await GET('/categories');
        const found = (list.data?.categories || []).find(c => Number(c.id) === Number(id));
        return found?.name === 'Danh Mục Tiếng Việt Có Dấu';
      }
      return false;
    });

  await T('TC-VAL-12', 'Bảo mật', 'Xoá danh mục vừa tạo để dọn dẹp', 'HTTP 200',
    v => v === 200, async () => {
      const id = created.categories[created.categories.length - 1];
      return (await DEL(`/categories/${id}`, { token: adminToken })).status;
    });

  // ============================================================ DỌN DẸP ===
  section('DỌN DẸP DỮ LIỆU KIỂM THỬ');

  // Khôi phục tồn kho về đúng số ghi nhận ban đầu
  let restored = 0;
  const invNow = await GET('/inventory', { token: adminToken });
  for (const b of invNow.data.books || []) {
    const original = stockSnapshot[b.id];
    if (original !== undefined && Number(b.stock) !== original) {
      await PUT(`/inventory/${b.id}/stock`, { token: adminToken, body: { stock: original, reason: 'Khôi phục sau kiểm thử' } });
      restored++;
    }
  }
  console.log(`${C.gray}Đã khôi phục tồn kho cho ${restored} sách về số liệu gốc.${C.reset}`);

  await DEL('/cart/clear', { token: cusToken });

  // ============================================================= TỔNG KẾT ==
  const total = pass + fail;
  const rate = total ? ((pass / total) * 100).toFixed(1) : '0';

  console.log(`\n${C.bold}${'═'.repeat(64)}${C.reset}`);
  console.log(`${C.bold}  KẾT QUẢ: ${pass}/${total} đạt (${rate}%)${C.reset}`);
  console.log(`  ${C.green}Đạt: ${pass}${C.reset}   ${C.red}Không đạt: ${fail}${C.reset}`);
  console.log(`${C.bold}${'═'.repeat(64)}${C.reset}`);

  if (fail > 0) {
    console.log(`\n${C.red}${C.bold}DANH SÁCH TEST CASE KHÔNG ĐẠT:${C.reset}`);
    for (const r of results.filter(x => !x.pass)) {
      console.log(`  ${C.red}✗ ${r.code}${C.reset} [${r.module}] ${r.desc}`);
      console.log(`    ${C.gray}Mong đợi: ${r.expect}${C.reset}`);
      console.log(`    ${C.gray}Thực tế : ${r.actual}${C.reset}`);
    }
  }

  // ------------------------------------------------------ Xuất báo cáo -----
  const now = new Date().toLocaleString('vi-VN');
  const byModule = {};
  for (const r of results) {
    byModule[r.module] = byModule[r.module] || { total: 0, pass: 0 };
    byModule[r.module].total++;
    if (r.pass) byModule[r.module].pass++;
  }

  let md = `# KẾT QUẢ KIỂM THỬ API\n\n`;
  md += `**Dự án:** Website Bán Sách Trực Tuyến — NXB Kim Đồng  \n`;
  md += `**Địa chỉ API:** \`${API}\`  \n`;
  md += `**Thời điểm chạy:** ${now}  \n`;
  md += `**Công cụ:** Bộ kiểm thử tự động \`tests/api-tests.mjs\`\n\n`;
  md += `---\n\n`;
  md += `## 1. Tổng hợp kết quả\n\n`;
  md += `| Chỉ tiêu | Giá trị |\n|---|---|\n`;
  md += `| Tổng số test case | ${total} |\n`;
  md += `| Đạt | ${pass} |\n`;
  md += `| Không đạt | ${fail} |\n`;
  md += `| Tỷ lệ đạt | **${rate}%** |\n\n`;

  md += `## 2. Kết quả theo module\n\n`;
  md += `| Module | Số test case | Đạt | Không đạt | Tỷ lệ |\n|---|---|---|---|---|\n`;
  for (const [mod, s] of Object.entries(byModule)) {
    const f = s.total - s.pass;
    const pct = ((s.pass / s.total) * 100).toFixed(0);
    md += `| ${mod} | ${s.total} | ${s.pass} | ${f} | ${pct}% |\n`;
  }
  md += `| **Tổng** | **${total}** | **${pass}** | **${fail}** | **${rate}%** |\n\n`;

  md += `## 3. Chi tiết từng test case\n\n`;
  md += `| Mã TC | Module | Mô tả | Kết quả mong đợi | Kết quả thực tế | Trạng thái |\n`;
  md += `|---|---|---|---|---|---|\n`;
  for (const r of results) {
    const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
    md += `| ${r.code} | ${r.module} | ${esc(r.desc)} | ${esc(r.expect)} | ${esc(r.actual)} | ${r.pass ? '✅ Đạt' : '❌ Không đạt'} |\n`;
  }

  if (fail > 0) {
    md += `\n## 4. Danh sách lỗi phát hiện\n\n`;
    md += `| Mã lỗi | Mã TC | Module | Mô tả | Mong đợi | Thực tế | Mức độ |\n|---|---|---|---|---|---|---|\n`;
    results.filter(r => !r.pass).forEach((r, i) => {
      md += `| BUG-${String(i + 1).padStart(3, '0')} | ${r.code} | ${r.module} | ${r.desc} | ${r.expect} | ${r.actual} | Cần đánh giá |\n`;
    });
  }

  md += `\n---\n\n`;
  md += `## Ghi chú về môi trường kiểm thử\n\n`;
  md += `- Bộ kiểm thử chạy trên **database riêng** \`kimdong_bookstore_test\`, khôi phục từ \`schema.sql\` + \`seed.sql\` trước mỗi lượt chạy.\n`;
  md += `- Sau khi chạy, tồn kho được **khôi phục về số liệu gốc** để không ảnh hưởng lần chạy sau.\n`;
  md += `- Dữ liệu gốc tham chiếu: 12 sách, 3 tài khoản, 2 đơn hàng, 3 đánh giá, 2 khuyến mãi.\n`;

  fs.writeFileSync(REPORT, md, 'utf8');
  console.log(`\n${C.cyan}[BAO CAO] Da xuat: ${REPORT}${C.reset}`);

  process.exit(fail > 0 ? 1 : 0);
})().catch(err => {
  console.error(`\n${C.red}LỖI KHÔNG MONG ĐỢI:${C.reset}`, err);
  process.exit(2);
});
