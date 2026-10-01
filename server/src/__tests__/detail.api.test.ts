import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { initDatabase, closeDatabase } from '../config/db.js';

/**
 * 4. Kiểm thử xem chi tiết sách — bám đúng bảng báo cáo TC-BDT-01 → 03.
 * Chạy: npx vitest run src/__tests__/detail.api.test.ts
 */
beforeAll(async () => {
  await initDatabase();
}, 30000);

afterAll(async () => {
  await closeDatabase();
});

describe('4. Kiểm thử xem chi tiết sách', () => {
  it('TC-BDT-01: sách id=1 -> đúng sách + ảnh + liên quan', async () => {
    const res = await request(app).get('/api/books/1');
    expect(res.status).toBe(200);
    expect(Number(res.body.book?.id)).toBe(1);
    expect(Array.isArray(res.body.images)).toBe(true);
    expect((res.body.images ?? []).length).toBeGreaterThan(0);
    expect(Array.isArray(res.body.related)).toBe(true);
  });

  it('TC-BDT-02: books/doraemon-tap-1 -> đúng sách', async () => {
    const res = await request(app).get('/api/books/doraemon-tap-1');
    expect(res.status).toBe(200);
    expect(res.body.book?.slug).toBe('doraemon-tap-1');
    expect(Number(res.body.book?.id)).toBe(1);
  });

  it('TC-BDT-03: sách không có trong hệ thống -> 404', async () => {
    const res = await request(app).get('/api/books/999999');
    expect(res.status).toBe(404);
  });
});
