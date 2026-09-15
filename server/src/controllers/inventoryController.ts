import { Response } from 'express';
import { query, queryOne } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { LOW_STOCK_THRESHOLD, getStockStatus } from '../config/constants.js';

/** Giá trị tồn kho theo giá nhập (chỉ tính sách chưa xóa mềm) */
function inventoryValue(rows: any[]) {
  return rows.reduce((sum, b) => sum + Number(b.stock || 0) * Number(b.import_price || 0), 0);
}

/**
 * Danh sách kho: toàn bộ sách chưa xóa mềm kèm tồn kho + trạng thái kho.
 * Hỗ trợ lọc theo trạng thái, danh mục, nhà cung cấp và tìm kiếm.
 */
export async function getInventory(req: AuthRequest, res: Response) {
  try {
    const { status, category_id, publisher_id, q } = req.query as Record<string, string>;

    let sql = `
      SELECT b.id, b.title, b.slug, b.stock, b.import_price, b.price, b.sale_price,
             b.sold_quantity, b.publication_year, b.status as book_status, b.updated_at,
             c.name as category_name, a.name as author_name, p.name as publisher_name,
             (SELECT image_url FROM book_images WHERE book_id = b.id ORDER BY is_primary DESC, id ASC LIMIT 1) as cover_image
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN publishers p ON b.publisher_id = p.id
      WHERE b.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (category_id) {
      sql += ' AND b.category_id = ?';
      params.push(category_id);
    }
    if (publisher_id) {
      sql += ' AND b.publisher_id = ?';
      params.push(publisher_id);
    }
    if (q && q.trim()) {
      sql += ' AND (b.title LIKE ? OR a.name LIKE ? OR c.name LIKE ?)';
      const kw = `%${q.trim()}%`;
      params.push(kw, kw, kw);
    }

    // Sắp xếp: hết hàng trước, rồi tới sắp hết, sau đó tới tồn kho tăng dần
    sql += ` ORDER BY (b.stock <= 0) DESC, (b.stock <= ?) DESC, b.stock ASC, b.title ASC`;
    params.push(LOW_STOCK_THRESHOLD);

    const rows = (await query(sql, params)) as any[];

    // Gắn trạng thái kho + giá trị tồn kho cho từng cuốn
    const books = rows.map((b) => ({
      ...b,
      stock_status: getStockStatus(b.stock),
      stock_value: Number(b.stock || 0) * Number(b.import_price || 0)
    }));

    // Lọc theo trạng thái kho (tính ở tầng ứng dụng để dùng chung 1 ngưỡng)
    const filtered = status && status !== 'ALL' ? books.filter((b) => b.stock_status === status) : books;

    const totalStock = books.reduce((sum, b) => sum + Number(b.stock || 0), 0);
    const outOfStockCount = books.filter((b) => b.stock_status === 'OUT_OF_STOCK').length;
    const lowStockCount = books.filter((b) => b.stock_status === 'LOW_STOCK').length;
    const inStockCount = books.filter((b) => b.stock_status === 'IN_STOCK').length;

    res.json({
      books: filtered,
      threshold: LOW_STOCK_THRESHOLD,
      summary: {
        totalBooks: books.length,
        totalStock,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        totalValue: inventoryValue(books),
        totalSold: books.reduce((sum, b) => sum + Number(b.sold_quantity || 0), 0)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/** Thống kê kho theo danh mục: số sách, tổng tồn, số sách sắp hết / hết hàng */
export async function getInventoryByCategory(req: AuthRequest, res: Response) {
  try {
    const categories = await query('SELECT id, name, parent_id FROM categories ORDER BY display_order ASC, name ASC');
    const rows = await query(
      `SELECT category_id, stock, import_price, sold_quantity FROM books WHERE deleted_at IS NULL`
    );

    const byCategory = (categories as any[])
      .map((c) => {
        const own = (rows as any[]).filter((b) => Number(b.category_id) === Number(c.id));
        const stock = own.reduce((sum, b) => sum + Number(b.stock || 0), 0);
        return {
          id: c.id,
          name: c.name,
          parent_id: c.parent_id ?? null,
          book_count: own.length,
          stock_total: stock,
          out_of_stock_count: own.filter((b) => getStockStatus(b.stock) === 'OUT_OF_STOCK').length,
          low_stock_count: own.filter((b) => getStockStatus(b.stock) === 'LOW_STOCK').length,
          total_value: own.reduce((sum, b) => sum + Number(b.stock || 0) * Number(b.import_price || 0), 0),
          sold_total: own.reduce((sum, b) => sum + Number(b.sold_quantity || 0), 0)
        };
      })
      .filter((c) => c.book_count > 0)
      .sort((a, b) => b.stock_total - a.stock_total);

    res.json({ categories: byCategory, threshold: LOW_STOCK_THRESHOLD });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/** Chi tiết kho của một cuốn sách: thông tin, trạng thái, số liệu bán/nhập */
export async function getInventoryItem(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const book = await queryOne(
      `SELECT b.*, c.name as category_name, a.name as author_name, p.name as publisher_name,
              (SELECT image_url FROM book_images WHERE book_id = b.id ORDER BY is_primary DESC, id ASC LIMIT 1) as cover_image
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN authors a ON b.author_id = a.id
       LEFT JOIN publishers p ON b.publisher_id = p.id
       WHERE b.id = ? AND b.deleted_at IS NULL`,
      [id]
    );
    if (!book) return res.status(404).json({ message: 'Không tìm thấy sách trong kho' });

    const soldRow = await queryOne(
      `SELECT COALESCE(SUM(quantity), 0) as total_sold FROM order_items WHERE book_id = ?`,
      [id]
    );

    res.json({
      book: {
        ...(book as any),
        stock_status: getStockStatus((book as any).stock),
        stock_value: Number((book as any).stock || 0) * Number((book as any).import_price || 0)
      },
      threshold: LOW_STOCK_THRESHOLD,
      sold_from_orders: Number(soldRow?.total_sold || 0)
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Nhập thêm hàng vào kho: cộng số lượng, cập nhật giá nhập nếu có.
 * Dùng cho nút "Nhập kho" ở trang Quản Lý Kho.
 */
export async function importStock(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { quantity, import_price } = req.body;

    const qty = parseInt(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Số lượng nhập kho phải là số nguyên dương' });
    }
    if (qty > 100000) {
      return res.status(400).json({ message: 'Số lượng nhập kho quá lớn (tối đa 100.000 cuốn/lần)' });
    }

    const book = await queryOne('SELECT id, title, stock, import_price FROM books WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!book) return res.status(404).json({ message: 'Không tìm thấy sách trong kho' });

    let price = Number(book.import_price || 0);
    if (import_price !== undefined && import_price !== null && String(import_price).trim() !== '') {
      const parsed = Number(import_price);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return res.status(400).json({ message: 'Giá nhập không hợp lệ' });
      }
      price = parsed;
    }

    await query('UPDATE books SET stock = stock + ?, import_price = ? WHERE id = ?', [qty, price, id]);

    const updated = await queryOne('SELECT id, title, stock, import_price FROM books WHERE id = ?', [id]);

    res.json({
      message: `Đã nhập thêm ${qty} cuốn "${(book as any).title}"`,
      book: {
        ...(updated as any),
        stock_status: getStockStatus((updated as any)?.stock),
        stock_value: Number((updated as any)?.stock || 0) * Number((updated as any)?.import_price || 0)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Điều chỉnh tồn kho sau kiểm kê: đặt lại số lượng thực tế đếm được.
 * Hệ thống tự tính chênh lệch so với số liệu đang ghi nhận và trả về kết quả.
 */
export async function adjustStock(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { stock, reason } = req.body;

    if (stock === undefined || stock === null || String(stock).trim() === '') {
      return res.status(400).json({ message: 'Vui lòng nhập số lượng thực tế sau kiểm kê' });
    }

    const raw = String(stock).trim();
    if (!/^-?\d+$/.test(raw)) {
      return res.status(400).json({ message: 'Số lượng tồn kho phải là số nguyên không âm' });
    }

    const value = parseInt(raw, 10);
    if (!Number.isInteger(value) || value < 0) {
      return res.status(400).json({ message: 'Số lượng tồn kho phải là số nguyên không âm' });
    }
    if (value > 1000000) {
      return res.status(400).json({ message: 'Số lượng tồn kho quá lớn (tối đa 1.000.000 cuốn)' });
    }

    const book = await queryOne(
      'SELECT id, title, stock, import_price, sold_quantity FROM books WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (!book) return res.status(404).json({ message: 'Không tìm thấy sách trong kho' });

    const oldStock = Number((book as any).stock || 0);
    const difference = value - oldStock;

    // Chênh lệch = 0 nghĩa là khớp số liệu, không cần ghi lại
    if (difference === 0) {
      return res.json({
        message: `Tồn kho "${(book as any).title}" khớp với số liệu hệ thống (${oldStock} cuốn), không có chênh lệch`,
        unchanged: true,
        difference: 0,
        old_stock: oldStock,
        new_stock: value,
        book: {
          id: (book as any).id,
          title: (book as any).title,
          stock: value,
          stock_status: getStockStatus(value),
          stock_value: value * Number((book as any).import_price || 0)
        }
      });
    }

    await query('UPDATE books SET stock = ? WHERE id = ?', [value, id]);

    const note = typeof reason === 'string' ? reason.trim() : '';
    const trend = difference > 0 ? 'tăng' : 'giảm';

    res.json({
      message: `Đã điều chỉnh tồn kho "${(book as any).title}": ${oldStock} → ${value} cuốn (${trend} ${Math.abs(difference)} cuốn)${
        note ? ` — Lý do: ${note}` : ''
      }`,
      unchanged: false,
      difference,
      old_stock: oldStock,
      new_stock: value,
      book: {
        id: (book as any).id,
        title: (book as any).title,
        stock: value,
        stock_status: getStockStatus(value),
        stock_value: value * Number((book as any).import_price || 0)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
