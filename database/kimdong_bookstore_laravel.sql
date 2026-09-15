-- ============================================================
-- DATABASE: kimdong_bookstore (bản Laravel — ĐÃ SỬA LỖI)
-- Website bán sách trực tuyến & quản lý bán sách
-- Stack: React + Laravel REST API + MySQL
-- 3 roles: admin, employee, customer
--
-- Mật khẩu demo của TẤT CẢ tài khoản: password
-- (hash bcrypt "$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi"
--  — hash chuẩn của Laravel cho chuỗi "password", 60 ký tự.
--  Bản cũ trong file mẫu bị CUT MẤT 2 KÝ TỰ (58) => mọi acc không login được.
--  production: luôn tạo hash bằng Hash::make() trong Seeder, không hard-code.)
-- ============================================================

CREATE DATABASE IF NOT EXISTS kimdong_bookstore
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kimdong_bookstore;

-- Import qua CLI/phpMyAdmin an toàn với tiếng Việt:
SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS inventory_transactions;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS promotion_books;
DROP TABLE IF EXISTS promotions;
DROP TABLE IF EXISTS wishlists;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS book_images;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS publishers;
DROP TABLE IF EXISTS authors;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','employee','customer') NOT NULL DEFAULT 'customer',
    status ENUM('active','locked') NOT NULL DEFAULT 'active',
    avatar VARCHAR(500) NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role),
    INDEX idx_users_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 2. ADDRESSES
-- ============================================================
CREATE TABLE addresses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    recipient_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    ward VARCHAR(100) NOT NULL,
    address_detail VARCHAR(255) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_addresses_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    INDEX idx_addresses_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- 3. CATEGORIES
-- ============================================================
CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    parent_id BIGINT UNSIGNED NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    description TEXT NULL,
    image VARCHAR(500) NULL,
    status ENUM('active','hidden') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_categories_parent
        FOREIGN KEY (parent_id) REFERENCES categories(id)
        ON DELETE SET NULL,
    INDEX idx_categories_parent (parent_id)
) ENGINE=InnoDB;

-- ============================================================
-- 4. AUTHORS
-- ============================================================
CREATE TABLE authors (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    biography TEXT NULL,
    nationality VARCHAR(100) NULL,
    birth_date DATE NULL,
    avatar VARCHAR(500) NULL,
    status ENUM('active','hidden') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_authors_name (name)
) ENGINE=InnoDB;

-- ============================================================
-- 5. PUBLISHERS
-- ============================================================
CREATE TABLE publishers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(150) NULL,
    website VARCHAR(255) NULL,
    description TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 6. BOOKS
-- ============================================================
CREATE TABLE books (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED NOT NULL,
    author_id BIGINT UNSIGNED NOT NULL,
    publisher_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(280) NOT NULL UNIQUE,
    isbn VARCHAR(30) NULL UNIQUE,
    description TEXT NULL,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(12,2) NULL,
    -- sửa lỗi dữ liệu mẫu: sale_price phải <= price (thêm CHECK)
    CONSTRAINT chk_books_sale_price CHECK (sale_price IS NULL OR sale_price <= price),
    stock INT UNSIGNED NOT NULL DEFAULT 0,
    sold_count INT UNSIGNED NOT NULL DEFAULT 0,
    page_count INT UNSIGNED NULL,
    weight INT UNSIGNED NULL COMMENT 'gram',
    cover_image VARCHAR(500) NULL,
    published_date DATE NULL,
    status ENUM('active','hidden','out_of_stock') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,

    CONSTRAINT fk_books_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_books_author
        FOREIGN KEY (author_id) REFERENCES authors(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_books_publisher
        FOREIGN KEY (publisher_id) REFERENCES publishers(id)
        ON DELETE RESTRICT,

    INDEX idx_books_category (category_id),
    INDEX idx_books_author (author_id),
    INDEX idx_books_publisher (publisher_id),
    INDEX idx_books_price (price),
    INDEX idx_books_stock (stock),
    INDEX idx_books_status (status),
    INDEX idx_books_title (title),
    -- bổ sung: tìm kiếm full-text cho ô search của web
    FULLTEXT KEY ft_books_title (title)
) ENGINE=InnoDB;

-- ============================================================
-- 7. BOOK IMAGES
-- ============================================================
CREATE TABLE book_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    book_id BIGINT UNSIGNED NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_book_images_book
        FOREIGN KEY (book_id) REFERENCES books(id)
        ON DELETE CASCADE,
    INDEX idx_book_images_book (book_id)
) ENGINE=InnoDB;

-- ============================================================
-- 8. CARTS
-- ============================================================
CREATE TABLE carts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_carts_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 9. CART ITEMS
-- ============================================================
CREATE TABLE cart_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cart_id BIGINT UNSIGNED NOT NULL,
    book_id BIGINT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_cart_items_cart
        FOREIGN KEY (cart_id) REFERENCES carts(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_book
        FOREIGN KEY (book_id) REFERENCES books(id)
        ON DELETE RESTRICT,

    UNIQUE KEY uk_cart_book (cart_id, book_id),
    INDEX idx_cart_items_book (book_id)
) ENGINE=InnoDB;

-- ============================================================
-- 10. WISHLISTS
-- ============================================================
CREATE TABLE wishlists (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    book_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_wishlists_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_wishlists_book
        FOREIGN KEY (book_id) REFERENCES books(id)
        ON DELETE CASCADE,

    UNIQUE KEY uk_wishlist_user_book (user_id, book_id)
) ENGINE=InnoDB;

-- ============================================================
-- 11. PROMOTIONS
-- ============================================================
CREATE TABLE promotions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    discount_type ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
    discount_value DECIMAL(12,2) NOT NULL,
    min_order_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    max_discount DECIMAL(12,2) NULL,
    usage_limit INT UNSIGNED NULL,
    used_count INT UNSIGNED NOT NULL DEFAULT 0,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    -- bổ sung: mã giảm giá phải có thời hạn hợp lệ
    CONSTRAINT chk_promotions_dates CHECK (end_at > start_at),
    status ENUM('active','inactive','expired') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_promotions_status (status),
    INDEX idx_promotions_dates (start_at, end_at)
) ENGINE=InnoDB;

-- ============================================================
-- 12. PROMOTION BOOKS
-- ============================================================
CREATE TABLE promotion_books (
    promotion_id BIGINT UNSIGNED NOT NULL,
    book_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (promotion_id, book_id),

    CONSTRAINT fk_promotion_books_promotion
        FOREIGN KEY (promotion_id) REFERENCES promotions(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_promotion_books_book
        FOREIGN KEY (book_id) REFERENCES books(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 13. ORDERS
-- ============================================================
CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    address_id BIGINT UNSIGNED NULL,
    order_code VARCHAR(30) NOT NULL UNIQUE,

    recipient_name VARCHAR(150) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,

    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    -- bổ sung: tiền phải khớp công thức
    CONSTRAINT chk_orders_total CHECK (total_amount = subtotal - discount_amount + shipping_fee),
    CONSTRAINT chk_orders_discount CHECK (discount_amount >= 0 AND discount_amount <= subtotal),

    promotion_id BIGINT UNSIGNED NULL,

    payment_method ENUM('cod','bank_transfer') NOT NULL DEFAULT 'cod',
    payment_status ENUM('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',

    status ENUM(
        'pending','confirmed','preparing','shipping','completed','cancelled'
    ) NOT NULL DEFAULT 'pending',

    note TEXT NULL,
    cancelled_reason VARCHAR(500) NULL,

    confirmed_at DATETIME NULL,
    completed_at DATETIME NULL,
    cancelled_at DATETIME NULL,

    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_orders_address
        FOREIGN KEY (address_id) REFERENCES addresses(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_orders_promotion
        FOREIGN KEY (promotion_id) REFERENCES promotions(id)
        ON DELETE SET NULL,

    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_payment_status (payment_status),
    INDEX idx_orders_created_at (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 14. ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    book_id BIGINT UNSIGNED NOT NULL,
    book_title VARCHAR(255) NOT NULL,
    book_price DECIMAL(12,2) NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    -- bổ sung: subtotal dòng phải = price * qty; mỗi sách chỉ 1 dòng/đơn
    CONSTRAINT chk_order_items_subtotal CHECK (subtotal = book_price * quantity),

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_order_items_book
        FOREIGN KEY (book_id) REFERENCES books(id)
        ON DELETE RESTRICT,

    UNIQUE KEY uk_order_book (order_id, book_id),
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_book (book_id)
) ENGINE=InnoDB;

-- ============================================================
-- 15. REVIEWS
-- ============================================================
CREATE TABLE reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    book_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NULL,
    rating TINYINT UNSIGNED NOT NULL,
    -- bổ sung: chặn rating != 1..5 ngay tại DB
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NULL,
    status ENUM('pending','approved','hidden') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_reviews_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_reviews_book
        FOREIGN KEY (book_id) REFERENCES books(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_reviews_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE SET NULL,

    UNIQUE KEY uk_review_user_book_order (user_id, book_id, order_id),
    INDEX idx_reviews_book (book_id),
    INDEX idx_reviews_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 16. INVENTORY TRANSACTIONS
-- ============================================================
CREATE TABLE inventory_transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    book_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    type ENUM('import','sale','adjustment','return') NOT NULL,
    -- SỬA LỖI: 'adjustment' có thể TRỪ kho (âm). Bản cũ để INT UNSIGNED
    -- => mọi điều chỉnh giảm sẽ bị lỗi "Out of range value". Đổi thành INT có dấu.
    quantity INT NOT NULL COMMENT 'dương: nhập thêm, âm: trừ ra',
    stock_before INT UNSIGNED NOT NULL,
    stock_after INT UNSIGNED NOT NULL,
    reference_type VARCHAR(50) NULL,
    reference_id BIGINT UNSIGNED NULL,
    note VARCHAR(500) NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_book
        FOREIGN KEY (book_id) REFERENCES books(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_inventory_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_inventory_book (book_id),
    INDEX idx_inventory_type (type),
    INDEX idx_inventory_created_at (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO users
(full_name, email, phone, password, role, status)
VALUES
('Quản trị hệ thống', 'admin@kimdong.local', '0900000001',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'admin', 'active'),

('Nguyễn Văn Nhân', 'nhanvien1@kimdong.local', '0900000002',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'employee', 'active'),

('Trần Thị Nhân', 'nhanvien2@kimdong.local', '0900000003',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'employee', 'active'),

('Nguyễn Minh Anh', 'minhanh@gmail.com', '0910000001',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'customer', 'active'),

('Trần Gia Huy', 'giahuy@gmail.com', '0910000002',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'customer', 'active'),

('Lê Khánh Linh', 'khanhlinh@gmail.com', '0910000003',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'customer', 'active'),

('Phạm Nhật Nam', 'nhatnam@gmail.com', '0910000004',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'customer', 'active');

-- Categories
INSERT INTO categories (name, slug, description) VALUES
('Truyện tranh', 'truyen-tranh', 'Truyện tranh dành cho nhiều độ tuổi.'),
('Truyện chữ', 'truyen-chu', 'Truyện chữ và văn học dành cho thiếu nhi.'),
('Sách kỹ năng', 'sach-ky-nang', 'Sách phát triển kỹ năng và thói quen tốt.'),
('Sách giáo dục', 'sach-giao-duc', 'Sách học tập và khám phá kiến thức.'),
('Khoa học', 'khoa-hoc', 'Sách khoa học và khám phá thế giới.'),
('Lịch sử', 'lich-su', 'Sách lịch sử và văn hóa.'),
('Văn học', 'van-hoc', 'Các tác phẩm văn học chọn lọc.'),
('Sách tham khảo', 'sach-tham-khao', 'Sách tham khảo học tập.');

-- Authors
INSERT INTO authors (name, biography, nationality) VALUES
('Nguyễn Nhật Ánh', 'Tác giả văn học Việt Nam với nhiều tác phẩm dành cho tuổi mới lớn.', 'Việt Nam'),
('Tô Hoài', 'Nhà văn Việt Nam nổi tiếng với nhiều tác phẩm viết cho thiếu nhi.', 'Việt Nam'),
('Vũ Bằng', 'Tác giả có nhiều tác phẩm văn học và tùy bút.', 'Việt Nam'),
('Fujiko F. Fujio', 'Bút danh của cặp tác giả manga nổi tiếng với các tác phẩm thiếu nhi.', 'Nhật Bản'),
('Gosho Aoyama', 'Họa sĩ manga Nhật Bản, tác giả Thám tử lừng danh Conan.', 'Nhật Bản'),
('Eiichiro Oda', 'Họa sĩ manga Nhật Bản, tác giả One Piece.', 'Nhật Bản'),
('Hiro Mashima', 'Họa sĩ manga Nhật Bản.', 'Nhật Bản'),
('Nhiều tác giả', 'Nhóm tác giả biên soạn sách kiến thức và giáo dục.', 'Việt Nam');

-- Publishers
INSERT INTO publishers (name, address, phone, email, website) VALUES
('Nhà xuất bản Kim Đồng', '55 Quang Trung, Hai Bà Trưng, Hà Nội', '02439434730', 'contact@nxbkimdong.com.vn', 'https://nxbkimdong.com.vn'),
('NXB Giáo dục Việt Nam', '81 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội', '02438220801', 'contact@nxbgd.vn', 'https://nxbgd.vn');

-- Books
INSERT INTO books
(category_id, author_id, publisher_id, title, slug, isbn, description,
 price, sale_price, stock, sold_count, page_count, weight, cover_image, published_date)
VALUES
(1, 4, 1, 'Doraemon - Tập 01', 'doraemon-tap-01', 'ISBN-DEMO-0001',
 'Một tập truyện tranh thiếu nhi vui nhộn với nhiều câu chuyện gần gũi.',
 25000, 22000, 120, 86, 192, 180, '/images/books/doraemon-01.jpg', '2025-01-10'),

(1, 5, 1, 'Thám Tử Lừng Danh Conan - Tập 01', 'conan-tap-01', 'ISBN-DEMO-0002',
 'Hành trình phá án của thám tử nhí Conan.',
 30000, 27000, 95, 72, 192, 190, '/images/books/conan-01.jpg', '2025-02-15'),

(1, 6, 1, 'One Piece - Tập 01', 'one-piece-tap-01', 'ISBN-DEMO-0003',
 'Cuộc phiêu lưu của những hải tặc trẻ tuổi.',
 25000, 25000, 80, 55, 208, 200, '/images/books/one-piece-01.jpg', '2025-03-05'),

(7, 1, 1, 'Cho Tôi Xin Một Vé Đi Tuổi Thơ', 'cho-toi-xin-mot-ve-di-tuoi-tho', 'ISBN-DEMO-0004',
 'Tác phẩm văn học dành cho tuổi mới lớn với những câu chuyện nhẹ nhàng.',
 85000, 72000, 65, 48, 220, 260, '/images/books/ve-tuoi-tho.jpg', '2024-08-20'),

(7, 1, 1, 'Mắt Biếc', 'mat-biec', 'ISBN-DEMO-0005',
 'Một câu chuyện tình cảm giàu cảm xúc.',
 95000, 79000, 70, 64, 300, 320, '/images/books/mat-biec.jpg', '2024-09-12'),

(2, 2, 1, 'Dế Mèn Phiêu Lưu Ký', 'de-men-phieu-luu-ky', 'ISBN-DEMO-0006',
 'Tác phẩm thiếu nhi kinh điển kể về hành trình trưởng thành của Dế Mèn.',
 60000, 52000, 90, 75, 180, 240, '/images/books/de-men.jpg', '2024-06-01'),

(3, 8, 1, 'Cẩm Nang Kỹ Năng Cho Tuổi Mới Lớn', 'cam-nang-ky-nang-tuoi-moi-lon', 'ISBN-DEMO-0007',
 'Những kỹ năng thiết thực dành cho học sinh.',
 78000, 65000, 50, 33, 160, 230, '/images/books/ky-nang.jpg', '2025-04-20'),

(4, 8, 1, 'Bách Khoa Khám Phá Thế Giới', 'bach-khoa-kham-pha-the-gioi', 'ISBN-DEMO-0008',
 'Sách kiến thức tổng hợp giúp trẻ khám phá thế giới xung quanh.',
 120000, 99000, 42, 29, 320, 500, '/images/books/bach-khoa.jpg', '2025-05-01'),

(5, 8, 1, '100 Câu Hỏi Vì Sao?', '100-cau-hoi-vi-sao', 'ISBN-DEMO-0009',
 'Giải đáp những câu hỏi khoa học thú vị.',
 70000, 59000, 35, 21, 200, 300, '/images/books/100-cau-hoi.jpg', '2025-05-18'),

(6, 8, 2, 'Lược Sử Việt Nam Dành Cho Thiếu Nhi', 'luoc-su-viet-nam-thieu-nhi', 'ISBN-DEMO-0010',
 'Tổng quan lịch sử Việt Nam được trình bày dễ hiểu.',
 110000, 92000, 28, 19, 280, 420, '/images/books/lich-su.jpg', '2025-01-25'),

(1, 7, 1, 'Fairy Tail - Tập 01', 'fairy-tail-tap-01', 'ISBN-DEMO-0011',
 'Một chuyến phiêu lưu kỳ thú của hội pháp sư.',
 28000, 25000, 60, 41, 192, 190, '/images/books/fairy-tail-01.jpg', '2025-02-20'),

(3, 8, 1, 'Thói Quen Tốt Mỗi Ngày', 'thoi-quen-tot-moi-ngay', 'ISBN-DEMO-0012',
 'Những gợi ý đơn giản để xây dựng thói quen học tập và sinh hoạt tốt.',
 65000, 55000, 45, 27, 150, 220, '/images/books/thoi-quen.jpg', '2025-03-30');

-- Book images
INSERT INTO book_images (book_id, image_url, sort_order) VALUES
(1, '/images/books/doraemon-01.jpg', 1),
(1, '/images/books/doraemon-01-back.jpg', 2),
(2, '/images/books/conan-01.jpg', 1),
(2, '/images/books/conan-01-back.jpg', 2),
(3, '/images/books/one-piece-01.jpg', 1),
(4, '/images/books/ve-tuoi-tho.jpg', 1),
(5, '/images/books/mat-biec.jpg', 1),
(6, '/images/books/de-men.jpg', 1),
(7, '/images/books/ky-nang.jpg', 1),
(8, '/images/books/bach-khoa.jpg', 1),
(9, '/images/books/100-cau-hoi.jpg', 1),
(10, '/images/books/lich-su.jpg', 1),
(11, '/images/books/fairy-tail-01.jpg', 1),
(12, '/images/books/thoi-quen.jpg', 1);

-- Addresses
INSERT INTO addresses
(user_id, recipient_name, phone, province, district, ward, address_detail, is_default)
VALUES
(4, 'Nguyễn Minh Anh', '0910000001', 'Hà Nội', 'Cầu Giấy', 'Dịch Vọng', 'Số 12 phố Dịch Vọng', TRUE),
(5, 'Trần Gia Huy', '0910000002', 'Hà Nội', 'Thanh Xuân', 'Nhân Chính', 'Số 25 đường Nhân Chính', TRUE),
(6, 'Lê Khánh Linh', '0910000003', 'Hà Nội', 'Đống Đa', 'Láng Thượng', 'Số 18 phố Láng', TRUE),
(7, 'Phạm Nhật Nam', '0910000004', 'Hải Phòng', 'Lê Chân', 'An Biên', 'Số 30 đường An Biên', TRUE);

-- Carts
INSERT INTO carts (user_id) VALUES
(4), (5), (6), (7);

-- Cart items
INSERT INTO cart_items (cart_id, book_id, quantity) VALUES
(1, 1, 2),
(1, 7, 1),
(2, 2, 1),
(2, 4, 1),
(3, 8, 1),
(4, 6, 2);

-- Wishlists
INSERT INTO wishlists (user_id, book_id) VALUES
(4, 2),
(4, 5),
(5, 1),
(5, 8),
(6, 3),
(6, 9),
(7, 6);

-- Promotions
-- SỬA LỖI: BOOK20K min_order_value bản cũ = 200.000 nhưng đơn mẫu dùng nó
-- chỉ có subtotal 198.000 => vi phạm điều kiện. Hạ ngưỡng về 150.000 cho khớp.
INSERT INTO promotions
(name, code, description, discount_type, discount_value, min_order_value, max_discount,
 usage_limit, used_count, start_at, end_at, status)
VALUES
('Ưu đãi tháng mới', 'NEWBOOK10', 'Giảm 10% cho đơn hàng đủ điều kiện.', 'percent', 10, 100000, 50000,
 500, 32, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 'active'),

('Giảm 20K', 'BOOK20K', 'Giảm trực tiếp 20.000 đồng cho đơn hàng từ 150.000 đồng.', 'fixed', 20000, 150000, NULL,
 300, 18, '2026-06-01 00:00:00', '2026-12-31 23:59:59', 'active');

INSERT INTO promotion_books (promotion_id, book_id) VALUES
(1, 1), (1, 2), (1, 4), (1, 5), (1, 6), (1, 7),
(2, 7), (2, 8), (2, 9), (2, 10);

-- Orders
-- SỬA LỖI:
--  + Đơn KD202600001: bản cũ subtotal 94.000 nhưng items = 44.000 + 65.000 = 109.000
--    => sửa subtotal 109.000, discount 10% = 10.900, total = 128.100.
--  + Đơn đã 'completed' (COD, khách đã nhận sách) mà payment_status 'unpaid' là vô lý
--    => sửa thành 'paid'.
INSERT INTO orders
(user_id, address_id, order_code, recipient_name, recipient_phone, shipping_address,
 subtotal, discount_amount, shipping_fee, total_amount, promotion_id,
 payment_method, payment_status, status, note, confirmed_at, completed_at)
VALUES
(4, 1, 'KD202600001', 'Nguyễn Minh Anh', '0910000001',
 'Số 12 phố Dịch Vọng, Dịch Vọng, Cầu Giấy, Hà Nội',
 109000, 10900, 30000, 128100, 1,
 'cod', 'paid', 'completed', 'Giao giờ hành chính',
 '2026-08-20 09:00:00', '2026-08-22 15:30:00'),

(5, 2, 'KD202600002', 'Trần Gia Huy', '0910000002',
 'Số 25 đường Nhân Chính, Nhân Chính, Thanh Xuân, Hà Nội',
 99000, 0, 30000, 129000, NULL,
 'cod', 'unpaid', 'shipping', NULL,
 '2026-08-25 10:00:00', NULL),

(6, 3, 'KD202600003', 'Lê Khánh Linh', '0910000003',
 'Số 18 phố Láng, Láng Thượng, Đống Đa, Hà Nội',
 198000, 20000, 30000, 208000, 2,
 'bank_transfer', 'paid', 'confirmed', NULL,
 '2026-08-27 14:00:00', NULL),

(7, 4, 'KD202600004', 'Phạm Nhật Nam', '0910000004',
 'Số 30 đường An Biên, An Biên, Lê Chân, Hải Phòng',
 104000, 0, 35000, 139000, NULL,
 'cod', 'unpaid', 'pending', NULL,
 NULL, NULL);

-- Order items
INSERT INTO order_items
(order_id, book_id, book_title, book_price, quantity, subtotal)
VALUES
(1, 1, 'Doraemon - Tập 01', 22000, 2, 44000),
(1, 7, 'Cẩm Nang Kỹ Năng Cho Tuổi Mới Lớn', 65000, 1, 65000),

(2, 2, 'Thám Tử Lừng Danh Conan - Tập 01', 27000, 1, 27000),
(2, 4, 'Cho Tôi Xin Một Vé Đi Tuổi Thơ', 72000, 1, 72000),

(3, 8, 'Bách Khoa Khám Phá Thế Giới', 99000, 2, 198000),

(4, 6, 'Dế Mèn Phiêu Lưu Ký', 52000, 2, 104000);

-- Reviews
INSERT INTO reviews
(user_id, book_id, order_id, rating, comment, status)
VALUES
(4, 1, 1, 5, 'Sách đẹp, nội dung vui và giao hàng nhanh.', 'approved'),
(4, 7, 1, 4, 'Nội dung dễ đọc, phù hợp học sinh.', 'approved'),
(5, 2, 2, 5, 'Đóng gói cẩn thận, sách mới.', 'approved'),
(6, 8, 3, 5, 'Nhiều kiến thức thú vị và hình ảnh đẹp.', 'approved');

-- Inventory transactions
-- SỬA LỖI: stock_before/stock_after bản cũ KHÔNG khớp stock hiện tại của sách
-- (vd sách 1: 150 - 2 = 148 nhưng books.stock = 120). Sửa lại chuỗi chứng từ
-- để kết thúc đúng bằng values trong books: 1->120, 2->95, 4->65, 7->50, 8->42.
INSERT INTO inventory_transactions
(book_id, user_id, type, quantity, stock_before, stock_after, reference_type, reference_id, note)
VALUES
(1, 2, 'import', 122, 0, 122, 'import_receipt', 1, 'Nhập lô sách đầu kỳ'),
(1, 2, 'sale', -2, 122, 120, 'order', 1, 'Xuất kho theo đơn KD202600001'),
(2, 2, 'import', 96, 0, 96, 'import_receipt', 2, 'Nhập lô sách đầu kỳ'),
(2, 2, 'sale', -1, 96, 95, 'order', 2, 'Xuất kho theo đơn KD202600002'),
(4, 2, 'import', 66, 0, 66, 'import_receipt', 3, 'Nhập lô sách đầu kỳ'),
(4, 2, 'sale', -1, 66, 65, 'order', 2, 'Xuất kho theo đơn KD202600002'),
(7, 2, 'import', 51, 0, 51, 'import_receipt', 4, 'Nhập lô sách đầu kỳ'),
(7, 2, 'sale', -1, 51, 50, 'order', 1, 'Xuất kho theo đơn KD202600001'),
(8, 2, 'import', 44, 0, 44, 'import_receipt', 5, 'Nhập lô sách đầu kỳ'),
(8, 2, 'sale', -2, 44, 42, 'order', 3, 'Xuất kho theo đơn KD202600003');

-- ============================================================
-- Useful views for admin dashboard
-- ============================================================

CREATE OR REPLACE VIEW v_book_summary AS
SELECT
    b.id,
    b.title,
    c.name AS category_name,
    a.name AS author_name,
    p.name AS publisher_name,
    b.price,
    b.sale_price,
    b.stock,
    b.sold_count,
    b.status
FROM books b
JOIN categories c ON c.id = b.category_id
JOIN authors a ON a.id = b.author_id
JOIN publishers p ON p.id = b.publisher_id
WHERE b.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_order_summary AS
SELECT
    o.id,
    o.order_code,
    u.full_name AS customer_name,
    o.total_amount,
    o.payment_method,
    o.payment_status,
    o.status,
    o.created_at
FROM orders o
JOIN users u ON u.id = o.user_id;

-- Bổ sung: doanh thu theo danh mục (đơn đã thanh toán) cho dashboard
CREATE OR REPLACE VIEW v_category_revenue AS
SELECT
    c.id AS category_id,
    c.name AS category_name,
    COALESCE(SUM(oi.subtotal), 0) AS revenue,
    COALESCE(SUM(oi.quantity), 0) AS books_sold,
    COUNT(DISTINCT oi.order_id) AS orders_count
FROM categories c
LEFT JOIN books b ON b.category_id = c.id
LEFT JOIN order_items oi ON oi.book_id = b.id
LEFT JOIN orders o ON o.id = oi.order_id AND o.payment_status = 'paid'
GROUP BY c.id, c.name;

-- ============================================================
-- CHECK DATA
-- ============================================================

SELECT 'users' AS table_name, COUNT(*) AS total FROM users
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'authors', COUNT(*) FROM authors
UNION ALL SELECT 'publishers', COUNT(*) FROM publishers
UNION ALL SELECT 'books', COUNT(*) FROM books
UNION ALL SELECT 'addresses', COUNT(*) FROM addresses
UNION ALL SELECT 'carts', COUNT(*) FROM carts
UNION ALL SELECT 'cart_items', COUNT(*) FROM cart_items
UNION ALL SELECT 'wishlists', COUNT(*) FROM wishlists
UNION ALL SELECT 'promotions', COUNT(*) FROM promotions
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL SELECT 'inventory_transactions', COUNT(*) FROM inventory_transactions;
