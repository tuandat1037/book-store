import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, X, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';
import { Book, Category, Author } from '../types';
import { Modal } from '../components/common/Modal';
import { formatVND } from '../utils/format';
import { useToast } from '../context/ToastContext';

export const AdminBooksPage: React.FC = () => {
  const location = useLocation();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category_id: 6,
    author_id: 1,
    publisher_id: 1,
    import_price: 12000,
    price: 25000,
    sale_price: 20000,
    stock: 100,
    publication_year: 2024,
    num_pages: 192,
    cover_type: 'Bìa mềm',
    dimensions: '11.3 x 17.6 cm',
    weight: 180,
    description: '',
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'
  });

  const fetchBooks = () => {
    setLoading(true);
    api.get(`/books?limit=50&q=${encodeURIComponent(searchQuery)}`)
      .then((res) => setBooks(res.data.books || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.raw || []));
    api.get('/authors').then((r) => setAuthors(r.data.authors || [])).catch((e) => console.error(e));
    fetchBooks();
  }, [searchQuery]);

  // Nút "Nhập thêm" từ Dashboard cảnh báo tồn kho chuyển sang đây kèm từ khóa sách
  useEffect(() => {
    const kw = (location.state as any)?.search;
    if (kw) {
      setSearchQuery(kw);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const handleOpenModal = (book?: Book) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        title: book.title,
        category_id: book.category_id,
        author_id: book.author_id,
        publisher_id: book.publisher_id,
        import_price: book.import_price || 0,
        price: book.price,
        sale_price: book.sale_price || 0,
        stock: book.stock,
        publication_year: book.publication_year || 2024,
        num_pages: book.num_pages || 192,
        cover_type: book.cover_type || 'Bìa mềm',
        dimensions: book.dimensions || '11.3 x 17.6 cm',
        weight: book.weight || 180,
        description: book.description || '',
        image_url: book.cover_image || ''
      });
    } else {
      setEditingBook(null);
      setFormData({
        title: '',
        category_id: 6,
        author_id: 1,
        publisher_id: 1,
        import_price: 12000,
        price: 25000,
        sale_price: 20000,
        stock: 100,
        publication_year: 2024,
        num_pages: 192,
        cover_type: 'Bìa mềm',
        dimensions: '11.3 x 17.6 cm',
        weight: 180,
        description: '',
        image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await api.put(`/books/${editingBook.id}`, formData);
        showToast('Cập nhật cuốn sách thành công', 'success');
      } else {
        await api.post('/books', formData);
        showToast('Thêm sách mới thành công', 'success');
      }
      setIsModalOpen(false);
      fetchBooks();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi thao tác sách', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuốn sách này?')) return;
    try {
      const res = await api.delete(`/books/${id}`);
      showToast(res.data.message || 'Xóa sách thành công', 'info');
      fetchBooks();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi xóa sách', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900">Quản Lý Tủ Sách NXB Kim Đồng</h1>
          <p className="text-xs text-gray-400">Danh sách, thêm mới, chỉnh sửa thông tin sách</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-kimdong-red hover:bg-kimdong-darkred text-white text-xs font-extrabold px-4 py-2.5 rounded-2xl shadow flex items-center gap-1.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Sách Mới</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên sách, tác giả..."
            className="w-full text-xs p-3 pl-10 rounded-xl bg-gray-50 border border-transparent focus:border-kimdong-red outline-none"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Bìa & Tên sách</th>
                <th className="py-3 px-4">Thể loại</th>
                <th className="py-3 px-4">Giá bán</th>
                <th className="py-3 px-4">Tồn kho</th>
                <th className="py-3 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {books.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img src={book.cover_image} alt="" className="w-10 h-12 object-contain rounded bg-gray-50 border p-0.5" />
                    <div>
                      <p className="font-bold text-gray-800 line-clamp-1">{book.title}</p>
                      <p className="text-[10px] text-gray-400">{book.author_name || ''}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-600">{book.category_name}</td>
                  <td className="py-3 px-4 font-bold text-kimdong-red">{formatVND(book.sale_price || book.price)}</td>
                  <td className="py-3 px-4">
                    <span className={`font-bold px-2 py-0.5 rounded-sm text-[10px] ${book.stock > 10 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {book.stock} cuốn
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenModal(book)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(book.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Form Modal */}
      {isModalOpen && (
        <Modal title={editingBook ? 'Chỉnh Sửa Cuốn Sách' : 'Thêm Cuốn Sách Mới'} onClose={() => setIsModalOpen(false)} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tên cuốn sách *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-1">
                  <label className="block font-bold text-gray-700 mb-1">Thể loại *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                    required
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red bg-white"
                  >
                    {/* Children first, grouped under their parent shelf */}
                    {categories
                      .filter((c) => !c.parent_id)
                      .map((parent) => {
                        const kids = categories.filter((c) => c.parent_id === parent.id);
                        if (kids.length === 0) {
                          return <option key={parent.id} value={parent.id}>{parent.name}</option>;
                        }
                        return (
                          <optgroup key={parent.id} label={parent.name}>
                            <option value={parent.id}>{parent.name} (tổng hợp)</option>
                            {kids.map((k) => (
                              <option key={k.id} value={k.id}>— {k.name}</option>
                            ))}
                          </optgroup>
                        );
                      })}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tác giả *</label>
                  <select
                    value={formData.author_id}
                    onChange={(e) => setFormData({ ...formData, author_id: parseInt(e.target.value) })}
                    required
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red bg-white"
                  >
                    {authors.length === 0 && <option value={formData.author_id}>—</option>}
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 -mt-1 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-kimdong-red shrink-0"></span>
                {'Nhà xuất bản mặc định: Nhà Xuất Bản Kim Đồng (đơn vị phát hành của cửa hàng).'}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Giá gốc (VNĐ) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    required
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Giá khuyến mãi (VNĐ)</label>
                  <input
                    type="number"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Số lượng tồn kho *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                    required
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">URL Ảnh Bìa Sách</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Mô tả nội dung cuốn sách</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold rounded-xl shadow"
                >
                  Lưu Sách
                </button>
              </div>
            </form>
        </Modal>
      )}

    </div>
  );
};
