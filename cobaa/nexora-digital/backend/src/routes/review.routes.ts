import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { AppError, validate } from '../middleware/error';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

/** Ulasan publik per produk */
router.get('/products/:productId', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const [total, reviews] = await Promise.all([
      prisma.review.count({ where: { productId: req.params.productId, status: 'PUBLISHED' } }),
      prisma.review.findMany({
        where: { productId: req.params.productId, status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * 10, take: 10,
        include: { user: { select: { name: true } } },
      }),
    ]);
    const agg = await prisma.review.aggregate({
      where: { productId: req.params.productId, status: 'PUBLISHED' },
      _avg: { rating: true },
    });
    res.json({
      reviews: reviews.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, name: r.user.name, createdAt: r.createdAt })),
      avgRating: agg._avg.rating ?? null,
      pagination: { page, perPage: 10, total, totalPages: Math.ceil(total / 10) },
    });
  } catch (e) { next(e); }
});

/**
 * Endpoint admin untuk REVIEW tapi bukan bagian /admin — mounted di /api/reviews/admin
 */
router.post('/', requireAuth, validate(z.object({
  productId: z.string(),
  orderId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})), async (req, res, next) => {
  try {
    const { productId, orderId, rating, comment } = req.body;
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { product: true } });
    if (!order || order.userId !== req.user!.id) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order tidak ditemukan.');
    if (order.fulfillment !== 'SUCCESS') throw new AppError(403, 'NOT_ELIGIBLE', 'Ulasan hanya untuk pesanan yang berhasil.');
    if (order.productId !== productId) throw new AppError(400, 'MISMATCH', 'Produk tidak sesuai pesanan.');
    const exists = await prisma.review.findUnique({ where: { orderId } });
    if (exists) throw new AppError(409, 'ALREADY_REVIEWED', 'Pesanan ini sudah pernah diulas.');
    const review = await prisma.review.create({ data: { productId, userId: req.user!.id, orderId, rating, comment } });
    res.status(201).json({ review });
  } catch (e) { next(e); }
});

/** Review milik user */
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { userId: req.user!.id },
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ reviews });
  } catch (e) { next(e); }
});

/** Admin: moderasi */
router.get('/admin/all', requireAdmin, async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      include: { user: { select: { email: true } }, product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }, take: 200,
    });
    res.json({ reviews });
  } catch (e) { next(e); }
});

router.patch('/admin/:id', requireAdmin, validate(z.object({ status: z.enum(['PUBLISHED', 'REJECTED']) })), async (req, res, next) => {
  try {
    const review = await prisma.review.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'REVIEW_MODERATE', entity: 'Review', entityId: review.id, detail: req.body } });
    res.json({ review });
  } catch (e) { next(e); }
});

export default router;
