import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { initDatabase, closeDatabase, query } from '../config/db.js';

beforeAll(async () => {
  await initDatabase();
}, 30000);

afterAll(async () => {
  try {
    await query('DELETE FROM users WHERE email LIKE ?', ['ut_%@test.vn']);
  } finally {
    await closeDatabase();
  }
});

describe('POST /api/auth/login + register + me', () => {
  it('TC-AUTH-01: login admin đúng -> 200 + token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@kimdong.vn', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('TC-AUTH-02: login sai pass -> 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@kimdong.vn', password: 'sai_mat_khau' });
    expect(res.status).toBe(401);
  });

  it('TC-AUTH-03: login email không tồn tại -> 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'khongton@kimdong.vn', password: 'admin123' });
    expect(res.status).toBe(401);
  });

  it('TC-AUTH-04: thiếu email/pass -> 400', async () => {
    const r1 = await request(app).post('/api/auth/login').send({ email: 'admin@kimdong.vn' });
    expect(r1.status).toBe(400);
    const r2 = await request(app).post('/api/auth/login').send({ password: 'admin123' });
    expect(r2.status).toBe(400);
  });

  it('TC-AUTH-05: register mới hợp lệ -> 201', async () => {
    const email = `ut_${Date.now()}@test.vn`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ full_name: 'User Test', email, password: 'test123456' });
    expect([200, 201]).toContain(res.status);
    expect(res.body.token ?? res.body.message).toBeDefined();
  });

  it('TC-AUTH-06: register trùng email -> 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ full_name: 'Trung', email: 'admin@kimdong.vn', password: 'test123456' });
    expect(res.status).toBe(400);
  });

  it('TC-AUTH-07: GET /auth/me không token -> 401, token giả -> 403', async () => {
    const noToken = await request(app).get('/api/auth/me');
    expect(noToken.status).toBe(401);
    const fake = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token.gia.mao');
    expect([401, 403]).toContain(fake.status);
  });
});
