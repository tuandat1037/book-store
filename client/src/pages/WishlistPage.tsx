import React from 'react';
import { Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { BookCard } from '../components/book/BookCard';

export const WishlistPage: React.FC = () => {
  const { wishlistBooks } = useWishlist();

  if (wishlistBooks.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 text-kimdong-red rounded-full flex items-center justify-center mx-auto">
          <Heart className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Danh Sách Yêu Thích Trống</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Bạn chưa lưu cuốn sách nào vào danh sách yêu thích. Hãy bấm vào biểu tượng trái tim ở bất kỳ sản phẩm nào để lưu lại!
        </p>
        <div>
          <Link
            to="/books"
            className="inline-flex items-center gap-2 bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold text-xs px-8 py-3 rounded-md shadow-md transition-all"
          >
            <span>Khám phá sách ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-xl sm:text-2xl font-black text-gray-900 border-b border-gray-200 pb-4 flex items-center gap-2">
        <Heart className="w-6 h-6 text-kimdong-red fill-kimdong-red" />
        <span>Danh Sách Yêu Thích Của Bạn ({wishlistBooks.length})</span>
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {wishlistBooks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
};
