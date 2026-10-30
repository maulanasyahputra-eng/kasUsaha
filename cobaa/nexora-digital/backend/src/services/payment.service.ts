import { PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../db';
import { AppError } from '../middleware/error';
import { logger } from '../config';
import { applyWalletChange } from './wallet.service';

/** Dipanggil HANYA setelah pembayaran terverifikasi (webhook valid / status API / wallet). */
export async function markOrderPaid(
  orderExternalId: string,
  opts: { provider: 'MIDTRANS' | 'WALLET' | 'MANUAL'; amount: number; raw?: unknown; paymentRef?: string }
) {
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { externalId: orderExternalId }, include: { order: true } });
    if (!payment) {
      // deposit
      const deposit = opts.paymentRef ? await tx.deposit.findUnique({ where: { paymentRef: opts.paymentRef } }) : null;
      if (!deposit) throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Pembayaran tidak ditemukan.');
      if (deposit.amount !== opts.amount) throw new AppError(400, 'AMOUNT_MISMATCH', 'Nominal pembayaran tidak sesuai.');
      const locked = await tx.$queryRaw<{ id: string; status: string }[]>`
        SELECT id, status FROM Deposit WHERE id = ${deposit.id} FOR UPDATE`;
      if (locked[0]?.status === 'PAID') {
        return { duplicate: true as const };
      }
      if (locked[0]?.status !== 'PENDING') return { duplicate: true as const };
      await tx.deposit.update({ where: { id: deposit.id }, data: { status: 'PAID', paidAt: new Date() } });
      await applyWalletChange({
        userId: deposit.userId,
        type: 'DEPOSIT',
        amount: deposit.amount,
        referenceType: 'DEPOSIT',
        referenceId: deposit.id,
        note: `Deposit ${deposit.id}`,
        tx,
      });
      await tx.notification.create({
        data: { userId: deposit.userId, title: 'Deposit Berhasil', body: `Saldo bertambah Rp${deposit.amount.toLocaleString('id-ID')}.` },
      });
      return { duplicate: false as const };
    }

    // Order payment path
    if (payment.status === PaymentStatus.PAID) return { duplicate: true as const };
    if (payment.amount !== opts.amount) {
      logger.error({ externalId: orderExternalId, expected: payment.amount, got: opts.amount }, 'Nominal webhook tidak cocok');
      throw new AppError(400, 'AMOUNT_MISMATCH', 'Nominal pembayaran tidak sesuai.');
    }

    const lockedOrder = await tx.$queryRaw<{ id: string; status: string }[]>`
      SELECT id, status FROM \`Order\` WHERE id = ${payment.orderId} FOR UPDATE`;
    if (!lockedOrder[0] || lockedOrder[0].status !== PaymentStatus.PENDING) return { duplicate: true as const };

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.PAID, paidAt: new Date(), rawPayload: JSON.stringify(opts.raw ?? {}) },
    });
    await tx.order.update({ where: { id: payment.orderId }, data: { status: PaymentStatus.PAID } });
    await tx.orderHistory.create({
      data: { orderId: payment.orderId, field: 'status', fromValue: 'PENDING', toValue: 'PAID', note: `Pembayaran terverifikasi via ${opts.provider}` },
    });
    if (payment.userId) {
      await tx.notification.create({
        data: { userId: payment.userId, title: 'Pembayaran Berhasil', body: `Order ${payment.orderId} telah dibayar dan akan diproses.` },
      });
    }
    return { duplicate: false as const, orderId: payment.orderId, userId: payment.userId };
  }, { timeout: 15000 });

  return result;
}

/** Tandai expired/failed dari Midtrans. */
export async function markPaymentStatus(orderExternalId: string, status: PaymentStatus, raw?: unknown) {
  const payment = await prisma.payment.findUnique({ where: { externalId: orderExternalId } });
  if (!payment) return;
  if (payment.status === PaymentStatus.PAID) return; // tidak pernah menurunkan status dari PAID
  const depStatus: Record<string, PaymentStatus> = { EXPIRED: 'EXPIRED', FAILED: 'FAILED' };
  if (!depStatus[status]) return;
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: payment.id }, data: { status, rawPayload: JSON.stringify(raw ?? {}) } });
    await tx.order.update({ where: { id: payment.orderId }, data: { status } });
    await tx.orderHistory.create({
      data: { orderId: payment.orderId, field: 'status', fromValue: 'PENDING', toValue: status, note: 'Update dari payment gateway' },
    });
  });
}
