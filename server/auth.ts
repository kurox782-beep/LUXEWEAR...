import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from './db.ts';

const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'production'
    ? ''
    : 'local-development-only-secret-change-before-deployment'
);

if (process.env.NODE_ENV === 'production' && !JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production.');
}

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  let token = req.cookies?.luxewear_session;
  
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Admin privileges required.' });
    return;
  }

  // Also verify user still exists in database and is still admin
  const dbUser = queryOne<{ id: number; role: string }>('SELECT id, role FROM users WHERE id = ?', [req.user.userId]);
  if (!dbUser || dbUser.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: User is no longer an active admin.' });
    return;
  }

  next();
}
