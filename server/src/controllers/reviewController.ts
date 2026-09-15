import { Request, Response } from 'express';
import { query, queryOne } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.js';

/** Trạng thái đơn được coi là "đã mua thành công" -> được phép đánh giá */
const COMPLETED_STATUSES = ['DELIVERED'];

/**
 * Người dùng đã mua cuốn sách này và đơn đã hoàn thành chưa?
 * Trả về thông tin đơn hoàn thành gần nhất (nếu có).
 */
async function findCompletedPurchase(userId: number, bookId: number) {
  const placeholders = COMPLETED_STATUSES.map(() => '?').join(', ');
  return await queryOne(
    `SELECT o.id, o.order_code, o.created_at
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN books b ON b.id = oi.book_id
     WHERE o.user_id = ? AND oi.book_id = ? AND o.order_status IN (${placeholders})
       AND b.deleted_at IS NULL
     ORDER BY o.id DESC
     LIMIT 1`,
    [userId, bookId, ...COMPLETED_STATUSES]
  );
}

/** Đếm số đánh giá đã có của một người cho một cuốn sách */
async function findExistingReview(userId: number, bookId: number) {
  return await queryOne('SELECT id, rating, comment FROM reviews WHERE user_id = ? AND book_id = ? ORDER BY id DESC LIMIT 1', [userId, bookId]);
}

/** Tính lại điểm trung bình + số lượng đánh giá đã duyệt của một cuốn sách */
async function ratingSummary(bookId: any) {
  const row = await queryOne(
    'SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE book_id = ? AND status = "APPROVED"',
    [bookId]
  );
  const count = Number(row?.count || 0);
  return {
    avg: count > 0 ? Math.round(Number(row?.avg || 0) * 10) / 10 : 0,
    count
  };
}

/** Danh sách đánh giá công khai của một cuốn sách */
export async function getBookReviews(req: Request, res: Response) {
  try {
    const { bookId } = req.params;
    const reviews = await query(
      `SELECT r.id, r.book_id, r.user_id, r.rating, r.comment, r.is_verified_purchase, r.created_at,
              u.full_name as user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.book_id = ? AND r.status = "APPROVED"
       ORDER BY r.id DESC`,
      [bookId]
    );

    const summary = await ratingSummary(bookId);

    res.json({ reviews, avg: summary.avg, count: summary.count });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Kiểm tra quyền đánh giá của người dùng hiện tại với 1 cuốn sách.
 * Dùng cho trang chi tiết sách để biết có hiện form hay không.
 */
export async function getReviewEligibility(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Chưa xác thực' });
    const { bookId } = req.params;

    const purchase = await findCompletedPurchase(req.user.id, Number(bookId));
    const existing = await findExistingReview(req.user.id, Number(bookId));

    res.json({
      can_review: !!purchase,
      has_reviewed: !!existing,
      order: purchase || null,
      review: existing || null
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Danh sách sách người dùng đã mua và đơn đã hoàn thành, kèm trạng thái đã đánh giá.
 * Dùng cho mục "Đơn hàng của tôi" để hiện nút "Đánh giá".
 */
export async function getReviewableBooks(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Chưa xác thực' });
    const placeholders = COMPLETED_STATUSES.map(() => '?').join(', ');

    const rows = await query(
      `SELECT oi.book_id, oi.book_title, oi.book_image, o.order_code, o.created_at,
              b.slug as book_slug,
              (SELECT id FROM reviews r WHERE r.user_id = o.user_id AND r.book_id = oi.book_id ORDER BY r.id DESC LIMIT 1) as review_id,
              (SELECT rating FROM reviews r WHERE r.user_id = o.user_id AND r.book_id = oi.book_id ORDER BY r.id DESC LIMIT 1) as my_rating
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN books b ON b.id = oi.book_id
       WHERE o.user_id = ? AND o.order_status IN (${placeholders})
       ORDER BY o.id DESC`,
      [req.user.id, ...COMPLETED_STATUSES]
    );

    // Mỗi sách chỉ hiện một lần (mua nhiều lần vẫn là 1 đánh giá)
    const seen = new Set<number>();
    const books = (rows as any[])
      .filter((r) => {
        if (seen.has(Number(r.book_id))) return false;
        seen.add(Number(r.book_id));
        return true;
      })
      .map((r) => ({
        book_id: r.book_id,
        book_title: r.book_title,
        book_image: r.book_image,
        book_slug: r.book_slug,
        order_code: r.order_code,
        purchased_at: r.created_at,
        has_reviewed: r.review_id != null,
        my_rating: r.my_rating != null ? Number(r.my_rating) : null
      }));

    res.json({ books });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Gửi đánh giá: chỉ cho phép khi đã mua và đơn đã hoàn thành.
 * Mỗi cuốn sách mỗi người chỉ có 1 đánh giá — gửi lại sẽ cập nhật đánh giá cũ.
 */
export async function addReview(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Chưa xác thực' });
    const { book_id, rating, comment } = req.body;

    const bookId = parseInt(book_id);
    const stars = parseInt(rating);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({ message: 'Sách không hợp lệ' });
    }
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ message: 'Vui lòng chọn số sao từ 1 đến 5' });
    }
    if (!comment || !String(comment).trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập nội dung nhận xét' });
    }
    if (String(comment).trim().length < 5) {
      return res.status(400).json({ message: 'Nội dung nhận xét tối thiểu 5 ký tự' });
    }

    const book = await queryOne('SELECT id, title FROM books WHERE id = ? AND deleted_at IS NULL', [bookId]);
    if (!book) return res.status(404).json({ message: 'Sách không tồn tại' });

    // Điều kiện cốt lõi: phải có đơn hàng đã hoàn thành chứa cuốn sách này
    const purchase = await findCompletedPurchase(req.user.id, bookId);
    if (!purchase) {
      return res.status(403).json({
        message: 'Bạn chỉ có thể đánh giá sách sau khi đã mua và đơn hàng đã giao thành công'
      });
    }

    const existing = await findExistingReview(req.user.id, bookId);
    const text = String(comment).trim();

    if (existing) {
      await query('UPDATE reviews SET rating = ?, comment = ?, is_verified_purchase = 1, status = "APPROVED" WHERE id = ?', [
        stars,
        text,
        existing.id
      ]);
    } else {
      await query(
        'INSERT INTO reviews (book_id, user_id, rating, comment, is_verified_purchase, status) VALUES (?, ?, ?, ?, 1, "APPROVED")',
        [bookId, req.user.id, stars, text]
      );
    }

    res.status(existing ? 200 : 201).json({
      message: existing ? 'Đã cập nhật đánh giá của bạn' : 'Cảm ơn bạn đã gửi đánh giá!',
      updated: !!existing,
      book_id: bookId,
      rating: stars
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
