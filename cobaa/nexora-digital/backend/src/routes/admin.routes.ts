import { Router } from 'express';
import { prisma } from '../db';
import { AppError, validate } from '../middleware/error';
import { requireAdmin } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
router.use(requireAdmin);

// ==================== DASHBOARD / OVERVIEW ====================

router.get('/dashboard', async (_req, res, next) => {
  try {
    const [paidOrders, totalSales, pending, successCount, failedCount, refunds, providerCost, customers, depositsAgg] = await Promise.all([
      prisma.order.aggregate({ where: { status: 'PAID' }, _count: true, _sum: { priceTotal: true } }),
      prisma.order.aggregate({ where: { status: 'PAID', fulfillment: 'SUCCESS' }, _count: true, _sum: { priceTotal: true } }),
      prisma.order.count({ where: { OR: [{ status: 'PENDING' }, { fulfillment: { in: ['QUEUED', 'PROCESSING', 'UNKNOWN'] } }] } }),
      prisma.order.count({ where: { fulfillment: 'SUCCESS' } }),
      prisma.order.count({ where: { fulfillment: 'FAILED' } }),
      prisma.refund.aggregate({ _count: true, _sum: { amount: true } }),
      prisma.providerTransaction.aggregate({ where: { status: 'SUCCESS' }, _count: true, _sum: { priceCost: true } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.deposit.aggregate({ where: { status: 'PAID' }, _count: true, _sum: { amount: true } }),
    ]);
    const since = new Date(Date.now() - 14 * 24 * 3600 * 1000);
    const daily = await prisma.$queryRaw<{ d: Date; total: bigint; cnt: bigint }[]>`
      SELECT DATE(createdAt) as d, SUM(priceTotal) as total, COUNT(*) as cnt
      FROM \`Order\` WHERE status = 'PAID' AND createdAt >= ${since}
      GROUP BY DATE(createdAt) ORDER BY d`;
    const topProducts = await prisma.$queryRaw<{ name: string; cnt: bigint; total: bigint }[]>`
      SELECT p.name as name, COUNT(*) as cnt, SUM(o.priceTotal) as total
      FROM \`Order\` o JOIN Product p ON p.id = o.productId
      WHERE o.status = 'PAID'
      GROUP BY p.name ORDER BY cnt DESC LIMIT 5`;
    // Top customer by spend (PAID orders)
    const topCustomers = await prisma.$queryRaw<{ name: string; email: string; cnt: bigint; total: bigint }[]>`
      SELECT u.name as name, u.email as email, COUNT(*) as cnt, SUM(o.priceTotal) as total
      FROM \`Order\` o JOIN User u ON u.id = o.userId
      WHERE o.status = 'PAID'
      GROUP BY u.name, u.email ORDER BY total DESC LIMIT 5`;
    const byCategory = await prisma.$queryRaw<{ name: string; cnt: bigint; total: bigint }[]>`
      SELECT c.name as name, COUNT(*) as cnt, SUM(o.priceTotal) as total
      FROM \`Order\` o JOIN Product p ON p.id = o.productId JOIN Category c ON c.id = p.categoryId
      WHERE o.status = 'PAID'
      GROUP BY c.name ORDER BY total DESC`;
    res.json({
      totalTransactions: paidOrders._count,
      grossRevenue: paidOrders._sum.priceTotal ?? 0,
      fulfilledSales: totalSales._sum.priceTotal ?? 0,
      providerCost: providerCost._sum.priceCost ?? 0,
      estimatedMargin: (paidOrders._sum.priceTotal ?? 0) - (providerCost._sum.priceCost ?? 0),
      pending, successCount, failedCount,
      totalRefund: refunds._sum.amount ?? 0,
      refundCount: refunds._count,
      customers,
      depositTotal: depositsAgg._sum.amount ?? 0,
      depositCount: depositsAgg._count,
      chart: daily.map((r) => ({ date: r.d, total: Number(r.total), count: Number(r.cnt) })),
      topProducts: topProducts.map((r) => ({ name: r.name, count: Number(r.cnt), total: Number(r.total) })),
      topCustomers: topCustomers.map((r) => ({ name: r.name, email: r.email, count: Number(r.cnt), total: Number(r.total) })),
      byCategory: byCategory.map((r) => ({ name: r.name, count: Number(r.cnt), total: Number(r.total) })),
      recentOrders: await prisma.order.findMany({
        orderBy: { createdAt: 'desc' }, take: 8,
        select: { id: true, orderNo: true, status: true, fulfillment: true, priceTotal: true, createdAt: true, product: { select: { name: true } } },
      }),
      providerHealth: (await prisma.provider.findMany({ include: { credential: { select: { connStatus: true, lastConnectedAt: true } } } }))
        .map((p) => ({ code: p.code, name: p.name, isActive: p.isActive, connStatus: p.credential?.connStatus ?? 'NOT_CONFIGURED', lastConnectedAt: p.credential?.lastConnectedAt ?? null })),
      activeProducts: await prisma.product.count({ where: { isActive: true } }),
    });
  } catch (e) { next(e); }
});

// ==================== ORDERS ====================

router.get('/orders', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const status = String(req.query.status ?? '');
    const fulfillment = String(req.query.fulfillment ?? '');
    const search = String(req.query.search ?? '').trim();
    const dateFrom = String(req.query.dateFrom ?? '');
    const dateTo = String(req.query.dateTo ?? '');
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (fulfillment) where.fulfillment = fulfillment;
    if (search) where.orderNo = { contains: search };
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59`) } : {}),
      };
    }
    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * 25, take: 25,
        include: {
          product: { select: { name: true } },
          user: { select: { email: true, name: true } },
          transactions: { orderBy: { createdAt: 'desc' }, take: 1 },
          payments: { orderBy: { createdAt: 'desc' }, take: 1, select: { provider: true, status: true } },
          history: { orderBy: { createdAt: 'asc' } },
        },
      }),
    ]);
    res.json({ orders, pagination: { page, perPage: 25, total, totalPages: Math.ceil(total / 25) } });
  } catch (e) { next(e); }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        product: { select: { name: true, providerSku: true } },
        user: { select: { email: true, name: true } },
        transactions: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        history: { orderBy: { createdAt: 'asc' } },
        refunds: true,
      },
    });
    if (!order) throw new AppError(404, 'NOT_FOUND', 'Order tidak ditemukan.');
    res.json({ order });
  } catch (e) { next(e); }
});

// Retry pesanan gagal — HANYA fulfillment FAILED/UNKNOWN & PAID, dengan idempotency via sentToProviderAt reset
router.post('/orders/:id/retry', async (req, res, next) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string; status: string; fulfillment: string; sentToProviderAt: Date | null }[]>`
        SELECT id, status, fulfillment, sentToProviderAt FROM \`Order\` WHERE id = ${req.params.id} FOR UPDATE`;
      const o = locked[0];
      if (!o) throw new AppError(404, 'NOT_FOUND', 'Order tidak ditemukan.');
      if (o.status !== 'PAID') throw new AppError(409, 'NOT_PAID', 'Retry hanya untuk order yang sudah dibayar.');
      if (!['FAILED', 'UNKNOWN'].includes(o.fulfillment)) throw new AppError(409, 'NOT_RETRYABLE', 'Hanya order FAILED/UNKNOWN yang dapat di-retry.');
      await tx.order.update({ where: { id: o.id }, data: { fulfillment: 'QUEUED', sentToProviderAt: null, failReason: null } });
      await tx.orderHistory.create({ data: { orderId: o.id, field: 'retry', note: `Admin me-retry pengiriman ke provider (sebelumnya: ${o.fulfillment}).` } });
      return { ok: true };
    }, { timeout: 15000 });
    await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'ORDER_RETRY', entity: 'Order', entityId: req.params.id } });
    res.json(result);
  } catch (e) { next(e); }
});

router.post('/orders/:id/recheck', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { transactions: { orderBy: { createdAt: 'desc' } } } });
    if (!order) throw new AppError(404, 'NOT_FOUND', 'Order tidak ditemukan.');
    const last = order.transactions[0];
    if (!last?.providerRef) throw new AppError(400, 'NO_PROVIDER_REF', 'Order belum memiliki referensi provider; tidak dapat direkonsiliasi.');
    await prisma.orderHistory.create({
      data: { orderId: order.id, field: 'recheck', note: `Admin meminta rekonsiliasi. ProviderRef=${last.providerRef}.` },
    });
    res.json({ ok: true, note: 'Catatan rekonsiliasi dibuat. Verifikasi manual di dashboard provider diperlukan; sistem tidak memaksa status SUCCESS tanpa bukti.' });
  } catch (e) { next(e); }
});

// ==================== PRODUCTS & CATEGORIES ====================

router.get('/products', async (req, res, next) => {
  try {
    const search = String(req.query.search ?? '').trim();
    const products = await prisma.product.findMany({
      where: search ? { OR: [{ name: { contains: search } }, { slug: { contains: search } }] } : undefined,
      include: { category: true, provider: true },
      orderBy: { updatedAt: 'desc' },
      take: 300,
    });
    res.json({ products });
  } catch (e) { next(e); }
});

router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { sortOrder: 'asc' } });
    res.json({ categories });
  } catch (e) { next(e); }
});

const categorySchema = z.object({
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(60),
  type: z.enum(['TOPUP', 'SMM']),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

router.post('/categories', validate(categorySchema), async (req, res, next) => {
  try {
    const exists = await prisma.category.findUnique({ where: { slug: req.body.slug } });
    if (exists) throw new AppError(409, 'SLUG_TAKEN', 'Slug kategori sudah dipakai.');
    const category = await prisma.category.create({ data: req.body });
    await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'CATEGORY_CREATE', entity: 'Category', entityId: category.id, detail: req.body } });
    res.status(201).json({ category });
  } catch (e) { next(e); }
});

router.patch('/categories/:id', validate(categorySchema.partial()), async (req, res, next) => {
  try {
    const category = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
    await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'CATEGORY_UPDATE', entity: 'Category', entityId: category.id, detail: req.body } });
    res.json({ category });
  } catch (e) { next(e); }
});

const productSchema = z.object({
  slug: z.string().min(2).optional(),
  name: z.string().min(2).optional(),
  description: z.string().max(2000).nullable().optional(),
  sellPrice: z.number().int().min(0).optional(),
  costPrice: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().optional(),
  providerId: z.string().nullable().optional(),
  providerSku: z.string().nullable().optional(),
  minOrder: z.number().int().nullable().optional(),
  maxOrder: z.number().int().nullable().optional(),
  requiresZoneId: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  imageUrl: z.string().url().nullable().optional(),
});

router.post('/products', validate(productSchema.extend({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/), name: z.string().min(2), categoryId: z.string(),
  type: z.enum(['TOPUP', 'SMM']), sellPrice: z.number().int().min(0),
})), async (req, res, next) => {
  try {
    const exists = await prisma.product.findUnique({ where: { slug: req.body.slug } });
    if (exists) throw new AppError(409, 'SLUG_TAKEN', 'Slug produk sudah dipakai.');
    const product = await prisma.product.create({ data: req.body });
    await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'PRODUCT_CREATE', entity: 'Product', entityId: product.id, detail: req.body } });
    res.status(201).json({ product });
  } catch (e) { next(e); }
});

router.patch('/products/:id', validate(productSchema), async (req, res, next) => {
  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
    await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'PRODUCT_UPDATE', entity: 'Product', entityId: product.id, detail: req.body } });
    res.json({ product });
  } catch (e) { next(e); }
});

router.delete('/products/:id', async (req, res, next) => {
  try {
    const used = await prisma.orderItem.count({ where: { productId: req.params.id } });
    if (used > 0) {
      // Soft-disable jika sudah dipakai transaksi (jaga integritas riwayat)
      await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
      await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'PRODUCT_DISABLE_INSTEAD_OF_DELETE', entity: 'Product', entityId: req.params.id } });
      res.json({ ok: true, note: 'Produk memiliki riwayat transaksi sehingga dinonaktifkan, bukan dihapus.' });
      return;
    }
    await prisma.product.delete({ where: { id: req.params.id } });
    await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'PRODUCT_DELETE', entity: 'Product', entityId: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ==================== PROVIDERS ====================

router.get('/providers', async (_req, res, next) => {
  try {
    const providers = await prisma.provider.findMany({ include: { _count: { select: { products: true, transactions: true } } } });
    // Status konfigurasi dari env (tanpa membocorkan kredensial)
    const { providerIsConfigured } = await import('../providers/provider-registry');
    res.json({ providers: providers.map((p) => ({ ...p, configured: providerIsConfigured(p.code) })) });
  } catch (e) { next(e); }
});

// ==================== PROVIDER MANAGEMENT (Integrasi Provider) ====================

const credSchema = z.object({
  baseUrl: z.string().url().max(300).optional(),
  username: z.string().max(120).optional(),
  apiKey: z.string().max(300).optional(),
  apiSecret: z.string().max(300).optional(),
  signatureKey: z.string().max(300).optional(),
  environment: z.enum(['sandbox', 'production']).optional(),
});

/** Simpan konfigurasi provider (credential dienkripsi). */
router.post('/providers/:code/credential', validate(credSchema), async (req, res, next) => {
  try {
    const { saveProviderCredential } = await import('../services/provider-management.service');
    const result = await saveProviderCredential(req.params.code, req.body, req.user!.id);
    res.json(result);
  } catch (e) { next(e); }
});

/** Test koneksi sungguhan (bukan transaksi pembelian). */
router.post('/providers/:code/test-connection', async (req, res, next) => {
  try {
    const { testProviderConnection } = await import('../services/provider-management.service');
    const result = await testProviderConnection(req.params.code);
    await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'PROVIDER_TEST_CONNECTION', entity: 'Provider', entityId: req.params.code, detail: { status: result.status } } });
    res.json(result);
  } catch (e) {
    // Provider tidak dikenal / gagal fetch → laporkan sebagai CONNECTION_FAILED
    const message = e instanceof Error ? e.message : 'unknown';
    res.json({ status: 'CONNECTION_FAILED', message: message.slice(0, 200) });
  }
});

/** Simpan & Hubungkan: simpan credential lalu test koneksi sekali jalan. */
router.post('/providers/:code/connect', validate(credSchema), async (req, res, next) => {
  try {
    const svc = await import('../services/provider-management.service');
    const { getProviderAsync } = await import('../providers/provider-registry');
    const saved = await svc.saveProviderCredential(req.params.code, req.body, req.user!.id);
    const cfg = await svc.runtimeConfig(req.params.code);
    const provider = await getProviderAsync(req.params.code);
    (provider as unknown as { cfg: unknown }).cfg = cfg;
    const result = await provider.testConnection();
    res.json({ saved, connection: result });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown';
    res.json({ saved: null, connection: { status: 'CONNECTION_FAILED', message: message.slice(0, 200) } });
  }
});

/** Status semua provider (tanpa credential). */
router.get('/providers/status', async (_req, res, next) => {
  try {
    const { listProviderStatus } = await import('../services/provider-management.service');
    res.json({ providers: await listProviderStatus() });
  } catch (e) { next(e); }
});

/** Riwayat koneksi + sinkronisasi. */
router.get('/providers/:code/logs', async (req, res, next) => {
  try {
    const pid = await prisma.provider.findUnique({ where: { code: req.params.code } });
    if (!pid) throw new AppError(404, 'NOT_FOUND', 'Provider tidak ditemukan.');
    const logs = await prisma.providerLog.findMany({
      where: { providerId: pid.id }, orderBy: { createdAt: 'desc' }, take: 50,
    });
    res.json({ logs });
  } catch (e) { next(e); }
});

router.patch('/providers/:id', validate(z.object({ isActive: z.boolean().optional(), priority: z.number().int().optional() })), async (req, res, next) => {
  try {
    const provider = await prisma.provider.update({ where: { id: req.params.id }, data: req.body });
    await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'PROVIDER_UPDATE', entity: 'Provider', entityId: provider.id, detail: req.body } });
    res.json({ provider });
  } catch (e) { next(e); }
});

router.post('/sync/digiflazz', async (req, res, next) => {
  try {
    const { syncDigiflazzCatalog } = await import('../providers/provider-registry');
    const result = await syncDigiflazzCatalog();
    await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'SYNC_DIGIFLAZZ', entity: 'Catalog', detail: result } });
    res.json(result);
  } catch (e) { next(e); }
});

// ==================== CUSTOMERS ====================

router.get('/customers', async (req, res, next) => {
  try {
    const search = String(req.query.search ?? '').trim();
    const users = await prisma.user.findMany({
      where: search ? { OR: [{ email: { contains: search } }, { name: { contains: search } }] } : undefined,
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, wallet: { select: { balance: true } }, _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' }, take: 200,
    });
    res.json({ users: users.map((u) => ({ ...u, wallet: u.wallet ? { balance: u.wallet.balance.toString() } : null })) });
  } catch (e) { next(e); }
});

router.patch('/customers/:id', validate(z.object({ isActive: z.boolean() })), async (req, res, next) => {
  try {
    if (req.params.id === req.user!.id) throw new AppError(400, 'CANNOT_SELF_DISABLE', 'Tidak dapat menonaktifkan akun sendiri.');
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { isActive: req.body.isActive } });
    await prisma.auditLog.create({ data: { userId: req.user!.id, action: req.body.isActive ? 'CUSTOMER_ACTIVATE' : 'CUSTOMER_DEACTIVATE', entity: 'User', entityId: user.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/customers/:id/orders', async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.params.id },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }, take: 50,
    });
    res.json({ orders });
  } catch (e) { next(e); }
});

// ==================== PAYMENTS & DEPOSITS ====================

router.get('/payments', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const [total, payments] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' }, skip: (page - 1) * 25, take: 25,
        include: { order: { select: { orderNo: true } } },
      }),
    ]);
    res.json({ payments, pagination: { page, perPage: 25, total, totalPages: Math.ceil(total / 25) } });
  } catch (e) { next(e); }
});

router.get('/deposits', async (_req, res, next) => {
  try {
    const deposits = await prisma.deposit.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { user: { select: { email: true, name: true } } } });
    res.json({ deposits });
  } catch (e) { next(e); }
});

// ==================== REFUNDS ====================

router.get('/refunds', async (_req, res, next) => {
  try {
    const refunds = await prisma.refund.findMany({ include: { order: { select: { orderNo: true, priceTotal: true } } }, orderBy: { createdAt: 'desc' }, take: 100 });
    res.json({ refunds });
  } catch (e) { next(e); }
});

/**
 * Refund manual oleh admin. Hanya order PAID + fulfillment FAILED dengan user
 * terdaftar. TIDAK otomatis; selalu mencatat audit log.
 */
router.post('/refunds', validate(z.object({ orderId: z.string(), reason: z.string().min(3).max(500) })), async (req, res, next) => {
  try {
    const { orderId, reason } = req.body;
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.$queryRaw<{ id: string; status: string; fulfillment: string; userId: string | null; priceTotal: number }[]>`
        SELECT id, status, fulfillment, userId, priceTotal FROM \`Order\` WHERE id = ${orderId} FOR UPDATE`;
      const o = order[0];
      if (!o) throw new AppError(404, 'NOT_FOUND', 'Order tidak ditemukan.');
      if (o.status !== 'PAID' || o.fulfillment !== 'FAILED' || !o.userId) {
        throw new AppError(409, 'REFUND_NOT_ALLOWED', 'Refund hanya untuk order PAID + fulfillment FAILED dengan user terdaftar.');
      }
      const refunded = await tx.refund.findFirst({ where: { orderId, status: 'PAID' } });
      if (refunded) throw new AppError(409, 'ALREADY_REFUNDED', 'Order sudah pernah direfund.');
      const { applyWalletChange } = await import('../services/wallet.service');
      await applyWalletChange({ userId: o.userId, type: 'REFUND', amount: o.priceTotal, referenceType: 'REFUND', referenceId: orderId, note: reason, tx });
      await tx.refund.create({ data: { orderId, amount: o.priceTotal, reason, status: 'PAID', processedBy: req.user!.id } });
      await tx.order.update({ where: { id: orderId }, data: { status: 'REFUNDED' } });
      await tx.orderHistory.create({ data: { orderId, field: 'status', toValue: 'REFUNDED', note: reason } });
      return { ok: true };
    });
    await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'REFUND', entity: 'Order', entityId: orderId, detail: { reason } } });
    res.json(result);
  } catch (e) { next(e); }
});

// ==================== COUPONS ====================

router.get('/coupons', async (_req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    res.json({ coupons });
  } catch (e) { next(e); }
});

const couponSchema = z.object({
  code: z.string().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/),
  type: z.enum(['PERCENT', 'FIXED']),
  value: z.number().int().min(1),
  minSpend: z.number().int().min(0).optional(),
  maxDiscount: z.number().int().min(0).nullable().optional(),
  quota: z.number().int().min(1),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

router.post('/coupons', validate(couponSchema), async (req, res, next) => {
  try {
    const exists = await prisma.coupon.findUnique({ where: { code: req.body.code } });
    if (exists) throw new AppError(409, 'CODE_TAKEN', 'Kode promo sudah ada.');
    if (req.body.type === 'PERCENT' && req.body.value > 100) throw new AppError(400, 'INVALID_VALUE', 'Persen tidak boleh > 100.');
    const coupon = await prisma.coupon.create({ data: { ...req.body, expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null } });
    await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'COUPON_CREATE', entity: 'Coupon', entityId: coupon.id, detail: req.body } });
    res.status(201).json({ coupon });
  } catch (e) { next(e); }
});

router.patch('/coupons/:id', validate(couponSchema.partial()), async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);
    const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data });
    await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'COUPON_UPDATE', entity: 'Coupon', entityId: coupon.id, detail: req.body } });
    res.json({ coupon });
  } catch (e) { next(e); }
});

// ==================== AUDIT LOGS & SETTINGS ====================

router.get('/audit-logs', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * 50, take: 50, include: { user: { select: { email: true } } } }),
    ]);
    res.json({ logs, pagination: { page, perPage: 50, total, totalPages: Math.ceil(total / 50) } });
  } catch (e) { next(e); }
});

router.get('/settings', async (_req, res, next) => {
  try {
    const settings = await prisma.setting.findMany();
    res.json({ settings });
  } catch (e) { next(e); }
});

router.put('/settings/:key', validate(z.object({ value: z.string().max(500) })), async (req, res, next) => {
  try {
    const setting = await prisma.setting.upsert({
      where: { key: req.params.key },
      update: { value: req.body.value },
      create: { key: req.params.key, value: req.body.value },
    });
    await prisma.auditLog.create({ data: { userId: req.user!.id, action: 'SETTING_UPDATE', entity: 'Setting', entityId: setting.key, detail: { value: req.body.value } } });
    res.json({ setting });
  } catch (e) { next(e); }
});

export default router;
