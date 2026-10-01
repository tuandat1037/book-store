import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { initDatabase, closeDatabase, queryOne, query } from '../config/db.js';

/**
 * 6. Kiểm thử đặt hàng — bám đúng bảng báo cáo TC-ORD-01 → 05.
 * Chạy: npx vitest run src/__tests__/orders.api.test.ts
 */
let adminToken = '';
let customerToken = '';
let orderId = 0;
let stockBefore = 0;
const createdOrderIds: number[] = [];
const BOOK_ID = 1;

const SHIP = {
  customer_name: 'Nguyễn Văn An',
  customer_email: 'khachhang@gmail.com',
  customer_phone: '0987654321',
  shipping_address: '123 Nguyễn Trãi',
  shipping_province: 'TP. Hồ Chí Minh',
  shipping_district: 'Quận 1',
  shipping_ward: 'Bến Thành',
  payment_method: 'COD'
};

beforeAll(async () => {
  await initDatabase();
  const a = await request(app).post('/api/auth/login').send({ email: 'admin@kimdong.vn', password: 'admin123' });
  adminToken = a.body.token;
  const c = await request(app).post('/api/auth/login').send({ email: 'khachhang@gmail.com', password: 'user123' });
  customerToken = c.body.token;
  const b = await queryOne('SELECT stock FROM books WHERE id = ?', [BOOK_ID]);
  stockBefore = Number((b as any)?.stock ?? 0);
}, 30000);

afterAll(async () => {
  // Dọn đơn test: đơn chưa hủy -> cộng lại kho rồi xóa; đơn hủy rồi -> xóa thẳng.
  try {
    for (const id of createdOrderIds) {
      const items: any[] = await query('SELECT book_id, quantity FROM order_items WHERE order_id = ?', [id]);
      const ord: any = await queryOne('SELECT order_status FROM orders WHERE id = ?', [id]);
      if (ord && ord.order_status !== 'CANCELLED') {
        for (const it of items) {
          await query('UPDATE books SET stock = stock + ? WHERE id = ?', [Number(it.quantity), it.book_id]);
        }
      }
      await query('DELETE FROM order_items WHERE order_id = ?', [id]);
      await query('DELETE FROM orders WHERE id = ?', [id]);
    }
  } finally {
    await closeDatabase();
  }
});

const cus = () => ({ Authorization: `Bearer ${customerToken}` });

describe('6. Kiểm thử đặt hàng', () => {
  it('TC-ORD-01: 1 sách SL=2, COD, đủ địa chỉ -> orderCode hợp lệ, PENDING', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set(cus())
      .send({ ...SHIP, items: [{ book_id: BOOK_ID, quantity: 2 }] });
    expect(res.status).toBe(201);
    expect(res.body.orderCode ?? res.body.order_code).toBeDefined();
    orderId = Number(res.body.orderId ?? res.body.id);
    createdOrderIds.push(orderId);
    expect(orderId).toBeGreaterThan(0);
    const got = await request(app).get(`/api/orders/${orderId}`).set(cus());
    expect(got.body.order?.order_status).toBe('PENDING');
  });

  it('TC-ORD-02: SL=999999 -> nêu tồn còn lại, không tạo đơn', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set(cus())
      .send({ ...SHIP, items: [{ book_id: BOOK_ID, quantity: 999999 }] });
    expect(res.status).toBe(400);
    expect(String(res.body.message)).toMatch(/còn \d+/);
    expect(res.body.orderId ?? res.body.orderCode).toBeUndefined();
  });

  it('TC-ORD-03: thiếu địa chỉ giao hàng -> đúng thông báo', async () => {
    const { shipping_address: _omit, ...rest } = SHIP;
    const res = await request(app)
      .post('/api/orders')
      .set(cus())
      .send({ ...rest, items: [{ book_id: BOOK_ID, quantity: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Vui lòng cung cấp đầy đủ thông tin giao hàng');
  });

  it('TC-ORD-04: khách hủy đơn PENDING của mình -> tồn kho hoàn lại', async () => {
    const cancel = await request(app)
      .put(`/api/orders/${orderId}/cancel`)
      .set(cus())
      .send({ reason: 'Tôi đặt nhầm sách, muốn hủy đơn' });
    expect(cancel.status).toBe(200);
    expect(cancel.body.order_status).toBe('CANCELLED');
    const b = await queryOne('SELECT stock FROM books WHERE id = ?', [BOOK_ID]);
    expect(Number((b as any)?.stock)).toBe(stockBefore);
  });

  it('TC-ORD-05: khách hủy đơn SHIPPING của mình -> liên hệ shop, giữ SHIPPING', async () => {
    const created = await request(app)
      .post('/api/orders')
      .set(cus())
      .send({ ...SHIP, items: [{ book_id: BOOK_ID, quantity: 1 }] });
    expect(created.status).toBe(201);
    const id = Number(created.body.orderId);
    createdOrderIds.push(id);
    await request(app).put(`/api/orders/${id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ order_status: 'SHIPPING' });
    const cancel = await request(app)
      .put(`/api/orders/${id}/cancel`)
      .set(cus())
      .send({ reason: 'Muốn hủy đơn đang giao' });
    expect(cancel.status).toBe(400);
    expect(String(cancel.body.message)).toMatch(/liên hệ/);
    const got = await request(app).get(`/api/orders/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(got.body.order?.order_status).toBe('SHIPPING');
  });
});
