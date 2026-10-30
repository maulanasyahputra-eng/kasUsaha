import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../db';
import { AppError, validate } from '../middleware/error';
import { optionalAuth } from '../middleware/optional-auth';
import { requireAuth } from '../middleware/auth';
import { createOrder } from '../services/order.service';
import { applyWalletChange } from '../services/wallet.service';
import { markOrderPaid } from '../services/payment.service';
import { processOrderOnce } from '../services/order-worker';
import { createSnapTransaction, midtransClientKey } from '../providers/midtrans.provider';
import { config } from '../config';

const router = Router();

const createSchema = z.object({
  productId: z.string().min(1),
  kind: z.enum(['TOPUP', 'SMM']),
  quantity: z.number().int().min(1).max(1000000).default(1),
  accountInput: z.string().min(1).max(500),
  accountInput2: z.string().max(100).optional(),
  contactEmail: z.string().email().optional(),
  couponCode: z.string().max(40).optional(),
  idempotencyKey: z.string().min(16).max(80).optional(),
  payWithWallet: z.boolean().optional().default(false),
});

router.post('/', optionalAuth, validate(createSchema), async (req, res, next) => {
  try {
    // Guest checkout diizinkan untuk TOPUP tanpa wallet; wallet hanya untuk user login.
    if (!req.user && req.body.payWithWallet) throw new AppError(401, 'UNAUTHORIZED', 'Login diperlukan untuk membayar dengan saldo.');
    const order = await createOrder({ ...req.body, userId: req.user?.id });
    res.status(201).json({ order });
  } catch (e) { next(e); }
});

/** Bayar order dengan saldo wallet (login required, idempotent via row lock). */
router.post('/:id/pay-wallet', requireAuth, async (req, res, next) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string; userId: string | null; status: string; priceTotal: number; orderNo: string }[]>`
        SELECT id, userId, status, priceTotal, orderNo FROM \`Order\` WHERE id = ${req.params.id} FOR UPDATE`;
      const order = locked[0];
      if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order tidak ditemukan.');
      if (order.userId !== req.user!.id) throw new AppError(403, 'FORBIDDEN', 'Bukan order Anda.');
      if (order.status !== 'PENDING') throw new AppError(409, 'ORDER_NOT_PENDING', 'Order tidak dapat dibayar.');
      await applyWalletChange({
        userId: req.user!.id, type: 'ORDER_PAYMENT', amount: order.priceTotal,
        referenceType: 'ORDER', referenceId: order.id, note: `Pembayaran order ${order.orderNo}`, tx,
      });
      await tx.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
      await tx.payment.create({
        data: { orderId: order.id, userId: req.user!.id, provider: 'WALLET', amount: order.priceTotal, status: 'PAID', paidAt: new Date() },
      });
      await tx.orderHistory.create({
        data: { orderId: order.id, field: 'status', fromValue: 'PENDING', toValue: 'PAID', note: 'Dibayar dengan saldo wallet' },
      });
      return { ok: true };
    }, { timeout: 15000 });
    res.json(result);
  } catch (e) { next(e); }
});

/** Detail order untuk halaman checkout/detail — guest wajib bawa guestToken. */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: String(req.params.id) },
      include: { product: { select: { name: true, type: true } } },
    });
    if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order tidak ditemukan.');
    if (order.userId) {
      if (req.user?.id !== order.userId && req.user?.role !== 'ADMIN') {
        throw new AppError(403, 'FORBIDDEN', 'Bukan order Anda.');
      }
    } else {
      const token = String(req.query.token ?? req.headers['x-guest-token'] ?? localStorageHack(req));
      if (!order.guestToken || token !== order.guestToken) {
        throw new AppError(403, 'FORBIDDEN', 'Verifikasi gagal untuk guest checkout.');
      }
    }
    const { userId, guestToken, guestEmail, ...safe } = order;
    void userId; void guestToken; void guestEmail;
    res.json({ order: safe });
  } catch (e) { next(e); }
});

// helper kecil: izinkan token guest dikirim via header
function localStorageHack(req: import('express').Request): string {
  return String(req.headers['x-guest-token'] ?? '');
}

router.post('/:id/pay', optionalAuth, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: String(req.params.id) }, include: { user: true } });
    if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order tidak ditemukan.');
    if (order.status !== 'PENDING') throw new AppError(409, 'ORDER_NOT_PENDING', 'Order tidak dapat dibayar (status bukan PENDING).');
    if (order.userId && req.user?.id !== order.userId) throw new AppError(403, 'FORBIDDEN', 'Bukan order Anda.');

    const externalId = `${order.orderNo}-${Date.now().toString(36)}`;
    // Payment methods dari request (QRIS/VA/E-wallet), divalidasi whitelist — tidak pernah dipercaya mentah
    const methodSchema = z.object({
      paymentMethod: z.enum(['', 'qris', 'bca_va', 'bni_va', 'permata_va', 'gopay', 'shopeepay']).optional(),
    });
    const pm = methodSchema.safeParse(req.body ?? {});
    const enabledPayments = pm.success && pm.data.paymentMethod ? [pm.data.paymentMethod] : undefined;
    const snap = await createSnapTransaction({
      externalId,
      amount: order.priceTotal,
      customerEmail: order.contactEmail || order.user?.email,
      customerName: order.user?.name || 'Customer',
      description: `NEXORA order ${order.orderNo}`,
      enabledPayments,
    });
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        provider: 'MIDTRANS',
        externalId,
        snapToken: snap.token,
        redirectUrl: snap.redirectUrl,
        amount: order.priceTotal,
      },
    });
    res.json({ payment: { id: payment.id, snapToken: payment.snapToken, redirectUrl: payment.redirectUrl, clientKey: midtransClientKey(), isProduction: config.midtrans.isProduction } });
  } catch (e) { next(e); }
});

/**
 * Verifikasi status: SELALU melalui langkah yang sama dengan webhook (markOrderPaid
 * hanya dipanggil dengan data terverifikasi). Untuk simpel dan aman, endpoint ini
 * hanya melaporkan status tersimpan; update status terjadi via webhook/API Midtrans.
 */
router.get('/:id/status', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: String(req.params.id) },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 }, history: { orderBy: { createdAt: 'asc' } } },
    });
    if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order tidak ditemukan.');
    // Guest: wajib membawa guestToken
    if (!order.userId) {
      const token = String(req.query.token ?? '');
      if (!order.guestToken || token !== order.guestToken) throw new AppError(403, 'FORBIDDEN', 'Verifikasi gagal. Gunakan link/Token yang diberikan saat checkout.');
    }
    res.json({
      order: {
        orderNo: order.orderNo, status: order.status, fulfillment: order.fulfillment,
        priceTotal: order.priceTotal, createdAt: order.createdAt, failReason: order.failReason,
        history: order.history,
        payment: order.payments[0] ? { status: order.payments[0].status, provider: order.payments[0].provider } : null,
      },
    });
  } catch (e) { next(e); }
});

/** Pencarian order untuk halaman Cek Pesanan (guest + login). */
router.post('/track', async (req, res, next) => {
  try {
    const schema = z.object({ orderNo: z.string().min(4), verification: z.string().optional() });
    const { orderNo, verification } = schema.parse(req.body);
    const order = await prisma.order.findFirst({
      where: { orderNo },
      include: { product: { select: { name: true } }, history: { orderBy: { createdAt: 'asc' } } },
    });
    if (!order) throw new AppError(404, 'NOT_FOUND', 'Order tidak ditemukan.');
    // Anti-bocor: guest wajib menyertakan token/email verifikasi.
    if (!order.userId) {
      const token = (verification ?? '').trim();
      const ok = (order.guestToken && token === order.guestToken) ||
        (order.guestEmail && token.toLowerCase() === order.guestEmail.toLowerCase());
      if (!ok) throw new AppError(403, 'VERIFICATION_REQUIRED', 'Masukkan email/token verifikasi untuk melihat detail order ini.');
    }
    res.json({
      order: {
        orderNo: order.orderNo, product: order.product.name, status: order.status,
        fulfillment: order.fulfillment, priceTotal: order.priceTotal, createdAt: order.createdAt,
        failReason: order.failReason, history: order.history.map((h) => ({ field: h.field, to: h.toValue, note: h.note, at: h.createdAt })),
      },
    });
  } catch (e) { next(e); }
});

/** Development/dev-only helper: memproses order PAID langsung (tanpa provider asli). */
if (config.nodeEnv !== 'production') {
  router.post('/:id/process-dev', requireAuth, async (req, res, next) => {
    try {
      if (req.user?.role !== 'ADMIN') throw new AppError(403, 'FORBIDDEN', 'Khusus admin.');
      const result = await processOrderOnce(String(req.params.id));
      res.json(result);
    } catch (e) { next(e); }
  });
}

export default router;
