import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Search, X, ChevronRight, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { Book, Category, Author } from '../types';
import { BookCard } from '../components/book/BookCard';

export const BooksPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Filter States
  const categoryIdParam = searchParams.get('category_id') || '';
  const authorIdParam = searchParams.get('author_id') || '';
  const qParam = searchParams.get('q') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const onSaleParam = searchParams.get('on_sale') === 'true';
  const pageParam = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    // Fetch filter metadata
    api.get('/categories').then((res) => setCategories(res.data.raw || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const queryStr = searchParams.toString();
    api.get(`/books?${queryStr}`)
      .then((res) => {
        setBooks(res.data.books || []);
        setPagination(res.data.pagination);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === null || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Search Header Banner */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">
            {qParam ? `Kết quả tìm kiếm cho "${qParam}"` : 'Tất Cả Tủ Sách NXB Kim Đồng'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Hiển thị <span className="font-bold text-kimdong-red">{pagination.total}</span> sản phẩm phù hợp
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 shrink-0">Sắp xếp theo:</span>
          <select
            value={sortParam}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="bg-gray-100 text-xs font-bold text-gray-800 rounded-lg px-3 py-2 border border-transparent focus:border-kimdong-red outline-none cursor-pointer"
          >
            <option value="newest">Mới nhất</option>
            <option value="bestseller">Bán chạy nhất</option>
            <option value="price_asc">Giá: Thấp → Cao</option>
            <option value="price_desc">Giá: Cao → Thấp</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filters */}
        <div className="space-y-6 bg-white p-5 rounded-xl border border-gray-100 shadow-sm h-fit">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="font-bold text-sm uppercase text-gray-800 flex items-center gap-2">
              <Filter className="w-4 h-4 text-kimdong-red" />
              <span>Bộ Lọc Sản Phẩm</span>
            </h3>
            {(categoryIdParam || authorIdParam || qParam || onSaleParam) && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] font-bold text-kimdong-red hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Xóa lọc</span>
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-700 uppercase">Danh Mục</h4>
            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
              <button
                onClick={() => updateFilter('category_id', null)}
                className={`w-full text-left text-xs py-1.5 px-3 rounded-lg font-medium transition-colors ${
                  !categoryIdParam ? 'bg-red-50 text-kimdong-red font-bold' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Tất cả danh mục
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateFilter('category_id', cat.id.toString())}
                  className={`w-full text-left text-xs py-1.5 px-3 rounded-lg font-medium transition-colors ${
                    categoryIdParam === cat.id.toString() ? 'bg-red-50 text-kimdong-red font-bold' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Special Promotion Filter */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Chương Trình Khuyến Mãi</h4>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
              <input
                type="checkbox"
                checked={onSaleParam}
                onChange={(e) => updateFilter('on_sale', e.target.checked ? 'true' : null)}
                className="rounded text-kimdong-red focus:ring-kimdong-red"
              />
              <span>Chỉ hiển thị sách giảm giá</span>
            </label>
          </div>

        </div>

        {/* Book Grid Content */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-72 bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 text-kimdong-red rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                🔍
              </div>
              <h3 className="font-bold text-base text-gray-800">Không tìm thấy sách phù hợp</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Hãy thử kiểm tra lại từ khóa tìm kiếm hoặc bỏ các bộ lọc đang chọn.
              </p>
              <button
                onClick={clearAllFilters}
                className="bg-kimdong-red text-white text-xs font-bold px-6 py-2.5 rounded-md shadow hover:bg-kimdong-darkred transition-colors"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-6">
                  {[...Array(pagination.totalPages)].map((_, idx) => {
                    const p = idx + 1;
                    return (
                      <button
                        key={p}
                        onClick={() => updateFilter('page', p.toString())}
                        className={`w-9 h-9 rounded-xl font-bold text-xs transition-colors ${
                          pagination.page === p
                            ? 'bg-kimdong-red text-white shadow-md'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

      </div>

    </div>
  );
};
