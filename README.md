# Dự Án Website Bán Sách Trực Tuyến - Giao Diện Tham Khảo NXB Kim Đồng

Dự án đã được phân chia cấu trúc **Frontend** và **Backend** nằm trong 2 thư mục riêng biệt độc lập, giúp dễ dàng quản lý, phát triển và deploy.

## Cấu trúc thư mục dự án

```text
book-store/
├── client/             # FRONTEND (React + Vite + TypeScript + Tailwind CSS)
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   ├── .env
│   └── README.md
│
├── server/             # BACKEND (Node.js + Express + TypeScript REST API)
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   └── README.md
│
├── database/           # SCRIPT CƠ SỞ DỮ LIỆU
│   ├── schema.sql      # Schema chuẩn hóa MySQL
│   └── seed.sql        # Dữ liệu thực tế NXB Kim Đồng (40+ sách, danh mục, tác giả)
│
└── package.json        # Root script hỗ trợ quản lý 2 thư mục song song
```

## Cách chạy dự án

### Cách 1: Chạy từ thư mục gốc (Khuyên dùng)
```bash
# Chạy Backend (Cổng 5000)
npm run dev:server

# Mở terminal thứ 2 - Chạy Frontend (Cổng 3000)
npm run dev:client
```

### Cách 2: Chạy độc lập từng thư mục

**Chạy Backend:**
```bash
cd server
npm run dev
```

**Chạy Frontend:**
```bash
cd client
npm run dev
```

---

- **Website Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend REST API**: [http://localhost:5000](http://localhost:5000)
- **Tài khoản Admin thử nghiệm**: `admin@kimdong.vn` / `admin123`
- **Tài khoản Khách hàng thử nghiệm**: `khachhang@gmail.com` / `user123`
