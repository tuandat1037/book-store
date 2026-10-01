import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { initDatabase, closeDatabase, query } from '../config/db.js';

/**
 * 7. Kiểm thử quản lý sách — bám đúng bảng báo cáo TC-BOOK-01 → 05.
 * Chạy: npx vitest run src/__tests__/books.api.test.ts
 */
let adminToken = '';
let customerToken = '';
let bookId = 0;
const createdBookIds: number[] = [];

beforeAll(async () => {
  await initDatabase();
  const a = await request(app).post('/api/auth/login').send({ email: 'admin@kimdong.vn', password: 'admin123' });
  adminToken = a.body.token;
  const c = await request(app).post('/api/auth/login').send({ email: 'khachhang@gmail.com', password: 'user123' });
  customerToken = c.body.token;
}, 30000);

afterAll(async () => {
  try {
    for (const id of createdBookIds) {
      const rows: any[] = await query('SELECT id FROM books WHERE id = ?', [id]);
      if (rows.length > 0) {
        await query('DELETE FROM book_images WHERE book_id = ?', [id]);
        await query('DELETE FROM books WHERE id = ?', [id]);
      }
    }
  } finally {
    await closeDatabase();
  }
});

const admin = () => ({ Authorization: `Bearer ${adminToken}` });

async function bookIds() {
  const res = await request(app).get('/api/books?limit=1000');
  expect(res.status).toBe(200);
  return (res.body.books ?? []).map((b: any) => Number(b.id));
}

describe('7. Kiểm thử quản lý sách', () => {
  it('TC-BOOK-01: admin tạo sách thiếu thông tin -> tổng sách không đổi', async () => {
    const before = await bookIds();
    const res = await request(app).post('/api/books').set(admin()).send({ price: 50000 });
    expect(res.status).toBe(400);
    expect(await bookIds()).toEqual(before);
  });

  it('TC-BOOK-02: admin tạo đủ field -> sách mới xuất hiện trong danh sách', async () => {
    const res = await request(app).post('/api/books').set(admin()).send({
      title: `Sách BC ${Date.now()}`, category_id: 6, author_id: 1,
      publisher_id: 1, price: 50000, stock: 10
    });
    expect([200, 201]).toContain(res.status);
    bookId = Number(res.body.bookId ?? res.body.id);
    createdBookIds.push(bookId);
    expect(await bookIds()).toContain(bookId);
  });

  it('TC-BOOK-03: xóa sách vừa tạo rồi GET /books -> id không còn', async () => {
    const del = await request(app).delete(`/api/books/${bookId}`).set(admin());
    expect(del.status).toBe(200);
    expect(await bookIds()).not.toContain(bookId);
  });

  it('TC-BOOK-04: khách gọi ?status=INACTIVE -> không lọt sách ngừng KD', async () => {
    const created = await request(app).post('/api/books').set(admin()).send({
      title: `Sách KD ${Date.now()}`, category_id: 6, author_id: 1,
      publisher_id: 1, price: 30000, stock: 5
    });
    bookId = Number(created.body.bookId ?? created.body.id);
    createdBookIds.push(bookId);
    await request(app).put(`/api/books/${bookId}`).set(admin()).send({ status: 'INACTIVE' });
    const res = await request(app).get('/api/books?limit=1000&status=INACTIVE')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect((res.body.books ?? []).map((b: any) => Number(b.id))).not.toContain(bookId);
  });

  it('TC-BOOK-05: mở bán lại (status = ACTIVE) -> hiện lại ở list thường', async () => {
    const on = await request(app).put(`/api/books/${bookId}`).set(admin()).send({ status: 'ACTIVE' });
    expect(on.status).toBe(200);
    expect(await bookIds()).toContain(bookId);
    await request(app).delete(`/api/books/${bookId}`).set(admin());
  });
});
