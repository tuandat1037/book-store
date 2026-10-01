import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { initDatabase, closeDatabase } from '../config/db.js';

/**
 * 8. Kiểm thử quản lý danh mục — bám đúng bảng báo cáo TC-CAT-01 → 05.
 * Chạy: npx vitest run src/__tests__/categories.api.test.ts
 */
let adminToken = '';
let catId = 0;

beforeAll(async () => {
  await initDatabase();
  const a = await request(app).post('/api/auth/login').send({ email: 'admin@kimdong.vn', password: 'admin123' });
  adminToken = a.body.token;
}, 30000);

afterAll(async () => {
  try {
    if (catId) {
      await request(app).delete(`/api/categories/${catId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
  } finally {
    await closeDatabase();
  }
});

const admin = () => ({ Authorization: `Bearer ${adminToken}` });

describe('8. Kiểm thử quản lý danh mục', () => {
  it('TC-CAT-01: GET /categories -> hiển thị đủ danh mục', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect((res.body.raw ?? []).length).toBeGreaterThan(0);
    expect(Array.isArray(res.body.categories)).toBe(true);
  });

  it('TC-CAT-02: tạo thiếu name -> thông báo "Tên danh mục là bắt buộc"', async () => {
    const res = await request(app).post('/api/categories').set(admin())
      .send({ description: 'Thiếu tên' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Tên danh mục là bắt buộc');
  });

  it('TC-CAT-03: tạo tên mới hợp lệ -> lưu vào danh sách', async () => {
    const name = `DM BC ${Date.now()}`;
    const res = await request(app).post('/api/categories').set(admin())
      .send({ name, description: 'Danh mục test báo cáo' });
    expect([200, 201]).toContain(res.status);
    catId = Number(res.body.categoryId ?? res.body.id);
    const list = await request(app).get('/api/categories');
    expect((list.body.raw ?? []).map((c: any) => Number(c.id))).toContain(catId);
  });

  it('TC-CAT-04: xóa danh mục rỗng vừa tạo -> biến mất', async () => {
    const del = await request(app).delete(`/api/categories/${catId}`).set(admin());
    expect(del.status).toBe(200);
    const list = await request(app).get('/api/categories');
    expect((list.body.raw ?? []).map((c: any) => Number(c.id))).not.toContain(catId);
    catId = 0;
  });

  it('TC-CAT-05: xóa danh mục còn sách (id=6) -> còn nguyên', async () => {
    const del = await request(app).delete('/api/categories/6').set(admin());
    expect(del.status).toBe(400);
    const list = await request(app).get('/api/categories');
    expect((list.body.raw ?? []).map((c: any) => Number(c.id))).toContain(6);
  });
});
