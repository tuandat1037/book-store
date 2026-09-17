import React, { useEffect, useState } from 'react';
import { Search, Package, PackageX, AlertTriangle, CheckCircle2, Warehouse, RefreshCw, Eye, Plus, Wallet, TrendingUp, TrendingDown, SlidersHorizontal } from 'lucide-react';
import api from '../services/api';
import { Modal } from '../components/common/Modal';
import { formatVND, formatDate } from '../utils/format';
import { useToast } from '../context/ToastContext';

type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

interface InventoryBook {
  id: number;
  title: string;
  slug?: string;
  stock: number;
  import_price: number;
  price: number;
  sale_price?: number;
  sold_quantity: number;
  publication_year?: number;
  book_status?: string;
  updated_at?: string;
  category_name?: string;
  author_name?: string;
  publisher_name?: string;
  cover_image?: string;
  stock_status?: StockStatus;
  stock_value: number;
}

interface InventorySummary {
  totalBooks: number;
  totalStock: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
  totalSold: number;
}

/** Nhãn + màu cho từng trạng thái kho */
const STATUS_META: Record<StockStatus, { label: string; cls: string; dot: string; row: string }> = {
  OUT_OF_STOCK: { label: 'Hết hàng', cls: 'bg-red-100 text-red-600', dot: 'bg-red-500', row: 'bg-red-50/40' },
  LOW_STOCK: { label: 'Sắp hết', cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', row: '' },
  IN_STOCK: { label: 'Còn hàng', cls: 'bg-green-100 text-green-700', dot: 'bg-green-500', row: '' }
};

const FILTERS: Array<{ key: string; label: string }> = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'IN_STOCK', label: 'Còn hàng' },
  { key: 'LOW_STOCK', label: 'Sắp hết' },
  { key: 'OUT_OF_STOCK', label: 'Hết hàng' }
];

/** Trạng thái kho suy ra từ số lượng tồn (dùng chung ngưỡng với server) */
function computeStatus(book: { stock: number; stock_status?: StockStatus }, threshold: number): StockStatus {
  if (book.stock_status) return book.stock_status;
  return getStatusFromStock(book.stock, threshold);
}

/** Trạng thái kho suy ra chỉ từ một con số tồn kho */
function getStatusFromStock(stock: number, threshold: number): StockStatus {
  const value = Number(stock) || 0;
  if (value <= 0) return 'OUT_OF_STOCK';
  if (value <= threshold) return 'LOW_STOCK';
  return 'IN_STOCK';
}

export const AdminInventoryPage: React.FC = () => {
  const [books, setBooks] = useState<InventoryBook[]>([]);
  const [summary, setSummary] = useState<InventorySummary>({
    totalBooks: 0, totalStock: 0, inStockCount: 0, lowStockCount: 0, outOfStockCount: 0, totalValue: 0, totalSold: 0
  });
  const [threshold, setThreshold] = useState(100);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  // Phân trang bảng tồn kho: 10 sách / trang để không kéo dài web
  const [invPage, setInvPage] = useState(1);
  const INV_PAGE_SIZE = 10;
  const { showToast } = useToast();

  // Chi tiết kho
  const [detail, setDetail] = useState<{ book: InventoryBook; sold_from_orders: number } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Nhập kho
  const [importTarget, setImportTarget] = useState<InventoryBook | null>(null);
  const [importForm, setImportForm] = useState({ quantity: '', import_price: '' });
  const [saving, setSaving] = useState(false);

  // Điều chỉnh tồn kho (kiểm kê)
  const [adjustTarget, setAdjustTarget] = useState<InventoryBook | null>(null);
  const [adjustStockValue, setAdjustStockValue] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [savingAdjust, setSavingAdjust] = useState(false);

  const fetchInventory = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (keyword.trim()) params.set('q', keyword.trim());
    const qs = params.toString();

    api.get(`/inventory${qs ? `?${qs}` : ''}`)
      .then((res) => {
        setBooks(res.data.books || []);
        if (res.data.summary) setSummary(res.data.summary);
        if (res.data.threshold) setThreshold(res.data.threshold);
      })
      .catch((err) => {
        console.error(err);
        showToast('Không tải được dữ liệu kho', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInventory();
  }, [statusFilter]);

  // Tìm kiếm: chờ 350ms sau khi ngừng gõ mới gọi API
  useEffect(() => {
    const t = setTimeout(() => fetchInventory(), 350);
    return () => clearTimeout(t);
  }, [keyword]);

  // Đổi bộ lọc / từ khóa / dữ liệu mới -> về trang 1 để không kẹt ở trang trống
  useEffect(() => {
    setInvPage(1);
  }, [statusFilter, keyword]);

  const handleOpenDetail = async (book: InventoryBook) => {
    setDetailLoading(true);
    setDetail({ book, sold_from_orders: 0 });
    try {
      const res = await api.get(`/inventory/${book.id}`);
      setDetail({ book: res.data.book, sold_from_orders: res.data.sold_from_orders });
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Không tải được chi tiết kho', 'error');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenImport = (book: InventoryBook) => {
    setImportTarget(book);
    setImportForm({ quantity: '', import_price: String(book.import_price ?? '') });
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTarget) return;
    setSaving(true);
    try {
      const res = await api.post(`/inventory/${importTarget.id}/import`, {
        quantity: importForm.quantity,
        import_price: importForm.import_price
      });
      showToast(res.data.message || 'Đã nhập kho', 'success');
      setImportTarget(null);
      fetchInventory();
      if (detail && detail.book.id === importTarget.id) handleOpenDetail({ ...detail.book });
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi nhập kho', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAdjust = (book: InventoryBook) => {
    setAdjustTarget(book);
    setAdjustStockValue(String(book.stock));
    setAdjustReason('');
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;

    const actual = Number(adjustStockValue);
    if (adjustStockValue === '' || !Number.isFinite(actual) || actual < 0) {
      showToast('Vui lòng nhập số lượng thực tế hợp lệ', 'error');
      return;
    }

    setSavingAdjust(true);
    try {
      const res = await api.put(`/inventory/${adjustTarget.id}/stock`, {
        stock: adjustStockValue,
        reason: adjustReason
      });
      showToast(res.data.message || 'Đã điều chỉnh tồn kho', res.data.unchanged ? 'info' : 'success');
      setAdjustTarget(null);
      fetchInventory();
      if (detail && detail.book.id === adjustTarget.id) handleOpenDetail({ ...detail.book });
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi điều chỉnh tồn kho', 'error');
    } finally {
      setSavingAdjust(false);
    }
  };

  const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; tone: string; sub?: string }> = ({ icon, label, value, tone, sub }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-gray-400 uppercase">{label}</p>
        <p className="text-lg font-black text-gray-900 truncate">{value}</p>
        {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
      </div>
    </div>
  );

  const statusOf = (b: InventoryBook): StockStatus => computeStatus(b, threshold);
  const needsRestock = (b: InventoryBook) => {
    const st = statusOf(b);
    return st === 'OUT_OF_STOCK' || st === 'LOW_STOCK';
  };

  // Cắt danh sách kho theo trang (kẹp trang hợp lệ khi dữ liệu đổi)
  const invTotalPages = Math.max(1, Math.ceil(books.length / INV_PAGE_SIZE));
  const safeInvPage = Math.min(Math.max(1, invPage), invTotalPages);
  const pageBooks = books.slice((safeInvPage - 1) * INV_PAGE_SIZE, safeInvPage * INV_PAGE_SIZE);

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-kimdong-red" />
            <span>Quản Lý Kho</span>
          </h1>
          <p className="text-xs text-gray-400">
            Tồn kho hiện tại và trạng thái kho của từng đầu sách (còn hàng / sắp hết / hết hàng)
          </p>
        </div>

        <button
          onClick={fetchInventory}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 border border-gray-200 hover:border-kimdong-red hover:text-kimdong-red hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Thống kê kho */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Package className="w-5 h-5" />}
          label="Tổng đầu sách"
          value={summary.totalBooks}
          tone="bg-blue-50 text-blue-600"
          sub={`${summary.totalStock.toLocaleString('vi-VN')} cuốn trong kho`}
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Còn hàng"
          value={summary.inStockCount}
          tone="bg-green-50 text-green-600"
          sub={`Trên ${threshold} cuốn`}
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Sắp hết"
          value={summary.lowStockCount}
          tone="bg-amber-50 text-amber-600"
          sub={`Từ 1 đến ${threshold} cuốn`}
        />
        <StatCard
          icon={<PackageX className="w-5 h-5" />}
          label="Hết hàng"
          value={summary.outOfStockCount}
          tone="bg-red-50 text-kimdong-red"
          sub="Cần nhập gấp"
        />
      </div>

      {/* Giá trị kho + đã bán */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-400 uppercase">Giá trị tồn kho (theo giá nhập)</p>
            <p className="text-base font-black text-gray-900 truncate">{formatVND(summary.totalValue)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-400 uppercase">Tổng đã bán</p>
            <p className="text-base font-black text-gray-900 truncate">{summary.totalSold.toLocaleString('vi-VN')} cuốn</p>
          </div>
        </div>
      </div>

      {/* Bộ lọc + tìm kiếm */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Trạng thái kho:
          </span>
          {FILTERS.map((f) => {
            const count = f.key === 'ALL'
              ? summary.totalBooks
              : f.key === 'IN_STOCK' ? summary.inStockCount
              : f.key === 'LOW_STOCK' ? summary.lowStockCount
              : summary.outOfStockCount;
            const active = statusFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                  active
                    ? 'bg-kimdong-red text-white border-kimdong-red shadow'
                    : 'text-gray-600 border-gray-200 hover:border-kimdong-red hover:text-kimdong-red hover:bg-red-50'
                }`}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên sách, tác giả hoặc danh mục..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
          />
        </div>
      </div>

      {/* Bảng tồn kho */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-gray-400">Đang tải dữ liệu kho...</div>
        ) : books.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Package className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs text-gray-400">Không có sách nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Sách</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4">Nhà cung cấp</th>
                  <th className="py-3 px-4 text-center">Tồn kho</th>
                  <th className="py-3 px-4 text-center">Trạng thái kho</th>
                  <th className="py-3 px-4 text-center">Đã bán</th>
                  <th className="py-3 px-4 text-right">Giá trị tồn</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageBooks.map((b) => {
                  const st = statusOf(b);
                  const meta = STATUS_META[st];
                  return (
                    <tr key={b.id} className={`hover:bg-gray-50/60 ${meta.row}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {b.cover_image ? (
                            <img src={b.cover_image} alt="" className="w-9 h-11 object-contain rounded border bg-gray-50 p-0.5 shrink-0" />
                          ) : (
                            <div className="w-9 h-11 rounded border bg-gray-50 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-gray-300" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 line-clamp-2">{b.title}</p>
                            <p className="text-[10px] text-gray-400">
                              {b.author_name || 'Chưa rõ tác giả'}
                              {b.publication_year ? ` · ${b.publication_year}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{b.category_name || '—'}</td>
                      <td className="py-3 px-4 text-gray-500">{b.publisher_name || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block font-black px-2 py-1 rounded-sm text-[11px] ${
                          st === 'OUT_OF_STOCK' ? 'bg-red-100 text-red-600' : st === 'LOW_STOCK' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {b.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-sm ${meta.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          {meta.label.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-700">{(b.sold_quantity || 0).toLocaleString('vi-VN')}</td>
                      <td className="py-3 px-4 text-right font-bold text-gray-800 whitespace-nowrap">{formatVND(b.stock_value || 0)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAdjust(b)}
                            title="Kiểm kê và điều chỉnh lại số lượng tồn kho"
                            className="flex items-center gap-1 text-[11px] font-bold text-blue-600 border border-blue-200 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Điều chỉnh</span>
                          </button>
                          <button
                            onClick={() => handleOpenImport(b)}
                            title="Nhập thêm hàng vào kho"
                            className="flex items-center gap-1 text-[11px] font-bold text-kimdong-red border border-red-200 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Nhập kho</span>
                          </button>
                          <button
                            onClick={() => handleOpenDetail(b)}
                            title="Xem chi tiết kho"
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination: 10 sách / trang */}
        {!loading && invTotalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-[11px] text-gray-500">
              Hiển thị <span className="font-bold text-gray-800">{pageBooks.length}</span> / <span className="font-bold text-gray-800">{books.length}</span> sách — Trang <span className="font-bold text-kimdong-red">{safeInvPage}</span> / {invTotalPages}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                disabled={safeInvPage <= 1}
                onClick={() => setInvPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ‹ Trước
              </button>
              {Array.from({ length: invTotalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setInvPage(p)}
                  className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-colors ${
                    safeInvPage === p
                      ? 'bg-kimdong-red text-white shadow'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={safeInvPage >= invTotalPages}
                onClick={() => setInvPage((p) => Math.min(invTotalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sau ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal chi tiết kho */}
      {detail && (
        <Modal title="Chi Tiết Kho" onClose={() => setDetail(null)} maxWidth="max-w-xl">
          {detailLoading ? (
            <div className="p-8 text-center text-xs text-gray-400">Đang tải chi tiết...</div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                {detail.book.cover_image ? (
                  <img src={detail.book.cover_image} alt="" className="w-14 h-[4.5rem] object-contain rounded border bg-white p-1 shrink-0" />
                ) : (
                  <div className="w-14 h-[4.5rem] rounded border bg-white flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-gray-300" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-black text-sm text-gray-900">{detail.book.title}</p>
                  <p className="text-[11px] text-gray-400">
                    {detail.book.author_name || 'Chưa rõ tác giả'} · {detail.book.category_name || '—'}
                  </p>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-sm mt-1.5 ${STATUS_META[statusOf(detail.book)].cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[statusOf(detail.book)].dot}`} />
                    {STATUS_META[statusOf(detail.book)].label.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="border border-gray-100 rounded-lg p-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Tồn kho</p>
                  <p className="text-lg font-black text-gray-900">{detail.book.stock}</p>
                </div>
                <div className="border border-gray-100 rounded-lg p-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Đã bán</p>
                  <p className="text-lg font-black text-gray-900">{detail.book.sold_quantity || 0}</p>
                </div>
                <div className="border border-gray-100 rounded-lg p-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Giá trị tồn</p>
                  <p className="text-sm font-black text-kimdong-red pt-1">{formatVND(detail.book.stock_value || 0)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-gray-800">Thông tin kho</p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-gray-600">
                  <div className="flex justify-between gap-3">
                    <span>Giá nhập:</span>
                    <strong className="text-gray-800">{formatVND(detail.book.import_price || 0)}</strong>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Giá bán:</span>
                    <strong className="text-gray-800">{formatVND(detail.book.price || 0)}</strong>
                  </div>
                  {detail.book.sale_price ? (
                    <div className="flex justify-between gap-3">
                      <span>Giá khuyến mãi:</span>
                      <strong className="text-kimdong-red">{formatVND(detail.book.sale_price)}</strong>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-3">
                    <span>Nhà cung cấp:</span>
                    <strong className="text-gray-800">{detail.book.publisher_name || '—'}</strong>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Số bán từ đơn hàng:</span>
                    <strong className="text-gray-800">{detail.sold_from_orders} cuốn</strong>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Cập nhật gần nhất:</span>
                    <strong className="text-gray-800">{detail.book.updated_at ? formatDate(detail.book.updated_at) : '—'}</strong>
                  </div>
                </div>
              </div>

              {needsRestock(detail.book) && (
                <div className={`rounded-lg p-3 border text-[11px] flex items-start gap-2 ${
                  statusOf(detail.book) === 'OUT_OF_STOCK' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-700'
                }`}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {statusOf(detail.book) === 'OUT_OF_STOCK'
                      ? 'Sách đã hết hàng, khách không thể mua. Hãy nhập thêm ngay.'
                      : `Sách sắp hết (còn ${detail.book.stock} cuốn, ngưỡng cảnh báo ${threshold}). Nên nhập thêm.`}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { const t = detail.book; setDetail(null); handleOpenAdjust(t); }}
                  className="flex items-center gap-1.5 px-4 py-2 text-blue-600 border border-blue-200 hover:bg-blue-50 font-bold rounded-lg transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Điều chỉnh</span>
                </button>
                <button
                  type="button"
                  onClick={() => { const t = detail.book; setDetail(null); handleOpenImport(t); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold rounded-lg shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nhập kho</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetail(null)}
                  className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Modal nhập kho */}
      {importTarget && (
        <Modal title="Nhập Thêm Hàng Vào Kho" onClose={() => setImportTarget(null)}>
          <form onSubmit={handleImport} className="space-y-3 text-xs">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-bold text-gray-800">{importTarget.title}</p>
              <p className="text-[11px] text-gray-400">Tồn kho hiện tại: {importTarget.stock} cuốn</p>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Số lượng nhập thêm *</label>
              <input
                type="number"
                min={1}
                value={importForm.quantity}
                onChange={(e) => setImportForm({ ...importForm, quantity: e.target.value })}
                placeholder="VD: 100"
                required
                className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Giá nhập mới (mỗi cuốn)</label>
              <input
                type="number"
                min={0}
                value={importForm.import_price}
                onChange={(e) => setImportForm({ ...importForm, import_price: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
              />
              <p className="text-[10px] text-gray-400 mt-1">Bỏ trống để giữ nguyên giá nhập cũ.</p>
            </div>

            {Number(importForm.quantity) > 0 && (
              <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-[11px] text-green-700">
                Tồn kho sau khi nhập: <strong>{importTarget.stock + Number(importForm.quantity)} cuốn</strong>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setImportTarget(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold rounded-lg shadow disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {saving ? 'Đang nhập...' : 'Nhập Kho'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Điều chỉnh tồn kho (kiểm kê) */}
      {adjustTarget && (() => {
        const oldStock = Number(adjustTarget.stock) || 0;
        const inputVal = adjustStockValue.trim();
        const parsed = Number(inputVal);
        const valid = inputVal !== '' && Number.isFinite(parsed) && Number.isInteger(parsed) && parsed >= 0;
        const difference = valid ? parsed - oldStock : 0;
        const changed = valid && difference !== 0;

        return (
          <Modal title="Điều Chỉnh Tồn Kho" onClose={() => setAdjustTarget(null)} maxWidth="max-w-lg">
            <form onSubmit={handleAdjust} className="space-y-3 text-xs">

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-bold text-gray-800">{adjustTarget.title}</p>
                <p className="text-[11px] text-gray-400">
                  {adjustTarget.author_name || 'Chưa rõ tác giả'} · Mã sách #{adjustTarget.id}
                </p>
              </div>

              {/* Bước 1: số liệu hệ thống đang ghi nhận */}
              <div className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg p-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Tồn kho trên hệ thống</p>
                  <p className="text-lg font-black text-gray-900">{oldStock.toLocaleString('vi-VN')} cuốn</p>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-sm ${STATUS_META[statusOf(adjustTarget)].cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[statusOf(adjustTarget)].dot}`} />
                  {STATUS_META[statusOf(adjustTarget)].label.toUpperCase()}
                </span>
              </div>

              {/* Bước 2: nhập số lượng đếm thực tế */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Số lượng thực tế sau kiểm kê <span className="text-kimdong-red">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={adjustStockValue}
                    onChange={(e) => setAdjustStockValue(e.target.value)}
                    placeholder="VD: 95"
                    autoFocus
                    required
                    className="flex-1 p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustStockValue(String(oldStock))}
                    className="px-3 py-2.5 text-[11px] font-bold text-gray-600 border border-gray-200 hover:border-kimdong-red hover:text-kimdong-red hover:bg-red-50 rounded-lg whitespace-nowrap transition-colors"
                  >
                    Nhập lại số cũ
                  </button>
                </div>
                {!valid && inputVal !== '' && (
                  <p className="text-[10px] text-kimdong-red mt-1">Số lượng phải là số nguyên không âm.</p>
                )}
              </div>

              {/* Bước 3: hệ thống tính chênh lệch */}
              {valid && (
                <div
                  className={`rounded-lg p-3 border space-y-1.5 ${
                    !changed
                      ? 'bg-gray-50 border-gray-200 text-gray-600'
                      : difference > 0
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-[11px] uppercase">Chênh lệch</span>
                    <span className="text-sm font-black flex items-center gap-1">
                      {changed ? (
                        difference > 0 ? (
                          <>
                            <TrendingUp className="w-4 h-4" />+{difference} cuốn
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-4 h-4" />
                            {difference} cuốn
                          </>
                        )
                      ) : (
                        'Không đổi'
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {!changed
                      ? `Số thực tế khớp với số liệu hệ thống (${oldStock} cuốn). Nhấn lưu sẽ không thay đổi gì.`
                      : difference > 0
                      ? `Thực tế nhiều hơn hệ thống ${Math.abs(difference)} cuốn. Tồn kho sẽ cập nhật: ${oldStock} → ${parsed} cuốn.`
                      : `Thực tế ít hơn hệ thống ${Math.abs(difference)} cuốn (thất lạc / hư hỏng). Tồn kho sẽ cập nhật: ${oldStock} → ${parsed} cuốn.`}
                  </p>
                  {changed && (
                    <p className="text-[11px] pt-1.5 border-t border-black/10">
                      Trạng thái kho sau điều chỉnh:{' '}
                      <strong>{STATUS_META[getStatusFromStock(parsed, threshold)].label}</strong>
                    </p>
                  )}
                </div>
              )}

              {/* Lý do điều chỉnh */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Lý do điều chỉnh</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="VD: Kiểm kê định kỳ, phát hiện hư hỏng..."
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
                <p className="text-[10px] text-gray-400 mt-1">Không bắt buộc — dùng để ghi nhận lý do kiểm kê.</p>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setAdjustTarget(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingAdjust || !valid}
                  className="px-5 py-2 bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingAdjust ? 'Đang lưu...' : changed ? 'Xác Nhận Điều Chỉnh' : 'Lưu Tồn Kho'}
                </button>
              </div>
            </form>
          </Modal>
        );
      })()}

    </div>
  );
};
