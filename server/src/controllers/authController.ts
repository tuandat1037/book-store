import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'kimdong_bookstore_secret_jwt_key_2026_super_secure';

export async function register(req: Request, res: Response) {
  try {
    const { full_name, email, password, phone, address } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
    }

    const existingUser = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'Email này đã được đăng ký tài khoản' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (role_id, full_name, email, password, phone, address) VALUES (3, ?, ?, ?, ?, ?)',
      [full_name, email, hashedPassword, phone || '', address || '']
    );

    const userId = (result as any)[0]?.insertId || (result as any).insertId;
    const userRole = await queryOne('SELECT name FROM roles WHERE id = 3');

    const token = jwt.sign(
      { id: userId, role_id: 3, role_name: userRole.name, email, full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công',
      token,
      user: { id: userId, full_name, email, role: 'CUSTOMER', phone, address }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Lỗi hệ thống khi đăng ký' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập Email và Mật khẩu' });
    }

    const user = await queryOne(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }

    const token = jwt.sign(
      { id: user.id, role_id: user.role_id, role_name: user.role_name, email: user.email, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role_name,
        phone: user.phone,
        address: user.address,
        province: user.province,
        district: user.district,
        ward: user.ward
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Lỗi hệ thống khi đăng nhập' });
  }
}

export async function getProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Chưa xác thực' });

    const user = await queryOne(
      'SELECT u.id, u.full_name, u.email, u.phone, u.address, u.province, u.district, u.ward, u.avatar, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [req.user.id]
    );

    if (!user) return res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản' });

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Chưa xác thực' });
    const { full_name, phone, address, province, district, ward } = req.body;

    await query(
      'UPDATE users SET full_name = ?, phone = ?, address = ?, province = ?, district = ?, ward = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [full_name, phone, address, province, district, ward, req.user.id]
    );

    res.json({ message: 'Cập nhật thông tin cá nhân thành công' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Any logged-in user: change own password (verify old password first)
export async function changePassword(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Chưa xác thực' });
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới tối thiểu 6 ký tự' });
    }
    if (current_password === new_password) {
      return res.status(400).json({ message: 'Mật khẩu mới không được trùng mật khẩu hiện tại' });
    }

    const user = await queryOne('SELECT id, password FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });

    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await query('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashed, req.user.id]);

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
