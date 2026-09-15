import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SiteLogo } from './SiteLogo';
import { ChevronDown, Book, Flame, Sparkles, Tag, Newspaper, Info, Layers } from 'lucide-react';
import api from '../../services/api';
import { Category } from '../../types';

interface NavigationProps {
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ mobileMenuOpen, onCloseMobileMenu }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [megaOpen, setMegaOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        setCategories(res.data.categories || []);
      })
      .catch((err) => console.error(err));
  }, []);

  const navLinks = [
    { label: 'SÁCH MỚI', path: '/books?sort=newest', icon: Sparkles, badge: 'NEW' },
    { label: 'BÁN CHẠY', path: '/books?sort=bestseller', icon: Flame, badge: 'HOT' },
    { label: 'KHUYẾN MÃI', path: '/books?on_sale=true', icon: Tag, badge: '-20%' },
    { label: 'TIN TỨC', path: '/news', icon: Newspaper },
    { label: 'GIỚI THIỆU', path: '/about', icon: Info },
  ];

  return (
    <>
      {/* Desktop Navigation Bar */}
      <nav className="hidden md:block bg-white border-b border-gray-200 shadow-sm relative z-30">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            
            {/* Mega Menu Trigger: DANH MỤC SẢN PHẨM */}
            <div
              className="relative"
              onMouseEnter={() => setMegaOpen(true)}
              onMouseLeave={() => setMegaOpen(false)}
            >
              <button className="flex items-center gap-2 bg-kimdong-red hover:bg-kimdong-darkred text-white font-bold text-xs uppercase px-5 py-3.5 tracking-wide transition-colors">
                <Layers className="w-4 h-4" />
                <span>DANH MỤC SẢN PHẨM</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${megaOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mega Menu Dropdown */}
              {megaOpen && (
                <div className="absolute top-full left-0 w-[850px] bg-white rounded-b-xl shadow-2xl border border-gray-100 p-6 grid grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-1 duration-200 z-50">
                  {categories.map((cat) => (
                    <div key={cat.id} className="space-y-3">
                      <Link
                        to={`/books?category_id=${cat.id}`}
                        onClick={() => setMegaOpen(false)}
                        className="font-bold text-xs uppercase text-kimdong-red hover:text-kimdong-darkred flex items-center gap-1.5 border-b border-red-100 pb-1.5"
                      >
                        <Book className="w-3.5 h-3.5" />
                        <span>{cat.name}</span>
                      </Link>
                      {cat.children && cat.children.length > 0 && (
                        <ul className="space-y-1.5">
                          {cat.children.map((sub) => (
                            <li key={sub.id}>
                              <Link
                                to={`/books?category_id=${sub.id}`}
                                onClick={() => setMegaOpen(false)}
                                className="text-xs text-gray-600 hover:text-kimdong-red hover:translate-x-1 inline-block transition-all"
                              >
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                  
                  {/* Highlight Feature Card in Mega Menu */}
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 flex flex-col justify-between border border-red-100">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-kimdong-red bg-white px-2 py-0.5 rounded-md border border-red-200">
                        NXB Kim Đồng
                      </span>
                      <h4 className="text-xs font-bold text-gray-800 mt-2">Manga & Comic Mới Nhất</h4>
                      <p className="text-[11px] text-gray-500 mt-1">Đầy đủ bộ Doraemon, Conan, One Piece vừa phát hành.</p>
                    </div>
                    <Link
                      to="/books?category_id=1"
                      onClick={() => setMegaOpen(false)}
                      className="mt-3 text-xs font-bold text-kimdong-red hover:underline flex items-center gap-1"
                    >
                      Khám phá ngay →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Main Menu Links */}
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname + location.search === link.path;
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`flex items-center gap-1.5 text-xs font-bold px-4 py-3.5 transition-colors relative ${
                    isActive ? 'text-kimdong-red' : 'text-gray-700 hover:text-kimdong-red'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-red-100 text-kimdong-red rounded-md uppercase">
                      {link.badge}
                    </span>
                  )}
                  {isActive && <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-kimdong-red rounded-full" />}
                </Link>
              );
            })}
          </div>

          <div className="text-xs font-bold text-gray-500 hidden lg:block">
            🎁 Miễn phí giao hàng từ <span className="text-kimdong-red font-black">200.000đ</span>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCloseMobileMenu} />
          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
            <div className="p-4 bg-kimdong-red text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <SiteLogo onDark heightClass="h-8" onClick={onCloseMobileMenu} />
                <span className="font-extrabold text-sm tracking-wide">NXB KIM ĐỒNG</span>
              </div>
              <button onClick={onCloseMobileMenu} className="p-1 hover:bg-white/20 rounded-lg">
                <Info className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Danh mục sách</h3>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <div key={cat.id} className="py-1">
                      <Link
                        to={`/books?category_id=${cat.id}`}
                        onClick={onCloseMobileMenu}
                        className="font-bold text-sm text-gray-800 hover:text-kimdong-red block"
                      >
                        {cat.name}
                      </Link>
                      {cat.children && (
                        <div className="pl-3 mt-1 space-y-1 border-l-2 border-red-100">
                          {cat.children.map((sub) => (
                            <Link
                              key={sub.id}
                              to={`/books?category_id=${sub.id}`}
                              onClick={onCloseMobileMenu}
                              className="text-xs text-gray-600 hover:text-kimdong-red block py-0.5"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Khám phá</h3>
                <div className="space-y-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      to={link.path}
                      onClick={onCloseMobileMenu}
                      className="flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-kimdong-red py-1.5"
                    >
                      <span>{link.label}</span>
                      {link.badge && (
                        <span className="text-[10px] font-bold bg-red-100 text-kimdong-red px-2 py-0.5 rounded-sm">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
