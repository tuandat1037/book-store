import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import api from '../services/api';
import { User } from '../types';
import { Modal } from '../components/common/Modal';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  /** Mở cửa sổ xác nhận trước khi đăng xuất (dùng cho các nút Đăng xuất). */
  requestLogout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('kimdong_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
        })
        .catch(() => {
          localStorage.removeItem('kimdong_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('kimdong_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('kimdong_token');
    setUser(null);
  };

  /** Mở popup xác nhận đăng xuất. */
  const requestLogout = () => {
    if (!user) return;
    setConfirmingLogout(true);
  };

  /** Người dùng bấm "Đăng xuất" trong popup xác nhận. */
  const confirmLogout = () => {
    logout();
    setConfirmingLogout(false);
    navigate('/');
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedUser });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, requestLogout, updateUser }}>
      {children}
      {confirmingLogout && (
        <Modal title="Xác nhận đăng xuất" onClose={() => setConfirmingLogout(false)} maxWidth="max-w-sm">
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <div className="w-12 h-12 rounded-full bg-red-50 text-kimdong-red flex items-center justify-center">
              <LogOut className="w-6 h-6" />
            </div>
            <p className="text-xs text-gray-600">
              {user ? (
                <>Bạn có chắc muốn đăng xuất khỏi tài khoản <span className="font-bold text-gray-900">{user.full_name}</span>?</>
              ) : (
                'Bạn có chắc muốn đăng xuất?'
              )}
            </p>
            <div className="flex gap-2 w-full mt-1">
              <button
                onClick={() => setConfirmingLogout(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-kimdong-red text-white hover:bg-kimdong-darkred transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
