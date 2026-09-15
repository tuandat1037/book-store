import { Request, Response } from 'express';
import { query, queryOne } from '../config/db.js';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000';

// Banner carousel at the storefront homepage (public)
export async function getActiveBanners(req: Request, res: Response) {
  try {
    const banners = await query(
      'SELECT * FROM banners WHERE is_active = 1 ORDER BY display_order ASC, id ASC'
    );
    res.json({ banners });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Full list for the admin table (includes inactive)
export async function getAllBanners(req: Request, res: Response) {
  try {
    const banners = await query('SELECT * FROM banners ORDER BY display_order ASC, id ASC');
    res.json({ banners });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function createBanner(req: Request, res: Response) {
  try {
    const { title, subtitle, badge, cta_text, cta_link, theme, image_url, display_order, is_active } = req.body;

    if (!title || !cta_link) {
      return res.status(400).json({ message: 'Banner yêu cầu Tiêu đề và Đường dẫn nút CTA' });
    }

    const result = await query(
      `INSERT INTO banners (title, subtitle, badge, cta_text, cta_link, theme, image_url, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        subtitle || '',
        badge || 'NXB Kim Đồng Nổi Bật',
        cta_text || 'Xem ngay',
        cta_link,
        theme || 'red',
        image_url || DEFAULT_IMAGE,
        display_order ?? 0,
        is_active === 0 || is_active === false ? 0 : 1
      ]
    );

    const bannerId = (result as any)[0]?.insertId || (result as any).insertId;
    res.status(201).json({ message: 'Thêm banner thành công', bannerId });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateBanner(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { title, subtitle, badge, cta_text, cta_link, theme, image_url, display_order, is_active } = req.body;

    if (!title || !cta_link) {
      return res.status(400).json({ message: 'Banner yêu cầu Tiêu đề và Đường dẫn nút CTA' });
    }

    const existing = await queryOne('SELECT * FROM banners WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ message: 'Không tìm thấy banner' });

    await query(
      `UPDATE banners SET
        title = ?, subtitle = ?, badge = ?, cta_text = ?, cta_link = ?, theme = ?, image_url = ?, display_order = ?, is_active = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title,
        subtitle || '',
        badge || 'NXB Kim Đồng Nổi Bật',
        cta_text || 'Xem ngay',
        cta_link,
        theme || 'red',
        image_url || DEFAULT_IMAGE,
        display_order ?? 0,
        is_active === 0 || is_active === false ? 0 : 1,
        id
      ]
    );

    res.json({ message: 'Cập nhật banner thành công' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function deleteBanner(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await queryOne('SELECT * FROM banners WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ message: 'Không tìm thấy banner' });

    await query('DELETE FROM banners WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa banner khỏi trang chủ' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
