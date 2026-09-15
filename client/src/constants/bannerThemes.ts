import { Banner } from '../types';

// Gradient themes managed from the Admin -> Banners page.
// Kept in its own module so component files can export a single component
// (otherwise React Fast Refresh refuses to hot-update them).
export const BANNER_THEMES: Record<string, string> = {
  red: 'from-red-600 via-red-500 to-rose-600',
  dark: 'from-slate-900 via-blue-900 to-indigo-900',
  amber: 'from-amber-600 via-red-600 to-orange-600',
  blue: 'from-sky-600 via-blue-600 to-indigo-600',
  green: 'from-emerald-600 via-teal-600 to-cyan-700',
  purple: 'from-purple-600 via-fuchsia-600 to-pink-600'
};

// Shown until /api/banners responds (or if the API is down)
export const FALLBACK_BANNERS: Banner[] = [
  {
    id: 1,
    title: 'DORAEMON - TẬP KỶ NIỆM 2024',
    subtitle: 'Hành trình bảo bối kỳ diệu cùng mèo máy và nhóm bạn Nobita',
    badge: 'NXB Kim Đồng Nổi Bật',
    cta_text: 'Khám phá ngay',
    cta_link: '/books?category_id=6',
    theme: 'red',
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 2,
    title: 'THÁM TỬ LỪNG DANH CONAN - TẬP 100',
    subtitle: 'Đỉnh cao trinh thám thế giới - Cột mốc 100 tập vang dội',
    badge: 'NXB Kim Đồng Nổi Bật',
    cta_text: 'Mua ngay hôm nay',
    cta_link: '/books?category_id=7',
    theme: 'dark',
    image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 3,
    title: 'TUẦN LỄ SÁCH NXB KIM ĐỒNG',
    subtitle: 'Ưu đãi lên đến 30% cho toàn bộ tủ sách Thiếu nhi & Manga',
    badge: 'NXB Kim Đồng Nổi Bật',
    cta_text: 'Xem khuyến mãi',
    cta_link: '/books?on_sale=true',
    theme: 'amber',
    image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=1000'
  }
];
