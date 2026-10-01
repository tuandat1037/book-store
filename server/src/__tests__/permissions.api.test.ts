import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { initDatabase, closeDatabase, query } from '../config/db.js';

/**
 * 9. Kiểm thử phân quyền — bám đúng bảng báo cáo TC-PERM-01 → 05.
 * Chạy: npx vitest run src/__tests__/permissions.api.test.ts
 */
let adminToken = '';
let employeeToken = '';
let customerToken = '';
let bookId = 0;

beforeAll(async () => {
  await initDatabase();
  const a = await request(app).post('/api/auth/login').send({ email: 'admin@kimdong.vn', password: 'admin123' });
  adminToken = a.body.token;
  const e = await request(app).post('/api/auth/login').send({ email: 'nhanvien@kimdong.vn', password: 'admin123' });
  employeeToken = e.body.token;
  const c = await request(app).post('/api/auth/login').send({ email: 'khachhang@gmail.com', password: 'user123' });
  customerToken = c.body.token;
}, 30000);

afterAll(async () => {
  try {
    if (bookId) {
      await query('DELETE FROM book_images WHERE book_id = ?', [bookId]);
      await query('DELETE FROM books WHERE id = ?', [bookId]);
    }
  } finally {
    await closeDatabase();
  }
});

const emp = () => ({ Authorization: `Bearer ${employeeToken}` });
const cus = () => ({ Authorization: `Bearer ${customerToken}` });

describe('9. Kiểm thử phân quyền', () => {
  it('TC-PERM-01: customer POST /books -> không có quyền', async () => {
    const res = await request(app).post('/api/books').set(cus())
      .send({ title: 'X', price: 1000 });
    expect(res.status).toBe(403);
  });

  it('TC-PERM-02: customer GET /users -> chỉ ADMIN', async () => {
    const res = await request(app).get('/api/users').set(cus());
    expect(res.status).toBe(403);
  });

  it('TC-PERM-03: employee POST /books -> được thêm/sửa sách', async () => {
    const created = await request(app).post('/api/books').set(emp()).send({
      title: `Sách PQ ${Date.now()}`, category_id: 6,
      author_id: 1, publisher_id: 1, price: 30000, stock: 5
    });
    expect([200, 201]).toContain(created.status);
    bookId = Number(created.body.bookId ?? created.body.id);
    const updated = await request(app).put(`/api/books/${bookId}`).set(emp())
      .send({ price: 31000 });
    expect(updated.status).toBe(200);
    await request(app).delete(`/api/books/${bookId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    bookId = 0;
  });

  it('TC-PERM-04: employee GET /users -> chỉ ADMIN', async () => {
    const res = await request(app).get('/api/users').set(emp());
    expect(res.status).toBe(403);
  });

  it('TC-PERM-05: employee xem/tạo banner -> độc quyền admin', async () => {
    const view = await request(app).get('/api/banners/all').set(emp());
    expect(view.status).toBe(403);
    const create = await request(app).post('/api/banners').set(emp())
      .send({ title: 'X', cta_link: '/books' });
    expect(create.status).toBe(403);
  });
});
