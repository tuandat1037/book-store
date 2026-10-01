import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { initDatabase, closeDatabase } from '../config/db.js';

/**
 * 5. Kiểm thử giỏ hàng — bám đúng bảng báo cáo TC-CART-01 → 05.
 * Lưu ý: các case chạy nối tiếp nhau (dùng chung 1 giỏ).
 * Chạy: npx vitest run src/__tests__/cart.api.test.ts
 */
let customerToken = '';

beforeAll(async () => {
  await initDatabase();
  const c = await request(app).post('/api/auth/login').send({ email: 'khachhang@gmail.com', password: 'user123' });
  customerToken = c.body.token;
}, 30000);

afterAll(async () => {
  try {
    await request(app).delete('/api/cart/clear')
      .set('Authorization', `Bearer ${customerToken}`);
  } finally {
    await closeDatabase();
  }
});

const auth = () => ({ Authorization: `Bearer ${customerToken}` });

async function cartLines() {
  const res = await request(app).get('/api/cart').set(auth());
  expect(res.status).toBe(200);
  return res.body.items ?? [];
}

describe('5. Kiểm thử giỏ hàng', () => {
  it('TC-CART-01: xóa sạch khỏi giỏ -> giỏ trống', async () => {
    const clear = await request(app).delete('/api/cart/clear').set(auth());
    expect(clear.status).toBe(200);
    expect(await cartLines()).toEqual([]);
  });

  it('TC-CART-02: thêm sách id=1, SL=2 -> đúng 1 dòng, SL=2', async () => {
    const add = await request(app).post('/api/cart/items').set(auth())
      .send({ book_id: 1, quantity: 2 });
    expect([200, 201]).toContain(add.status);
    const lines = await cartLines();
    expect(lines.length).toBe(1);
    expect(Number(lines[0].quantity)).toBe(2);
  });

  it('TC-CART-03: thêm cùng sách SL=3 nữa -> không dòng mới, cộng dồn = 5', async () => {
    const add = await request(app).post('/api/cart/items').set(auth())
      .send({ book_id: 1, quantity: 3 });
    expect([200, 201]).toContain(add.status);
    const lines = await cartLines();
    expect(lines.length).toBe(1);
    expect(Number(lines[0].quantity)).toBe(5);
  });

  it('TC-CART-04: thêm sách id=999999 -> giỏ giữ nguyên', async () => {
    const add = await request(app).post('/api/cart/items').set(auth())
      .send({ book_id: 999999, quantity: 1 });
    expect([400, 404]).toContain(add.status);
    const lines = await cartLines();
    expect(lines.length).toBe(1);
    expect(Number(lines[0].quantity)).toBe(5);
  });

  it('TC-CART-05: thêm SL=99999 (vượt tồn) -> báo số tồn còn lại', async () => {
    const add = await request(app).post('/api/cart/items').set(auth())
      .send({ book_id: 1, quantity: 99999 });
    expect(add.status).toBe(400);
    expect(String(add.body.message)).toMatch(/chỉ còn \d+/);
  });
});
