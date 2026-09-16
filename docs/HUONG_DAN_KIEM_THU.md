# Hướng dẫn kiểm thử dự án Website bán sách NXB Kim Đồng

Tài liệu này hướng dẫn cách chạy kiểm thử cho dự án. Nếu bạn chưa đọc, hãy xem
trước bản [Kế hoạch kiểm thử](KE_HOACH_KIEM_THU.md) để hiểu phạm vi, chiến lược
và tiêu chí đánh giá.

---

## 1. Có những cách kiểm thử nào?

Dự án được kiểm thử theo 3 tầng, nhưng **tập trung vào tầng API** vì đó là nơi
chứa gần như toàn bộ logic nghiệp vụ (đặt hàng, trừ kho, hoàn kho, phân quyền).

| Tầng | Cách làm | Công cụ | Trạng thái |
| --- | --- | --- | --- |
| 1. Kiểm thử API | Gọi thẳng REST API, kiểm tra mã trạng thái và dữ liệu trả về | Bộ `api-tests.mjs` (Node) và bộ sưu tập Postman | **Đã có sẵn** |
| 2. Kiểm thử giao diện | Bấm tay trên trình duyệt theo kịch bản | Chrome DevTools | Kịch bản trong Kế hoạch kiểm thử §12 |
| 3. Kiểm thử đơn vị | Kiểm thử hàm thuần túy | Vitest (chưa cài) | Chưa làm |

**Vì sao ưu tiên kiểm thử API?** Vì mọi thao tác trên giao diện đều đi qua API.
Nếu API đúng thì giao diện chỉ còn rủi ro về hiển thị. Ngược lại, nếu chỉ bấm tay
trên giao diện thì rất khó kiểm tra các trường hợp biên (số lượng âm, lý do huỷ
501 ký tự, token giả mạo…).

---

## 2. Chuẩn bị môi trường

### 2.1. Yêu cầu

| Thành phần | Phiên bản đang dùng | Ghi chú |
| --- | --- | --- |
| Node.js | v26.7.0 | Cần từ v18 trở lên vì bộ test dùng `fetch` có sẵn |
| MySQL / MariaDB | MariaDB 10.4.32 | Chạy kèm XAMPP |
| npm | 11.19.0 | Cài kèm Node.js |

### 2.2. Bật MySQL

Kiểm thử **bắt buộc** phải có MySQL đang chạy — backend không còn chế độ chạy
bằng dữ liệu giả. Nếu dùng XAMPP:

```powershell
# Cách 1: mở XAMPP Control Panel rồi bấm Start ở dòng MySQL
# Cách 2: chạy trực tiếp
Start-Process "D:\xampp\mysql\bin\mysqld.exe" `
  -ArgumentList "--defaults-file=D:\xampp\mysql\bin\my.ini","--standalone"
```

Kiểm tra lại:

```powershell
& D:\xampp\mysql\bin\mysql.exe -u root -e "SELECT VERSION();"
```

Nếu thấy số phiên bản là MySQL đã chạy.

### 2.3. Cài thư viện

```powershell
npm install
```

---

## 3. Cách 1 — Chạy tự động bằng một lệnh (khuyên dùng)

Đây là cách nhanh nhất. Script sẽ tự làm hết mọi việc:

1. Xoá và tạo lại database kiểm thử `kimdong_bookstore_test` từ `schema.sql` + `seed.sql`
2. Biên dịch backend TypeScript sang JavaScript
3. Bật server riêng ở **cổng 5099** (không đụng tới server dev ở cổng 5000)
4. Chạy bộ kiểm thử
5. Tắt server và xuất báo cáo

```powershell
cd tests
.\run-tests.ps1
```

Kết quả cuối cùng trông như sau:

```
  KẾT QUẢ: 253/253 đạt (100.0%)
  Đạt: 253   Không đạt: 0
[BAO CAO] Da xuat: ...\tests\KET_QUA_KIEM_THU.md
```

### 3.1. Các tham số

| Tham số | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `-Port` | `5099` | Cổng của server kiểm thử |
| `-DbName` | `kimdong_bookstore_test` | Tên database kiểm thử |
| `-SkipReset` | tắt | Bỏ qua bước khôi phục database, chạy nhanh hơn |
| `-Report` | `tests\KET_QUA_KIEM_THU.md` | Nơi xuất báo cáo |
| `-Runner` | `api-tests.mjs` | Chọn bộ kiểm thử: `api-tests.mjs`, `run-postman.mjs`, `unit-tests.mjs`, `both` |

### 3.2. Ví dụ

```powershell
# Chạy bộ mặc định (253 test case)
.\run-tests.ps1

# Chạy bộ sưu tập Postman
.\run-tests.ps1 -Runner run-postman.mjs

# Chạy cả hai bộ liên tiếp
.\run-tests.ps1 -Runner both

# Chạy kiểm thử đơn vị (nhanh, không cần MySQL)
.\run-tests.ps1 -Runner unit-tests.mjs

# Chạy lại nhanh, không khôi phục database
.\run-tests.ps1 -SkipReset
```

### 3.3. Kiểm thử đơn vị (Unit Test)

Ngoài bộ kiểm thử API (cần MySQL + server), dự án có thêm bộ **kiểm thử đơn vị**
kiểm tra từng hàm riêng lẻ trực tiếp trong bộ nhớ — **không cần MySQL, không cần
bật server**, chạy xong trong vài giây:

```powershell
cd tests
.\run-tests.ps1 -Runner unit-tests.mjs
```

Hoặc chạy trực tiếp:

```powershell
cd tests
node unit-tests.mjs
```

Bộ này gồm **48 test case** cho 3 nhóm hàm thuần túy:

| Nhóm | Hàm | Số ca |
| --- | --- | --- |
| Định dạng hiển thị | `formatVND`, `formatDate`, `calculateDiscountPercent` | 16 |
| Trạng thái tồn kho | `getStockStatus`, `LOW_STOCK_THRESHOLD` | 12 |
| Mã khuyến mãi | `evaluatePromotion` | 20 |

Kết quả được xuất ra màn hình và ghi vào `tests/KET_QUA_KIEM_THU_DON_VI.md`.
Chi tiết kết quả gần nhất xem [Kết quả kiểm thử đơn vị](../tests/KET_QUA_KIEM_THU_DON_VI.md).

---

## 4. Cách 2 — Chạy bộ kiểm thử Node

Bộ `tests/api-tests.mjs` gồm **253 test case** phủ 16 nhóm chức năng. Bộ này
dùng `fetch` có sẵn của Node nên **không cần cài thêm thư viện nào**.

### 4.1. Chạy trên server kiểm thử (khuyên dùng)

```powershell
cd tests
.\run-tests.ps1 -Runner api-tests.mjs
```

### 4.2. Chạy trên server đang phát triển

Nếu backend đang chạy sẵn ở cổng 5000:

```powershell
$env:API_BASE = "http://localhost:5000/api"
node tests/api-tests.mjs
```

> **Cảnh báo:** cách này sẽ **tạo và xoá dữ liệu thật** trong database đang dùng.
> Chỉ nên làm khi chấp nhận được điều đó. Bộ test có tự khôi phục tồn kho và xoá
> giỏ hàng ở cuối, nhưng các sách/đơn hàng tạo ra trong lúc chạy vẫn được giữ lại
> nếu test dừng giữa chừng.

### 4.3. Đổi nơi xuất báo cáo

```powershell
$env:API_BASE = "http://localhost:5099/api"
$env:REPORT   = "C:\bao-cao\ket-qua.md"
node tests/api-tests.mjs
```

### 4.4. Bộ test kiểm tra những gì?

| Nhóm | Mã test case | Nội dung chính |
| --- | --- | --- |
| Xác thực | `TC-AUTH-*` | Đăng nhập, đăng ký, hồ sơ, đổi mật khẩu |
| Sách | `TC-BOOK-*` | Danh sách, chi tiết, tìm kiếm, lọc, CRUD |
| Danh mục | `TC-CAT-*` | Cây danh mục, chặn xoá danh mục còn sách |
| Tác giả & NXB | `TC-AUT-*` | CRUD tác giả, nhà xuất bản |
| Banner | `TC-BAN-*` | CRUD banner, banner đang hiển thị |
| Khuyến mãi | `TC-PRM-*` | Kiểm tra mã, giảm theo %, giảm số tiền cố định |
| Tài khoản & Khách hàng | `TC-EMP-*`, `TC-CUS-*` | Tạo nhân viên, đổi vai trò, sửa khách hàng |
| Giỏ hàng | `TC-CART-*` | Thêm, cộng dồn, cập nhật, xoá, tách giỏ theo người dùng |
| **Đơn hàng** | `TC-ORD-*` | **Đặt hàng, trừ kho, xác nhận, huỷ đơn, hoàn kho** |
| Kho | `TC-INV-*` | Nhập kho, kiểm kê, chênh lệch, phân quyền |
| Đánh giá & Yêu thích | `TC-RVW-*`, `TC-WSH-*` | Chỉ được đánh giá khi đã mua |
| Thống kê | `TC-DASH-*` | Biểu đồ, doanh thu theo danh mục, cảnh báo tồn kho |
| Phân quyền & Bảo mật | `TC-SEC-*`, `TC-VAL-*` | 401/403, SQL Injection, XSS, dữ liệu biên |

---

## 5. Cách 3 — Chạy bằng Postman

Bộ sưu tập `tests/KIMDONG_API.postman_collection.json` gồm **13 folder, 249
request, 601 kiểm tra**. Dùng khi bạn muốn xem trực quan từng request hoặc chụp
ảnh minh hoạ cho báo cáo.

### 5.1. Import vào Postman

1. Mở Postman → **Import** → chọn file `tests/KIMDONG_API.postman_collection.json`
2. Vào tab **Variables** của bộ sưu tập, kiểm tra biến `baseUrl`
   (mặc định `http://localhost:5000/api`)
3. Bấm **Run** để chạy toàn bộ, hoặc bấm từng request để chạy riêng

### 5.2. Token được lấy tự động

Bạn **không cần** đăng nhập thủ công. Pre-request Script của bộ sưu tập sẽ tự
gọi `POST /auth/login` cho cả 3 tài khoản demo và lưu token vào biến
`adminToken`, `empToken`, `cusToken`.

### 5.3. Chạy bằng dòng lệnh (Newman)

```powershell
npx newman run tests/KIMDONG_API.postman_collection.json
```

Hoặc dùng runner có sẵn trong dự án (không cần cài Newman):

```powershell
cd tests
.\run-tests.ps1 -Runner run-postman.mjs
```

Runner này còn xuất báo cáo Markdown ra `tests/KET_QUA_POSTMAN.md`.

### 5.4. Lưu ý về thứ tự chạy

Các request **phải chạy theo đúng thứ tự** vì nhiều request dùng biến do request
trước tạo ra, ví dụ `{{newBookId}}`, `{{cartItemId}}`, `{{orderId}}`. Nếu chạy
lẻ một request ở giữa, biến có thể chưa có giá trị.

---

## 6. Cách 4 — Kiểm thử thủ công trên giao diện

Với những phần khó tự động hoá (bố cục, màu sắc, hiệu ứng, khả năng dùng trên
điện thoại), hãy kiểm thử bằng tay.

### 6.1. Bật cả hai server

```powershell
npm run dev
```

Sau đó mở:

| Địa chỉ | Nội dung |
| --- | --- |
| http://localhost:3000 | Giao diện khách hàng |
| http://localhost:3000/admin | Trang quản trị |
| http://localhost:5000/api | Kiểm tra API đang chạy |

### 6.2. Tài khoản demo

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Quản trị viên | `admin@kimdong.vn` | `admin123` |
| Nhân viên | `nhanvien@kimdong.vn` | `admin123` |
| Khách hàng | `khachhang@gmail.com` | `user123` |

### 6.3. Kịch bản nên kiểm tra tay

1. **Luồng mua hàng trọn vẹn:** tìm sách → thêm vào giỏ → đặt hàng → xem đơn
   trong lịch sử → quản trị xác nhận → chuyển trạng thái → giao thành công
2. **Huỷ đơn và hoàn kho:** huỷ đơn ở từng trạng thái, kiểm tra tồn kho trong
   trang Quản lý kho có tăng lại đúng số lượng
3. **Phân quyền:** đăng nhập khách hàng rồi thử mở `/admin`, phải bị chặn
4. **Hiển thị:** thu nhỏ cửa sổ xuống cỡ điện thoại, kiểm tra menu và bảng biểu
5. **Tiếng Việt:** nhập tên sách có dấu, kiểm tra lưu và hiển thị đúng

---

## 7. Đọc kết quả

### 7.1. Báo cáo Markdown

| File | Nội dung |
| --- | --- |
| `tests/KET_QUA_KIEM_THU.md` | Kết quả bộ 253 test case, kèm danh sách lỗi |
| `tests/KET_QUA_POSTMAN.md` | Kết quả bộ sưu tập Postman theo từng folder |

Báo cáo gồm 4 phần: tổng hợp, kết quả theo nhóm chức năng, chi tiết từng kiểm
tra, và danh sách kiểm tra không đạt.

### 7.2. Mã thoát

| Mã | Ý nghĩa |
| --- | --- |
| `0` | Toàn bộ kiểm thử đạt |
| `1` | Có kiểm thử không đạt |

Dùng được trong CI: `.\run-tests.ps1; if ($LASTEXITCODE -ne 0) { exit 1 }`

### 7.3. Khi có kiểm thử không đạt

Báo cáo in ra tên test case, mã HTTP nhận được và thông báo lỗi. Cách xử lý:

1. **Xác định lỗi nằm ở đâu.** Mở báo cáo, tìm test case không đạt.
2. **Kiểm tra dữ liệu mẫu.** Nhiều trường hợp sai vì database không ở trạng thái
   gốc. Chạy lại `.\run-tests.ps1` (không dùng `-SkipReset`) để khôi phục.
3. **Phân biệt lỗi sản phẩm và lỗi kỳ vọng.** Nếu API trả về đúng theo thiết kế
   thì sửa lại kỳ vọng trong test; nếu API trả sai thì sửa mã nguồn.
4. **Ghi lại lỗi.** Dùng mẫu nhật ký lỗi ở Kế hoạch kiểm thử §13.

---

## 8. Câu hỏi thường gặp

### Server kiểm thử không khởi động được

Xem log ở `tests/server-test.log` và `tests/server-test.err.log`. Nguyên nhân
thường gặp:

- **MySQL chưa chạy** → bật MySQL (mục 2.2)
- **Cổng 5099 đang bị chiếm** → đổi cổng: `.\run-tests.ps1 -Port 5199`

### Lỗi `Can't connect to MySQL server`

MySQL chưa chạy. Đây là nguyên nhân phổ biến nhất.

### Web vẫn hiện sách dù chưa nạp database

Trước đây backend có **chế độ dự phòng bằng file JSON**: khi không kết nối được
MySQL, server tự chuyển sang đọc file `server/kimdong_data.json` chứa dữ liệu cứng
giống hệt `seed.sql`. Vì dữ liệu giống nhau nên rất khó phát hiện bằng mắt — web
vẫn hiện đủ 12 sách và vẫn đăng nhập được, nhưng **dữ liệu không đến từ database**
và mọi thay đổi đều không được lưu vào MySQL.

**Chế độ dự phòng này đã bị loại bỏ hoàn toàn.** Nay nếu không kết nối được MySQL,
server sẽ **dừng ngay** và in hướng dẫn xử lý cụ thể. Bạn sẽ không còn bị nhầm lẫn.

Để kiểm tra web đang đọc database nào, mở địa chỉ:

```
http://localhost:5000/api/health
```

Kết quả trả về cho biết rõ engine, tên database và trạng thái kết nối:

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

### Database chính bị thay đổi ngoài ý muốn

Script `reset-test-db.ps1` đã xử lý việc này: nó **loại bỏ** các dòng
`CREATE DATABASE` và `USE` trong file SQL trước khi nạp, nên không bao giờ ghi
nhầm vào database chính. Nếu bạn tự nạp SQL bằng tay, hãy nhớ rằng cả
`database/schema.sql` và `database/seed.sql` đều chứa dòng
`USE \`kimdong_bookstore\`;` — dòng này sẽ **ghi đè** tham số `-D`, khiến dữ liệu
chảy vào database chính.

### Muốn chạy lại nhanh mà không khôi phục database

```powershell
.\run-tests.ps1 -SkipReset
```

Chỉ nên dùng khi lần chạy trước đã đạt, hoặc khi bạn chắc chắn dữ liệu còn sạch.

### Muốn thêm test case mới

**Với bộ Node:** mở `tests/api-tests.mjs`, tìm nhóm chức năng tương ứng và thêm
một dòng theo mẫu:

```js
await T('TC-ORD-99', 'Mô tả ngắn', 'Kỳ vọng', async () => {
    const r = await GET('/orders/1', { token: adminToken });
    return r.status === 200;
});
```

**Với bộ Postman:** mở `tests/make-postman.mjs`, thêm một dòng vào bảng của
folder tương ứng rồi chạy lại `node tests/make-postman.mjs`. **Không sửa trực
tiếp file JSON** vì nó được sinh tự động.

---

## 9. Tóm tắt nhanh

```powershell
# 1. Bật MySQL (XAMPP Control Panel -> Start MySQL)

# 2. Chạy toàn bộ kiểm thử
cd tests
.\run-tests.ps1

# 3. Xem báo cáo
notepad KET_QUA_KIEM_THU.md
```

Đó là tất cả những gì cần làm.
