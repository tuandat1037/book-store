import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User as UserIcon, LogOut, ShieldCheck, Menu, X, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import api from '../../services/api';
import { Book } from '../../types';
import { formatVND } from '../../utils/format';
import { SiteLogo } from './SiteLogo';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const [queryStr, setQueryStr] = useState('');
  const [suggestions, setSuggestions] = useState<Book[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const { cartCount, subtotal } = useCart();
  const { wishlistIds } = useWishlist();

  // Debounce autocomplete search
  useEffect(() => {
    if (!queryStr.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      api.get(`/books?q=${encodeURIComponent(queryStr.trim())}&limit=5`)
        .then((res) => {
          setSuggestions(res.data.books || []);
          setShowSuggestions(true);
        })
        .catch(() => setSuggestions([]));
    }, 250);

    return () => clearTimeout(timer);
  }, [queryStr]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (queryStr.trim()) {
      setShowSuggestions(false);
      navigate(`/books?q=${encodeURIComponent(queryStr.trim())}`);
    }
  };

  return (
    <header className="bg-white sticky top-0 z-40 shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          
          {/* Mobile Menu Button & Search */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={onToggleMobileMenu}
              className="p-2 text-gray-700 hover:text-kimdong-red hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Desktop Left: Search Box */}
          <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={queryStr}
                onChange={(e) => setQueryStr(e.target.value)}
                onFocus={() => queryStr.trim() && setShowSuggestions(true)}
                placeholder="Tìm kiếm sách, tác giả..."
                className="w-full bg-gray-100 focus:bg-white text-sm text-gray-800 rounded-xl pl-4 pr-10 py-2.5 border border-transparent focus:border-kimdong-red focus:ring-2 focus:ring-red-100 transition-all outline-none"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-kimdong-red transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="p-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                  Gợi ý tìm kiếm
                </div>
                <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                  {suggestions.map((book) => (
                    <Link
                      key={book.id}
                      to={`/books/${book.slug}`}
                      onClick={() => setShowSuggestions(false)}
                      className="flex items-center gap-3 p-3 hover:bg-red-50/50 transition-colors"
                    >
                      <img
                        src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'}
                        alt={book.title}
                        className="w-10 h-14 object-contain rounded border bg-gray-50 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{book.title}</p>
                        <p className="text-xs text-gray-500 truncate">{book.author_name}</p>
                        <p className="text-xs font-semibold text-kimdong-red mt-0.5">
                          {formatVND(book.sale_price || book.price)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Center Logo */}
          <div className="flex-1 md:flex-none text-center">
            <SiteLogo heightClass="h-10 sm:h-12" showText />
          </div>

          {/* Right Icons: Account, Wishlist, Cart */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Wishlist Icon */}
            <Link
              to="/wishlist"
              className="relative p-2 text-gray-700 hover:text-kimdong-red hover:bg-gray-100 rounded-lg transition-all"
              title="Danh sách yêu thích"
            >
              <Heart className="w-6 h-6" />
              {wishlistIds.length > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-kimdong-red text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {wishlistIds.length}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative flex items-center gap-2.5 p-2 text-gray-700 hover:text-kimdong-red hover:bg-gray-100 rounded-lg transition-all group"
              title="Giỏ hàng của bạn"
            >
              <div className="relative">
                <ShoppingBag className="w-6 h-6 group-hover:scale-105 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-5 h-5 bg-kimdong-red text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden lg:block text-left">
                <span className="block text-[10px] text-gray-400 font-semibold uppercase">Giỏ hàng</span>
                <span className="block text-xs font-bold text-kimdong-red">{formatVND(subtotal)}</span>
              </div>
            </Link>

            {/* Account / User Menu */}
            <div className="relative">
              {user ? (
                <div>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-kimdong-red font-bold flex items-center justify-center text-sm uppercase">
                      {user.full_name.charAt(0)}
                    </div>
                    <span className="hidden sm:inline text-xs font-semibold text-gray-700 max-w-[100px] truncate">
                      {user.full_name}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-400 font-medium">Tài khoản của</p>
                        <p className="text-sm font-bold text-gray-800 truncate">{user.full_name}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-red-50 text-kimdong-red rounded-md">
                          {user.role}
                        </span>
                      </div>

                      {(user.role === 'ADMIN' || user.role === 'EMPLOYEE') && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-kimdong-red hover:bg-red-50 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Trang Quản Trị Admin</span>
                        </Link>
                      )}

                      <Link
                        to="/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span>Quản lý tài khoản & Đơn hàng</span>
                      </Link>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-kimdong-red hover:bg-red-50 rounded-lg transition-all"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Đăng nhập</span>
                  </Link>
                  <Link
                    to="/register"
                    className="hidden sm:inline-block px-3.5 py-1.5 text-xs font-semibold bg-kimdong-red text-white hover:bg-kimdong-darkred rounded-lg shadow-sm transition-all"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Search Bar below logo */}
        <div className="mt-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={queryStr}
              onChange={(e) => setQueryStr(e.target.value)}
              placeholder="Tìm kiếm sách..."
              className="w-full bg-gray-100 text-sm rounded-xl pl-4 pr-10 py-2 border border-transparent focus:border-kimdong-red outline-none"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </header>
  );
};
