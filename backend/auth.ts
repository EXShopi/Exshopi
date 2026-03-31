import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { UserRole } from './database';
import { db } from './database';

export type BackofficeRole = 'admin' | 'super_admin' | 'finance_manager' | 'support_agent';
export type AppRole = UserRole | 'finance_manager' | 'support_agent';
export type AdminPermission =
  | 'dashboard:view'
  | 'vendors:view'
  | 'vendors:manage'
  | 'catalog:view'
  | 'catalog:review'
  | 'inventory:view'
  | 'orders:view'
  | 'orders:manage'
  | 'returns:view'
  | 'returns:manage'
  | 'customers:view'
  | 'customers:manage'
  | 'commissions:view'
  | 'payouts:view'
  | 'payouts:manage'
  | 'categories:manage'
  | 'banners:manage'
  | 'offers:manage'
  | 'reports:view'
  | 'settings:manage'
  | 'support:view'
  | 'support:manage'
  | 'audit:view';

const getJwtSecret = (envKey: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET', fallback: string) => {
  const configured = process.env[envKey];
  if (configured) return configured;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${envKey} must be configured in production`);
  }

  return fallback;
};

const ACCESS_SECRET = getJwtSecret('JWT_ACCESS_SECRET', 'exshopi-dev-access-secret');
const REFRESH_SECRET = getJwtSecret('JWT_REFRESH_SECRET', 'exshopi-dev-refresh-secret');
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || '7d';

export interface AuthenticatedUser {
  id: string;
  role: AppRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const signAccessToken = (user: { id: string; role: AppRole }) =>
  jwt.sign({ sub: user.id, role: user.role, type: 'access' }, ACCESS_SECRET, { expiresIn: ACCESS_TTL } as jwt.SignOptions);

export const signRefreshToken = (user: { id: string; role: AppRole }) =>
  jwt.sign({ sub: user.id, role: user.role, type: 'refresh' }, REFRESH_SECRET, { expiresIn: REFRESH_TTL } as jwt.SignOptions);

export const verifyRefreshToken = (token: string) => jwt.verify(token, REFRESH_SECRET) as jwt.JwtPayload;

const resolveBearerToken = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const cookieToken = req.cookies?.access_token;
  return typeof cookieToken === 'string' ? cookieToken : '';
};

export const tryAuthenticateRequest = (req: Request): AuthenticatedUser | null => {
  const token = resolveBearerToken(req);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as jwt.JwtPayload;
    return {
      id: String(payload.sub),
      role: String(payload.role) as AppRole,
    };
  } catch {
    return null;
  }
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = resolveBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as jwt.JwtPayload;
    req.user = {
      id: String(payload.sub),
      role: String(payload.role) as AppRole,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireAnyRole =
  (...roles: AppRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };

export const isBackofficeRole = (role?: string | null): role is BackofficeRole =>
  role === 'admin' || role === 'super_admin' || role === 'finance_manager' || role === 'support_agent';

export const isAdminLike = (role?: string | null) => role === 'admin' || role === 'super_admin';
export const canAccessFinance = (role?: string | null) => role === 'super_admin' || role === 'admin' || role === 'finance_manager';
export const canAccessSupport = (role?: string | null) => role === 'super_admin' || role === 'admin' || role === 'support_agent';

const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  'dashboard:view',
  'vendors:view',
  'vendors:manage',
  'catalog:view',
  'catalog:review',
  'inventory:view',
  'orders:view',
  'orders:manage',
  'returns:view',
  'returns:manage',
  'customers:view',
  'customers:manage',
  'commissions:view',
  'payouts:view',
  'payouts:manage',
  'categories:manage',
  'banners:manage',
  'offers:manage',
  'reports:view',
  'settings:manage',
  'support:view',
  'support:manage',
  'audit:view',
];

export const ADMIN_PERMISSION_MATRIX: Record<string, AdminPermission[]> = {
  super_admin: ALL_ADMIN_PERMISSIONS,
  admin: [
    'dashboard:view',
    'vendors:view',
    'vendors:manage',
    'catalog:view',
    'catalog:review',
    'inventory:view',
    'orders:view',
    'orders:manage',
    'returns:view',
    'returns:manage',
    'customers:view',
    'customers:manage',
    'commissions:view',
    'payouts:view',
    'payouts:manage',
    'categories:manage',
    'banners:manage',
    'offers:manage',
    'reports:view',
    'settings:manage',
    'support:view',
    'support:manage',
    'audit:view',
  ],
  finance_manager: [
    'dashboard:view',
    'orders:view',
    'returns:view',
    'customers:view',
    'commissions:view',
    'payouts:view',
    'payouts:manage',
    'reports:view',
    'audit:view',
  ],
  support_agent: [
    'dashboard:view',
    'orders:view',
    'orders:manage',
    'returns:view',
    'returns:manage',
    'customers:view',
    'customers:manage',
    'support:view',
    'support:manage',
    'audit:view',
  ],
};

export const hasAdminPermission = (role: string | null | undefined, permission: AdminPermission) =>
  Boolean(role && ADMIN_PERMISSION_MATRIX[role]?.includes(permission));

export const requireAdminPermission =
  (permission: AdminPermission) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!hasAdminPermission(req.user?.role, permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, stored: string) {
  if (!stored) return false;

  // Backward-compatible upgrade path for legacy plain-text JSON users.
  const looksHashed = stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$');
  if (looksHashed) {
    return bcrypt.compare(password, stored);
  }

  if (password === stored) {
    return true;
  }

  return false;
}

export async function upgradeLegacyPasswordIfNeeded(userId: string, password: string, stored: string) {
  const looksHashed = stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$');
  if (looksHashed || password !== stored) return;
  const hashed = await hashPassword(password);
  db.updateUser(userId, { password: hashed });
}
