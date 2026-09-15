import { Request, Response } from 'express';
import { query, queryOne } from '../config/db.js';
import { LOW_STOCK_THRESHOLD } from '../config/constants.js';

const pad2 = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const monthKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
const yearKey = (d: Date) => String(d.getFullYear());

/** Số ngày / số tháng / số năm hiển thị trên biểu đồ */
const TREND_DAYS = 30;
const TREND_MONTHS = 12;
const TREND_YEARS = 5;

interface TrendRow {
  period: string;
  orders: number;
  cancelled: number;
  revenue: number;
}

/**
 * Điền các mốc thời gian bị thiếu (ngày/tháng không có đơn nào) bằng 0
 * để biểu đồ liền mạch thay vì nhảy cóc.
 */
function fillDailyGaps(rows: TrendRow[]): TrendRow[] {
  const map = new Map(rows.map((r) => [String(r.period), r]));
  const out: TrendRow[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    const found = map.get(key);
    out.push(
      found
        ? { ...found, period: key }
        : { period: key, orders: 0, cancelled: 0, revenue: 0 }
    );
  }
  return out;
}

function fillMonthlyGaps(rows: TrendRow[]): TrendRow[] {
  const map = new Map(rows.map((r) => [String(r.period), r]));
  const out: TrendRow[] = [];
  const base = new Date();
  base.setDate(1);
  base.setHours(0, 0, 0, 0);

  for (let i = TREND_MONTHS - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const key = monthKey(d);
    const found = map.get(key);
    out.push(
      found
        ? { ...found, period: key }
        : { period: key, orders: 0, cancelled: 0, revenue: 0 }
    );
  }
  return out;
}

function fillYearlyGaps(rows: TrendRow[]): TrendRow[] {
  const map = new Map(rows.map((r) => [String(r.period), r]));
  const out: TrendRow[] = [];
  const currentYear = new Date().getFullYear();

  for (let i = TREND_YEARS - 1; i >= 0; i--) {
    const key = String(currentYear - i);
    const found = map.get(key);
    out.push(
      found ? { ...found, period: key } : { period: key, orders: 0, cancelled: 0, revenue: 0 }
    );
  }
  return out;
}

/** Gắn nhãn hiển thị tiếng Việt cho từng mốc thời gian */
function labelDaily(period: string) {
  const [, m, d] = period.split('-');
  return `${d}/${m}`;
}
function labelMonthly(period: string) {
  const [y, m] = period.split('-');
  return `T${Number(m)}/${y.slice(2)}`;
}
function labelYearly(period: string) {
  return period;
}

/** Nhãn tiếng Việt của trạng thái đơn hàng (dùng cho tooltip biểu đồ) */
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang đóng gói',
  SHIPPING: 'Đang giao hàng',
  DELIVERED: 'Đã giao thành công',
  CANCELLED: 'Đã hủy'
};

/**
 * Chuẩn hoá mốc thời gian trả về từ MySQL.
 * `DATE(created_at)` cho ra kiểu DATE -> mysql2 trả về JS Date (không phải string),
 * nên phải tự format thay vì cắt chuỗi.
 * `byYear` dùng cho YEAR(created_at): MySQL trả về số.
 */
function toPeriodKey(value: any, byMonth: boolean, byYear = false): string {
  if (value == null) return '';
  if (byYear) return String(value).slice(0, 4);
  if (typeof value === 'string') {
    return byMonth ? value.slice(0, 7) : value.slice(0, 10);
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value).slice(0, byMonth ? 7 : 10);
  return byMonth ? monthKey(d) : dayKey(d);
}

/**
 * Biểu đồ đơn hàng theo ngày (30 ngày gần nhất) và theo tháng (12 tháng gần nhất).
 * Đếm đơn theo ngày đặt, doanh thu tính trên đơn không bị hủy.
 */
async function buildOrdersChart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - (TREND_DAYS - 1));

  const rows = (await query(
    `SELECT DATE(created_at) as period,
            COUNT(*) as orders,
            SUM(CASE WHEN order_status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
            SUM(CASE WHEN order_status != 'CANCELLED' THEN total_amount ELSE 0 END) as revenue
     FROM orders
     WHERE created_at >= ?
     GROUP BY DATE(created_at)`,
    [fromDate]
  )) as any[];

  const daily = fillDailyGaps(
    rows
      .map((r) => ({
        period: toPeriodKey(r.period, false),
        orders: Number(r.orders || 0),
        cancelled: Number(r.cancelled || 0),
        revenue: Number(r.revenue || 0)
      }))
      .filter((r) => r.period)
  ).map((r) => ({
    period: r.period,
    label: labelDaily(r.period),
    orders: r.orders,
    cancelled: r.cancelled,
    completed: r.orders - r.cancelled,
    revenue: r.revenue
  }));

  const monthRows = (await query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') as period,
            COUNT(*) as orders,
            SUM(CASE WHEN order_status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
            SUM(CASE WHEN order_status != 'CANCELLED' THEN total_amount ELSE 0 END) as revenue
     FROM orders
     GROUP BY DATE_FORMAT(created_at, '%Y-%m')`
  )) as any[];

  const monthly = fillMonthlyGaps(
    monthRows
      .map((r) => ({
        period: toPeriodKey(r.period, true),
        orders: Number(r.orders || 0),
        cancelled: Number(r.cancelled || 0),
        revenue: Number(r.revenue || 0)
      }))
      .filter((r) => r.period)
  ).map((r) => ({
    period: r.period,
    label: labelMonthly(r.period),
    orders: r.orders,
    cancelled: r.cancelled,
    completed: r.orders - r.cancelled,
    revenue: r.revenue
  }));

  const yearRows = (await query(
    `SELECT YEAR(created_at) as period,
            COUNT(*) as orders,
            SUM(CASE WHEN order_status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
            SUM(CASE WHEN order_status != 'CANCELLED' THEN total_amount ELSE 0 END) as revenue
     FROM orders
     GROUP BY YEAR(created_at)`
  )) as any[];

  const yearly = fillYearlyGaps(
    yearRows
      .map((r) => ({
        period: toPeriodKey(r.period, false, true),
        orders: Number(r.orders || 0),
        cancelled: Number(r.cancelled || 0),
        revenue: Number(r.revenue || 0)
      }))
      .filter((r) => r.period)
  ).map((r) => ({
    period: r.period,
    label: labelYearly(r.period),
    orders: r.orders,
    cancelled: r.cancelled,
    completed: r.orders - r.cancelled,
    revenue: r.revenue
  }));

  // Phân bố đơn theo trạng thái (toàn bộ, không giới hạn thời gian)
  const statusRows = (await query(
    'SELECT order_status, COUNT(*) as count FROM orders GROUP BY order_status'
  )) as any[];

  const byStatus = statusRows
    .map((r) => ({
      status: r.order_status,
      label: STATUS_LABELS[r.order_status] || r.order_status,
      count: Number(r.count || 0)
    }))
    .sort((a, b) => b.count - a.count);

  // Tổng hợp 30 ngày gần nhất
  const totalOrders30 = daily.reduce((s, d) => s + d.orders, 0);
  const totalRevenue30 = daily.reduce((s, d) => s + d.revenue, 0);
  const cancelled30 = daily.reduce((s, d) => s + d.cancelled, 0);
  const busiest = daily.reduce(
    (best, d) => (d.orders > best.orders ? d : best),
    { period: '', label: '—', orders: 0, cancelled: 0, completed: 0, revenue: 0 }
  );

  return {
    daily,
    monthly,
    yearly,
    byStatus,
    unit: 'ngày',
    summary: {
      totalOrders30,
      totalRevenue30,
      cancelled30,
      avgOrdersPerDay: Math.round((totalOrders30 / TREND_DAYS) * 10) / 10,
      busiestDay: busiest.label,
      busiestDayOrders: busiest.orders
    }
  };
}

/**
 * Doanh thu theo danh mục sách.
 * Doanh thu tính trên `order_items` (giá bán thực tế tại thời điểm đặt) của các
 * đơn KHÔNG bị hủy, quy về danh mục hiện tại của sách.
 * Sách đã bị xóa cứng khỏi bảng books sẽ được gom vào "Khác" để tổng không bị hụt.
 */
async function buildRevenueByCategory() {
  const categories = (await query(
    'SELECT id, name, parent_id FROM categories ORDER BY display_order ASC, name ASC'
  )) as any[];

  const items = (await query(
    `SELECT oi.book_id, oi.book_title, oi.quantity, oi.total_price
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE o.order_status != 'CANCELLED'`
  )) as any[];

  const bookRows = (await query(
    'SELECT id, category_id, import_price FROM books'
  )) as any[];

  const bookById = new Map(bookRows.map((b) => [Number(b.id), b]));
  const catById = new Map(categories.map((c) => [Number(c.id), c]));

  const buckets = new Map<number, { revenue: number; quantity: number; orders: Set<any>; items: number }>();
  let otherRevenue = 0;
  let otherQuantity = 0;
  let otherItems = 0;
  let totalRevenue = 0;
  let totalCost = 0;

  // Đơn không bị hủy dùng để đếm số đơn có phát sinh doanh thu ở mỗi danh mục
  const revenueOrderIds = new Set<number>();

  for (const it of items) {
    const revenue = Number(it.total_price || 0);
    totalRevenue += revenue;

    const book = bookById.get(Number(it.book_id));
    const importPrice = book ? Number(book.import_price || 0) : 0;
    totalCost += importPrice * Number(it.quantity || 0);

    const catId = book && book.category_id != null ? Number(book.category_id) : null;
    if (catId == null || !catById.has(catId)) {
      otherRevenue += revenue;
      otherQuantity += Number(it.quantity || 0);
      otherItems += 1;
      continue;
    }

    const bucket = buckets.get(catId) || { revenue: 0, quantity: 0, orders: new Set<any>(), items: 0 };
    bucket.revenue += revenue;
    bucket.quantity += Number(it.quantity || 0);
    bucket.items += 1;
    buckets.set(catId, bucket);
  }

  // Gắn order_id vào từng danh mục để đếm số đơn
  const itemOrderRows = (await query(
    `SELECT oi.book_id, oi.order_id
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE o.order_status != 'CANCELLED'`
  )) as any[];

  for (const r of itemOrderRows) {
    const book = bookById.get(Number(r.book_id));
    const catId = book && book.category_id != null ? Number(book.category_id) : null;
    if (catId == null || !catById.has(catId)) continue;
    buckets.get(catId)!.orders.add(Number(r.order_id));
    revenueOrderIds.add(Number(r.order_id));
  }

  const rows = Array.from(buckets.entries())
    .map(([catId, b]) => {
      const cat = catById.get(catId)!;
      // Giá vốn chỉ tính được cho sách còn trong bảng books
      const catItems = items.filter((it) => {
        const bk = bookById.get(Number(it.book_id));
        return bk && Number(bk.category_id) === catId;
      });
      const cost = catItems.reduce((sum, it) => {
        const bk = bookById.get(Number(it.book_id))!;
        return sum + Number(bk.import_price || 0) * Number(it.quantity || 0);
      }, 0);
      const profit = b.revenue - cost;
      return {
        id: catId,
        name: cat.name,
        parent_id: cat.parent_id ?? null,
        revenue: b.revenue,
        quantity: b.quantity,
        orders: b.orders.size,
        cost,
        profit,
        margin: b.revenue > 0 ? Math.round((profit / b.revenue) * 1000) / 10 : 0,
        share: 0
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  if (otherRevenue > 0) {
    rows.push({
      id: 0,
      name: 'Chưa xác định danh mục',
      parent_id: null,
      revenue: otherRevenue,
      quantity: otherQuantity,
      orders: 0,
      cost: 0,
      profit: otherRevenue,
      margin: otherRevenue > 0 ? 100 : 0,
      share: 0
    });
  }

  for (const r of rows) {
    r.share = totalRevenue > 0 ? Math.round((r.revenue / totalRevenue) * 1000) / 10 : 0;
  }

  const totalProfit = totalRevenue - totalCost;
  const topCategory = rows.length && rows[0].revenue > 0 ? rows[0] : null;

  return {
    rows,
    summary: {
      totalRevenue,
      totalCost,
      totalProfit,
      totalMargin: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0,
      categoryCount: rows.filter((r) => r.revenue > 0).length,
      totalOrders: revenueOrderIds.size,
      topCategory: topCategory ? topCategory.name : null,
      topCategoryRevenue: topCategory ? topCategory.revenue : 0,
      topCategoryShare: topCategory ? topCategory.share : 0
    }
  };
}

/**
 * Doanh thu theo kỳ: hôm nay / tháng này / năm nay kèm so sánh kỳ trước.
 * Chỉ tính đơn không bị hủy.
 */
async function buildRevenueSummary() {
  const rows = (await query(
    `SELECT DATE(created_at) as d, DATE_FORMAT(created_at, '%Y-%m') as m, YEAR(created_at) as y, total_amount
     FROM orders
     WHERE order_status != 'CANCELLED'`
  )) as any[];

  const now = new Date();
  const todayK = dayKey(now);
  const monthK = monthKey(now);
  const yearK = yearKey(now);

  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayK = dayKey(yesterdayDate);

  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthK = monthKey(prevMonthDate);
  const prevYearK = String(now.getFullYear() - 1);

  const sum = (predicate: (r: any) => boolean) =>
    rows.filter(predicate).reduce((s, r) => s + Number(r.total_amount || 0), 0);

  const todayRevenue = sum((r) => toPeriodKey(r.d, false) === todayK);
  const yesterdayRevenue = sum((r) => toPeriodKey(r.d, false) === yesterdayK);
  const thisMonth = sum((r) => toPeriodKey(r.m, true) === monthK);
  const lastMonth = sum((r) => toPeriodKey(r.m, true) === prevMonthK);
  const thisYear = sum((r) => toPeriodKey(r.y, false, true) === yearK);
  const lastYear = sum((r) => toPeriodKey(r.y, false, true) === prevYearK);

  const pct = (current: number, previous: number) =>
    previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null;

  // Số ngày đã trôi qua trong tháng/năm để tính trung bình mỗi ngày
  const dayOfMonth = now.getDate();
  const dayOfYear =
    Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000) || 1;

  return {
    today: todayRevenue,
    yesterday: yesterdayRevenue,
    todayGrowth: pct(todayRevenue, yesterdayRevenue),
    thisMonth,
    lastMonth,
    monthGrowth: pct(thisMonth, lastMonth),
    thisYear,
    lastYear,
    yearGrowth: pct(thisYear, lastYear),
    avgPerDayThisMonth: Math.round(thisMonth / Math.max(dayOfMonth, 1)),
    avgPerDayThisYear: Math.round(thisYear / Math.max(dayOfYear, 1)),
    labels: { today: todayK, month: monthK, year: yearK }
  };
}

export async function getStatistics(req: Request, res: Response) {
  try {
    const revenueRes = await queryOne('SELECT SUM(total_amount) as total_revenue FROM orders WHERE order_status != "CANCELLED"');
    const totalRevenue = revenueRes ? (revenueRes.total_revenue || 0) : 0;

    const ordersRes = await queryOne('SELECT COUNT(*) as count FROM orders');
    const totalOrders = ordersRes ? ordersRes.count : 0;

    const booksRes = await queryOne('SELECT COUNT(*) as count FROM books WHERE deleted_at IS NULL');
    const totalBooks = booksRes ? booksRes.count : 0;

    const customersRes = await queryOne('SELECT COUNT(*) as count FROM users WHERE role_id = 3');
    const totalCustomers = customersRes ? customersRes.count : 0;

    const recentOrders = await query('SELECT * FROM orders ORDER BY id DESC LIMIT 5');

    // Số sách theo từng danh mục (chỉ tính sách đang bán, không tính sách đã xóa mềm)
    const categories = await query('SELECT id, name, parent_id FROM categories ORDER BY display_order ASC, name ASC');
    const bookRows = await query('SELECT category_id, stock, sold_quantity FROM books WHERE deleted_at IS NULL');

    const booksByCategory = (categories as any[])
      .map((c) => {
        const own = (bookRows as any[]).filter((b) => Number(b.category_id) === Number(c.id));
        const stockTotal = own.reduce((sum, b) => sum + Number(b.stock || 0), 0);
        const soldTotal = own.reduce((sum, b) => sum + Number(b.sold_quantity || 0), 0);
        return {
          id: c.id,
          name: c.name,
          parent_id: c.parent_id ?? null,
          book_count: own.length,
          stock_total: stockTotal,
          sold_total: soldTotal
        };
      })
      .sort((a, b) => b.book_count - a.book_count);

    const topSellingBooks = await query(`
      SELECT b.id, b.title, b.sold_quantity, b.price, b.sale_price,
             (SELECT image_url FROM book_images WHERE book_id = b.id ORDER BY is_primary DESC LIMIT 1) as cover_image
      FROM books b
      WHERE b.deleted_at IS NULL
      ORDER BY b.sold_quantity DESC
      LIMIT 5
    `);

    // Cảnh báo tồn kho: sách đã hết hàng hoặc sắp hết (≤ ngưỡng)
    const lowStockBooks = await query(
      `SELECT b.id, b.title, b.slug, b.stock, b.price, b.sale_price, b.sold_quantity,
              c.name as category_name, a.name as author_name,
              (SELECT image_url FROM book_images WHERE book_id = b.id ORDER BY is_primary DESC LIMIT 1) as cover_image
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN authors a ON b.author_id = a.id
       WHERE b.deleted_at IS NULL AND b.stock <= ?
       ORDER BY b.stock ASC, b.sold_quantity DESC`,
      [LOW_STOCK_THRESHOLD]
    );

    const outOfStockCount = lowStockBooks.filter((b: any) => Number(b.stock) === 0).length;
    const lowStockCount = lowStockBooks.filter((b: any) => Number(b.stock) > 0).length;

    const ordersChart = await buildOrdersChart();
    const revenueSummary = await buildRevenueSummary();
    const revenueByCategory = await buildRevenueByCategory();

    res.json({
      summary: {
        totalRevenue,
        totalOrders,
        totalBooks,
        totalCustomers
      },
      recentOrders,
      topSellingBooks,
      booksByCategory,
      ordersChart,
      revenueSummary,
      revenueByCategory,
      monthlyRevenue: ordersChart.monthly.map((m) => ({
        month: m.label,
        revenue: m.revenue,
        orders: m.orders
      })),
      lowStock: {
        threshold: LOW_STOCK_THRESHOLD,
        outOfStockCount,
        lowStockCount,
        books: lowStockBooks
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
