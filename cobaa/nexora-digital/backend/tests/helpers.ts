process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-for-jest-only';

import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import crypto from 'crypto';

export const prisma = new PrismaClient();

export async function seedTestFixtures() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin-test@nexora.test' },
    update: {},
    create: {
      email: 'admin-test@nexora.test', name: 'Admin Test', role: 'ADMIN',
      passwordHash: await argon2.hash('AdminTest123!', { type: 2 as const, memoryCost: 19456, timeCost: 2, parallelism: 1 }), wallet: { create: {} },
    },
  });
  const customer = await prisma.user.upsert({
    where: { email: 'cust-test@nexora.test' },
    update: {},
    create: {
      email: 'cust-test@nexora.test', name: 'Cust Test', role: 'CUSTOMER',
      passwordHash: await argon2.hash('CustTest123!', { type: 2 as const, memoryCost: 19456, timeCost: 2, parallelism: 1 }), wallet: { create: {} },
    },
  });
  const provider = await prisma.provider.upsert({
    where: { code: 'SIMULATION' },
    update: {},
    create: { code: 'SIMULATION', name: 'Simulation', isActive: true },
  });
  const cat = await prisma.category.upsert({
    where: { slug: 'test-game' },
    update: {},
    create: { slug: 'test-game', name: 'Test Game', type: 'TOPUP' },
  });
  const product = await prisma.product.upsert({
    where: { slug: 'test-diamond' },
    update: { sellPrice: 10000, isActive: true },
    create: {
      slug: 'test-diamond', name: 'Test Diamond 100', type: 'TOPUP',
      categoryId: cat.id, providerId: provider.id, providerSku: 'TEST100',
      costPrice: 9000, sellPrice: 10000,
    },
  });
  return { admin, customer, product, provider, cat };
}

/** Signature webhook Midtrans valid sesuai dokumentasi (untuk testpositif/negatif). */
export function midtransSignature(orderId: string, statusCode: string, grossAmount: string, serverKey = 'test-server-key'): string {
  return crypto.createHash('sha512').update(orderId + statusCode + grossAmount + serverKey).digest('hex');
}

export async function cleanupTest() {
  // hapus data test secara aman (dev/test DB saja!) — urutan hormati FK
  await prisma.$transaction([
    prisma.review.deleteMany({}),
    prisma.providerLog.deleteMany({}),
    prisma.providerCredential.deleteMany({}),
    prisma.orderTarget.deleteMany({}),
    prisma.walletLedger.deleteMany({}),
    prisma.wallet.deleteMany({}),
    prisma.orderHistory.deleteMany({}),
    prisma.providerTransaction.deleteMany({}),
    prisma.payment.deleteMany({}),
    prisma.refund.deleteMany({}),
    prisma.order.deleteMany({}),
    prisma.product.deleteMany({ where: { slug: 'test-diamond' } }),
    prisma.category.deleteMany({ where: { slug: 'test-game' } }),
    prisma.notification.deleteMany({ where: { user: { email: { contains: 'test@nexora.test' } } } }),
    prisma.session.deleteMany({ where: { user: { email: { contains: 'test@nexora.test' } } } }),
    prisma.user.deleteMany({ where: { email: { contains: 'test@nexora.test' } } }),
    prisma.provider.deleteMany({ where: { code: 'SIMULATION' } }),
  ]);
}

export async function closeDb() {
  await prisma.$disconnect();
}
