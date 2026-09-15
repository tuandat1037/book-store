import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role_id: number;
    role_name: string;
    email: string;
    full_name: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'kimdong_bookstore_secret_jwt_key_2026_super_secure';

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Phiên đăng nhập hết hạn hoặc không hợp lệ' });
    }
    req.user = decoded;
    next();
  });
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (!err) {
        req.user = decoded;
      }
      next();
    });
  } else {
    next();
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Chưa xác thực người dùng' });
    }

    if (!allowedRoles.includes(req.user.role_name)) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này' });
    }

    next();
  };
}
