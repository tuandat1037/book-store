import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Flame, Tag, BookOpen, ArrowRight, ArrowDown, ShieldCheck, HeartHandshake } from 'lucide-react';
import { HeroCarousel } from '../components/common/HeroCarousel';
import { BookCard } from '../components/book/BookCard';
import api from '../services/api';
import { Book } from '../types';

export const HomePage: React.FC = () => {
  const [sections, setSections] = useState<{
    featured: Book[];
    newArrivals: Book[];
    bestsellers: Book[];
    promotions: Book[];
    doraemonBooks: Book[];
    conanBooks: Book[];
    onePieceBooks: Book[];
    thieuNhiBooks: Book[];
    vanHocVnBooks: Book[];
  }>({
    featured: [],
    newArrivals: [],
    bestsellers: [],
    promotions: [],
    doraemonBooks: [],
    conanBooks: [],
    onePieceBooks: [],
    thieuNhiBooks: [],
    vanHocVnBooks: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/books/sections/home')
      .then((res) => {
        setSections({
          featured: res.data.featured || [],
          newArrivals: res.data.newArrivals || [],
          bestsellers: res.data.bestsellers || [],
          promotions: res.data.promotions || [],
          doraemonBooks: res.data.doraemonBooks || [],
          conanBooks: res.data.conanBooks || [],
          onePieceBooks: res.data.onePieceBooks || [],
          thieuNhiBooks: res.data.thieuNhiBooks || [],
          vanHocVnBooks: res.data.vanHocVnBooks || []
        });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderSectionHeader = (title: string, icon: React.FC<{ className?: string }>, viewAllPath: string, badge?: string) => {
    const Icon = icon;
    return (
      <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-red-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-100 text-kimdong-red flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span>{title}</span>
              {badge && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-kimdong-red text-white rounded-md uppercase">
                  {badge}
                </span>
              )}
            </h2>
          </div>
        </div>
        <Link
          to={viewAllPath}
          className="text-xs sm:text-sm font-bold text-kimdong-red hover:text-kimdong-darkred flex items-center gap-1 group transition-colors"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-12">
      
      {/* Hero Banner Carousel */}
      <HeroCarousel />

      {/* Quick Access Category Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sticky top-16 z-20 bg-gray-50/90 backdrop-blur-md py-2">
        {[
          { title: 'Doraemon', sectionId: 'section-doraemon', icon: '🐱', sub: 'Truyện tranh', chip: 'bg-sky-50 border border-sky-100', hover: 'hover:border-sky-300', bar: 'bg-sky-500' },
          { title: 'Conan', sectionId: 'section-conan', icon: '🔍', sub: 'Trinh thám', chip: 'bg-indigo-50 border border-indigo-100', hover: 'hover:border-indigo-300', bar: 'bg-indigo-500' },
          { title: 'One Piece', sectionId: 'section-onepiece', icon: '🏴‍☠️', sub: 'Phiêu lưu', chip: 'bg-orange-50 border border-orange-100', hover: 'hover:border-orange-300', bar: 'bg-orange-500' },
          { title: 'Sách Thiếu Nhi', sectionId: 'section-thieunhi', icon: '📚', sub: 'Măng non', chip: 'bg-emerald-50 border border-emerald-100', hover: 'hover:border-emerald-300', bar: 'bg-emerald-500' },
          { title: 'Văn Học VN', sectionId: 'section-vanhoc', icon: '📖', sub: 'Kinh điển', chip: 'bg-rose-50 border border-rose-100', hover: 'hover:border-rose-300', bar: 'bg-rose-500' },
        ].map((item) => (
          <button
            key={item.title}
            onClick={() => scrollToSection(item.sectionId)}
            className={`group relative flex items-center gap-3 overflow-hidden rounded-xl bg-white px-3.5 py-3 text-left shadow-sm transition-all duration-200 hover:shadow-card-hover active:scale-[0.97] border border-gray-200/80 ${item.hover}`}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg transition-transform duration-200 group-hover:-translate-y-0.5 ${item.chip}`}>
              {item.icon}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-extrabold leading-tight text-gray-800">
                {item.title}
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 transition-colors group-hover:text-gray-500">
                {item.sub}
                <ArrowDown className="h-3 w-3 -translate-y-0.5 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100" />
              </span>
            </span>
            <span className={`absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full ${item.bar}`} />
          </button>
        ))}
      </div>

      {/* Section: Flash Sale */}
      <section className="bg-gradient-to-r from-red-600 to-rose-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <span className="bg-white/20 backdrop-blur-md text-white text-[11px] font-extrabold px-3 py-1 rounded-md uppercase tracking-wider">
              ⚡ Flash Sale Kim Đồng
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-2">Sách Khuyến Mãi Hấp Dẫn</h2>
          </div>
          <Link
            to="/books?on_sale=true"
            className="bg-white text-kimdong-red hover:bg-red-50 text-xs font-extrabold px-5 py-2.5 rounded-lg shadow-md transition-all"
          >
            Xem tất cả ưu đãi →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-64 bg-white/10 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sections.promotions.slice(0, 5).map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 1. DORAEMON SECTION WITH FULL GRAPHIC BANNER */}
      {/* ========================================================================= */}
      <section id="section-doraemon" className="scroll-mt-24 space-y-6">
        {/* Custom Header Banner Image for Doraemon */}
        <div className="relative w-full h-32 sm:h-44 rounded-xl overflow-hidden shadow-md border border-sky-200 group">
          <img
            src="https://bizweb.dktcdn.net/100/576/749/themes/1058890/assets/section_banner_4.jpg?1789455607211"
            alt="Doraemon Banner"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-sky-950/90 via-sky-900/70 to-transparent flex items-center justify-between px-6 sm:px-12 text-white">
            <div className="space-y-1.5 max-w-lg">
              <span className="inline-block text-[10px] font-black tracking-widest uppercase bg-white text-sky-600 px-3 py-1 rounded-md shadow-sm">
                Tủ Sách Kim Đồng
              </span>
              <h3 className="text-xl sm:text-3xl font-black tracking-wider drop-shadow-md uppercase">
                DORAEMON - CHÚ MÈO MÁY ĐẾN TỪ TƯƠNG LAI
              </h3>
              <p className="text-xs text-sky-100 hidden sm:block font-medium">
                Đầy đủ bộ truyện ngắn, truyện dài, bảo bối kỳ diệu & sê-ri bóng chày Doras
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/books?category_id=6"
                className="bg-white text-sky-600 font-extrabold text-xs px-5 py-2.5 rounded-lg hover:bg-sky-50 transition-all shadow-lg active:scale-95"
              >
                Khám phá tủ sách →
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-black uppercase text-gray-800 tracking-wider">DORAEMON</h2>
          <div className="w-12 h-1 bg-sky-500 mx-auto rounded-full mt-1" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sections.doraemonBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CONAN SECTION WITH FULL GRAPHIC BANNER */}
      {/* ========================================================================= */}
      <section id="section-conan" className="scroll-mt-24 space-y-6">
        {/* Custom Header Banner Image for Conan */}
        <div className="relative w-full h-32 sm:h-44 rounded-xl overflow-hidden shadow-md border border-slate-700 group">
          <img
            src="https://www.fahasa.com/blog/wp-content/uploads/2025/02/conan-28-dai-dien-e1740715024411.jpeg"
            alt="Conan Banner"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-transparent flex items-center justify-between px-6 sm:px-12 text-white">
            <div className="space-y-1.5 max-w-lg">
              <span className="inline-block text-[10px] font-black tracking-widest uppercase bg-kimdong-red text-white px-3 py-1 rounded-md shadow-sm">
                Sê-ri Trinh Thám Kinh Điển
              </span>
              <h3 className="text-xl sm:text-3xl font-black tracking-wider drop-shadow-md uppercase">
                THÁM TỬ LỪNG DANH CONAN
              </h3>
              <p className="text-xs text-slate-300 hidden sm:block font-medium">
                Cụm vụ án gay cấn, cuộc đấu trí nghẹt thở giữa Conan, Akai Shuichi & Tổ chức Áo Đen
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/books?category_id=7"
                className="bg-white text-slate-900 font-extrabold text-xs px-5 py-2.5 rounded-lg hover:bg-slate-100 transition-all shadow-lg active:scale-95"
              >
                Khám phá tủ sách →
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-black uppercase text-gray-800 tracking-wider">THÁM TỬ LỪNG DANH CONAN</h2>
          <div className="w-12 h-1 bg-slate-800 mx-auto rounded-full mt-1" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sections.conanBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. ONE PIECE SECTION WITH FULL GRAPHIC BANNER */}
      {/* ========================================================================= */}
      <section id="section-onepiece" className="scroll-mt-24 space-y-6">
        {/* Custom Header Banner Image for One Piece */}
        <div className="relative w-full h-32 sm:h-44 rounded-xl overflow-hidden shadow-md border border-amber-500 group">
          <img
            src="https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=1600"
            alt="One Piece Banner"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-amber-950/95 via-orange-950/80 to-transparent flex items-center justify-between px-6 sm:px-12 text-white">
            <div className="space-y-1.5 max-w-lg">
              <span className="inline-block text-[10px] font-black tracking-widest uppercase bg-white text-amber-800 px-3 py-1 rounded-md shadow-sm">
                Manga Bán Chạy Nhất Lịch Sử
              </span>
              <h3 className="text-xl sm:text-3xl font-black tracking-wider drop-shadow-md uppercase">
                ONE PIECE - HÀNH TRÌNH VUA HẢI TẶC
              </h3>
              <p className="text-xs text-amber-100 hidden sm:block font-medium">
                Tân Tứ Hoàng Luffy & Băng Mũ Rơm giương buồm chinh phục kho báu huyền thoại One Piece
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/books?category_id=8"
                className="bg-white text-amber-800 font-extrabold text-xs px-5 py-2.5 rounded-lg hover:bg-amber-50 transition-all shadow-lg active:scale-95"
              >
                Khám phá tủ sách →
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-black uppercase text-gray-800 tracking-wider">ONE PIECE</h2>
          <div className="w-12 h-1 bg-amber-600 mx-auto rounded-full mt-1" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sections.onePieceBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SÁCH THIẾU NHI SECTION WITH FULL GRAPHIC BANNER */}
      {/* ========================================================================= */}
      <section id="section-thieunhi" className="scroll-mt-24 space-y-6">
        {/* Custom Header Banner Image for Thieu Nhi */}
        <div className="relative w-full h-32 sm:h-44 rounded-xl overflow-hidden shadow-md border border-emerald-400 group">
          <img
            src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=1600"
            alt="Sách Thiếu Nhi Banner"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-teal-900/80 to-transparent flex items-center justify-between px-6 sm:px-12 text-white">
            <div className="space-y-1.5 max-w-lg">
              <span className="inline-block text-[10px] font-black tracking-widest uppercase bg-white text-emerald-800 px-3 py-1 rounded-md shadow-sm">
                Sách Thiếu Nhi Kim Đồng
              </span>
              <h3 className="text-xl sm:text-3xl font-black tracking-wider drop-shadow-md uppercase">
                SÁCH THIẾU NHI - ƯƠM MẦM TRI THỨC
              </h3>
              <p className="text-xs text-emerald-100 hidden sm:block font-medium">
                Truyện tranh minh họa màu sinh động, nuôi dưỡng tâm hồn & trí thông minh EQ, IQ
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/books?category_id=2"
                className="bg-white text-emerald-800 font-extrabold text-xs px-5 py-2.5 rounded-lg hover:bg-emerald-50 transition-all shadow-lg active:scale-95"
              >
                Khám phá tủ sách →
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-black uppercase text-gray-800 tracking-wider">SÁCH THIẾU NHI</h2>
          <div className="w-12 h-1 bg-emerald-600 mx-auto rounded-full mt-1" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sections.thieuNhiBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. VĂN HỌC VIỆT NAM SECTION WITH FULL GRAPHIC BANNER */}
      {/* ========================================================================= */}
      <section id="section-vanhoc" className="scroll-mt-24 space-y-6">
        {/* Custom Header Banner Image for Van Hoc VN */}
        <div className="relative w-full h-32 sm:h-44 rounded-xl overflow-hidden shadow-md border border-rose-500 group">
          <img
            src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1600"
            alt="Văn Học VN Banner"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-rose-950/95 via-red-950/80 to-transparent flex items-center justify-between px-6 sm:px-12 text-white">
            <div className="space-y-1.5 max-w-lg">
              <span className="inline-block text-[10px] font-black tracking-widest uppercase bg-white text-rose-900 px-3 py-1 rounded-md shadow-sm">
                Tác Phẩm Bất Hủ
              </span>
              <h3 className="text-xl sm:text-3xl font-black tracking-wider drop-shadow-md uppercase">
                VĂN HỌC VIỆT NAM KINH ĐIỂN
              </h3>
              <p className="text-xs text-rose-100 hidden sm:block font-medium">
                Nguyễn Nhật Ánh, Tô Hoài cùng những trang văn dịu ngọt nâng niu ký ức tuổi thơ Việt Nam
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/books?category_id=12"
                className="bg-white text-rose-900 font-extrabold text-xs px-5 py-2.5 rounded-lg hover:bg-rose-50 transition-all shadow-lg active:scale-95"
              >
                Khám phá tủ sách →
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-black uppercase text-gray-800 tracking-wider">VĂN HỌC VIỆT NAM</h2>
          <div className="w-12 h-1 bg-rose-700 mx-auto rounded-full mt-1" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sections.vanHocVnBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      {/* Mid Banner: Kim Dong Commitment */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="space-y-2 p-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-kimdong-red flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-gray-800">Kho Sách Phong Phú</h3>
          <p className="text-xs text-gray-500">Hàng ngàn tựa sách Manga, thiếu nhi & kỹ năng chất lượng cao.</p>
        </div>

        <div className="space-y-2 p-4 border-y md:border-y-0 md:border-x border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-kimdong-red flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-gray-800">Bản Quyền Chính Thức</h3>
          <p className="text-xs text-gray-500">100% bản quyền trực tiếp từ Nhật Bản, Hàn Quốc & các NXB uy tín.</p>
        </div>

        <div className="space-y-2 p-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-kimdong-red flex items-center justify-center mx-auto">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-gray-800">Đồng Hành Cùng Tuổi Trẻ</h3>
          <p className="text-xs text-gray-500">NXB Kim Đồng - Gắn bó cùng nhiều thế hệ độc giả Việt Nam.</p>
        </div>
      </div>

    </div>
  );
};
