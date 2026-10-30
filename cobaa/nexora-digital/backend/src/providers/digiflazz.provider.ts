import crypto from 'crypto';
import axios from 'axios';
import { BaseProvider, ProviderServicesResult, ProviderOrderResult, ProviderStatusResult, TestConnectionResult } from './base-provider';

/**
 * Digiflazz adapter — mengikuti dokumentasi resmi:
 * https://developer.digiflazz.com/api/buyer/topup/
 *
 * - Daftar harga: POST {BASE}/v1/price-list  { cmd: "price", username, sign }
 *   sign = md5(username + api_key + "price")
 * - Transaksi:    POST {BASE}/v1/transaction { username, buyer_sku_code, customer_no,
 *                   ref_id, sign } ; sign = md5(username + api_key + ref_id)
 * - Deposit (cek saldo): cmd "deposit", sign = md5(username + api_key + "depo")
 * - Callback status dikirim Digiflazz ke webhook terdaftar; verifikasi:
 *   sha256(username + api_key + ref_id + status).
 *
 * Tidak ada endpoint yang dikarang. Status transaksi per-item diperoleh lewat
 * callback — adapter menyediakan verifikasi callback, bukan polling palsu.
 */

interface DfConfig { baseUrl: string; apiKey: string; username: string; testing?: boolean }

export class DigiflazzProvider extends BaseProvider {
  readonly code = 'DIGIFLAZZ' as const;
  declare cfg: DfConfig;

  private signMd5(...parts: string[]): string {
    return crypto.createHash('md5').update(parts.join('')).digest('hex');
  }

  private assertConfigured(): void {
    if (!this.cfg?.username || !this.cfg?.apiKey || !this.cfg?.baseUrl) {
      throw new Error('Digiflazz belum dikonfigurasi (DIGIFLAZZ_USERNAME / DIGIFLAZZ_API_KEY / DIGIFLAZZ_BASE_URL).');
    }
  }

  /** Verifikasi callback Digiflazz: sha256(username + api_key + ref_id + status). */
  verifyCallbackSign(refId: string, status: string, callbackSign: string): boolean {
    if (!this.cfg?.username || !this.cfg?.apiKey) return false;
    const expected = crypto
      .createHash('sha256')
      .update(this.cfg.username + this.cfg.apiKey + refId + status)
      .digest('hex');
    return expected === callbackSign;
  }

  async getServices(): Promise<ProviderServicesResult> {
    this.assertConfigured();
    const res = await axios.post(
      `${this.cfg.baseUrl}/v1/price-list`,
      {
        cmd: 'price',
        username: this.cfg.username,
        sign: this.signMd5(this.cfg.username, this.cfg.apiKey, 'price'),
      },
      { timeout: 30000 }
    );
    return res.data;
  }

  async createOrder(p: { sku: string; customerNo: string; refId: string }): Promise<ProviderOrderResult> {
    this.assertConfigured();
    const res = await axios.post(
      `${this.cfg.baseUrl}/v1/transaction`,
      {
        username: this.cfg.username,
        buyer_sku_code: p.sku,
        customer_no: p.customerNo,
        ref_id: p.refId,
        sign: this.signMd5(this.cfg.username, this.cfg.apiKey, p.refId),
        testing: this.cfg.testing === true,
      },
      { timeout: 60000 }
    );
    const d = res.data?.data ?? res.data;
    return {
      ok: d?.status === 'Sukses',
      pending: d?.status === 'Pending',
      providerRef: d?.ref_id ?? p.refId,
      sn: d?.sn,
      raw: res.data,
    };
  }

  /** Digiflazz tidak menyediakan endpoint cek-status per transaksi; status via callback. */
  async getOrderStatus(_providerRef: string): Promise<ProviderStatusResult> {
    return { status: 'UNKNOWN', raw: { note: 'Digiflazz menggunakan callback; gunakan webhook.' } };
  }

  /** Cek saldo via endpoint deposit resmi Digiflazz (cmd "deposit") — bukan transaksi pembelian. */
  protected async doTestConnection(): Promise<TestConnectionResult> {
    try {
      const balance = await this.getBalance();
      if (balance === null) {
        return { status: 'CONNECTION_FAILED', message: 'Respons saldo tidak dapat dibaca (cek username/API key).' };
      }
      return { status: 'CONNECTED', message: `Terhubung. Saldo: Rp${balance.toLocaleString('id-ID')}`, balance };
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } }; message?: string }).message ?? 'unknown';
      return { status: 'CONNECTION_FAILED', message: `Gagal: ${msg.slice(0, 200)}` };
    }
  }

  async getBalance(): Promise<number | null> {
    this.assertConfigured();
    const res = await axios.post(
      `${this.cfg.baseUrl}/v1/legacy/transaction`,
      {
        commands: 'deposit',
        username: this.cfg.username,
        sign: this.signMd5(this.cfg.username, this.cfg.apiKey, 'depo'),
      },
      { timeout: 30000 }
    );
    const d = res.data?.data ?? res.data;
    return typeof d?.saldo === 'number' ? d.saldo : null;
  }
}
