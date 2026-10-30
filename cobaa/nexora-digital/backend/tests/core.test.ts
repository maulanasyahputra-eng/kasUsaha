import { createOrder } from '../src/services/order.service';
import { processOrderOnce } from '../src/services/order-worker';
import { applyWalletChange } from '../src/services/wallet.service';
import { markOrderPaid } from '../src/services/payment.service';
import { DigiflazzProvider } from '../src/providers/digiflazz.provider';
import { seedTestFixtures, cleanupTest, closeDb, prisma } from './helpers';
import { MockSuccessProvider, MockFailProvider, MockTimeoutProvider } from './mock-provider';

jest.setTimeout(30000);

let ctx: Awaited<ReturnType<typeof seedTestFixtures>>;

beforeAll(async () => { ctx = await seedTestFixtures(); });
afterAll(async () => { await cleanupTest(); await closeDb(); });

describe('Order & harga', () => {
  it('menghitung ulang harga dari DB (tidak percaya frontend)', async () => {
    const order = await createOrder({
      kind: 'TOPUP', productId: ctx.product.id, quantity: 1,
      accountInput: '12345', userId: ctx.customer.id,
    }) as { id: string; priceTotal: number; priceBase: number };
    expect(order!.priceTotal).toBe(10000);
    expect(order!.priceBase).toBe(10000);
  });

  it('menolak produk nonaktif', async () => {
    await prisma.product.update({ where: { id: ctx.product.id }, data: { isActive: false } });
    await expect(createOrder({
      kind: 'TOPUP', productId: ctx.product.id, quantity: 1, accountInput: '123',
    })).rejects.toThrow();
    await prisma.product.update({ where: { id: ctx.product.id }, data: { isActive: true } });
  });

  it('idempotencyKey mencegah order ganda', async () => {
    const key = `test-key-${Date.now()}`;
    const o1 = await createOrder({ kind: 'TOPUP', productId: ctx.product.id, quantity: 1, accountInput: '1', idempotencyKey: key }) as { id: string };
    const o2 = await createOrder({ kind: 'TOPUP', productId: ctx.product.id, quantity: 1, accountInput: '1', idempotencyKey: key }) as { id: string };
    expect(o1!.id).toBe(o2!.id);
  });
});

describe('Wallet ledger', () => {
  it('deposit masuk hanya sekali meski applyWalletChange dipanggil ulang (idempotent)', async () => {
    const ref = `dep-${Date.now()}-${Math.random()}`;
    const r1 = await applyWalletChange({ userId: ctx.customer.id, type: 'DEPOSIT', amount: 50000, referenceType: 'DEPOSIT', referenceId: ref });
    const r2 = await applyWalletChange({ userId: ctx.customer.id, type: 'DEPOSIT', amount: 50000, referenceType: 'DEPOSIT', referenceId: ref });
    // idempotent: saldo setelah panggilan kedua == saldo setelah panggilan pertama (tidak bertambah lagi)
    expect(r2.balanceAfter).toBe(r1.balanceAfter);
    expect(BigInt(r2.balanceAfter) - BigInt(r1.balanceBefore)).toBe(50000n);
  });

  it('saldo tidak bisa negatif pada transaksi bersamaan', async () => {
    const email = `race-${Date.now()}@nexora.test`;
    const u = await prisma.user.create({
      data: { email, name: 'Race', passwordHash: 'x', wallet: { create: { balance: 30000 } } },
    });
    const results = await Promise.allSettled([
      applyWalletChange({ userId: u.id, type: 'ORDER_PAYMENT', amount: 30000, referenceType: 'ORDER', referenceId: `o1-${u.id}` }),
      applyWalletChange({ userId: u.id, type: 'ORDER_PAYMENT', amount: 30000, referenceType: 'ORDER', referenceId: `o2-${u.id}` }),
    ]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    await prisma.walletLedger.deleteMany({ where: { wallet: { userId: u.id } } });
    await prisma.wallet.delete({ where: { userId: u.id } });
    await prisma.user.delete({ where: { id: u.id } });
  });
});

describe('Order processing', () => {
  it('skip jika pembayaran belum PAID', async () => {
    const order = await createOrder({ kind: 'TOPUP', productId: ctx.product.id, quantity: 1, accountInput: '999', userId: ctx.customer.id }) as { id: string };
    const res = await processOrderOnce(order!.id);
    expect(res.sent).toBe(false);
  });

  it('idempotent: order yang sudah dikirim tidak dikirim ulang', async () => {
    const order = await createOrder({ kind: 'TOPUP', productId: ctx.product.id, quantity: 1, accountInput: '999', userId: ctx.customer.id }) as { id: string };
    await prisma.order.update({ where: { id: order!.id }, data: { status: 'PAID', sentToProviderAt: new Date(), fulfillment: 'PROCESSING' } });
    const res = await processOrderOnce(order!.id);
    expect(res.sent).toBe(false);
  });
});

describe('markOrderPaid (webhook core)', () => {
  it('menolak nominal mismatch', async () => {
    const order = await createOrder({ kind: 'TOPUP', productId: ctx.product.id, quantity: 1, accountInput: '555', userId: ctx.customer.id });
    if (!order) throw new Error('order gagal dibuat');
    const pay = await prisma.payment.create({
      data: { orderId: order.id, userId: ctx.customer.id, externalId: `${order.orderNo}-x1`, amount: order.priceTotal },
    });
    await expect(markOrderPaid(pay.externalId!, { provider: 'MIDTRANS', amount: 999 }))
      .rejects.toThrow();
  });

  it('pembayaran duplikat tidak memproses dua kali', async () => {
    const order = await createOrder({ kind: 'TOPUP', productId: ctx.product.id, quantity: 1, accountInput: '556', userId: ctx.customer.id });
    if (!order) throw new Error('order gagal dibuat');
    const pay = await prisma.payment.create({
      data: { orderId: order.id, userId: ctx.customer.id, externalId: `${order.orderNo}-x2`, amount: order.priceTotal },
    });
    const r1 = await markOrderPaid(pay.externalId!, { provider: 'MIDTRANS', amount: order.priceTotal });
    const r2 = await markOrderPaid(pay.externalId!, { provider: 'MIDTRANS', amount: order.priceTotal });
    expect(r1.duplicate).toBe(false);
    expect(r2.duplicate).toBe(true);
  });
});

describe('Digiflazz signature', () => {
  it('callback sign valid diterima, invalid ditolak', () => {
    const df = new DigiflazzProvider({ baseUrl: 'https://x', apiKey: 'key', username: 'user' });
    const crypto = require('crypto');
    const ref = 'ref1';
    const sign = crypto.createHash('sha256').update('user' + 'key' + ref + 'Sukses').digest('hex');
    expect(df.verifyCallbackSign(ref, 'Sukses', sign)).toBe(true);
    expect(df.verifyCallbackSign(ref, 'Sukses', 'bogus')).toBe(false);
  });
});

describe('Mock providers', () => {
  it('success provider mengembalikan ref', async () => {
    const r = await new MockSuccessProvider().createOrder({});
    expect(r.ok).toBe(true);
    expect(r.providerRef).toBe('MOCK-REF-1');
  });
  it('fail provider tidak ok', async () => {
    expect((await new MockFailProvider().createOrder({})).ok).toBe(false);
  });
  it('timeout provider melempar error', async () => {
    await expect(new MockTimeoutProvider().createOrder()).rejects.toThrow('ETIMEDOUT');
  });
});
