import { prisma } from '../db';
import { AppError } from '../middleware/error';
import { DigiflazzProvider } from './digiflazz.provider';
import { SosmedmediaProvider } from './sosmedmedia.provider';
import { SimulationProvider } from './base-provider';
import { BaseProvider } from './base-provider';
import { config } from '../config';
import { logger } from '../config';

let digiflazzInstance: DigiflazzProvider | null = null;
let sosmedmediaInstance: SosmedmediaProvider | null = null;
const simulationInstance = new SimulationProvider({});

function getDigiflazz(): DigiflazzProvider {
  if (!digiflazzInstance) {
    digiflazzInstance = new DigiflazzProvider({
      baseUrl: config.digiflazz.baseUrl,
      apiKey: config.digiflazz.apiKey,
      username: config.digiflazz.username,
      testing: config.nodeEnv !== 'production' && process.env.DIGIFLAZZ_TESTING === 'true',
    });
  }
  return digiflazzInstance;
}

function getSosmedmedia(): SosmedmediaProvider {
  if (!sosmedmediaInstance) {
    sosmedmediaInstance = new SosmedmediaProvider({
      baseUrl: config.sosmedmedia.baseUrl,
      apiKey: config.sosmedmedia.apiKey,
    });
  }
  return sosmedmediaInstance;
}

/** Registry: provider baru cukup didaftarkan di sini tanpa mengubah logika order. */
export function getProvider(code: string): BaseProvider {
  switch (code) {
    case 'DIGIFLAZZ': return getDigiflazz();
    case 'SOSMEDMEDIA': return getSosmedmedia();
    case 'SIMULATION': return simulationInstance;
    default:
      throw new AppError(500, 'PROVIDER_UNKNOWN', `Provider tidak dikenal: ${code}`);
  }
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

/** Sinkronisasi katalog Digiflazz (prepaid) ke tabel Product — hanya produk prepaid. */
export async function syncDigiflazzCatalog() {
  if (!providerIsConfigured('DIGIFLAZZ')) {
    logger.warn('Sinkronisasi Digiflazz dilewati: kredensial belum tersedia.');
    return { synced: 0, skipped: 'NOT_CONFIGURED' };
  }
  const provider = await prisma.provider.upsert({
    where: { code: 'DIGIFLAZZ' },
    update: {},
    create: { code: 'DIGIFLAZZ', name: 'Digiflazz', isActive: true, priority: 10 },
  });
  const df = getProvider('DIGIFLAZZ') as DigiflazzProvider;
  const res = await df.getServices();
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
