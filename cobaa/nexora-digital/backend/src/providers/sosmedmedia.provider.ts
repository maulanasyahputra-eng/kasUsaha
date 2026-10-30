import { BaseProvider, ProviderServicesResult, ProviderOrderResult, ProviderStatusResult, TestConnectionResult } from './base-provider';

/**
 * Sosmedmedia adapter — hanya mengimplementasikan endpoint yang ada di
 * dokumentasi resmi: https://sosmedmedia.com/api-docs
 * Endpoint: /services, /order, /status (JSON API dengan parameter api_key).
 * Jika SOSMEDMEDIA_API_KEY kosong, adapter menolak dipakai (tidak ada simulasi palsu).
 */
export class SosmedmediaProvider extends BaseProvider {
  code = 'SOSMEDMEDIA' as const;

  private assertConfigured() {
    if (!this.cfg.baseUrl || !this.cfg.apiKey) {
      throw new Error('Sosmedmedia belum dikonfigurasi (SOSMEDMEDIA_API_BASE_URL / SOSMEDMEDIA_API_KEY).');
    }
  }

  /** Cek koneksi via endpoint /status resmi dengan 1 pesanan dummy-free: pakai /services (daftar layanan) — read-only. */
  protected async doTestConnection(): Promise<TestConnectionResult> {
    try {
      await this.getServices();
      return { status: 'CONNECTED', message: 'Terhubung. Daftar layanan berhasil diambil.', balance: null };
    } catch (e) {
      const err = e as { response?: { status?: number; data?: unknown }; message?: string };
      const detail = err.response ? `HTTP ${err.response.status}` : (err.message ?? 'unknown');
      return { status: 'CONNECTION_FAILED', message: `Gagal: ${detail}`.slice(0, 200) };
    }
  }

  async getServices(): Promise<ProviderServicesResult> {
    this.assertConfigured();
    const res = await this.http.get('/services', { params: { api_key: this.cfg.apiKey } });
    return res.data;
  }

  async createOrder(p: { sku: string; quantity: number; target: string }): Promise<ProviderOrderResult> {
    this.assertConfigured();
    const res = await this.http.post('/order', {
      api_key: this.cfg.apiKey,
      service: p.sku,
      quantity: p.quantity,
      target: p.target,
    });
    // Field respons mengikuti dokumentasi provider; id pesanan disimpan apa adanya.
    return {
      ok: res.data?.status === true || res.data?.status === 'success',
      providerRef: res.data?.id ?? res.data?.order_id ?? (String(res.data?.data?.id ?? '') || undefined),
      raw: res.data,
    };
  }

  async getOrderStatus(providerRef: string): Promise<ProviderStatusResult> {
    this.assertConfigured();
    const res = await this.http.get('/status', { params: { api_key: this.cfg.apiKey, id: providerRef } });
    const s = res.data?.status;
    // Pemetaan status provider -> status internal
    let status: ProviderStatusResult['status'] = 'UNKNOWN';
    if (s === 'Success' || s === 'success') status = 'SUCCESS';
    else if (s === 'Processing' || s === 'In Progress' || s === 'processing') status = 'PENDING';
    else if (s === 'Canceled' || s === 'Failed' || s === 'error') status = 'FAILED';
    return { status, raw: res.data };
  }

  async getBalance(): Promise<number | null> {
    // Endpoint saldo tidak diverifikasi di dokumentasi publik — BELUM DIIMPLEMENTASIKAN.
    return null;
  }
}
