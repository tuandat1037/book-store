import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, ShoppingBag, Layers, Users, Home, LogOut, ShieldCheck, Megaphone, PenLine, Ticket, UserRound, Warehouse } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SiteLogo } from '../components/common/SiteLogo';

export const AdminLayout: React.FC = () => {
  const { user, requestLogout, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  // Protect route
  if (!user || (user.role !== 'ADMIN' && user.role !== 'EMPLOYEE')) {
    return <Navigate to="/login" replace />;
  }

  const menuItems = [
    { label: 'Dashboard Thống Kê', path: '/admin', icon: LayoutDashboard, adminOnly: false },
    { label: 'Quản Lý Sách', path: '/admin/books', icon: BookOpen, adminOnly: false },
    { label: 'Quản Lý Kho', path: '/admin/inventory', icon: Warehouse, adminOnly: false },
    { label: 'Quản Lý Danh Mục', path: '/admin/categories', icon: Layers, adminOnly: false },
    { label: 'Quản Lý Tác Giả', path: '/admin/authors', icon: PenLine, adminOnly: false },
    { label: 'Quản Lý Đơn Hàng', path: '/admin/orders', icon: ShoppingBag, adminOnly: false },
    { label: 'Quản Lý Khuyến Mãi', path: '/admin/promotions', icon: Ticket, adminOnly: false },
    { label: 'Quản Lý Banner', path: '/admin/banners', icon: Megaphone, adminOnly: false },
    { label: 'Quản Lý Khách Hàng', path: '/admin/customers', icon: UserRound, adminOnly: false },
    { label: 'Tài Khoản Hệ Thống', path: '/admin/users', icon: Users, adminOnly: true },
  ].filter((item) => !item.adminOnly || user.role === 'ADMIN');

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* Sidebar — cố định theo chiều cao màn hình, không bị kéo dài theo nội dung */}
      <aside className="w-64 bg-gray-900 text-gray-300 flex flex-col shrink-0 shadow-xl h-screen sticky top-0">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <SiteLogo onDark clickable={false} heightClass="h-10" />
            <div>
              <span className="block font-black text-white text-base tracking-wide">ADMIN PORTAL</span>
              <span className="block text-[10px] text-red-400 font-bold uppercase">NXB Kim Đồng</span>
            </div>
          </div>

          <nav className="space-y-1.5 pt-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive ? 'bg-kimdong-red text-white shadow-lg shadow-red-900/50' : 'hover:bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Hồ sơ nhanh cuối thanh bên (không còn nút bấm bị đẩy xuống đây) */}
        <div className="mt-auto p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-lg bg-gray-800 text-red-400 font-black flex items-center justify-center text-sm uppercase shrink-0">
              {user.full_name?.charAt(0) || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{user.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-8 py-3 flex justify-between items-center gap-4 shadow-sm sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-kimdong-red" />
            <span className="font-extrabold text-sm text-gray-800 hidden sm:inline">Hệ Thống Quản Trị Kim Đồng Online</span>
            <span className="font-extrabold text-sm text-gray-800 sm:hidden">Quản Trị</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 mr-1">
              <span className="text-xs font-bold text-gray-600">Xin chào, {user.full_name}</span>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-red-100 text-kimdong-red rounded-sm uppercase">
                {user.role}
              </span>
            </div>

            <div className="w-px h-6 bg-gray-200 hidden md:block" />

            <Link
              to="/"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all"
              title="Mở cửa hàng ở tab này"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Về trang chủ</span>
              <span className="sm:hidden">Trang chủ</span>
            </Link>

            <button
              onClick={requestLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-kimdong-red hover:bg-kimdong-darkred text-white text-xs font-bold shadow-sm hover:shadow transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
              <span className="sm:hidden">Thoát</span>
            </button>
          </div>
        </header>

        <main className="p-8 flex-1">
          <Outlet />
        </main>
      </div>

    </div>
  );
};
