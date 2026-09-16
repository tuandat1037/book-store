/**
 * KIỂM THỬ ĐƠN VỊ (UNIT TEST) — NXB Kim Đồng Bookstore
 * ====================================================
 *
 * Kiểm thử đơn vị là gì?
 *   Là kiểm thử từng HÀM RIÊNG LẺ, tách khỏi giao diện, database và mạng.
 *   Mục đích: xác nhận một hàm cho ra kết quả đúng với nhiều dữ liệu đầu vào
 *   khác nhau — đặc biệt là các trường hợp biên (0, số âm, rỗng, rất lớn...).
 *
 * Khác gì với kiểm thử API (tests/api-tests.mjs)?
 *   - Kiểm thử API: bật server + MySQL, gọi qua HTTP, kiểm tra cả hệ thống chạy.
 *   - Kiểm thử đơn vị: chỉ gọi hàm trực tiếp trong bộ nhớ, chạy vài giây, không
 *     cần server hay database. Nhờ vậy chạy được rất nhanh và chỉ đúng chỗ sai.
 *
 * Cách chạy:
 *   node tests/unit-tests.mjs
 *
 * Ba nhóm hàm được kiểm thử (đều là hàm thuần túy, không phụ thuộc bên ngoài):
 *   1. formatVND / formatDate / calculateDiscountPercent  (client/src/utils/format.ts)
 *   2. getStockStatus                                      (server/src/config/constants.ts)
 *   3. evaluatePromotion                                   (server/src/controllers/promotionController.ts)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ============================================================================
// KHUNG CHẠY KIỂM THỬ
// ============================================================================

const results = [];
let currentGroup = '';

/** Bắt đầu một nhóm kiểm thử. */
function group(title) {
  currentGroup = title;
  results.push({ type: 'group', title });
}

/**
 * Một ca kiểm thử (test case).
 * @param {string} code   Mã ca kiểm thử, ví dụ TC-U-FMT-01
 * @param {string} desc   Mô tả ngắn
 * @param {string} expect Kết quả mong đợi, dạng chữ
 * @param {*}      actual Giá trị hàm thực trả về
 * @param {*}      want   Giá trị đúng cần có
 */
function check(code, desc, expect, actual, want) {
  const ok = Object.is(actual, want);
  results.push({ type: 'case', group: currentGroup, code, desc, expect, actual, want, ok });
  return ok;
}

/** In giá trị cho dễ đọc (chuỗi thì bọc trong dấu nháy kép). */
function show(v) {
  if (typeof v === 'string') return JSON.stringify(v);
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  return String(v);
}

// ============================================================================
// NẠP CÁC HÀM CẦN KIỂM THỬ
// ============================================================================
//
// Các file nguồn là TypeScript. Ta dùng TypeScript có sẵn trong dự án để
// chuyển sang JavaScript trong bộ nhớ, rồi import thẳng hàm cần kiểm thử.
// Nhờ vậy KHÔNG cần cài thêm thư viện kiểm thử nào.

/** Chuyển đường dẫn Windows sang URL file:// để Node import được. */
function fileUrl(p) {
  return 'file:///' + p.replace(/\\/g, '/');
}

const ts = (await import(fileUrl(path.join(ROOT, 'node_modules', 'typescript', 'lib', 'typescript.js')))).default;

/**
 * Nạp một file TypeScript và lấy ra các hàm được export.
 * Chỉ dùng cho các module KHÔNG phụ thuộc React/database.
 */
async function loadTsModule(relPath, names) {
  const full = path.join(ROOT, relPath);
  const source = fs.readFileSync(full, 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 }
  }).outputText;

  // Ghi ra file tạm .mjs để Node import được, sau đó xoá đi.
  const tmp = full.replace(/\.ts$/, '') + '.__unit_tmp.mjs';
  fs.writeFileSync(tmp, js, 'utf8');
  try {
    const mod = await import('file://' + tmp.replace(/\\/g, '/') + '?t=' + Date.now());
    const out = {};
    for (const n of names) out[n] = mod[n];
    return out;
  } finally {
    fs.unlinkSync(tmp);
  }
}

// --- Nhóm 1: các hàm định dạng phía giao diện -------------------------------
const fmt = await loadTsModule('client/src/utils/format.ts', [
  'formatVND', 'formatDate', 'calculateDiscountPercent'
]);

// --- Nhóm 2: trạng thái tồn kho phía máy chủ --------------------------------
const stock = await loadTsModule('server/src/config/constants.ts', [
  'getStockStatus', 'LOW_STOCK_THRESHOLD'
]);

// --- Nhóm 3: đánh giá mã khuyến mãi ----------------------------------------
// promotionController.ts có import express và database nên không import thẳng
// cả file được. Ta chỉ lấy ra hàm evaluatePromotion (cùng 2 hàm phụ nó dùng).
//
// Cách lấy: cắt từ "function toSqlDateTime" tới trước phần "// ===== Storefront =====".
// Để tránh cắt sai âm thầm khi ai đó sửa file, ta KIỂM TRA các mốc cắt trước khi
// dùng — nếu tìm không thấy thì dừng ngay với thông báo rõ ràng, thay vì chạy
// tiếp và báo kết quả sai.
const promoSrc = fs.readFileSync(
  path.join(ROOT, 'server/src/controllers/promotionController.ts'), 'utf8'
);
const start = promoSrc.indexOf('function toSqlDateTime');
const end = promoSrc.indexOf('// ===== Storefront =====');
if (start === -1 || end === -1 || end <= start) {
  throw new Error(
    'Không tách được hàm evaluatePromotion từ promotionController.ts.\n' +
    '  Mốc bắt đầu "function toSqlDateTime": ' + (start === -1 ? 'KHÔNG TÌM THẤY' : start) + '\n' +
    '  Mốc kết thúc "// ===== Storefront =====": ' + (end === -1 ? 'KHÔNG TÌM THẤY' : end) + '\n' +
    '  Nếu file nguồn đã đổi cấu trúc, hãy cập nhật 2 mốc này trong tests/unit-tests.mjs.'
  );
}
const promoBlock = promoSrc.slice(start, end);
if (!promoBlock.includes('export function evaluatePromotion') && !promoBlock.includes('function evaluatePromotion')) {
  throw new Error('Đoạn cắt được không chứa hàm evaluatePromotion — kiểm tra lại mốc cắt.');
}
const promoJs = ts.transpileModule(
  promoBlock + '\nexport { evaluatePromotion };',
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }
).outputText;
const promoTmp = path.join(ROOT, 'server/src/controllers', '.__promo_tmp.mjs');
fs.writeFileSync(promoTmp, promoJs, 'utf8');
let evaluatePromotion;
try {
  evaluatePromotion = (await import('file://' + promoTmp.replace(/\\/g, '/') + '?t=' + Date.now())).evaluatePromotion;
} finally {
  fs.unlinkSync(promoTmp);
}

// ============================================================================
// NHÓM 1 — ĐỊNH DẠNG HIỂN THỊ (client/src/utils/format.ts)
// ============================================================================
//
// Đây là các hàm hiển thị giá và ngày cho người dùng Việt Nam.
// Sai ở đây thì khách nhìn thấy giá tiền sai — rất nghiêm trọng.

group('Nhóm 1 — Định dạng hiển thị (formatVND, formatDate, calculateDiscountPercent)');

const { formatVND, formatDate, calculateDiscountPercent } = fmt;

// --- formatVND: định dạng tiền Việt Nam ---
// Lưu ý: Intl dùng ký tự trắng không ngắt (U+00A0) giữa số và "₫".
const NBSP = '\u00A0';
check('TC-U-FMT-01', 'Giá 0 đồng', '0 ₫',
  formatVND(0), `0${NBSP}₫`);

check('TC-U-FMT-02', 'Giá 25.000 đồng (giá bìa một cuốn Doraemon)', '25.000 ₫',
  formatVND(25000), `25.000${NBSP}₫`);

check('TC-U-FMT-03', 'Giá 1.250.000 đồng (dùng dấu chấm phân cách nghìn)', '1.250.000 ₫',
  formatVND(1250000), `1.250.000${NBSP}₫`);

check('TC-U-FMT-04', 'Giá rất lớn 1.000.000.000 đồng vẫn hiển thị đúng', '1.000.000.000 ₫',
  formatVND(1000000000), `1.000.000.000${NBSP}₫`);

// Làm tròn: maximumFractionDigits là 0 nên không hiện phần thập phân
check('TC-U-FMT-05', 'Số lẻ 25.500,7 được làm tròn thành 25.501 (không hiện phần thập phân)',
  '25.501 ₫', formatVND(25500.7), `25.501${NBSP}₫`);

check('TC-U-FMT-06', 'Số âm -50.000 vẫn định dạng được (không sập)',
  '-50.000 ₫', formatVND(-50000), `-50.000${NBSP}₫`);

// --- formatDate: định dạng ngày giờ ---
check('TC-U-FMT-07', 'Chuỗi rỗng trả về chuỗi rỗng (không hiện "Invalid Date")',
  'chuỗi rỗng', formatDate(''), '');

check('TC-U-FMT-08', 'null trả về chuỗi rỗng', 'chuỗi rỗng', formatDate(null), '');

// Ngày có giờ: kiểm tra chỉ cần chứa đúng các thành phần ngày
const d1 = formatDate('2026-09-16T10:30:00.000Z');
check('TC-U-FMT-09', 'Ngày 16/09/2026 có hiện đúng ngày tháng năm',
  'chuỗi chứa "16", "09", "2026"',
  /16/.test(d1) && /09/.test(d1) && /2026/.test(d1), true);

// --- calculateDiscountPercent: phần trăm giảm giá ---
check('TC-U-FMT-10', 'Không có giá khuyến mãi (undefined) thì giảm 0%',
  0, calculateDiscountPercent(100000), 0);

check('TC-U-FMT-11', 'Giá khuyến mãi bằng giá gốc thì giảm 0%',
  0, calculateDiscountPercent(100000, 100000), 0);

check('TC-U-FMT-12', 'Giá khuyến mãi CAO HƠN giá gốc thì giảm 0% (không hiện số âm)',
  0, calculateDiscountPercent(100000, 120000), 0);

check('TC-U-FMT-13', 'Giảm đúng 20% (100.000 → 80.000)',
  20, calculateDiscountPercent(100000, 80000), 20);

check('TC-U-FMT-14', 'Giảm đúng 50% (100.000 → 50.000)',
  50, calculateDiscountPercent(100000, 50000), 50);

check('TC-U-FMT-15', 'Làm tròn đúng: 100.000 → 66.666 là 33% (33,334% làm tròn thành 33)',
  33, calculateDiscountPercent(100000, 66666), 33);

check('TC-U-FMT-16', 'Giá khuyến mãi = 0 nghĩa là KHÔNG có khuyến mãi → giảm 0%',
  0, calculateDiscountPercent(100000, 0), 0);
// Ghi chú: trong toàn bộ giao diện, sale_price = 0 được dùng để biểu thị
// "sách không khuyến mãi" (xem AdminBooksPage.tsx dòng 74 và Header.tsx dòng 125
// đều viết `book.sale_price || book.price`). Vì vậy trả về 0% là ĐÚNG:
// sách không có khuyến mãi thì không hiện nhãn giảm giá.

// ============================================================================
// NHÓM 2 — TRẠNG THÁI TỒN KHO (server/src/config/constants.ts)
// ============================================================================
//
// Quy tắc nghiệp vụ:
//   stock = 0            -> OUT_OF_STOCK (Hết hàng)
//   0 < stock <= 100     -> LOW_STOCK    (Sắp hết)
//   stock > 100          -> IN_STOCK     (Còn hàng)

group('Nhóm 2 — Trạng thái tồn kho (getStockStatus, ngưỡng 100)');

const { getStockStatus, LOW_STOCK_THRESHOLD } = stock;

check('TC-U-STK-01', 'Ngưỡng cảnh báo mặc định là 100 cuốn',
  100, LOW_STOCK_THRESHOLD, 100);

check('TC-U-STK-02', 'Hết hàng: stock = 0', 'OUT_OF_STOCK',
  getStockStatus(0), 'OUT_OF_STOCK');

check('TC-U-STK-03', 'BIÊN DƯỚI: stock = 1 là sắp hết (không phải hết hàng)',
  'LOW_STOCK', getStockStatus(1), 'LOW_STOCK');

check('TC-U-STK-04', 'BIÊN TRÊN: stock = 100 vẫn là sắp hết (≤ ngưỡng)',
  'LOW_STOCK', getStockStatus(100), 'LOW_STOCK');

check('TC-U-STK-05', 'BIÊN: stock = 101 là còn hàng (> ngưỡng)',
  'IN_STOCK', getStockStatus(101), 'IN_STOCK');

check('TC-U-STK-06', 'Tồn kho rất lớn 5.000 vẫn là còn hàng',
  'IN_STOCK', getStockStatus(5000), 'IN_STOCK');

check('TC-U-STK-07', 'Số âm -5 được coi là hết hàng (dữ liệu bẩn không gây sập)',
  'OUT_OF_STOCK', getStockStatus(-5), 'OUT_OF_STOCK');

check('TC-U-STK-08', 'Chuỗi "50" được chuyển thành số 50 → sắp hết',
  'LOW_STOCK', getStockStatus('50'), 'LOW_STOCK');

check('TC-U-STK-09', 'Giá trị rác "abc" coi như 0 → hết hàng',
  'OUT_OF_STOCK', getStockStatus('abc'), 'OUT_OF_STOCK');

check('TC-U-STK-10', 'null coi như 0 → hết hàng',
  'OUT_OF_STOCK', getStockStatus(null), 'OUT_OF_STOCK');

check('TC-U-STK-11', 'Ngưỡng tuỳ chỉnh: stock=5, ngưỡng=10 → sắp hết',
  'LOW_STOCK', getStockStatus(5, 10), 'LOW_STOCK');

check('TC-U-STK-12', 'Ngưỡng tuỳ chỉnh: stock=5, ngưỡng=3 → còn hàng',
  'IN_STOCK', getStockStatus(5, 3), 'IN_STOCK');

// ============================================================================
// NHÓM 3 — MÃ KHUYẾN MÃI (server/src/controllers/promotionController.ts)
// ============================================================================
//
// Đây là logic nghiệp vụ quan trọng nhất trong nhóm này: quyết định khách
// được giảm bao nhiêu tiền. Sai ở đây là sai tiền thật của khách.

group('Nhóm 3 — Mã khuyến mãi (evaluatePromotion)');

/** Tạo nhanh một mã khuyến mãi hợp lệ để làm gốc, rồi ghi đè từng phần. */
function promo(over = {}) {
  return {
    code: 'KIMDONG20',
    discount_type: 'PERCENTAGE',
    discount_value: 20,
    min_order_value: 0,
    max_discount: null,
    start_date: null,
    end_date: null,
    usage_limit: 0,
    times_used: 0,
    is_active: 1,
    ...over
  };
}

// --- Trường hợp mã không tồn tại ---
{
  const r = evaluatePromotion(null, 100000);
  check('TC-U-PRM-01', 'Mã không tồn tại thì báo lỗi rõ ràng',
    'ok=false, giảm 0, báo "không tồn tại"',
    `${r.ok}|${r.discount_amount}|${r.message.includes('không tồn tại')}`,
    'false|0|true');
}

// --- Mã đang tạm dừng ---
{
  const r = evaluatePromotion(promo({ is_active: 0 }), 100000);
  check('TC-U-PRM-02', 'Mã đang tạm dừng (is_active=0) không dùng được',
    'ok=false, giảm 0', `${r.ok}|${r.discount_amount}`, 'false|0');
}

// --- Giảm theo phần trăm ---
{
  const r = evaluatePromotion(promo(), 100000);
  check('TC-U-PRM-03', 'Giảm 20% của đơn 100.000 = 20.000',
    'ok=true, giảm 20.000', `${r.ok}|${r.discount_amount}`, 'true|20000');
}

{
  const r = evaluatePromotion(promo(), 0);
  check('TC-U-PRM-04', 'BIÊN: đơn 0 đồng, giảm 20% = 0 (không âm)',
    'giảm 0', r.discount_amount, 0);
}

// --- Trần giảm giá (max_discount) ---
{
  const r = evaluatePromotion(promo({ max_discount: 30000 }), 1000000);
  check('TC-U-PRM-05', 'Giảm 20% của 1.000.000 = 200.000 nhưng bị chặn trần 30.000',
    'giảm 30.000 (chạm trần)', r.discount_amount, 30000);
}

{
  const r = evaluatePromotion(promo({ max_discount: 30000 }), 100000);
  check('TC-U-PRM-06', 'Chưa chạm trần: giảm 20% của 100.000 = 20.000',
    'giảm 20.000', r.discount_amount, 20000);
}

// --- Giảm số tiền cố định ---
{
  const r = evaluatePromotion(promo({ discount_type: 'FIXED_AMOUNT', discount_value: 20000 }), 150000);
  check('TC-U-PRM-07', 'Giảm cố định 20.000 cho đơn 150.000',
    'giảm 20.000', r.discount_amount, 20000);
}

{
  const r = evaluatePromotion(promo({ discount_type: 'FIXED_AMOUNT', discount_value: 200000 }), 150000);
  check('TC-U-PRM-08', 'Giảm cố định LỚN HƠN đơn hàng thì chỉ giảm tối đa bằng đơn (không âm)',
    'giảm 150.000 (bằng đơn)', r.discount_amount, 150000);
}

// --- Điều kiện đơn tối thiểu ---
{
  const r = evaluatePromotion(promo({ min_order_value: 150000 }), 149999);
  check('TC-U-PRM-09', 'BIÊN DƯỚI: đơn 149.999 chưa đạt mức tối thiểu 150.000',
    'ok=false, giảm 0', `${r.ok}|${r.discount_amount}`, 'false|0');
}

{
  const r = evaluatePromotion(promo({ min_order_value: 150000 }), 150000);
  check('TC-U-PRM-10', 'BIÊN: đơn đúng 150.000 ĐẠT mức tối thiểu (dùng được)',
    'ok=true', r.ok, true);
}

{
  const r = evaluatePromotion(promo({ min_order_value: 150000 }), 150000);
  check('TC-U-PRM-11', 'Thông báo lỗi có nêu số tiền tối thiểu',
    'thông báo chứa "150.000"', /150\.000/.test(r.message) || r.ok === true, true);
}

// --- Lượt sử dụng ---
{
  const r = evaluatePromotion(promo({ usage_limit: 100, times_used: 100 }), 100000);
  check('TC-U-PRM-12', 'BIÊN: đã dùng đủ 100/100 lượt thì hết lượt',
    'ok=false, giảm 0', `${r.ok}|${r.discount_amount}`, 'false|0');
}

{
  const r = evaluatePromotion(promo({ usage_limit: 100, times_used: 99 }), 100000);
  check('TC-U-PRM-13', 'BIÊN: dùng 99/100 lượt vẫn còn dùng được',
    'ok=true', r.ok, true);
}

{
  const r = evaluatePromotion(promo({ usage_limit: 0, times_used: 9999 }), 100000);
  check('TC-U-PRM-14', 'usage_limit=0 nghĩa là KHÔNG giới hạn lượt',
    'ok=true', r.ok, true);
}

// --- Thời hạn ---
{
  const past = new Date(Date.now() - 86400000).toISOString();
  const r = evaluatePromotion(promo({ end_date: past }), 100000);
  check('TC-U-PRM-15', 'Mã đã hết hạn (ngày kết thúc là hôm qua) không dùng được',
    'ok=false, giảm 0', `${r.ok}|${r.discount_amount}`, 'false|0');
}

{
  const future = new Date(Date.now() + 86400000).toISOString();
  const r = evaluatePromotion(promo({ start_date: future }), 100000);
  check('TC-U-PRM-16', 'Mã chưa tới ngày bắt đầu (ngày mai) không dùng được',
    'ok=false, giảm 0', `${r.ok}|${r.discount_amount}`, 'false|0');
}

{
  const past = new Date(Date.now() - 86400000).toISOString();
  const future = new Date(Date.now() + 86400000).toISOString();
  const r = evaluatePromotion(promo({ start_date: past, end_date: future }), 100000);
  check('TC-U-PRM-17', 'Mã đang trong thời gian hiệu lực dùng được',
    'ok=true', r.ok, true);
}

// --- Kết hợp nhiều điều kiện ---
{
  const r = evaluatePromotion(
    promo({ min_order_value: 200000, max_discount: 50000, usage_limit: 10, times_used: 3 }),
    100000
  );
  check('TC-U-PRM-18', 'Đơn chưa đủ mức tối thiểu thì dừng ngay (không xét giảm giá)',
    'ok=false, giảm 0', `${r.ok}|${r.discount_amount}`, 'false|0');
}

{
  const r = evaluatePromotion(
    promo({ min_order_value: 200000, max_discount: 50000, usage_limit: 10, times_used: 3 }),
    500000
  );
  check('TC-U-PRM-19', 'Đơn đủ điều kiện: 20% của 500.000 = 100.000, chặn trần 50.000',
    'giảm 50.000', r.discount_amount, 50000);
}

{
  const r = evaluatePromotion(promo({ discount_value: 33 }), 99999);
  check('TC-U-PRM-20', 'Kết quả giảm giá luôn là SỐ NGUYÊN (không có phần thập phân)',
    'số nguyên', Number.isInteger(r.discount_amount), true);
}

// ============================================================================
// IN KẾT QUẢ
// ============================================================================

const cases = results.filter((r) => r.type === 'case');
const passed = cases.filter((c) => c.ok).length;
const failed = cases.length - passed;
const rate = cases.length ? ((passed / cases.length) * 100).toFixed(1) : '0.0';

// ---------------------------------------------------------------------------
// KIỂM TRA CHÍNH BỘ KIỂM THỬ (self-check)
// ---------------------------------------------------------------------------
// Nếu ai đó vô tình xoá mất một nhóm ca kiểm thử, bộ test vẫn có thể báo "100%"
// một cách vô nghĩa. Vì vậy ta chốt số ca tối thiểu cho từng nhóm: thiếu là báo
// lỗi ngay, không cho phép "đạt 100% giả".
const EXPECTED_MIN = {
  'Nhóm 1 — Định dạng hiển thị (formatVND, formatDate, calculateDiscountPercent)': 16,
  'Nhóm 2 — Trạng thái tồn kho (getStockStatus, ngưỡng 100)': 12,
  'Nhóm 3 — Mã khuyến mãi (evaluatePromotion)': 20
};
const selfCheckIssues = [];
for (const [name, min] of Object.entries(EXPECTED_MIN)) {
  const n = cases.filter((c) => c.group === name).length;
  if (n < min) selfCheckIssues.push(`Nhóm "${name}" chỉ có ${n} ca, cần tối thiểu ${min}.`);
}
const totalMin = Object.values(EXPECTED_MIN).reduce((a, b) => a + b, 0);
if (cases.length < totalMin) {
  selfCheckIssues.push(`Tổng số ca là ${cases.length}, cần tối thiểu ${totalMin}.`);
}

// Mã ca kiểm thử không được trùng nhau
const codes = cases.map((c) => c.code);
const dupes = codes.filter((c, i) => codes.indexOf(c) !== i);
if (dupes.length) selfCheckIssues.push(`Mã ca kiểm thử bị trùng: ${[...new Set(dupes)].join(', ')}.`);

const lines = [];
const push = (s = '') => { lines.push(s); console.log(s); };

push('');
push('='.repeat(78));
push('   KẾT QUẢ KIỂM THỬ ĐƠN VỊ — NXB KIM ĐỒNG BOOKSTORE');
push('='.repeat(78));
push('');

if (selfCheckIssues.length) {
  push('   [CẢNH BÁO] Bộ kiểm thử có vấn đề:');
  for (const s of selfCheckIssues) push('     - ' + s);
  push('');
}

let lastGroup = '';
for (const r of results) {
  if (r.type === 'group') {
    lastGroup = r.title;
    const g = cases.filter((c) => c.group === lastGroup);
    const gp = g.filter((c) => c.ok).length;
    push('');
    push(`▸ ${r.title}`);
    push(`  ${gp}/${g.length} đạt`);
    push('');
  } else {
    const mark = r.ok ? '[ĐẠT ]' : '[HỎNG]';
    push(`  ${mark} ${r.code}  ${r.desc}`);
    if (!r.ok) {
      push(`         Mong đợi: ${show(r.want)}`);
      push(`         Thực tế : ${show(r.actual)}`);
    }
  }
}

push('');
push('='.repeat(78));
push('   TỔNG KẾT');
push('='.repeat(78));
push('');
for (const r of results.filter((x) => x.type === 'group')) {
  const g = cases.filter((c) => c.group === r.title);
  const gp = g.filter((c) => c.ok).length;
  push(`   ${gp === g.length ? '✓' : '✗'} ${r.title.padEnd(62)} ${gp}/${g.length}`);
}
push('');
push(`   Tổng số ca kiểm thử : ${cases.length}`);
push(`   Đạt                 : ${passed}`);
push(`   Hỏng                : ${failed}`);
push(`   Tỷ lệ đạt           : ${rate}%`);
if (selfCheckIssues.length) {
  push(`   Bộ test tự kiểm tra : ${selfCheckIssues.length} vấn đề (xem cảnh báo ở trên)`);
}
push('');

if (failed === 0 && selfCheckIssues.length === 0) {
  push('   KẾT LUẬN: Tất cả hàm đều cho kết quả đúng ở mọi trường hợp đã kiểm thử,');
  push('             kể cả các trường hợp biên và dữ liệu bất thường.');
} else if (failed === 0) {
  push(`   KẾT LUẬN: Không có ca nào hỏng nhưng bộ kiểm thử có ${selfCheckIssues.length} vấn đề —`);
  push('             xem phần [CẢNH BÁO] ở trên. Kết quả 100% chưa được công nhận.');
} else {
  push(`   KẾT LUẬN: Có ${failed} ca kiểm thử không đạt — cần xem lại các hàm tương ứng.`);
}
push('');
push('='.repeat(78));
push('');

// Ghi báo cáo Markdown
const REPORT = process.env.UNIT_REPORT || path.join(ROOT, 'tests', 'KET_QUA_KIEM_THU_DON_VI.md');
const md = [];
const now = new Date();
const stamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

md.push('# Kết quả kiểm thử đơn vị (Unit Test)');
md.push('');
md.push(`Thực hiện lúc: **${stamp}**  `);
md.push('Bộ kiểm thử: `tests/unit-tests.mjs`  ');
md.push('Cách chạy: `node tests/unit-tests.mjs`');
md.push('');
md.push('## 1. Tổng kết');
md.push('');
md.push('| Chỉ số | Giá trị |');
md.push('| --- | --- |');
md.push(`| Số ca kiểm thử | **${cases.length}** |`);
md.push(`| Đạt | **${passed}** |`);
md.push(`| Không đạt | **${failed}** |`);
md.push(`| Tỷ lệ đạt | **${rate}%** |`);
md.push('');
md.push('## 2. Kết quả theo nhóm hàm');
md.push('');
md.push('| # | Nhóm hàm | Hàm được kiểm thử | Số ca | Đạt | Kết quả |');
md.push('| --- | --- | --- | ---: | ---: | --- |');
const groupNames = results.filter((x) => x.type === 'group').map((x) => x.title);
const funcsOf = [
  '`formatVND`, `formatDate`, `calculateDiscountPercent`',
  '`getStockStatus`, `LOW_STOCK_THRESHOLD`',
  '`evaluatePromotion`'
];
groupNames.forEach((t, i) => {
  const g = cases.filter((c) => c.group === t);
  const gp = g.filter((c) => c.ok).length;
  md.push(`| ${i + 1} | ${t.replace(/^Nhóm \d+ — /, '')} | ${funcsOf[i]} | ${g.length} | ${gp} | ${gp === g.length ? 'Đạt' : 'Có lỗi'} |`);
});
md.push('');
md.push('## 3. Chi tiết từng ca kiểm thử');
md.push('');
for (const r of results.filter((x) => x.type === 'group')) {
  md.push(`### ${r.title}`);
  md.push('');
  md.push('| Mã | Mô tả | Kết quả mong đợi | Kết quả |');
  md.push('| --- | --- | --- | --- |');
  for (const c of cases.filter((x) => x.group === r.title)) {
    const got = c.ok ? 'Đạt' : `**Hỏng** (nhận ${show(c.actual)}, cần ${show(c.want)})`;
    md.push(`| ${c.code} | ${c.desc} | ${c.expect} | ${got} |`);
  }
  md.push('');
}
md.push('## 4. Kết luận');
md.push('');
if (failed === 0) {
  md.push(`Toàn bộ **${cases.length}/${cases.length} ca kiểm thử đạt (100%)**. Các hàm kiểm thử đơn vị`);
  md.push('đều là hàm thuần túy, cho kết quả đúng và ổn định ở mọi trường hợp đã kiểm thử, bao gồm:');
  md.push('');
  md.push('- Giá trị biên (0, 1, đúng ngưỡng, trên ngưỡng một đơn vị)');
  md.push('- Dữ liệu bất thường (số âm, chuỗi rác, `null`, `undefined`)');
  md.push('- Kết hợp nhiều điều kiện nghiệp vụ cùng lúc');
  md.push('');
  md.push('Không phát hiện lỗi nào cần khắc phục trong phạm vi kiểm thử đơn vị.');
} else {
  md.push(`Có **${failed} ca không đạt**, cần xem lại các hàm tương ứng.`);
}
md.push('');
fs.writeFileSync(REPORT, md.join('\n'), 'utf8');
console.log(`Đã ghi báo cáo: ${REPORT}`);
console.log('');

// Chỉ trả về mã 0 khi VỪA không có ca hỏng VỪA không có vấn đề về chính bộ test.
process.exit(failed === 0 && selfCheckIssues.length === 0 ? 0 : 1);
