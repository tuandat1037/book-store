import React from 'react';
import { Newspaper, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ARTICLES = [
  {
    id: 1,
    title: 'NXB Kim Đồng Phát Hành Sê-ri Doraemon Bản Kỷ Niệm Mới',
    excerpt: 'Nhân dịp kỷ niệm, NXB Kim Đồng chính thức ra mắt phiên bản Doraemon đặc biệt với phần dịch cải tiến và quà tặng bookmark giới hạn.',
    date: '14/09/2026',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 2,
    title: 'Thám Tử Lừng Danh Conan Cột Mốc Tập 100 Vang Dội',
    excerpt: 'Sự kiện ký tặng và triển lãm bộ sưu tập Thám tử lừng danh Conan mừng tập 100 được tổ chức tại Hệ thống Nhà sách Kim Đồng.',
    date: '10/09/2026',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 3,
    title: 'Ra Mắt Tủ Sách Kỹ Năng Sống Cho Học Sinh Thiếu Nhi',
    excerpt: 'Chuỗi sách minh họa màu giúp trẻ em rèn luyện thói quen tự lập, tư duy sáng tạo và lòng nhân ái.',
    date: '05/09/2026',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800'
  }
];

export const NewsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Newspaper className="w-6 h-6 text-kimdong-red" />
          <span>Tin Tức & Sự Kiện NXB Kim Đồng</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">Cập nhật lịch phát hành sách mới, sự kiện giao lưu và thông tin xuất bản</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ARTICLES.map((art) => (
          <div key={art.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between">
            <div>
              <img src={art.image} alt={art.title} className="w-full h-48 object-cover" />
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-kimdong-red" />
                  <span>{art.date}</span>
                </div>
                <h3 className="font-bold text-sm text-gray-900 line-clamp-2 hover:text-kimdong-red transition-colors">
                  {art.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">{art.excerpt}</p>
              </div>
            </div>

            <div className="p-5 pt-0">
              <Link to="#" className="text-xs font-bold text-kimdong-red hover:underline inline-flex items-center gap-1">
                <span>Đọc chi tiết</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
