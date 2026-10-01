# Thanh toán mô phỏng (không tích hợp cổng thật)

> Dùng cho báo cáo đồ án và trả lời phản biện. Kết luận trước: **toàn bộ
> thanh toán online trong đồ án là MÔ PHỎNG, không kết nối VNPay / MoMo /
> ngân hàng thật, không trừ tiền thật.**

## 1. Phạm vi mô phỏng

| Phương thức | Luồng | `payment_status` lúc tạo đơn |
| --- | --- | --- |
| COD | Thu tiền mặt khi giao hàng | `UNPAID` |
| BANKING (chuyển khoản) | Khách xem STK demo của shop, tick xác nhận đã chuyển (mô phỏng) | `PAID` |
| MOMO (ví điện tử) | Khách xem số ví demo của shop, tick xác nhận đã chuyển (mô phỏng) | `PAID` |

## 2. Luồng mô phỏng chi tiết (phía khách)

1. Trang Checkout (`client/src/pages/CheckoutPage.tsx`): hai phương thức
   online gắn nhãn **"MÔ PHỎNG DEMO"** kèm dòng giải thích
   "không kết nối cổng thanh toán thật, không trừ tiền thật".
2. Khách **bắt buộc tick checkbox** "Tôi đã chuyển khoản demo..." thì nút
   "XÁC NHẬN ĐẶT HÀNG" mới gửi đơn (`handleSubmitOrder` chặn nếu chưa tick).
3. Server (`server/src/controllers/orderController.ts`, `createOrder`) ghi
   nhận `payment_status = 'PAID'` cho BANKING/MOMO mà **không có bước đối
   soát** (xem comment `MÔ PHỎNG THANH TOÁN` trong code).
4. Trang thành công (`OrderSuccessPage.tsx`) hiển thị
   "Chuyển khoản ngân hàng (mô phỏng demo)" / "Ví MoMo (mô phỏng demo)".

## 3. Hệ quả nghiệp vụ của việc mô phỏng

- Đơn BANKING/MOMO bị hủy sẽ chuyển `payment_status` thành `REFUNDED`
  (`cancelOrder`), nhưng đây chỉ là **cờ trạng thái trong DB**, không có
  giao dịch hoàn tiền thật.
- Shop phải đối soát thủ công (xem sao kê) trước khi xác nhận đơn —
  phù hợp quy mô đồ án, không phù hợp vận hành thật.

## 4. Nếu tích hợp thật thì sửa ở đâu (hướng phát triển)

1. Lúc tạo đơn: luôn ghi `payment_status = 'UNPAID'`, trả về đơn PENDING.
2. Gọi API tạo giao dịch của VNPay/MoMo, redirect khách sang cổng thật.
3. Thêm endpoint callback/IPN (xác thực chữ ký) rồi mới
   `UPDATE orders SET payment_status = 'PAID'`.
4. Thêm job đối soát + hoàn tiền qua API của cổng khi hủy đơn.

## 5. Minh chứng trong code

- `client/src/pages/CheckoutPage.tsx`: nhãn `MÔ PHỎNG DEMO`,
  state `transferConfirmed`, chặn submit khi chưa tick.
- `server/src/controllers/orderController.ts`: comment
  `MÔ PHỎNG THANH TOÁN` tại `createOrder`.
- DB kiểm chứng: `SELECT order_code, payment_method, payment_status
  FROM orders;` — đơn BANKING/MOMO luôn `PAID` ngay khi tạo, không có
  bảng giao dịch (`transactions`) nào đi kèm.
