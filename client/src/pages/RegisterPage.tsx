import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SiteLogo } from '../components/common/SiteLogo';
import { User, Mail, Lock, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });

  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/auth/register', formData);
      login(res.data.token, res.data.user);
      showToast('Đăng ký tài khoản mới thành công!', 'success');
      navigate('/account');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Đăng ký thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <SiteLogo clickable={false} heightClass="h-14" className="mx-auto" />
          <h1 className="text-2xl font-black text-gray-900">Đăng Ký Tài Khoản</h1>
          <p className="text-xs text-gray-400">Trở thành thành viên độc giả của NXB Kim Đồng</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Họ và tên *</label>
            <div className="relative">
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                placeholder="Nguyễn Văn A"
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red pl-10"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Email *</label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="yourname@gmail.com"
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red pl-10"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Mật khẩu *</label>
            <div className="relative">
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="••••••••"
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red pl-10"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Số điện thoại</label>
            <div className="relative">
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0901234567"
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red pl-10"
              />
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'ĐANG ĐĂNG KÝ...' : 'TẠO TÀI KHOẢN'}
          </button>
        </form>

        <div className="text-center text-xs text-gray-500">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-bold text-kimdong-red hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
