# NXB Kim Dong Book Store - Frontend (React + Vite + TypeScript + Tailwind CSS)

Thư mục chứa toàn bộ mã nguồn **Giao diện Frontend (Client)**.

## Cấu trúc thư mục Client

```
client/
├── package.json        # Dependencies của Frontend
├── vite.config.ts      # Cấu hình Vite & Proxy API Server
├── tailwind.config.js  # Design System màu sắc Đỏ/Trắng NXB Kim Đồng
├── tsconfig.json       # Cấu hình TypeScript
├── .env                # Biến môi trường Frontend
├── src/
│   ├── components/     # UI Components (Header, Navigation MegaMenu, BookCard, HeroCarousel, Footer)
│   ├── context/        # React Context (Auth, Cart, Wishlist, Toast)
│   ├── layouts/        # MainLayout & AdminLayout
│   ├── pages/          # HomePage, BooksPage, BookDetailPage, CartPage, CheckoutPage, AccountPage, Admin Pages
│   ├── services/       # Axios API Client
│   ├── types/          # TypeScript Interfaces
│   ├── utils/          # Formatter tiền tệ VNĐ & Ngày tháng
│   ├── App.tsx         # Router khai báo toàn bộ trang
│   └── main.tsx        # React Entrypoint
```

## Lệnh khởi chạy Frontend độc lập

```bash
# Di chuyển vào folder client
cd client

# Cài đặt thư viện
npm install

# Khởi chạy chế độ Development (Vite Dev Server)
npm run dev

# Build sản phẩm Production
npm run build
```
