# Hướng dẫn kiểm thử dự án Website bán sách NXB Kim Đồng

Tài liệu này hướng dẫn chạy **toàn bộ** các bộ kiểm thử của dự án. Nếu chưa
đọc, hãy xem trước [Kế hoạch kiểm thử](KE_HOACH_KIEM_THU.md) để hiểu phạm vi,
chiến lược và tiêu chí đánh giá.

---

## 1. Có những cách kiểm thử nào?

Dự án được kiểm thử theo 3 tầng. Tầng API được ưu tiên vì chứa gần như toàn
bộ logic nghiệp vụ (đặt hàng, trừ kho, hoàn kho, phân quyền).

| Tầng | Cách làm | Công cụ | Lệnh chạy |
| --- | --- | --- | --- |
| 1. Kiểm thử đơn vị (Unit) | Gọi trực tiếp từng hàm thuần, không cần DB/server | **Vitest** | `npm run test:unit` |
| 2. Kiểm thử tích hợp API | Gọi HTTP qua app Express + MySQL test | **Vitest + Supertest** | `npm run test:api` |
| 3. Kiểm thử API thủ công | Chạy tay từng request, chụp minh chứng báo cáo | **Postman** | Import file JSON (mục 5) |
| 4. Kiểm thử giao diện | Bấm tay trên trình duyệt theo kịch bản | Chrome DevTools | Kịch bản ở mục 6 |

**Vì sao ưu tiên kiểm thử API?** Vì mọi thao tác trên giao diện đều đi qua API.
Nếu API đúng thì giao diện chỉ còn rủi ro về hiển thị. Ngược lại, nếu chỉ bấm
tay trên giao diện thì rất khó kiểm tra các trường hợp biên (số lượng âm, lý do
huỷ 501 ký tự, token giả mạo…).

> **Lưu ý phiên bản:** dự án chốt `vitest@1.6.1` (không dùng bản mới nhất) vì
> Vitest 5 đòi Vite 6–8, xung đột với Vite 5 của client. Cú pháp
> `describe/it/expect` hoàn toàn giống nhau.

---

## 2. Chuẩn bị môi trường

### 2.1. Yêu cầu

| Thành phần | Phiên bản đang dùng | Ghi chú |
| --- | --- | --- |
| Node.js | v26.7.0 | Cần từ v18 trở lên (bộ `.mjs` cũ dùng `fetch` có sẵn) |
| MySQL / MariaDB | MariaDB 10.4.32 | Chạy kèm XAMPP |
| npm | 11.19.0 | Cài kèm Node.js |

### 2.2. Bật MySQL

Kiểm thử tích hợp **bắt buộc** phải có MySQL đang chạy — backend không còn chế
độ chạy bằng dữ liệu giả. Nếu dùng XAMPP:

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
# Cài một lần ở thư mục gốc (workspaces tự cài cho server + client)
npm install
```

> ⚠️ **Không `npm install` khi dev server đang chạy.** Vite/tsx đang chạy mà
> `node_modules` bị ghi đè sẽ phục vụ bundle hỏng → web trắng màn. Tắt server
> trước, cài xong chạy lại.

### 2.4. Hai database: chính và kiểm thử

| Database | Mục đích | Khi nào dùng |
| --- | --- | --- |
| `kimdong_bookstore` | Dữ liệu demo/bán hàng thật | Chạy web, kiểm thử tay |
| `kimdong_bookstore_test` | Chạy test tự động | Mọi lệnh test API |

Khôi phục database kiểm thử về trạng thái gốc (12 sách, 3 tài khoản, 2 đơn):

```powershell
cd tests
.\reset-test-db.ps1
```

---

## 3. Cách 1 — Kiểm thử đơn vị bằng Vitest (nhanh nhất, không cần DB)

Kiểm tra từng hàm riêng lẻ trực tiếp trong bộ nhớ — **không cần MySQL, không
cần bật server**, xong trong vài giây.

```powershell
# Server: 30 test (promotion 18 + constants 12)
npm run test:unit --prefix server

# Client: 14 test (formatVND, formatDate, calculateDiscountPercent)
npm run test:unit --prefix client
```

| File | Hàm được test | Số ca |
| --- | --- | --- |
| `server/src/__tests__/promotion.unit.test.ts` | `evaluatePromotion` | 18 |
| `server/src/__tests__/constants.unit.test.ts` | `getStockStatus`, `LOW_STOCK_THRESHOLD` (= 20) | 12 |
| `client/src/__tests__/format.unit.test.ts` | `formatVND`, `formatDate`, `calculateDiscountPercent` | 14 |

Ví dụ một case (giảm 20% của đơn 100.000 = 20.000):

```ts
it('TC-U-PRM-03: giảm 20% của 100k = 20k', () => {
  const r = evaluatePromotion({ code: 'KIMDONG20', discount_type: 'PERCENTAGE',
    discount_value: 20, is_active: 1 }, 100000);
  expect(r.ok).toBe(true);
  expect(r.discount_amount).toBe(20000);
});
```

Muốn thêm case mới: mở file tương ứng, thêm một khối `it(...)` rồi chạy lại.

---

## 4. Cách 2 — Kiểm thử tích hợp API bằng Vitest + Supertest

Gọi HTTP thẳng vào app Express (không cần bật server thật) + MySQL test.
**53 test case** bao phủ đăng nhập, tìm kiếm/lọc sách, đặt hàng, danh mục và
phân quyền:

```powershell
# Chạy trên database KIỂM THỬ (mặc định, an toàn)
npm run test:api --prefix server
```

| File | Nhóm test case | Số ca |
| --- | --- | --- |
| `server/src/__tests__/auth.api.test.ts` | `TC-AUTH-01→07`: login đúng/sai, thiếu field, register, token giả | 7 |
| `server/src/__tests__/books.api.test.ts` | `TC-SEARCH`, `TC-FILTER`, `TC-BOOK`, `TC-PERM` (NV chỉ thêm/sửa; xóa + ngừng KD chỉ ADMIN) | 22 |
| `server/src/__tests__/orders.api.test.ts` | `TC-ORD-01→10`: đặt hàng, trừ/hoàn kho, confirm, khách tự hủy đơn của mình | 10 |
| `server/src/__tests__/categories.api.test.ts` | `TC-CAT`, `TC-PERM` (NV không xem users/sửa khách/quản lý banner) | 14 |

Để Supertest gọi được mà không cần bật server, app Express đã được tách ra
`server/src/app.ts` (chỉ export `app`), còn `server/src/index.ts` giữ việc
`listen`. Mỗi file test tự kết nối DB ở `beforeAll`, tự dọn dữ liệu mình tạo
ở `afterAll` — chạy xong database kiểm thử nguyên vẹn (12 sách, 2 đơn).

### 4.1. Chạy trên database chính (cẩn trọng)

```powershell
npm run test:api:maindb --prefix server
```

> ⚠️ Cách này tạo/xóa đơn hàng và sách **thật** trên database đang dùng. Chỉ
> dùng khi chấp nhận được. Khuyên dùng database kiểm thử (mục 2.4) thay thế.

### 4.2. Smoke test giao diện (render thật toàn app)

```powershell
npm test --prefix client   # 15 test: 14 unit format + 1 smoke render App
```

File `client/src/__tests__/app.smoke.test.tsx` render thật toàn bộ App bằng
happy-dom. Nếu component nào crash trắng màn, test này đỏ ngay — dùng để bắt
lỗi kiểu "return sớm trước hook".

---

## 5. Cách 3 — Bộ kiểm thử Node đời đầu (`.mjs`, không cần cài thêm)

Hai script tự viết, chạy bằng Node thuần (không dùng framework):

| Script | Nội dung | Chạy |
| --- | --- | --- |
| `tests/api-tests.mjs` | **253 test case**, 16 nhóm (AUTH → DASH), gọi HTTP tới server đang bật | `node tests/api-tests.mjs` (cần server ở 5000) |
| `tests/unit-tests.mjs` | **48 test case** cho 3 nhóm hàm thuần, không cần DB | `node tests/unit-tests.mjs` |

Chạy trọn gói cách ly (tự reset DB test → bật server cổng 5099 → chạy → tắt → xuất báo cáo):

```powershell
cd tests
.\run-tests.ps1
```

Tham số hay dùng: `-Runner run-postman.mjs` (chạy Postman),
`-Runner unit-tests.mjs` (chỉ unit), `-Runner both`, `-SkipReset` (chạy nhanh,
bỏ khôi phục DB), `-Port 5199` (đổi cổng khi 5099 bị chiếm).

> Bộ `.mjs` và bộ Vitest kiểm tra cùng nghiệp vụ bằng hai công nghệ khác nhau.
> Khi viết báo cáo: **Unit = Vitest test hàm thuần. Tích hợp = Vitest +
> Supertest test API + MySQL. API thủ công = Postman.**

---

## 6. Cách 4 — Chạy bằng Postman

Bộ sưu tập `tests/KIMDONG_API.postman_collection.json` gồm **13 folder, 249
request, 601 kiểm tra**. Dùng khi muốn xem trực quan từng request hoặc chụp
ảnh minh chứng cho báo cáo.

### 6.1. Import vào Postman

1. Mở Postman → **Import** → chọn file `tests/KIMDONG_API.postman_collection.json`
2. Vào tab **Variables** của bộ sưu tập, kiểm tra biến `baseUrl`
   (mặc định `http://localhost:5000/api`)
3. Bấm **Run** để chạy toàn bộ, hoặc bấm từng request để chạy riêng

### 6.2. Token được lấy tự động

Bạn **không cần** đăng nhập thủ công. Pre-request Script của bộ sưu tập sẽ tự
gọi `POST /auth/login` cho cả 3 tài khoản demo và lưu token vào biến
`adminToken`, `empToken`, `cusToken`.

### 6.3. Chạy bằng dòng lệnh (không cần cài Newman)

```powershell
cd tests
.\run-tests.ps1 -Runner run-postman.mjs
```

Kết quả xuất ra `tests/KET_QUA_POSTMAN.md`.

### 6.4. Lưu ý về thứ tự chạy

Các request **phải chạy theo đúng thứ tự** vì nhiều request dùng biến do request
trước tạo ra, ví dụ `{{newBookId}}`, `{{cartItemId}}`, `{{orderId}}`. Nếu chạy
lẻ một request ở giữa, biến có thể chưa có giá trị.

---

## 7. Cách 5 — Kiểm thử thủ công trên giao diện

Với những phần khó tự động hoá (bố cục, màu sắc, hiệu ứng, khả năng dùng trên
điện thoại), hãy kiểm thử bằng tay.

### 7.1. Bật cả hai server

```powershell
npm run dev:server
npm run dev:client
```

Sau đó mở:

| Địa chỉ | Nội dung |
| --- | --- |
| http://localhost:3000 | Giao diện khách hàng |
| http://localhost:3000/admin | Trang quản trị |
| http://localhost:5000/api/health | Kiểm tra API + đang đọc database nào |

### 7.2. Tài khoản demo

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Quản trị viên | `admin@kimdong.vn` | `admin123` |
| Nhân viên | `nhanvien@kimdong.vn` | `admin123` |
| Khách hàng | `khachhang@gmail.com` | `user123` |

### 7.3. Kịch bản nên kiểm tra tay

1. **Luồng mua hàng trọn vẹn:** đăng nhập khách → tìm sách → thêm vào giỏ
   (chưa đăng nhập phải bị chặn) → đặt hàng → xem đơn trong tài khoản →
   quản trị xác nhận → chuyển trạng thái → giao thành công
2. **Khách tự hủy đơn:** hủy đơn PENDING của mình (được), hủy đơn đang giao
   (bị chặn), hủy đơn người khác (bị chặn 403)
3. **Xóa / ngừng kinh doanh sách:** nhân viên không thấy nút Xóa/Ngừng KD;
   admin ngừng KD → sách ẩn khỏi trang bán, mở bán lại hiện về
4. **Phân quyền:** đăng nhập nhân viên, menu Banner và Tài Khoản Hệ Thống phải
   biến mất; gõ tay `/admin/banners` phải bị chặn
5. **Thanh toán mô phỏng:** chọn BANKING/MOMO phải thấy nhãn "MÔ PHỎNG DEMO",
   chưa tick xác nhận thì không đặt được đơn
6. **Hiển thị:** thu nhỏ cửa sổ xuống cỡ điện thoại, kiểm tra menu và bảng biểu
7. **Tiếng Việt:** nhập tên sách có dấu, kiểm tra lưu và hiển thị đúng

---

## 8. Đọc kết quả

### 8.1. Báo cáo

| File | Nội dung |
| --- | --- |
| `tests/KET_QUA_KIEM_THU.md` | Kết quả bộ 253 test case `.mjs` |
| `tests/KET_QUA_KIEM_THU_DON_VI.md` | Kết quả bộ 48 test case đơn vị `.mjs` |
| `tests/KET_QUA_POSTMAN.md` | Kết quả bộ sưu tập Postman theo từng folder |
| Output terminal Vitest | `Test Files X passed / Tests Y passed` |

### 8.2. Mã thoát

| Mã | Ý nghĩa |
| --- | --- |
| `0` | Toàn bộ kiểm thử đạt |
| `1` | Có kiểm thử không đạt (xem tên case đỏ trên terminal) |

### 8.3. Khi có kiểm thử không đạt

1. **Xác định lỗi nằm ở đâu.** Đọc tên test case đỏ, đối chiếu mã TC với code.
2. **Kiểm tra dữ liệu mẫu.** Nhiều trường hợp sai vì database không ở trạng thái
   gốc. Với Vitest: reset DB test (`.\reset-test-db.ps1`) rồi chạy lại. Với bộ
   `.mjs`: chạy lại `.\run-tests.ps1` (không dùng `-SkipReset`).
3. **Phân biệt lỗi sản phẩm và lỗi kỳ vọng.** Nếu API trả về đúng theo thiết kế
   thì sửa lại kỳ vọng trong test; nếu API trả sai thì sửa mã nguồn.
4. **Ngưỡng tồn kho đã đổi 100 → 20.** Nếu test nhóm `TC-U-STK-*` đỏ, kiểm tra
   `LOW_STOCK_THRESHOLD` trong `server/src/config/constants.ts` trước.
5. **Ghi lại lỗi.** Dùng mẫu nhật ký lỗi ở Kế hoạch kiểm thử §13.

---

## 9. Câu hỏi thường gặp

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

### Trắng màn sau khi `npm install` / sửa code

Nguyên nhân thường gặp nhất: **return sớm trước hook** trong component React
(guard `Navigate` đặt trước `useEffect`/`useState`) → React crash toàn app.
Quy tắc: guard điều hướng luôn đặt **sau mọi hook**. Bộ smoke test
(`app.smoke.test.tsx`) sẽ bắt lỗi này khi chạy `npm test --prefix client`.

Nguyên nhân thứ hai: `npm install` trong lúc dev server đang chạy làm hỏng
cache Vite. Tắt server, xóa `client/node_modules/.vite`, chạy lại.

### Database chính bị thay đổi ngoài ý muốn

Script `reset-test-db.ps1` đã xử lý việc này: nó **loại bỏ** các dòng
`CREATE DATABASE` và `USE` trong file SQL trước khi nạp, nên không bao giờ ghi
nhầm vào database chính. Nếu bạn tự nạp SQL bằng tay, hãy nhớ rằng cả
`database/schema.sql` và `database/seed.sql` đều chứa dòng
`USE \`kimdong_bookstore\`;` — dòng này sẽ **ghi đè** tham số `-D`, khiến dữ liệu
chảy vào database chính.

Bộ Vitest API mặc định chạy trên database kiểm thử (`DB_NAME` qua
`test:api`/`test`). Chỉ script `test:api:maindb` mới đụng database chính.

### Muốn thêm test case mới

**Với Vitest API:** mở file trong `server/src/__tests__/` tương ứng nhóm chức
năng, thêm một khối `it(...)`:

```ts
it('TC-ORD-99: mô tả ngắn', async () => {
  const res = await request(app).get('/api/orders/1')
    .set('Authorization', `Bearer ${adminToken}`);
  expect(res.status).toBe(200);
});
```

Nhớ thêm id đơn/sách tạo ra vào mảng dọn dẹp (`createdOrderIds` hoặc xóa tay
trong `afterAll`) để database kiểm thử không phình.

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

## 10. Tóm tắt nhanh

```powershell
# 1. Bật MySQL (XAMPP Control Panel -> Start MySQL)

# 2. Unit (không cần DB, vài giây)
npm run test:unit --prefix server
npm run test:unit --prefix client

# 3. Tích hợp API (tự dùng database kiểm thử)
npm run test:api --prefix server

# 4. Bộ đời đầu + Postman (server riêng cổng 5099)
cd tests
.\run-tests.ps1
.\run-tests.ps1 -Runner run-postman.mjs
```

Đó là tất cả những gì cần làm.
