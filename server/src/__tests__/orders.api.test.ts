import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { initDatabase, closeDatabase, queryOne, query } from '../config/db.js';

/**
 * Kiểm thử tích hợp ORDERS: POST /api/orders, PUT confirm/cancel/status
 * Luồng: tạo đơn -> check trừ kho -> confirm -> confirm lại -> cancel hoàn kho
 */
let adminToken = '';
let stockBefore = 0;
let orderId = 0;
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
  const b = await queryOne('SELECT stock FROM books WHERE id = ?', [BOOK_ID]);
  stockBefore = Number((b as any)?.stock ?? 0);
}, 30000);

afterAll(async () => {
  // Dọn đơn tạo trong test để không làm lệch tồn kho/seed:
  // đơn CANCELLED đã hoàn kho -> xóa thẳng; đơn DELIVERED -> cộng lại kho rồi xóa.
  try {
    for (const id of createdOrderIds) {
      const items: any[] = await query('SELECT book_id, quantity FROM order_items WHERE order_id = ?', [id]);
      const ord: any = await queryOne('SELECT order_status FROM orders WHERE id = ?', [id]);
      if (ord?.order_status === 'DELIVERED') {
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

describe('Đặt hàng POST /api/orders', () => {
  it('TC-ORD-01: đặt [{book_id:1, qty:2}] COD -> 201 + orderCode', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ ...SHIP, items: [{ book_id: BOOK_ID, quantity: 2 }] });
    expect(res.status).toBe(201);
    expect(res.body.orderCode ?? res.body.order_code).toBeDefined();
    orderId = Number(res.body.orderId ?? res.body.id);
    createdOrderIds.push(orderId);
    expect(orderId).toBeGreaterThan(0);
  });

  it('TC-ORD-02: đặt vượt tồn kho -> 400', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ ...SHIP, items: [{ book_id: BOOK_ID, quantity: 999999 }] });
    expect(res.status).toBe(400);
  });

  it('TC-ORD-03: thiếu shipping_address -> 400', async () => {
    const { shipping_address: _omit, ...rest } = SHIP;
    const res = await request(app)
      .post('/api/orders')
      .send({ ...rest, items: [{ book_id: BOOK_ID, quantity: 1 }] });
    expect(res.status).toBe(400);
  });

  it('TC-ORD-04: tồn kho trừ ngay sau đặt (giảm 2)', async () => {
    const b = await queryOne('SELECT stock FROM books WHERE id = ?', [BOOK_ID]);
    expect(Number((b as any)?.stock)).toBe(stockBefore - 2);
  });

  it('TC-ORD-05: confirm -> CONFIRMED, confirm lại -> không đổi', async () => {
    const c1 = await request(app)
      .put(`/api/orders/${orderId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(c1.status).toBe(200);
    const g1 = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(g1.body.order?.order_status).toBe('CONFIRMED');

    const c2 = await request(app)
      .put(`/api/orders/${orderId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(c2.status).toBe(200);
    expect(c2.body.already_confirmed).toBe(true);
  });

  it('TC-ORD-06: cancel reason <5 ký tự -> 400; reason hợp lệ -> 200 + hoàn kho', async () => {
    const bad = await request(app)
      .put(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'huy' });
    expect(bad.status).toBe(400);

    const good = await request(app)
      .put(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Khách đổi ý, hủy đơn test' });
    expect(good.status).toBe(200);

    const b = await queryOne('SELECT stock FROM books WHERE id = ?', [BOOK_ID]);
    expect(Number((b as any)?.stock)).toBe(stockBefore);
  });

  it('TC-ORD-07: đã DELIVERED thì không cancel được -> 400', async () => {
    // Tạo đơn mới, đẩy SHIPPING -> DELIVERED rồi cancel
    const created = await request(app)
      .post('/api/orders')
      .send({ ...SHIP, items: [{ book_id: BOOK_ID, quantity: 1 }] });
    const id = Number(created.body.orderId);
    createdOrderIds.push(id);
    await request(app).put(`/api/orders/${id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ order_status: 'SHIPPING' });
    await request(app).put(`/api/orders/${id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ order_status: 'DELIVERED' });
    const cancel = await request(app)
      .put(`/api/orders/${id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Muốn hủy đơn đã giao' });
    expect(cancel.status).toBe(400);
    // dọn: đơn DELIVERED giữ nguyên (không hoàn kho) — đúng nghiệp vụ
  });
});
