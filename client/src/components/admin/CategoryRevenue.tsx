import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, TrendingUp, Package, Percent, ArrowUpDown } from 'lucide-react';
import { formatVND } from '../../utils/format';

export interface CategoryRevenueRow {
  id: number;
  name: string;
  parent_id: number | null;
  revenue: number;
  quantity: number;
  orders: number;
  cost: number;
  profit: number;
  margin: number;
  share: number;
}

export interface RevenueByCategory {
  rows: CategoryRevenueRow[];
  summary: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    totalMargin: number;
    categoryCount: number;
    totalOrders: number;
    topCategory: string | null;
    topCategoryRevenue: number;
    topCategoryShare: number;
  };
}

type SortKey = 'revenue' | 'quantity' | 'margin';

/**
 * Doanh thu theo danh mục sách.
 * Doanh thu lấy từ order_items của các đơn KHÔNG bị hủy (giá tại thời điểm mua),
 * nên tổng ở đây là tiền hàng thực tế, không gồm phí vận chuyển.
 */
export const CategoryRevenue: React.FC<{ data: RevenueByCategory | null }> = ({ data }) => {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('revenue');

  if (!data || !data.rows || data.rows.length === 0) return null;

  const { summary } = data;
  const rows = [...data.rows].sort((a, b) => {
    if (sortKey === 'quantity') return b.quantity - a.quantity;
    if (sortKey === 'margin') return b.margin - a.margin;
    return b.revenue - a.revenue;
  });
  const maxRevenue = Math.max(...rows.map((r) => r.revenue), 1);

  const sortBtn = (key: SortKey, label: string) => (
    <button
      onClick={() => setSortKey(key)}
      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${
        sortKey === key ? 'bg-white text-kimdong-red shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      <ArrowUpDown className="w-3 h-3" />
      {label}
    </button>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-kimdong-red" />
          <div>
            <h2 className="text-sm font-extrabold uppercase text-gray-800">Doanh Thu Theo Danh Mục Sách</h2>
            <p className="text-[11px] text-gray-400">
              Tiền hàng của đơn không bị hủy · {summary.categoryCount} danh mục có phát sinh
            </p>
          </div>
        </div>
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          {sortBtn('revenue', 'Doanh thu')}
          {sortBtn('quantity', 'Số lượng')}
          {sortBtn('margin', 'Lợi nhuận')}
        </div>
      </div>

      {/* Số liệu tổng hợp */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
        <div className="p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Tổng doanh thu
          </p>
          <p className="text-base font-black text-kimdong-red mt-0.5 truncate">{formatVND(summary.totalRevenue)}</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
            <Package className="w-3 h-3" /> Giá vốn hàng bán
          </p>
          <p className="text-base font-black text-gray-700 mt-0.5 truncate">{formatVND(summary.totalCost)}</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
            <Percent className="w-3 h-3" /> Lợi nhuận gộp
          </p>
          <p className="text-base font-black text-green-600 mt-0.5 truncate">
            {formatVND(summary.totalProfit)}
            <span className="text-[11px] font-bold text-gray-400 ml-1">({summary.totalMargin}%)</span>
          </p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Danh mục dẫn đầu</p>
          <p className="text-base font-black text-gray-800 mt-0.5 truncate">
            {summary.topCategory || '—'}
            {summary.topCategory && (
              <span className="text-[11px] font-bold text-gray-400 ml-1">({summary.topCategoryShare}%)</span>
            )}
          </p>
        </div>
      </div>

      {/* Bảng chi tiết */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
            <tr>
              <th className="py-3 px-5 w-8 text-center">#</th>
              <th className="py-3 px-3">Danh mục</th>
              <th className="py-3 px-3 w-[26%]">Tỷ trọng</th>
              <th className="py-3 px-3 text-right">Doanh thu</th>
              <th className="py-3 px-3 text-center">SL bán</th>
              <th className="py-3 px-3 text-center">Số đơn</th>
              <th className="py-3 px-3 text-right">Lợi nhuận</th>
              <th className="py-3 px-5 text-center">Biên LN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => {
              const isTop = i === 0 && r.revenue > 0;
              return (
                <tr
                  key={r.id}
                  onClick={() => navigate('/admin/books', { state: { search: r.name } })}
                  className="hover:bg-gray-50/60 cursor-pointer"
                  title={`Xem sách trong danh mục ${r.name}`}
                >
                  <td className="py-3 px-5 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-sm text-[10px] font-black ${
                        isTop ? 'bg-kimdong-red text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-gray-800">{r.name}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-600 to-rose-400 rounded-full"
                          style={{ width: `${Math.max(r.share, 2)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 w-10 text-right shrink-0">{r.share}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-kimdong-red whitespace-nowrap">
                    {formatVND(r.revenue)}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-gray-700">{r.quantity}</td>
                  <td className="py-3 px-3 text-center font-bold text-gray-700">{r.orders}</td>
                  <td className="py-3 px-3 text-right font-bold text-green-600 whitespace-nowrap">
                    {formatVND(r.profit)}
                  </td>
                  <td className="py-3 px-5 text-center">
                    <span
                      className={`inline-block font-black px-2 py-1 rounded-sm text-[10px] ${
                        r.margin >= 30 ? 'bg-green-50 text-green-700' : r.margin >= 15 ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {r.margin}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-100 font-black text-gray-800">
            <tr>
              <td colSpan={3} className="py-3 px-5 text-right uppercase text-[11px]">Tổng cộng</td>
              <td className="py-3 px-3 text-right text-kimdong-red whitespace-nowrap">{formatVND(summary.totalRevenue)}</td>
              <td className="py-3 px-3 text-center">{rows.reduce((s, r) => s + r.quantity, 0)}</td>
              <td className="py-3 px-3 text-center">{summary.totalOrders}</td>
              <td className="py-3 px-3 text-right text-green-600 whitespace-nowrap">{formatVND(summary.totalProfit)}</td>
              <td className="py-3 px-5 text-center text-[11px]">{summary.totalMargin}%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="px-5 py-3 text-[10px] text-gray-400 border-t border-gray-100">
        Doanh thu tính theo giá bán của từng cuốn tại thời điểm đặt hàng, không gồm phí vận chuyển và không tính đơn
        đã hủy. Vì vậy tổng ở đây là <strong>tiền hàng</strong> nên có thể thấp hơn tổng doanh thu đơn hàng ở trên
        (khoản chênh là phí ship và giảm giá của đơn). Giá vốn dựa trên giá nhập hiện tại của sách. Bấm vào một dòng
        để xem sách trong danh mục đó.
      </p>
    </div>
  );
};
