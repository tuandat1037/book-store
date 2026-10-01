import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { initDatabase, closeDatabase, queryOne, query } from '../config/db.js';

/**
 * 1. Kiểm thử đăng ký và đăng nhập — bám đúng bảng báo cáo TC-AUTH-01 → 05.
 * Chạy: npx vitest run src/__tests__/auth.api.test.ts
 */
let createdEmail = '';

beforeAll(async () => {
  await initDatabase();
}, 30000);

afterAll(async () => {
  try {
    if (createdEmail) {
      await query('DELETE FROM users WHERE email = ?', [createdEmail]);
    }
  } finally {
    await closeDatabase();
  }
});

describe('1. Kiểm thử đăng ký và đăng nhập', () => {
  it('TC-AUTH-01: login admin đúng -> user.role = ADMIN', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@kimdong.vn', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('ADMIN');
  });

  it('TC-AUTH-02: đúng email, sai pass -> message lỗi đăng nhập', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@kimdong.vn', password: 'sai_mat_khau' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Email hoặc mật khẩu không chính xác');
    expect(res.body.token).toBeUndefined();
  });

  it('TC-AUTH-03: thiếu email hoặc thiếu pass -> 400', async () => {
    const r1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@kimdong.vn' });
    expect(r1.status).toBe(400);
    expect(r1.body.message).toBe('Vui lòng nhập Email và Mật khẩu');
    const r2 = await request(app)
      .post('/api/auth/login')
      .send({ password: 'admin123' });
    expect(r2.status).toBe(400);
    expect(r2.body.message).toBe('Vui lòng nhập Email và Mật khẩu');
  });

  it('TC-AUTH-04: register hợp lệ -> role mặc định CUSTOMER', async () => {
    createdEmail = `dk_${Date.now()}@test.vn`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ full_name: 'Người Dùng Mới', email: createdEmail, password: 'test123456' });
    expect([200, 201]).toContain(res.status);
    // role_id 3 = CUSTOMER (DB không có role USER)
    expect(res.body.user.role).toBe('CUSTOMER');
  });

  it('TC-AUTH-05: register trùng email -> 400, không tạo thêm user', async () => {
    const before: any = await queryOne('SELECT COUNT(*) AS n FROM users');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ full_name: 'Trùng Email', email: 'admin@kimdong.vn', password: 'test123456' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/đã được đăng ký/);
    const after: any = await queryOne('SELECT COUNT(*) AS n FROM users');
    expect(Number(after.n)).toBe(Number(before.n));
  });
});
