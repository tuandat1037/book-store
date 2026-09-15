import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.js';

// role_id 3 = CUSTOMER
const CUSTOMER_ROLE_ID = 3;

// Chỉ trả về các trường cần thiết (không bao giờ lộ password ra ngoài)
function mapCustomer(u: any) {
  return {
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    phone: u.phone || '',
    address: u.address || '',
    province: u.province || '',
    district: u.district || '',
    ward: u.ward || '',
    avatar: u.avatar || '',
    role_id: u.role_id,
    role_name: u.role_name || 'CUSTOMER',
    created_at: u.created_at
  };
}

// Thống kê mua hàng của 1 khách (tính từ danh sách đơn đã tải)
function summarizeOrders(orders: any[]) {
  const list = orders || [];
  const valid = list.filter((o) => o.order_status !== 'CANCELLED');
  const totalSpent = valid.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const lastOrderAt = list.reduce((latest: string | null, o) => {
    if (!o.created_at) return latest;
    if (!latest) return o.created_at;
    return new Date(o.created_at).getTime() > new Date(latest).getTime() ? o.created_at : latest;
  }, null);

  return {
    order_count: list.length,
    cancelled_count: list.length - valid.length,
    total_spent: totalSpent,
    last_order_at: lastOrderAt
  };
}

// Gom đơn hàng theo user_id để tránh truy vấn từng khách một
async function ordersByUser() {
  const orders = await query(
    'SELECT id, user_id, order_code, total_amount, order_status, created_at FROM orders ORDER BY id DESC'
  );
  const map = new Map<string, any[]>();
  for (const o of orders) {
    const key = String(o.user_id);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(o);
  }
  return map;
}

// ADMIN + EMPLOYEE: danh sách khách hàng kèm thống kê mua hàng
export async function listCustomers(req: AuthRequest, res: Response) {
  try {
    const users = await query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.address, u.province, u.district, u.ward, u.avatar, u.role_id, r.name as role_name, u.created_at
       FROM users u LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.role_id = ${CUSTOMER_ROLE_ID}
       ORDER BY u.id DESC`
    );

    const grouped = await ordersByUser();

    const customers = users
      .map((u: any) => ({ ...mapCustomer(u), ...summarizeOrders(grouped.get(String(u.id)) || []) }))
      .sort((a, b) => Number(b.id) - Number(a.id));

    const withOrders = customers.filter((c) => c.order_count > 0).length;
    const totalSpent = customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0);

    res.json({
      customers,
      summary: {
        total: customers.length,
        withOrders,
        noOrders: customers.length - withOrders,
        totalSpent
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// ADMIN + EMPLOYEE: chi tiết 1 khách hàng + đơn hàng gần đây
export async function getCustomerDetail(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const user = await queryOne(
      `SELECT u.id, u.full_name, u.email, u.phone, u.address, u.province, u.district, u.ward, u.avatar, u.role_id, r.name as role_name, u.created_at
       FROM users u LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.role_id = ${CUSTOMER_ROLE_ID}`,
      [id]
    );
    if (!user) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });

    const orders = await query('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [id]);

    // Gắn số món + ảnh đại diện sản phẩm đầu tiên cho từng đơn
    for (const order of orders) {
      const items = await query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }

    res.json({
      customer: mapCustomer(user),
      stats: summarizeOrders(orders),
      orders
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// ADMIN: cập nhật thông tin khách hàng (kèm đặt lại mật khẩu nếu cần)
export async function updateCustomer(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { full_name, email, phone, address, province, district, ward, password } = req.body;

    if (!full_name || !String(full_name).trim() || !email) {
      return res.status(400).json({ message: 'Vui lòng nhập họ tên và email khách hàng' });
    }
    if (String(email).indexOf('@') === -1) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    const target = await queryOne('SELECT id, role_id FROM users WHERE id = ?', [id]);
    if (!target) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    if (Number(target.role_id) !== CUSTOMER_ROLE_ID) {
      return res.status(400).json({ message: 'Tài khoản này không phải khách hàng — hãy sửa ở trang Tài Khoản Hệ Thống' });
    }

    if (password && String(password).length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới tối thiểu 6 ký tự (hoặc bỏ trống để giữ nguyên)' });
    }

    const dup = await queryOne('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
    if (dup) return res.status(400).json({ message: 'Email này đã thuộc về tài khoản khác' });

    // COALESCE giữ mật khẩu cũ khi để trống
    const hashed = password ? await bcrypt.hash(String(password), 10) : null;
    await query(
      `UPDATE users SET full_name = ?, email = ?, phone = ?, address = ?, province = ?, district = ?, ward = ?,
        password = COALESCE(?, password), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [
        String(full_name).trim(),
        email,
        phone || '',
        address || '',
        province || '',
        district || '',
        ward || '',
        hashed,
        id
      ]
    );

    res.json({ message: 'Cập nhật thông tin khách hàng thành công' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
