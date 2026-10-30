import { prisma } from '../db';
import { AppError } from '../middleware/error';
import { encryptSecret, decryptSecret, validateProviderBaseUrl } from './crypto.service';
import { getProvider } from '../providers/provider-registry';

/** Kredensial runtime gabungan: env fallback → DB (dekripsi). */
async function runtimeConfig(providerCode: string) {
  const providerId = await providerCodeToId(providerCode);
  const cred = await prisma.providerCredential.findUnique({ where: { providerId } });
  const cfg: Record<string, string | undefined> = {};
  if (cred) {
    cfg.baseUrl = cred.baseUrl ?? undefined;
    cfg.username = cred.username ?? undefined;
    cfg.environment = cred.environment;
    try { cfg.apiKey = cred.apiKeyEnc ? decryptSecret(cred.apiKeyEnc) : undefined; } catch { /* corrupted */ }
    try { cfg.apiSecret = cred.apiSecretEnc ? decryptSecret(cred.apiSecretEnc) : undefined; } catch { /* corrupted */ }
    try { cfg.signatureKey = cred.signatureKeyEnc ? decryptSecret(cred.signatureKeyEnc) : undefined; } catch { /* corrupted */ }
  }
  // Fallback env (backward compatible) — hanya jika DB belum berisi
  const { config } = await import('../config');
  if (providerCode === 'DIGIFLAZZ') {
    cfg.baseUrl = cfg.baseUrl || config.digiflazz.baseUrl || undefined;
    cfg.username = cfg.username || config.digiflazz.username || undefined;
    cfg.apiKey = cfg.apiKey || config.digiflazz.apiKey || undefined;
  } else if (providerCode === 'SOSMEDMEDIA') {
    cfg.baseUrl = cfg.baseUrl || config.sosmedmedia.baseUrl || undefined;
    cfg.apiKey = cfg.apiKey || config.sosmedmedia.apiKey || undefined;
  }
  return cfg;
}

const idCache = new Map<string, string>();
async function providerCodeToId(code: string): Promise<string> {
  const cached = idCache.get(code);
  if (cached) return cached;
  const p = await prisma.provider.findUnique({ where: { code } });
  if (!p) throw new AppError(404, 'PROVIDER_NOT_FOUND', `Provider ${code} tidak ditemukan.`);
  idCache.set(code, p.id);
  return p.id;
}

export interface SaveCredentialInput {
  baseUrl?: string;
  username?: string;
  apiKey?: string;
  apiSecret?: string;
  signatureKey?: string;
  environment?: 'sandbox' | 'production';
}

/** Simpan/update credential (enkripsi AES-256-GCM). Kembalikan tanpa credential. */
export async function saveProviderCredential(providerCode: string, input: SaveCredentialInput, adminUserId?: string) {
  const provider = await prisma.provider.findUnique({ where: { code: providerCode } });
  if (!provider) throw new AppError(404, 'PROVIDER_NOT_FOUND', `Provider ${providerCode} tidak ditemukan.`);
  const providerId = provider.id;
  idCache.set(providerCode, providerId);

  let baseUrl = input.baseUrl?.trim();
  if (baseUrl) {
    const check = validateProviderBaseUrl(baseUrl);
    if (!check.ok) throw new AppError(400, 'BAD_URL', check.reason);
    baseUrl = check.url.toString();
  }

  const data: Record<string, unknown> = {
    baseUrl: baseUrl ?? null,
    username: input.username?.trim() || null,
    environment: input.environment === 'production' ? 'production' : 'sandbox',
  };
  // Enkripsi hanya field yang dikirim (biar bisa update parsial)
  if (input.apiKey) data.apiKeyEnc = encryptSecret(input.apiKey.trim());
  if (input.apiSecret) data.apiSecretEnc = encryptSecret(input.apiSecret.trim());
  if (input.signatureKey) data.signatureKeyEnc = encryptSecret(input.signatureKey.trim());

  const cred = await prisma.providerCredential.upsert({
    where: { providerId },
    update: data,
    create: { providerId, ...data },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId ?? null,
      action: 'PROVIDER_CREDENTIAL_SAVE',
      entity: 'ProviderCredential',
      entityId: cred.id,
      detail: { provider: providerCode, fields: Object.keys(data).filter((k) => !k.endsWith('Enc')), environment: cred.environment } as object,
    },
  });

  // Ringkasan aman untuk frontend
  return {
    baseUrl: cred.baseUrl,
    username: cred.username,
    environment: cred.environment,
    hasApiKey: Boolean(cred.apiKeyEnc),
    hasApiSecret: Boolean(cred.apiSecretEnc),
    hasSignatureKey: Boolean(cred.signatureKeyEnc),
    connStatus: cred.connStatus,
  };
}

/** Test koneksi sungguhan via adapter resmi — TIDAK melakukan transaksi pembelian. */
export async function testProviderConnection(providerCode: string) {
  const cfg = await runtimeConfig(providerCode);
  const provider = getProvider(providerCode);
  // Inject runtime config ke instance
  (provider as unknown as { cfg: unknown }).cfg = cfg;
  const result = await provider.testConnection();

  const providerId = await providerCodeToId(providerCode);
  await prisma.providerCredential.upsert({
    where: { providerId },
    update: {
      connStatus: result.status,
      connMessage: result.message.slice(0, 500),
      lastCheckedAt: new Date(),
      ...(result.status === 'CONNECTED' ? { lastConnectedAt: new Date() } : {}),
    },
    create: { providerId, connStatus: result.status, connMessage: result.message.slice(0, 500), lastCheckedAt: new Date() },
  });
  await prisma.providerLog.create({
    data: {
      providerId, kind: 'CONNECTION', status: result.status,
      message: result.message.slice(0, 500),
      detail: result.balance != null ? { balance: result.balance } : undefined,
    },
  });
  return result;
}

/** Ambil status aman untuk frontend semua provider. */
export async function listProviderStatus() {
  const providers = await prisma.provider.findMany({
    include: { credential: true, _count: { select: { products: true } } },
    orderBy: { priority: 'desc' },
  });
  return providers.map((p: (typeof providers)[number]) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    isActive: p.isActive,
    priority: p.priority,
    productCount: p._count.products,
    credential: p.credential ? {
      baseUrl: p.credential.baseUrl,
      username: p.credential.username,
      environment: p.credential.environment,
      hasApiKey: Boolean(p.credential.apiKeyEnc),
      hasApiSecret: Boolean(p.credential.apiSecretEnc),
      hasSignatureKey: Boolean(p.credential.signatureKeyEnc),
      connStatus: p.credential.connStatus,
      connMessage: p.credential.connMessage,
      lastConnectedAt: p.credential.lastConnectedAt,
      lastCheckedAt: p.credential.lastCheckedAt,
    } : {
      baseUrl: null, username: null, environment: 'sandbox',
      hasApiKey: false, hasApiSecret: false, hasSignatureKey: false,
      connStatus: 'NOT_CONFIGURED', connMessage: null,
      lastConnectedAt: null, lastCheckedAt: null,
    },
  }));
}

export { runtimeConfig, providerCodeToId };
