import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { CartItem } from '../types';
import { useToast } from './ToastContext';

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  subtotal: number;
  loading: boolean;
  addToCart: (bookId: number, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  removeItems: (cartItemIds: number[]) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cart');
      setItems(res.data.items || []);
    } catch (error: any) {
      console.error('Fetch cart error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (bookId: number, quantity: number = 1) => {
    try {
      await api.post('/cart/items', { book_id: bookId, quantity });
      showToast('Đã thêm sản phẩm vào giỏ hàng!', 'success');
      await fetchCart();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Không thể thêm vào giỏ hàng', 'error');
    }
  };

  const updateQuantity = async (cartItemId: number, quantity: number) => {
    try {
      await api.put(`/cart/items/${cartItemId}`, { quantity });
      await fetchCart();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Không thể cập nhật số lượng', 'error');
    }
  };

  const removeItem = async (cartItemId: number) => {
    try {
      await api.delete(`/cart/items/${cartItemId}`);
      showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
      await fetchCart();
    } catch (error: any) {
      showToast('Lỗi khi xóa sản phẩm', 'error');
    }
  };

  /** Xóa nhiều sách đã chọn trong một lần (sau khi người dùng xác nhận) */
  const removeItems = async (cartItemIds: number[]) => {
    if (cartItemIds.length === 0) return;
    try {
      await api.post('/cart/items/remove', { ids: cartItemIds });
      showToast(`Đã xóa ${cartItemIds.length} sách khỏi giỏ hàng`, 'success');
      await fetchCart();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi khi xóa sách khỏi giỏ hàng', 'error');
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      setItems([]);
      showToast('Đã xóa toàn bộ sách khỏi giỏ hàng', 'success');
    } catch (error) {
      console.error('Clear cart error:', error);
      showToast('Lỗi khi xóa toàn bộ giỏ hàng', 'error');
    }
  };

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => {
    const price = item.sale_price !== null && item.sale_price !== undefined && item.sale_price < item.price ? item.sale_price : item.price;
    return acc + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ items, cartCount, subtotal, loading, addToCart, updateQuantity, removeItem, removeItems, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
