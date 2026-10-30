import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { StatusBadge, rupiah } from "../../components/ui";

interface DepositRow {
  id: string;
  amount: number;
  status: string;
  paymentRef?: string | null;
  createdAt: string;
  paidAt?: string | null;
  user: { email: string; name: string };
}

export default function AdminDeposits() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-deposits"],
    queryFn: async () =>
      (await api.get("/admin/deposits")).data as { deposits: DepositRow[] },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Deposit Saldo</h1>
      <p className="text-xs text-slate-500">
        Saldo hanya bertambah setelah pembayaran terverifikasi webhook. Daftar
        ini read-only untuk audit.
      </p>
      {isLoading ? (
        <div className="skeleton h-64" />
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="p-3">Waktu</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Ref</th>
                <th className="p-3 text-right">Nominal</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(data?.deposits ?? []).map((d) => (
                <tr key={d.id}>
                  <td className="p-3 text-slate-400">
                    {new Date(d.createdAt).toLocaleString("id-ID")}
                  </td>
                  <td className="p-3">
                    {d.user.name}{" "}
                    <span className="text-xs text-slate-500">
                      ({d.user.email})
                    </span>
                  </td>
                  <td className="p-3 text-xs text-slate-500">
                    {d.paymentRef ?? "-"}
                  </td>
                  <td className="p-3 text-right">{rupiah(d.amount)}</td>
                  <td className="p-3">
                    <StatusBadge status={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(data?.deposits ?? []).length === 0 && (
            <p className="p-6 text-center text-sm text-slate-400">
              Belum ada deposit.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
