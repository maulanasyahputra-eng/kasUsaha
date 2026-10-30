import 'dotenv/config';
import pino from 'pino';

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  jwtSecret: process.env.JWT_SECRET || '',
  sessionSecret: process.env.SESSION_SECRET || '',

  midtrans: {
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  },

  sosmedmedia: {
    apiKey: process.env.SOSMEDMEDIA_API_KEY || '',
    baseUrl: process.env.SOSMEDMEDIA_API_BASE_URL || '',
  },

  digiflazz: {
    username: process.env.DIGIFLAZZ_USERNAME || '',
    apiKey: process.env.DIGIFLAZZ_API_KEY || '',
    baseUrl: process.env.DIGIFLAZZ_BASE_URL || '',
  },

  redisUrl: process.env.REDIS_URL || '',

  // Kunci enkripsi credential provider (hex 64 char = 32 byte)
  encryptionKey: process.env.ENCRYPTION_KEY || '',
};

export function assertEncryptionKey() {
  if (!config.encryptionKey || config.encryptionKey.length < 64) {
    throw new Error('ENCRYPTION_KEY wajib: hex string 64 karakter (32 byte). Generate: openssl rand -hex 32');
  }
}

// Redis queue: opsional. Jika tidak tersedia, order diproses inline
// oleh worker "in-process" (fallback) — tetap idempotent.
export const queueEnabled = Boolean(config.redisUrl) && config.redisUrl.startsWith('redis');

export function assertRequiredSecrets() {
  if (config.nodeEnv === 'test') return;
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET wajib diisi di .env');
  }
}

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      '*.password', '*.passwordHash',
      'config.midtrans.serverKey', 'config.digiflazz.apiKey', 'config.sosmedmedia.apiKey',
    ],
    censor: '[REDACTED]',
  },
});
