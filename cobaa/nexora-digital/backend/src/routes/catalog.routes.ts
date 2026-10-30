import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    res.json({ categories });
  } catch (e) { next(e); }
});

router.get('/products', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const perPage = Math.min(50, Math.max(1, Number(req.query.perPage ?? 20)));
    const search = String(req.query.search ?? '').trim();
    const category = String(req.query.category ?? '');
    const type = String(req.query.type ?? '');
    const sort = String(req.query.sort ?? '');

    const where: Record<string, unknown> = { isActive: true };
    if (search) where.name = { contains: search };
    if (category) where.category = { slug: category };
    if (type === 'TOPUP' || type === 'SMM') where.type = type;
    // Filter harga (backend-computed, tidak pernah dari client-side math)
    const minPrice = Number(req.query.minPrice ?? 0);
    const maxPrice = Number(req.query.maxPrice ?? 0);
    if (minPrice > 0 || maxPrice > 0) {
      where.sellPrice = {
        ...(minPrice > 0 ? { gte: minPrice } : {}),
        ...(maxPrice > 0 ? { lte: maxPrice } : {}),
      };
    }

    const orderBy =
      sort === 'price_asc' ? { sellPrice: 'asc' as const } :
        sort === 'price_desc' ? { sellPrice: 'desc' as const } :
          { sortOrder: 'asc' as const };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where, orderBy, skip: (page - 1) * perPage, take: perPage,
        include: { category: { select: { slug: true, name: true } } },
      }),
    ]);
    res.json({ products, pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) } });
  } catch (e) { next(e); }
});

router.get('/products/:slug', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: String(req.params.slug) },
      include: { category: true },
    });
    if (!product || !product.isActive) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Produk tidak ditemukan.' } });
    // Jangan bocorkan costPrice ke publik
    const { costPrice, providerSku, ...pub } = product;
    res.json({ product: pub });
  } catch (e) { next(e); }
});

router.get('/status', async (_req, res, next) => {
  try {
    const providers = await prisma.provider.findMany({ where: { isActive: true } });
    res.json({
      providers: providers.map((p) => ({ code: p.code, name: p.name })),
      mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    });
  } catch (e) { next(e); }
});

router.get('/settings', async (req, res, next) => {
  try {
    const keys = String(req.query.keys ?? 'site_name,site_tagline,support_email,support_whatsapp,site_announcement').split(',').map((s) => s.trim());
    const settings = await prisma.setting.findMany({ where: { key: { in: keys } } });
    const out: Record<string, string> = {};
    for (const s of settings) out[s.key] = s.value;
    res.json({ settings: out });
  } catch (e) { next(e); }
});

export default router;
