import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

let mysqlPool: mysql.Pool | null = null;
let useMySQL = false;

// Memory/JSON DB storage for zero-dependency local fallback
interface InMemoryDb {
  roles: any[];
  users: any[];
  categories: any[];
  authors: any[];
  publishers: any[];
  books: any[];
  book_images: any[];
  banners: any[];
  promotions: any[];
  carts: any[];
  cart_items: any[];
  orders: any[];
  order_items: any[];
  reviews: any[];
  wishlists: any[];
}

let memDb: InMemoryDb = {
  roles: [],
  users: [],
  categories: [],
  authors: [],
  publishers: [],
  books: [],
  book_images: [],
  banners: [],
  promotions: [],
  carts: [],
  cart_items: [],
  orders: [],
  order_items: [],
  reviews: [],
  wishlists: []
};

const jsonDbPath = path.join(process.cwd(), 'kimdong_data.json');

function loadJsonDb() {
  if (fs.existsSync(jsonDbPath)) {
    try {
      const data = fs.readFileSync(jsonDbPath, 'utf8');
      memDb = JSON.parse(data);
      return;
    } catch (e) {
      console.error('Failed to parse json db, seeding new dataset');
    }
  }
  seedMemDb();
  saveJsonDb();
}

function saveJsonDb() {
  try {
    fs.writeFileSync(jsonDbPath, JSON.stringify(memDb, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write JSON db');
  }
}

function seedMemDb() {
  const adminPass = bcrypt.hashSync('admin123', 10);
  const userPass = bcrypt.hashSync('user123', 10);

  memDb.roles = [
    { id: 1, name: 'ADMIN', description: 'Quản trị viên' },
    { id: 2, name: 'EMPLOYEE', description: 'Nhân viên' },
    { id: 3, name: 'CUSTOMER', description: 'Khách hàng' }
  ];

  memDb.users = [
    { id: 1, role_id: 1, full_name: 'Quản Trị Viên Kim Đồng', email: 'admin@kimdong.vn', password: adminPass, phone: '0901234567', address: '55 Quang Trung', province: 'Hà Nội', district: 'Hai Bà Trưng', ward: 'Nguyễn Du' },
    { id: 2, role_id: 2, full_name: 'Nhân Viên Kho', email: 'nhanvien@kimdong.vn', password: adminPass, phone: '0912345678', address: '55 Quang Trung', province: 'Hà Nội', district: 'Hai Bà Trưng', ward: 'Nguyễn Du' },
    { id: 3, role_id: 3, full_name: 'Nguyễn Văn An', email: 'khachhang@gmail.com', password: userPass, phone: '0987654321', address: '123 Nguyễn Trãi', province: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Bến Thành' }
  ];

  memDb.categories = [
    { id: 1, parent_id: null, name: 'Manga - Comic', slug: 'manga-comic', description: 'Truyện tranh Nhật Bản và quốc tế', display_order: 1 },
    { id: 2, parent_id: null, name: 'Sách Thiếu Nhi', slug: 'sach-thieu-nhi', description: 'Truyện tranh, truyện chữ và sách minh họa cho thiếu nhi', display_order: 2 },
    { id: 3, parent_id: null, name: 'Văn Học', slug: 'van-hoc', description: 'Tiểu thuyết, truyện ngắn văn học Việt Nam và thế giới', display_order: 3 },
    { id: 4, parent_id: null, name: 'Sách Kỹ Năng - Lifestyle', slug: 'sach-ky-nang', description: 'Sách phát triển bản thân, kỹ năng sống và tư duy', display_order: 4 },
    { id: 5, parent_id: null, name: 'Khoa Học - Tri Thức', slug: 'khoa-hoc-tri-thuc', description: 'Bách khoa toàn thư và tri thức bách khoa', display_order: 5 },
    { id: 6, parent_id: 1, name: 'Doraemon', slug: 'doraemon', description: 'Chú mèo máy đến từ tương lai', display_order: 1 },
    { id: 7, parent_id: 1, name: 'Thám Tử Lừng Danh Conan', slug: 'conan', description: 'Sê-ri trinh thám huyền thoại', display_order: 2 },
    { id: 8, parent_id: 1, name: 'One Piece', slug: 'one-piece', description: 'Hành trình trở thành Vua Hải Tặc', display_order: 3 },
    { id: 9, parent_id: 1, name: 'Dragon Ball', slug: 'dragon-ball', description: 'Bảy viên ngọc rồng', display_order: 4 },
    { id: 10, parent_id: 2, name: 'Truyện Tranh Thiếu Nhi', slug: 'truyen-tranh-thieu-nhi', description: 'Truyện màu sinh động', display_order: 1 },
    { id: 11, parent_id: 2, name: 'Sách Giáo Dục & Kỹ Năng Trẻ', slug: 'sach-giao-duc-tre', description: 'Phát triển trí thông minh EQ, IQ', display_order: 2 },
    { id: 12, parent_id: 3, name: 'Văn Học Việt Nam', slug: 'van-hoc-viet-nam', description: 'Tác phẩm văn học kinh điển Việt Nam', display_order: 1 },
    { id: 13, parent_id: 3, name: 'Văn Học Nước Ngoài', slug: 'van-hoc-nuoc-ngoai', description: 'Sách dịch bán chạy thế giới', display_order: 2 }
  ];

  memDb.authors = [
    { id: 1, name: 'Fujiko F Fujio', slug: 'fujiko-f-fujio', bio: 'Họa sĩ truyện tranh huyền thoại Nhật Bản, tác giả của Doraemon.' },
    { id: 2, name: 'Gosho Aoyama', slug: 'gosho-aoyama', bio: 'Tác giả của bộ truyện tranh trinh thám nổi tiếng Thám tử lừng danh Conan.' },
    { id: 3, name: 'Eiichiro Oda', slug: 'eiichiro-oda', bio: 'Tác giả kiêm họa sĩ của manga bán chạy nhất lịch sử One Piece.' },
    { id: 4, name: 'Akira Toriyama', slug: 'akira-toriyama', bio: 'Tác giả vĩ đại của Dragon Ball và Dr. Slump.' },
    { id: 5, name: 'Nguyễn Nhật Ánh', slug: 'nguyen-nhat-anh', bio: 'Nhà văn hàng đầu Việt Nam chuyên viết cho thiếu nhi và tuổi mới lớn.' },
    { id: 6, name: 'Tô Hoài', slug: 'to-hoai', bio: 'Tác giả của tác phẩm kinh điển Dế Mèn Phiêu Lưu Ký.' },
    { id: 7, name: 'Dale Carnegie', slug: 'dale-carnegie', bio: 'Tác giả cuốn sách phát triển bản thân nổi tiếng Đắc Nhân Tâm.' }
  ];

  memDb.publishers = [
    { id: 1, name: 'Nhà Xuất Bản Kim Đồng', slug: 'nxb-kim-dong', address: '55 Quang Trung, Hai Bà Trưng, Hà Nội', phone: '1900571595', email: 'info@nxbkimdong.com.vn' },
    { id: 2, name: 'NXB Trẻ', slug: 'nxb-tre', address: '161B Lý Chính Thắng, Phường 7, Quận 3, TP.HCM', phone: '02839316289', email: 'nxbtre@nxbtre.com.vn' },
    { id: 3, name: 'NXB Văn Học', slug: 'nxb-van-hoc', address: '18 Nguyễn Trường Tộ, Ba Đình, Hà Nội', phone: '02437161518', email: 'nxbvanhoc@gmail.com' }
  ];

  memDb.books = [
    { id: 1, category_id: 6, author_id: 1, publisher_id: 1, title: 'Doraemon - Tập 1 (Tái Bản 2024)', slug: 'doraemon-tap-1', import_price: 12000, price: 25000, sale_price: 20000, stock: 150, sold_quantity: 890, publication_year: 2024, num_pages: 192, cover_type: 'Bìa mềm', dimensions: '11.3 x 17.6 cm', weight: 180, description: 'Chú mèo máy Doraemon đến từ thế kỷ 22 đáp xuống phòng của chú bé Nobita hậu đậu để giúp đỡ chú đổi thay số phận. Tập 1 mở đầu hành trình với những bảo bối kỳ diệu như Chong chóng tre, Cánh cửa thần kỳ...', is_featured: 1, is_new: 1, is_bestseller: 1, status: 'ACTIVE', deleted_at: null },
    { id: 2, category_id: 6, author_id: 1, publisher_id: 1, title: 'Doraemon - Tập 2 (Phiên Bản Tiêu Chuẩn)', slug: 'doraemon-tap-2', import_price: 12000, price: 25000, sale_price: 20000, stock: 120, sold_quantity: 650, publication_year: 2024, num_pages: 192, cover_type: 'Bìa mềm', dimensions: '11.3 x 17.6 cm', weight: 180, description: 'Tiếp tục cuộc hành trình hài hước cùng Doraemon và nhóm bạn Nobita, Shizuka, Suneo, Jaian với muôn vàn bảo bối độc đáo.', is_featured: 1, is_new: 0, is_bestseller: 1, status: 'ACTIVE', deleted_at: null },
    { id: 3, category_id: 6, author_id: 1, publisher_id: 1, title: 'Doraemon Bóng Chày - Tập 1', slug: 'doraemon-bong-chay-tap-1', import_price: 15000, price: 30000, sale_price: 25000, stock: 80, sold_quantity: 420, publication_year: 2024, num_pages: 200, cover_type: 'Bìa mềm', dimensions: '11.3 x 17.6 cm', weight: 190, description: 'Sê-ri bóng chày kỳ thú của các chú mèo máy trong đội bóng Doras!', is_featured: 0, is_new: 1, is_bestseller: 0, status: 'ACTIVE', deleted_at: null },
    { id: 4, category_id: 7, author_id: 2, publisher_id: 1, title: 'Thám Tử Lừng Danh Conan - Tập 100', slug: 'conan-tap-100', import_price: 15000, price: 30000, sale_price: 24000, stock: 200, sold_quantity: 1540, publication_year: 2024, num_pages: 192, cover_type: 'Bìa mềm', dimensions: '11.3 x 17.6 cm', weight: 185, description: 'Tập 100 cột mốc lịch sử! Cụm vụ án gay cấn liên quan đến Tổ chức Áo đen cùng cuộc đấu trí giữa Conan và Akai Shuichi.', is_featured: 1, is_new: 1, is_bestseller: 1, status: 'ACTIVE', deleted_at: null },
    { id: 5, category_id: 7, author_id: 2, publisher_id: 1, title: 'Thám Tử Lừng Danh Conan - Tập 101', slug: 'conan-tap-101', import_price: 15000, price: 30000, sale_price: 25000, stock: 140, sold_quantity: 780, publication_year: 2024, num_pages: 192, cover_type: 'Bìa mềm', dimensions: '11.3 x 17.6 cm', weight: 185, description: 'Những manh mối mới hé lộ bí mật về trùm tổ chức Áo Đen và gia đình Akai.', is_featured: 0, is_new: 1, is_bestseller: 1, status: 'ACTIVE', deleted_at: null },
    { id: 6, category_id: 8, author_id: 3, publisher_id: 1, title: 'One Piece - Tập 105: Giấc Mơ Của Luffy', slug: 'one-piece-tap-105', import_price: 18000, price: 35000, sale_price: 28000, stock: 300, sold_quantity: 2100, publication_year: 2024, num_pages: 208, cover_type: 'Bìa mềm', dimensions: '11.3 x 17.6 cm', weight: 200, description: 'Trận chiến Wano Quốc khép lại! Tân Tứ Hoàng xuất hiện và mở ra kỷ nguyên mới hướng tới kho báu One Piece.', is_featured: 1, is_new: 1, is_bestseller: 1, status: 'ACTIVE', deleted_at: null },
    { id: 7, category_id: 8, author_id: 3, publisher_id: 1, title: 'One Piece - Tập 106', slug: 'one-piece-tap-106', import_price: 18000, price: 35000, sale_price: 29000, stock: 180, sold_quantity: 950, publication_year: 2024, num_pages: 208, cover_type: 'Bìa mềm', dimensions: '11.3 x 17.6 cm', weight: 200, description: 'Băng Mũ Rơm đặt chân lên đảo tương lai Egghead và gặp gỡ thiên tài Dr. Vegapunk.', is_featured: 0, is_new: 1, is_bestseller: 1, status: 'ACTIVE', deleted_at: null },
    { id: 8, category_id: 9, author_id: 4, publisher_id: 1, title: 'Dragon Ball 7 Viên Ngọc Rồng - Tập 1', slug: 'dragon-ball-tap-1', import_price: 15000, price: 30000, sale_price: 24000, stock: 90, sold_quantity: 560, publication_year: 2024, num_pages: 192, cover_type: 'Bìa mềm', dimensions: '11.3 x 17.6 cm', weight: 180, description: 'Cuộc gặp gỡ huyền thoại giữa cậu bé đuôi khỉ Son Goku và cô gái Bulma bắt đầu hành trình tìm kiếm 7 viên ngọc rồng.', is_featured: 1, is_new: 0, is_bestseller: 1, status: 'ACTIVE', deleted_at: null },
    { id: 9, category_id: 12, author_id: 5, publisher_id: 1, title: 'Cho Tôi Xin Một Vé Đi Tuổi Thơ', slug: 'cho-toi-xin-mot-ve-di-tuoi-tho', import_price: 45000, price: 85000, sale_price: 68000, stock: 110, sold_quantity: 1350, publication_year: 2024, num_pages: 212, cover_type: 'Bìa mềm', dimensions: '13 x 20 cm', weight: 260, description: 'Tác phẩm đưa người đọc trở lại những ký ức tuổi thơ trong trẻo, hồn nhiên qua góc nhìn của chú bé Cu Mùi và bạn bè.', is_featured: 1, is_new: 0, is_bestseller: 1, status: 'ACTIVE', deleted_at: null },
    { id: 10, category_id: 12, author_id: 6, publisher_id: 1, title: 'Dế Mèn Phiêu Lưu Ký (Màu Bìa Cứng Special)', slug: 'de-men-phieu-luu-ky-dac-biet', import_price: 80000, price: 160000, sale_price: 128000, stock: 60, sold_quantity: 430, publication_year: 2024, num_pages: 160, cover_type: 'Bìa cứng', dimensions: '18 x 25 cm', weight: 450, description: 'Ấn bản đặc biệt mừng kỷ niệm với minh họa màu đẹp rực rỡ. Cuộc phiêu lưu bất hủ của chú Dế Mèn tự do và giàu lòng nhân ái.', is_featured: 1, is_new: 1, is_bestseller: 1, status: 'ACTIVE', deleted_at: null },
    { id: 11, category_id: 4, author_id: 7, publisher_id: 2, title: 'Đắc Nhân Tâm (How to Win Friends and Influence People)', slug: 'dac-nhan-tam', import_price: 50000, price: 110000, sale_price: 88000, stock: 250, sold_quantity: 3400, publication_year: 2024, num_pages: 320, cover_type: 'Bìa mềm', dimensions: '14.5 x 20.5 cm', weight: 350, description: 'Cuốn sách bán chạy nhất mọi thời đại về nghệ thuật ứng xử, thu phục lòng người và gieo mầm thành công trong cuộc sống.', is_featured: 1, is_new: 0, is_bestseller: 1, status: 'ACTIVE', deleted_at: null },
    { id: 12, category_id: 12, author_id: 5, publisher_id: 1, title: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh', slug: 'toi-thay-hoa-vang-tren-co-xanh', import_price: 50000, price: 95000, sale_price: 76000, stock: 140, sold_quantity: 1120, publication_year: 2024, num_pages: 300, cover_type: 'Bìa mềm', dimensions: '13 x 20 cm', weight: 320, description: 'Câu chuyện về tình anh em, tình làng nghĩa xóm cùng những rung động đầu đời bình dị miền quê nghèo Việt Nam.', is_featured: 1, is_new: 0, is_bestseller: 1, status: 'ACTIVE', deleted_at: null }
  ];

  memDb.book_images = [
    { id: 1, book_id: 1, image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800', is_primary: 1 },
    { id: 2, book_id: 2, image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800', is_primary: 1 },
    { id: 3, book_id: 3, image_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800', is_primary: 1 },
    { id: 4, book_id: 4, image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800', is_primary: 1 },
    { id: 5, book_id: 5, image_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800', is_primary: 1 },
    { id: 6, book_id: 6, image_url: 'https://images.unsplash.com/photo-1629992101753-56d196c8aced?auto=format&fit=crop&q=80&w=800', is_primary: 1 },
    { id: 7, book_id: 7, image_url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800', is_primary: 1 },
    { id: 8, book_id: 8, image_url: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800', is_primary: 1 },
    { id: 9, book_id: 9, image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800', is_primary: 1 },
    { id: 10, book_id: 10, image_url: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&q=80&w=800', is_primary: 1 },
    { id: 11, book_id: 11, image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800', is_primary: 1 },
    { id: 12, book_id: 12, image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800', is_primary: 1 }
  ];

  memDb.promotions = [
    { id: 1, code: 'KIMDONG20', title: 'Giảm 20% cho đơn hàng từ 150k', discount_type: 'PERCENTAGE', discount_value: 20, min_order_value: 150000, max_discount: 50000, start_date: null, end_date: null, usage_limit: 1000, times_used: 0, is_active: 1 },
    { id: 2, code: 'FREESHIP30', title: 'Miễn phí vận chuyển đơn từ 200k', discount_type: 'FIXED_AMOUNT', discount_value: 20000, min_order_value: 200000, max_discount: 20000, start_date: null, end_date: null, usage_limit: 1000, times_used: 0, is_active: 1 }
  ];

  memDb.banners = [
    { id: 1, title: 'DORAEMON - TẬP KỶ NIỆM 2024', subtitle: 'Hành trình bảo bối kỳ diệu cùng mèo máy và nhóm bạn Nobita', badge: 'NXB Kim Đồng Nổi Bật', cta_text: 'Khám phá ngay', cta_link: '/books?category_id=6', theme: 'red', image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000', display_order: 1, is_active: 1 },
    { id: 2, title: 'THÁM TỬ LỪNG DANH CONAN - TẬP 100', subtitle: 'Đỉnh cao trinh thám thế giới - Cột mốc 100 tập vang dội', badge: 'NXB Kim Đồng Nổi Bật', cta_text: 'Mua ngay hôm nay', cta_link: '/books?category_id=7', theme: 'dark', image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=1000', display_order: 2, is_active: 1 },
    { id: 3, title: 'TUẦN LỄ SÁCH NXB KIM ĐỒNG', subtitle: 'Ưu đãi lên đến 30% cho toàn bộ tủ sách Thiếu nhi & Manga', badge: 'NXB Kim Đồng Nổi Bật', cta_text: 'Xem khuyến mãi', cta_link: '/books?on_sale=true', theme: 'amber', image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=1000', display_order: 3, is_active: 1 }
  ];

  memDb.orders = [
    { id: 1, order_code: 'DH202609001', user_id: 3, customer_name: 'Nguyễn Văn An', customer_email: 'khachhang@gmail.com', customer_phone: '0987654321', shipping_address: '123 Nguyễn Trãi', shipping_province: 'TP. Hồ Chí Minh', shipping_district: 'Quận 1', shipping_ward: 'Bến Thành', subtotal: 120000, discount_amount: 20000, shipping_fee: 20000, total_amount: 120000, payment_method: 'COD', payment_status: 'UNPAID', order_status: 'DELIVERED', created_at: '2026-09-10T10:15:00.000Z' },
    { id: 2, order_code: 'DH202609002', user_id: 3, customer_name: 'Nguyễn Văn An', customer_email: 'khachhang@gmail.com', customer_phone: '0987654321', shipping_address: '123 Nguyễn Trãi', shipping_province: 'TP. Hồ Chí Minh', shipping_district: 'Quận 1', shipping_ward: 'Bến Thành', subtotal: 148000, discount_amount: 0, shipping_fee: 20000, total_amount: 168000, payment_method: 'BANKING', payment_status: 'PAID', order_status: 'SHIPPING', created_at: '2026-09-14T14:30:00.000Z' }
  ];

  memDb.order_items = [
    { id: 1, order_id: 1, book_id: 1, book_title: 'Doraemon - Tập 1 (Tái Bản 2024)', book_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800', price: 20000, quantity: 2, total_price: 40000 },
    { id: 2, order_id: 1, book_id: 4, book_title: 'Thám Tử Lừng Danh Conan - Tập 100', book_image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800', price: 24000, quantity: 2, total_price: 48000 },
    { id: 3, order_id: 2, book_id: 9, book_title: 'Cho Tôi Xin Một Vé Đi Tuổi Thơ', book_image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800', price: 68000, quantity: 1, total_price: 68000 },
    { id: 4, order_id: 2, book_id: 11, book_title: 'Đắc Nhân Tâm', book_image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800', price: 80000, quantity: 1, total_price: 80000 }
  ];

  memDb.reviews = [
    { id: 1, book_id: 1, user_id: 3, user_name: 'Nguyễn Văn An', rating: 5, comment: 'Truyện in rất nét, giấy thơm, đóng gói bọc kỹ càng!', status: 'APPROVED' },
    { id: 2, book_id: 4, user_id: 3, user_name: 'Nguyễn Văn An', rating: 5, comment: 'Tập 100 Conan đỉnh cao! Giao hàng siêu nhanh.', status: 'APPROVED' },
    { id: 3, book_id: 9, user_id: 3, user_name: 'Nguyễn Văn An', rating: 5, comment: 'Sách hay và giàu cảm xúc, giao hàng trong 2 ngày.', status: 'APPROVED' }
  ];
}

export async function initDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306');
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'kimdong_bookstore';

  try {
    const pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    mysqlPool = pool;
    useMySQL = true;
    console.log(' Successfully connected to MySQL database on port ' + port);
    return;
  } catch (err: any) {
    console.log('⚡ Using pure TS Data Storage engine for 100% zero-config execution.');
    useMySQL = false;
    loadJsonDb();
  }
}

// Memory Query Handler
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (useMySQL && mysqlPool) {
    const [rows] = await mysqlPool.execute(sql, params);
    return rows as T[];
  }

  // Handle Memory Queries for JSON DB engine
  const cleanSql = sql.trim();
  const lowerSql = cleanSql.toLowerCase();

  // Handle INSERT
  if (lowerSql.startsWith('insert into')) {
    const matchTable = cleanSql.match(/insert\s+into\s+`?(\w+)`?/i);
    const tableName = matchTable ? matchTable[1] : '';
    const targetArr = (memDb as any)[tableName] || [];
    
    const newId = targetArr.length > 0 ? Math.max(...targetArr.map((i: any) => i.id || 0)) + 1 : 1;
    let newObj: any = { id: newId, created_at: new Date().toISOString() };

    if (tableName === 'users') {
      if (cleanSql.toLowerCase().includes('(role_id, full_name, email, password, phone)')) {
        // Staff account created by ADMIN: params = [role_id, full_name, email, password, phone]
        newObj = { ...newObj, role_id: params[0] || 3, full_name: params[1], email: params[2], password: params[3], phone: params[4] };
      } else {
        // Self-registration: SQL pins role 3, params = [full_name, email, password, phone, address]
        newObj = { ...newObj, role_id: 3, full_name: params[0], email: params[1], password: params[2], phone: params[3], address: params[4] };
      }
    } else if (tableName === 'banners') {
      newObj = {
        ...newObj, title: params[0], subtitle: params[1], badge: params[2], cta_text: params[3],
        cta_link: params[4], theme: params[5], image_url: params[6], display_order: params[7],
        is_active: params[8], updated_at: new Date().toISOString()
      };
    } else if (tableName === 'books') {
      newObj = {
        ...newObj, category_id: params[0], author_id: params[1], publisher_id: params[2], title: params[3], slug: params[4],
        import_price: params[5], price: params[6], sale_price: params[7], stock: params[8], publication_year: params[9],
        num_pages: params[10], cover_type: params[11], dimensions: params[12], weight: params[13], description: params[14],
        sold_quantity: 0, status: 'ACTIVE', deleted_at: null
      };
    } else if (tableName === 'book_images') {
      newObj = { ...newObj, book_id: params[0], image_url: params[1], is_primary: 1 };
    } else if (tableName === 'carts') {
      newObj = { ...newObj, user_id: params[0], session_id: params[1] };
    } else if (tableName === 'cart_items') {
      newObj = { ...newObj, cart_id: params[0], book_id: params[1], quantity: params[2] };
    } else if (tableName === 'orders') {
      newObj = {
        ...newObj, order_code: params[0], user_id: params[1], customer_name: params[2], customer_email: params[3], customer_phone: params[4],
        shipping_address: params[5], shipping_province: params[6], shipping_district: params[7], shipping_ward: params[8], notes: params[9],
        subtotal: params[10], discount_amount: params[11], shipping_fee: params[12], total_amount: params[13], payment_method: params[14],
        payment_status: params[15], order_status: 'PENDING'
      };
    } else if (tableName === 'order_items') {
      newObj = { ...newObj, order_id: params[0], book_id: params[1], book_title: params[2], book_image: params[3], price: params[4], quantity: params[5], total_price: params[6] };
    } else if (tableName === 'reviews') {
      newObj = { ...newObj, book_id: params[0], user_id: params[1], rating: params[2], comment: params[3], status: 'APPROVED' };
    } else if (tableName === 'wishlists') {
      newObj = { ...newObj, user_id: params[0], book_id: params[1] };
    } else if (tableName === 'categories') {
      newObj = {
        ...newObj, name: params[0], slug: params[1], parent_id: params[2],
        description: params[3], image: params[4], display_order: params[5]
      };
    } else if (tableName === 'authors') {
      newObj = { ...newObj, name: params[0], slug: params[1], bio: params[2], avatar: params[3] };
    } else if (tableName === 'promotions') {
      newObj = {
        ...newObj, code: params[0], title: params[1], discount_type: params[2], discount_value: params[3],
        min_order_value: params[4], max_discount: params[5], start_date: params[6], end_date: params[7],
        usage_limit: params[8], times_used: 0, is_active: params[9]
      };
    }

    targetArr.push(newObj);
    saveJsonDb();
    return [{ insertId: newId, affectedRows: 1 }] as any;
  }

  // Handle UPDATE
  if (lowerSql.startsWith('update')) {
    if (lowerSql.includes('update cart_items set quantity =')) {
      const item = memDb.cart_items.find((i) => i.id === params[1]);
      if (item) item.quantity = params[0];
    } else if (lowerSql.includes('update banners set')) {
      const banner = memDb.banners.find((b) => b.id == params[9]);
      if (banner) {
        Object.assign(banner, {
          title: params[0], subtitle: params[1], badge: params[2], cta_text: params[3],
          cta_link: params[4], theme: params[5], image_url: params[6], display_order: params[7],
          is_active: params[8], updated_at: new Date().toISOString()
        });
      }
    } else if (lowerSql.includes('update users set password')) {
      const staff = memDb.users.find((u) => u.id == params[1]);
      if (staff) staff.password = params[0];
    } else if (lowerSql.includes('update users set role_id')) {
      const staff = memDb.users.find((u) => u.id == params[1]);
      if (staff) staff.role_id = params[0];
    } else if (lowerSql.includes('update users set full_name = ?, email = ?, phone = ?, address = ?')) {
      // Cập nhật khách hàng từ trang Quản Lý Khách Hàng: params = [full_name, email, phone, address, province, district, ward, hashed, id]
      const cust = memDb.users.find((u) => u.id == params[8]);
      if (cust) {
        Object.assign(cust, {
          full_name: params[0], email: params[1], phone: params[2], address: params[3],
          province: params[4], district: params[5], ward: params[6]
        });
        if (params[7]) cust.password = params[7];
      }
    } else if (lowerSql.includes('update users set full_name')) {
      const staff = memDb.users.find((u) => u.id == params[4]);
      if (staff) {
        Object.assign(staff, { full_name: params[0], email: params[1], phone: params[2] });
        if (params[3]) staff.password = params[3];
      }
    } else if (lowerSql.includes('update promotions set times_used = times_used + 1')) {
      const promo = memDb.promotions.find((p) => p.id == params[0]);
      if (promo) promo.times_used = (promo.times_used || 0) + 1;
    } else if (lowerSql.includes('update promotions set is_active = ?')) {
      const promo = memDb.promotions.find((p) => p.id == params[1]);
      if (promo) promo.is_active = params[0];
    } else if (lowerSql.includes('update promotions set code =')) {
      const promo = memDb.promotions.find((p) => p.id == params[10]);
      if (promo) {
        Object.assign(promo, {
          code: params[0], title: params[1], discount_type: params[2], discount_value: params[3],
          min_order_value: params[4], max_discount: params[5], start_date: params[6],
          end_date: params[7], usage_limit: params[8], is_active: params[9]
        });
      }
    } else if (lowerSql.includes('update categories set')) {
      const cat = memDb.categories.find((c) => c.id == params[6]);
      if (cat) {
        Object.assign(cat, {
          name: params[0], slug: params[1], parent_id: params[2],
          description: params[3], image: params[4], display_order: params[5]
        });
      }
    } else if (lowerSql.includes('update authors set')) {
      const aut = memDb.authors.find((a) => a.id == params[4]);
      if (aut) {
        Object.assign(aut, { name: params[0], slug: params[1], bio: params[2], avatar: params[3] });
      }
    } else if (lowerSql.includes('update books set') && lowerSql.includes('title = coalesce(')) {
      // Cập nhật thông tin sách (AdminBooksPage): giữ nguyên trường không gửi
      const book = memDb.books.find((b) => b.id == params[18]);
      if (book) {
        const fields = [
          'title', 'category_id', 'author_id', 'publisher_id', 'import_price', 'price', 'sale_price',
          'stock', 'publication_year', 'num_pages', 'cover_type', 'dimensions', 'weight',
          'description', 'is_featured', 'is_new', 'is_bestseller', 'status'
        ];
        fields.forEach((field, i) => {
          const value = params[i];
          // sale_price: null hợp lệ (xoá giá khuyến mãi); các trường khác null = giữ nguyên
          if (field === 'sale_price') {
            book.sale_price = value;
          } else if (value !== null && value !== undefined) {
            book[field] = value;
          }
        });
        book.updated_at = new Date().toISOString();
      }
    } else if (lowerSql.includes('update books set stock = stock +') && lowerSql.includes('import_price = ?')) {
      // Nhập thêm kho: params = [qty, import_price, id]
      const book = memDb.books.find((b) => b.id == params[2]);
      if (book) {
        book.stock = Number(book.stock || 0) + Number(params[0]);
        if (params[1] !== null && params[1] !== undefined) book.import_price = params[1];
      }
    } else if (lowerSql.includes('update books set stock = stock +')) {
      // Hoàn kho khi hủy đơn: params = [qty, qty, id]
      // (KHÔNG được đụng tới import_price)
      const book = memDb.books.find((b) => b.id == params[2]);
      if (book) {
        book.stock = Number(book.stock || 0) + Number(params[0]);
        book.sold_quantity = Math.max(0, Number(book.sold_quantity || 0) - Number(params[1] || 0));
      }
    } else if (lowerSql.includes('update books set stock = ?')) {
      // Kiểm kê: đặt thẳng số lượng tồn thực tế
      const book = memDb.books.find((b) => b.id == params[1]);
      if (book) book.stock = params[0];
    } else if (lowerSql.includes('update books set stock = stock -')) {
      const book = memDb.books.find((b) => b.id === params[2]);
      if (book) {
        book.stock = Math.max(0, book.stock - params[0]);
        book.sold_quantity += params[1];
      }
    } else if (lowerSql.includes('update reviews set rating')) {
      const rev = memDb.reviews.find((r) => r.id == params[2]);
      if (rev) {
        rev.rating = params[0];
        rev.comment = params[1];
        rev.is_verified_purchase = 1;
        rev.status = 'APPROVED';
      }
    } else if (lowerSql.includes('update orders set order_status') && lowerSql.includes('cancel_reason = ?')) {
      // Hủy đơn: params = [order_status, payment_status, cancel_reason, id]
      const ord = memDb.orders.find((o) => o.id == params[3]);
      if (ord) {
        ord.order_status = params[0];
        if (params[1]) ord.payment_status = params[1];
        ord.cancel_reason = params[2];
        ord.cancelled_at = new Date().toISOString();
      }
    } else if (lowerSql.includes('update orders set order_status')) {
      const ord = memDb.orders.find((o) => o.id == params[2]);
      if (ord) {
        if (params[0]) ord.order_status = params[0];
        if (params[1]) ord.payment_status = params[1];
      }
    }
    saveJsonDb();
    return [{ affectedRows: 1 }] as any;
  }

  // Handle DELETE
  if (lowerSql.startsWith('delete')) {
    if (lowerSql.includes('from cart_items where cart_id = ? and id in')) {
      // Xóa nhiều mục trong 1 lần: params = [cart_id, ...ids]
      const cartId = params[0];
      const ids = params.slice(1);
      memDb.cart_items = memDb.cart_items.filter((i) => !(i.cart_id == cartId && ids.some((x) => x == i.id)));
    } else if (lowerSql.includes('from cart_items where id =')) {
      memDb.cart_items = memDb.cart_items.filter((i) => i.id != params[0]);
    } else if (lowerSql.includes('from cart_items where cart_id =')) {
      memDb.cart_items = memDb.cart_items.filter((i) => i.cart_id != params[0]);
    } else if (lowerSql.includes('from wishlists where id =')) {
      memDb.wishlists = memDb.wishlists.filter((w) => w.id != params[0]);
    } else if (lowerSql.includes('from banners where id =')) {
      memDb.banners = memDb.banners.filter((bn) => bn.id != params[0]);
    } else if (lowerSql.includes('from users where id =')) {
      memDb.users = memDb.users.filter((u) => u.id != params[0]);
    } else if (lowerSql.includes('from categories where id =')) {
      memDb.categories = memDb.categories.filter((c) => c.id != params[0]);
    } else if (lowerSql.includes('from authors where id =')) {
      memDb.authors = memDb.authors.filter((a) => a.id != params[0]);
    } else if (lowerSql.includes('from promotions where id =')) {
      memDb.promotions = memDb.promotions.filter((p) => p.id != params[0]);
    }
    saveJsonDb();
    return [{ affectedRows: 1 }] as any;
  }

  // Handle SELECT Queries
  // Biểu đồ đơn hàng theo ngày/tháng: GROUP BY DATE(created_at) hoặc DATE_FORMAT(created_at, '%Y-%m')
  // (phải đứng TRƯỚC nhánh COUNT/SUM vì câu SQL cũng chứa COUNT/SUM)
  if (lowerSql.includes('from orders') && lowerSql.includes('group by') && lowerSql.includes('as period')) {
    const byYear = lowerSql.includes('year(');
    const byMonth = !byYear && lowerSql.includes('date_format');
    const parseDate = (value: any) => {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    };

    const buckets = new Map<string, { period: string; orders: number; cancelled: number; revenue: number }>();

    for (const o of memDb.orders) {
      const d = parseDate(o.created_at);
      if (!d) continue;
      const period = byYear
        ? String(d.getFullYear())
        : byMonth
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const bucket = buckets.get(period) || { period, orders: 0, cancelled: 0, revenue: 0 };
      bucket.orders += 1;
      if (o.order_status === 'CANCELLED') {
        bucket.cancelled += 1;
      } else {
        bucket.revenue += Number(o.total_amount || 0);
      }
      buckets.set(period, bucket);
    }

    // Lọc theo mốc thời gian nếu câu SQL có WHERE created_at >= ?
    let list = Array.from(buckets.values());
    if (lowerSql.includes('created_at >=') && params[0]) {
      const from = parseDate(params[0]);
      if (from) {
        const fromKey = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`;
        list = list.filter((r) => r.period >= fromKey);
      }
    }

    return list.sort((a, b) => a.period.localeCompare(b.period)) as T[];
  }

  // Phân bố đơn hàng theo trạng thái: SELECT order_status, COUNT(*) ... GROUP BY order_status
  if (lowerSql.includes('from orders') && lowerSql.includes('group by order_status')) {
    const counts = new Map<string, number>();
    for (const o of memDb.orders) {
      counts.set(o.order_status, (counts.get(o.order_status) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([order_status, count]) => ({ order_status, count })) as T[];
  }

  // Truy vấn tổng hợp COUNT / SUM (dashboard, thống kê)
  if (/select\s+(count|sum)\s*\(/i.test(lowerSql)) {
    // Tôn trọng alias trong câu SQL: COUNT(*) as total -> { total }, as count -> { count }
    const alias = (lowerSql.match(/as\s+(\w+)/) || [])[1] || 'count';
    const wrap = (value: number) => [{ [alias]: value }] as T[];

    if (lowerSql.includes('from users') && lowerSql.includes('role_id = 3')) {
      return wrap(memDb.users.filter((u) => Number(u.role_id) === 3).length);
    }
    if (lowerSql.includes('from users')) {
      return wrap(memDb.users.length);
    }
    if (lowerSql.includes('from orders')) {
      if (lowerSql.includes('sum(total_amount)')) {
        const total = memDb.orders
          .filter((o) => o.order_status !== 'CANCELLED')
          .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        return [{ total_revenue: total }] as T[];
      }
      return wrap(memDb.orders.length);
    }
    if (lowerSql.includes('from books')) {
      return wrap(memDb.books.filter((b) => !b.deleted_at).length);
    }
  }

  if (lowerSql.includes('from books')) {
    let list = memDb.books.map((b) => {
      const cat = memDb.categories.find((c) => c.id === b.category_id);
      const aut = memDb.authors.find((a) => a.id === b.author_id);
      const pub = memDb.publishers.find((p) => p.id === b.publisher_id);
      const img = memDb.book_images.find((i) => i.book_id === b.id);
      const revs = memDb.reviews.filter((r) => r.book_id === b.id && r.status === 'APPROVED');
      const avgRating = revs.length > 0 ? revs.reduce((a, b) => a + b.rating, 0) / revs.length : 5.0;

      return {
        ...b,
        category_name: cat ? cat.name : '',
        category_slug: cat ? cat.slug : '',
        author_name: aut ? aut.name : '',
        publisher_name: pub ? pub.name : '',
        cover_image: img ? img.image_url : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
        rating_avg: avgRating,
        review_count: revs.length
      };
    });

    if (lowerSql.includes('b.id = ?')) list = list.filter((b) => b.id == params[0]);
    if (lowerSql.includes('b.slug = ?')) list = list.filter((b) => b.slug === params[0]);
    if (lowerSql.includes('b.category_id = 6')) list = list.filter((b) => b.category_id === 6);
    if (lowerSql.includes('b.category_id = 7')) list = list.filter((b) => b.category_id === 7);
    if (lowerSql.includes('b.category_id = 8')) list = list.filter((b) => b.category_id === 8);
    if (lowerSql.includes('b.category_id = 2 or b.category_id = 10')) list = list.filter((b) => b.category_id === 2 || b.category_id === 10 || b.category_id === 11);
    if (lowerSql.includes('b.category_id = 12 or b.category_id = 3')) list = list.filter((b) => b.category_id === 12 || b.category_id === 3);
    if (lowerSql.includes('category_id = ?')) list = list.filter((b) => b.category_id == params[0] || params[0] === null);
    if (lowerSql.includes('author_id = ?')) list = list.filter((b) => b.author_id == params[0]);
    if (lowerSql.includes('b.is_featured = 1')) list = list.filter((b) => b.is_featured === 1);
    if (lowerSql.includes('b.is_new = 1')) list = list.filter((b) => b.is_new === 1);
    if (lowerSql.includes('b.is_bestseller = 1')) list = list.filter((b) => b.is_bestseller === 1);
    // Cảnh báo tồn kho ở dashboard: sách còn ≤ ngưỡng (sắp hết / hết hàng)
    // (trang Quản Lý Kho cũng chứa 'b.stock <= ?' trong ORDER BY nên phải loại trừ)
    if (lowerSql.includes('b.stock <= ?') && !lowerSql.includes('order by (b.stock <= 0)')) {
      list = list.filter((b) => Number(b.stock) <= Number(params[0]));
      list = [...list].sort((a, b) => Number(a.stock) - Number(b.stock) || Number(b.sold_quantity || 0) - Number(a.sold_quantity || 0));
    }

    if (params.length >= 2 && typeof params[params.length - 2] === 'number') {
      const limit = params[params.length - 2];
      const offset = params[params.length - 1];
      list = list.slice(offset, offset + limit);
    }
    return list as T[];
  }

  if (lowerSql.includes('from users')) {
    let list = memDb.users.map((u) => {
      const r = memDb.roles.find((role) => role.id === u.role_id);
      return { ...u, role_name: r ? r.name : 'CUSTOMER' };
    });
    if (lowerSql.includes('email = ? and id != ?')) list = list.filter((u) => u.email === params[0] && u.id != params[1]);
    else if (lowerSql.includes('email = ?')) list = list.filter((u) => u.email === params[0]);
    // Trang Quản Lý Khách Hàng chỉ lấy role 3 (CUSTOMER)
    if (lowerSql.includes('role_id = 3')) list = list.filter((u) => Number(u.role_id) === 3);
    if (lowerSql.includes('u.id = ?')) list = list.filter((u) => u.id == params[0]);
    if (lowerSql.includes('users where id = ?')) list = list.filter((u) => u.id == params[0]);
    return list as T[];
  }

  if (lowerSql.includes('from roles')) {
    let list = memDb.roles;
    if (lowerSql.includes('roles where id = ?')) list = list.filter((r) => r.id == params[0]);
    return list as T[];
  }

  if (lowerSql.includes('from authors')) {
    let list = memDb.authors;
    if (lowerSql.includes('where slug = ? and id != ?')) list = list.filter((a) => a.slug === params[0] && a.id != params[1]);
    else if (lowerSql.includes('where slug = ?')) list = list.filter((a) => a.slug === params[0]);
    else if (lowerSql.includes('where id = ?')) list = list.filter((a) => a.id == params[0]);
    return list as T[];
  }

  if (lowerSql.includes('from promotions')) {
    let list = memDb.promotions;
    if (lowerSql.includes('id != ?')) list = list.filter((p) => p.code === params[0] && p.id != params[1]);
    else if (lowerSql.includes('code = ?')) list = list.filter((p) => p.code === params[0]);
    else if (lowerSql.includes('where id = ?')) list = list.filter((p) => p.id == params[0]);
    if (lowerSql.includes('is_active = 1')) list = list.filter((p) => p.is_active == 1);
    return list as T[];
  }

  if (lowerSql.includes('from publishers')) {
    return memDb.publishers as T[];
  }

  if (lowerSql.includes('from banners')) {
    let list = memDb.banners;
    if (lowerSql.includes('where is_active = 1')) list = list.filter((bn) => bn.is_active == 1);
    return [...list].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)) as T[];
  }

  if (lowerSql.includes('from categories')) {
    let list = memDb.categories;
    if (lowerSql.includes('where slug = ? and id != ?')) list = list.filter((c) => c.slug === params[0] && c.id != params[1]);
    else if (lowerSql.includes('where slug = ?')) list = list.filter((c) => c.slug === params[0]);
    else if (lowerSql.includes('where parent_id = ?')) list = list.filter((c) => c.parent_id == params[0]);
    else if (lowerSql.includes('where id = ?')) list = list.filter((c) => c.id == params[0]);
    return list as T[];
  }

  if (lowerSql.includes('from carts')) {
    let list = memDb.carts;
    // Đăng nhập: chỉ theo user_id — tránh lẫn sang giỏ khách vãng lai 'guest-session'
    if (lowerSql.includes('user_id = ?') && !lowerSql.includes('session_id = ?')) {
      list = list.filter((c) => c.user_id != null && c.user_id == params[0]);
    } else if (lowerSql.includes('session_id = ?') && !lowerSql.includes('user_id = ?')) {
      list = list.filter((c) => c.session_id === params[0]);
    } else if (params[0]) {
      list = list.filter((c) => c.user_id == params[0] || c.session_id == params[1]);
    }
    return list as T[];
  }

  if (lowerSql.includes('from cart_items')) {
    let list = memDb.cart_items.map((ci) => {
      const b = memDb.books.find((book) => book.id === ci.book_id);
      const img = memDb.book_images.find((i) => i.book_id === ci.book_id);
      return {
        ...ci,
        title: b ? b.title : '',
        slug: b ? b.slug : '',
        price: b ? b.price : 0,
        sale_price: b ? b.sale_price : null,
        stock: b ? b.stock : 0,
        cover_image: img ? img.image_url : ''
      };
    });
    if (lowerSql.includes('ci.cart_id = ?')) list = list.filter((ci) => ci.cart_id == params[0]);
    return list as T[];
  }

  // JOIN orders + order_items: kiểm tra đã mua sách / liệt kê sách được đánh giá
  // (phải đặt TRƯỚC nhánh 'from orders' vì chuỗi cũng chứa 'from orders')
  if (lowerSql.includes('from orders') && lowerSql.includes('join order_items')) {
    const userId = params[0];
    const statuses = params.filter((p) => typeof p === 'string');
    const onlyBookId = lowerSql.includes('oi.book_id = ?') ? params[1] : null;

    const rows: any[] = [];
    for (const o of memDb.orders) {
      if (o.user_id != userId) continue;
      if (statuses.length && !statuses.includes(o.order_status)) continue;

      for (const oi of memDb.order_items) {
        if (oi.order_id != o.id) continue;
        if (onlyBookId != null && oi.book_id != onlyBookId) continue;

        const b = memDb.books.find((book) => book.id === oi.book_id);
        // Khớp với SQL: bỏ qua sách đã xóa mềm khi kiểm tra quyền đánh giá
        if (lowerSql.includes('b.deleted_at is null') && (!b || b.deleted_at)) continue;
        const rev = memDb.reviews.find((r) => r.user_id == o.user_id && r.book_id == oi.book_id);

        rows.push({
          id: o.id,
          order_code: o.order_code,
          created_at: o.created_at,
          book_id: oi.book_id,
          book_title: oi.book_title,
          book_image: oi.book_image,
          book_slug: b ? b.slug : null,
          review_id: rev ? rev.id : null,
          my_rating: rev ? rev.rating : null
        });
      }
    }

    rows.sort((a, b) => Number(b.id) - Number(a.id));
    return (lowerSql.includes('limit 1') ? rows.slice(0, 1) : rows) as T[];
  }

  // Doanh thu theo kỳ (hôm nay/tháng này/năm nay): SELECT DATE(...) as d, ... as m, YEAR(...) as y, total_amount
  // (phải đứng TRƯỚC nhánh 'from orders' chung vì nhánh đó trả nguyên object đơn hàng)
  if (lowerSql.includes('from orders') && lowerSql.includes('as d') && lowerSql.includes('as y')) {
    let list = memDb.orders;
    if (lowerSql.includes("order_status != 'cancelled'")) {
      list = list.filter((o) => o.order_status !== 'CANCELLED');
    }
    return list.map((o) => {
      const d = new Date(o.created_at);
      const valid = !isNaN(d.getTime());
      return {
        d: valid ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : null,
        m: valid ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : null,
        y: valid ? d.getFullYear() : null,
        total_amount: Number(o.total_amount || 0)
      };
    }) as T[];
  }

  if (lowerSql.includes('from orders')) {
    let list = memDb.orders;
    if (lowerSql.includes('user_id = ?')) list = list.filter((o) => o.user_id == params[0]);
    else if (lowerSql.includes('id = ? or order_code = ?')) list = list.filter((o) => o.id == params[0] || o.order_code === params[0]);
    else if (lowerSql.includes('id = ?')) list = list.filter((o) => o.id == params[0]);
    return list as T[];
  }

  // Doanh thu theo danh mục: order_items JOIN orders (chỉ đơn không bị hủy)
  // (phải đứng TRƯỚC nhánh 'from order_items' chung)
  if (lowerSql.includes('from order_items') && lowerSql.includes('join orders')) {
    const activeIds = new Set(
      memDb.orders.filter((o) => o.order_status !== 'CANCELLED').map((o) => o.id)
    );
    return memDb.order_items
      .filter((oi) => activeIds.has(oi.order_id))
      .map((oi) => ({
        book_id: oi.book_id,
        order_id: oi.order_id,
        book_title: oi.book_title,
        quantity: Number(oi.quantity || 0),
        total_price: Number(oi.total_price || 0)
      })) as T[];
  }

  if (lowerSql.includes('from order_items')) {
    // Tổng số lượng đã bán của 1 cuốn sách (trang Quản Lý Kho)
    if (lowerSql.includes('sum(quantity)')) {
      const bookId = params[0];
      const total = memDb.order_items
        .filter((oi) => oi.book_id == bookId)
        .reduce((sum, oi) => sum + Number(oi.quantity || 0), 0);
      return [{ total_sold: total }] as T[];
    }

    let list = memDb.order_items;
    if (lowerSql.includes('order_id = ?')) list = list.filter((oi) => oi.order_id == params[0]);
    return list as T[];
  }

  if (lowerSql.includes('from reviews')) {
    // Điểm trung bình + số lượng đánh giá đã duyệt của 1 cuốn sách
    if (lowerSql.includes('avg(rating)')) {
      const bookId = params[0];
      const approved = memDb.reviews.filter((r) => r.book_id == bookId && r.status === 'APPROVED');
      const avg = approved.length ? approved.reduce((s, r) => s + Number(r.rating), 0) / approved.length : null;
      return [{ avg, count: approved.length }] as T[];
    }

    let list = memDb.reviews.map((r) => {
      const u = memDb.users.find((user) => user.id === r.user_id);
      return { ...r, user_name: r.user_name || (u ? u.full_name : 'Khách hàng') };
    });

    // Đánh giá của 1 người cho 1 cuốn sách: WHERE user_id = ? AND book_id = ?
    if (lowerSql.includes('user_id = ?') && lowerSql.includes('book_id = ?')) {
      list = list.filter((r) => r.user_id == params[0] && r.book_id == params[1]);
    } else {
      if (lowerSql.includes('book_id = ?')) list = list.filter((r) => r.book_id == params[0]);
      if (lowerSql.includes('user_id = ?')) list = list.filter((r) => r.user_id == params[0]);
    }
    if (lowerSql.includes('status = "approved"')) list = list.filter((r) => r.status === 'APPROVED');
    return list as T[];
  }

  if (lowerSql.includes('from wishlists')) {
    let list = memDb.wishlists.map((w) => {
      const b = memDb.books.find((book) => book.id === w.book_id);
      const aut = memDb.authors.find((a) => a.id === (b ? b.author_id : 0));
      const img = memDb.book_images.find((i) => i.book_id === w.book_id);
      return {
        ...w,
        ...b,
        author_name: aut ? aut.name : '',
        cover_image: img ? img.image_url : ''
      };
    });
    if (lowerSql.includes('w.user_id = ?')) list = list.filter((w) => w.user_id == params[0]);
    return list as T[];
  }

  return [] as T[];
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}
