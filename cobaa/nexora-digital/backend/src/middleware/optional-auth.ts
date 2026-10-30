import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../db';
import type { AuthUser } from './auth';

/** Set req.user jika token valid DAN sesi masih aktif; tidak menolak request (guest tetap bisa lanjut). */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), config.jwtSecret) as { sub: string; role: string; email: string; sid?: string };
      if (payload.sid) {
        const session = await prisma.session.findUnique({ where: { tokenHash: payload.sid }, include: { user: true } });
        if (session && !session.revokedAt && session.expiresAt > new Date() && session.user.isActive) {
          req.user = { id: session.user.id, role: session.user.role as AuthUser['role'], email: session.user.email, sid: payload.sid };
        }
      }
    } catch { /* guest */ }
  }
  next();
}
