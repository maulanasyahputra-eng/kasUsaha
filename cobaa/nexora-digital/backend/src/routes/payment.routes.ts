import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../db';
import { AppError } from '../middleware/error';
import { requireAuth } from '../middleware/auth';
import { createSnapTransaction, getMidtransStatus, midtransClientKey } from '../providers/midtrans.provider';
import { markOrderPaid, markPaymentStatus } from '../services/payment.service';
import { config } from '../config';

const router = Router();

/**
 * POST /api/webhooks/midtrans
 * Alur:
 * 1) simpan WebhookEvent (idempotent per externalId)
 * 2) verifikasi signature sha512(order_id+status_code+gross_amount+serverKey)
 * 3) verifikasi status ke API Midtrans (bukan percaya payload)
 * 4) markOrderPaid (idempotent, transaction + row lock)
 */
router.post('/midtrans', async (req, res, next) => {
  try {
    const body = req.body as { order_id?: string; status_code?: string; gross_amount?: string; signature_key?: string; transaction_status?: string };
    if (!body.order_id) throw new AppError(400, 'BAD_WEBHOOK', 'Payload tidak valid.');

    // Webhook rate limit ketat: 30 req/menit per IP (Midtrans retry legitimate < ini)

    // Validasi bentuk payload SEBELUM dipakai (anti-injection ke log/query)
    const shape = z.object({
      order_id: z.string().min(3).max(100).regex(/^[A-Za-z0-9-_]+$/),
      status_code: z.string().regex(/^\d{2,4}$/).optional(),
      gross_amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
      signature_key: z.string().regex(/^[a-f0-9]{128}$/i).optional(),
      transaction_status: z.string().max(30).optional(),
    }).safeParse(body);
    if (!shape.success) {
      await prisma.webhookEvent.create({ data: { source: 'MIDTRANS', externalId: `malformed:${Date.now()}`, payload: JSON.stringify(body).slice(0, 2000), status: 'FAILED', note: 'Payload tidak sesuai bentuk' } });
      throw new AppError(400, 'BAD_WEBHOOK', 'Payload tidak valid.');
    }

    // WebhookEvent idempotency
    const eventKey = body.order_id + ':' + (body.transaction_status ?? '') + ':' + (body.status_code ?? '');
    const ev = await prisma.webhookEvent.upsert({
      where: { source_externalId: { source: 'MIDTRANS', externalId: eventKey } },
      update: {},
      create: { source: 'MIDTRANS', externalId: eventKey, payload: JSON.stringify(body) },
    });
    if (ev.status === 'PROCESSED') {
      res.status(200).json({ received: true, note: 'duplicate' });
      return;
    }

    if (!config.midtrans.serverKey) {
      await prisma.webhookEvent.update({ where: { id: ev.id }, data: { status: 'FAILED', note: 'SERVER_KEY belum dikonfigurasi' } });
      throw new AppError(503, 'PAYMENT_NOT_CONFIGURED', 'Payment gateway belum dikonfigurasi.');
    }

    // 1) Verifikasi signature (dihitung lokal, timing-safe)
    const sigValid = (() => {
      if (!body.signature_key || !body.status_code || !body.gross_amount) return false;
      const expected = crypto.createHash('sha512')
        .update(`${body.order_id}${body.status_code}${body.gross_amount}${config.midtrans.serverKey}`)
        .digest('hex');
      const a = Buffer.from(expected, 'hex');
      const b = Buffer.from(body.signature_key, 'hex');
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    })();
    if (!sigValid) {
      await prisma.webhookEvent.update({ where: { id: ev.id }, data: { status: 'FAILED', note: 'Signature tidak valid' } });
      throw new AppError(401, 'INVALID_SIGNATURE', 'Signature webhook tidak valid.');
    }

    // 2) Verifikasi status via API Midtrans (double check, sesuai dokumentasi)
    const status = await getMidtransStatus(body.order_id);
    if (status.order_id !== body.order_id) {
      await prisma.webhookEvent.update({ where: { id: ev.id }, data: { status: 'FAILED', note: 'Order ID mismatch' } });
      throw new AppError(400, 'ORDER_MISMATCH', 'Order ID tidak cocok.');
    }

    const grossMatch = Number(status.gross_amount) === Number(body.gross_amount);
    if (!grossMatch) {
      await prisma.webhookEvent.update({ where: { id: ev.id }, data: { status: 'FAILED', note: 'Nominal mismatch' } });
      throw new AppError(400, 'AMOUNT_MISMATCH', 'Nominal pembayaran tidak cocok.');
    }

    let handled = false;
    if (status.transaction_status === 'settlement' || status.transaction_status === 'capture') {
      await markOrderPaid(body.order_id, { provider: 'MIDTRANS', amount: Number(status.gross_amount), raw: status });
      handled = true;
    } else if (status.transaction_status === 'expire') {
      await markPaymentStatus(body.order_id, 'EXPIRED', status);
      handled = true;
    } else if (status.transaction_status === 'cancel' || status.transaction_status === 'deny') {
      await markPaymentStatus(body.order_id, 'FAILED', status);
      handled = true;
    } else if (status.transaction_status === 'refund' || status.transaction_status === 'partial_refund') {
      // Refund/chargeback ditangani manual oleh admin sesuai kebijakan (tidak otomatis).
      await prisma.webhookEvent.update({ where: { id: ev.id }, data: { note: 'Refund webhook dicatat; proses manual oleh admin.' } });
      handled = true;
    } else if (status.transaction_status === 'pending') {
      handled = true; // tetap PENDING
    }

    if (handled) {
      await prisma.webhookEvent.update({ where: { id: ev.id }, data: { status: 'PROCESSED', note: `transaction_status=${status.transaction_status}` } });
    } else {
      await prisma.webhookEvent.update({ where: { id: ev.id }, data: { status: 'IGNORED', note: `transaction_status=${status.transaction_status}` } });
    }
    res.status(200).json({ received: true });
  } catch (e) { next(e); }
});

/** Buat transaksi pembayaran untuk deposit saldo (login required). */
router.post('/deposit', requireAuth, async (req, res, next) => {
  try {
    const amount = Number(req.body?.amount);
    if (!Number.isInteger(amount) || amount < 10000 || amount > 10000000) {
      throw new AppError(400, 'INVALID_AMOUNT', 'Nominal deposit harus antara Rp10.000 - Rp10.000.000.');
    }
    const paymentRef = `DEP-${crypto.randomBytes(6).toString('hex')}`;
    const snap = await createSnapTransaction({
      externalId: paymentRef,
      amount,
      customerEmail: req.user!.email,
      description: 'Deposit saldo NEXORA',
    });
    const dep = await prisma.deposit.create({
      data: { userId: req.user!.id, amount, paymentRef, snapToken: snap.token },
    });
    res.status(201).json({ deposit: { id: dep.id, paymentRef: dep.paymentRef, snapToken: snap.token, redirectUrl: snap.redirectUrl, clientKey: midtransClientKey() } });
  } catch (e) { next(e); }
});

export default router;
