import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, assertRequiredSecrets, logger } from './config';
import { errorHandler } from './middleware/error';
import authRoutes from './routes/auth.routes';
import catalogRoutes from './routes/catalog.routes';
import orderRoutes from './routes/orders.routes';
import paymentRoutes from './routes/payment.routes';
import accountRoutes from './routes/account.routes';
import adminRoutes from './routes/admin.routes';
import reviewRoutes from './routes/review.routes';
import bannerRoutes from './routes/banner.routes';

assertRequiredSecrets();

const isProd = config.nodeEnv === 'production';
const app = express();
app.set('trust proxy', 1); // diperlukan agar req.ip akurat di belakang proxy & rate limit tidak bisa di-bypass

// ============ SECURITY HEADERS ============
app.use(helmet({
  contentSecurityPolicy: isProd ? {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://app.midtrans.com', 'https://app.sandbox.midtrans.com'],
      connectSrc: ["'self'", 'https://api.midtrans.com', 'https://api.sandbox.midtrans.com'],
      frameSrc: ["'self'", 'https://app.sandbox.midtrans.com', 'https://app.midtrans.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      styleSrc: ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  } : false, // dev: Vite HMR butuh inline scripts
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
}));

// ============ CORS — whitelist ketat ============
const allowedOrigins = config.frontendUrl.split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-origin / curl / webhook server-to-server
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS_REJECTED'));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  credentials: false, // auth via Bearer header, bukan cookie → CSRF bukan vektor utama
  maxAge: 600,
}));

// ============ Webhook: raw body PERSIS sebagaimana diterima (verifikasi signature) ============
app.use('/api/webhooks', express.raw({ type: '*/*', limit: '256kb' }), (req, _res, next) => {
  if (Buffer.isBuffer(req.body)) {
    try { req.body = JSON.parse(req.body.toString('utf8')); } catch { /* invalid payload ditolak di route */ }
  }
  next();
});

app.use(express.json({ limit: '64kb' })); // body kecil cukup; kurangi permukaan DoS

// Rate limit global
app.use(rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'nexora-backend', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', paymentRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/banners', bannerRoutes);

// Static uploads (gambar banner) — read-only
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), { maxAge: '7d' }));

app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint tidak ditemukan.' } }));
app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(`NEXORA backend berjalan di port ${config.port} (${config.nodeEnv})`);
});

export default app;
