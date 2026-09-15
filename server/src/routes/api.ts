import { Router } from 'express';
import * as authCtrl from '../controllers/authController.js';
import * as bookCtrl from '../controllers/bookController.js';
import * as catCtrl from '../controllers/categoryController.js';
import * as cartCtrl from '../controllers/cartController.js';
import * as orderCtrl from '../controllers/orderController.js';
import * as adminCtrl from '../controllers/adminController.js';
import * as bannerCtrl from '../controllers/bannerController.js';
import * as userCtrl from '../controllers/userController.js';
import * as reviewCtrl from '../controllers/reviewController.js';
import * as wishCtrl from '../controllers/wishlistController.js';
import * as metaCtrl from '../controllers/metaController.js';
import * as authorCtrl from '../controllers/authorController.js';
import * as promoCtrl from '../controllers/promotionController.js';
import * as customerCtrl from '../controllers/customerController.js';
import * as inventoryCtrl from '../controllers/inventoryController.js';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Auth Routes
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authenticateToken, authCtrl.getProfile);
router.put('/auth/me', authenticateToken, authCtrl.updateProfile);
router.put('/auth/change-password', authenticateToken, authCtrl.changePassword);

// Books Routes
router.get('/books', bookCtrl.getBooks);
router.get('/books/sections/home', bookCtrl.getHomeSections);
router.get('/books/:param', bookCtrl.getBookBySlugOrId);
router.post('/books', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), bookCtrl.createBook);
router.put('/books/:id', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), bookCtrl.updateBook);
router.delete('/books/:id', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), bookCtrl.deleteBook);

// Category Routes
router.get('/categories', catCtrl.getCategories);
router.post('/categories', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), catCtrl.createCategory);
router.put('/categories/:id', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), catCtrl.updateCategory);
router.delete('/categories/:id', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), catCtrl.deleteCategory);

// Authors & Publishers (for admin book form selects)
router.get('/authors', authorCtrl.getAuthors);
router.post('/authors', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), authorCtrl.createAuthor);
router.put('/authors/:id', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), authorCtrl.updateAuthor);
router.delete('/authors/:id', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), authorCtrl.deleteAuthor);
router.get('/publishers', metaCtrl.getPublishers);

// Banner Routes (public carousel + admin CRUD)
router.get('/banners', bannerCtrl.getActiveBanners);
router.get('/banners/all', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), bannerCtrl.getAllBanners);
router.post('/banners', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), bannerCtrl.createBanner);
router.put('/banners/:id', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), bannerCtrl.updateBanner);
router.delete('/banners/:id', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), bannerCtrl.deleteBanner);

// Promotion Routes (mã giảm giá: public xem/kiểm tra + admin CRUD)
router.get('/promotions', promoCtrl.getActivePromotions);
router.post('/promotions/validate', promoCtrl.validatePromotion);
router.get('/promotions/all', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), promoCtrl.getAllPromotions);
router.post('/promotions', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), promoCtrl.createPromotion);
router.put('/promotions/:id', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), promoCtrl.updatePromotion);
router.put('/promotions/:id/toggle', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), promoCtrl.togglePromotion);
router.delete('/promotions/:id', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), promoCtrl.deletePromotion);

// User Accounts (ADMIN only — staff management)
router.get('/users', authenticateToken, requireRole(['ADMIN']), userCtrl.listUsers);
router.post('/users', authenticateToken, requireRole(['ADMIN']), userCtrl.createUser);
router.put('/users/:id', authenticateToken, requireRole(['ADMIN']), userCtrl.updateUser);
router.put('/users/:id/role', authenticateToken, requireRole(['ADMIN']), userCtrl.updateUserRole);
router.delete('/users/:id', authenticateToken, requireRole(['ADMIN']), userCtrl.deleteUser);

// Customer Management (ADMIN + EMPLOYEE xem, chỉ ADMIN sửa)
router.get('/customers', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), customerCtrl.listCustomers);
router.get('/customers/:id', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), customerCtrl.getCustomerDetail);
router.put('/customers/:id', authenticateToken, requireRole(['ADMIN']), customerCtrl.updateCustomer);

// Cart Routes
router.get('/cart', optionalAuth, cartCtrl.getCart);
router.post('/cart/items', optionalAuth, cartCtrl.addToCart);
router.put('/cart/items/:id', optionalAuth, cartCtrl.updateCartItem);
router.delete('/cart/items/:id', optionalAuth, cartCtrl.removeCartItem);
router.post('/cart/items/remove', optionalAuth, cartCtrl.removeCartItems);
router.delete('/cart/clear', optionalAuth, cartCtrl.clearCart);

// Order Routes
router.post('/orders', optionalAuth, orderCtrl.createOrder);
router.get('/orders', authenticateToken, orderCtrl.getOrders);
router.get('/orders/:id', optionalAuth, orderCtrl.getOrderById);
// Kiểm tra thông tin đơn + xác nhận đơn hàng (nhân viên / quản trị)
router.get('/orders/:id/verification', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), orderCtrl.getOrderVerification);
router.put('/orders/:id/confirm', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), orderCtrl.confirmOrder);
router.put('/orders/:id/cancel', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), orderCtrl.cancelOrder);
router.put('/orders/:id/status', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), orderCtrl.updateOrderStatus);

// Admin Routes
router.get('/admin/statistics', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), adminCtrl.getStatistics);

// Quản lý kho (ADMIN + EMPLOYEE)
router.get('/inventory', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), inventoryCtrl.getInventory);
router.get('/inventory/by-category', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), inventoryCtrl.getInventoryByCategory);
router.get('/inventory/:id', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), inventoryCtrl.getInventoryItem);
router.post('/inventory/:id/import', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), inventoryCtrl.importStock);
router.put('/inventory/:id/stock', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), inventoryCtrl.adjustStock);

// Reviews & Wishlist
router.get('/books/:bookId/reviews', reviewCtrl.getBookReviews);
// Sách đã mua & đơn hoàn thành (dùng cho "Đơn hàng của tôi" -> nút Đánh giá)
router.get('/reviews/my-books', authenticateToken, reviewCtrl.getReviewableBooks);
// Quyền đánh giá một cuốn sách cụ thể (trang chi tiết sách)
router.get('/reviews/eligibility/:bookId', authenticateToken, reviewCtrl.getReviewEligibility);
router.post('/reviews', authenticateToken, reviewCtrl.addReview);

router.get('/wishlist', authenticateToken, wishCtrl.getWishlist);
router.post('/wishlist/toggle', authenticateToken, wishCtrl.toggleWishlist);

export default router;
