import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
      <div className="text-6xl font-black text-kimdong-red">404</div>
      <h1 className="text-2xl font-black text-gray-900">Trang Bạn Tìm Không Tồn Tại</h1>
      <p className="text-xs text-gray-500">
        Đường dẫn có thể bị hỏng hoặc đã được thay đổi. Vui lòng quay về trang chủ để tiếp tục trải nghiệm.
      </p>
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold text-xs px-8 py-3 rounded-md shadow-md transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Về trang chủ</span>
        </Link>
      </div>
    </div>
  );
};
