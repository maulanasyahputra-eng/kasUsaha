import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { StatusBadge, rupiah } from "../../components/ui";

interface PaymentRow {
  id: string;
  provider: string;
  externalId?: string | null;
  amount: number;
  status: string;
  paidAt?: string | null;
  createdAt: string;
  order?: { orderNo: string } | null;
}

export default function AdminPayments() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments", page],
    queryFn: async () =>
      (await api.get("/admin/payments", { params: { page } })).data as {
        payments: PaymentRow[];
        pagination: { totalPages: number };
      },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Pembayaran</h1>
      {isLoading ? (
        <div className="skeleton h-64" />
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="p-3">Waktu</th>
                <th className="p-3">Order</th>
                <th className="p-3">Provider</th>
                <th className="p-3">External ID</th>
                <th className="p-3 text-right">Nominal</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(data?.payments ?? []).map((p) => (
                <tr key={p.id}>
                  <td className="p-3 text-slate-400">
                    {new Date(p.createdAt).toLocaleString("id-ID")}
                  </td>
                  <td className="p-3">{p.order?.orderNo ?? "-"}</td>
                  <td className="p-3">{p.provider}</td>
                  <td className="max-w-40 truncate p-3 text-xs text-slate-500">
                    {p.externalId ?? "-"}
                  </td>
                  <td className="p-3 text-right">{rupiah(p.amount)}</td>
                  <td className="p-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(data?.payments ?? []).length === 0 && (
            <p className="p-6 text-center text-sm text-slate-400">
              Belum ada pembayaran.
            </p>
          )}
        </div>
      )}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            className="btn-ghost !py-2 text-xs"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Sebelumnya
          </button>
          <span className="px-2 py-2 text-sm text-slate-400">
            Hal {page}/{data.pagination.totalPages}
          </span>
          <button
            className="btn-ghost !py-2 text-xs"
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Berikutnya
          </button>
        </div>
      )}
    </div>
  );
}
