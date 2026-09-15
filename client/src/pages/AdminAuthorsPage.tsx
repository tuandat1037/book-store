import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, PenLine, Search } from 'lucide-react';
import api from '../services/api';
import { Author } from '../types';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';

interface AuthorRow extends Author {
  book_count?: number;
}

const EMPTY_FORM = { name: '', bio: '', avatar: '' };

export const AdminAuthorsPage: React.FC = () => {
  const [authors, setAuthors] = useState<AuthorRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<AuthorRow | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const fetchAuthors = () => {
    setLoading(true);
    api.get('/authors')
      .then((res) => setAuthors(res.data.authors || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const handleOpenModal = (author?: AuthorRow) => {
    if (author) {
      setEditingAuthor(author);
      setFormData({ name: author.name, bio: author.bio || '', avatar: author.avatar || '' });
    } else {
      setEditingAuthor(null);
      setFormData({ ...EMPTY_FORM });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAuthor?.id) {
        await api.put(`/authors/${editingAuthor.id}`, formData);
        showToast('Cập nhật tác giả thành công', 'success');
      } else {
        await api.post('/authors', formData);
        showToast('Thêm tác giả mới thành công', 'success');
      }
      setIsModalOpen(false);
      fetchAuthors();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi thao tác tác giả', 'error');
    }
  };

  const handleDelete = async (author: AuthorRow) => {
    if (!window.confirm(`Xóa tác giả "${author.name}"?`)) return;
    try {
      const res = await api.delete(`/authors/${author.id}`);
      showToast(res.data.message || 'Đã xóa tác giả', 'info');
      fetchAuthors();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi xóa tác giả', 'error');
    }
  };

  const filtered = authors.filter(
    (a) => a.name.toLowerCase().includes(search.toLowerCase()) || (a.bio || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900">Quản Lý Tác Giả</h1>
          <p className="text-xs text-gray-400">Danh sách tác giả / họa sĩ — dùng khi nhập sách mới và hiển thị trên trang chi tiết sách</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-kimdong-red hover:bg-kimdong-darkred text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Tác Giả</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên tác giả, tiểu sử..."
            className="w-full text-xs p-3 pl-10 rounded-lg bg-gray-50 border border-transparent focus:border-kimdong-red outline-none"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Authors grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 text-center text-xs text-gray-400 rounded-xl border border-gray-100">
          {search ? 'Không tìm thấy tác giả nào khớp với từ khóa.' : 'Chưa có tác giả nào. Bấm "Thêm Tác Giả" để bắt đầu.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((author) => (
            <div key={author.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-3.5 hover:shadow-card transition-shadow">
              {author.avatar ? (
                <img src={author.avatar} alt={author.name} className="w-14 h-14 rounded-lg object-cover border border-gray-100 shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-red-50 text-kimdong-red flex items-center justify-center shrink-0">
                  <PenLine className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-sm text-gray-900 truncate">{author.name}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleOpenModal(author)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Sửa">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(author)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Xóa">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 min-h-[26px]">{author.bio || 'Chưa có tiểu sử.'}</p>
                <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${author.book_count ? 'bg-red-50 text-kimdong-red' : 'bg-gray-100 text-gray-400'}`}>
                  {author.book_count || 0} cuốn sách
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <Modal title={editingAuthor ? 'Chỉnh Sửa Tác Giả' : 'Thêm Tác Giả Mới'} onClose={() => setIsModalOpen(false)}>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tên tác giả / họa sĩ *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Tô Hoài, Fujiko F Fujio..."
                  required
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  {'Slug tự sinh từ tên (bỏ dấu tiếng Việt) để làm đường dẫn trang tác giả.'}
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Tiểu sử / giới thiệu</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  placeholder="Vài nét về cuộc đời, sự nghiệp của tác giả..."
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">URL ảnh chân dung (tùy chọn)</label>
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold rounded-lg shadow"
                >
                  Lưu Tác Giả
                </button>
              </div>
            </form>
        </Modal>
      )}

    </div>
  );
};
