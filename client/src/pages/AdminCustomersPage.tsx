import React, { useEffect, useState } from 'react';
import { Search, Eye, Pencil, Users, UserCheck, UserX, Wallet, Phone, Mail, MapPin, ShoppingBag, RefreshCw, ArrowLeft, Clock } from 'lucide-react';
import api from '../services/api';
import { Customer, Order } from '../types';
import { Modal } from '../components/common/Modal';
import { formatVND, formatDate } from '../utils/format';
import { useToast } from '../context/ToastContext';

const EMPTY_FORM = {
  full_name: '',
  email: '',
  phone: '',
  address: '',
  province: '',
  district: '',
  ward: '',
  password: ''
};

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState({ total: 0, withOrders: 0, noOrders: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const { showToast } = useToast();

  // Chi tiết khách hàng
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<{ customer: Customer; stats: any; orders: Order[] } | null>(null);

  // Sửa khách hàng
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const fetchCustomers = () => {
    setLoading(true);
    api.get('/customers')
      .then((res) => {
        setCustomers(res.data.customers || []);
        if (res.data.summary) setSummary(res.data.summary);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenDetail = async (c: Customer) => {
    setIsDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await api.get(`/customers/${c.id}`);
      setDetail({ customer: res.data.customer, stats: res.data.stats, orders: res.data.orders || [] });
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Không tải được chi tiết khách hàng', 'error');
      setIsDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      full_name: c.full_name,
      email: c.email,
      phone: c.phone || '',
      address: c.address || '',
      province: c.province || '',
      district: c.district || '',
      ward: c.ward || '',
      password: ''
    });
    setIsEditOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setSaving(true);
    try {
      const payload: any = { ...formData };
      const res = await api.put(`/customers/${editingCustomer.id}`, payload);
      showToast(res.data.message || 'Cập nhật thông tin khách hàng thành công', 'success');
      setIsEditOpen(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi cập nhật khách hàng', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = customers.filter((c) => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return true;
    return (
      c.full_name?.toLowerCase().includes(kw) ||
      c.email?.toLowerCase().includes(kw) ||
      (c.phone || '').includes(kw)
    );
  });

  const fullAddress = (c: Customer) =>
    [c.address, c.ward, c.district, c.province].filter(Boolean).join(', ') || 'Chưa cập nhật địa chỉ';

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900">Quản Lý Khách Hàng</h1>
          <p className="text-xs text-gray-400">Danh sách khách hàng đăng ký, lịch sử mua hàng và thông tin liên hệ</p>
        </div>

        <button
          onClick={fetchCustomers}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 border border-gray-200 hover:border-kimdong-red hover:text-kimdong-red hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-kimdong-red flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase">Tổng khách</p>
            <p className="text-lg font-black text-gray-900">{summary.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase">Đã mua hàng</p>
            <p className="text-lg font-black text-gray-900">{summary.withOrders}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase">Chưa mua</p>
            <p className="text-lg font-black text-gray-900">{summary.noOrders}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-400 uppercase">Tổng chi tiêu</p>
            <p className="text-sm font-black text-gray-900 truncate">{formatVND(summary.totalSpent)}</p>
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
            placeholder="Tìm theo tên, email hoặc số điện thoại khách hàng..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
          />
        </div>
      </div>

      {/* Danh sách khách hàng */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-gray-400">Đang tải danh sách khách hàng...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Users className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs text-gray-400">
              {customers.length === 0 ? 'Chưa có khách hàng nào đăng ký.' : 'Không tìm thấy khách hàng phù hợp.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Liên hệ</th>
                  <th className="py-3 px-4">Địa chỉ</th>
                  <th className="py-3 px-4 text-center">Đơn hàng</th>
                  <th className="py-3 px-4 text-right">Tổng chi tiêu</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-red-50 text-kimdong-red font-black flex items-center justify-center text-sm uppercase shrink-0">
                          {c.full_name?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 truncate">{c.full_name}</p>
                          <p className="text-[10px] text-gray-400">Tham gia {c.created_at ? formatDate(c.created_at) : '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-600 truncate">{c.email}</p>
                      <p className="text-[10px] text-gray-400">{c.phone || 'Chưa có SĐT'}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-500 max-w-[200px]">
                      <p className="truncate">{fullAddress(c)}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block font-black px-2 py-1 rounded-sm text-[11px] ${Number(c.order_count) > 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                        {c.order_count || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-800 whitespace-nowrap">
                      {formatVND(c.total_spent || 0)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(c)}
                          title="Xem chi tiết khách hàng"
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          title="Cập nhật thông tin khách hàng"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal chi tiết khách hàng */}
      {isDetailOpen && (
        <Modal title="Chi Tiết Khách Hàng" onClose={() => setIsDetailOpen(false)} maxWidth="max-w-2xl">
          {detailLoading || !detail ? (
            <div className="p-8 text-center text-xs text-gray-400">Đang tải thông tin khách hàng...</div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Thông tin cơ bản */}
              <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                <div className="w-14 h-14 rounded-full bg-red-100 text-kimdong-red font-black text-xl flex items-center justify-center shrink-0">
                  {detail.customer.full_name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-sm text-gray-900">{detail.customer.full_name}</p>
                  <p className="text-[11px] text-gray-400">
                    Khách hàng #{detail.customer.id} · Tham gia {detail.customer.created_at ? formatDate(detail.customer.created_at) : '—'}
                  </p>
                </div>
              </div>

              {/* Thống kê mua hàng */}
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-gray-100 rounded-lg p-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Đơn hàng</p>
                  <p className="text-lg font-black text-gray-900">{detail.stats.order_count}</p>
                </div>
                <div className="border border-gray-100 rounded-lg p-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Đã hủy</p>
                  <p className="text-lg font-black text-gray-900">{detail.stats.cancelled_count}</p>
                </div>
                <div className="border border-gray-100 rounded-lg p-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Tổng chi tiêu</p>
                  <p className="text-sm font-black text-kimdong-red pt-1">{formatVND(detail.stats.total_spent)}</p>
                </div>
              </div>

              {/* Thông tin liên hệ */}
              <div className="space-y-2">
                <p className="font-bold text-gray-800">Thông tin liên hệ</p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-gray-600">
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-kimdong-red shrink-0" />
                    <span className="font-bold text-gray-800">{detail.customer.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-kimdong-red shrink-0" />
                    <span className="font-bold text-gray-800">{detail.customer.phone || 'Chưa cập nhật'}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-kimdong-red shrink-0 mt-0.5" />
                    <span className="font-bold text-gray-800">{fullAddress(detail.customer)}</span>
                  </p>
                  {detail.stats.last_order_at && (
                    <p className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-kimdong-red shrink-0" />
                      <span>Đơn gần nhất: <strong className="text-gray-800">{formatDate(detail.stats.last_order_at)}</strong></span>
                    </p>
                  )}
                </div>
              </div>

              {/* Lịch sử đơn hàng */}
              <div className="space-y-2">
                <p className="font-bold text-gray-800 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-kimdong-red" />
                  <span>Đơn hàng đã đặt ({detail.orders.length})</span>
                </p>
                {detail.orders.length === 0 ? (
                  <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center text-[11px] text-gray-400">
                    Khách hàng chưa có đơn hàng nào.
                  </div>
                ) : (
                  <div className="border border-gray-100 rounded-lg divide-y divide-gray-100 max-h-72 overflow-y-auto">
                    {detail.orders.map((ord) => (
                      <div key={ord.id} className="p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-kimdong-red">#{ord.order_code}</p>
                          <p className="text-[10px] text-gray-400">
                            {formatDate(ord.created_at)} · {ord.items?.length || 0} sản phẩm · {ord.payment_method}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-gray-900">{formatVND(ord.total_amount)}</p>
                          <span className="text-[10px] text-gray-400">{ord.order_status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setIsDetailOpen(false); handleOpenEdit(detail.customer); }}
                  className="flex items-center gap-1.5 px-4 py-2 text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg font-bold transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Sửa thông tin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="px-5 py-2 bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold rounded-lg shadow"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Modal cập nhật khách hàng */}
      {isEditOpen && editingCustomer && (
        <Modal title="Cập Nhật Thông Tin Khách Hàng" onClose={() => setIsEditOpen(false)} maxWidth="max-w-xl">
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Email đăng nhập *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="09xxxxxxxx"
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Mật khẩu mới</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="bỏ trống nếu giữ nguyên"
                  minLength={formData.password ? 6 : undefined}
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
                <p className="text-[10px] text-gray-400 mt-1">Đặt lại mật khẩu giúp khách nếu họ quên.</p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Địa chỉ cụ thể</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Số nhà, tên đường"
                className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Phường / Xã</label>
                <input
                  type="text"
                  value={formData.ward}
                  onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Quận / Huyện</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tỉnh / Thành phố</label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>
            </div>

            <div className="bg-red-50/60 rounded-lg p-3 border border-red-100 text-[11px] text-gray-600">
              Đổi email sẽ là email đăng nhập mới của khách từ lần sau. Khách hàng không thể tự đổi nhóm quyền.
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold rounded-lg shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                <Pencil className="w-4 h-4" />
                {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
