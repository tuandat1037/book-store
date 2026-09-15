import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Book } from '../../types';
import { formatVND, calculateDiscountPercent } from '../../utils/format';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

interface BookCardProps {
  book: Book;
}

export const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const discountPercent = calculateDiscountPercent(book.price, book.sale_price);
  const currentPrice = book.sale_price !== null && book.sale_price !== undefined && book.sale_price < book.price
    ? book.sale_price
    : book.price;

  const inWish = isInWishlist(book.id);

  return (
    <div className="group bg-white rounded-xl border border-gray-100 p-3 flex flex-col justify-between transition-card hover:shadow-card-hover relative overflow-hidden">
      
      {/* Top Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
        {discountPercent > 0 && (
          <span className="bg-kimdong-red text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wide">
            -{discountPercent}%
          </span>
        )}
        {Boolean(book.is_new) && (
          <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm uppercase">
            Mới
          </span>
        )}
        {Boolean(book.is_bestseller) && (
          <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm uppercase">
            Bán chạy
          </span>
        )}
      </div>

      {/* Wishlist Heart Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(book.id);
        }}
        className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          inWish ? 'bg-red-50 text-kimdong-red' : 'bg-white/80 backdrop-blur-sm text-gray-400 hover:text-kimdong-red hover:bg-white shadow-sm'
        }`}
        title={inWish ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
      >
        <Heart className={`w-4 h-4 ${inWish ? 'fill-kimdong-red' : ''}`} />
      </button>

      {/* Book Cover Image */}
      <Link to={`/books/${book.slug}`} className="block relative aspect-[3/4] w-full bg-gray-50/50 rounded-lg overflow-hidden p-3 mb-3">
        <img
          src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'}
          alt={book.title}
          loading="lazy"
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      {/* Book Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <Link
            to={`/books/${book.slug}`}
            className="font-bold text-xs sm:text-sm text-gray-800 hover:text-kimdong-red line-clamp-2 leading-snug transition-colors mb-1"
          >
            {book.title}
          </Link>

          <p className="text-[11px] text-gray-400 font-medium truncate mb-1.5">
            {book.author_name || 'NXB Kim Đồng'}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center text-amber-400">
              <Star className="w-3 h-3 fill-amber-400" />
            </div>
            <span className="text-[11px] font-bold text-gray-700">
              {book.rating_avg ? Number(book.rating_avg).toFixed(1) : '5.0'}
            </span>
            <span className="text-[10px] text-gray-400">({book.review_count || 12})</span>
          </div>
        </div>

        {/* Pricing & Add to Cart Action */}
        <div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-sm sm:text-base font-extrabold text-kimdong-red">
              {formatVND(currentPrice)}
            </span>
            {discountPercent > 0 && (
              <span className="text-xs text-gray-400 line-through">
                {formatVND(book.price)}
              </span>
            )}
          </div>

          <button
            onClick={() => addToCart(book.id, 1)}
            className="w-full bg-red-50 hover:bg-kimdong-red text-kimdong-red hover:text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 group-hover:shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Thêm vào giỏ</span>
          </button>
        </div>
      </div>

    </div>
  );
};
