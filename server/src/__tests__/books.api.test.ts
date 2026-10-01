import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { initDatabase, closeDatabase, queryOne, query } from '../config/db.js';


let adminToken = '';
let customerToken = '';
let employeeToken = '';
let createdBookId = 0;

beforeAll(async () => {
  await initDatabase();
  const a = await request(app).post('/api/auth/login').send({ email: 'admin@kimdong.vn', password: 'admin123' });
  const c = await request(app).post('/api/auth/login').send({ email: 'khachhang@gmail.com', password: 'user123' });
  const e = await request(app).post('/api/auth/login').send({ email: 'nhanvien@kimdong.vn', password: 'admin123' });
  adminToken = a.body.token;
  customerToken = c.body.token;
  employeeToken = e.body.token;
}, 30000);

afterAll(async () => {
  try {
    if (createdBookId) {
      await request(app).delete(`/api/books/${createdBookId}`).set('Authorization', `Bearer ${adminToken}`);
    }
    const rows: any[] = await query('SELECT id FROM books WHERE title LIKE ? OR title LIKE ? OR title LIKE ?', ['%Vitest%', 'Sách NV %', 'Sách PQ %']);
    for (const r of rows) {
      await query('DELETE FROM book_images WHERE book_id = ?', [r.id]);
      await query('DELETE FROM books WHERE id = ?', [r.id]);
    }
  } finally {
    await closeDatabase();
  }
});

describe('Tìm kiếm sách GET /api/books?q=', () => {
  it('TC-SEARCH-01: q=Doraemon -> 200 + >0 kết quả', async () => {
    const res = await request(app).get('/api/books?q=Doraemon');
    expect(res.status).toBe(200);
    expect((res.body.books ?? []).length).toBeGreaterThan(0);
  });

  it('TC-SEARCH-02: q không tồn tại -> 200 + rỗng', async () => {
    const res = await request(app).get('/api/books?q=xyz_khong_ton_tai_999');
    expect(res.status).toBe(200);
    expect(res.body.books ?? []).toEqual([]);
  });

  it('TC-SEARCH-03: q rỗng -> trả toàn bộ', async () => {
    const res = await request(app).get('/api/books?q=');
    expect(res.status).toBe(200);
    expect((res.body.books ?? []).length).toBeGreaterThan(0);
  });

  it('TC-SEARCH-04: hoa/thường vẫn ra (doraemon)', async () => {
    const res = await request(app).get('/api/books?q=doraemon');
    expect(res.status).toBe(200);
    expect((res.body.books ?? []).length).toBeGreaterThan(0);
  });
});

describe('Lọc sách GET /api/books?category_id&min_price&max_price', () => {
  it('TC-FILTER-01: category_id=6 -> tất cả category_id==6', async () => {
    const res = await request(app).get('/api/books?category_id=6&limit=100');
    expect(res.status).toBe(200);
    const books = res.body.books ?? [];
    expect(books.length).toBeGreaterThan(0);
    expect(books.every((b: any) => Number(b.category_id) === 6)).toBe(true);
  });

  it('TC-FILTER-02: min/max price -> giá trong khoảng', async () => {
    const res = await request(app).get('/api/books?min_price=20000&max_price=30000&limit=100');
    expect(res.status).toBe(200);
    for (const b of res.body.books ?? []) {
      const price = Number(b.sale_price ?? b.price);
      expect(price).toBeGreaterThanOrEqual(20000);
      expect(price).toBeLessThanOrEqual(30000);
    }
  });

  it('TC-FILTER-03: category_id=999999 -> rỗng', async () => {
    const res = await request(app).get('/api/books?category_id=999999');
    expect(res.status).toBe(200);
    expect(res.body.books ?? []).toEqual([]);
  });

  it('TC-FILTER-04: min_price > max_price -> rỗng (không 500)', async () => {
    const res = await request(app).get('/api/books?min_price=50000&max_price=20000');
    expect(res.status).toBe(200);
    expect(res.body.books ?? []).toEqual([]);
  });
});

describe('CRUD sách (admin)', () => {
  it('TC-BOOK-01: POST /books thiếu title -> 400', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 50000 });
    expect(res.status).toBe(400);
  });

  it('TC-BOOK-02: tạo đủ field với admin -> 201', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Sách Vitest Mẫu', category_id: 6, author_id: 1,
        publisher_id: 1, price: 50000, stock: 10
      });
    expect([200, 201]).toContain(res.status);
    createdBookId = Number(res.body.bookId ?? res.body.id);
    expect(createdBookId).toBeGreaterThan(0);
  });

  it('TC-BOOK-03: PUT sai status -> 400', async () => {
    const res = await request(app)
      .put(`/api/books/${createdBookId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SAI_TRANG_THAI' });
    expect(res.status).toBe(400);
  });

  it('TC-BOOK-04: DELETE -> 200, GET lại không thấy', async () => {
    const del = await request(app)
      .delete(`/api/books/${createdBookId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);
    const list = await request(app).get('/api/books?limit=1000');
    const ids = (list.body.books ?? []).map((b: any) => Number(b.id));
    expect(ids).not.toContain(createdBookId);
    createdBookId = 0; // đã xóa, khỏi dọn lại
  });

  it('TC-BOOK-05: GET /books/999999 -> 404', async () => {
    const res = await request(app).get('/api/books/999999');
    expect(res.status).toBe(404);
  });

  it('TC-PERM-01: CUSTOMER POST /books -> 403', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ title: 'X', price: 1000 });
    expect(res.status).toBe(403);
  });

  it('TC-PERM-03a: EMPLOYEE POST /books -> 201 (được phép)', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        title: `Sách NV ${Date.now()}`, category_id: 6,
        author_id: 1, publisher_id: 1, price: 30000, stock: 5
      });
    expect([200, 201]).toContain(res.status);
    const id = Number(res.body.bookId ?? res.body.id);
    // dọn ngay
    await request(app).delete(`/api/books/${id}`).set('Authorization', `Bearer ${adminToken}`);
  });

  it('TC-ORD-04b (sanity): stock đọc được từ DB', async () => {
    const b = await queryOne('SELECT stock FROM books WHERE id = ?', [1]);
    expect(Number((b as any)?.stock)).toBeGreaterThanOrEqual(0);
  });
});

describe('Phân quyền xóa / ngừng kinh doanh sách (chỉ ADMIN)', () => {
  let permBookId = 0;

  it('setup: tạo sách để test phân quyền', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: `Sách PQ ${Date.now()}`, category_id: 6,
        author_id: 1, publisher_id: 1, price: 30000, stock: 5
      });
    expect([200, 201]).toContain(res.status);
    permBookId = Number(res.body.bookId ?? res.body.id);
  });

  it('TC-PERM-07: EMPLOYEE DELETE /books/:id -> 403', async () => {
    const res = await request(app)
      .delete(`/api/books/${permBookId}`)
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(403);
  });

  it('TC-PERM-08: EMPLOYEE PUT status -> 403, nhưng sửa giá vẫn 200', async () => {
    const bad = await request(app)
      .put(`/api/books/${permBookId}`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ status: 'INACTIVE' });
    expect(bad.status).toBe(403);
    const good = await request(app)
      .put(`/api/books/${permBookId}`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ price: 31000 });
    expect(good.status).toBe(200);
  });

  it('TC-BOOK-06: ADMIN ngừng KD -> 200, ẩn khỏi list mặc định, hiện ở filter INACTIVE', async () => {
    const off = await request(app)
      .put(`/api/books/${permBookId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'INACTIVE' });
    expect(off.status).toBe(200);

    const def = await request(app).get('/api/books?limit=1000');
    expect((def.body.books ?? []).map((b: any) => Number(b.id))).not.toContain(permBookId);

    const ina = await request(app)
      .get('/api/books?limit=1000&status=INACTIVE')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(ina.status).toBe(200);
    expect((ina.body.books ?? []).map((b: any) => Number(b.id))).toContain(permBookId);
  });

  it('TC-BOOK-07: CUSTOMER GET ?status=INACTIVE -> không thấy sách ngừng KD', async () => {
    const res = await request(app)
      .get('/api/books?limit=1000&status=INACTIVE')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect((res.body.books ?? []).map((b: any) => Number(b.id))).not.toContain(permBookId);
  });

  it('TC-BOOK-08: ADMIN mở bán lại -> 200, hiện lại ở list mặc định (dọn)', async () => {
    const on = await request(app)
      .put(`/api/books/${permBookId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' });
    expect(on.status).toBe(200);
    const def = await request(app).get('/api/books?limit=1000');
    expect((def.body.books ?? []).map((b: any) => Number(b.id))).toContain(permBookId);
    await request(app).delete(`/api/books/${permBookId}`).set('Authorization', `Bearer ${adminToken}`);
  });
});
