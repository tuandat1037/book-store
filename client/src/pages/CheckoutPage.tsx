import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Truck, CheckCircle2, ShieldCheck, ArrowRight, QrCode, Tag, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatVND } from '../utils/format';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export const CheckoutPage: React.FC = () => {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    customer_name: user?.full_name || '',
    customer_email: user?.email || '',
    customer_phone: user?.phone || '',
    shipping_province: user?.province || 'Hà Nội',
    shipping_district: user?.district || 'Hai Bà Trưng',
    shipping_ward: user?.ward || 'Nguyễn Du',
    shipping_address: user?.address || '',
    notes: '',
    payment_method: 'COD' as 'COD' | 'BANKING' | 'MOMO'
  });

  const [submitting, setSubmitting] = useState(false);

  // Mã giảm giá áp dụng từ trang Giỏ hàng
  const [promoCode, setPromoCode] = useState((location.state as any)?.promoCode || '');
  const [promoInput, setPromoInput] = useState((location.state as any)?.promoCode || '');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoTitle, setPromoTitle] = useState('');

  const shippingFee = subtotal >= 200000 ? 0 : 20000;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  // Kiểm tra mã + tính tiền giảm theo dữ liệu thật từ server
  useEffect(() => {
    if (!promoCode) {
      setDiscountAmount(0);
      setPromoTitle('');
      return;
    }
    let cancelled = false;
    api.post('/promotions/validate', { code: promoCode, subtotal })
      .then((res) => {
        if (cancelled) return;
        setDiscountAmount(res.data.discount_amount || 0);
        setPromoTitle(res.data.promotion?.title || '');
      })
      .catch(() => {
        if (cancelled) return;
        setDiscountAmount(0);
        setPromoTitle('');
        setPromoCode('');
        setPromoInput('');
      });
    return () => { cancelled = true; };
  }, [promoCode, subtotal]);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      showToast('Vui lòng nhập mã giảm giá', 'error');
      return;
    }
    try {
      const res = await api.post('/promotions/validate', { code, subtotal });
      setPromoCode(code);
      setDiscountAmount(res.data.discount_amount || 0);
      setPromoTitle(res.data.promotion?.title || '');
      showToast(res.data.message || 'Đã áp dụng mã giảm giá', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Mã giảm giá không hợp lệ', 'error');
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setPromoInput('');
    setDiscountAmount(0);
    setPromoTitle('');
    showToast('Đã bỏ mã giảm giá', 'info');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_name || !formData.customer_email || !formData.customer_phone || !formData.shipping_address) {
      showToast('Vui lòng nhập đầy đủ thông tin giao hàng', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/orders', {
        ...formData,
        promo_code: promoCode || undefined,
        items: items.map((i) => ({ book_id: i.book_id, quantity: i.quantity }))
      });

      showToast('Đặt hàng thành công!', 'success');
      await clearCart();
      navigate(`/order-success/${res.data.orderCode}`);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Không thể tạo đơn hàng', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      <h1 className="text-2xl font-black text-gray-900 border-b border-gray-200 pb-4">
        Thanh Toán Đơn Hàng NXB Kim Đồng
      </h1>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Shipping Address & Payment Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Customer & Delivery Info */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-extrabold uppercase text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-kimdong-red" />
              <span>1. Thông Tin Nhận Hàng</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  required
                  placeholder="Nguyễn Văn A"
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại *</label>
                <input
                  type="text"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleChange}
                  required
                  placeholder="0901234567"
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red bg-gray-50/50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Email nhận thông báo đơn hàng *</label>
                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleChange}
                  required
                  placeholder="email@gmail.com"
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tỉnh / Thành phố *</label>
                <input
                  type="text"
                  name="shipping_province"
                  value={formData.shipping_province}
                  onChange={handleChange}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Quận / Huyện *</label>
                <input
                  type="text"
                  name="shipping_district"
                  value={formData.shipping_district}
                  onChange={handleChange}
                  required
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red bg-gray-50/50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ cụ thể (Số nhà, tên đường, phường/xã) *</label>
                <input
                  type="text"
                  name="shipping_address"
                  value={formData.shipping_address}
                  onChange={handleChange}
                  required
                  placeholder="Số 55 Đường Quang Trung, Phường Nguyễn Du"
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red bg-gray-50/50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Ghi chú giao hàng (Tùy chọn)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Giao giờ hành chính, gọi trước khi giao..."
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red bg-gray-50/50"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Method Selection */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-extrabold uppercase text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-kimdong-red" />
              <span>2. Phương Thức Thanh Toán</span>
            </h2>

            <div className="space-y-3">
              <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                formData.payment_method === 'COD' ? 'border-kimdong-red bg-red-50/40 shadow-sm' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="payment_method"
                  value="COD"
                  checked={formData.payment_method === 'COD'}
                  onChange={handleChange}
                  className="mt-1 text-kimdong-red focus:ring-kimdong-red"
                />
                <div>
                  <span className="text-xs font-extrabold text-gray-800 block">Thanh toán khi nhận hàng (COD)</span>
                  <span className="text-[11px] text-gray-500">Bạn chỉ thanh toán tiền mặt trực tiếp cho nhân viên giao hàng khi kiểm tra sản phẩm.</span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                formData.payment_method === 'BANKING' ? 'border-kimdong-red bg-red-50/40 shadow-sm' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="payment_method"
                  value="BANKING"
                  checked={formData.payment_method === 'BANKING'}
                  onChange={handleChange}
                  className="mt-1 text-kimdong-red focus:ring-kimdong-red"
                />
                <div className="w-full">
                  <span className="text-xs font-extrabold text-gray-800 block flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-kimdong-red" />
                    Chuyển khoản Ngân hàng (VietQR Instant)
                  </span>
                  <span className="text-[11px] text-gray-500 block mb-2">Chuyển tiền quét mã QR nhanh chóng.</span>

                  {formData.payment_method === 'BANKING' && (
                    <div className="mt-3 p-3 bg-white rounded-xl border border-red-100 space-y-2 text-xs">
                      <p className="font-bold text-gray-800">Thông tin tài khoản NXB Kim Đồng:</p>
                      <p className="text-gray-600">Ngân hàng: <span className="font-bold text-gray-800">Vietcombank - Chi nhánh Hà Nội</span></p>
                      <p className="text-gray-600">Số tài khoản: <span className="font-bold text-kimdong-red">1900 571 595 8888</span></p>
                      <p className="text-gray-600">Chủ tài khoản: <span className="font-bold text-gray-800">CTY NXB KIM DONG</span></p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary & Place Order Action */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm sticky top-24">
            <h3 className="text-xs font-extrabold uppercase text-gray-800 border-b border-gray-100 pb-3">
              Sản Phẩm Trong Đơn ({items.length})
            </h3>

            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center gap-3">
                  <img
                    src={item.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'}
                    alt={item.title}
                    className="w-10 h-12 object-contain bg-gray-50 rounded border p-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{item.title}</p>
                    <p className="text-[11px] text-gray-400">
                      x{item.quantity} x {formatVND(item.sale_price || item.price)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-gray-900 shrink-0">
                    {formatVND((item.sale_price || item.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span className="font-bold text-gray-800">{formatVND(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Giảm giá ({promoCode}):</span>
                  <span className="font-bold">-{formatVND(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Phí giao hàng:</span>
                <span className="font-bold text-gray-800">
                  {shippingFee === 0 ? <span className="text-green-600">Miễn phí</span> : formatVND(shippingFee)}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between items-baseline">
                <span className="text-sm font-bold text-gray-900">Tổng thanh toán:</span>
                <span className="text-xl font-black text-kimdong-red">{formatVND(totalAmount)}</span>
              </div>
            </div>

            {/* Mã giảm giá */}
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-kimdong-red" />
                <span>Mã Giảm Giá</span>
              </p>

              {discountAmount > 0 ? (
                <div className="flex items-start justify-between gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  <div className="text-[11px] text-green-700">
                    <p className="font-bold">Đã áp dụng: {promoCode}</p>
                    {promoTitle && <p className="text-green-600">{promoTitle}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    title="Bỏ mã giảm giá"
                    className="text-green-700 hover:bg-green-100 rounded p-1 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Nhập mã giảm giá"
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-gray-200 uppercase font-bold outline-none focus:border-kimdong-red"
                  />
                  <button
                    type="submit"
                    className="bg-gray-900 hover:bg-kimdong-red text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shrink-0"
                  >
                    Áp dụng
                  </button>
                </form>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold text-xs sm:text-sm py-4 px-4 rounded-xl shadow-lg shadow-red-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'ĐANG TẠO ĐƠN HÀNG...' : 'XÁC NHẬN ĐẶT HÀNG'}
            </button>
          </div>
        </div>

      </form>

    </div>
  );
};
