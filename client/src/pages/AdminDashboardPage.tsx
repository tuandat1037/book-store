import React, { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, BookOpen, Users, TrendingUp, ArrowUpRight, CheckCircle2, AlertTriangle, PackageX, RefreshCw, Layers, Warehouse } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatVND, formatDate } from '../utils/format';
import { Order, Book } from '../types';
import { OrdersChart, OrdersChartData } from '../components/admin/OrdersChart';
import { RevenueCards, RevenueSummary } from '../components/admin/RevenueCards';
import { CategoryRevenue, RevenueByCategory } from '../components/admin/CategoryRevenue';

interface LowStockBook {
  id: number;
  title: string;
  slug?: string;
  stock: number;
  price: number;
  sale_price?: number;
  sold_quantity?: number;
  category_name?: string;
  author_name?: string;
  cover_image?: string;
}

interface CategoryBookStat {
  id: number;
  name: string;
  parent_id?: number | null;
  book_count: number;
  stock_total: number;
  sold_total: number;
}

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<{
    summary: {
      totalRevenue: number;
      totalOrders: number;
      totalBooks: number;
      totalCustomers: number;
    };
    recentOrders: Order[];
    topSellingBooks: Book[];
    booksByCategory: CategoryBookStat[];
    ordersChart?: OrdersChartData | null;
    revenueSummary?: RevenueSummary | null;
    revenueByCategory?: RevenueByCategory | null;
    monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>;
    lowStock: {
      threshold: number;
      outOfStockCount: number;
      lowStockCount: number;
      books: LowStockBook[];
    };
  }>({
    summary: { totalRevenue: 0, totalOrders: 0, totalBooks: 0, totalCustomers: 0 },
    recentOrders: [],
    topSellingBooks: [],
    booksByCategory: [],
    ordersChart: null,
    revenueSummary: null,
    revenueByCategory: null,
    monthlyRevenue: [],
    lowStock: { threshold: 10, outOfStockCount: 0, lowStockCount: 0, books: [] }
  });

  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    api.get('/admin/statistics')
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-gray-200 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { summary, recentOrders, topSellingBooks, booksByCategory, ordersChart, revenueSummary, revenueByCategory, lowStock } = stats;
  const alertCount = (lowStock?.outOfStockCount || 0) + (lowStock?.lowStockCount || 0);

  /**
   * Tăng trưởng so với tháng trước, tính từ dữ liệu thật.
   * Trả về null khi tháng trước không có số liệu (không đủ cơ sở để so sánh).
   */
  const growth = (get: (p: { orders: number; revenue: number }) => number) => {
    const months = ordersChart?.monthly || [];
    if (months.length < 2) return null;
    const current = get(months[months.length - 1]);
    const previous = get(months[months.length - 2]);
    if (!previous) return null;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  };

  const revenueGrowth = growth((p) => Number(p.revenue || 0));
  const ordersGrowth = growth((p) => Number(p.orders || 0));

  const GrowthBadge = (value: number | null) => {
    if (value === null) {
      return <span className="text-[10px] font-bold text-gray-400 mt-1 block">Chưa đủ dữ liệu so sánh</span>;
    }
    const up = value >= 0;
    return (
      <span className={`text-[10px] font-bold flex items-center gap-0.5 mt-1 ${up ? 'text-green-600' : 'text-red-600'}`}>
        <TrendingUp className={`w-3 h-3 ${up ? '' : 'rotate-180'}`} />
        {up ? '+' : ''}{value}% so với tháng trước
      </span>
    );
  };

  // Danh mục có sách + tổng số sách đang hoạt động (để đối chiếu với thẻ "Sản Phẩm Sách")
  const catStats = booksByCategory || [];
  const categoriesWithBooks = catStats.filter((c) => c.book_count > 0);
  const bookCountFromCategories = catStats.reduce((sum, c) => sum + Number(c.book_count || 0), 0);
  const maxCatBooks = Math.max(...catStats.map((c) => Number(c.book_count || 0)), 1);

  return (
    <div className="space-y-8">
      
      <div>
        <h1 className="text-xl font-black text-gray-900">Tổng Quan Báo Cáo Admin</h1>
        <p className="text-xs text-gray-400">Thống kê doanh thu, đơn hàng và danh mục sách NXB Kim Đồng</p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase">Doanh Thu</span>
            <h3 className="text-xl font-black text-gray-900 mt-1">{formatVND(summary.totalRevenue)}</h3>
            {GrowthBadge(revenueGrowth)}
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-kimdong-red flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase">Tổng Đơn Hàng</span>
            <h3 className="text-xl font-black text-gray-900 mt-1">{summary.totalOrders}</h3>
            {GrowthBadge(ordersGrowth)}
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase">Sản Phẩm Sách</span>
            <h3 className="text-xl font-black text-gray-900 mt-1">{summary.totalBooks}</h3>
            <span className="text-[10px] font-bold text-gray-400 mt-1 block">Đang hoạt động</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase">Khách Hàng</span>
            <h3 className="text-xl font-black text-gray-900 mt-1">{summary.totalCustomers}</h3>
            <span className="text-[10px] font-bold text-gray-400 mt-1 block">Tài khoản khách hàng</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Cảnh báo sách sắp hết hàng */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${alertCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
              {alertCount > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-extrabold uppercase text-gray-800">Cảnh Báo Tồn Kho</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Sách còn từ {lowStock?.threshold ?? 10} cuốn trở xuống cần nhập thêm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {lowStock?.outOfStockCount > 0 && (
              <span className="text-[11px] font-bold bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                <PackageX className="w-3.5 h-3.5" />
                {lowStock.outOfStockCount} hết hàng
              </span>
            )}
            {lowStock?.lowStockCount > 0 && (
              <span className="text-[11px] font-bold bg-amber-50 text-amber-600 px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {lowStock.lowStockCount} sắp hết
              </span>
            )}
            <button
              onClick={() => navigate('/admin/inventory')}
              className="text-[11px] font-bold text-gray-700 border border-gray-200 hover:border-kimdong-red hover:text-white hover:bg-kimdong-red px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Warehouse className="w-3.5 h-3.5" />
              <span>Quản lý kho</span>
            </button>
            <button
              onClick={fetchStats}
              title="Tải lại cảnh báo tồn kho"
              className="p-2 text-gray-500 border border-gray-200 hover:border-kimdong-red hover:text-kimdong-red hover:bg-red-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {alertCount === 0 ? (
          <div className="p-8 text-center space-y-1">
            <CheckCircle2 className="w-7 h-7 text-green-500 mx-auto" />
            <p className="text-xs font-bold text-gray-600">Tồn kho đang ổn định</p>
            <p className="text-[11px] text-gray-400">Không có cuốn sách nào dưới ngưỡng cảnh báo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-6">Sách</th>
                  <th className="py-3 px-4">Thể loại</th>
                  <th className="py-3 px-4 text-center">Tồn kho</th>
                  <th className="py-3 px-4 text-center">Đã bán</th>
                  <th className="py-3 px-6 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lowStock.books.map((book) => {
                  const isOut = Number(book.stock) === 0;
                  return (
                    <tr key={book.id} className={isOut ? 'bg-red-50/40' : 'hover:bg-gray-50/60'}>
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          {book.cover_image ? (
                            <img src={book.cover_image} alt="" className="w-9 h-11 object-contain rounded border bg-gray-50 p-0.5 shrink-0" />
                          ) : (
                            <div className="w-9 h-11 rounded border bg-gray-50 flex items-center justify-center shrink-0">
                              <BookOpen className="w-4 h-4 text-gray-300" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 line-clamp-2">{book.title}</p>
                            <p className="text-[10px] text-gray-400">{book.author_name || 'Chưa rõ tác giả'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{book.category_name || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block font-black px-2 py-1 rounded-sm text-[11px] ${isOut ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                          {book.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-700">{book.sold_quantity || 0}</td>
                      <td className="py-3 px-6 text-right">
                        <button
                          onClick={() => navigate('/admin/books', { state: { search: book.title } })}
                          className="text-[11px] font-bold text-gray-700 border border-gray-200 hover:border-kimdong-red hover:text-white hover:bg-kimdong-red px-3 py-2 rounded-lg transition-colors"
                        >
                          Nhập thêm
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Số sách theo danh mục */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold uppercase text-gray-800">Sách Theo Danh Mục</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Phân bổ {bookCountFromCategories} cuốn sách đang hoạt động trên {categoriesWithBooks.length} danh mục
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold bg-gray-50 text-gray-600 px-2.5 py-1.5 rounded-lg shrink-0">
            {catStats.length} danh mục
          </span>
        </div>

        {categoriesWithBooks.length === 0 ? (
          <div className="p-8 text-center space-y-1">
            <Layers className="w-7 h-7 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-600">Chưa có sách trong danh mục nào</p>
            <p className="text-[11px] text-gray-400">Thêm sách và gán danh mục để xem thống kê tại đây.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-6">Danh mục</th>
                  <th className="py-3 px-4 w-[34%]">Tỷ lệ</th>
                  <th className="py-3 px-4 text-center">Số sách</th>
                  <th className="py-3 px-4 text-center">Tồn kho</th>
                  <th className="py-3 px-6 text-center">Đã bán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categoriesWithBooks.map((c) => {
                  const pct = Math.round((Number(c.book_count || 0) / maxCatBooks) * 100);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate('/admin/books', { state: { search: c.name } })}
                      className="hover:bg-gray-50/60 cursor-pointer"
                      title={`Xem sách trong danh mục ${c.name}`}
                    >
                      <td className="py-3 px-6 font-bold text-gray-800">{c.name}</td>
                      <td className="py-3 px-4">
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-red-600 to-rose-400 rounded-full" style={{ width: `${Math.max(pct, 4)}%` }} />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block font-black px-2 py-1 rounded-sm text-[11px] bg-red-50 text-kimdong-red">
                          {c.book_count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-700">{c.stock_total}</td>
                      <td className="py-3 px-6 text-center font-bold text-gray-700">{c.sold_total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Doanh thu theo ngày / tháng / năm */}
      <RevenueCards data={revenueSummary ?? null} />

      {/* Biểu đồ doanh thu theo ngày / tháng / năm */}
      <OrdersChart data={ordersChart ?? null} />

      {/* Doanh thu theo danh mục sách */}
      <CategoryRevenue data={revenueByCategory ?? null} />

      {/* Tables: Recent Orders & Top Bestselling Books */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Orders */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase text-gray-800 border-b border-gray-100 pb-3">
            Đơn Hàng Gần Đây
          </h2>

          <div className="divide-y divide-gray-100">
            {recentOrders.map((ord) => (
              <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-kimdong-red">#{ord.order_code}</p>
                  <p className="text-gray-500">{ord.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatVND(ord.total_amount)}</p>
                  <span className="text-[10px] text-gray-400">{ord.order_status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Bestselling Books */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase text-gray-800 border-b border-gray-100 pb-3">
            Sách Bán Chạy Nhất
          </h2>

          <div className="divide-y divide-gray-100">
            {topSellingBooks.map((book) => (
              <div key={book.id} className="py-3 flex items-center gap-3 text-xs">
                <img src={book.cover_image} alt="" className="w-10 h-12 object-contain rounded border bg-gray-50 p-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{book.title}</p>
                  <p className="text-[11px] text-gray-400">Đã bán: <strong className="text-kimdong-red">{book.sold_quantity}</strong> cuốn</p>
                </div>
                <span className="font-bold text-gray-900 shrink-0">{formatVND(book.sale_price || book.price)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
