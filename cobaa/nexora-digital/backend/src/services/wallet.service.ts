import { WalletLedgerType, Prisma } from '@prisma/client';
import { prisma } from '../db';
import { AppError } from '../middleware/error';

/**
 * Ledger saldo immutable. Semua perubahan saldo HARUS lewat sini.
 * - Menggunakan transaction + row lock (SELECT ... FOR UPDATE) agar saldo
 *   tidak bisa negatif saat transaksi bersamaan.
 * - Idempotent: jika `referenceId` sudah pernah dicatat untuk type+reference,
 *   tidak ada entri kedua (melindungi dari webhook duplikat).
 */
export async function applyWalletChange(opts: {
  userId: string;
  type: WalletLedgerType;
  amount: number; // selalu positif; arah ditentukan type
  referenceType: string;
  referenceId: string;
  note?: string;
  tx?: Prisma.TransactionClient;
}): Promise<{ balanceBefore: bigint; balanceAfter: bigint }> {
  const run = async (tx: Prisma.TransactionClient) => {
    // Idempotency guard
    const existing = await tx.walletLedger.findFirst({
      where: { type: opts.type, referenceType: opts.referenceType, referenceId: opts.referenceId, status: 'ENTRY' },
    });
    if (existing) {
      return { balanceBefore: existing.balanceBefore, balanceAfter: existing.balanceAfter };
    }

    const wallet = await tx.$queryRaw<{ id: string; balance: bigint }[]>`
      SELECT id, balance FROM Wallet WHERE userId = ${opts.userId} FOR UPDATE`;
    if (!wallet[0]) throw new AppError(404, 'WALLET_NOT_FOUND', 'Wallet tidak ditemukan.');

    const before = BigInt(wallet[0].balance);
    const delta = BigInt(opts.amount);
    const after = opts.type === 'DEPOSIT' || opts.type === 'REFUND' ? before + delta : before - delta;
    if (after < 0n) throw new AppError(409, 'INSUFFICIENT_BALANCE', 'Saldo tidak mencukupi.');

    await tx.wallet.update({ where: { id: wallet[0].id }, data: { balance: after } });
    await tx.walletLedger.create({
      data: {
        walletId: wallet[0].id,
        type: opts.type,
        amount: delta,
        balanceBefore: before,
        balanceAfter: after,
        referenceType: opts.referenceType,
        referenceId: opts.referenceId,
        note: opts.note,
      },
    });
    return { balanceBefore: before, balanceAfter: after };
  };

  if (opts.tx) return run(opts.tx);
  return prisma.$transaction(run, { timeout: 15000 });
}
