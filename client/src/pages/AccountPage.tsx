import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User as UserIcon, Package, Heart, Lock, LogOut, CheckCircle2, Clock, Truck, ShieldAlert, Eye, MapPin, CreditCard, Tag, XCircle, RefreshCw, Star, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Modal } from '../components/common/Modal';
import { ReviewForm } from '../components/review/ReviewForm';
import { Order, ReviewableBook } from '../types';
import { formatVND, formatDate } from '../utils/format';

export const AccountPage: React.FC = () => {
  const { user, updateUser, requestLogout } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('orders');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  // Change password modal state
  const [isPwOpen, setIsPwOpen] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwData, setPwData] = useState({ current_password: '', new_password: '', confirm_password: '' });

  // Order detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Đánh giá sách đã mua (đơn hoàn thành)
  const [reviewableBooks, setReviewableBooks] = useState<ReviewableBook[]>([]);
  const [reviewTarget, setReviewTarget] = useState<ReviewableBook | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const fetchReviewableBooks = async () => {
    setLoadingReviews(true);
    try {
      const res = await api.get('/reviews/my-books');
      setReviewableBooks(res.data.books || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (user) fetchReviewableBooks();
  }, [user]);

  // Profile Form state
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    province: user?.province || '',
    district: user?.district || '',
    ward: user?.ward || ''
  });

  // Tải lại danh sách đơn hàng (giữ modal chi tiết đang mở đồng bộ theo dữ liệu mới)
  const fetchOrders = async (showSpinner = false) => {
    if (showSpinner) setRefreshingOrders(true);
    try {
      const res = await api.get('/orders');
      const list: Order[] = res.data.orders || [];
      setOrders(list);
      setSelectedOrder((current) => (current ? list.find((o) => o.id === current.id) || current : current));
      setLastUpdated(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
      return list;
    } catch (error: any) {
      console.error(error);
      if (showSpinner) {
        showToast(error.response?.data?.message || 'Không tải được danh sách đơn hàng', 'error');
      }
      return null;
    } finally {
      setLoadingOrders(false);
      if (showSpinner) setRefreshingOrders(false);
    }
  };

  const handleRefreshOrders = async () => {
    const list = await fetchOrders(true);
    if (list) showToast('Đã cập nhật trạng thái đơn hàng', 'success');
  };

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name,
        phone: user.phone || '',
        address: user.address || '',
        province: user.province || '',
        district: user.district || '',
        ward: user.ward || ''
      });

      fetchOrders();
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/auth/me', profileData);
      updateUser(profileData);
      showToast('Cập nhật thông tin tài khoản thành công', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi cập nhật profile', 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwData.new_password !== pwData.confirm_password) {
      showToast('Mật khẩu nhập lại không khớp', 'error');
      return;
    }
    setSavingPw(true);
    try {
      const res = await api.put('/auth/change-password', {
        current_password: pwData.current_password,
        new_password: pwData.new_password
      });
      showToast(res.data.message || 'Đổi mật khẩu thành công', 'success');
      setPwData({ current_password: '', new_password: '', confirm_password: '' });
      setIsPwOpen(false);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi đổi mật khẩu', 'error');
    } finally {
      setSavingPw(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-sm font-bold text-[11px]">Chờ xác nhận</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-sm font-bold text-[11px]">Đã xác nhận</span>;
      case 'PROCESSING':
        return <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-sm font-bold text-[11px]">Đang đóng gói</span>;
      case 'SHIPPING':
        return <span className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-sm font-bold text-[11px]">Đang giao hàng</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-1 bg-green-50 text-green-600 rounded-sm font-bold text-[11px]">Đã giao thành công</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-sm font-bold text-[11px]">Đã hủy</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-sm font-bold text-[11px]">{status}</span>;
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      <div className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-100 text-kimdong-red font-black text-2xl flex items-center justify-center border-2 border-red-200">
            {user.full_name.charAt(0)}
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900">{user.full_name}</h1>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
        </div>

        <button
          onClick={requestLogout}
          className="text-xs font-bold text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Account Menu */}
        <div className="bg-white rounded-3xl border border-gray-100 p-4 space-y-1 shadow-sm h-fit">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left text-xs font-bold p-3 rounded-2xl flex items-center gap-2.5 transition-colors ${
              activeTab === 'orders' ? 'bg-kimdong-red text-white shadow-md' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Lịch sử đơn hàng</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left text-xs font-bold p-3 rounded-2xl flex items-center gap-2.5 transition-colors ${
              activeTab === 'profile' ? 'bg-kimdong-red text-white shadow-md' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Thông tin cá nhân</span>
          </button>
        </div>

        {/* Account Content Panel */}
        <div className="lg:col-span-3 space-y-6">
          
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-gray-900">Đơn Hàng Đã Đặt</h2>
                  {lastUpdated && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Cập nhật lúc {lastUpdated}
                      {orders.length > 0 && <span> · {orders.length} đơn hàng</span>}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleRefreshOrders}
                  disabled={refreshingOrders || loadingOrders}
                  title="Tải lại trạng thái đơn hàng"
                  className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 border border-gray-200 hover:border-kimdong-red hover:text-kimdong-red hover:bg-red-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingOrders ? 'animate-spin' : ''}`} />
                  <span>{refreshingOrders ? 'Đang tải...' : 'Làm mới'}</span>
                </button>
              </div>

              {loadingOrders ? (
                <div className="h-40 bg-gray-100 rounded-3xl animate-pulse" />
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center text-xs text-gray-400">
                  Bạn chưa có đơn hàng nào tại NXB Kim Đồng.
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:border-red-200 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs text-kimdong-red">#{ord.order_code}</span>
                            <span className="text-[11px] text-gray-400">{formatDate(ord.created_at)}</span>
                          </div>
                          <p className="text-[11px] text-gray-500">
                            {ord.items?.length || 0} sản phẩm
                            {ord.items && ord.items.length > 0 && (
                              <span className="text-gray-400">
                                {' · '}
                                {ord.items[0].book_title}
                                {ord.items.length > 1 ? ` và ${ord.items.length - 1} sách khác` : ''}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400">Tổng tiền</p>
                            <p className="font-black text-kimdong-red text-sm">{formatVND(ord.total_amount)}</p>
                          </div>
                          {renderStatusBadge(ord.order_status)}
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="flex items-center gap-1 text-[11px] font-bold text-gray-700 hover:text-white border border-gray-200 hover:border-kimdong-red hover:bg-kimdong-red px-3 py-2 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Chi tiết</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sách đã mua & đơn đã hoàn thành -> có thể đánh giá */}
          {activeTab === 'orders' && !loadingReviews && reviewableBooks.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-gray-100 p-5 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold uppercase text-gray-800">Đánh Giá Sách Đã Mua</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {reviewableBooks.filter((b) => !b.has_reviewed).length > 0
                      ? `${reviewableBooks.filter((b) => !b.has_reviewed).length} sách đang chờ đánh giá của bạn`
                      : 'Bạn đã đánh giá tất cả sách đã mua'}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {reviewableBooks.map((b) => (
                  <div key={b.book_id} className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={b.book_image}
                        alt=""
                        className="w-11 h-14 object-contain bg-gray-50 rounded border border-gray-100 p-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <Link
                          to={`/books/${b.book_slug || b.book_id}`}
                          className="font-bold text-xs text-gray-800 hover:text-kimdong-red line-clamp-2 transition-colors"
                        >
                          {b.book_title}
                        </Link>
                        <p className="text-[10px] text-gray-400">
                          Đơn #{b.order_code} · {formatDate(b.purchased_at)}
                        </p>
                        {b.has_reviewed && (
                          <div className="flex items-center gap-1 mt-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${s <= Number(b.my_rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                              />
                            ))}
                            <span className="text-[10px] text-gray-400 ml-0.5">Đã đánh giá</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setReviewTarget(b)}
                      className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-lg transition-colors shrink-0 ${
                        b.has_reviewed
                          ? 'text-gray-600 border border-gray-200 hover:bg-gray-50'
                          : 'text-white bg-kimdong-red hover:bg-kimdong-darkred shadow'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{b.has_reviewed ? 'Sửa đánh giá' : 'Đánh giá ngay'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Detail Modal */}
          {selectedOrder && (
            <Modal
              title={`Chi Tiết Đơn Hàng #${selectedOrder.order_code}`}
              onClose={() => setSelectedOrder(null)}
              maxWidth="max-w-xl"
            >
              <div className="space-y-4 text-xs">
                {/* Trạng thái + ngày đặt */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Ngày đặt hàng</p>
                    <p className="font-bold text-gray-800">{formatDate(selectedOrder.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Trạng thái</p>
                    {renderStatusBadge(selectedOrder.order_status)}
                  </div>
                </div>

                {/* Người nhận */}
                <div className="space-y-1.5">
                  <p className="font-bold text-gray-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-kimdong-red" />
                    <span>Thông tin giao hàng</span>
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-gray-600">
                    <p>Người nhận: <strong className="text-gray-800">{selectedOrder.customer_name}</strong> — {selectedOrder.customer_phone}</p>
                    <p>Email: <strong className="text-gray-800">{selectedOrder.customer_email}</strong></p>
                    <p>
                      Địa chỉ:{' '}
                      <strong className="text-gray-800">
                        {[selectedOrder.shipping_address, selectedOrder.shipping_ward, selectedOrder.shipping_district, selectedOrder.shipping_province]
                          .filter(Boolean)
                          .join(', ')}
                      </strong>
                    </p>
                    {selectedOrder.notes && <p>Ghi chú: <strong className="text-gray-800">{selectedOrder.notes}</strong></p>}
                  </div>
                </div>

                {/* Sản phẩm */}
                <div className="space-y-1.5">
                  <p className="font-bold text-gray-800">Sản phẩm ({selectedOrder.items?.length || 0})</p>
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.book_image}
                            alt=""
                            className="w-10 h-12 object-contain bg-gray-50 rounded p-0.5 border border-gray-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 line-clamp-2">{item.book_title}</p>
                            <p className="text-[11px] text-gray-400">
                              {formatVND(item.price)} x {item.quantity}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-gray-900 shrink-0">{formatVND(item.total_price)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Thanh toán */}
                <div className="space-y-2">
                  <p className="font-bold text-gray-800 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-kimdong-red" />
                    <span>Thanh toán</span>
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-gray-600">
                    <div className="flex justify-between">
                      <span>Tạm tính:</span>
                      <span className="font-bold text-gray-800">{formatVND(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Giảm giá:
                        </span>
                        <span className="font-bold">-{formatVND(selectedOrder.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Phí vận chuyển:</span>
                      <span className="font-bold text-gray-800">
                        {selectedOrder.shipping_fee === 0 ? <span className="text-green-600">Miễn phí</span> : formatVND(selectedOrder.shipping_fee)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phương thức:</span>
                      <span className="font-bold text-gray-800">{selectedOrder.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tình trạng thanh toán:</span>
                      <span className={`font-bold ${selectedOrder.payment_status === 'PAID' ? 'text-green-600' : 'text-amber-600'}`}>
                        {selectedOrder.payment_status === 'PAID' ? 'Đã thanh toán' : selectedOrder.payment_status === 'REFUNDED' ? 'Đã hoàn tiền' : 'Chưa thanh toán'}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-1.5 flex justify-between items-baseline">
                      <span className="font-bold text-gray-900">Tổng thanh toán:</span>
                      <span className="text-base font-black text-kimdong-red">{formatVND(selectedOrder.total_amount)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-5 py-2 bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold rounded-lg shadow"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm">
              <h2 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3">
                Cập Nhật Thông Tin Cá Nhân
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Họ tên</label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 mb-1">Địa chỉ cụ thể</label>
                  <input
                    type="text"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tỉnh / Thành phố</label>
                  <input
                    type="text"
                    value={profileData.province}
                    onChange={(e) => setProfileData({ ...profileData, province: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Quận / Huyện</label>
                  <input
                    type="text"
                    value={profileData.district}
                    onChange={(e) => setProfileData({ ...profileData, district: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow transition-colors"
                >
                  Lưu Thay Đổi
                </button>
                <button
                  type="button"
                  onClick={() => { setPwData({ current_password: '', new_password: '', confirm_password: '' }); setIsPwOpen(true); }}
                  className="flex items-center gap-1.5 text-gray-700 hover:bg-gray-100 border border-gray-200 font-bold text-xs px-5 py-3 rounded-xl transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Đổi Mật Khẩu</span>
                </button>
              </div>
            </form>
          )}

          {isPwOpen && (
            <Modal title="Đổi Mật Khẩu" onClose={() => setIsPwOpen(false)}>
              <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Mật khẩu hiện tại *</label>
                  <input
                    type="password"
                    value={pwData.current_password}
                    onChange={(e) => setPwData({ ...pwData, current_password: e.target.value })}
                    required
                    autoComplete="current-password"
                    className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Mật khẩu mới * (≥ 6 ký tự)</label>
                  <input
                    type="password"
                    value={pwData.new_password}
                    onChange={(e) => setPwData({ ...pwData, new_password: e.target.value })}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nhập lại mật khẩu mới *</label>
                  <input
                    type="password"
                    value={pwData.confirm_password}
                    onChange={(e) => setPwData({ ...pwData, confirm_password: e.target.value })}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                  />
                </div>

                <div className="bg-red-50/60 rounded-lg p-3 border border-red-100 text-[11px] text-gray-600">
                  Sau khi đổi, các phiên đăng nhập khác vẫn dùng được mật khẩu mới này. Phiên hiện tại của bạn không bị thoát ra.
                </div>

                <div className="flex justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsPwOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={savingPw}
                    className="px-5 py-2 bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold rounded-lg shadow disabled:opacity-50"
                  >
                    {savingPw ? 'Đang đổi...' : 'Đổi Mật Khẩu'}
                  </button>
                </div>
              </form>
            </Modal>
          )}

          {/* Modal gửi đánh giá từ Đơn hàng của tôi */}
          {reviewTarget && (
            <Modal
              title={`Đánh Giá: ${reviewTarget.book_title}`}
              onClose={() => setReviewTarget(null)}
              maxWidth="max-w-lg"
            >
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3 text-[11px] text-gray-500">
                  Bạn đã mua sách này trong đơn <strong className="text-gray-800">#{reviewTarget.order_code}</strong> đã giao thành công.
                </div>
                <ReviewForm
                  bookId={reviewTarget.book_id}
                  bookTitle={reviewTarget.book_title}
                  forceOpen
                  existingReview={reviewTarget.has_reviewed ? { rating: Number(reviewTarget.my_rating) || 5, comment: '' } : null}
                  onSubmitted={() => {
                    fetchReviewableBooks();
                    setReviewTarget(null);
                  }}
                />
              </div>
            </Modal>
          )}

        </div>

      </div>

    </div>
  );
};
