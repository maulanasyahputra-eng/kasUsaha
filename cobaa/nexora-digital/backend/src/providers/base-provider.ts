import axios from 'axios';

export interface ProviderServicesResult {
  // Struktur mentah dari provider; pemetaan ke produk internal dilakukan sinkronisasi.
  [key: string]: unknown;
}

export interface ProviderOrderResult {
  ok: boolean;
  pending?: boolean;
  providerRef?: string;
  sn?: string;
  raw: unknown;
}

export interface ProviderStatusResult {
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'UNKNOWN';
  raw: unknown;
}

export interface ProviderRuntimeConfig {
  baseUrl?: string;
  apiKey?: string;      // decrypted saat runtime — tidak pernah ke frontend/log
  username?: string;
  apiSecret?: string;
  signatureKey?: string;
  environment?: 'sandbox' | 'production';
  testing?: boolean;    // Digiflazz testing flag (hanya dev/sandbox)
}

export interface TestConnectionResult {
  status: 'CONNECTED' | 'CONNECTION_FAILED' | 'NOT_CONFIGURED';
  message: string;
  balance?: number | null;
}

/** Base class dengan HTTP client yang timeout-nya terkontrol (untuk test mock). */
export abstract class BaseProvider {
  cfg: ProviderRuntimeConfig;

  abstract readonly code: string;

  constructor(cfg: ProviderRuntimeConfig = {}) {
    this.cfg = cfg;
  }

  /**
   * Pemeriksaan koneksi RESMI provider (bukan transaksi pembelian).
   * Default: NOT_CONFIGURED jika credential kurang.
   */
  async testConnection(): Promise<TestConnectionResult> {
    if (!this.cfg.baseUrl || (!this.cfg.apiKey && !this.cfg.username)) {
      return { status: 'NOT_CONFIGURED', message: 'Credential belum lengkap.' };
    }
    return this.doTestConnection();
  }

  protected abstract doTestConnection(): Promise<TestConnectionResult>;

  protected get http() {
    return axios.create({
      baseURL: this.cfg.baseUrl,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  abstract getServices?(...args: unknown[]): Promise<ProviderServicesResult>;
  abstract createOrder?(...args: unknown[]): Promise<ProviderOrderResult>;
  abstract getOrderStatus?(...args: unknown[]): Promise<ProviderStatusResult>;
  async getBalance?(): Promise<number | null> { return null; }
}

/**
 * SIMULATION provider — TERPISAH dan berlabel jelas.
 * Dipakai hanya ketika kredensial provider asli belum tersedia.
 * Transaksi hasil SIMULATION TIDAK PERNAH dianggap transaksi nyata:
 * semua ProviderTransaction dari provider ini ditandai testing.
 */
export class SimulationProvider extends BaseProvider {
  readonly code = 'SIMULATION' as const;

  async getServices(): Promise<ProviderServicesResult> {
    return { mode: 'SIMULATION', note: 'Katalog simulasi — bukan data provider nyata.' };
  }

  async getBalance(): Promise<number | null> { return null; }

  protected async doTestConnection(): Promise<TestConnectionResult> {
    return { status: 'CONNECTED', message: 'SIMULATION provider selalu tersedia (DEVELOPMENT ONLY).' };
  }

  async createOrder(p: { sku: string; target: string; refId: string }): Promise<ProviderOrderResult> {
    // 10% kemungkinan FAILED untuk menguji alur gagal, sisanya SUCCESS.
    const ok = Math.random() > 0.1;
    return {
      ok,
      providerRef: `SIM-${p.refId}`,
      sn: ok ? `SIMSN${Date.now()}` : undefined,
      raw: { mode: 'SIMULATION', sku: p.sku, target: p.target },
    };
  }

  async getOrderStatus(_ref: string): Promise<ProviderStatusResult> {
    return { status: 'SUCCESS', raw: { mode: 'SIMULATION' } };
  }
}
