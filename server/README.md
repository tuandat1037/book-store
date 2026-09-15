# NXB Kim Dong Book Store - Backend (Node.js + Express + TypeScript)

Thư mục chứa toàn bộ mã nguồn **Backend REST API**.

## Cấu trúc thư mục Server

```
server/
├── package.json        # Dependencies của Backend
├── tsconfig.json       # Cấu hình TypeScript
├── .env                # Biến môi trường Backend
├── src/
│   ├── config/         # Kết nối Database (MySQL & Engine Fallback)
│   ├── controllers/    # Xử lý logic API (Auth, Books, Orders, Cart, Admin, Reviews)
│   ├── middleware/     # JWT Auth & Phân quyền RBAC, Error Handler
│   ├── routes/         # Khai báo các API Endpoints (/api/...)
│   └── index.ts        # Entrypoint ứng dụng Express Server
```

## Lệnh khởi chạy Backend độc lập

```bash
# Di chuyển vào folder server
cd server

# Cài đặt thư viện
npm install

# Khởi chạy chế độ Development (Nodemon / TSX)
npm run dev

# Build mã nguồn TypeScript thành JS
npm run build

# Khởi chạy bản Production
npm run start
```
