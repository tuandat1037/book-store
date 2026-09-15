import { Response } from 'express';
import { query, queryOne } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.js';

/**
 * Tìm giỏ hàng của đúng người đang gọi API.
 * - Đã đăng nhập: CHỈ khớp theo user_id (nếu không sẽ lẫn sang giỏ khách vãng lai
 *   vì ai cũng dùng session mặc định 'guest-session').
 * - Khách vãng lai: khớp theo session_id.
 */
async function findCart(userId: number | undefined, sessionId: string) {
  if (userId) {
    return await queryOne('SELECT * FROM carts WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
  }
  return await queryOne('SELECT * FROM carts WHERE session_id = ? ORDER BY id DESC LIMIT 1', [sessionId]);
}

async function findOrCreateCart(userId: number | undefined, sessionId: string) {
  const existing = await findCart(userId, sessionId);
  if (existing) return existing;

  const resCart = await query('INSERT INTO carts (user_id, session_id) VALUES (?, ?)', [userId || null, sessionId]);
  const cartId = (resCart as any)[0]?.insertId || (resCart as any).insertId;
  return { id: cartId } as any;
}

export async function getCart(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const sessionId = (req.headers['x-session-id'] as string) || 'guest-session';

    const cart = await findOrCreateCart(userId, sessionId);

    const items = await query(`
      SELECT ci.id, ci.cart_id, ci.book_id, ci.quantity,
             b.title, b.slug, b.price, b.sale_price, b.stock,
             (SELECT image_url FROM book_images WHERE book_id = b.id ORDER BY is_primary DESC LIMIT 1) as cover_image
      FROM cart_items ci
      JOIN books b ON ci.book_id = b.id
      WHERE ci.cart_id = ?
    `, [cart.id]);

    res.json({ cartId: cart.id, items });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function addToCart(req: AuthRequest, res: Response) {
  try {
    const { book_id, quantity } = req.body;
    const qty = parseInt(quantity) || 1;
    const userId = req.user?.id;
    const sessionId = (req.headers['x-session-id'] as string) || 'guest-session';

    const book = await queryOne('SELECT * FROM books WHERE id = ? AND status = "ACTIVE"', [book_id]);
    if (!book) return res.status(404).json({ message: 'Sách không tồn tại hoặc đã hết hàng' });

    if (book.stock < qty) {
      return res.status(400).json({ message: `Số lượng tồn kho chỉ còn ${book.stock} cuốn` });
    }

    let cart = await findOrCreateCart(userId, sessionId);

    const existingItem = await queryOne('SELECT * FROM cart_items WHERE cart_id = ? AND book_id = ?', [cart.id, book_id]);

    if (existingItem) {
      const newQty = existingItem.quantity + qty;
      if (book.stock < newQty) {
        return res.status(400).json({ message: `Số lượng trong giỏ (${existingItem.quantity}) + mua thêm (${qty}) vượt quá tồn kho (${book.stock})` });
      }
      await query('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newQty, existingItem.id]);
    } else {
      await query('INSERT INTO cart_items (cart_id, book_id, quantity) VALUES (?, ?, ?)', [cart.id, book_id, qty]);
    }

    res.json({ message: 'Đã thêm sản phẩm vào giỏ hàng' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateCartItem(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const qty = parseInt(quantity);

    if (qty <= 0) {
      await query('DELETE FROM cart_items WHERE id = ?', [id]);
      return res.json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
    }

    const item = await queryOne('SELECT ci.*, b.stock FROM cart_items ci JOIN books b ON ci.book_id = b.id WHERE ci.id = ?', [id]);
    if (!item) return res.status(404).json({ message: 'Mục giỏ hàng không tồn tại' });

    if (item.stock < qty) {
      return res.status(400).json({ message: `Số lượng tối đa có thể mua là ${item.stock}` });
    }

    await query('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [qty, id]);
    res.json({ message: 'Cập nhật số lượng thành công' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function removeCartItem(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await query('DELETE FROM cart_items WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Xóa nhiều sách khỏi giỏ trong một lần (nút "Xóa" sau khi chọn ở trang Giỏ hàng).
 * Chỉ xóa các mục thuộc đúng giỏ của người dùng hiện tại.
 */
export async function removeCartItems(req: AuthRequest, res: Response) {
  try {
    const raw = req.body?.ids;
    const ids = (Array.isArray(raw) ? raw : [])
      .map((v) => parseInt(v))
      .filter((v) => Number.isInteger(v) && v > 0);

    if (ids.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất một sách để xóa' });
    }

    const userId = req.user?.id;
    const sessionId = (req.headers['x-session-id'] as string) || 'guest-session';
    const cart = await findCart(userId, sessionId);

    if (!cart) {
      return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
    }

    // Chỉ xóa mục nằm trong giỏ này — tránh xóa nhầm mục của người dùng khác
    const placeholders = ids.map(() => '?').join(', ');
    const result: any = await query(`DELETE FROM cart_items WHERE cart_id = ? AND id IN (${placeholders})`, [cart.id, ...ids]);
    const removed = (Array.isArray(result) ? result[0]?.affectedRows : result?.affectedRows) ?? 0;

    if (!removed) {
      return res.status(404).json({ message: 'Không tìm thấy sách cần xóa trong giỏ hàng của bạn' });
    }

    res.json({
      message: `Đã xóa ${removed} sách khỏi giỏ hàng`,
      removed
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function clearCart(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const sessionId = (req.headers['x-session-id'] as string) || 'guest-session';
    const cart = await findCart(userId, sessionId);

    if (cart) {
      await query('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
    }
    res.json({ message: 'Đã làm sạch giỏ hàng' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
