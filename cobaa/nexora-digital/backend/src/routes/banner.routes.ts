import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../db';
import { AppError, validate } from '../middleware/error';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// ============ UPLOAD (disk, bukan base64) ============
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'banners');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 3 * 1024 * 1024; // 3MB

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `bn-${crypto.randomBytes(10).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      cb(new AppError(400, 'BAD_FILE', 'Format gambar harus JPG, PNG, WebP, atau GIF.'));
      return;
    }
    cb(null, true);
  },
});

function deleteOldImage(imagePath?: string | null) {
  if (!imagePath || !imagePath.startsWith('/uploads/banners/')) return;
  const file = path.join(process.cwd(), imagePath);
  fs.promises.unlink(file).catch(() => undefined);
}

// ============ PUBLIC: banner aktif (periode valid) ============
router.get('/', async (_req, res, next) => {
  try {
    const now = new Date();
    const banners = await prisma.bannerPromo.findMany({
      where: {
        isActive: true,
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
      },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, title: true, subtitle: true, image: true, buttonText: true, buttonUrl: true },
    });
    res.json({ banners });
  } catch (e) { next(e); }
});

// ============ ADMIN ============
const bannerSchema = z.object({
  title: z.string().min(2).max(200),
  subtitle: z.string().max(500).optional(),
  buttonText: z.string().max(50).optional(),
  // URL absolut ATAU path internal diawali "/"
  buttonUrl: z.string().max(500).refine((v) => v === '' || /^https?:\/\/.+/.test(v) || v.startsWith('/'), 'URL tidak valid').optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
  startAt: z.string().datetime().optional().nullable(),
  endAt: z.string().datetime().optional().nullable(),
});

router.get('/admin/all', requireAdmin, async (_req, res, next) => {
  try {
    const banners = await prisma.bannerPromo.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ banners });
  } catch (e) { next(e); }
});

// Multipart form: fields + optional image file
const cpUpload = upload.single('image');

router.post('/admin', requireAdmin, (req, res, next) => {
  cpUpload(req, res, (err) => {
    if (err) {
      next(err instanceof AppError ? err : new AppError(400, 'UPLOAD_ERROR', err.message.slice(0, 150)));
      return;
    }
    try {
      const b = req.body;
      const parsed = bannerSchema.safeParse({
        title: b.title,
        subtitle: b.subtitle || undefined,
        buttonText: b.buttonText || undefined,
        buttonUrl: b.buttonUrl || undefined,
        sortOrder: b.sortOrder ? Number(b.sortOrder) : undefined,
        isActive: b.isActive === undefined ? undefined : b.isActive === 'true' || b.isActive === true,
        startAt: b.startAt || undefined,
        endAt: b.endAt || undefined,
      });
      if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues.map((i) => `${i.path}: ${i.message}`).join('; '));
      if (!req.file && !b.keepImage) throw new AppError(400, 'IMAGE_REQUIRED', 'Gambar banner wajib diunggah.');

      const d = parsed.data;
      prisma.bannerPromo.create({
        data: {
          title: d.title,
          subtitle: d.subtitle ?? null,
          image: req.file ? `/uploads/banners/${req.file.filename}` : (b.keepImage as string),
          buttonText: d.buttonText ?? null,
          buttonUrl: d.buttonUrl || null,
          sortOrder: d.sortOrder ?? 0,
          isActive: d.isActive ?? true,
          startAt: d.startAt ? new Date(d.startAt) : null,
          endAt: d.endAt ? new Date(d.endAt) : null,
        },
      }).then((banner) => {
        void prisma.auditLog.create({
          data: { userId: req.user!.id, action: 'BANNER_CREATE', entity: 'BannerPromo', entityId: banner.id, detail: { title: d.title } },
        });
        res.status(201).json({ banner });
      }).catch(next);
    } catch (e) { next(e); }
  });
});

router.patch('/admin/:id', requireAdmin, (req, res, next) => {
  cpUpload(req, res, (err) => {
    if (err) {
      next(err instanceof AppError ? err : new AppError(400, 'UPLOAD_ERROR', err.message.slice(0, 150)));
      return;
    }
    try {
      const b = req.body;
      const data: Record<string, unknown> = {};
      if (b.title !== undefined) data.title = b.title;
      if (b.subtitle !== undefined) data.subtitle = b.subtitle || null;
      if (b.buttonText !== undefined) data.buttonText = b.buttonText || null;
      if (b.buttonUrl !== undefined) data.buttonUrl = b.buttonUrl || null;
      if (b.sortOrder !== undefined) data.sortOrder = Number(b.sortOrder);
      if (b.isActive !== undefined) data.isActive = b.isActive === 'true' || b.isActive === true;
      if (b.startAt !== undefined) data.startAt = b.startAt ? new Date(b.startAt) : null;
      if (b.endAt !== undefined) data.endAt = b.endAt ? new Date(b.endAt) : null;
      if (req.file) data.image = `/uploads/banners/${req.file.filename}`;

      prisma.bannerPromo.update({ where: { id: req.params.id }, data })
        .then(async (banner) => {
          if (req.file && b.oldImage) deleteOldImage(String(b.oldImage));
          await prisma.auditLog.create({
            data: { userId: req.user!.id, action: 'BANNER_UPDATE', entity: 'BannerPromo', entityId: banner.id, detail: { fields: Object.keys(data) } },
          });
          res.json({ banner });
        }).catch(next);
    } catch (e) { next(e); }
  });
});

router.delete('/admin/:id', requireAdmin, async (req, res, next) => {
  try {
    const banner = await prisma.bannerPromo.delete({ where: { id: req.params.id } });
    deleteOldImage(banner.image);
    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'BANNER_DELETE', entity: 'BannerPromo', entityId: banner.id, detail: { title: banner.title } },
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
