import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Eye, EyeOff, Image as ImageIcon, Link2 } from 'lucide-react';
import api from '../services/api';
import { Banner } from '../types';
import { Modal } from '../components/common/Modal';
import { BANNER_THEMES } from '../constants/bannerThemes';
import { useToast } from '../context/ToastContext';

const THEME_LABELS: Record<string, string> = {
  red: 'Đỏ Kim Đồng',
  dark: 'Xanh Đen (Conan)',
  amber: 'Cam Vàng (Khuyến mãi)',
  blue: 'Xanh Dương',
  green: 'Xanh Lá',
  purple: 'Tím'
};

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  badge: 'NXB Kim Đồng Nổi Bật',
  cta_text: 'Xem ngay',
  cta_link: '/books',
  theme: 'red',
  image_url: '',
  display_order: 0,
  is_active: 1
};

export const AdminBannersPage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const fetchBanners = () => {
    setLoading(true);
    api.get('/banners/all')
      .then((res) => setBanners(res.data.banners || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle || '',
        badge: banner.badge || 'NXB Kim Đồng Nổi Bật',
        cta_text: banner.cta_text || 'Xem ngay',
        cta_link: banner.cta_link,
        theme: banner.theme || 'red',
        image_url: banner.image_url || '',
        display_order: banner.display_order ?? 0,
        is_active: banner.is_active ? 1 : 0
      });
    } else {
      setEditingBanner(null);
      setFormData({ ...EMPTY_FORM });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBanner?.id) {
        await api.put(`/banners/${editingBanner.id}`, formData);
        showToast('Cập nhật banner thành công', 'success');
      } else {
        await api.post('/banners', formData);
        showToast('Thêm banner mới thành công', 'success');
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi thao tác banner', 'error');
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await api.put(`/banners/${banner.id}`, { ...banner, is_active: banner.is_active ? 0 : 1 });
      showToast(banner.is_active ? 'Đã ẩn banner khỏi trang chủ' : 'Đã hiển thị banner', 'info');
      fetchBanners();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi cập nhật banner', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa banner này khỏi trang chủ?')) return;
    try {
      const res = await api.delete(`/banners/${id}`);
      showToast(res.data.message || 'Đã xóa banner', 'info');
      fetchBanners();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi xóa banner', 'error');
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900">Quản Lý Banner Trang Chủ</h1>
          <p className="text-xs text-gray-400">Thêm, sửa, ẩn/hiện các banner xoay vòng (carousel) bên ngoài cửa hàng</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-kimdong-red hover:bg-kimdong-darkred text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Banner Mới</span>
        </button>
      </div>

      {/* Banner List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">Chưa có banner nào. Bấm "Thêm Banner Mới" để hiển thị trên trang chủ.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {banners.map((banner) => (
              <li key={banner.id} className="flex items-center gap-4 p-4 hover:bg-gray-50/50">
                {/* Live theme preview */}
                <div className={`hidden sm:flex w-36 h-20 shrink-0 rounded-lg bg-gradient-to-r ${BANNER_THEMES[banner.theme || 'red']} items-center justify-center overflow-hidden relative`}>
                  {banner.image_url ? (
                    <img src={banner.image_url} alt="" className="w-full h-full object-cover opacity-70" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-white/70" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-gray-800 truncate">{banner.title}</p>
                    {banner.is_active ? (
                      <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-green-50 text-green-600">ĐANG HIỆN</span>
                    ) : (
                      <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-gray-100 text-gray-500">ẨN</span>
                    )}
                  </div>
                  {banner.subtitle && <p className="text-xs text-gray-400 truncate mt-0.5">{banner.subtitle}</p>}
                  <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                    <Link2 className="w-3 h-3" />
                    <span className="font-mono">{banner.cta_link}</span>
                    <span className="text-gray-300">•</span>
                    <span>{THEME_LABELS[banner.theme || 'red'] || banner.theme}</span>
                    <span className="text-gray-300">•</span>
                    <span>Thứ tự: {banner.display_order ?? 0}</span>
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => handleToggleActive(banner)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title={banner.is_active ? 'Ẩn khỏi trang chủ' : 'Hiển thị'}>
                    {banner.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleOpenModal(banner)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Sửa">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(banner.id!)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Xóa">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Banner Form Modal */}
      {isModalOpen && (
        <Modal title={editingBanner ? 'Chỉnh Sửa Banner' : 'Thêm Banner Mới'} onClose={() => setIsModalOpen(false)} maxWidth="max-w-xl">
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tiêu đề banner *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: TUẦN LỄ SÁCH KIM ĐỒNG - GIẢM ĐẾN 50%"
                  required
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Mô tả ngắn</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="VD: Ưu đãi lớn nhất trong năm cho tủ sách thiếu nhi"
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nhãn (badge)</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Chữ trên nút bấm</label>
                  <input
                    type="text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Đường dẫn khi bấm nút *</label>
                <input
                  type="text"
                  value={formData.cta_link}
                  onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                  placeholder="/books?category_id=6"
                  required
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Chủ đề màu nền</label>
                  <select
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red bg-white"
                  >
                    {Object.keys(BANNER_THEMES).map((t) => (
                      <option key={t} value={t}>{THEME_LABELS[t] || t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Ảnh nền phủ toàn bộ banner</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://... (link ảnh ngang, nên từ 1500x500 trở lên)"
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                  {'Ảnh sẽ phủ toàn bộ banner, chữ tự đè lên lớp nền tối. Để trống » banner dùng nền chuyển màu theo chủ đề.'}
                  {' Lưu ý: dán link ảnh gốc lớn (mở ảnh, chuột phải, "Sao chép địa chỉ hình ảnh"), tránh link thumbnail nhỏ vì sẽ vỡ hình khi phóng full.'}
                </p>
              </div>

              {/* Live preview */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Xem trước trên trang chủ</p>
                <div className={`relative rounded-lg overflow-hidden h-28 text-white bg-gradient-to-r ${BANNER_THEMES[formData.theme]}`}>
                  {formData.image_url && (
                    <img
                      src={formData.image_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                  <div className="absolute inset-0 p-3.5 flex flex-col justify-center space-y-1">
                    <span className="self-start text-[8px] font-extrabold uppercase tracking-widest bg-white/20 border border-white/30 rounded-sm px-1.5 py-0.5">{formData.badge}</span>
                    <p className="text-sm font-black leading-tight drop-shadow-sm">{formData.title || 'TIÊU ĐỀ BANNER'}</p>
                    <div className="flex items-center gap-2">
                      <span className="bg-white text-kimdong-red text-[8px] font-black px-2 py-0.5 rounded-sm">{formData.cta_text} →</span>
                      <p className="text-[9px] text-white/80 truncate">{formData.subtitle}</p>
                    </div>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.is_active === 1}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                  className="rounded text-kimdong-red focus:ring-kimdong-red"
                />
                Hiển thị banner trên trang chủ
              </label>

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
                  className="px-6 py-2 bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold rounded-lg shadow"
                >
                  Lưu Banner
                </button>
              </div>
            </form>
        </Modal>
      )}

    </div>
  );
};
