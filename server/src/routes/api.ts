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
router.get('/books', optionalAuth, bookCtrl.getBooks);
router.get('/books/sections/home', bookCtrl.getHomeSections);
router.get('/books/:param', bookCtrl.getBookBySlugOrId);
router.post('/books', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), bookCtrl.createBook);
router.put('/books/:id', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), bookCtrl.updateBook);
// Chỉ ADMIN được xóa sách / ngừng kinh doanh (đổi status). Nhân viên chỉ thêm/sửa.
router.delete('/books/:id', authenticateToken, requireRole(['ADMIN']), bookCtrl.deleteBook);

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

// Banner Routes (public carousel + ADMIN CRUD — nhân viên không được quản lý banner)
router.get('/banners', bannerCtrl.getActiveBanners);
router.get('/banners/all', authenticateToken, requireRole(['ADMIN']), bannerCtrl.getAllBanners);
router.post('/banners', authenticateToken, requireRole(['ADMIN']), bannerCtrl.createBanner);
router.put('/banners/:id', authenticateToken, requireRole(['ADMIN']), bannerCtrl.updateBanner);
router.delete('/banners/:id', authenticateToken, requireRole(['ADMIN']), bannerCtrl.deleteBanner);

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

// Cart Routes (bắt buộc đăng nhập mới được xem/thêm giỏ hàng)
router.get('/cart', authenticateToken, cartCtrl.getCart);
router.post('/cart/items', authenticateToken, cartCtrl.addToCart);
router.put('/cart/items/:id', authenticateToken, cartCtrl.updateCartItem);
router.delete('/cart/items/:id', authenticateToken, cartCtrl.removeCartItem);
router.post('/cart/items/remove', authenticateToken, cartCtrl.removeCartItems);
router.delete('/cart/clear', authenticateToken, cartCtrl.clearCart);

// Order Routes
router.post('/orders', optionalAuth, orderCtrl.createOrder);
router.get('/orders', authenticateToken, orderCtrl.getOrders);
router.get('/orders/:id', optionalAuth, orderCtrl.getOrderById);
// Kiểm tra thông tin đơn + xác nhận đơn hàng (nhân viên / quản trị)
router.get('/orders/:id/verification', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), orderCtrl.getOrderVerification);
router.put('/orders/:id/confirm', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE']), orderCtrl.confirmOrder);
// Khách hàng được tự hủy ĐƠN CỦA MÌNH (kiểm tra chính chủ trong controller),
// nhân viên / quản trị hủy đơn bất kỳ.
router.put('/orders/:id/cancel', authenticateToken, requireRole(['ADMIN', 'EMPLOYEE', 'CUSTOMER']), orderCtrl.cancelOrder);
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
