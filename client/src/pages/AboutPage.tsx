import React from 'react';
import { BookOpen, MapPin, Phone, Mail, Award, HeartHandshake } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
      
      <div className="text-center space-y-4">
        <span className="text-xs font-extrabold uppercase tracking-widest text-kimdong-red bg-red-50 px-4 py-1.5 rounded-sm border border-red-100">
          Giới Thiệu NXB Kim Đồng
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
          Nhà Xuất Bản Kim Đồng - Măng Non Việt Nam
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Được thành lập ngày 17 tháng 6 năm 1957, NXB Kim Đồng trực thuộc Trung ương Đoàn TNCS Hồ Chí Minh là Nhà xuất bản lớn nhất Việt Nam chuyên phục vụ thiếu niên, nhi đồng và phụ huynh.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
          <h2 className="text-lg font-black text-gray-900 border-b border-red-100 pb-2">
            Sứ Mệnh & Tầm Nhìn
          </h2>
          <p>
            Nhà xuất bản Kim Đồng có nhiệm vụ xuất bản sách, văn hóa phẩm phục vụ thiếu nhi và phụ huynh trong cả nước, quảng bá văn hóa Việt Nam ra thế giới.
          </p>
          <p>
            Đối tượng phục vụ của Nhà xuất bản là các em thiếu niên, nhi đồng từ tuổi mầm non (1-5 tuổi), nhi đồng (6-9 tuổi), thiếu niên (10-15 tuổi) đến các bạn tuổi mới lớn (16-18 tuổi) và các bậc phụ huynh.
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl p-6 text-white space-y-4">
          <h3 className="font-extrabold text-base">Hệ Thống Nhà Sách Trụ Sở Chính</h3>
          <div className="space-y-3 text-xs">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-red-200" />
              <span>55 Quang Trung, Quận Hai Bà Trưng, Hà Nội</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 shrink-0 text-red-200" />
              <span>Hotline: 1900 571 595</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0 text-red-200" />
              <span>Email: info@nxbkimdong.com.vn</span>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
