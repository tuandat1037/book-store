import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.js';

// ADMIN only: list all accounts with their role
export async function listUsers(req: AuthRequest, res: Response) {
  try {
    const users = await query(
      'SELECT u.id, u.full_name, u.email, u.phone, u.address, u.role_id, r.name as role_name, u.created_at FROM users u LEFT JOIN roles r ON u.role_id = r.id ORDER BY u.role_id ASC, u.id ASC'
    );
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// ADMIN only: create a staff account (employee or another admin)
export async function createUser(req: AuthRequest, res: Response) {
  try {
    const { full_name, email, password, phone, role_id } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập họ tên, email và mật khẩu' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu tối thiểu 6 ký tự' });
    }

    // role 1 = ADMIN, 2 = EMPLOYEE. Staff management is admin-only, so customers
    // are expected to self-register on the storefront instead.
    const newRoleId = parseInt(role_id) === 1 ? 1 : 2;

    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ message: 'Email này đã tồn tại trong hệ thống' });
    }

    const role = await queryOne('SELECT name FROM roles WHERE id = ?', [newRoleId]);
    if (!role) {
      return res.status(400).json({ message: 'Nhóm quyền không hợp lệ' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (role_id, full_name, email, password, phone) VALUES (?, ?, ?, ?, ?)',
      [newRoleId, full_name, email, hashedPassword, phone || '']
    );

    const userId = (result as any)[0]?.insertId || (result as any).insertId;
    res.status(201).json({
      message: `Tạo tài khoản ${role.name === 'ADMIN' ? 'quản trị' : 'nhân viên'} thành công`,
      userId
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// ADMIN only: edit staff info (name, email, phone, optional password reset)
export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { full_name, email, phone, password } = req.body;

    if (!full_name || !full_name.trim() || !email) {
      return res.status(400).json({ message: 'Vui lòng nhập họ tên và email' });
    }
    if (password && password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới tối thiểu 6 ký tự (hoặc bỏ trống để giữ nguyên)' });
    }

    const target = await queryOne('SELECT id, role_id FROM users WHERE id = ?', [id]);
    if (!target) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    if ([1, 2].indexOf(target.role_id) === -1) {
      return res.status(400).json({ message: 'Không thể sửa tài khoản khách hàng tại đây' });
    }

    const dup = await queryOne('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
    if (dup) {
      return res.status(400).json({ message: 'Email này đã thuộc về tài khoản khác' });
    }

    // COALESCE keeps the old hash when password field is left blank
    const hashed = password ? await bcrypt.hash(password, 10) : null;
    await query(
      'UPDATE users SET full_name = ?, email = ?, phone = ?, password = COALESCE(?, password), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [full_name.trim(), email, phone || '', hashed, id]
    );

    res.json({ message: 'Cập nhật thông tin nhân viên thành công' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// ADMIN only: promote / demote a staff account between ADMIN and EMPLOYEE
export async function updateUserRole(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { role_id } = req.body;
    const targetRoleId = parseInt(role_id);

    if (![1, 2].includes(targetRoleId)) {
      return res.status(400).json({ message: 'Chỉ chuyển đổi được giữa ADMIN và EMPLOYEE' });
    }
    if (req.user!.id === parseInt(id) && targetRoleId !== 1) {
      return res.status(400).json({ message: 'Bạn không thể hạ quyền chính mình' });
    }

    const target = await queryOne('SELECT id, role_id FROM users WHERE id = ?', [id]);
    if (!target) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    if ([1, 2].indexOf(target.role_id) === -1) {
      return res.status(400).json({ message: 'Không thể đổi quyền tài khoản khách hàng' });
    }

    await query('UPDATE users SET role_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [targetRoleId, id]);
    res.json({ message: 'Đã cập nhật nhóm quyền' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// ADMIN only: remove a staff account
export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    if (req.user!.id === parseInt(id)) {
      return res.status(400).json({ message: 'Bạn không thể xóa chính tài khoản của mình' });
    }

    const target = await queryOne('SELECT id, role_id FROM users WHERE id = ?', [id]);
    if (!target) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    if ([1, 2].indexOf(target.role_id) === -1) {
      return res.status(400).json({ message: 'Không thể xóa tài khoản khách hàng tại đây' });
    }

    await query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa tài khoản' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
