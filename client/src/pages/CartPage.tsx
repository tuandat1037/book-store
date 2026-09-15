import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, Tag, ArrowLeft, X, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatVND } from '../utils/format';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';
import api from '../services/api';
import { Promotion } from '../types';

export const CartPage: React.FC = () => {
  const { items, subtotal, updateQuantity, removeItems, clearCart } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; title: string } | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [availablePromos, setAvailablePromos] = useState<Promotion[]>([]);
  const [checking, setChecking] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirm, setConfirm] = useState<{ ids: number[]; all?: boolean } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Bỏ chọn những sách đã bị xóa khỏi giỏ (tránh id treo)
  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => items.some((i) => i.id === id)));
  }, [items]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const allSelected = items.length > 0 && selectedIds.length === items.length;

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : items.map((i) => i.id));
  };

  // Mở hộp thoại xác nhận trước khi xóa
  const askRemoveSelected = () => {
    if (selectedIds.length === 0) {
      showToast('Vui lòng chọn sách muốn xóa', 'info');
      return;
    }
    setConfirm({ ids: selectedIds });
  };

  const askRemoveOne = (id: number) => {
    setConfirm({ ids: [id] });
  };

  const askRemoveAll = () => {
    if (items.length === 0) return;
    setConfirm({ ids: items.map((i) => i.id), all: true });
  };

  const handleConfirmDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      if (confirm.all) {
        await clearCart();
      } else {
        await removeItems(confirm.ids);
      }
      setSelectedIds([]);
      setConfirm(null);
    } finally {
      setDeleting(false);
    }
  };

  // Gợi ý các mã đang chạy (lấy từ API, không hard-code)
  useEffect(() => {
    api.get('/promotions')
      .then((res) => setAvailablePromos(res.data.promotions || []))
      .catch(() => setAvailablePromos([]));
  }, []);

  const applyCode = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      showToast('Vui lòng nhập mã giảm giá', 'error');
      return;
    }
    setChecking(true);
    try {
      const res = await api.post('/promotions/validate', { code, subtotal });
      setDiscountAmount(res.data.discount_amount || 0);
      setAppliedPromo({ code: res.data.promotion.code, title: res.data.promotion.title });
      setPromoCode(code);
      showToast(res.data.message || 'Đã áp dụng mã giảm giá', 'success');
    } catch (error: any) {
      setDiscountAmount(0);
      setAppliedPromo(null);
      showToast(error.response?.data?.message || 'Mã giảm giá không hợp lệ', 'error');
    } finally {
      setChecking(false);
    }
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    applyCode(promoCode);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscountAmount(0);
    setPromoCode('');
    showToast('Đã bỏ mã giảm giá', 'info');
  };

  // Giỏ hàng thay đổi thì kiểm tra lại mã (mã có thể yêu cầu đơn tối thiểu)
  useEffect(() => {
    if (!appliedPromo) return;
    let cancelled = false;
    api.post('/promotions/validate', { code: appliedPromo.code, subtotal })
      .then((res) => {
        if (cancelled) return;
        setDiscountAmount(res.data.discount_amount || 0);
      })
      .catch((error: any) => {
        if (cancelled) return;
        setDiscountAmount(0);
        setAppliedPromo(null);
        setPromoCode('');
        showToast(error.response?.data?.message || 'Mã giảm giá không còn áp dụng được', 'error');
      });
    return () => { cancelled = true; };
  }, [subtotal]);

  const shippingFee = subtotal >= 200000 ? 0 : 20000;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-24 h-24 bg-red-50 text-kimdong-red rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Giỏ Hàng Của Bạn Đang Trống</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
          Hãy khám phá hàng ngàn cuốn sách Manga, Thiếu nhi và Văn học hấp dẫn đang chờ bạn tại Nhà xuất bản Kim Đồng.
        </p>
        <div>
          <Link
            to="/books"
            className="inline-flex items-center gap-2 bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold text-xs px-8 py-3.5 rounded-lg shadow-lg transition-all"
          >
            <span>Khám phá ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-kimdong-red" />
          <span>Giỏ Hàng Của Bạn ({items.length} sản phẩm)</span>
        </h1>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer select-none pr-1">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="w-4 h-4 accent-kimdong-red cursor-pointer"
            />
            <span>Chọn tất cả</span>
          </label>

          <button
            onClick={askRemoveSelected}
            disabled={selectedIds.length === 0}
            title="Xóa các sách đã chọn"
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-700 disabled:hover:bg-transparent"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}</span>
          </button>

          <button
            onClick={askRemoveAll}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-red-200 text-kimdong-red bg-red-50/60 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa tất cả</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Cart Items Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {items.map((item) => {
                const price = item.sale_price !== null && item.sale_price !== undefined && item.sale_price < item.price
                  ? item.sale_price
                  : item.price;
                const rowTotal = price * item.quantity;
                const isChecked = selectedIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${isChecked ? 'bg-red-50/40' : ''}`}
                  >
                    
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(item.id)}
                        title="Chọn sách này để xóa"
                        className="w-4 h-4 accent-kimdong-red cursor-pointer shrink-0"
                      />
                      <img
                        src={item.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'}
                        alt={item.title}
                        className="w-16 h-20 object-contain rounded-lg bg-gray-50 border border-gray-100 p-1 shrink-0"
                      />
                      <div className="space-y-1">
                        <Link
                          to={`/books/${item.slug}`}
                          className="font-bold text-xs sm:text-sm text-gray-800 hover:text-kimdong-red line-clamp-2 transition-colors"
                        >
                          {item.title}
                        </Link>
                        <p className="text-xs font-bold text-kimdong-red">{formatVND(price)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                      {/* Quantity buttons */}
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-1 text-xs font-bold hover:bg-gray-200"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-bold text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-1 text-xs font-bold hover:bg-gray-200"
                        >
                          +
                        </button>
                      </div>

                      {/* Row Total */}
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-gray-900 block">{formatVND(rowTotal)}</span>
                      </div>

                      {/* Delete item */}
                      <button
                        onClick={() => askRemoveOne(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          <Link
            to="/books"
            className="inline-flex items-center gap-2 text-xs font-bold text-kimdong-red hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tiếp tục mua sắm sách</span>
          </Link>
        </div>

        {/* Right Column: Order Summary & Coupon */}
        <div className="space-y-6">
          
          {/* Promo Code Box */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase text-gray-800 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-kimdong-red" />
              <span>Mã Giảm Giá / Voucher</span>
            </h3>
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã (VD: KIMDONG20)"
                className="w-full text-xs px-3 py-2.5 rounded-lg border border-gray-200 uppercase font-bold outline-none focus:border-kimdong-red"
              />
              <button
                type="submit"
                disabled={checking}
                className="bg-gray-900 hover:bg-kimdong-red text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shrink-0 disabled:opacity-50"
              >
                {checking ? 'Đang kiểm tra...' : 'Áp dụng'}
              </button>
            </form>

            {appliedPromo && (
              <div className="flex items-start justify-between gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                <div className="text-[11px] text-green-700">
                  <p className="font-bold">Đã áp dụng: {appliedPromo.code}</p>
                  <p className="text-green-600">{appliedPromo.title}</p>
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
            )}

            {availablePromos.length > 0 && !appliedPromo && (
              <div className="text-[11px] text-gray-400 space-y-1.5 pt-1">
                <p>💡 Mã đang có:</p>
                <div className="flex flex-wrap gap-1.5">
                  {availablePromos.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyCode(p.code)}
                      title={p.title}
                      className="border border-dashed border-red-300 bg-red-50/60 text-kimdong-red font-bold px-2 py-1 rounded-sm hover:bg-red-100 transition-colors"
                    >
                      {p.code}
                      <span className="text-gray-500 font-medium">
                        {' · '}
                        {p.discount_type === 'PERCENTAGE'
                          ? `-${Number(p.discount_value)}%`
                          : `-${formatVND(Number(p.discount_value))}`}
                        {Number(p.min_order_value) > 0 ? ` (đơn ${formatVND(Number(p.min_order_value))})` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Subtotal Calculation Box */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase text-gray-800 border-b border-gray-100 pb-3">
              Tóm Tắt Đơn Hàng
            </h3>

            <div className="space-y-2.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Tạm tính ({items.length} món):</span>
                <span className="font-bold text-gray-800">{formatVND(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Giảm giá:</span>
                  <span className="font-bold">-{formatVND(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Phí vận chuyển:</span>
                <span className="font-bold text-gray-800">
                  {shippingFee === 0 ? <span className="text-green-600">Miễn phí</span> : formatVND(shippingFee)}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
              <span className="text-sm font-bold text-gray-900">Tổng cộng:</span>
              <span className="text-xl font-black text-kimdong-red">{formatVND(grandTotal)}</span>
            </div>

            <button
              onClick={() => navigate('/checkout', { state: { promoCode: appliedPromo?.code || '' } })}
              className="w-full bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold text-xs sm:text-sm py-3.5 px-4 rounded-lg shadow-lg shadow-red-200 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>TIẾN HÀNH THANH TOÁN</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Hộp thoại xác nhận xóa */}
      {confirm && (
        <Modal
          title={confirm.all ? 'Xóa Tất Cả Sách Trong Giỏ' : 'Xác Nhận Xóa Sách'}
          onClose={() => (deleting ? undefined : setConfirm(null))}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-kimdong-red flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <p className="font-bold text-gray-800 text-sm">
                  {confirm.all
                    ? `Bạn có chắc muốn xóa tất cả ${items.length} sách khỏi giỏ hàng?`
                    : confirm.ids.length === 1
                      ? 'Bạn có chắc muốn xóa sách này khỏi giỏ hàng?'
                      : `Bạn có chắc muốn xóa ${confirm.ids.length} sách đã chọn khỏi giỏ hàng?`}
                </p>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {confirm.all
                    ? 'Toàn bộ sách trong giỏ sẽ bị gỡ bỏ và tổng tiền được tính lại từ đầu.'
                    : 'Sách sẽ bị gỡ khỏi giỏ và tổng tiền đơn hàng sẽ được tính lại ngay sau đó.'}
                </p>
              </div>
            </div>

            {/* Danh sách sách sắp xóa */}
            <div className="border border-gray-100 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto bg-gray-50/60">
              {items
                .filter((i) => confirm.ids.includes(i.id))
                .map((i) => (
                  <div key={i.id} className="px-3 py-2 flex items-center justify-between gap-3">
                    <span className="font-bold text-gray-700 truncate">{i.title}</span>
                    <span className="text-gray-400 shrink-0">x{i.quantity}</span>
                  </div>
                ))}
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2 bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold rounded-lg shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
