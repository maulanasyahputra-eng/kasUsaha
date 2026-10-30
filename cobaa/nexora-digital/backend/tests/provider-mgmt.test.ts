import request from 'supertest';
import { prisma } from '../src/db';

/**
 * UJI FITUR MANAJEMEN PROVIDER — credential encryption, status koneksi, SSRF guard.
 * Database TEST lokal (nexora_test) — tanpa jaringan provider nyata.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'probe-jwt';
process.env.DATABASE_URL = 'mysql://root@localhost:3306/nexora_test';
process.env.PORT = '5978';
process.env.ENCRYPTION_KEY = 'a'.repeat(64);

import app from '../src/index';

let adminToken = '';

beforeAll(async () => {
  await new Promise((r) => setTimeout(r, 1800));
  // Buat admin langsung via DB (idempotent) — password Argon2
  const argon2 = require('argon2');
  const adminEmail = 'pm-admin@nexora.test';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail, name: 'PM Admin', role: 'ADMIN',
      passwordHash: await argon2.hash('PmAdmin123!', { type: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 }),
      wallet: { create: {} },
    },
  });
  void admin;
  const res = await request(app).post('/api/auth/login').send({
    email: adminEmail, password: 'PmAdmin123!',
  });
  adminToken = res.body.token;
  // Seed 3 provider (idempotent)
  for (const [code, name] of [['DIGIFLAZZ', 'Digiflazz'], ['SOSMEDMEDIA', 'Sosmedmedia'], ['SIMULATION', 'Sim']] as const) {
    await prisma.provider.upsert({ where: { code }, update: {}, create: { code, name, isActive: true } });
  }
}, 30000);

describe('Provider credential security', () => {
  it('menyimpan credential TANPA mengembalikannya ke frontend', async () => {
    const res = await request(app)
      .post('/api/admin/providers/DIGIFLAZZ/credential')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ baseUrl: 'https://api.digiflazz.com', username: 'tester', apiKey: 'SECRET-KEY-ABC', environment: 'sandbox' });
    expect(res.status).toBe(200);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('SECRET-KEY-ABC'); // ← kunci: plaintext key tidak boleh muncul
    expect(res.body.hasApiKey).toBe(true);
  });

  it('credential tersimpan TERENKRIPSI di database (bukan plaintext)', async () => {
    const cred = await prisma.providerCredential.findFirst({ where: { provider: { code: 'DIGIFLAZZ' } } });
    expect(cred?.apiKeyEnc).toBeTruthy();
    expect(cred!.apiKeyEnc).not.toContain('SECRET-KEY-ABC');
    // base64 AES-GCM memiliki IV+tag, bukan plaintext
    expect(cred!.apiKeyEnc!.length).toBeGreaterThan(20);
  });

  it('SSRF guard menolak base URL internal/metadata', async () => {
    const res = await request(app)
      .post('/api/admin/providers/DIGIFLAZZ/credential')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ baseUrl: 'http://169.254.169.254/latest/meta-data', apiKey: 'x'.repeat(5) });
    expect(res.status).toBe(400);
  });

  it('customer TIDAK bisa akses endpoint provider management', async () => {
    // buat customer
    const email = `pv${Date.now()}@nexora.test`;
    const reg = await request(app).post('/api/auth/register')
      .send({ email, password: 'ProvTest123!', name: 'Prov Test' });
    const res = await request(app)
      .post('/api/admin/providers/DIGIFLAZZ/test-connection')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(403);
  });

  it('NOT_CONFIGURED saat credential belum lengkap — tidak pernah pura-pura CONNECTED', async () => {
    await prisma.providerCredential.deleteMany({ where: { provider: { code: 'SOSMEDMEDIA' } } });
    const res = await request(app)
      .post('/api/admin/providers/SOSMEDMEDIA/test-connection')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.status).toBe('NOT_CONFIGURED');
  });

  it('audit log tercatat saat simpan credential', async () => {
    const logs = await prisma.auditLog.findMany({ where: { action: 'PROVIDER_CREDENTIAL_SAVE' } });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    // detail tidak mengandung plaintext key
    expect(JSON.stringify(logs)).not.toContain('SECRET-KEY-ABC');
  });
});
