import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from './types';
import { findUserByEmail, listUsers } from './excelDb';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const COOKIE_NAME = 'eshop_token';

export interface AuthRequest extends Request {
  user?: User;
}

export function signToken(payload: { userId: number; isAdmin: boolean }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax'
  });
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; isAdmin: boolean; email?: string };
    let user: User | undefined;
    if (decoded.email) {
      user = findUserByEmail(decoded.email);
    } else {
      user = listUsers().find(u => u.id === decoded.userId);
    }
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    if (!req.user?.isAdmin) return res.status(403).json({ message: 'Admin only' });
    return next();
  });
}
