import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api, apiErrorMessage } from "../lib/api";
import { Section, Skeleton, rupiah, Toast } from "../components/ui";
import { useAuth } from "../hooks/useAuth";

interface LedgerRow {
  id: string;
  type: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  referenceType?: string;
  note?: string;
  createdAt: string;
}

declare global {
  interface Window {
    snap?: any;
  }
}

export default function WalletPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(50000);
  const [toast, setToast] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);
  const [page, setPage] = useState(1);

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () =>
      (await api.get("/account/wallet")).data.wallet as { balance: string },
    enabled: !!user,
  });

  const { data: ledger, isLoading } = useQuery({
    queryKey: ["ledger", page],
    queryFn: async () =>
      (await api.get("/account/wallet/ledger", { params: { page } })).data as {
        ledger: LedgerRow[];
        pagination: { totalPages: number };
      },
    enabled: !!user,
  });

  const deposit = useMutation({
    mutationFn: async () =>
      (await api.post("/payments/deposit", { amount })).data.deposit,
    onSuccess: (dep: { snapToken: string; redirectUrl: string }) => {
      // Pembayaran deposit melalui Midtrans Snap; saldo hanya masuk setelah webhook terverifikasi.
      if (window.snap) {
        window.snap.pay(dep.snapToken, {
          onPending: () =>
            setToast({
              msg: "Deposit pending — saldo masuk setelah pembayaran terverifikasi.",
              type: "success",
            }),
          onSuccess: () =>
            setToast({
              msg: "Pembayaran diterima; menunggu verifikasi webhook.",
              type: "success",
            }),
          onError: () => setToast({ msg: "Pembayaran gagal.", type: "error" }),
        });
      } else {
        window.open(dep.redirectUrl, "_blank");
      }
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });

  if (loading || !user)
    return (
      <Section title="Saldo">
        <Skeleton />
      </Section>
    );

  return (
    <Section
      title="Saldo & Deposit"
      subtitle="Ledger saldo immutable: setiap perubahan tercatat dengan saldo sebelum/sesudah."
    >
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="glass-card p-6">
          <p className="text-sm text-slate-400">Saldo tersedia</p>
          <p className="mt-1 text-3xl font-bold text-neon">
            {rupiah(wallet?.balance ?? 0)}
          </p>
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm text-slate-300">
                Nominal deposit (Rp10.000 – Rp10.000.000)
              </label>
              <input
                className="input"
                type="number"
                min={10000}
                max={10000000}
                step={10000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <button
              className="btn-primary"
              disabled={deposit.isPending}
              onClick={() => deposit.mutate()}
            >
              {deposit.isPending
                ? "Menyiapkan..."
                : "Deposit via Payment Gateway"}
            </button>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="p-3">Waktu</th>
                <th className="p-3">Jenis</th>
                <th className="p-3 text-right">Nominal</th>
                <th className="p-3 text-right">Saldo akhir</th>
                <th className="p-3">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(ledger?.ledger ?? []).map((l) => (
                <tr key={l.id}>
                  <td className="p-3 text-slate-400">
                    {new Date(l.createdAt).toLocaleString("id-ID")}
                  </td>
                  <td className="p-3">{l.type}</td>
                  <td
                    className={`p-3 text-right ${l.type === "DEPOSIT" || l.type === "REFUND" ? "text-emerald-300" : "text-rose-300"}`}
                  >
                    {l.type === "DEPOSIT" || l.type === "REFUND" ? "+" : "-"}
                    {rupiah(l.amount)}
                  </td>
                  <td className="p-3 text-right">{rupiah(l.balanceAfter)}</td>
                  <td className="p-3 text-xs text-slate-500">{l.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading && <div className="skeleton m-4 h-24" />}
          {(ledger?.ledger ?? []).length === 0 && !isLoading && (
            <p className="p-6 text-center text-sm text-slate-400">
              Belum ada transaksi saldo.
            </p>
          )}
        </div>
        {ledger && ledger.pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button
              className="btn-ghost !py-2 text-xs"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Sebelumnya
            </button>
            <span className="px-2 py-2 text-sm text-slate-400">
              Hal {page}/{ledger.pagination.totalPages}
            </span>
            <button
              className="btn-ghost !py-2 text-xs"
              disabled={page >= ledger.pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Berikutnya
            </button>
          </div>
        )}
      </div>
    </Section>
  );
}
