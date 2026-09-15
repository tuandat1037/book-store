import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, UserPlus, Pencil, Trash2, X, ShieldCheck, BadgeCheck, UserRound } from 'lucide-react';
import api from '../services/api';
import { ManagedUser } from '../types';
import { Modal } from '../components/common/Modal';
import { formatDate } from '../utils/format';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const ROLE_META: Record<number, { label: string; cls: string }> = {
  1: { label: 'ADMIN', cls: 'bg-red-100 text-kimdong-red' },
  2: { label: 'NHÂN VIÊN', cls: 'bg-blue-50 text-blue-600' },
  3: { label: 'KHÁCH HÀNG', cls: 'bg-gray-100 text-gray-500' },
};

const EMPTY_FORM = { full_name: '', email: '', password: '', phone: '', role_id: 2 };

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const { user: me } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users')
      .then((res) => setUsers(res.data.users || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ ...EMPTY_FORM });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: ManagedUser) => {
    setEditingUser(u);
    setFormData({ full_name: u.full_name, email: u.email, password: '', phone: u.phone || '', role_id: u.role_id });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        const payload: any = { full_name: formData.full_name, email: formData.email, phone: formData.phone };
        if (formData.password) payload.password = formData.password;
        const res = await api.put(`/users/${editingUser.id}`, payload);
        if (formData.role_id !== editingUser.role_id && me?.id !== editingUser.id) {
          await api.put(`/users/${editingUser.id}/role`, { role_id: formData.role_id });
        }
        showToast(res.data.message || 'Đã cập nhật', 'success');
      } else {
        const res = await api.post('/users', formData);
        showToast(res.data.message || 'Tạo tài khoản thành công', 'success');
      }
      setIsModalOpen(false);
      setFormData({ ...EMPTY_FORM });
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi thao tác tài khoản', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (u: ManagedUser, roleId: number) => {
    if (u.role_id === roleId) return;
    try {
      const res = await api.put(`/users/${u.id}/role`, { role_id: roleId });
      showToast(res.data.message || 'Đã đổi quyền', 'info');
      fetchUsers();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi đổi quyền', 'error');
      fetchUsers();
    }
  };

  const handleDelete = async (u: ManagedUser) => {
    if (!window.confirm(`Xóa tài khoản "${u.full_name}" (${u.email})?`)) return;
    try {
      const res = await api.delete(`/users/${u.id}`);
      showToast(res.data.message || 'Đã xóa tài khoản', 'info');
      fetchUsers();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi xóa tài khoản', 'error');
    }
  };

  const staff = users.filter((u) => u.role_id !== 3);
  const customers = users.filter((u) => u.role_id === 3);

  const renderRow = (u: ManagedUser) => {
    const meta = ROLE_META[u.role_id] || ROLE_META[3];
    const isStaff = u.role_id !== 3;
    const isSelf = me?.id === u.id;

    return (
      <tr key={u.id} className="hover:bg-gray-50/50">
        <td className="py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 text-kimdong-red font-black flex items-center justify-center text-sm uppercase shrink-0">
              {u.full_name?.charAt(0) || '?'}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-800 text-xs truncate">
                {u.full_name} {isSelf && <span className="text-[9px] font-bold text-gray-400">(bạn)</span>}
              </p>
              <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
            </div>
          </div>
        </td>
        <td className="py-3 px-4 text-gray-500 font-medium">{u.phone || '—'}</td>
        <td className="py-3 px-4">
          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-sm ${meta.cls}`}>
            {u.role_id === 1 && <ShieldCheck className="w-3 h-3" />}
            {u.role_id === 2 && <BadgeCheck className="w-3 h-3" />}
            {meta.label}
          </span>
        </td>
        <td className="py-3 px-4 text-gray-400">{u.created_at ? formatDate(u.created_at) : '—'}</td>
        <td className="py-3 px-4 text-right">
          {isStaff ? (
            <div className="flex items-center justify-end gap-2">
              <select
                value={u.role_id}
                onChange={(e) => handleRoleChange(u, parseInt(e.target.value))}
                className="bg-gray-50 text-[11px] font-bold text-gray-700 rounded-md px-2 py-1.5 border border-transparent hover:border-gray-200 outline-none focus:border-kimdong-red cursor-pointer"
                title="Đổi nhóm quyền"
              >
                <option value={1}>ADMIN</option>
                <option value={2}>NHÂN VIÊN</option>
              </select>
              <button onClick={() => handleOpenEdit(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Sửa thông tin">
                <Pencil className="w-4 h-4" />
              </button>
              {!isSelf && (
                <button onClick={() => handleDelete(u)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Xóa tài khoản">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-gray-300 font-semibold">Khách hàng tự đăng ký — không quản lý tại đây</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900">Quản Lý Tài Khoản Hệ Thống</h1>
          <p className="text-xs text-gray-400">Tạo, sửa thông tin, phân quyền và xóa tài khoản quản trị &amp; nhân viên</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-kimdong-red hover:bg-kimdong-darkred text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Nhân Viên Mới</span>
        </button>
      </div>

      {/* Staff table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-gray-700">Quản trị & Nhân viên ({staff.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Họ tên & Email</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Nhóm quyền</th>
                <th className="py-3 px-4">Ngày tạo</th>
                <th className="py-3 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-300">Đang tải...</td></tr>
              ) : (
                staff.map(renderRow)
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customers moved to a dedicated page */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <UserRound className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-black text-gray-800">Khách hàng ({customers.length})</p>
            <p className="text-[11px] text-gray-400">
              Danh sách, chi tiết và cập nhật thông tin khách hàng đã tách sang trang riêng.
            </p>
          </div>
        </div>
        <Link
          to="/admin/customers"
          className="text-xs font-bold text-blue-600 border border-blue-200 hover:bg-blue-50 px-4 py-2.5 rounded-xl transition-colors shrink-0 text-center"
        >
          Mở Quản Lý Khách Hàng
        </Link>
      </div>

      {/* Create / Edit account modal */}
      {isModalOpen && (
        <Modal title={editingUser ? 'Sửa Thông Tin Nhân Viên' : 'Tạo Tài Khoản Nhân Viên'} onClose={() => setIsModalOpen(false)}>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="VD: Trần Thị Mai"
                  required
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Email đăng nhập *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nhanvien@kimdong.vn"
                  required
                  className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {editingUser ? 'Mật khẩu mới' : 'Mật khẩu * (≥ 6 ký tự)'}
                  </label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'bỏ trống nếu giữ nguyên' : 'mat khau'}
                    required={!editingUser}
                    minLength={editingUser && !formData.password ? undefined : 6}
                    className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                  />
                  {editingUser && (
                    <p className="text-[10px] text-gray-400 mt-1">Để trống nếu không đổi mật khẩu.</p>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="09xxxxxxxx"
                    className="w-full p-2.5 rounded-lg border border-gray-200 outline-none focus:border-kimdong-red"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Nhóm quyền</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role_id: 2 })}
                    disabled={!!editingUser && me?.id === editingUser.id}
                    className={`p-2.5 rounded-lg border-2 text-center font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${formData.role_id === 2 ? 'border-kimdong-red bg-red-50 text-kimdong-red' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    <BadgeCheck className="w-4 h-4 mx-auto mb-1" />
                    Nhân viên
                    <span className="block text-[9px] font-medium text-gray-400 mt-0.5">Quản lý sách, đơn hàng, banner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role_id: 1 })}
                    disabled={!!editingUser && me?.id === editingUser.id}
                    className={`p-2.5 rounded-lg border-2 text-center font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${formData.role_id === 1 ? 'border-kimdong-red bg-red-50 text-kimdong-red' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    <ShieldCheck className="w-4 h-4 mx-auto mb-1" />
                    Quản trị
                    <span className="block text-[9px] font-medium text-gray-400 mt-0.5">Toàn quyền + quản lý tài khoản</span>
                  </button>
                </div>
                {editingUser && me?.id === editingUser.id && (
                  <p className="text-[10px] text-gray-400 mt-1">Không thể tự đổi nhóm quyền của chính mình.</p>
                )}
              </div>

              <div className="bg-red-50/60 rounded-lg p-3 border border-red-100 text-[11px] text-gray-600">
                {editingUser
                  ? 'Đổi email sẽ là email đăng nhập mới từ lần tới. Nhân viên có thể tự đổi mật khẩu trong trang Tài khoản.'
                  : <>Tài khoản mới sẽ đăng nhập được vào <span className="font-bold">/admin</span> bằng email và mật khẩu vừa tạo.</>}
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
                  disabled={saving}
                  className="px-5 py-2 bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold rounded-lg shadow flex items-center gap-1.5 disabled:opacity-50"
                >
                  {editingUser ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {saving ? 'Đang lưu...' : editingUser ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
        </Modal>
      )}

    </div>
  );
};
