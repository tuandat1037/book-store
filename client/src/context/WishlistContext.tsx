import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { Book } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface WishlistContextType {
  wishlistIds: number[];
  wishlistBooks: Book[];
  toggleWishlist: (bookId: number) => Promise<void>;
  isInWishlist: (bookId: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistBooks, setWishlistBooks] = useState<Book[]>([]);
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchWishlist = async () => {
    if (!user) {
      setWishlistBooks([]);
      return;
    }
    try {
      const res = await api.get('/wishlist');
      setWishlistBooks(res.data.wishlist || []);
    } catch (error) {
      console.error('Fetch wishlist error:', error);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const toggleWishlist = async (bookId: number) => {
    if (!user) {
      showToast('Vui lòng đăng nhập để lưu sản phẩm yêu thích', 'info');
      return;
    }
    try {
      const res = await api.post('/wishlist/toggle', { book_id: bookId });
      showToast(res.data.message, res.data.inWishlist ? 'success' : 'info');
      await fetchWishlist();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra', 'error');
    }
  };

  const wishlistIds = wishlistBooks.map((b) => b.id);
  const isInWishlist = (bookId: number) => wishlistIds.includes(bookId);

  return (
    <WishlistContext.Provider value={{ wishlistIds, wishlistBooks, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};
