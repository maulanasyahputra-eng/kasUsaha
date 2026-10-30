import crypto from 'crypto';
import axios from 'axios';
import { config } from '../config';
import { AppError } from '../middleware/error';
import { logger } from '../config';

/**
 * Midtrans Snap — persis dokumentasi resmi:
 * - Snap API: POST https://app.sandbox.midtrans.com/snap/v1/transactions
 *   (production: https://app.midtrans.com/snap/v1/transactions)
 * - Auth header: Basic base64(serverKey + ':')
 * - Webhook: POST /api/webhooks/midtrans, verifikasi signature:
 *   sha512(order_id + status_code + gross_amount + serverKey)
 * - Verifikasi status: GET https://api.sandbox.midtrans.com/v2/{order_id}/status
 */
export const midtransSnapUrl = config.midtrans.isProduction
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

export const midtransApiUrl = config.midtrans.isProduction
  ? 'https://api.midtrans.com/v2'
  : 'https://api.sandbox.midtrans.com/v2';

function authHeader(): string {
  if (!config.midtrans.serverKey) {
    throw new AppError(503, 'PAYMENT_NOT_CONFIGURED', 'Payment gateway belum dikonfigurasi.');
  }
  return 'Basic ' + Buffer.from(config.midtrans.serverKey + ':').toString('base64');
}

export async function createSnapTransaction(params: {
  externalId: string;
  amount: number;
  customerEmail?: string;
  customerName?: string;
  description: string;
  enabledPayments?: string[]; // QRIS/VA/E-wallet — lihat Midtrans Snap available payments
}): Promise<{ token: string; redirectUrl: string }> {
  const { data } = await axios.post(
    midtransSnapUrl,
    {
      transaction_details: {
        order_id: params.externalId,
        gross_amount: params.amount,
      },
      customer_details: {
        email: params.customerEmail,
        first_name: params.customerName,
      },
      item_details: [
        {
          id: params.externalId,
          price: params.amount,
          quantity: 1,
          name: params.description.slice(0, 50),
        },
      ],
      // Jika diset, hanya metode ini yang muncul (QRIS/VA/E-wallet); kosong = semua metode aktif akun merchant.
      ...(params.enabledPayments?.length ? { enabled_payments: params.enabledPayments } : {}),
    },
    {
      headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
      timeout: 20000,
    }
  );
  return { token: data.token, redirectUrl: data.redirect_url };
}

/** Verifikasi signature SHA512 sesuai dokumentasi Midtrans. */
export function verifyMidtransSignature(orderId: string, statusCode: string, grossAmount: string, signatureKey: string): boolean {
  const expected = crypto
    .createHash('sha512')
    .update(orderId + statusCode + grossAmount + config.midtrans.serverKey)
    .digest('hex');
  return expected === signatureKey;
}

/** Verifikasi status transaksi langsung ke API Midtrans (bukan percaya frontend). */
export async function getMidtransStatus(orderId: string) {
  const { data } = await axios.get(`${midtransApiUrl}/${orderId}/status`, {
    headers: { Authorization: authHeader() },
    timeout: 20000,
  });
  return data;
}

export const midtransClientKey = () => config.midtrans.clientKey;
