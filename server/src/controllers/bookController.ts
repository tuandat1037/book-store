import { Request, Response } from 'express';
import { query, queryOne } from '../config/db.js';

export async function getBooks(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;

    const category_id = req.query.category_id ? parseInt(req.query.category_id as string) : null;
    const author_id = req.query.author_id ? parseInt(req.query.author_id as string) : null;
    const q = req.query.q ? (req.query.q as string).trim() : '';
    const sort = (req.query.sort as string) || 'newest';
    const min_price = req.query.min_price ? parseFloat(req.query.min_price as string) : null;
    const max_price = req.query.max_price ? parseFloat(req.query.max_price as string) : null;
    const on_sale = req.query.on_sale === 'true';

    let whereClause = "WHERE b.status = 'ACTIVE' AND b.deleted_at IS NULL";
    const params: any[] = [];

    if (category_id) {
      // Includes subcategories
      whereClause += ' AND (b.category_id = ? OR b.category_id IN (SELECT id FROM categories WHERE parent_id = ?))';
      params.push(category_id, category_id);
    }

    if (author_id) {
      whereClause += ' AND b.author_id = ?';
      params.push(author_id);
    }

    if (q) {
      whereClause += ' AND (b.title LIKE ? OR a.name LIKE ? OR c.name LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (min_price !== null) {
      whereClause += ' AND COALESCE(b.sale_price, b.price) >= ?';
      params.push(min_price);
    }

    if (max_price !== null) {
      whereClause += ' AND COALESCE(b.sale_price, b.price) <= ?';
      params.push(max_price);
    }

    if (on_sale) {
      whereClause += ' AND b.sale_price IS NOT NULL AND b.sale_price < b.price';
    }

    let orderBy = 'ORDER BY b.id DESC';
    if (sort === 'price_asc') orderBy = 'ORDER BY COALESCE(b.sale_price, b.price) ASC';
    if (sort === 'price_desc') orderBy = 'ORDER BY COALESCE(b.sale_price, b.price) DESC';
    if (sort === 'bestseller') orderBy = 'ORDER BY b.sold_quantity DESC';
    if (sort === 'oldest') orderBy = 'ORDER BY b.id ASC';

    const sql = `
      SELECT b.*, c.name as category_name, c.slug as category_slug, 
             a.name as author_name, p.name as publisher_name,
             (SELECT image_url FROM book_images WHERE book_id = b.id ORDER BY is_primary DESC, id ASC LIMIT 1) as cover_image,
             (SELECT AVG(rating) FROM reviews WHERE book_id = b.id AND status = 'APPROVED') as rating_avg,
             (SELECT COUNT(*) FROM reviews WHERE book_id = b.id AND status = 'APPROVED') as review_count
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN publishers p ON b.publisher_id = p.id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const books = await query(sql, params);

    const countSql = `
      SELECT COUNT(*) as total
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN authors a ON b.author_id = a.id
      ${whereClause}
    `;
    const countResult = await queryOne(countSql, params.slice(0, params.length - 2));
    const total = countResult ? countResult.total : 0;

    res.json({
      books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getBookBySlugOrId(req: Request, res: Response) {
  try {
    const { param } = req.params;
    const isNum = /^\d+$/.test(param);

    const sql = `
      SELECT b.*, c.name as category_name, c.slug as category_slug, 
             a.name as author_name, a.bio as author_bio, p.name as publisher_name,
             (SELECT AVG(rating) FROM reviews WHERE book_id = b.id AND status = 'APPROVED') as rating_avg,
             (SELECT COUNT(*) FROM reviews WHERE book_id = b.id AND status = 'APPROVED') as review_count
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN publishers p ON b.publisher_id = p.id
      WHERE ${isNum ? 'b.id = ?' : 'b.slug = ?'} AND b.deleted_at IS NULL
    `;

    const book = await queryOne(sql, [param]);
    if (!book) {
      return res.status(404).json({ message: 'Không tìm thấy sách yêu cầu' });
    }

    const images = await query('SELECT image_url, is_primary FROM book_images WHERE book_id = ? ORDER BY is_primary DESC, id ASC', [book.id]);

    const related = await query(`
      SELECT b.id, b.title, b.slug, b.price, b.sale_price,
              (SELECT image_url FROM book_images WHERE book_id = b.id ORDER BY is_primary DESC, id ASC LIMIT 1) as cover_image,
              (SELECT AVG(rating) FROM reviews WHERE book_id = b.id AND status = 'APPROVED') as rating_avg,
              (SELECT COUNT(*) FROM reviews WHERE book_id = b.id AND status = 'APPROVED') as review_count
      FROM books b
      WHERE b.category_id = ? AND b.id != ? AND b.status = 'ACTIVE' AND b.deleted_at IS NULL
      LIMIT 6
    `, [book.category_id, book.id]);

    res.json({
      book,
      images: images.length > 0 ? images.map((i: any) => i.image_url) : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'],
      related
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getHomeSections(req: Request, res: Response) {
  try {
    const ratingSelect = `
             (SELECT AVG(rating) FROM reviews WHERE book_id = b.id AND status = 'APPROVED') as rating_avg,
             (SELECT COUNT(*) FROM reviews WHERE book_id = b.id AND status = 'APPROVED') as review_count`;
    const featured = await query(`
      SELECT b.*, a.name as author_name,
              (SELECT image_url FROM book_images WHERE book_id = b.id ORDER BY is_primary DESC LIMIT 1) as cover_image,
              ${ratingSelect}
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE b.is_featured = 1 AND b.status = 'ACTIVE' AND b.deleted_at IS NULL
      LIMIT 10
    `);

    const newArrivals = await query(`
      SELECT b.*, a.name as author_name,
              (SELECT image_url FROM book_images WHERE book_id = b.id ORDER BY is_primary DESC LIMIT 1) as cover_image,
              ${ratingSelect}
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE b.is_new = 1 AND b.status = 'ACTIVE' AND b.deleted_at IS NULL
      ORDER BY b.id DESC LIMIT 10
    `);

    const bestsellers = await query(`
      SELECT b.*, a.name as author_name,
              (SELECT image_url FROM book_images WHERE book_id = b.id ORDER BY is_primary DESC LIMIT 1) as cover_image,
              ${ratingSelect}
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE b.is_bestseller = 1 AND b.status = 'ACTIVE' AND b.deleted_at IS NULL
      ORDER BY b.sold_quantity DESC LIMIT 10
    `);

    const promotions = await query(`
      SELECT b.*, a.name as author_name,
              (SELECT image_url FROM book_images WHERE book_id = b.id ORDER BY is_primary DESC LIMIT 1) as cover_image,
              ${ratingSelect}
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE b.sale_price IS NOT NULL AND b.sale_price < b.price AND b.status = 'ACTIVE' AND b.deleted_at IS NULL
      ORDER BY ((b.price - b.sale_price) / b.price) DESC LIMIT 10
    `);

    // Category Specific Collections for Homepage Sections
    const doraemonBooks = await query(`
      SELECT b.*, a.name as author_name,
              (SELECT image_url FROM book_images WHERE book_id = b.id ORDER BY is_primary DESC LIMIT 1) as cover_image,
              ${ratingSelect}
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE b.category_id = 6 AND b.status = 'ACTIVE' AND b.deleted_at IS NULL
      ORDER BY b.id ASC LIMIT 5
    `);

    const conanBooks = await query(`
      SELECT b.*, a.name as author_name,
              (SELECT image_url FROM book_images WHERE book_id = b.id ORDER BY is_primary DESC LIMIT 1) as cover_image,
              ${ratingSelect}
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE b.category_id = 7 AND b.status = 'ACTIVE' AND b.deleted_at IS NULL
      ORDER BY b.id ASC LIMIT 5
    `);

    const onePieceBooks = await query(`
      SELECT b.*, a.name as author_name,
              (SELECT image_url FROM book_images WHERE book_id = b.id ORDER BY is_primary DESC LIMIT 1) as cover_image,
              ${ratingSelect}
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE b.category_id = 8 AND b.status = 'ACTIVE' AND b.deleted_at IS NULL
      ORDER BY b.id ASC LIMIT 5
    `);

    const thieuNhiBooks = await query(`
      SELECT b.*, a.name as author_name,
              (SELECT image_url FROM book_images WHERE book_id = b.id ORDER BY is_primary DESC LIMIT 1) as cover_image,
              ${ratingSelect}
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE (b.category_id = 2 OR b.category_id = 10 OR b.category_id = 11) AND b.status = 'ACTIVE' AND b.deleted_at IS NULL
      ORDER BY b.id ASC LIMIT 5
    `);

    const vanHocVnBooks = await query(`
      SELECT b.*, a.name as author_name,
              (SELECT image_url FROM book_images WHERE book_id = b.id ORDER BY is_primary DESC LIMIT 1) as cover_image,
              ${ratingSelect}
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE (b.category_id = 12 OR b.category_id = 3) AND b.status = 'ACTIVE' AND b.deleted_at IS NULL
      ORDER BY b.id ASC LIMIT 5
    `);

    res.json({
      featured,
      newArrivals,
      bestsellers,
      promotions,
      doraemonBooks,
      conanBooks,
      onePieceBooks,
      thieuNhiBooks,
      vanHocVnBooks
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function createBook(req: Request, res: Response) {
  try {
    const {
      title, category_id, author_id, publisher_id, import_price, price, sale_price, stock,
      publication_year, num_pages, cover_type, dimensions, weight, description, image_url
    } = req.body;

    if (!title || !category_id || !author_id || !publisher_id || !price) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin sách bắt buộc' });
    }

    const slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Date.now().toString().slice(-4);

    const result = await query(
      `INSERT INTO books (category_id, author_id, publisher_id, title, slug, import_price, price, sale_price, stock, publication_year, num_pages, cover_type, dimensions, weight, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [category_id, author_id, publisher_id, title, slug, import_price || 0, price, sale_price || null, stock || 0, publication_year || 2024, num_pages || 100, cover_type || 'Bìa mềm', dimensions || '13 x 19 cm', weight || 200, description || '']
    );

    const bookId = (result as any)[0]?.insertId || (result as any).insertId;

    if (image_url) {
      await query('INSERT INTO book_images (book_id, image_url, display_order, is_primary) VALUES (?, ?, 1, 1)', [bookId, image_url]);
    }

    res.status(201).json({ message: 'Thêm sách mới thành công', bookId });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateBook(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      title, category_id, author_id, publisher_id, import_price, price, sale_price, stock,
      publication_year, num_pages, cover_type, dimensions, weight, description, is_featured, is_new, is_bestseller, image_url, status
    } = req.body;

    const existing = await queryOne('SELECT * FROM books WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ message: 'Không tìm thấy sách' });

    // Cho phép cập nhật một phần: trường nào không gửi thì giữ nguyên giá trị cũ.
    // (MySQL/mysql2 không nhận undefined nên phải quy về null rồi dùng COALESCE.)
    const newStatus = status === undefined ? null : String(status).toUpperCase();
    if (newStatus !== null && !['ACTIVE', 'INACTIVE'].includes(newStatus)) {
      return res.status(400).json({ message: 'Trạng thái sách không hợp lệ (chỉ nhận ACTIVE hoặc INACTIVE)' });
    }

    await query(
      `UPDATE books SET
        title = COALESCE(?, title),
        category_id = COALESCE(?, category_id),
        author_id = COALESCE(?, author_id),
        publisher_id = COALESCE(?, publisher_id),
        import_price = COALESCE(?, import_price),
        price = COALESCE(?, price),
        sale_price = ?,
        stock = COALESCE(?, stock),
        publication_year = COALESCE(?, publication_year),
        num_pages = COALESCE(?, num_pages),
        cover_type = COALESCE(?, cover_type),
        dimensions = COALESCE(?, dimensions),
        weight = COALESCE(?, weight),
        description = COALESCE(?, description),
        is_featured = COALESCE(?, is_featured),
        is_new = COALESCE(?, is_new),
        is_bestseller = COALESCE(?, is_bestseller),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title ?? null,
        category_id ?? null,
        author_id ?? null,
        publisher_id ?? null,
        import_price ?? null,
        price ?? null,
        // sale_price được phép xoá về NULL nên truyền thẳng, không COALESCE
        sale_price === undefined ? (existing as any).sale_price ?? null : sale_price,
        stock ?? null,
        publication_year ?? null,
        num_pages ?? null,
        cover_type ?? null,
        dimensions ?? null,
        weight ?? null,
        description ?? null,
        is_featured === undefined ? null : (is_featured ? 1 : 0),
        is_new === undefined ? null : (is_new ? 1 : 0),
        is_bestseller === undefined ? null : (is_bestseller ? 1 : 0),
        newStatus,
        id
      ]
    );

    if (image_url) {
      await query('DELETE FROM book_images WHERE book_id = ?', [id]);
      await query('INSERT INTO book_images (book_id, image_url, display_order, is_primary) VALUES (?, ?, 1, 1)', [id, image_url]);
    }

    res.json({ message: 'Cập nhật thông tin sách thành công' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function deleteBook(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Check if book is in existing active orders to prevent foreign key errors
    const inOrders = await queryOne('SELECT COUNT(*) as count FROM order_items WHERE book_id = ?', [id]);
    if (inOrders && inOrders.count > 0) {
      // Soft delete to protect data integrity
      await query('UPDATE books SET status = "INACTIVE", deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
      return res.json({ message: 'Sách đã có trong đơn hàng nên được chuyển sang trạng thái Ẩn (Soft Delete)' });
    }

    await query('UPDATE books SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    res.json({ message: 'Xóa sách thành công' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
