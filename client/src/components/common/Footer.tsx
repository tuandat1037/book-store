import React from 'react';
import { Link } from 'react-router-dom';
import { SiteLogo } from './SiteLogo';
import { Facebook, Instagram, Youtube, Phone, Mail, MapPin, Send, ShieldCheck, Truck, RefreshCw, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-8 border-t-4 border-kimdong-red">
      
      {/* Service Highlights */}
      <div className="max-w-7xl mx-auto px-4 pb-12 border-b border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-950/60 text-kimdong-red flex items-center justify-center shrink-0 border border-red-900">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase">Miễn phí vận chuyển</h4>
            <p className="text-[11px] text-gray-400">Đơn hàng từ 200.000đ</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-950/60 text-kimdong-red flex items-center justify-center shrink-0 border border-red-900">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase">Đổi trả dễ dàng</h4>
            <p className="text-[11px] text-gray-400">Trong vòng 7 ngày</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-950/60 text-kimdong-red flex items-center justify-center shrink-0 border border-red-900">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase">100% Sách chính hãng</h4>
            <p className="text-[11px] text-gray-400">Bản quyền trực tiếp NXB</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-950/60 text-kimdong-red flex items-center justify-center shrink-0 border border-red-900">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase">Thanh toán bảo mật</h4>
            <p className="text-[11px] text-gray-400">COD, Chuyển khoản QR</p>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* Column 1: Về NXB Kim Đồng */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <SiteLogo onDark heightClass="h-10" />
            <span className="font-extrabold text-white text-base tracking-wide">NXB KIM ĐỒNG</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Nhà xuất bản Kim Đồng trực thuộc Trung ương Đoàn TNCS Hồ Chí Minh là Nhà xuất bản lớn nhất Việt Nam chuyên xuất bản sách phục vụ thiếu niên, nhi đồng và các vị phụ huynh.
          </p>
          <div className="space-y-2 text-xs">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-kimdong-red shrink-0 mt-0.5" />
              <span>55 Quang Trung, Hai Bà Trưng, Hà Nội</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-kimdong-red shrink-0" />
              <span>1900 571 595</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-kimdong-red shrink-0" />
              <span>info@nxbkimdong.com.vn</span>
            </p>
          </div>
        </div>

        {/* Column 2: Dịch vụ */}
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
            Dịch vụ & Chính sách
          </h3>
          <ul className="space-y-2.5 text-xs text-gray-400">
            <li><Link to="/about" className="hover:text-white transition-colors">Điều khoản sử dụng</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">Chính sách bảo mật thông tin</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">Chính sách giải quyết khiếu nại</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">Hệ thống nhà sách Kim Đồng toàn quốc</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">Liên hệ hợp tác xuất bản</Link></li>
          </ul>
        </div>

        {/* Column 3: Hỗ trợ */}
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
            Hỗ trợ khách hàng
          </h3>
          <ul className="space-y-2.5 text-xs text-gray-400">
            <li><Link to="/about" className="hover:text-white transition-colors">Hướng dẫn đặt hàng trực tuyến</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">Phương thức thanh toán & giao hàng</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">Chính sách đổi trả - hoàn tiền</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">Chính sách tích điểm thành viên</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">Tra cứu tình trạng đơn hàng</Link></li>
          </ul>
        </div>

        {/* Column 4: Đăng ký nhận tin & Kết nối */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-2">
            Đăng ký nhận ưu đãi
          </h3>
          <p className="text-xs text-gray-400">Nhận ngay mã giảm giá 20% cho đơn hàng đầu tiên!</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <input
              type="email"
              placeholder="Email của bạn..."
              className="bg-gray-800 text-white text-xs rounded-xl px-3 py-2 w-full border border-gray-700 focus:border-kimdong-red outline-none"
            />
            <button type="submit" className="bg-kimdong-red hover:bg-kimdong-darkred text-white p-2 rounded-xl shrink-0 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Kết nối với Kim Đồng</h4>
            <div className="flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-gray-800 hover:bg-kimdong-red text-gray-300 hover:text-white flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-gray-800 hover:bg-kimdong-red text-gray-300 hover:text-white flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-gray-800 hover:bg-kimdong-red text-gray-300 hover:text-white flex items-center justify-center transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Copyright Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4">
        <p>© 2026 Nhà Xuất Bản Kim Đồng. Tất cả quyền được bảo lưu.</p>
        <p className="text-[11px]">Thiết kế & phát triển giao diện tham khảo NXB Kim Đồng.</p>
      </div>
    </footer>
  );
};
