import { Request, Response } from 'express';
import { query } from '../config/db.js';

// Vietnamese-aware slugify: map đ->d first (đ does not NFD-decompose, so the
// old version deleted it and turned "Đổi" into "oi"), then strip tone marks.
const slugify = (name: string) =>
  name.toLowerCase().replace(/đ/g, 'd').normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Book counts per author (incl. soft-deleted: they still hold the FK). */
async function authorBookCounts(): Promise<Record<number, number>> {
  const counts: Record<number, number> = {};
  try {
    const rows = await query('SELECT author_id FROM books');
    (rows as any[]).forEach((r) => {
      if (r.author_id) counts[r.author_id] = (counts[r.author_id] || 0) + 1;
    });
  } catch {
    /* counts are cosmetic only */
  }
  return counts;
}

export async function getAuthors(req: Request, res: Response) {
  try {
    const authors = await query('SELECT * FROM authors ORDER BY name ASC');
    const counts = await authorBookCounts();
    const withCounts = (authors as any[]).map((a) => ({ ...a, book_count: counts[a.id] || 0 }));
    res.json({ authors: withCounts });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function createAuthor(req: Request, res: Response) {
  try {
    const { name, bio, avatar } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Tên tác giả là bắt buộc' });

    const slug = slugify(name);
    if (!slug) return res.status(400).json({ message: 'Tên tác giả không hợp lệ' });

    const exists = await query('SELECT id FROM authors WHERE slug = ?', [slug]);
    if (exists.length > 0) return res.status(400).json({ message: 'Tác giả này đã tồn tại' });

    const result: any = await query(
      'INSERT INTO authors (name, slug, bio, avatar) VALUES (?, ?, ?, ?)',
      [name.trim(), slug, bio || '', avatar || '']
    );
    const authorId = (result as any)[0]?.insertId || (result as any).insertId;

    res.status(201).json({ message: 'Thêm tác giả thành công', authorId });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateAuthor(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, bio, avatar } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Tên tác giả là bắt buộc' });

    const target = await query('SELECT * FROM authors WHERE id = ?', [id]);
    if (target.length === 0) return res.status(404).json({ message: 'Tác giả không tồn tại' });

    const slug = slugify(name);
    const dup = await query('SELECT id FROM authors WHERE slug = ? AND id != ?', [slug, id]);
    if (dup.length > 0) return res.status(400).json({ message: 'Tên này trùng với tác giả khác' });

    await query('UPDATE authors SET name = ?, slug = ?, bio = ?, avatar = ? WHERE id = ?',
      [name.trim(), slug, bio || '', avatar || '', id]);

    res.json({ message: 'Cập nhật tác giả thành công' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function deleteAuthor(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const target = await query('SELECT * FROM authors WHERE id = ?', [id]);
    if (target.length === 0) return res.status(404).json({ message: 'Tác giả không tồn tại' });

    // books.author_id is ON DELETE RESTRICT (incl. soft-deleted books),
    // so block with a friendly message before MySQL throws 500.
    const books = await query('SELECT id FROM books WHERE author_id = ?', [id]);
    if (books.length > 0) {
      return res.status(400).json({
        message: `Tác giả đang có ${books.length} cuốn sách (kể cả đã xóa tạm). Hãy chuyển sách sang tác giả khác trước khi xóa.`
      });
    }

    await query('DELETE FROM authors WHERE id = ?', [id]);
    res.json({ message: 'Xóa tác giả thành công' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
