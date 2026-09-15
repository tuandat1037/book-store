import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import { MainLayout } from './layouts/MainLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ScrollToTop } from './components/common/ScrollToTop';

import { HomePage } from './pages/HomePage';
import { BooksPage } from './pages/BooksPage';
import { BookDetailPage } from './pages/BookDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AccountPage } from './pages/AccountPage';
import { WishlistPage } from './pages/WishlistPage';
import { NewsPage } from './pages/NewsPage';
import { AboutPage } from './pages/AboutPage';
import { NotFoundPage } from './pages/NotFoundPage';

import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminBooksPage } from './pages/AdminBooksPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminBannersPage } from './pages/AdminBannersPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminCategoriesPage } from './pages/AdminCategoriesPage';
import { AdminAuthorsPage } from './pages/AdminAuthorsPage';
import { AdminPromotionsPage } from './pages/AdminPromotionsPage';
import { AdminCustomersPage } from './pages/AdminCustomersPage';
import { AdminInventoryPage } from './pages/AdminInventoryPage';

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Routes>
                {/* Store Routes */}
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="books" element={<BooksPage />} />
                  <Route path="books/:param" element={<BookDetailPage />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="order-success/:orderCode" element={<OrderSuccessPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route path="account" element={<AccountPage />} />
                  <Route path="wishlist" element={<WishlistPage />} />
                  <Route path="news" element={<NewsPage />} />
                  <Route path="about" element={<AboutPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                {/* Admin Portal Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="books" element={<AdminBooksPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="banners" element={<AdminBannersPage />} />
                  <Route path="promotions" element={<AdminPromotionsPage />} />
                  <Route path="customers" element={<AdminCustomersPage />} />
                  <Route path="inventory" element={<AdminInventoryPage />} />
                  <Route path="categories" element={<AdminCategoriesPage />} />
                  <Route path="authors" element={<AdminAuthorsPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                </Route>
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
