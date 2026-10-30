/**
 * Seed DEVELOPMENT ONLY.
 * Berisi katalog contoh + 1 akun admin dev dengan password yang TIDAK BOLEH
 * dipakai di production (lihat README bagian "Membuat akun admin secara aman").
 */
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();
const ARGON = { type: 2 as const, memoryCost: 19456, timeCost: 2, parallelism: 1 };

async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@nexora.test';
  const adminPass = process.env.ADMIN_SEED_PASSWORD || 'ChangeMe_Now!2026';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: await argon2.hash(adminPass, ARGON) },
    create: {
      email: adminEmail,
      name: 'Admin Dev',
      role: 'ADMIN',
      passwordHash: await argon2.hash(adminPass, { type: 2 as const, memoryCost: 19456, timeCost: 2, parallelism: 1 }),
      wallet: { create: {} },
    },
  });

  const demoEmail = 'demo@nexora.test';
  await prisma.user.upsert({
    where: { email: demoEmail },
    update: { passwordHash: await argon2.hash('Demo1234!', ARGON) },
    create: {
      email: demoEmail,
      name: 'Demo Customer',
      role: 'CUSTOMER',
      passwordHash: await argon2.hash('Demo1234!', { type: 2 as const, memoryCost: 19456, timeCost: 2, parallelism: 1 }),
      wallet: { create: {} },
    },
  });

  // Pastikan semua provider inti terdaftar (idempotent)
  for (const [code, name] of [
    ['DIGIFLAZZ', 'Digiflazz'],
    ['SOSMEDMEDIA', 'Sosmedmedia'],
    ['SIMULATION', 'Simulation Provider (dev only)'],
  ] as const) {
    await prisma.provider.upsert({
      where: { code },
      update: {},
      create: { code, name, isActive: code === 'SIMULATION', priority: code === 'DIGIFLAZZ' ? 10 : code === 'SOSMEDMEDIA' ? 5 : -1 },
    });
  }

  const provSim = await prisma.provider.upsert({
    where: { code: 'SIMULATION' },
    update: {},
    create: { code: 'SIMULATION', name: 'Simulation Provider (dev only)', isActive: true, priority: -1 },
  });

  const categoriesData = [
    { slug: 'mobile-legends', name: 'Mobile Legends', type: 'TOPUP' as const, requiresZone: true, sku: 'ML', imageUrl: null },
    { slug: 'free-fire', name: 'Free Fire', type: 'TOPUP' as const, requiresZone: false, sku: 'FF', imageUrl: null },
    { slug: 'pubg-mobile', name: 'PUBG Mobile', type: 'TOPUP' as const, requiresZone: false, sku: 'PUBGM', imageUrl: null },
    { slug: 'honor-of-kings', name: 'Honor of Kings', type: 'TOPUP' as const, requiresZone: false, sku: 'HOK', imageUrl: null },
  ];

  for (const [i, c] of categoriesData.entries()) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { slug: c.slug, name: c.name, type: 'TOPUP', sortOrder: i },
    });

    const denoms = c.type === 'TOPUP' ? [
      { n: `${c.name} 86 Diamonds`, p: 21000, cost: 19500 },
      { n: `${c.name} 172 Diamonds`, p: 41000, cost: 38500 },
      { n: `${c.name} 257 Diamonds`, p: 61000, cost: 57500 },
      { n: `${c.name} 706 Diamonds`, p: 160000, cost: 152000 },
    ] : [];
    for (const [j, d] of denoms.entries()) {
      const slug = `${c.slug}-${j + 1}`;
      await prisma.product.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          name: d.n,
          type: 'TOPUP',
          categoryId: cat.id,
          providerId: provSim.id,
          providerSku: `${c.sku}${(j + 1) * 10}`,
          costPrice: d.cost,
          sellPrice: d.p,
          requiresZoneId: c.requiresZone,
          sortOrder: j,
        },
      });
    }
  }

  for (const [i, p] of [
    { slug: 'instagram', name: 'Instagram', type: 'SMM' as const },
    { slug: 'tiktok', name: 'TikTok', type: 'SMM' as const },
    { slug: 'youtube', name: 'YouTube', type: 'SMM' as const },
    { slug: 'facebook', name: 'Facebook', type: 'SMM' as const },
  ].entries()) {
    const cat = await prisma.category.upsert({
      where: { slug: p.slug },
      update: {},
      create: { slug: p.slug, name: p.name, type: 'SMM', sortOrder: 10 + i },
    });
    const services = [
      { svc: 'Followers', price: 250, sku: `SMM-${p.slug.toUpperCase()}-FOL` },
      { svc: 'Likes', price: 120, sku: `SMM-${p.slug.toUpperCase()}-LIKE` },
      { svc: 'Views', price: 45, sku: `SMM-${p.slug.toUpperCase()}-VIEW` },
    ];
    for (const [j, s] of services.entries()) {
      const slug = `${p.slug}-${s.svc.toLowerCase()}`;
      await prisma.product.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          name: `${p.name} ${s.svc} (contoh katalog simulasi)`,
          description: 'Produk seed development via SIMULATION provider. Sinkronkan dengan katalog provider asli sebelum production.',
          type: 'SMM',
          categoryId: cat.id,
          providerId: provSim.id,
          providerSku: s.sku,
          costPrice: Math.round(s.price * 0.85),
          sellPrice: s.price,
          minOrder: 100,
          maxOrder: 100000,
          avgTime: '0-12 jam (estimasi provider, tidak dijamin)',
          sortOrder: j,
        },
      });
    }
  }

  console.log('Seed selesai. Admin dev:', adminEmail);
}

main().finally(() => prisma.$disconnect());
