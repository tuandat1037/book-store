import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { initDatabase, closeDatabase } from '../config/db.js';

/**
 * Kiểm thử tích hợp CATEGORIES + PHÂN QUYỀN
 * GET /api/categories, POST/PUT/DELETE + requireRole
 */
let adminToken = '';
let employeeToken = '';
let customerToken = '';
let tmpCatId = 0;

beforeAll(async () => {
  await initDatabase();
  const a = await request(app).post('/api/auth/login').send({ email: 'admin@kimdong.vn', password: 'admin123' });
  const e = await request(app).post('/api/auth/login').send({ email: 'nhanvien@kimdong.vn', password: 'admin123' });
  const c = await request(app).post('/api/auth/login').send({ email: 'khachhang@gmail.com', password: 'user123' });
  adminToken = a.body.token;
  employeeToken = e.body.token;
  customerToken = c.body.token;
}, 30000);

afterAll(async () => {
  if (tmpCatId) {
    await request(app).delete(`/api/categories/${tmpCatId}`).set('Authorization', `Bearer ${adminToken}`);
  }
  await closeDatabase();
});

describe('Quản lý danh mục', () => {
  it('TC-CAT-01: GET /categories -> 200 + có mục', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    const raw = res.body.raw ?? res.body.categories ?? [];
    expect(raw.length).toBeGreaterThan(0);
  });

  it('TC-CAT-02: tạo thiếu name -> 400', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Thiếu tên' });
    expect(res.status).toBe(400);
  });

  it('TC-CAT-03: tạo mới -> 201', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Cat Vitest ${Date.now()}`, description: 'test' });
    expect([200, 201]).toContain(res.status);
    tmpCatId = Number(res.body.categoryId ?? res.body.id);
    expect(tmpCatId).toBeGreaterThan(0);
  });

  it('TC-CAT-04: xóa danh mục còn sách (id=6) -> 400', async () => {
    const res = await request(app)
      .delete('/api/categories/6')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });

  it('TC-CAT-05: xóa danh mục rỗng vừa tạo -> 200', async () => {
    const res = await request(app)
      .delete(`/api/categories/${tmpCatId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    tmpCatId = 0;
  });

  it('TC-CAT-06: update id=999999 -> 404', async () => {
    const res = await request(app)
      .put('/api/categories/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Không tồn tại' });
    expect(res.status).toBe(404);
  });
});

describe('Phân quyền requireRole', () => {
  it('TC-PERM-01: CUSTOMER POST /books -> 403', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ title: 'X', price: 1000 });
    expect(res.status).toBe(403);
  });

  it('TC-PERM-02: CUSTOMER GET /users -> 403', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it('TC-PERM-03: EMPLOYEE GET /users -> 403 (chỉ ADMIN)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(403);
  });

  it('TC-PERM-04: không token gọi /orders -> 401', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  it('TC-PERM-05: CUSTOMER không xem được /orders/:id/verification -> 403', async () => {
    // Lấy 1 đơn của customer rồi gọi verification bằng token customer
    const list = await request(app).get('/api/orders').set('Authorization', `Bearer ${customerToken}`);
    const firstId = (list.body.orders ?? [])[0]?.id ?? 1;
    const res = await request(app)
      .get(`/api/orders/${firstId}/verification`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it('TC-PERM-06: EMPLOYEE không sửa được customer -> 403', async () => {
    const res = await request(app)
      .put('/api/customers/3')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ full_name: 'X' });
    expect(res.status).toBe(403);
  });
});
