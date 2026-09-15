import { Request, Response } from 'express';
import { query, queryOne } from '../config/db.js';

const DISCOUNT_TYPES = ['PERCENTAGE', 'FIXED_AMOUNT'];

// Chuẩn hoá ngày từ form (chỉ chọn ngày: YYYY-MM-DD) sang DATETIME của MySQL.
// `endOfDay = true` dùng cho ngày KẾT THÚC: lấy 23:59:59 để mã còn hiệu lực hết ngày cuối,
// nếu để 00:00:00 thì mã sẽ chết ngay khi bước sang ngày kết thúc.
function toSqlDateTime(value: any, endOfDay = false): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (!s) return null;
  const normalized = s.replace('T', ' ');
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return `${normalized} ${endOfDay ? '23:59:59' : '00:00:00'}`;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(normalized)) return `${normalized}:00`;
  return normalized.slice(0, 19);
}

function formatVNDText(amount: number): string {
  return `${Math.round(amount).toLocaleString('vi-VN')}đ`;
}

/**
 * Kiểm tra 1 mã khuyến mãi có dùng được cho đơn hàng `subtotal` hay không.
 * Dùng chung cho cả trang Giỏ hàng (xem trước) và lúc tạo đơn (chốt thật).
 */
export function evaluatePromotion(promo: any, subtotal: number): { ok: boolean; message: string; discount_amount: number } {
  if (!promo) return { ok: false, message: 'Mã giảm giá không tồn tại', discount_amount: 0 };
  if (Number(promo.is_active) !== 1) return { ok: false, message: 'Mã giảm giá đang tạm dừng', discount_amount: 0 };

  const now = Date.now();
  if (promo.start_date && new Date(promo.start_date).getTime() > now) {
    return { ok: false, message: 'Mã giảm giá chưa đến thời gian sử dụng', discount_amount: 0 };
  }
  if (promo.end_date && new Date(promo.end_date).getTime() < now) {
    return { ok: false, message: 'Mã giảm giá đã hết hạn sử dụng', discount_amount: 0 };
  }

  const usageLimit = Number(promo.usage_limit);
  const timesUsed = Number(promo.times_used) || 0;
  if (usageLimit > 0 && timesUsed >= usageLimit) {
    return { ok: false, message: 'Mã giảm giá đã hết lượt sử dụng', discount_amount: 0 };
  }

  const minOrder = Number(promo.min_order_value) || 0;
  if (subtotal < minOrder) {
    return {
      ok: false,
      message: `Đơn hàng tối thiểu ${formatVNDText(minOrder)} mới dùng được mã này`,
      discount_amount: 0
    };
  }

  const value = Number(promo.discount_value) || 0;
  let discount = promo.discount_type === 'PERCENTAGE' ? (subtotal * value) / 100 : value;
  if (promo.discount_type === 'PERCENTAGE' && promo.max_discount) {
    discount = Math.min(discount, Number(promo.max_discount));
  }

  return {
    ok: true,
    message: `Áp dụng mã ${promo.code} thành công`,
    discount_amount: Math.max(0, Math.min(Math.round(discount), subtotal))
  };
}

// ===== Storefront =====

// Mã đang chạy, còn hiệu lực — hiển thị gợi ý ở trang Giỏ hàng (public)
export async function getActivePromotions(_req: Request, res: Response) {
  try {
    const promotions = await query(
      'SELECT id, code, title, discount_type, discount_value, min_order_value, max_discount, start_date, end_date FROM promotions WHERE is_active = 1 ORDER BY id DESC'
    );
    const now = Date.now();
    const usable = promotions.filter((p: any) => {
      if (p.start_date && new Date(p.start_date).getTime() > now) return false;
      if (p.end_date && new Date(p.end_date).getTime() < now) return false;
      return true;
    });
    res.json({ promotions: usable });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Kiểm tra mã + tạm tính, trả về số tiền được giảm (public)
export async function validatePromotion(req: Request, res: Response) {
  try {
    const { code, subtotal } = req.body;
    if (!code || !String(code).trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập mã giảm giá' });
    }

    const promo = await queryOne('SELECT * FROM promotions WHERE code = ?', [String(code).trim().toUpperCase()]);
    const result = evaluatePromotion(promo, Number(subtotal) || 0);

    if (!result.ok) {
      return res.status(400).json({ message: result.message });
    }

    res.json({
      message: result.message,
      discount_amount: result.discount_amount,
      promotion: {
        id: promo.id,
        code: promo.code,
        title: promo.title,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        min_order_value: promo.min_order_value,
        max_discount: promo.max_discount
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// ===== Admin =====

export async function getAllPromotions(_req: Request, res: Response) {
  try {
    const promotions = await query('SELECT * FROM promotions ORDER BY id DESC');
    res.json({ promotions });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function createPromotion(req: Request, res: Response) {
  try {
    const {
      code, title, discount_type, discount_value,
      min_order_value, max_discount, start_date, end_date, usage_limit, is_active
    } = req.body;

    if (!code || !String(code).trim()) return res.status(400).json({ message: 'Vui lòng nhập mã khuyến mãi' });
    if (!title || !String(title).trim()) return res.status(400).json({ message: 'Vui lòng nhập tên chương trình khuyến mãi' });

    const upperCode = String(code).trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,50}$/.test(upperCode)) {
      return res.status(400).json({ message: 'Mã chỉ gồm chữ, số, gạch ngang/gạch dưới và dài 3-50 ký tự' });
    }

    const type = DISCOUNT_TYPES.includes(discount_type) ? discount_type : 'PERCENTAGE';
    const value = Number(discount_value);
    if (!value || value <= 0) return res.status(400).json({ message: 'Giá trị giảm phải lớn hơn 0' });
    if (type === 'PERCENTAGE' && value > 100) return res.status(400).json({ message: 'Giảm theo % không được vượt quá 100%' });

    const existed = await queryOne('SELECT id FROM promotions WHERE code = ?', [upperCode]);
    if (existed) return res.status(400).json({ message: `Mã "${upperCode}" đã tồn tại, vui lòng dùng mã khác` });

    const startSql = toSqlDateTime(start_date);
    const endSql = toSqlDateTime(end_date, true);
    if (startSql && endSql && endSql < startSql) {
      return res.status(400).json({ message: 'Ngày kết thúc phải sau ngày bắt đầu' });
    }

    const result = await query(
      `INSERT INTO promotions (code, title, discount_type, discount_value, min_order_value, max_discount, start_date, end_date, usage_limit, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        upperCode,
        String(title).trim(),
        type,
        value,
        Number(min_order_value) || 0,
        max_discount ? Number(max_discount) : null,
        startSql,
        endSql,
        usage_limit === '' || usage_limit === undefined || usage_limit === null ? 1000 : Number(usage_limit),
        is_active === 0 || is_active === false ? 0 : 1
      ]
    );

    const promotionId = (result as any)[0]?.insertId || (result as any).insertId;
    res.status(201).json({ message: `Đã tạo mã khuyến mãi ${upperCode}`, promotionId });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function updatePromotion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      code, title, discount_type, discount_value,
      min_order_value, max_discount, start_date, end_date, usage_limit, is_active
    } = req.body;

    const current = await queryOne('SELECT * FROM promotions WHERE id = ?', [id]);
    if (!current) return res.status(404).json({ message: 'Không tìm thấy mã khuyến mãi' });

    if (!code || !String(code).trim()) return res.status(400).json({ message: 'Vui lòng nhập mã khuyến mãi' });
    if (!title || !String(title).trim()) return res.status(400).json({ message: 'Vui lòng nhập tên chương trình khuyến mãi' });

    const upperCode = String(code).trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,50}$/.test(upperCode)) {
      return res.status(400).json({ message: 'Mã chỉ gồm chữ, số, gạch ngang/gạch dưới và dài 3-50 ký tự' });
    }

    const type = DISCOUNT_TYPES.includes(discount_type) ? discount_type : 'PERCENTAGE';
    const value = Number(discount_value);
    if (!value || value <= 0) return res.status(400).json({ message: 'Giá trị giảm phải lớn hơn 0' });
    if (type === 'PERCENTAGE' && value > 100) return res.status(400).json({ message: 'Giảm theo % không được vượt quá 100%' });

    const dup = await queryOne('SELECT id FROM promotions WHERE code = ? AND id != ?', [upperCode, id]);
    if (dup) return res.status(400).json({ message: `Mã "${upperCode}" đã thuộc chương trình khác` });

    const startSql = toSqlDateTime(start_date);
    const endSql = toSqlDateTime(end_date, true);
    if (startSql && endSql && endSql < startSql) {
      return res.status(400).json({ message: 'Ngày kết thúc phải sau ngày bắt đầu' });
    }

    await query(
      `UPDATE promotions SET code = ?, title = ?, discount_type = ?, discount_value = ?, min_order_value = ?,
        max_discount = ?, start_date = ?, end_date = ?, usage_limit = ?, is_active = ? WHERE id = ?`,
      [
        upperCode,
        String(title).trim(),
        type,
        value,
        Number(min_order_value) || 0,
        max_discount ? Number(max_discount) : null,
        startSql,
        endSql,
        usage_limit === '' || usage_limit === undefined || usage_limit === null ? 1000 : Number(usage_limit),
        is_active === 0 || is_active === false ? 0 : 1,
        id
      ]
    );

    res.json({ message: 'Cập nhật chương trình khuyến mãi thành công' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Bật / tạm dừng nhanh 1 mã
export async function togglePromotion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const current = await queryOne('SELECT * FROM promotions WHERE id = ?', [id]);
    if (!current) return res.status(404).json({ message: 'Không tìm thấy mã khuyến mãi' });

    const nextState = Number(current.is_active) === 1 ? 0 : 1;
    await query('UPDATE promotions SET is_active = ? WHERE id = ?', [nextState, id]);

    res.json({
      message: nextState === 1 ? `Đã bật lại mã ${current.code}` : `Đã tạm dừng mã ${current.code}`,
      is_active: nextState
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function deletePromotion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const current = await queryOne('SELECT * FROM promotions WHERE id = ?', [id]);
    if (!current) return res.status(404).json({ message: 'Không tìm thấy mã khuyến mãi' });

    await query('DELETE FROM promotions WHERE id = ?', [id]);
    res.json({ message: `Đã xóa mã khuyến mãi ${current.code}` });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
