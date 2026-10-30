import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { AppError } from './error';
import { config } from '../config';

export interface AuthUser {
  id: string;
  role: 'CUSTOMER' | 'ADMIN';
  email: string;
  sid: string; // session id — untuk validasi & revocation server-side
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_TTL_SEC = 60 * 60 * 2; // access token 2 jam; refresh lewat re-login (token pendek = jendela pencurian kecil)

/**
 * Verifikasi JWT + validasi SESSION server-side.
 * - Token dicuri/kunci JWT bocor tetap bisa dicabut lewat revokeSession().
 * - Jika user dinonaktifkan atau role berubah di DB, token lama langsung ditolak.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new AppError(401, 'UNAUTHORIZED', 'Silakan login terlebih dahulu.'));
    return;
  }
  let payload: { sub: string; role: string; email: string; sid: string };
  try {
    payload = jwt.verify(header.slice(7), config.jwtSecret) as typeof payload;
  } catch {
    next(new AppError(401, 'UNAUTHORIZED', 'Sesi tidak valid atau kedaluwarsa.'));
    return;
  }
  if (!payload.sid) {
    next(new AppError(401, 'UNAUTHORIZED', 'Sesi tidak valid.'));
    return;
  }
  const session = await prisma.session.findUnique({ where: { tokenHash: payload.sid }, include: { user: true } });
  if (!session || session.revokedAt || session.expiresAt < new Date() || !session.user.isActive) {
    next(new AppError(401, 'SESSION_REVOKED', 'Sesi telah berakhir. Silakan login kembali.'));
    return;
  }
  // Role dari DATABASE, bukan dari klaim token (cegah privilege escalation via forged/expired-role token)
  req.user = { id: session.user.id, role: session.user.role as AuthUser['role'], email: session.user.email, sid: payload.sid };
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  requireAuth(req, _res, (e?: unknown) => {
    if (e) return next(e);
    if (req.user?.role !== 'ADMIN') {
      next(new AppError(403, 'FORBIDDEN', 'Akses hanya untuk admin.'));
      return;
    }
    next();
  });
}

export function hashSessionToken(token: string): string {
  return jwt.sign({ s: token }, config.jwtSecret, { noTimestamp: true });
}

/** Buat sesi server-side + access token. tokenHash disimpan (hash, bukan token mentah). */
export async function createSession(user: { id: string; role: string; email: string }) {
  const sid = require('crypto').randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + JWT_TTL_SEC * 2 * 1000); // sesi 4 jam, access token 2 jam
  await prisma.session.create({
    data: { userId: user.id, tokenHash: sid, expiresAt },
  });
  const token = jwt.sign(
    { sub: user.id, role: user.role, email: user.email, sid },
    config.jwtSecret,
    { expiresIn: JWT_TTL_SEC }
  );
  return { token, expiresAt };
}

/** Logout server-side: cabut sesi. */
export async function revokeSession(sid: string) {
  await prisma.session.updateMany({ where: { tokenHash: sid, revokedAt: null }, data: { revokedAt: new Date() } });
}
