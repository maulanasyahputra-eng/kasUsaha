import { prisma } from '../db';
import { AppError } from '../middleware/error';
import { logger } from '../config';
import { getProvider } from '../providers/provider-registry';

/**
 * Worker memproses order yang sudah PAID namun fulfillment masih QUEUED/-reconcile.
 * Idempotent: order dengan sentToProviderAt terisi + ProviderTransaction SUCCESS tidak dikirim ulang.
 * Retry dilakukan oleh pemanggil (interval loop) dengan backoff sederhana.
 */
export async function processOrderOnce(orderId: string): Promise<{ sent: boolean; note?: string }> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.$queryRaw<
      { id: string; status: string; fulfillment: string; productId: string; sentToProviderAt: Date | null }[]
    >`SELECT id, status, fulfillment, productId, sentToProviderAt FROM \`Order\` WHERE id = ${orderId} FOR UPDATE`;
    const o = order[0];
    if (!o) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order tidak ditemukan.');
    if (o.status !== 'PAID') return { sent: false, note: `Status pembayaran ${o.status}; skip.` };
    if (o.fulfillment === 'SUCCESS') return { sent: false, note: 'Sudah sukses.' };

    if (o.sentToProviderAt) {
      // Sudah pernah dikirim — status belum diketahui. TIDAK mengirim ulang otomatis
      // untuk menghindari pesanan ganda. Tandai untuk rekonsiliasi manual/admin.
      if (o.fulfillment === 'PROCESSING' || o.fulfillment === 'UNKNOWN') {
        await tx.orderHistory.create({
          data: { orderId, field: 'fulfillment', toValue: 'RECONCILE_NEEDED', note: 'Status provider belum pasti; menunggu rekonsiliasi/callback.' },
        });
      }
      return { sent: false, note: 'Order sudah pernah dikirim ke provider; menunggu status.' };
    }

    const product = await tx.product.findUnique({ where: { id: o.productId }, include: { provider: true } });
    if (!product?.provider || !product.providerSku) {
      await tx.order.update({ where: { id: orderId }, data: { fulfillment: 'FAILED', failReason: 'Produk belum dipetakan ke provider.' } });
      return { sent: false, note: 'Produk belum dipetakan.' };
    }

    const successTx = await tx.providerTransaction.findFirst({ where: { orderId, status: 'SUCCESS' } });
    if (successTx) return { sent: false, note: 'Transaksi provider sudah sukses.' };

    await tx.order.update({ where: { id: orderId }, data: { fulfillment: 'PROCESSING', sentToProviderAt: new Date() } });
    return { sent: true };
  }, { timeout: 15000 }).then(async (res) => {
    if (!res.sent) return res;
    // Pengiriman ke provider di luar transaction DB (network call)
    try {
      const order = await prisma.order.findUnique({ where: { id: orderId }, include: { product: { include: { provider: true } } } });
      if (!order) return { sent: false };
      const provider = getProvider(order.product.provider!.code);
      let providerResult: { ok: boolean; pending?: boolean; providerRef?: string; sn?: string; raw: unknown };

      if (provider.code === 'SIMULATION') {
        providerResult = await (provider as import('../providers/base-provider').SimulationProvider).createOrder({
          sku: order.product.providerSku!,
          target: order.accountInput,
          refId: order.id,
        });
      } else if (provider.code === 'DIGIFLAZZ') {
        providerResult = await (provider as import('../providers/digiflazz.provider').DigiflazzProvider).createOrder({
          sku: order.product.providerSku!,
          customerNo: order.accountInput + (order.accountInput2 ? `;${order.accountInput2}` : ''),
          refId: order.id,
        });
      } else if (provider.code === 'SOSMEDMEDIA') {
        providerResult = await (provider as import('../providers/sosmedmedia.provider').SosmedmediaProvider).createOrder({
          sku: order.product.providerSku!,
          quantity: order.quantity,
          target: order.accountInput,
        });
      } else {
        throw new AppError(500, 'PROVIDER_UNHANDLED', 'Provider tidak mendukung createOrder.');
      }

      const status = providerResult.ok ? 'SUCCESS' : providerResult.pending ? 'PENDING' : 'FAILED';
      const ptr = await prisma.providerTransaction.create({
        data: {
          orderId,
          providerId: order.product.provider!.id,
          providerRef: providerResult.providerRef,
          requestPayload: JSON.stringify({ note: 'payload tersimpan di log (redacted)' }),
          responsePayload: JSON.stringify(providerResult.raw ?? {}),
          status: status as 'SUCCESS' | 'PENDING' | 'FAILED',
          priceCost: order.product.costPrice,
        },
      });
      await prisma.order.update({
        where: { id: orderId },
        data: {
          fulfillment: status === 'SUCCESS' ? 'SUCCESS' : status === 'PENDING' ? 'PROCESSING' : 'FAILED',
          providerOrderRef: providerResult.providerRef,
          failReason: status === 'FAILED' ? 'Provider menolak transaksi.' : undefined,
        },
      });
      await prisma.orderHistory.create({
        data: { orderId, field: 'fulfillment', toValue: status, note: `Provider ref: ${ptr.providerRef ?? '-'}${providerResult.sn ? ` SN: ${providerResult.sn}` : ''}` },
      });
      if (order.userId) {
        await prisma.notification.create({
          data: {
            userId: order.userId,
            title: status === 'SUCCESS' ? 'Pesanan Sukses' : status === 'FAILED' ? 'Pesanan Gagal' : 'Pesanan Diproses',
            body: `Order ${order.orderNo}: status ${status}.`,
          },
        });
      }
      return { sent: true };
    } catch (err) {
      // Gagal kirim: status UNKNOWN — tidak auto-retry kirim; menunggu rekonsiliasi.
      logger.error({ err, orderId }, 'Gagal mengirim order ke provider');
      await prisma.order.update({ where: { id: orderId }, data: { fulfillment: 'UNKNOWN' } });
      await prisma.orderHistory.create({ data: { orderId, field: 'fulfillment', toValue: 'UNKNOWN', note: 'Provider timeout/error; perlu rekonsiliasi.' } });
      return { sent: false, note: 'Provider error; fulfillment UNKNOWN.' };
    }
  });
}

/** Loop worker: ambil order PAID+QUEUED/PROCESSING, proses dengan backoff sederhana. */
export async function runWorkerLoop(pollMs = 5000) {
  logger.info('Order worker aktif (polling mode).');
  const failures = new Map<string, number>();
  for (; ;) {
    try {
      const orders = await prisma.order.findMany({
        where: { status: 'PAID', fulfillment: { in: ['QUEUED', 'PROCESSING'] } },
        take: 10,
        orderBy: { createdAt: 'asc' },
      });
      for (const o of orders) {
        try {
          await processOrderOnce(o.id);
          failures.delete(o.id);
        } catch (e) {
          const n = (failures.get(o.id) ?? 0) + 1;
          failures.set(o.id, n);
          const backoff = Math.min(60000, 1000 * 2 ** n);
          logger.warn({ orderId: o.id, attempt: n }, 'Retry order dengan backoff');
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
    } catch (e) {
      logger.error({ e }, 'Worker loop error');
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
}
