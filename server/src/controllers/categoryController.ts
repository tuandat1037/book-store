import { Request, Response } from 'express';
import { query } from '../config/db.js';

// Vietnamese-aware slugify: map đ->d first (đ does not NFD-decompose, so the
// old version deleted it and turned "Đổi" into "oi"), then strip tone marks.
const slugify = (name: string) =>
  name.toLowerCase().replace(/đ/g, 'd').normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Count how many books each category holds (incl. soft-deleted: they still
 *  block deletion via FK), so the badge and the delete-guard always agree. */
async function categoryBookCounts(): Promise<Record<number, number>> {
  const counts: Record<number, number> = {};
  try {
    const rows = await query('SELECT category_id FROM books');
    (rows as any[]).forEach((r) => {
      if (r.category_id) counts[r.category_id] = (counts[r.category_id] || 0) + 1;
    });
  } catch {
    /* counts are cosmetic only */
  }
  return counts;
}

export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await query('SELECT * FROM categories ORDER BY display_order ASC, name ASC');
    const counts = await categoryBookCounts();
    const withCounts = (categories as any[]).map((c) => ({ ...c, book_count: counts[c.id] || 0 }));

    const parents = withCounts.filter((c) => !c.parent_id);
    const tree = parents.map((parent) => ({
      ...parent,
      children: withCounts.filter((c) => c.parent_id === parent.id)
    }));

    res.json({ categories: tree, raw: withCounts });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const { name, parent_id, description, image, display_order } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });

    const slug = slugify(name);
    if (!slug) return res.status(400).json({ message: 'Tên danh mục không hợp lệ' });

    const exists = await query('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (exists.length > 0) return res.status(400).json({ message: 'Danh mục này đã tồn tại' });

    const parentId = parent_id ? parseInt(parent_id) : null;
    if (parentId) {
      const parent = await query('SELECT id FROM categories WHERE id = ?', [parentId]);
      if (parent.length === 0) return res.status(400).json({ message: 'Danh mục cha không tồn tại' });
    }

    const result: any = await query(
      'INSERT INTO categories (name, slug, parent_id, description, image, display_order) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), slug, parentId, description || '', image || '', parseInt(display_order) || 0]
    );
    const categoryId = (result as any)[0]?.insertId || (result as any).insertId;

    res.status(201).json({ message: 'Tạo danh mục thành công', categoryId });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, parent_id, description, image, display_order } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });

    const target = await query('SELECT * FROM categories WHERE id = ?', [id]);
    if (target.length === 0) return res.status(404).json({ message: 'Danh mục không tồn tại' });

    const slug = slugify(name);
    const dup = await query('SELECT id FROM categories WHERE slug = ? AND id != ?', [slug, id]);
    if (dup.length > 0) return res.status(400).json({ message: 'Tên này trùng với danh mục khác' });

    const parentId = parent_id ? parseInt(parent_id) : null;
    if (parentId === parseInt(id)) {
      return res.status(400).json({ message: 'Không thể chọn danh mục là danh mục cha của chính nó' });
    }
    if (parentId) {
      const currentParentId = (target[0] as any).parent_id;
      if (currentParentId !== parentId) {
        const children = await query('SELECT id FROM categories WHERE parent_id = ?', [id]);
        if (children.some((c: any) => c.id === parentId)) {
          return res.status(400).json({ message: 'Không thể chuyển danh mục cha vào bên trong danh mục con của nó' });
        }
      }
      const parent = await query('SELECT id FROM categories WHERE id = ?', [parentId]);
      if (parent.length === 0) return res.status(400).json({ message: 'Danh mục cha không tồn tại' });
    }

    await query(
      'UPDATE categories SET name = ?, slug = ?, parent_id = ?, description = ?, image = ?, display_order = ? WHERE id = ?',
      [name.trim(), slug, parentId, description || '', image || '', parseInt(display_order) || 0, id]
    );

    res.json({ message: 'Cập nhật danh mục thành công' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const target = await query('SELECT * FROM categories WHERE id = ?', [id]);
    if (target.length === 0) return res.status(404).json({ message: 'Danh mục không tồn tại' });

    const children = await query('SELECT id FROM categories WHERE parent_id = ?', [id]);
    if (children.length > 0) {
      return res.status(400).json({ message: 'Danh mục này còn danh mục con. Hãy xóa hoặc chuyển danh mục con trước.' });
    }

    // Count ALL books incl. soft-deleted: they still hold the FK reference
    // (books.category_id is ON DELETE RESTRICT), so MySQL would refuse anyway.
    const books = await query('SELECT id FROM books WHERE category_id = ?', [id]);
    if (books.length > 0) {
      return res.status(400).json({
        message: `Danh mục đang có ${books.length} cuốn sách (kể cả đã xóa tạm). Hãy chuyển hoặc xóa hẳn sách khỏi danh mục trước khi xóa.`
      });
    }

    await query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Xóa danh mục thành công' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
