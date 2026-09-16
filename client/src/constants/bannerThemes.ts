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

// Trước đây ở đây có mảng FALLBACK_BANNERS chứa 3 banner cứng, dùng làm dữ liệu
// hiển thị tạm khi gọi API thất bại. Cách làm đó khiến banner cũ vẫn hiện trên
// trang chủ dù đã xoá hoặc sửa trong database, nên đã bị loại bỏ.
// Nay banner chỉ lấy từ API /api/banners; nếu chưa có banner nào thì không hiện gì.
