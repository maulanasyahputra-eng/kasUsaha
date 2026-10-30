import { prisma } from '../db';
import { AppError } from '../middleware/error';
import { DigiflazzProvider } from './digiflazz.provider';
import { SosmedmediaProvider } from './sosmedmedia.provider';
import { SimulationProvider } from './base-provider';
import { BaseProvider } from './base-provider';
import { config } from '../config';
import { logger } from '../config';
import { decryptSecret } from '../services/crypto.service';

/**
 * Runtime config dari DB (ProviderCredential terenkripsi) dengan fallback env.
 * Tidak di-cache agresif: admin bisa mengubah credential kapan pun.
 */
async function resolveRuntime(code: string): Promise<BaseProvider['cfg']> {
  const p = await prisma.provider.findUnique({ where: { code }, include: { credential: true } });
  const cfg: BaseProvider['cfg'] = {};
  const cred = p?.credential;
  if (cred) {
    cfg.baseUrl = cred.baseUrl ?? undefined;
    cfg.username = cred.username ?? undefined;
    try { cfg.apiKey = cred.apiKeyEnc ? decryptSecret(cred.apiKeyEnc) : undefined; } catch { /* korup → fallback */ }
    try { cfg.apiSecret = cred.apiSecretEnc ? decryptSecret(cred.apiSecretEnc) : undefined; } catch { /* korup */ }
    cfg.environment = (cred.environment as 'sandbox' | 'production') ?? 'sandbox';
  }
  // Fallback env bila DB belum berisi field tsb
  if (code === 'DIGIFLAZZ') {
    cfg.baseUrl = cfg.baseUrl || config.digiflazz.baseUrl || undefined;
    cfg.username = cfg.username || config.digiflazz.username || undefined;
    cfg.apiKey = cfg.apiKey || config.digiflazz.apiKey || undefined;
    cfg.testing = config.nodeEnv !== 'production' && process.env.DIGIFLAZZ_TESTING === 'true';
  } else if (code === 'SOSMEDMEDIA') {
    cfg.baseUrl = cfg.baseUrl || config.sosmedmedia.baseUrl || undefined;
    cfg.apiKey = cfg.apiKey || config.sosmedmedia.apiKey || undefined;
  }
  return cfg;
}

async function getProviderAsync(code: string): Promise<BaseProvider> {
  const cfg = await resolveRuntime(code);
  switch (code) {
    case 'DIGIFLAZZ': return new DigiflazzProvider(cfg);
    case 'SOSMEDMEDIA': return new SosmedmediaProvider(cfg);
    case 'SIMULATION': return new SimulationProvider(cfg);
    default: throw new AppError(500, 'PROVIDER_UNKNOWN', `Provider tidak dikenal: ${code}`);
  }
}

/** Registry sync (blocking). Untuk async runtime config gunakan getProviderAsync(). */
export function getProvider(code: string): BaseProvider {
  switch (code) {
    case 'DIGIFLAZZ': return new DigiflazzProvider({
      baseUrl: config.digiflazz.baseUrl || undefined,
      apiKey: config.digiflazz.apiKey || undefined,
      username: config.digiflazz.username || undefined,
      testing: config.nodeEnv !== 'production' && process.env.DIGIFLAZZ_TESTING === 'true',
    });
    case 'SOSMEDMEDIA': return new SosmedmediaProvider({
      baseUrl: config.sosmedmedia.baseUrl || undefined,
      apiKey: config.sosmedmedia.apiKey || undefined,
    });
    case 'SIMULATION': return new SimulationProvider({});
    default:
      throw new AppError(500, 'PROVIDER_UNKNOWN', `Provider tidak dikenal: ${code}`);
  }
}

/** Provider dengan runtime config ter-dekripsi dari DB (fallback env). */
export { getProviderAsync };

export async function providerIsConfiguredDb(code: string): Promise<boolean> {
  try {
    const cfg = await resolveRuntime(code);
    return Boolean(cfg.baseUrl && (cfg.apiKey || cfg.username));
  } catch { return false; }
}

export function providerIsConfigured(code: string): boolean {
  try {
    const p = getProvider(code);
    if (code === 'DIGIFLAZZ') return Boolean(config.digiflazz.apiKey && config.digiflazz.username);
    if (code === 'SOSMEDMEDIA') return Boolean(config.sosmedmedia.apiKey && config.sosmedmedia.baseUrl);
    return true;
  } catch {
    return false;
  }
}

/** Sinkronisasi katalog Digiflazz (prepaid) ke tabel Product — runtime credential dari DB/env. */
export async function syncDigiflazzCatalog() {
  const df = await getProviderAsync('DIGIFLAZZ') as DigiflazzProvider;
  let res;
  try {
    res = await df.getServices();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    logger.error({ err: msg }, 'Sinkronisasi Digiflazz gagal');
    return { synced: 0, error: msg.slice(0, 200) };
  }
  const provider = await prisma.provider.upsert({
    where: { code: 'DIGIFLAZZ' },
    update: {},
    create: { code: 'DIGIFLAZZ', name: 'Digiflazz', isActive: true, priority: 10 },
  });
  const df2 = getProvider('DIGIFLAZZ') as DigiflazzProvider;
  void df2;
  const items = (res?.data ?? []) as Array<Record<string, unknown>>;
  let synced = 0;
  for (const item of items) {
    const sku = String(item.buyer_sku_code ?? '');
    const brand = String(item.brand ?? 'Lainnya');
    const price = Number(item.price ?? 0);
    const statusTx = String(item.status ?? '');
    if (!sku || !price) continue;
    const slug = `digiflazz-${sku.toLowerCase()}`;
    const category = await prisma.category.upsert({
      where: { slug: `dgf-${brand.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: { slug: `dgf-${brand.toLowerCase().replace(/\s+/g, '-')}`, name: brand, type: 'TOPUP' },
    });
    const active = statusTx !== 'Gagal';
    const existing = await prisma.product.findUnique({ where: { slug } });
    const sellPrice = Math.ceil(price * 1.05); // margin default 5%, dapat diubah admin
    if (existing) {
      await prisma.product.update({
        where: { slug },
        data: { costPrice: price, isActive: active, providerSku: sku, providerId: provider.id },
      });
    } else {
      await prisma.product.create({
        data: {
          slug, name: String(item.product_name ?? sku), type: 'TOPUP',
          categoryId: category.id, providerId: provider.id, providerSku: sku,
          costPrice: price, sellPrice, isActive: active,
        },
      });
    }
    synced++;
  }
  logger.info({ synced }, 'Sinkronisasi katalog Digiflazz selesai');
  return { synced };
}
