import React, { useEffect, useState } from 'react';
import { Eye, CheckCircle2, Truck, XCircle, Clock, Package, Phone, Mail, MapPin, AlertTriangle, RefreshCw, Loader2, PackageCheck, Info } from 'lucide-react';
import api from '../services/api';
import { Order } from '../types';
import { Modal } from '../components/common/Modal';
import { formatVND, formatDate } from '../utils/format';
import { useToast } from '../context/ToastContext';

/** Nhãn + màu cho 6 trạng thái đơn hàng */
const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700' },
  CONFIRMED: { label: 'Đã xác nhận', cls: 'bg-blue-100 text-blue-700' },
  PROCESSING: { label: 'Đang đóng gói', cls: 'bg-indigo-100 text-indigo-700' },
  SHIPPING: { label: 'Đang giao hàng', cls: 'bg-purple-100 text-purple-700' },
  DELIVERED: { label: 'Đã giao thành công', cls: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-red-100 text-red-600' }
};

/** Các trạng thái được phép hủy đơn (chưa giao thành công, chưa hủy) */
const CANCELLABLE = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING'];

/** Đơn hàng có thể hủy hay không */
const canCancel = (order: Order) => CANCELLABLE.includes(order.order_status);

/** Lý do hủy đơn gợi ý sẵn cho nhân viên */
const CANCEL_REASONS = [
  'Khách hàng yêu cầu hủy đơn',
  'Khách hàng đổi ý, không muốn mua nữa',
  'Không liên hệ được với khách hàng',
  'Địa chỉ giao hàng không chính xác',
  'Sách tạm thời hết hàng, không đủ cung cấp',
  'Khách hàng đặt trùng đơn'
];

interface VerifyItem {
  id: number;
  book_id: number;
  book_title: string;
  quantity: number;
  price: number;
  total_price: number;
  current_stock: number;
  book_available: boolean;
}

interface VerifyResult {
  order: Order & { items: VerifyItem[] };
  checks: {
    phone_valid: boolean;
    email_valid: boolean;
    address_valid: boolean;
    stock_ok: boolean;
    can_confirm: boolean;
    item_count: number;
    total_quantity: number;
  };
  warnings: string[];
}

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const { showToast } = useToast();

  // Chi tiết đơn
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Kiểm tra + xác nhận đơn
  const [verifyTarget, setVerifyTarget] = useState<Order | null>(null);
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Hủy đơn hàng
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchOrders = () => {
    setLoading(true);
    api.get('/orders')
      .then((res) => setOrders(res.data.orders || []))
      .catch((err) => {
        console.error(err);
        showToast('Không tải được danh sách đơn hàng', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { order_status: status });
      showToast('Cập nhật trạng thái đơn hàng thành công', 'success');
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, order_status: status as any });
      }
      fetchOrders();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Không thể cập nhật trạng thái', 'error');
    }
  };

  /** Mở modal hủy đơn hàng (bắt buộc nhập lý do) */
  const handleOpenCancel = (order: Order) => {
    setCancelTarget(order);
    setCancelReason('');
  };

  /** Hủy đơn: chuyển sang "Đã hủy" và hoàn lại tồn kho */
  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget) return;

    const reason = cancelReason.trim();
    if (reason.length < 5) {
      showToast('Vui lòng nhập lý do hủy đơn (tối thiểu 5 ký tự)', 'error');
      return;
    }

    setCancelling(true);
    try {
      const res = await api.put(`/orders/${cancelTarget.id}/cancel`, { reason });
      showToast(res.data.message || 'Đã hủy đơn hàng và hoàn lại tồn kho', 'success');
      setCancelTarget(null);
      setCancelReason('');
      setSelectedOrder(null);
      setVerifyTarget(null);
      setVerify(null);
      fetchOrders();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Không thể hủy đơn hàng', 'error');
    } finally {
      setCancelling(false);
    }
  };

  /** Mở modal kiểm tra đơn hàng (địa chỉ, SĐT, tồn kho) */
  const handleOpenVerify = async (order: Order) => {
    setVerifyTarget(order);
    setVerify(null);
    setVerifyLoading(true);
    try {
      const res = await api.get(`/orders/${order.id}/verification`);
      setVerify(res.data);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Không tải được thông tin kiểm tra đơn hàng', 'error');
      setVerifyTarget(null);
    } finally {
      setVerifyLoading(false);
    }
  };

  /** Nhấn "Xác nhận đơn hàng" -> PENDING sang CONFIRMED */
  const handleConfirmOrder = async () => {
    if (!verifyTarget) return;
    setConfirming(true);
    try {
      const res = await api.put(`/orders/${verifyTarget.id}/confirm`);
      showToast(res.data.message || 'Đã xác nhận đơn hàng', 'success');
      setVerifyTarget(null);
      setVerify(null);
      if (selectedOrder && selectedOrder.id === verifyTarget.id) {
        setSelectedOrder({ ...selectedOrder, order_status: 'CONFIRMED' });
      }
      fetchOrders();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Không thể xác nhận đơn hàng', 'error');
    } finally {
      setConfirming(false);
    }
  };

  const counts = orders.reduce((acc, o) => {
    acc[o.order_status] = (acc[o.order_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const visibleOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.order_status !== statusFilter) return false;
    if (!keyword.trim()) return true;
    const kw = keyword.trim().toLowerCase();
    return (
      String(o.order_code).toLowerCase().includes(kw) ||
      String(o.customer_name).toLowerCase().includes(kw) ||
      String(o.customer_phone).toLowerCase().includes(kw)
    );
  });

  const pendingCount = counts['PENDING'] || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900">Quản Lý Đơn Hàng NXB Kim Đồng</h1>
          <p className="text-xs text-gray-400">
            Kiểm tra thông tin giao hàng và tồn kho, sau đó xác nhận đơn hàng
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 border border-gray-200 hover:border-kimdong-red hover:text-kimdong-red hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Cảnh báo đơn chờ xác nhận */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <p className="font-extrabold">
              Có {pendingCount} đơn hàng đang chờ xác nhận
            </p>
            <p className="text-[11px] mt-0.5">
              Nhấn nút <strong>"Xác nhận đơn hàng"</strong> ở cột thao tác để kiểm tra thông tin (địa chỉ, số điện thoại, tồn kho)
              rồi chuyển đơn sang trạng thái <strong>"Đã xác nhận"</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Bộ lọc */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-kimdong-red text-white border-kimdong-red shadow'
                : 'text-gray-600 border-gray-200 hover:border-kimdong-red hover:text-kimdong-red hover:bg-red-50'
            }`}
          >
            Tất cả ({orders.length})
          </button>
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                statusFilter === key
                  ? 'bg-kimdong-red text-white border-kimdong-red shadow'
                  : 'text-gray-600 border-gray-200 hover:border-kimdong-red hover:text-kimdong-red hover:bg-red-50'
              }`}
            >
              {meta.label} ({counts[key] || 0})
            </button>
          ))}
        </div>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo mã đơn, tên khách hàng hoặc số điện thoại..."
          className="w-full text-xs p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
        />
      </div>

      {/* Bảng đơn hàng */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-gray-400">Đang tải đơn hàng...</div>
        ) : visibleOrders.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Package className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs text-gray-400">Không có đơn hàng nào phù hợp.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Mã đơn & Ngày đặt</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Tổng tiền</th>
                  <th className="py-3 px-4">Thanh toán</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleOrders.map((ord) => {
                  const meta = STATUS_META[ord.order_status] || { label: ord.order_status, cls: 'bg-gray-100 text-gray-600' };
                  const isPending = ord.order_status === 'PENDING';
                  return (
                    <tr key={ord.id} className={`hover:bg-gray-50/50 ${isPending ? 'bg-amber-50/30' : ''}`}>
                      <td className="py-3 px-4">
                        <p className="font-bold text-kimdong-red">#{ord.order_code}</p>
                        <p className="text-[10px] text-gray-400">{formatDate(ord.created_at)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-800">{ord.customer_name}</p>
                        <p className="text-[10px] text-gray-400">{ord.customer_phone}</p>
                      </td>
                      <td className="py-3 px-4 font-black text-gray-900">{formatVND(ord.total_amount)}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-600">{ord.payment_method}</p>
                        <p className={`text-[10px] font-bold ${ord.payment_status === 'PAID' ? 'text-green-600' : 'text-gray-400'}`}>
                          {ord.payment_status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-sm ${meta.cls}`}>
                          {meta.label.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              onClick={() => handleOpenVerify(ord)}
                              title="Kiểm tra thông tin và xác nhận đơn hàng"
                              className="flex items-center gap-1 text-[11px] font-bold text-white bg-kimdong-red hover:bg-kimdong-darkred px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shadow"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Xác nhận đơn hàng</span>
                            </button>
                          )}
                          {canCancel(ord) && (
                            <button
                              onClick={() => handleOpenCancel(ord)}
                              title="Hủy đơn hàng và hoàn lại tồn kho"
                              className="flex items-center gap-1 text-[11px] font-bold text-red-600 border border-red-200 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Hủy đơn hàng</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Xem chi tiết đơn hàng"
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
      </div>

      {/* Modal kiểm tra & xác nhận đơn hàng */}
      {verifyTarget && (
        <Modal
          title={`Kiểm Tra Đơn Hàng #${verifyTarget.order_code}`}
          onClose={() => { setVerifyTarget(null); setVerify(null); }}
          maxWidth="max-w-2xl"
        >
          {verifyLoading ? (
            <div className="p-10 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-kimdong-red" />
              <span>Đang kiểm tra thông tin đơn hàng...</span>
            </div>
          ) : verify ? (
            <div className="space-y-4 text-xs">

              {/* 1. Thông tin liên hệ */}
              <div>
                <p className="font-black text-gray-800 mb-2 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-kimdong-red" />
                  <span>Thông tin liên hệ</span>
                </p>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Khách hàng</p>
                      <p className="font-bold text-gray-800">{verify.order.customer_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Số điện thoại
                      </p>
                      <p className="font-bold text-gray-800">{verify.order.customer_phone || '—'}</p>
                    </div>
                    <CheckMark ok={verify.checks.phone_valid} />
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email
                      </p>
                      <p className="font-bold text-gray-800 break-all">{verify.order.customer_email || '—'}</p>
                    </div>
                    <CheckMark ok={verify.checks.email_valid} />
                  </div>
                </div>
              </div>

              {/* 2. Địa chỉ giao hàng */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-black text-gray-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-kimdong-red" />
                    <span>Địa chỉ giao hàng</span>
                  </p>
                  <CheckMark ok={verify.checks.address_valid} />
                </div>
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <p className="font-bold text-gray-800">
                    {[verify.order.shipping_address, verify.order.shipping_ward, verify.order.shipping_district, verify.order.shipping_province]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </p>
                  {verify.order.notes ? (
                    <p className="text-[11px] text-gray-500 mt-1.5 pt-1.5 border-t border-gray-200">
                      Ghi chú của khách: <em>{verify.order.notes}</em>
                    </p>
                  ) : null}
                </div>
              </div>

              {/* 3. Tồn kho */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-black text-gray-800 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-kimdong-red" />
                    <span>Kiểm tra tồn kho ({verify.checks.item_count} đầu sách)</span>
                  </p>
                  <CheckMark ok={verify.checks.stock_ok} />
                </div>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
                  {verify.order.items.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 line-clamp-2">{item.book_title}</p>
                        <p className="text-[10px] text-gray-400">
                          Đặt {item.quantity} cuốn · {formatVND(item.price)}/cuốn
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {item.book_available ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-green-700 bg-green-100 px-2 py-0.5 rounded-sm">
                            <PackageCheck className="w-3 h-3" />
                            CÒN BÁN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-red-600 bg-red-100 px-2 py-0.5 rounded-sm">
                            <AlertTriangle className="w-3 h-3" />
                            NGỪNG BÁN
                          </span>
                        )}
                        <p className="text-[10px] text-gray-400 mt-0.5">Tồn hiện tại: {item.current_stock} cuốn</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 flex items-start gap-1">
                  <Info className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>Số lượng sách của đơn đã được giữ chỗ và trừ khỏi kho ngay khi khách đặt hàng.</span>
                </p>
              </div>

              {/* Tổng kết */}
              <div className="border border-gray-200 rounded-lg p-3 space-y-1.5 bg-gray-50">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính:</span>
                  <strong className="text-gray-800">{formatVND(verify.order.subtotal)}</strong>
                </div>
                {Number(verify.order.discount_amount) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Giảm giá:</span>
                    <strong className="text-kimdong-red">-{formatVND(verify.order.discount_amount)}</strong>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <strong className="text-gray-800">
                    {Number(verify.order.shipping_fee) === 0 ? 'Miễn phí' : formatVND(verify.order.shipping_fee)}
                  </strong>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-gray-200 text-sm">
                  <span className="font-bold text-gray-800">Tổng thanh toán:</span>
                  <span className="font-black text-kimdong-red">{formatVND(verify.order.total_amount)}</span>
                </div>
                <p className="text-[10px] text-gray-400 pt-0.5">
                  {verify.order.payment_method} ·{' '}
                  {verify.order.payment_status === 'PAID' ? 'Đã thanh toán' : 'Thu tiền khi giao hàng'}
                </p>
              </div>

              {/* Cảnh báo */}
              {verify.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                  <p className="font-extrabold text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Cần lưu ý ({verify.warnings.length})</span>
                  </p>
                  <ul className="text-[11px] text-amber-800 space-y-0.5 pl-5 list-disc">
                    {verify.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {verify.checks.can_confirm && verify.warnings.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-[11px] text-green-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Thông tin liên hệ, địa chỉ giao hàng và tồn kho đều hợp lệ. Có thể xác nhận đơn hàng.</span>
                </div>
              )}

              {/* Hành động */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setVerifyTarget(null); setVerify(null); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => { const o = verifyTarget; setVerifyTarget(null); setVerify(null); handleOpenCancel(o); }}
                  className="flex items-center gap-1.5 px-4 py-2 text-red-600 border border-red-200 hover:bg-red-50 font-bold rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Hủy đơn hàng</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={confirming || !verify.checks.can_confirm}
                  title={!verify.checks.can_confirm ? 'Không thể xác nhận đơn hàng này' : 'Chuyển đơn sang trạng thái Đã xác nhận'}
                  className="flex items-center gap-1.5 px-5 py-2 bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{confirming ? 'Đang xác nhận...' : 'Xác nhận đơn hàng'}</span>
                </button>
              </div>
            </div>
          ) : null}
        </Modal>
      )}

      {/* Modal chi tiết đơn hàng */}
      {selectedOrder && (
        <Modal title={`Chi Tiết Đơn Hàng #${selectedOrder.order_code}`} onClose={() => setSelectedOrder(null)} maxWidth="max-w-xl">
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="space-y-1">
                <p>Khách hàng: <strong className="text-gray-800">{selectedOrder.customer_name}</strong> ({selectedOrder.customer_phone})</p>
                <p>Email: <strong className="text-gray-800">{selectedOrder.customer_email}</strong></p>
                <p>
                  Địa chỉ giao hàng:{' '}
                  <strong className="text-gray-800">
                    {selectedOrder.shipping_address}, {selectedOrder.shipping_ward}, {selectedOrder.shipping_district}, {selectedOrder.shipping_province}
                  </strong>
                </p>
              </div>
              <span className={`inline-flex items-center text-[10px] font-extrabold px-2 py-0.5 rounded-sm shrink-0 ${(STATUS_META[selectedOrder.order_status] || { cls: 'bg-gray-100 text-gray-600' }).cls}`}>
                {(STATUS_META[selectedOrder.order_status] || { label: selectedOrder.order_status }).label.toUpperCase()}
              </span>
            </div>

            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-bold text-gray-800">{item.book_title} (x{item.quantity})</span>
                    {item.book_available === false && (
                      <span className="ml-2 text-[10px] font-extrabold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-sm">NGỪNG BÁN</span>
                    )}
                  </div>
                  <span className="font-bold text-kimdong-red shrink-0">{formatVND(item.total_price)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
              <span className="font-bold text-gray-800">Tổng thanh toán:</span>
              <span className="font-black text-kimdong-red">{formatVND(selectedOrder.total_amount)}</span>
            </div>

            {/* Lý do hủy (nếu đơn đã bị hủy) */}
            {selectedOrder.order_status === 'CANCELLED' && selectedOrder.cancel_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[11px] text-red-700">
                <p className="font-extrabold flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  <span>Đơn hàng đã bị hủy</span>
                </p>
                <p className="mt-1">
                  Lý do: <strong>{selectedOrder.cancel_reason}</strong>
                </p>
                {selectedOrder.cancelled_at && (
                  <p className="text-[10px] text-red-500 mt-1">Thời điểm hủy: {formatDate(selectedOrder.cancelled_at)}</p>
                )}
                <p className="text-[10px] text-red-600 mt-1.5 pt-1.5 border-t border-red-200">
                  Số lượng sách của đơn đã được hoàn lại vào kho.
                </p>
              </div>
            )}

            {/* Hủy đơn hàng (có nhập lý do) */}
            {canCancel(selectedOrder) && (
              <button
                type="button"
                onClick={() => { const o = selectedOrder; setSelectedOrder(null); handleOpenCancel(o); }}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-red-600 border border-red-200 hover:bg-red-50 font-extrabold rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Hủy đơn hàng</span>
              </button>
            )}

            {selectedOrder.order_status === 'PENDING' && (
              <button
                type="button"
                onClick={() => { const o = selectedOrder; setSelectedOrder(null); handleOpenVerify(o); }}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold rounded-lg shadow transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Kiểm tra & Xác nhận đơn hàng</span>
              </button>
            )}

            {/* Chuyển trạng thái thủ công cho các bước sau */}
            {selectedOrder.order_status !== 'CANCELLED' && (
              <div className="pt-1 border-t border-gray-100">
                <label className="block font-bold text-gray-700 mb-1.5">Chuyển trạng thái thủ công</label>
                <select
                  value={selectedOrder.order_status}
                  onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                  className="w-full bg-gray-100 text-xs font-bold text-gray-800 rounded-lg px-3 py-2.5 border border-transparent focus:border-kimdong-red outline-none cursor-pointer"
                >
                  <option value="PENDING">Chờ xác nhận</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="PROCESSING">Đang đóng gói</option>
                  <option value="SHIPPING">Đang giao hàng</option>
                  <option value="DELIVERED">Đã giao thành công</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">
                  Muốn hủy đơn, dùng nút "Hủy đơn hàng" để nhập lý do và hoàn lại tồn kho.
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal hủy đơn hàng */}
      {cancelTarget && (() => {
        const items = cancelTarget.items || [];
        const totalQty = items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);
        const reason = cancelReason.trim();
        const valid = reason.length >= 5;

        return (
          <Modal
            title={`Hủy Đơn Hàng #${cancelTarget.order_code}`}
            onClose={() => { setCancelTarget(null); setCancelReason(''); }}
            maxWidth="max-w-lg"
          >
            <form onSubmit={handleCancelOrder} className="space-y-3 text-xs">

              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="font-bold text-gray-800">{cancelTarget.customer_name} · {cancelTarget.customer_phone}</p>
                <p className="text-[11px] text-gray-500">
                  {cancelTarget.shipping_address}, {cancelTarget.shipping_ward}, {cancelTarget.shipping_district}, {cancelTarget.shipping_province}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className={`inline-flex items-center text-[10px] font-extrabold px-2 py-0.5 rounded-sm ${(STATUS_META[cancelTarget.order_status] || { cls: 'bg-gray-100 text-gray-600' }).cls}`}>
                    {(STATUS_META[cancelTarget.order_status] || { label: cancelTarget.order_status }).label.toUpperCase()}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Tổng: <strong className="text-gray-800">{formatVND(cancelTarget.total_amount)}</strong>
                  </span>
                </div>
              </div>

              {/* Sách sẽ được hoàn lại kho */}
              <div>
                <p className="font-black text-gray-800 mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-kimdong-red" />
                  <span>Sách sẽ được hoàn lại kho ({items.length} đầu sách)</span>
                </p>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="p-2.5 flex items-center justify-between gap-3">
                      <span className="font-bold text-gray-800 line-clamp-2">{item.book_title}</span>
                      <span className="text-[11px] font-extrabold text-green-700 bg-green-100 px-2 py-0.5 rounded-sm shrink-0">
                        +{item.quantity} cuốn
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  Tổng cộng hoàn lại <strong>{totalQty} cuốn</strong> vào kho.
                </p>
              </div>

              {/* Lý do hủy */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Lý do hủy đơn <span className="text-kimdong-red">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {CANCEL_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCancelReason(r)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                        cancelReason === r
                          ? 'bg-kimdong-red text-white border-kimdong-red'
                          : 'text-gray-600 border-gray-200 hover:border-kimdong-red hover:text-kimdong-red hover:bg-red-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Nhập lý do hủy đơn hàng (tối thiểu 5 ký tự)..."
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red resize-none"
                />
                <div className="flex justify-between text-[10px] mt-1">
                  <span className={valid ? 'text-green-600' : 'text-gray-400'}>
                    {valid ? 'Đã nhập lý do' : 'Bắt buộc nhập lý do (tối thiểu 5 ký tự)'}
                  </span>
                  <span className="text-gray-400">{cancelReason.length}/500</span>
                </div>
              </div>

              {/* Cảnh báo */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[11px] text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Đơn hàng sẽ chuyển sang trạng thái <strong>"Đã hủy"</strong> và <strong>{totalQty} cuốn sách</strong> sẽ
                  được hoàn lại vào kho. Thao tác này không thể hoàn tác.
                  {cancelTarget.payment_status === 'PAID' && (
                    <> Đơn đã thanh toán nên sẽ được đánh dấu <strong>cần hoàn tiền</strong>.</>
                  )}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setCancelTarget(null); setCancelReason(''); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold"
                >
                  Giữ đơn
                </button>
                <button
                  type="submit"
                  disabled={cancelling || !valid}
                  className="flex items-center gap-1.5 px-5 py-2 bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  <span>{cancelling ? 'Đang hủy...' : 'Xác Nhận Hủy Đơn'}</span>
                </button>
              </div>
            </form>
          </Modal>
        );
      })()}

    </div>
  );
};

/** Dấu tích / cảnh báo cho một mục kiểm tra */
const CheckMark: React.FC<{ ok: boolean }> = ({ ok }) => (
  <span
    className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-sm shrink-0 ${
      ok ? 'text-green-700 bg-green-100' : 'text-red-600 bg-red-100'
    }`}
  >
    {ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
    {ok ? 'HỢP LỆ' : 'THIẾU/Sai'}
  </span>
);
