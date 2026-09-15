-- Seed Data for NXB Kim Dong Inspired Book Store

USE `kimdong_bookstore`;

-- Roles
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'ADMIN', 'Quản trị viên toàn quyền hệ thống'),
(2, 'EMPLOYEE', 'Nhân viên quản lý kho và đơn hàng'),
(3, 'CUSTOMER', 'Khách hàng mua sách')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Passwords are real bcrypt hashes verified against this exact file:
-- admin@kimdong.vn / nhanvien@kimdong.vn -> admin123
-- khachhang@gmail.com -> user123
INSERT INTO `users` (`id`, `role_id`, `full_name`, `email`, `password`, `phone`, `address`, `province`, `district`, `ward`) VALUES
(1, 1, 'Quản Trị Viên Kim Đồng', 'admin@kimdong.vn', '$2a$10$1mhjnRoT5iHM9j3UoCw96OJ6WthD8UrS0MykCasJUbCQmcmIj0Laq', '0901234567', '55 Quang Trung', 'Hà Nội', 'Hai Bà Trưng', 'Nguyễn Du'),
(2, 2, 'Nhân Viên Kho', 'nhanvien@kimdong.vn', '$2a$10$EoRXbUKSuWdi9uOXQBNsxe7x8CzkbqynhY7eTrbZmr6Yr5KxH1y6C', '0912345678', '55 Quang Trung', 'Hà Nội', 'Hai Bà Trưng', 'Nguyễn Du'),
(3, 3, 'Nguyễn Văn An', 'khachhang@gmail.com', '$2a$10$MOCHlOZfr3TgqWc0Sq/xN.PbZlXaO758s5vbDlaldh4Vs.OYbtFkC', '0987654321', '123 Nguyễn Trãi', 'TP. Hồ Chí Minh', 'Quận 1', 'Bến Thành')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- Categories
INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`, `description`, `display_order`) VALUES
(1, NULL, 'Manga - Comic', 'manga-comic', 'Truyện tranh Nhật Bản và quốc tế', 1),
(2, NULL, 'Sách Thiếu Nhi', 'sach-thieu-nhi', 'Truyện tranh, truyện chữ và sách minh họa cho thiếu nhi', 2),
(3, NULL, 'Văn Học', 'van-hoc', 'Tiểu thuyết, truyện ngắn văn học Việt Nam và thế giới', 3),
(4, NULL, 'Sách Kỹ Năng - Lifestyle', 'sach-ky-nang', 'Sách phát triển bản thân, kỹ năng sống và tư duy', 4),
(5, NULL, 'Khoa Học - Tri Thức', 'khoa-hoc-tri-thuc', 'Bách khoa toàn thư và tri thức bách khoa', 5),

(6, 1, 'Doraemon', 'doraemon', 'Chú mèo máy đến từ tương lai', 1),
(7, 1, 'Thám Tử Lừng Danh Conan', 'conan', 'Sê-ri trinh thám huyền thoại', 2),
(8, 1, 'One Piece', 'one-piece', 'Hành trình trở thành Vua Hải Tặc', 3),
(9, 1, 'Dragon Ball', 'dragon-ball', 'Bảy viên ngọc rồng', 4),
(10, 2, 'Truyện Tranh Thiếu Nhi', 'truyen-tranh-thieu-nhi', 'Truyện màu sinh động', 1),
(11, 2, 'Sách Giáo Dục & Kỹ Năng Trẻ', 'sach-giao-duc-tre', 'Phát triển trí thông minh EQ, IQ', 2),
(12, 3, 'Văn Học Việt Nam', 'van-hoc-viet-nam', 'Tác phẩm văn học kinh điển Việt Nam', 1),
(13, 3, 'Văn Học Nước Ngoài', 'van-hoc-nuoc-ngoai', 'Sách dịch bán chạy thế giới', 2)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Authors
INSERT INTO `authors` (`id`, `name`, `slug`, `bio`) VALUES
(1, 'Fujiko F Fujio', 'fujiko-f-fujio', 'Họa sĩ truyện tranh huyền thoại Nhật Bản, tác giả của Doraemon.'),
(2, 'Gosho Aoyama', 'gosho-aoyama', 'Tác giả của bộ truyện tranh trinh thám nổi tiếng Thám tử lừng danh Conan.'),
(3, 'Eiichiro Oda', 'eiichiro-oda', 'Tác giả kiêm họa sĩ của manga bán chạy nhất lịch sử One Piece.'),
(4, 'Akira Toriyama', 'akira-toriyama', 'Tác giả vĩ đại của Dragon Ball và Dr. Slump.'),
(5, 'Nguyễn Nhật Ánh', 'nguyen-nhat-anh', 'Nhà văn hàng đầu Việt Nam chuyên viết cho thiếu nhi và tuổi mới lớn.'),
(6, 'Tô Hoài', 'to-hoai', 'Tác giả của tác phẩm kinh điển Dế Mèn Phiêu Lưu Ký.'),
(7, 'Dale Carnegie', 'dale-carnegie', 'Tác giả cuốn sách phát triển bản thân nổi tiếng Đắc Nhân Tâm.')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Publishers
INSERT INTO `publishers` (`id`, `name`, `slug`, `address`, `phone`, `email`) VALUES
(1, 'Nhà Xuất Bản Kim Đồng', 'nxb-kim-dong', '55 Quang Trung, Hai Bà Trưng, Hà Nội', '1900571595', 'info@nxbkimdong.com.vn'),
(2, 'NXB Trẻ', 'nxb-tre', '161B Lý Chính Thắng, Phường 7, Quận 3, TP.HCM', '02839316289', 'nxbtre@nxbtre.com.vn'),
(3, 'NXB Văn Học', 'nxb-van-hoc', '18 Nguyễn Trường Tộ, Ba Đình, Hà Nội', '02437161518', 'nxbvanhoc@gmail.com')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Books Dataset (Realistic Vietnamese Books with Covers)
INSERT INTO `books` (`id`, `category_id`, `author_id`, `publisher_id`, `title`, `slug`, `import_price`, `price`, `sale_price`, `stock`, `sold_quantity`, `publication_year`, `num_pages`, `cover_type`, `dimensions`, `weight`, `description`, `is_featured`, `is_new`, `is_bestseller`, `status`) VALUES
(1, 6, 1, 1, 'Doraemon - Tập 1 (Tái Bản 2024)', 'doraemon-tap-1', 12000, 25000, 20000, 150, 890, 2024, 192, 'Bìa mềm', '11.3 x 17.6 cm', 180, 'Chú mèo máy Doraemon đến từ thế kỷ 22 đáp xuống phòng của chú bé Nobita hậu đậu để giúp đỡ chú đổi thay số phận. Tập 1 mở đầu hành trình với những bảo bối kỳ diệu như Chong chóng tre, Cánh cửa thần kỳ...', 1, 1, 1, 'ACTIVE'),
(2, 6, 1, 1, 'Doraemon - Tập 2 (Phiên Bản Tiêu Chuẩn)', 'doraemon-tap-2', 12000, 25000, 20000, 120, 650, 2024, 192, 'Bìa mềm', '11.3 x 17.6 cm', 180, 'Tiếp tục cuộc hành trình hài hước cùng Doraemon và nhóm bạn Nobita, Shizuka, Suneo, Jaian với muôn vàn bảo bối độc đáo.', 1, 0, 1, 'ACTIVE'),
(3, 6, 1, 1, 'Doraemon Bóng Chày - Tập 1', 'doraemon-bong-chay-tap-1', 15000, 30000, 25000, 80, 420, 2024, 200, 'Bìa mềm', '11.3 x 17.6 cm', 190, 'Sê-ri bóng chày kỳ thú của các chú mèo máy trong đội bóng Doras!', 0, 1, 0, 'ACTIVE'),

(4, 7, 2, 1, 'Thám Tử Lừng Danh Conan - Tập 100', 'conan-tap-100', 15000, 30000, 24000, 200, 1540, 2024, 192, 'Bìa mềm', '11.3 x 17.6 cm', 185, 'Tập 100 cột mốc lịch sử! Cụm vụ án gay cấn liên quan đến Tổ chức Áo đen cùng cuộc đấu trí giữa Conan và Akai Shuichi.', 1, 1, 1, 'ACTIVE'),
(5, 7, 2, 1, 'Thám Tử Lừng Danh Conan - Tập 101', 'conan-tap-101', 15000, 30000, 25000, 140, 780, 2024, 192, 'Bìa mềm', '11.3 x 17.6 cm', 185, 'Những manh mối mới hé lộ bí mật về trùm tổ chức Áo Đen và gia đình Akai.', 0, 1, 1, 'ACTIVE'),

(6, 8, 3, 1, 'One Piece - Tập 105: Giấc Mơ Của Luffy', 'one-piece-tap-105', 18000, 35000, 28000, 300, 2100, 2024, 208, 'Bìa mềm', '11.3 x 17.6 cm', 200, 'Trận chiến Wano Quốc khép lại! Tân Tứ Hoàng xuất hiện và mở ra kỷ nguyên mới hướng tới kho báu One Piece.', 1, 1, 1, 'ACTIVE'),
(7, 8, 3, 1, 'One Piece - Tập 106', 'one-piece-tap-106', 18000, 35000, 29000, 180, 950, 2024, 208, 'Bìa mềm', '11.3 x 17.6 cm', 200, 'Băng Mũ Rơm đặt chân lên đảo tương lai Egghead và gặp gỡ thiên tài Dr. Vegapunk.', 0, 1, 1, 'ACTIVE'),

(8, 9, 4, 1, 'Dragon Ball 7 Viên Ngọc Rồng - Tập 1', 'dragon-ball-tap-1', 15000, 30000, 24000, 90, 560, 2024, 192, 'Bìa mềm', '11.3 x 17.6 cm', 180, 'Cuộc gặp gỡ huyền thoại giữa cậu bé đuôi khỉ Son Goku và cô gái Bulma bắt đầu hành trình tìm kiếm 7 viên ngọc rồng.', 1, 0, 1, 'ACTIVE'),

(9, 12, 5, 1, 'Cho Tôi Xin Một Vé Đi Tuổi Thơ', 'cho-toi-xin-mot-ve-di-tuoi-tho', 45000, 85000, 68000, 110, 1350, 2024, 212, 'Bìa mềm', '13 x 20 cm', 260, 'Tác phẩm đưa người đọc trở lại những ký ức tuổi thơ trong trẻo, hồn nhiên qua góc nhìn của chú bé Cu Mùi và bạn bè.', 1, 0, 1, 'ACTIVE'),
(10, 12, 6, 1, 'Dế Mèn Phiêu Lưu Ký (Màu Bìa Cứng Special)', 'de-men-phieu-luu-ky-dac-biet', 80000, 160000, 128000, 60, 430, 2024, 160, 'Bìa cứng', '18 x 25 cm', 450, 'Ấn bản đặc biệt mừng kỷ niệm với minh họa màu đẹp rực rỡ. Cuộc phiêu lưu bất hủ của chú Dế Mèn tự do và giàu lòng nhân ái.', 1, 1, 1, 'ACTIVE'),

(11, 4, 7, 2, 'Đắc Nhân Tâm (How to Win Friends and Influence People)', 'dac-nhan-tam', 50000, 110000, 88000, 250, 3400, 2024, 320, 'Bìa mềm', '14.5 x 20.5 cm', 350, 'Cuốn sách bán chạy nhất mọi thời đại về nghệ thuật ứng xử, thu phục lòng người và gieo mầm thành công trong cuộc sống.', 1, 0, 1, 'ACTIVE'),
(12, 12, 5, 1, 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh', 'toi-thay-hoa-vang-tren-co-xanh', 50000, 95000, 76000, 140, 1120, 2024, 300, 'Bìa mềm', '13 x 20 cm', 320, 'Câu chuyện về tình anh em, tình làng nghĩa xóm cùng những rung động đầu đời bình dị miền quê nghèo Việt Nam.', 1, 0, 1, 'ACTIVE')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- Book Images
INSERT INTO `book_images` (`book_id`, `image_url`, `display_order`, `is_primary`) VALUES
(1, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800', 1, 1),
(2, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800', 1, 1),
(3, 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800', 1, 1),
(4, 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800', 1, 1),
(5, 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800', 1, 1),
(6, 'https://images.unsplash.com/photo-1629992101753-56d196c8aced?auto=format&fit=crop&q=80&w=800', 1, 1),
(7, 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800', 1, 1),
(8, 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800', 1, 1),
(9, 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800', 1, 1),
(10, 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&q=80&w=800', 1, 1),
(11, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800', 1, 1),
(12, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800', 1, 1);

-- Promotions
INSERT INTO `promotions` (`id`, `code`, `title`, `discount_type`, `discount_value`, `min_order_value`, `max_discount`, `is_active`) VALUES
(1, 'KIMDONG20', 'Giảm 20% cho đơn hàng từ 150k', 'PERCENTAGE', 20.00, 150000.00, 50000.00, 1),
(2, 'FREESHIP30', 'Miễn phí vận chuyển đơn từ 200k', 'FIXED_AMOUNT', 20000.00, 200000.00, 20000.00, 1)
ON DUPLICATE KEY UPDATE `code` = VALUES(`code`);

-- Homepage Banners (carousel)
INSERT INTO `banners` (`id`, `title`, `subtitle`, `badge`, `cta_text`, `cta_link`, `theme`, `image_url`, `display_order`, `is_active`) VALUES
(1, 'DORAEMON - TẬP KỶ NIỆM 2024', 'Hành trình bảo bối kỳ diệu cùng mèo máy và nhóm bạn Nobita', 'NXB Kim Đồng Nổi Bật', 'Khám phá ngay', '/books?category_id=6', 'red', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000', 1, 1),
(2, 'THÁM TỬ LỪNG DANH CONAN - TẬP 100', 'Đỉnh cao trinh thám thế giới - Cột mốc 100 tập vang dội', 'NXB Kim Đồng Nổi Bật', 'Mua ngay hôm nay', '/books?category_id=7', 'dark', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=1000', 2, 1),
(3, 'TUẦN LỄ SÁCH NXB KIM ĐỒNG', 'Ưu đãi lên đến 30% cho toàn bộ tủ sách Thiếu nhi & Manga', 'NXB Kim Đồng Nổi Bật', 'Xem khuyến mãi', '/books?on_sale=true', 'amber', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=1000', 3, 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- Sample Orders
INSERT INTO `orders` (`id`, `order_code`, `user_id`, `customer_name`, `customer_email`, `customer_phone`, `shipping_address`, `shipping_province`, `shipping_district`, `shipping_ward`, `subtotal`, `discount_amount`, `shipping_fee`, `total_amount`, `payment_method`, `payment_status`, `order_status`, `created_at`) VALUES
(1, 'DH202609001', 3, 'Nguyễn Văn An', 'khachhang@gmail.com', '0987654321', '123 Nguyễn Trãi', 'TP. Hồ Chí Minh', 'Quận 1', 'Bến Thành', 120000.00, 20000.00, 20000.00, 120000.00, 'COD', 'UNPAID', 'DELIVERED', '2026-09-10 10:15:00'),
(2, 'DH202609002', 3, 'Nguyễn Văn An', 'khachhang@gmail.com', '0987654321', '123 Nguyễn Trãi', 'TP. Hồ Chí Minh', 'Quận 1', 'Bến Thành', 148000.00, 0.00, 20000.00, 168000.00, 'BANKING', 'PAID', 'SHIPPING', '2026-09-14 14:30:00')
ON DUPLICATE KEY UPDATE `order_code` = VALUES(`order_code`);

-- Order Items
INSERT INTO `order_items` (`id`, `order_id`, `book_id`, `book_title`, `book_image`, `price`, `quantity`, `total_price`) VALUES
(1, 1, 1, 'Doraemon - Tập 1 (Tái Bản 2024)', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800', 20000, 2, 40000),
(2, 1, 4, 'Thám Tử Lừng Danh Conan - Tập 100', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800', 24000, 2, 48000),
(3, 2, 9, 'Cho Tôi Xin Một Vé Đi Tuổi Thơ', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800', 68000, 1, 68000),
(4, 2, 11, 'Đắc Nhân Tâm', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800', 80000, 1, 80000)
ON DUPLICATE KEY UPDATE `book_id` = VALUES(`book_id`);

-- Reviews
INSERT INTO `reviews` (`id`, `book_id`, `user_id`, `rating`, `comment`, `is_verified_purchase`, `status`) VALUES
(1, 1, 3, 5, 'Truyện in rất nét, giấy thơm, đóng gói bọc kỹ càng!', 1, 'APPROVED'),
(2, 4, 3, 5, 'Tập 100 Conan đỉnh cao! Giao hàng siêu nhanh.', 1, 'APPROVED'),
(3, 9, 3, 5, 'Sách hay và giàu cảm xúc, giao hàng trong 2 ngày.', 1, 'APPROVED')
ON DUPLICATE KEY UPDATE `rating` = VALUES(`rating`);
