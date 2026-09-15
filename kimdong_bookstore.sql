-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 15, 2026 at 09:54 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `kimdong_bookstore`
--

-- --------------------------------------------------------

--
-- Table structure for table `authors`
--

CREATE TABLE `authors` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `bio` text DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `authors`
--

INSERT INTO `authors` (`id`, `name`, `slug`, `bio`, `avatar`, `created_at`) VALUES
(1, 'Fujiko F Fujio', 'fujiko-f-fujio', 'Họa sĩ truyện tranh huyền thoại Nhật Bản, tác giả của Doraemon.', NULL, '2026-09-15 03:36:45'),
(2, 'Gosho Aoyama', 'gosho-aoyama', 'Tác giả của bộ truyện tranh trinh thám nổi tiếng Thám tử lừng danh Conan.', NULL, '2026-09-15 03:36:45'),
(3, 'Eiichiro Oda', 'eiichiro-oda', 'Tác giả kiêm họa sĩ của manga bán chạy nhất lịch sử One Piece.', NULL, '2026-09-15 03:36:45'),
(4, 'Akira Toriyama', 'akira-toriyama', 'Tác giả vĩ đại của Dragon Ball và Dr. Slump.', NULL, '2026-09-15 03:36:45'),
(5, 'Nguyễn Nhật Ánh', 'nguyen-nhat-anh', 'Nhà văn hàng đầu Việt Nam chuyên viết cho thiếu nhi và tuổi mới lớn.', NULL, '2026-09-15 03:36:45'),
(6, 'Tô Hoài', 'to-hoai', 'Tác giả của tác phẩm kinh điển Dế Mèn Phiêu Lưu Ký.', NULL, '2026-09-15 03:36:45'),
(7, 'Dale Carnegie', 'dale-carnegie', 'Tác giả cuốn sách phát triển bản thân nổi tiếng Đắc Nhân Tâm.', NULL, '2026-09-15 03:36:45');

-- --------------------------------------------------------

--
-- Table structure for table `banners`
--

CREATE TABLE `banners` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `subtitle` varchar(500) DEFAULT '',
  `badge` varchar(100) DEFAULT 'NXB Kim Đồng Nổi Bật',
  `cta_text` varchar(50) DEFAULT 'Xem ngay',
  `cta_link` varchar(255) NOT NULL,
  `theme` varchar(20) DEFAULT 'red',
  `image_url` varchar(500) DEFAULT '',
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `banners`
--

INSERT INTO `banners` (`id`, `title`, `subtitle`, `badge`, `cta_text`, `cta_link`, `theme`, `image_url`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DORAEMON - TẬP KỶ NIỆM 2024', 'Hành trình bảo bối kỳ diệu cùng mèo máy và nhóm bạn Nobita', 'NXB Kim Đồng Nổi Bật', 'Khám phá ngay', '/books?category_id=6', 'red', 'https://cdn.hstatic.net/files/200001055148/collection/banner_1920x600__11__3d39ded048d541bd954cee7fcdee1940.png', 1, 1, '2026-09-15 04:02:41', '2026-09-15 14:17:04'),
(2, 'THÁM TỬ LỪNG DANH CONAN - TẬP 100', 'Đỉnh cao trinh thám thế giới - Cột mốc 100 tập vang dội', 'NXB Kim Đồng Nổi Bật', 'Mua ngay hôm nay', '/books?category_id=7', 'dark', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwESkZBC863VrC5E4YImODpIxCSbT-lRZV380PrfoU8ENoPSJCWqUpC58&s=10', 2, 1, '2026-09-15 04:02:41', '2026-09-15 14:16:14'),
(3, 'TUẦN LỄ SÁCH NXB KIM ĐỒNG', 'Ưu đãi lên đến 30% cho toàn bộ tủ sách Thiếu nhi & Manga', 'NXB Kim Đồng Nổi Bật', 'Xem khuyến mãi', '/books?on_sale=true', 'amber', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=1000', 3, 1, '2026-09-15 04:02:41', '2026-09-15 04:02:41');

-- --------------------------------------------------------

--
-- Table structure for table `books`
--

CREATE TABLE `books` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `author_id` int(11) NOT NULL,
  `publisher_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `import_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `price` decimal(12,2) NOT NULL,
  `sale_price` decimal(12,2) DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `sold_quantity` int(11) NOT NULL DEFAULT 0,
  `publication_year` int(11) DEFAULT 2024,
  `num_pages` int(11) DEFAULT 100,
  `cover_type` varchar(50) DEFAULT 'Bìa mềm',
  `dimensions` varchar(50) DEFAULT '13 x 19 cm',
  `weight` int(11) DEFAULT 200,
  `description` text DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT 0,
  `is_new` tinyint(1) DEFAULT 1,
  `is_bestseller` tinyint(1) DEFAULT 0,
  `status` varchar(20) DEFAULT 'ACTIVE',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `books`
--

INSERT INTO `books` (`id`, `category_id`, `author_id`, `publisher_id`, `title`, `slug`, `import_price`, `price`, `sale_price`, `stock`, `sold_quantity`, `publication_year`, `num_pages`, `cover_type`, `dimensions`, `weight`, `description`, `is_featured`, `is_new`, `is_bestseller`, `status`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 6, 1, 1, 'Doraemon - Tập 1 (Tái Bản 2024)', 'doraemon-tap-1', 12000.00, 25000.00, NULL, 150, 890, 2024, 192, 'Bìa mềm', '11.3 x 17.6 cm', 180, 'Chú mèo máy Doraemon đến từ thế kỷ 22 đáp xuống phòng của chú bé Nobita hậu đậu để giúp đỡ chú đổi thay số phận. Tập 1 mở đầu hành trình với những bảo bối kỳ diệu như Chong chóng tre, Cánh cửa thần kỳ...', 0, 0, 0, 'ACTIVE', NULL, '2026-09-15 03:36:45', '2026-09-15 19:47:30'),
(2, 6, 1, 1, 'Doraemon - Tập 2 (Phiên Bản Tiêu Chuẩn)', 'doraemon-tap-2', 12000.00, 25000.00, 20000.00, 118, 652, 2024, 192, 'Bìa mềm', '11.3 x 17.6 cm', 180, 'Tiếp tục cuộc hành trình hài hước cùng Doraemon và nhóm bạn Nobita, Shizuka, Suneo, Jaian với muôn vàn bảo bối độc đáo.', 0, 0, 0, 'ACTIVE', NULL, '2026-09-15 03:36:45', '2026-09-15 19:00:42'),
(3, 6, 1, 1, 'Doraemon Bóng Chày - Tập 1', 'doraemon-bong-chay-tap-1', 15000.00, 30000.00, 25000.00, 80, 426, 2024, 200, 'Bìa mềm', '11.3 x 17.6 cm', 190, 'Sê-ri bóng chày kỳ thú của các chú mèo máy trong đội bóng Doras!', 0, 0, 0, 'ACTIVE', NULL, '2026-09-15 03:36:45', '2026-09-15 19:34:16'),
(4, 7, 2, 1, 'Thám Tử Lừng Danh Conan - Tập 100', 'conan-tap-100', 15000.00, 30000.00, 24000.00, 200, 1540, 2024, 192, 'Bìa mềm', '11.3 x 17.6 cm', 185, 'Tập 100 cột mốc lịch sử! Cụm vụ án gay cấn liên quan đến Tổ chức Áo đen cùng cuộc đấu trí giữa Conan và Akai Shuichi.', 0, 0, 0, 'ACTIVE', NULL, '2026-09-15 03:36:45', '2026-09-15 14:21:32'),
(5, 7, 2, 1, 'Thám Tử Lừng Danh Conan - Tập 101', 'conan-tap-101', 15000.00, 30000.00, 25000.00, 138, 784, 2024, 192, 'Bìa mềm', '11.3 x 17.6 cm', 185, 'Những manh mối mới hé lộ bí mật về trùm tổ chức Áo Đen và gia đình Akai.', 0, 0, 0, 'ACTIVE', NULL, '2026-09-15 03:36:45', '2026-09-15 19:11:42'),
(6, 8, 3, 1, 'One Piece - Tập 105: Ước Mơ Của Luffy', 'one-piece-tap-105', 18000.00, 35000.00, 28000.00, 300, 2104, 2024, 208, 'Bìa mềm', '11.3 x 17.6 cm', 200, 'Trận chiến Wano Quốc khép lại! Tân Tứ Hoàng xuất hiện và mở ra kỷ nguyên mới hướng tới kho báu One Piece.', 0, 0, 0, 'ACTIVE', NULL, '2026-09-15 03:36:45', '2026-09-15 19:47:30'),
(7, 8, 3, 1, 'One Piece - Tập 106', 'one-piece-tap-106', 18000.00, 35000.00, 29000.00, 180, 954, 2024, 208, 'Bìa mềm', '11.3 x 17.6 cm', 200, 'Băng Mũ Rơm đặt chân lên đảo tương lai Egghead và gặp gỡ thiên tài Dr. Vegapunk.', 0, 0, 0, 'ACTIVE', NULL, '2026-09-15 03:36:45', '2026-09-15 19:22:53'),
(8, 9, 4, 1, 'Dragon Ball 7 Viên Ngọc Rồng - Tập 1', 'dragon-ball-tap-1', 15000.00, 30000.00, 24000.00, 90, 562, 2024, 192, 'Bìa mềm', '11.3 x 17.6 cm', 180, 'Cuộc gặp gỡ huyền thoại giữa cậu bé đuôi khỉ Son Goku và cô gái Bulma bắt đầu hành trình tìm kiếm 7 viên ngọc rồng.', 0, 0, 0, 'ACTIVE', NULL, '2026-09-15 03:36:45', '2026-09-15 19:22:15'),
(9, 12, 5, 1, 'Cho Tôi Xin Một Vé Đi Tuổi Thơ', 'cho-toi-xin-mot-ve-di-tuoi-tho', 45000.00, 85000.00, 68000.00, 110, 1350, 2024, 212, 'Bìa mềm', '13 x 20 cm', 260, 'Tác phẩm đưa người đọc trở lại những ký ức tuổi thơ trong trẻo, hồn nhiên qua góc nhìn của chú bé Cu Mùi và bạn bè.', 1, 0, 1, 'INACTIVE', '2026-09-15 14:14:24', '2026-09-15 03:36:45', '2026-09-15 14:14:24'),
(10, 12, 6, 1, 'Dế Mèn Phiêu Lưu Ký (Màu Bìa Cứng Special)', 'de-men-phieu-luu-ky-dac-biet', 80000.00, 160000.00, 128000.00, 60, 430, 2024, 160, 'Bìa cứng', '18 x 25 cm', 450, 'Ấn bản đặc biệt mừng kỷ niệm với minh họa màu đẹp rực rỡ. Cuộc phiêu lưu bất hủ của chú Dế Mèn tự do và giàu lòng nhân ái.', 0, 0, 0, 'ACTIVE', NULL, '2026-09-15 03:36:45', '2026-09-15 14:14:12'),
(11, 4, 7, 2, 'Đắc Nhân Tâm (How to Win Friends and Influence People)', 'dac-nhan-tam', 50000.00, 110000.00, 88000.00, 250, 3400, 2024, 320, 'Bìa mềm', '14.5 x 20.5 cm', 350, 'Cuốn sách bán chạy nhất mọi thời đại về nghệ thuật ứng xử, thu phục lòng người và gieo mầm thành công trong cuộc sống.', 1, 0, 1, 'INACTIVE', '2026-09-15 14:19:11', '2026-09-15 03:36:45', '2026-09-15 14:19:11'),
(12, 12, 5, 1, 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh', 'toi-thay-hoa-vang-tren-co-xanh', 50000.00, 95000.00, 76000.00, 140, 1120, 2024, 300, 'Bìa mềm', '13 x 20 cm', 320, 'Câu chuyện về tình anh em, tình làng nghĩa xóm cùng những rung động đầu đời bình dị miền quê nghèo Việt Nam.', 0, 0, 0, 'ACTIVE', NULL, '2026-09-15 03:36:45', '2026-09-15 17:26:27'),
(17, 6, 1, 1, 'Sach Test Da Nhap Them', 'sach-test-sap-het-7659-7660', 0.00, 50000.00, NULL, 999, 0, 2024, 100, 'Bìa mềm', '13 x 19 cm', 200, 'x', 0, 0, 0, 'ACTIVE', '2026-09-15 17:58:07', '2026-09-15 17:58:07', '2026-09-15 17:58:07'),
(18, 6, 1, 1, 'Sach Test Con Nhieu 7669', 'sach-test-con-nhieu-7669-7670', 0.00, 50000.00, NULL, 500, 0, 2024, 100, 'Bìa mềm', '13 x 19 cm', 200, 'Sach test canh bao ton kho', 0, 1, 0, 'ACTIVE', '2026-09-15 17:58:07', '2026-09-15 17:58:07', '2026-09-15 17:58:07'),
(19, 6, 1, 1, 'Doraemon Bóng chày - Truyền kì về bóng chày siêu cấp - Tập 2', 'doraemon-bong-chay-truyen-ki-ve-bong-chay-sieu-cap-tap-2-5421', 12000.00, 25000.00, NULL, 10, 0, 2024, 192, 'Bìa mềm', '11.3 x 17.6 cm', 180, 'Doraemon Bóng Chày là bộ truyện tranh về bóng chày do Mugiwara Shintaro sáng tác dựa trên hình ảnh chú mèo máy Doraemon trong bộ truyện tranh cùng tên của tác giả Fujiko.F.Fujio.\n\nDù Doraemon có xuất hiện trong một vài chương đầu, nhưng câu chuyện lại không xoay quanh cậu và những người bạn ở thế kỷ 20, mà lại xoay quanh một đội bóng chày gồm các chú mèo máy ở thế kỷ 22 (vì Doraemon phải trở về quá khứ để giúp Nobita). Trưởng đội bóng là Kuroemon, một mèo máy khá giống Doraemon trừ đôi tai và bộ lông đen. Trận bóng cho phép sử dụng 3 bảo bối được quy định từ trước đó.\n\nEdogawa Doras là đội bóng chính của truyện. Ban đầu đội Doras chơi rất kém, nhưng nhờ Hiroshi gia nhập thì đội bóng mới có trận thắng đầu tiên. Sau đó đội bóng phải luyện tập ở đảo hoang. Sau khi luyện tập, đội Doras đã có rất nhiều thành tích đáng kể và trở thành một trong những đội bóng nghiệp dư mạnh nhất Nhật Bản.\n\nDoraemon Bóng Chày - Truyền Kì Về Bóng Chày Siêu Cấp (Tập 1) kể về Kuroemon, mặc dù sinh ra ở thế kỷ 22 nhưng rất mê bộ môn bóng chày. Cậu đang đầu quân cho đội bóng Doras nổi tiếng là... chơi dở ẹc. Nhưng chính tình bạn và lòng dũng cảm, ý chí tiến thủ của các thành viên trong đội bóng đã giúp Doras mạnh dần lên.', 0, 1, 0, 'ACTIVE', NULL, '2026-09-15 19:52:55', '2026-09-15 19:52:55');

-- --------------------------------------------------------

--
-- Table structure for table `book_images`
--

CREATE TABLE `book_images` (
  `id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_primary` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `book_images`
--

INSERT INTO `book_images` (`id`, `book_id`, `image_url`, `display_order`, `is_primary`) VALUES
(9, 9, 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800', 1, 1),
(11, 11, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800', 1, 1),
(13, 12, 'https://www.nxbtre.com.vn/Images/Book/NXBTreStoryFull_02482010_104821.jpg', 1, 1),
(22, 9, 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800', 1, 1),
(24, 11, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800', 1, 1),
(25, 12, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800', 1, 1),
(26, 10, 'https://bizweb.dktcdn.net/thumb/large/100/576/749/products/6241412630003-de6248c7042d465895c63ee497a9d49d-76045f38-5d0d-40ab-b79a-c312a05e544e.jpg?v=1782789771723', 1, 1),
(28, 3, 'https://bizweb.dktcdn.net/thumb/large/100/576/749/products/1-6fbb63c5009843cfb266c9bb8fb52c0f.jpg?v=1764343926137', 1, 1),
(29, 8, 'https://bizweb.dktcdn.net/thumb/1024x1024/100/576/749/products/dragon-ball-tap-1-047b116d3f0e4637a6f97bef34bb03f0-a4057a3a-b29a-4f1c-9104-e23f06c153ba.jpg?v=1765030398717', 1, 1),
(30, 7, 'https://bizweb.dktcdn.net/thumb/1024x1024/100/576/749/products/one-piece-106-bia-roi-471637a0a62a42d8a370f58880d895cb-c5677d04-d2c3-4d73-826a-c8e7a6637a26.jpg?v=1779161638287', 1, 1),
(31, 6, 'https://bizweb.dktcdn.net/thumb/1024x1024/100/576/749/products/one-piece-bia-tap-105-9e05a4fdbdab44468b605ba721901039.jpg?v=1779161638287', 1, 1),
(32, 4, 'https://bizweb.dktcdn.net/thumb/1024x1024/100/576/749/products/100-340b2f477cb24d45b7cf458bde2ca3de.png?v=1767758551420', 1, 1),
(33, 5, 'https://bizweb.dktcdn.net/thumb/1024x1024/100/576/749/products/101.png?v=1772440909487', 1, 1),
(34, 2, 'https://product.hstatic.net/1000376556/product/ya5z8gfn_ceaf727aa41e48cc8e6f456a0d733aa1_1024x1024.png', 1, 1),
(36, 1, 'https://product.hstatic.net/1000376556/product/xhljijuw_9de22abba6a2407d87e202d773acda07_1024x1024.png', 1, 1),
(37, 19, 'https://bizweb.dktcdn.net/thumb/1024x1024/100/576/749/products/2-3d8d71cd4eed4663be7dbb774251444d.jpg?v=1764343926137', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `carts`
--

CREATE TABLE `carts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `session_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `carts`
--

INSERT INTO `carts` (`id`, `user_id`, `session_id`, `created_at`, `updated_at`) VALUES
(1, 3, 'sess_3zrfzrlkio5mu210fvh', '2026-09-15 03:41:57', '2026-09-15 03:41:57'),
(5, 1, 'sess_3zrfzrlkio5mu210fvh', '2026-09-15 18:42:17', '2026-09-15 18:42:17');

-- --------------------------------------------------------

--
-- Table structure for table `cart_items`
--

CREATE TABLE `cart_items` (
  `id` int(11) NOT NULL,
  `cart_id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`, `description`, `image`, `display_order`, `created_at`) VALUES
(1, NULL, 'Manga - Comic', 'manga-comic', 'Truyện tranh Nhật Bản và quốc tế', NULL, 1, '2026-09-15 03:36:45'),
(2, NULL, 'Sách Thiếu Nhi', 'sach-thieu-nhi', 'Truyện tranh, truyện chữ và sách minh họa cho thiếu nhi', NULL, 2, '2026-09-15 03:36:45'),
(3, NULL, 'Văn Học', 'van-hoc', 'Tiểu thuyết, truyện ngắn văn học Việt Nam và thế giới', NULL, 3, '2026-09-15 03:36:45'),
(4, NULL, 'Sách Kỹ Năng - Lifestyle', 'sach-ky-nang', 'Sách phát triển bản thân, kỹ năng sống và tư duy', NULL, 4, '2026-09-15 03:36:45'),
(5, NULL, 'Khoa Học - Tri Thức', 'khoa-hoc-tri-thuc', 'Bách khoa toàn thư và tri thức bách khoa', NULL, 5, '2026-09-15 03:36:45'),
(6, 1, 'Doraemon', 'doraemon', 'Chú mèo máy đến từ tương lai', NULL, 1, '2026-09-15 03:36:45'),
(7, 1, 'Thám Tử Lừng Danh Conan', 'conan', 'Sê-ri trinh thám huyền thoại', NULL, 2, '2026-09-15 03:36:45'),
(8, 1, 'One Piece', 'one-piece', 'Hành trình trở thành Vua Hải Tặc', NULL, 3, '2026-09-15 03:36:45'),
(9, 1, 'Dragon Ball', 'dragon-ball', 'Bảy viên ngọc rồng', NULL, 4, '2026-09-15 03:36:45'),
(10, 2, 'Truyện Tranh Thiếu Nhi', 'truyen-tranh-thieu-nhi', 'Truyện màu sinh động', NULL, 1, '2026-09-15 03:36:45'),
(11, 2, 'Sách Giáo Dục & Kỹ Năng Trẻ', 'sach-giao-duc-tre', 'Phát triển trí thông minh EQ, IQ', NULL, 2, '2026-09-15 03:36:45'),
(12, 3, 'Văn Học Việt Nam', 'van-hoc-viet-nam', 'Tác phẩm văn học kinh điển Việt Nam', NULL, 1, '2026-09-15 03:36:45'),
(13, 3, 'Văn Học Nước Ngoài', 'van-hoc-nuoc-ngoai', 'Sách dịch bán chạy thế giới', NULL, 2, '2026-09-15 03:36:45');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `order_code` varchar(50) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `customer_name` varchar(100) NOT NULL,
  `customer_email` varchar(120) NOT NULL,
  `customer_phone` varchar(20) NOT NULL,
  `shipping_address` varchar(255) NOT NULL,
  `shipping_province` varchar(100) NOT NULL,
  `shipping_district` varchar(100) NOT NULL,
  `shipping_ward` varchar(100) NOT NULL,
  `notes` text DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `discount_amount` decimal(12,2) DEFAULT 0.00,
  `shipping_fee` decimal(12,2) DEFAULT 20000.00,
  `total_amount` decimal(12,2) NOT NULL,
  `payment_method` enum('COD','BANKING','MOMO') NOT NULL DEFAULT 'COD',
  `payment_status` enum('UNPAID','PAID','REFUNDED') NOT NULL DEFAULT 'UNPAID',
  `order_status` enum('PENDING','CONFIRMED','PROCESSING','SHIPPING','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `cancel_reason` varchar(500) DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `order_code`, `user_id`, `customer_name`, `customer_email`, `customer_phone`, `shipping_address`, `shipping_province`, `shipping_district`, `shipping_ward`, `notes`, `subtotal`, `discount_amount`, `shipping_fee`, `total_amount`, `payment_method`, `payment_status`, `order_status`, `cancel_reason`, `cancelled_at`, `created_at`, `updated_at`) VALUES
(1, 'DH202609001', 3, 'Nguyễn Văn An', 'khachhang@gmail.com', '0987654321', '123 Nguyễn Trãi', 'TP. Hồ Chí Minh', 'Quận 1', 'Bến Thành', NULL, 120000.00, 20000.00, 20000.00, 120000.00, 'COD', 'UNPAID', 'DELIVERED', NULL, NULL, '2026-09-10 03:15:00', '2026-09-15 03:36:45'),
(2, 'DH202609002', 3, 'Nguyễn Văn An', 'khachhang@gmail.com', '0987654321', '123 Nguyễn Trãi', 'TP. Hồ Chí Minh', 'Quận 1', 'Bến Thành', NULL, 148000.00, 0.00, 20000.00, 168000.00, 'BANKING', 'PAID', 'SHIPPING', NULL, NULL, '2026-09-14 07:30:00', '2026-09-15 18:46:35');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `book_title` varchar(255) NOT NULL,
  `book_image` varchar(500) DEFAULT NULL,
  `price` decimal(12,2) NOT NULL,
  `quantity` int(11) NOT NULL,
  `total_price` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `book_id`, `book_title`, `book_image`, `price`, `quantity`, `total_price`) VALUES
(1, 1, 1, 'Doraemon - Tập 1 (Tái Bản 2024)', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800', 20000.00, 2, 40000.00),
(2, 1, 4, 'Thám Tử Lừng Danh Conan - Tập 100', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800', 24000.00, 2, 48000.00),
(3, 2, 9, 'Cho Tôi Xin Một Vé Đi Tuổi Thơ', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800', 68000.00, 1, 68000.00),
(4, 2, 11, 'Đắc Nhân Tâm', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800', 80000.00, 1, 80000.00);

-- --------------------------------------------------------

--
-- Table structure for table `promotions`
--

CREATE TABLE `promotions` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `discount_type` enum('PERCENTAGE','FIXED_AMOUNT') NOT NULL DEFAULT 'PERCENTAGE',
  `discount_value` decimal(12,2) NOT NULL,
  `min_order_value` decimal(12,2) DEFAULT 0.00,
  `max_discount` decimal(12,2) DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `usage_limit` int(11) DEFAULT 1000,
  `times_used` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `promotions`
--

INSERT INTO `promotions` (`id`, `code`, `title`, `discount_type`, `discount_value`, `min_order_value`, `max_discount`, `start_date`, `end_date`, `usage_limit`, `times_used`, `is_active`, `created_at`) VALUES
(1, 'KIMDONG20', 'Giảm 20% cho đơn hàng từ 150k', 'PERCENTAGE', 20.00, 150000.00, 50000.00, NULL, NULL, 1000, 0, 1, '2026-09-15 03:36:45'),
(2, 'FREESHIP30', 'Miễn phí vận chuyển đơn từ 200k', 'FIXED_AMOUNT', 20000.00, 200000.00, 20000.00, NULL, NULL, 1000, 0, 1, '2026-09-15 03:36:45'),
(19, 'GIAM10', 'Giảm khai giảng', 'PERCENTAGE', 10.00, 0.00, 10000.00, '2026-09-16 00:00:00', '2026-09-30 23:59:59', 1000, 0, 1, '2026-09-15 17:36:25');

-- --------------------------------------------------------

--
-- Table structure for table `publishers`
--

CREATE TABLE `publishers` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `description` text DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `publishers`
--

INSERT INTO `publishers` (`id`, `name`, `slug`, `description`, `logo`, `address`, `phone`, `email`, `created_at`) VALUES
(1, 'Nhà Xuất Bản Kim Đồng', 'nxb-kim-dong', NULL, NULL, '55 Quang Trung, Hai Bà Trưng, Hà Nội', '1900571595', 'info@nxbkimdong.com.vn', '2026-09-15 03:36:45'),
(2, 'NXB Trẻ', 'nxb-tre', NULL, NULL, '161B Lý Chính Thắng, Phường 7, Quận 3, TP.HCM', '02839316289', 'nxbtre@nxbtre.com.vn', '2026-09-15 03:36:45'),
(3, 'NXB Văn Học', 'nxb-van-hoc', NULL, NULL, '18 Nguyễn Trường Tộ, Ba Đình, Hà Nội', '02437161518', 'nxbvanhoc@gmail.com', '2026-09-15 03:36:45');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` tinyint(4) NOT NULL CHECK (`rating` between 1 and 5),
  `comment` text DEFAULT NULL,
  `is_verified_purchase` tinyint(1) DEFAULT 1,
  `status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'APPROVED',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `book_id`, `user_id`, `rating`, `comment`, `is_verified_purchase`, `status`, `created_at`) VALUES
(1, 1, 3, 5, 'Cập nhật: sau khi đọc xong thấy còn hay hơn nữa!, ngon', 1, 'APPROVED', '2026-09-15 03:36:45'),
(2, 4, 3, 5, 'Tập 100 Conan đỉnh cao! Giao hàng siêu nhanh.', 1, 'APPROVED', '2026-09-15 03:36:45'),
(3, 9, 3, 5, 'Sách hay và giàu cảm xúc, giao hàng trong 2 ngày.', 1, 'APPROVED', '2026-09-15 03:36:45');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'ADMIN', 'Quản trị viên toàn quyền hệ thống'),
(2, 'EMPLOYEE', 'Nhân viên quản lý kho và đơn hàng'),
(3, 'CUSTOMER', 'Khách hàng mua sách');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL DEFAULT 3,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(120) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `ward` varchar(100) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `role_id`, `full_name`, `email`, `password`, `phone`, `address`, `province`, `district`, `ward`, `avatar`, `created_at`, `updated_at`) VALUES
(1, 1, 'Quản Trị Viên Kim Đồng', 'admin@kimdong.vn', '$2a$10$1mhjnRoT5iHM9j3UoCw96OJ6WthD8UrS0MykCasJUbCQmcmIj0Laq', '0901234567', '55 Quang Trung', 'Hà Nội', 'Hai Bà Trưng', 'Nguyễn Du', NULL, '2026-09-15 03:36:45', '2026-09-15 03:36:45'),
(2, 2, 'Nhân Viên Kho', 'nhanvien@kimdong.vn', '$2a$10$EoRXbUKSuWdi9uOXQBNsxe7x8CzkbqynhY7eTrbZmr6Yr5KxH1y6C', '0912345678', '55 Quang Trung', 'Hà Nội', 'Hai Bà Trưng', 'Nguyễn Du', NULL, '2026-09-15 03:36:45', '2026-09-15 03:36:45'),
(3, 3, 'Nguyễn Văn An', 'khachhang@gmail.com', '$2a$10$Nlf0ctG8dzduqjOMcsDc.Orxtu3sK9WhC1SQU5KG1wuLmmVG/3pIK', '0987654321', '123 Nguyễn Trãi', 'TP. Hồ Chí Minh', 'Quận 1', 'Bến Thành', NULL, '2026-09-15 03:36:45', '2026-09-15 18:35:47');

-- --------------------------------------------------------

--
-- Table structure for table `wishlists`
--

CREATE TABLE `wishlists` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `authors`
--
ALTER TABLE `authors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_authors_slug` (`slug`);

--
-- Indexes for table `banners`
--
ALTER TABLE `banners`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_banners_active` (`is_active`,`display_order`);

--
-- Indexes for table `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `publisher_id` (`publisher_id`),
  ADD KEY `idx_books_category` (`category_id`),
  ADD KEY `idx_books_author` (`author_id`),
  ADD KEY `idx_books_slug` (`slug`),
  ADD KEY `idx_books_status` (`status`);

--
-- Indexes for table `book_images`
--
ALTER TABLE `book_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `book_id` (`book_id`);

--
-- Indexes for table `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cart_id` (`cart_id`),
  ADD KEY `book_id` (`book_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_categories_slug` (`slug`),
  ADD KEY `idx_categories_parent` (`parent_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_code` (`order_code`),
  ADD KEY `idx_orders_status` (`order_status`),
  ADD KEY `idx_orders_user` (`user_id`),
  ADD KEY `idx_orders_code` (`order_code`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `book_id` (`book_id`);

--
-- Indexes for table `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `publishers`
--
ALTER TABLE `publishers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `book_id` (`book_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_role` (`role_id`);

--
-- Indexes for table `wishlists`
--
ALTER TABLE `wishlists`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_book_wishlist` (`user_id`,`book_id`),
  ADD KEY `book_id` (`book_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `authors`
--
ALTER TABLE `authors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `banners`
--
ALTER TABLE `banners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `books`
--
ALTER TABLE `books`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `book_images`
--
ALTER TABLE `book_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `carts`
--
ALTER TABLE `carts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `promotions`
--
ALTER TABLE `promotions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `publishers`
--
ALTER TABLE `publishers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `wishlists`
--
ALTER TABLE `wishlists`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `books`
--
ALTER TABLE `books`
  ADD CONSTRAINT `books_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  ADD CONSTRAINT `books_ibfk_2` FOREIGN KEY (`author_id`) REFERENCES `authors` (`id`),
  ADD CONSTRAINT `books_ibfk_3` FOREIGN KEY (`publisher_id`) REFERENCES `publishers` (`id`);

--
-- Constraints for table `book_images`
--
ALTER TABLE `book_images`
  ADD CONSTRAINT `book_images_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `carts`
--
ALTER TABLE `carts`
  ADD CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`);

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

--
-- Constraints for table `wishlists`
--
ALTER TABLE `wishlists`
  ADD CONSTRAINT `wishlists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wishlists_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
