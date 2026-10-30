import { Prisma, OrderKind } from '@prisma/client';
import { prisma } from '../db';
import { AppError } from '../middleware/error';
import { applyWalletChange } from './wallet.service';

export interface OrderInput {
  kind: OrderKind;
  productId: string;
  quantity: number;
  accountInput: string;
  accountInput2?: string;
  contactEmail?: string;
  couponCode?: string;
  idempotencyKey?: string;
  payWithWallet?: boolean;
  userId?: string;
}

function generateOrderNo(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `NX-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

function generateGuestToken(): string {
  return require('crypto').randomBytes(24).toString('hex');
}

/** Buat order dengan harga dihitung ulang dari database (snapshot).
 * IdempotencyKey mencegah order ganda akibat double-click / retry.
 */
export async function createOrder(input: OrderInput) {
  if (input.idempotencyKey) {
    const existing = await prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) return existing;
  }

  const product = await prisma.product.findUnique({ where: { id: input.productId }, include: { category: true } });
  if (!product || !product.isActive) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Produk tidak tersedia.');

  if (product.type === 'SMM') {
    if (input.quantity < (product.minOrder ?? 1)) throw new AppError(400, 'MIN_ORDER', `Minimum order ${product.minOrder}.`);
    if (input.quantity > (product.maxOrder ?? 100000)) throw new AppError(400, 'MAX_ORDER', `Maksimum order ${product.maxOrder}.`);
    if (input.kind !== 'SMM') throw new AppError(400, 'KIND_MISMATCH', 'Jenis order tidak sesuai produk.');
  } else {
    if (input.kind !== 'TOPUP') throw new AppError(400, 'KIND_MISMATCH', 'Jenis order tidak sesuai produk.');
    if (product.requiresZoneId && !input.accountInput2) {
      throw new AppError(400, 'ZONE_REQUIRED', 'Zone ID wajib diisi untuk produk ini.');
    }
  }

  // Hitung ulang harga di server
  let priceBase = product.sellPrice * (product.type === 'SMM' ? 1 : 1);
  let quantity = product.type === 'SMM' ? input.quantity : 1;
  // SMM: harga per unit (per 1000 biasanya dikonversi di admin); di sini per unit
  if (product.type === 'SMM') priceBase = product.sellPrice; // per unit
  let priceTotal = priceBase * quantity;
  let priceDiscount = 0;
  let couponId: string | undefined;

  if (input.couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: input.couponCode } });
    if (!coupon || !coupon.isActive || coupon.used >= coupon.quota || (coupon.expiresAt && coupon.expiresAt < new Date()) || priceTotal < coupon.minSpend) {
      throw new AppError(400, 'COUPON_INVALID', 'Kode promo tidak valid atau kedaluwarsa.');
    }
    priceDiscount = coupon.type === 'PERCENT' ? Math.floor((priceTotal * coupon.value) / 100) : coupon.value;
    if (coupon.maxDiscount) priceDiscount = Math.min(priceDiscount, coupon.maxDiscount);
    priceDiscount = Math.min(priceDiscount, priceTotal);
    couponId = coupon.id;
    priceTotal -= priceDiscount;
  }

  const priceFee = 0; // biaya layanan (dapat diatur admin via Setting)

  const order = await prisma.$transaction(async (tx) => {
    if (input.couponCode) {
      await tx.coupon.update({ where: { id: couponId }, data: { used: { increment: 1 } } });
    }
    const created = await tx.order.create({
      data: {
        orderNo: generateOrderNo(),
        userId: input.userId,
        kind: input.kind,
        productId: product.id,
        quantity,
        priceBase: priceBase * quantity,
        priceFee,
        priceDiscount,
        priceTotal,
        couponId,
        accountInput: input.accountInput,
        accountInput2: input.accountInput2,
        contactEmail: input.contactEmail,
        guestToken: input.userId ? null : generateGuestToken(),
        idempotencyKey: input.idempotencyKey,
        items: {
          create: {
            productId: product.id,
            name: product.name,
            quantity,
            unitPrice: priceBase,
          },
        },
        target: {
          create: {
            userId: input.accountInput,
            zoneId: input.accountInput2 ?? null,
            contact: input.contactEmail ?? null,
          },
        },
      },
      include: { product: true, target: true },
    });
    return created;
  });

  // Bayar dengan saldo wallet (opsional)
  if (input.payWithWallet && input.userId) {
    await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string; status: string }[]>`
        SELECT id, status FROM \`Order\` WHERE id = ${order.id} FOR UPDATE`;
      if (!locked[0] || locked[0].status !== 'PENDING') throw new AppError(409, 'ORDER_NOT_PENDING', 'Order tidak dapat dibayar.');
      await applyWalletChange({
        userId: input.userId!,
        type: 'ORDER_PAYMENT',
        amount: order.priceTotal,
        referenceType: 'ORDER',
        referenceId: order.id,
        note: `Pembayaran order ${order.orderNo}`,
        tx,
      });
      await tx.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
      await tx.payment.create({
        data: {
          orderId: order.id,
          userId: input.userId,
          provider: 'WALLET',
          amount: order.priceTotal,
          status: 'PAID',
          paidAt: new Date(),
        },
      });
      await tx.orderHistory.create({
        data: { orderId: order.id, field: 'status', fromValue: 'PENDING', toValue: 'PAID', note: 'Dibayar dengan saldo wallet' },
      });
    });
    return prisma.order.findUnique({ where: { id: order.id }, include: { product: true } });
  }

  return order;
}
