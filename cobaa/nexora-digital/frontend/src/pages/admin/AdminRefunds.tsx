import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import { StatusBadge, rupiah, Toast } from "../../components/ui";
import { RotateCcw } from "lucide-react";

interface RefundRow {
  id: string;
  amount: number;
  reason?: string | null;
  status: string;
  createdAt: string;
  order: { orderNo: string; priceTotal: number };
}
interface FailedOrder {
  id: string;
  orderNo: string;
  priceTotal: number;
  fulfillment: string;
  status: string;
  product: { name: string };
  user?: { email: string } | null;
}

export default function AdminRefunds() {
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-refunds"],
    queryFn: async () =>
      (await api.get("/admin/refunds")).data as { refunds: RefundRow[] },
  });
  const { data: failed } = useQuery({
    queryKey: ["admin-failed-orders"],
    queryFn: async () =>
      (
        await api.get("/admin/orders", {
          params: { status: "PAID", fulfillment: "FAILED" },
        })
      ).data as { orders: FailedOrder[] },
  });

  const refund = useMutation({
    mutationFn: async () =>
      (await api.post("/admin/refunds", { orderId, reason })).data,
    onSuccess: () => {
      setToast({
        msg: "Refund berhasil — saldo customer bertambah via ledger.",
        type: "success",
      });
      setOrderId("");
      setReason("");
      qc.invalidateQueries();
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });

  const candidate = failed?.orders.find((o) => o.id === orderId);

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-bold text-white">
        <RotateCcw className="h-5 w-5 text-neon" />
        Refund
      </h1>
      {toast && <Toast message={toast.msg} type={toast.type} />}

      <div className="glass-card space-y-3 p-5">
        <p className="text-sm font-semibold text-white">Proses Refund Manual</p>
        <p className="text-xs text-slate-500">
          Hanya order <b>PAID + fulfillment FAILED</b> dengan customer terdaftar
          yang dapat direfund. Refund masuk ke saldo wallet customer lewat
          ledger (tercatat balance before/after) + audit log. Refund ke
          kartu/e-wallet via Midtrans API belum terpasang — lakukan dari
          dashboard Midtrans bila perlu.
        </p>
        <select
          className="input"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        >
          <option value="">— pilih order gagal —</option>
          {(failed?.orders ?? []).map((o) => (
            <option key={o.id} value={o.id}>
              {o.orderNo} — {o.product.name} — {rupiah(o.priceTotal)}{" "}
              {o.user
                ? `(${o.user.email})`
                : "(guest, tidak bisa refund wallet)"}
            </option>
          ))}
        </select>
        <input
          className="input"
          placeholder="Alasan refund (min. 3 karakter)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button
          className="btn-primary !py-2 text-xs"
          disabled={!orderId || reason.length < 3 || refund.isPending}
          onClick={() => {
            if (confirm("Proses refund ini?")) refund.mutate();
          }}
        >
          {refund.isPending ? "Memproses..." : "Proses Refund"}
        </button>
        {candidate && candidate.user === null && (
          <p className="text-xs text-rose-300">
            Order guest tidak dapat direfund ke wallet — hubungi customer via
            support.
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="skeleton h-40" />
      ) : (
        <div className="glass-card divide-y divide-white/5">
          {(data?.refunds ?? []).map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between p-4 text-sm"
            >
              <div>
                <p className="text-white">{r.order.orderNo}</p>
                <p className="text-xs text-slate-500">
                  {r.reason} · {new Date(r.createdAt).toLocaleString("id-ID")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-fuchsia-300">{rupiah(r.amount)}</span>
                <StatusBadge status={r.status} />
              </div>
            </div>
          ))}
          {(data?.refunds ?? []).length === 0 && (
            <p className="p-6 text-sm text-slate-400">Belum ada refund.</p>
          )}
        </div>
      )}
    </div>
  );
}
