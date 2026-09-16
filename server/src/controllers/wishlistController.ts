import { Response } from 'express';
import { query, queryOne } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getWishlist(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Chưa xác thực' });

    const items = await query(`
      SELECT w.id as wishlist_id, b.*, a.name as author_name,
             (SELECT image_url FROM book_images WHERE book_id = b.id ORDER BY is_primary DESC LIMIT 1) as cover_image
      FROM wishlists w
      JOIN books b ON w.book_id = b.id
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE w.user_id = ? AND b.deleted_at IS NULL
    `, [req.user.id]);

    res.json({ wishlist: items });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function toggleWishlist(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Vui lòng đăng nhập để lưu sản phẩm yêu thích' });
    const { book_id } = req.body;

    if (!book_id || !Number.isInteger(Number(book_id)) || Number(book_id) <= 0) {
      return res.status(400).json({ message: 'Vui lòng chọn sách hợp lệ' });
    }

    // Phải kiểm tra sách có tồn tại trước khi ghi vào bảng yêu thích.
    // (Trước đây id sách không tồn tại sẽ vi phạm khoá ngoại và trả về 500.)
    // Dùng dạng có alias `b.` để engine dự phòng trong bộ nhớ nhận diện được.
    const book = await queryOne('SELECT b.id, b.deleted_at FROM books b WHERE b.id = ?', [book_id]);
    if (!book || book.deleted_at) return res.status(404).json({ message: 'Không tìm thấy sách' });

    const existing = await queryOne('SELECT id FROM wishlists WHERE user_id = ? AND book_id = ?', [req.user.id, book_id]);

    if (existing) {
      await query('DELETE FROM wishlists WHERE id = ?', [existing.id]);
      return res.json({ message: 'Đã xóa khỏi danh sách yêu thích', inWishlist: false });
    } else {
      await query('INSERT INTO wishlists (user_id, book_id) VALUES (?, ?)', [req.user.id, book_id]);
      return res.json({ message: 'Đã thêm vào danh sách yêu thích', inWishlist: true });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
