import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { initDatabase, closeDatabase } from '../config/db.js';

/**
 * 3. Kiểm thử lọc sách — bám đúng bảng báo cáo TC-FILTER-01 → 04.
 * Chạy: npx vitest run src/__tests__/filter.api.test.ts
 */
beforeAll(async () => {
  await initDatabase();
}, 30000);

afterAll(async () => {
  await closeDatabase();
});

describe('3. Kiểm thử lọc sách', () => {
  it('TC-FILTER-01: category_id=6 -> 100% sách đúng danh mục 6', async () => {
    const res = await request(app).get('/api/books?category_id=6&limit=100');
    expect(res.status).toBe(200);
    const books = res.body.books ?? [];
    expect(books.length).toBeGreaterThan(0);
    expect(books.every((b: any) => Number(b.category_id) === 6)).toBe(true);
  });

  it('TC-FILTER-02: category_id=999999 -> mảng rỗng', async () => {
    const res = await request(app).get('/api/books?category_id=999999');
    expect(res.status).toBe(200);
    expect(res.body.books ?? []).toEqual([]);
  });

  it('TC-FILTER-03: min_price=20000&max_price=30000 -> giá trong khoảng', async () => {
    const res = await request(app).get('/api/books?min_price=20000&max_price=30000&limit=100');
    expect(res.status).toBe(200);
    for (const b of res.body.books ?? []) {
      const price = Number(b.sale_price ?? b.price);
      expect(price).toBeGreaterThanOrEqual(20000);
      expect(price).toBeLessThanOrEqual(30000);
    }
  });

  it('TC-FILTER-04: min_price > max_price -> 400 + message', async () => {
    const res = await request(app).get('/api/books?min_price=50000&max_price=20000');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Giá tối thiểu không được lớn hơn giá tối đa');
  });
});
