import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/wallet', async (req, res, next) => {
  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
    res.json({ wallet: wallet ? { balance: wallet.balance.toString() } : { balance: '0' } });
  } catch (e) { next(e); }
});

router.get('/wallet/ledger', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet) return res.json({ ledger: [], pagination: { page, perPage: 20, total: 0, totalPages: 0 } });
    const [total, ledger] = await Promise.all([
      prisma.walletLedger.count({ where: { walletId: wallet.id } }),
      prisma.walletLedger.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * 20, take: 20,
      }),
    ]);
    res.json({
      ledger: ledger.map((l) => ({ ...l, amount: l.amount.toString(), balanceBefore: l.balanceBefore.toString(), balanceAfter: l.balanceAfter.toString() })),
      pagination: { page, perPage: 20, total, totalPages: Math.ceil(total / 20) },
    });
  } catch (e) { next(e); }
});

router.get('/orders', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const [total, orders] = await Promise.all([
      prisma.order.count({ where: { userId: req.user!.id } }),
      prisma.order.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * 20, take: 20,
        include: { product: { select: { name: true, type: true, id: true } }, payments: { select: { status: true, provider: true } } },
      }),
    ]);
    res.json({ orders, pagination: { page, perPage: 20, total, totalPages: Math.ceil(total / 20) } });
  } catch (e) { next(e); }
});

router.get('/notifications', async (req, res, next) => {
  try {
    const notifs = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }, take: 30,
    });
    res.json({ notifications: notifs });
  } catch (e) { next(e); }
});

router.post('/notifications/read', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!.id, isRead: false }, data: { isRead: true } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
