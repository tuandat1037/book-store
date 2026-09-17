import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SiteLogo } from '../components/common/SiteLogo';
import { LogIn, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      showToast('Đăng nhập thành công!', 'success');

      if (res.data.user.role === 'ADMIN' || res.data.user.role === 'EMPLOYEE') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Đăng nhập không thành công', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <SiteLogo clickable={false} heightClass="h-14" className="mx-auto" />
          <h1 className="text-2xl font-black text-gray-900">Đăng Nhập Tài Khoản</h1>
          <p className="text-xs text-gray-400">Chào mừng bạn quay trở lại với NXB Kim Đồng</p>
        </div>

        {/* Demo Credentials hint */}
        <div className="bg-red-50/60 p-3 rounded-2xl border border-red-100 text-xs text-gray-600 space-y-1">
          <p className="font-bold text-kimdong-red">💡 Tài khoản thử nghiệm Demo:</p>
          <p>• Admin: <span className="font-bold text-gray-800">admin@kimdong.vn</span> / <span className="font-bold text-gray-800">admin123</span></p>
          <p>• Khách hàng: <span className="font-bold text-gray-800">khachhang@gmail.com</span> / <span className="font-bold text-gray-800">user123</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@kimdong.vn"
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red pl-10"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-kimdong-red pl-10"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
          </button>
        </form>

        <div className="text-center text-xs text-gray-500">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-bold text-kimdong-red hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
