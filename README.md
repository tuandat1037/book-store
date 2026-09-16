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
├── docs/               # TÀI LIỆU
│   ├── KE_HOACH_KIEM_THU.md        # Kế hoạch kiểm thử
│   ├── HUONG_DAN_KIEM_THU.md       # Hướng dẫn chạy kiểm thử
│   └── BAO_CAO_TONG_KET_KIEM_THU.md # Báo cáo tổng kết kiểm thử
│
├── tests/              # BỘ KIỂM THỬ API
│   ├── api-tests.mjs                       # 253 test case tự động
│   ├── KIMDONG_API.postman_collection.json # Bộ sưu tập Postman
│   └── run-tests.ps1                       # Script chạy kiểm thử
│
└── package.json        # Root script hỗ trợ quản lý 2 thư mục song song
```

## Cách chạy dự án

> **Lưu ý quan trọng:** dự án **bắt buộc phải có MySQL đang chạy**. Nếu chưa bật
> MySQL, backend sẽ dừng ngay và in hướng dẫn xử lý cụ thể, chứ không chạy bằng
> dữ liệu giả. Xem mục [Kiểm tra kết nối database](#kiểm-tra-kết-nối-database).

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

## Kiểm tra kết nối database

Mở địa chỉ sau để biết web đang đọc database nào:

```
http://localhost:5000/api/health
```

```json
{
  "status": "ok",
  "database": {
    "engine": "MySQL",
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "database": "kimdong_bookstore",
    "connected": true
  }
}
```

Nếu MySQL chưa chạy, backend in hướng dẫn và dừng lại:

```
================================================================
   KHÔNG KẾT NỐI ĐƯỢC CƠ SỞ DỮ LIỆU MYSQL
================================================================

   Đã thử kết nối: root@localhost:3306/kimdong_bookstore
   Mã lỗi       : ECONNREFUSED

   NGUYÊN NHÂN: MySQL chưa chạy.

   CÁCH SỬA:
     - Nếu dùng XAMPP: mở XAMPP Control Panel, bấm Start ở dòng MySQL.
     ...
```

> Trước đây backend có **chế độ dự phòng bằng file `kimdong_data.json`**: khi mất
> kết nối MySQL, server tự chuyển sang đọc dữ liệu cứng giống hệt `seed.sql`. Vì
> dữ liệu giống nhau nên web vẫn hiện đủ sách và vẫn đăng nhập được, khiến rất khó
> phát hiện là dữ liệu **không đến từ database**. Chế độ này đã bị **loại bỏ hoàn
> toàn** để không còn gây nhầm lẫn.

---

## Kiểm thử

```powershell
cd tests
.\run-tests.ps1
```

Script sẽ tự khôi phục database kiểm thử, biên dịch backend, bật server ở cổng
5099, chạy **253 test case**, tắt server và xuất báo cáo.

Kiểm thử đơn vị (không cần MySQL, chạy trong vài giây):

```powershell
cd tests
.\run-tests.ps1 -Runner unit-tests.mjs
```

| Tài liệu | Nội dung |
| --- | --- |
| [Kế hoạch kiểm thử](docs/KE_HOACH_KIEM_THU.md) | Phạm vi, chiến lược, tiêu chí, lịch trình |
| [Hướng dẫn kiểm thử](docs/HUONG_DAN_KIEM_THU.md) | Cách chạy, xử lý sự cố, câu hỏi thường gặp |
| [Báo cáo tổng kết](docs/BAO_CAO_TONG_KET_KIEM_THU.md) | Kết luận, lỗi đã sửa, mức độ bao phủ |
| [Kết quả kiểm thử](tests/KET_QUA_KIEM_THU.md) | Báo cáo kết quả bộ 253 test case |
| [Kết quả Postman](tests/KET_QUA_POSTMAN.md) | Báo cáo kết quả bộ sưu tập Postman |
| [Kết quả kiểm thử đơn vị](tests/KET_QUA_KIEM_THU_DON_VI.md) | Báo cáo kết quả bộ 48 test case đơn vị |

Chi tiết xem [Hướng dẫn kiểm thử](docs/HUONG_DAN_KIEM_THU.md).

---

- **Website Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend REST API**: [http://localhost:5000](http://localhost:5000)
- **Tài khoản Admin thử nghiệm**: `admin@kimdong.vn` / `admin123`
- **Tài khoản Khách hàng thử nghiệm**: `khachhang@gmail.com` / `user123`
