import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { initDatabase, closeDatabase } from '../config/db.js';

/**
 * 2. Kiểm thử tìm kiếm sách — bám đúng bảng báo cáo TC-SEARCH-01 → 04.
 * Chạy: npx vitest run src/__tests__/search.api.test.ts
 */
beforeAll(async () => {
  await initDatabase();
}, 30000);

afterAll(async () => {
  await closeDatabase();
});

describe('2. Kiểm thử tìm kiếm sách', () => {
  it('TC-SEARCH-01: q=Doraemon -> books >0, tiêu đề chứa "Doraemon"', async () => {
    const res = await request(app).get('/api/books?q=Doraemon');
    expect(res.status).toBe(200);
    const books = res.body.books ?? [];
    expect(books.length).toBeGreaterThan(0);
    expect(books.some((b: any) => String(b.title).toLowerCase().includes('doraemon'))).toBe(true);
  });

  it('TC-SEARCH-02: q=xyz -> kết quả rỗng', async () => {
    const res = await request(app).get('/api/books?q=xyz');
    expect(res.status).toBe(200);
    expect(res.body.books ?? []).toEqual([]);
  });

  it('TC-SEARCH-03: q rỗng -> toàn bộ sách', async () => {
    const res = await request(app).get('/api/books?q=');
    expect(res.status).toBe(200);
    const all = await request(app).get('/api/books');
    expect((res.body.books ?? []).length).toBeGreaterThan(0);
    expect((res.body.books ?? []).length).toBe((all.body.books ?? []).length);
  });

  it('TC-SEARCH-04: q=doraemon viết thường -> như bình thường', async () => {
    const lower = await request(app).get('/api/books?q=doraemon');
    expect(lower.status).toBe(200);
    expect((lower.body.books ?? []).length).toBeGreaterThan(0);
    const upper = await request(app).get('/api/books?q=Doraemon');
    expect((lower.body.books ?? []).length).toBe((upper.body.books ?? []).length);
  });
});
