import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Power, Tag, Ticket, Clock, Search, TrendingUp } from 'lucide-react';
import api from '../services/api';
import { Promotion } from '../types';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import { formatVND } from '../utils/format';

// API trả DATETIME dạng ISO UTC (VD: 2026-09-19T16:59:59.000Z = 20/09 23:59 giờ VN)
// nên phải đổi về ngày theo giờ địa phương, không được cắt chuỗi.
function toDateParts(value?: string | null): { y: string; m: string; d: string } | null {
  if (!value) return null;
  const s = String(value).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-');
    return { y, m, d };
  }
  const dt = new Date(s);
  if (isNaN(dt.getTime())) return null;
  return {
    y: String(dt.getFullYear()),
    m: String(dt.getMonth() + 1).padStart(2, '0'),
    d: String(dt.getDate()).padStart(2, '0')
  };
}

// input type="date" cần dạng YYYY-MM-DD (bỏ phần giờ)
function toInputDate(value?: string | null): string {
  const p = toDateParts(value);
  return p ? `${p.y}-${p.m}-${p.d}` : '';
}

// Hiển thị ngày kiểu Việt Nam: 25/12/2026
function formatDateVN(value?: string | null): string {
  const p = toDateParts(value);
  return p ? `${p.d}/${p.m}/${p.y}` : '—';
}

const EMPTY_FORM = {
  code: '',
  title: '',
  discount_type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
  discount_value: 0,
  min_order_value: 0,
  max_discount: 0,
  start_date: '',
  end_date: '',
  usage_limit: 1000,
  is_active: 1
};

type PromoStatus = { label: string; className: string };

function getStatus(p: Promotion): PromoStatus {
  const now = Date.now();
  if (p.start_date && new Date(p.start_date).getTime() > now) {
    return { label: 'Chưa bắt đầu', className: 'bg-blue-50 text-blue-600' };
  }
  if (p.end_date && new Date(p.end_date).getTime() < now) {
    return { label: 'Hết hạn', className: 'bg-gray-100 text-gray-500' };
  }
  if (Number(p.is_active) !== 1) {
    return { label: 'Tạm dừng', className: 'bg-amber-50 text-amber-600' };
  }
  const limit = Number(p.usage_limit) || 0;
  if (limit > 0 && (Number(p.times_used) || 0) >= limit) {
    return { label: 'Hết lượt', className: 'bg-gray-100 text-gray-500' };
  }
  return { label: 'Đang chạy', className: 'bg-green-50 text-green-600' };
}

export const AdminPromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const fetchPromotions = () => {
    setLoading(true);
    api.get('/promotions/all')
      .then((res) => setPromotions(res.data.promotions || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleOpenModal = (promo?: Promotion) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        code: promo.code,
        title: promo.title,
        discount_type: promo.discount_type,
        discount_value: Number(promo.discount_value) || 0,
        min_order_value: Number(promo.min_order_value) || 0,
        max_discount: Number(promo.max_discount) || 0,
        start_date: toInputDate(promo.start_date),
        end_date: toInputDate(promo.end_date),
        usage_limit: promo.usage_limit ?? 1000,
        is_active: Number(promo.is_active) === 1 ? 1 : 0
      });
    } else {
      setEditingPromo(null);
      setFormData({ ...EMPTY_FORM });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPromo?.id) {
        const res = await api.put(`/promotions/${editingPromo.id}`, formData);
        showToast(res.data.message || 'Cập nhật khuyến mãi thành công', 'success');
      } else {
        const res = await api.post('/promotions', formData);
        showToast(res.data.message || 'Thêm mã khuyến mãi thành công', 'success');
      }
      setIsModalOpen(false);
      fetchPromotions();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi thao tác khuyến mãi', 'error');
    }
  };

  const handleToggle = async (promo: Promotion) => {
    try {
      const res = await api.put(`/promotions/${promo.id}/toggle`);
      showToast(res.data.message, Number(promo.is_active) === 1 ? 'info' : 'success');
      fetchPromotions();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi cập nhật trạng thái', 'error');
    }
  };

  const handleDelete = async (promo: Promotion) => {
    if (!window.confirm(`Bạn có chắc muốn xóa mã "${promo.code}"? Hành động này không thể hoàn tác.`)) return;
    try {
      const res = await api.delete(`/promotions/${promo.id}`);
      showToast(res.data.message || 'Đã xóa mã khuyến mãi', 'info');
      fetchPromotions();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi xóa mã khuyến mãi', 'error');
    }
  };

  const filtered = promotions.filter((p) => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return true;
    return p.code.toLowerCase().includes(kw) || p.title.toLowerCase().includes(kw);
  });

  const runningCount = promotions.filter((p) => getStatus(p).label === 'Đang chạy').length;
  const totalUsed = promotions.reduce((sum, p) => sum + (Number(p.times_used) || 0), 0);

  const discountText = (p: Promotion) =>
    p.discount_type === 'PERCENTAGE'
      ? `Giảm ${Number(p.discount_value)}%${p.max_discount ? ` (tối đa ${formatVND(Number(p.max_discount))})` : ''}`
      : `Giảm ${formatVND(Number(p.discount_value))}`;

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900">Quản Lý Khuyến Mãi</h1>
          <p className="text-xs text-gray-400">Tạo mã giảm giá, đặt điều kiện đơn hàng và thời gian áp dụng cho khách</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-kimdong-red hover:bg-kimdong-darkred text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Mã Khuyến Mãi</span>
        </button>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-red-50 text-kimdong-red flex items-center justify-center shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase">Tổng số mã</p>
            <p className="text-lg font-black text-gray-900">{promotions.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase">Đang chạy</p>
            <p className="text-lg font-black text-gray-900">{runningCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase">Lượt đã dùng</p>
            <p className="text-lg font-black text-gray-900">{totalUsed}</p>
          </div>
        </div>
      </div>

      {/* Tìm kiếm */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo mã hoặc tên chương trình khuyến mãi..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
          />
        </div>
      </div>

      {/* Danh sách */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-gray-400">Đang tải danh sách khuyến mãi...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Tag className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs text-gray-400">
              {promotions.length === 0 ? 'Chưa có chương trình khuyến mãi nào.' : 'Không tìm thấy mã phù hợp.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Mã</th>
                  <th className="px-4 py-3">Chương trình</th>
                  <th className="px-4 py-3">Mức giảm</th>
                  <th className="px-4 py-3">Điều kiện</th>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3 text-center">Lượt dùng</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => {
                  const status = getStatus(p);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <span className="inline-block font-black text-kimdong-red border border-dashed border-red-300 bg-red-50/60 px-2 py-1 rounded-sm tracking-wide">
                          {p.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="font-bold text-gray-800 line-clamp-2">{p.title}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{discountText(p)}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {Number(p.min_order_value) > 0 ? `Đơn từ ${formatVND(Number(p.min_order_value))}` : 'Mọi đơn hàng'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {p.start_date || p.end_date ? (
                          <>
                            {formatDateVN(p.start_date)}
                            <span className="text-gray-300"> → </span>
                            {formatDateVN(p.end_date)}
                          </>
                        ) : (
                          <span className="text-gray-400">Không giới hạn</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-700">
                        {Number(p.times_used) || 0}
                        <span className="text-gray-400 font-medium">/{Number(p.usage_limit) > 0 ? p.usage_limit : '∞'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded-sm font-bold text-[10px] whitespace-nowrap ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggle(p)}
                            title={Number(p.is_active) === 1 ? 'Tạm dừng mã' : 'Bật lại mã'}
                            className={`p-2 rounded-lg transition-colors ${Number(p.is_active) === 1 ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(p)}
                            title="Sửa khuyến mãi"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            title="Xóa khuyến mãi"
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <Modal
          title={editingPromo ? 'Chỉnh Sửa Khuyến Mãi' : 'Thêm Mã Khuyến Mãi'}
          onClose={() => setIsModalOpen(false)}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Mã khuyến mãi *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="VD: KIMDONG20"
                  required
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red font-bold uppercase"
                />
                <p className="text-[10px] text-gray-400 mt-1">Chữ, số, gạch ngang — khách nhập ở giỏ hàng.</p>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tên chương trình *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Giảm 20% cho đơn từ 150k"
                  required
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Loại giảm</label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red bg-white"
                >
                  <option value="PERCENTAGE">Theo phần trăm (%)</option>
                  <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  {formData.discount_type === 'PERCENTAGE' ? 'Giảm (%) *' : 'Giảm (VNĐ) *'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={formData.discount_type === 'PERCENTAGE' ? 100 : undefined}
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                  required
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Giảm tối đa (VNĐ)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.max_discount}
                  onChange={(e) => setFormData({ ...formData, max_discount: Number(e.target.value) })}
                  disabled={formData.discount_type !== 'PERCENTAGE'}
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red disabled:bg-gray-50 disabled:text-gray-400"
                />
                <p className="text-[10px] text-gray-400 mt-1">Chỉ dùng cho giảm theo %.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Đơn tối thiểu (VNĐ)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.min_order_value}
                  onChange={(e) => setFormData({ ...formData, min_order_value: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Giới hạn lượt dùng</label>
                <input
                  type="number"
                  min={0}
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red bg-white"
                >
                  <option value={1}>Đang chạy</option>
                  <option value={0}>Tạm dừng</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Ngày bắt đầu</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Ngày kết thúc</label>
                <input
                  type="date"
                  value={formData.end_date}
                  min={formData.start_date || undefined}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 -mt-1">
              Bỏ trống cả hai nếu muốn mã chạy không giới hạn thời gian. Mã có hiệu lực hết ngày kết thúc (đến 23:59).
            </p>

            <div className="bg-red-50/60 rounded-lg p-3 border border-red-100 text-[11px] text-gray-600">
              Mã sẽ hiện gợi ý cho khách ở trang Giỏ hàng. Hệ thống tự kiểm tra thời gian, lượt dùng và giá trị đơn tối thiểu khi khách áp dụng.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold rounded-lg shadow flex items-center gap-1.5"
              >
                {editingPromo ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingPromo ? 'Lưu Thay Đổi' : 'Tạo Khuyến Mãi'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
