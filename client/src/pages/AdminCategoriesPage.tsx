import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, FolderTree, Layers, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { Category } from '../types';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';

interface CategoryRow extends Category {
  book_count?: number;
  children?: CategoryRow[];
}

const EMPTY_FORM = { name: '', parent_id: '' as '' | number, description: '', image: '', display_order: 0 };

export const AdminCategoriesPage: React.FC = () => {
  const [tree, setTree] = useState<CategoryRow[]>([]);
  const [flat, setFlat] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryRow | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const fetchCategories = () => {
    setLoading(true);
    api.get('/categories')
      .then((res) => {
        setTree(res.data.categories || []);
        setFlat(res.data.raw || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (cat?: CategoryRow, presetParent?: number) => {
    if (cat) {
      setEditingCat(cat);
      setFormData({
        name: cat.name,
        parent_id: cat.parent_id ?? '',
        description: cat.description || '',
        image: cat.image || '',
        display_order: cat.display_order ?? 0
      });
    } else {
      setEditingCat(null);
      setFormData({ ...EMPTY_FORM, parent_id: presetParent ?? '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, parent_id: formData.parent_id === '' ? null : formData.parent_id };
      if (editingCat?.id) {
        await api.put(`/categories/${editingCat.id}`, payload);
        showToast('Cập nhật danh mục thành công', 'success');
      } else {
        await api.post('/categories', payload);
        showToast('Thêm danh mục mới thành công', 'success');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi thao tác danh mục', 'error');
    }
  };

  const handleDelete = async (cat: CategoryRow) => {
    if (!window.confirm(`Xóa danh mục "${cat.name}"?`)) return;
    try {
      const res = await api.delete(`/categories/${cat.id}`);
      showToast(res.data.message || 'Đã xóa danh mục', 'info');
      fetchCategories();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi xóa danh mục', 'error');
    }
  };

  const parentOptions = flat.filter((c) => !c.parent_id || (editingCat && c.id === editingCat.parent_id));

  const renderActions = (cat: CategoryRow) => (
    <div className="flex items-center gap-1.5 shrink-0">
      <button onClick={() => handleOpenModal(cat)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Sửa">
        <Edit2 className="w-4 h-4" />
      </button>
      <button onClick={() => handleDelete(cat)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Xóa">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900">Quản Lý Danh Mục</h1>
          <p className="text-xs text-gray-400">Tủ sách lớn (cha) và dòng sách / thể loại con — danh mục mới xuất hiện ngay trên menu cửa hàng</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleOpenModal()}
            className="bg-kimdong-red hover:bg-kimdong-darkred text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Danh Mục</span>
          </button>
        </div>
      </div>

      {/* Category Tree */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-gray-100" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {tree.map((parent) => (
            <div key={parent.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Parent row */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 bg-gray-50/50">
                <div className="w-9 h-9 rounded-lg bg-red-50 text-kimdong-red flex items-center justify-center shrink-0">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm text-gray-900 truncate">{parent.name}</p>
                    <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-gray-200/70 text-gray-500 uppercase">Danh mục cha</span>
                  </div>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{parent.description || 'Chưa có mô tả'}</p>
                </div>
                <span className="text-[10px] font-bold text-gray-400 shrink-0">{parent.book_count || 0} sách · {parent.children?.length || 0} danh mục con</span>
                {renderActions(parent)}
                <button
                  onClick={() => handleOpenModal(undefined, parent.id)}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg shrink-0"
                  title="Thêm danh mục con vào đây"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Children rows */}
              {parent.children && parent.children.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {parent.children.map((child) => (
                    <li key={child.id} className="flex items-center gap-3 px-4 py-2.5 pl-8 hover:bg-gray-50/50">
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      <p className="flex-1 min-w-0 truncate font-bold text-xs text-gray-700">{child.name}</p>
                      <span className="text-[10px] font-bold text-gray-400 shrink-0">{child.book_count || 0} sách</span>
                      {renderActions(child)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-2.5 pl-8 text-[11px] text-gray-300 italic">Chưa có danh mục con — bấm dấu + để thêm.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <Modal title={editingCat ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Mới'} onClose={() => setIsModalOpen(false)}>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tên danh mục *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Manga Boys Love, Sách Tô Màu..."
                  required
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Thuộc danh mục cha</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red bg-white"
                >
                  <option value="">— Danh mục cấp 1 (tủ sách lớn) —</option>
                  {parentOptions
                    .filter((c) => !editingCat || c.id !== editingCat.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Chọn "cấp 1" nếu đây là tủ sách lớn, hoặc chọn danh mục cha nếu là thể loại con.</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Mô tả ngắn</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Giới thiệu ngắn xuất hiện khi rê chuột vào menu..."
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">URL ảnh (tùy chọn)</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                  />
                </div>
              </div>

              <div className="bg-red-50/60 rounded-lg p-3 border border-red-100 text-[11px] text-gray-600 flex gap-2">
                <Layers className="w-4 h-4 text-kimdong-red shrink-0 mt-0.5" />
                <p>Slug được tạo tự động từ tên (bỏ dấu tiếng Việt). Danh mục mới xuất hiện ngay trên menu và trang Sách; chỉ xóa được khi <b>không còn sách</b> bên trong.</p>
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
                  Lưu Danh Mục
                </button>
              </div>
            </form>
        </Modal>
      )}

    </div>
  );
};
