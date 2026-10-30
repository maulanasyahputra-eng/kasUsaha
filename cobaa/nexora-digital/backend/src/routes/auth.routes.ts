import { Router } from 'express';
import argon2 from 'argon2';
import { z } from 'zod';
import { prisma } from '../db';
import { AppError, validate } from '../middleware/error';
import { createSession, revokeSession, requireAuth } from '../middleware/auth';

import rateLimit from 'express-rate-limit';

const router = Router();

/** Buat sesi + token, format respons standar. */
async function issueSession(user: { id: string; role: string; email: string; name?: string }) {
  const { token, expiresAt } = await createSession({ id: user.id, role: user.role, email: user.email });
  return { token, expiresAt: expiresAt.toISOString(), user };
}

// Rate limit ketat khusus credential endpoints (anti brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Terlalu banyak percobaan. Coba lagi nanti.' } },
});

const registerSchema = z.object({
  email: z.string().email().max(120).toLowerCase(),
  password: z
    .string()
    .min(10, 'Password minimal 10 karakter')
    .max(72)
    .regex(/[a-z]/, 'Harus mengandung huruf kecil')
    .regex(/[A-Z]/, 'Harus mengandung huruf besar')
    .regex(/[0-9]/, 'Harus mengandung angka'),
  name: z.string().min(2).max(80).regex(/^[\p{L}\p{N} .'-]+$/u, 'Nama mengandung karakter tidak valid'),
});

const loginSchema = z.object({
  email: z.string().email().max(120).toLowerCase(),
  password: z.string().min(1).max(72),
});

// Parameter argon2id — rekomendasi OWASP (m=19MiB, t=2, p=1)
const ARGON_OPTS = { type: 2 as const, memoryCost: 19456, timeCost: 2, parallelism: 1 }; // 2 = argon2id

router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      // Anti-enumeration: jangan bocorkan bahwa email terdaftar? Registration memang publik;
      // pesan generik menyulitkan enumeration massal.
      throw new AppError(409, 'REGISTER_FAILED', 'Registrasi gagal. Email mungkin sudah terdaftar atau data tidak valid.');
    }
    const user = await prisma.user.create({
      data: { email, name, passwordHash: await argon2.hash(password, ARGON_OPTS), wallet: { create: {} } },
    });
    const s = await issueSession(user);
    res.status(201).json(s);
  } catch (e) { next(e); }
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    // Pesan IDENTIK untuk user-tidak-ada dan password-salah (anti user enumeration).
    const INVALID = new AppError(401, 'INVALID_LOGIN', 'Email atau password salah.');
    if (!user || !user.isActive) throw INVALID;

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppError(429, 'LOCKED', 'Akun terkunci sementara karena percobaan gagal berulang. Coba lagi nanti.');
    }

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) {
      const failed = user.failedLogins + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLogins: failed, lockedUntil: failed >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null },
      });
      throw INVALID;
    }
    await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
    const s = await issueSession(user);
    res.json(s);
  } catch (e) { next(e); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, wallet: { select: { balance: true } } },
    });
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User tidak ditemukan.');
    res.json({ user: { ...user, wallet: user.wallet ? { balance: user.wallet.balance.toString() } : null } });
  } catch (e) { next(e); }
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    // role TIDAK bisa diubah dari sini — hanya name/password
    const schema = z.object({
      name: z.string().min(2).max(80).regex(/^[\p{L}\p{N} .'-]+$/u).optional(),
      currentPassword: z.string().max(72).optional(),
      password: z.string().min(10).max(72).optional(),
    }).refine((d) => !(d.password && !d.currentPassword), { message: 'Konfirmasi password lama wajib' });
    const data = schema.parse(req.body);
    const update: Record<string, unknown> = {};
    if (data.name) update.name = data.name;
    if (data.password) {
      // Ganti password wajib konfirmasi password lama
      const me = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!me || !data.currentPassword || !(await argon2.verify(me.passwordHash, data.currentPassword))) {
        throw new AppError(403, 'WRONG_PASSWORD', 'Password saat ini salah.');
      }
      update.passwordHash = await argon2.hash(data.password, ARGON_OPTS);
      // Rotasi sesi: cabut semua sesi lain setelah ganti password
      await prisma.session.updateMany({
        where: { userId: me.id, revokedAt: null, tokenHash: { not: req.user!.sid } },
        data: { revokedAt: new Date() },
      });
    }
    const user = await prisma.user.update({ where: { id: req.user!.id }, data: update });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) { next(e); }
});

/** Logout: revokes session server-side. Token setelah logout tidak berguna. */
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await revokeSession(req.user!.sid);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
