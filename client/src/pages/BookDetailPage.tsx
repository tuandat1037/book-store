import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Heart, ShoppingBag, Truck, ShieldCheck, Share2, Check, Minus, Plus, MessageSquare, Lock, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { Book, Review } from '../types';
import { formatVND, formatDate, calculateDiscountPercent } from '../utils/format';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { BookCard } from '../components/book/BookCard';
import { ReviewForm } from '../components/review/ReviewForm';

export const BookDetailPage: React.FC = () => {
  const { param } = useParams<{ param: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [loading, setLoading] = useState<boolean>(true);

  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewAvg, setReviewAvg] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);

  useEffect(() => {
    setLoading(true);
    api.get(`/books/${param}`)
      .then((res) => {
        setBook(res.data.book);
        setImages(res.data.images || []);
        setSelectedImage(res.data.images[0] || '');
        setRelatedBooks(res.data.related || []);
        
        // Fetch reviews
        if (res.data.book?.id) {
          loadReviews(res.data.book.id);
        }
      })
      .catch((err) => {
        console.error(err);
        showToast('Không tìm thấy thông tin cuốn sách này', 'error');
      })
      .finally(() => setLoading(false));
  }, [param]);

  // Đánh giá công khai: ai cũng xem được, không cần đăng nhập
  const loadReviews = async (bookId: number) => {
    try {
      const rRes = await api.get(`/books/${bookId}/reviews`);
      setReviews(rRes.data.reviews || []);
      setReviewAvg(Number(rRes.data.avg) || 0);
      setReviewCount(Number(rRes.data.count) || 0);
    } catch (error) {
      console.error(error);
    }
  };

  const handleBuyNow = async () => {
    if (!book) return;
    await addToCart(book.id, quantity);
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded-3xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/4" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) return null;

  const discountPercent = calculateDiscountPercent(book.price, book.sale_price);
  const currentPrice = book.sale_price !== null && book.sale_price !== undefined && book.sale_price < book.price
    ? book.sale_price
    : book.price;
  const inWish = isInWishlist(book.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
      
      {/* Breadcrumbs */}
      <nav className="text-xs font-semibold text-gray-500 flex items-center gap-2">
        <Link to="/" className="hover:text-kimdong-red">Trang chủ</Link>
        <span>/</span>
        <Link to={`/books?category_id=${book.category_id}`} className="hover:text-kimdong-red">
          {book.category_name || 'Danh mục'}
        </Link>
        <span>/</span>
        <span className="text-gray-800 truncate max-w-xs">{book.title}</span>
      </nav>

      {/* Main Product Specs Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-[3/4] w-full bg-gray-50 rounded-lg p-6 border border-gray-100 flex items-center justify-center overflow-hidden group">
            <img
              src={selectedImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'}
              alt={book.title}
              className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-kimdong-red text-white text-xs font-black px-3 py-1 rounded-md shadow-md">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-20 rounded-md p-1 border-2 bg-gray-50 shrink-0 transition-all ${
                    selectedImage === img ? 'border-kimdong-red shadow-md scale-95' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-contain mix-blend-multiply" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Title, Metadata, Pricing, Actions */}
        <div className="space-y-6">
          <div>
            <span className="inline-block text-xs font-extrabold uppercase tracking-wider text-kimdong-red bg-red-50 px-3 py-1 rounded-md mb-2">
              {book.category_name || 'NXB Kim Đồng'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
              {book.title}
            </h1>
            
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <p>Tác giả: <span className="font-bold text-gray-800">{book.author_name || 'Đang cập nhật'}</span></p>
              <span>|</span>
              <p>NXB: <span className="font-bold text-gray-800">{book.publisher_name || 'NXB Kim Đồng'}</span></p>
              <span>|</span>
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{reviewCount > 0 ? Number(reviewAvg).toFixed(1) : 'Chưa có'}</span>
                {reviewCount > 0 && <span className="text-gray-400 font-medium">({reviewCount})</span>}
              </div>
            </div>
          </div>

          {/* Price Box */}
          <div className="bg-red-50/60 rounded-xl p-4 flex items-baseline gap-4 border border-red-100">
            <span className="text-2xl sm:text-3xl font-black text-kimdong-red">
              {formatVND(currentPrice)}
            </span>
            {discountPercent > 0 && (
              <>
                <span className="text-sm sm:text-base text-gray-400 line-through">
                  {formatVND(book.price)}
                </span>
                <span className="text-xs font-extrabold text-white bg-kimdong-red px-2 py-0.5 rounded-md">
                  Tiết kiệm {formatVND(book.price - currentPrice)}
                </span>
              </>
            )}
          </div>

          {/* Stock & Quick Specifications */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-400 block">Tình trạng kho:</span>
              <span className={`font-bold ${book.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {book.stock > 0 ? `Còn hàng (${book.stock} cuốn)` : 'Hết hàng'}
              </span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-400 block">Hình thức bìa:</span>
              <span className="font-bold text-gray-800">{book.cover_type || 'Bìa mềm'}</span>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-gray-700">Số lượng:</span>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2.5 hover:bg-gray-200 transition-colors text-gray-600"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-4 text-xs font-bold text-gray-800">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(book.stock, q + 1))}
                className="p-2.5 hover:bg-gray-200 transition-colors text-gray-600"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => addToCart(book.id, quantity)}
              disabled={book.stock <= 0}
              className="w-full bg-red-50 hover:bg-red-100 text-kimdong-red border border-red-200 font-extrabold text-xs sm:text-sm py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Thêm vào giỏ hàng</span>
            </button>

            <button
              onClick={handleBuyNow}
              disabled={book.stock <= 0}
              className="w-full bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold text-xs sm:text-sm py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-red-200 transition-all active:scale-95 disabled:opacity-50"
            >
              <span>MUA NGAY BÂY GIỜ</span>
            </button>
          </div>

          {/* Secondary Actions: Wishlist & Share */}
          <div className="flex items-center gap-6 pt-2 border-t border-gray-100 text-xs">
            <button
              onClick={() => toggleWishlist(book.id)}
              className={`flex items-center gap-1.5 font-bold transition-colors ${
                inWish ? 'text-kimdong-red' : 'text-gray-500 hover:text-kimdong-red'
              }`}
            >
              <Heart className={`w-4 h-4 ${inWish ? 'fill-kimdong-red' : ''}`} />
              <span>{inWish ? 'Đã yêu thích' : 'Thêm vào yêu thích'}</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showToast('Đã sao chép đường dẫn sản phẩm', 'info');
              }}
              className="flex items-center gap-1.5 text-gray-500 hover:text-kimdong-red font-bold transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Chia sẻ</span>
            </button>
          </div>

          {/* Delivery Guarantees */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-kimdong-red" />
              <span>Giao hàng tận nơi toàn quốc từ 2 - 4 ngày</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-kimdong-red" />
              <span>Đổi trả sản phẩm lỗi trong vòng 7 ngày</span>
            </div>
          </div>

        </div>

      </div>

      {/* Tabs: Description, Specs, Reviews */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
        <div className="flex border-b border-gray-100 gap-8 mb-6">
          <button
            onClick={() => setActiveTab('desc')}
            className={`pb-3 text-xs sm:text-sm font-bold uppercase transition-colors relative ${
              activeTab === 'desc' ? 'text-kimdong-red' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            Mô Tả Sản Phẩm
            {activeTab === 'desc' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-kimdong-red" />}
          </button>

          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 text-xs sm:text-sm font-bold uppercase transition-colors relative ${
              activeTab === 'specs' ? 'text-kimdong-red' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            Thông Tin Chi Tiết
            {activeTab === 'specs' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-kimdong-red" />}
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-xs sm:text-sm font-bold uppercase transition-colors relative ${
              activeTab === 'reviews' ? 'text-kimdong-red' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            Đánh Giá ({reviews.length})
            {activeTab === 'reviews' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-kimdong-red" />}
          </button>
        </div>

        {/* Tab 1: Description */}
        {activeTab === 'desc' && (
          <div className="prose max-w-none text-xs sm:text-sm text-gray-700 leading-relaxed space-y-4">
            <p>{book.description || 'Chưa có mô tả chi tiết cho cuốn sách này.'}</p>
          </div>
        )}

        {/* Tab 2: Detailed Specs */}
        {activeTab === 'specs' && (
          <div className="max-w-xl">
            <table className="w-full text-xs text-left border-collapse">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2.5 text-gray-400 font-medium">Tác giả</td>
                  <td className="py-2.5 font-bold text-gray-800">{book.author_name || 'NXB Kim Đồng'}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2.5 text-gray-400 font-medium">Nhà xuất bản</td>
                  <td className="py-2.5 font-bold text-gray-800">{book.publisher_name || 'NXB Kim Đồng'}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2.5 text-gray-400 font-medium">Năm xuất bản</td>
                  <td className="py-2.5 font-bold text-gray-800">{book.publication_year || 2024}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2.5 text-gray-400 font-medium">Số trang</td>
                  <td className="py-2.5 font-bold text-gray-800">{book.num_pages || 192} trang</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2.5 text-gray-400 font-medium">Kích thước</td>
                  <td className="py-2.5 font-bold text-gray-800">{book.dimensions || '13 x 19 cm'}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-400 font-medium">Trọng lượng</td>
                  <td className="py-2.5 font-bold text-gray-800">{book.weight || 200}g</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Customer Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-8">
            {/* Form đánh giá: chỉ hiện khi đã mua và đơn đã hoàn thành */}
            {user ? (
              book && <ReviewForm bookId={book.id} bookTitle={book.title} onSubmitted={() => loadReviews(book.id)} />
            ) : (
              <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-gray-700">Đăng nhập để đánh giá sách</p>
                  <p className="text-gray-500 leading-relaxed">
                    Chỉ khách hàng đã mua và có đơn hàng giao thành công mới được gửi đánh giá.{' '}
                    <Link to="/login" className="font-bold text-kimdong-red hover:underline">Đăng nhập ngay</Link>
                  </p>
                </div>
              </div>
            )}

            {/* Danh sách đánh giá công khai */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h4 className="text-xs font-bold uppercase text-gray-800">
                  Khách hàng nhận xét ({reviewCount})
                </h4>
                {reviewCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{Number(reviewAvg).toFixed(1)}/5</span>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Chưa có đánh giá nào. Hãy là người đầu tiên nhận xét!</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-1.5">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-xs text-gray-800 truncate">{rev.user_name || 'Khách hàng'}</span>
                        {Number(rev.is_verified_purchase) === 1 && (
                          <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 shrink-0">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Đã mua
                          </span>
                        )}
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
                    {rev.created_at && <p className="text-[10px] text-gray-400">{formatDate(rev.created_at)}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* Related Books Carousel Section */}
      {relatedBooks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-black text-gray-900 uppercase">Sản Phẩm Cùng Thể Loại</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {relatedBooks.map((relBook) => (
              <BookCard key={relBook.id} book={relBook} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
