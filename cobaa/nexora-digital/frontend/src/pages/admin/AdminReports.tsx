import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { rupiah } from "../../components/ui";
import { Download } from "lucide-react";

interface Dash {
  totalTransactions: number;
  grossRevenue: number;
  providerCost: number;
  estimatedMargin: number;
  totalRefund: number;
  depositTotal: number;
  topProducts: { name: string; count: number; total: number }[];
  byCategory: { name: string; count: number; total: number }[];
  chart: { date: string; total: number; count: number }[];
}

export default function AdminReports() {
  const { data: dash } = useQuery({
    queryKey: ["admin-dash"],
    queryFn: async () => (await api.get("/admin/dashboard")).data as Dash,
  });

  const exportCsv = () => {
    if (!dash) return;
    const rows = [
      ["Periode", "Tanggal", "Transaksi PAID", "Total (Rp)"],
      ...dash.chart.map((c) => [
        "14 hari terakhir",
        new Date(c.date).toLocaleDateString("id-ID"),
        c.count,
        c.total,
      ]),
      [],
      ["Ringkasan"],
      ["Total transaksi PAID", dash.totalTransactions],
      ["Pendapatan kotor", dash.grossRevenue],
      ["Biaya provider", dash.providerCost],
      ["Estimasi margin", dash.estimatedMargin],
      ["Total refund", dash.totalRefund],
      ["Total deposit masuk", dash.depositTotal],
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c ?? "")}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `laporan-nexora-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (!dash) return <div className="skeleton h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Laporan</h1>
        <button className="btn-primary !py-2 text-xs" onClick={exportCsv}>
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>
      <div className="glass-card p-5">
        <p className="mb-3 text-sm font-semibold text-white">
          Ringkasan Keuangan (data nyata dari database)
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Total transaksi PAID", dash.totalTransactions],
            ["Pendapatan kotor", rupiah(dash.grossRevenue)],
            ["Biaya provider", rupiah(dash.providerCost)],
            ["Estimasi margin", rupiah(dash.estimatedMargin)],
            ["Total refund", rupiah(dash.totalRefund)],
            ["Total deposit masuk", rupiah(dash.depositTotal)],
          ].map(([l, v]) => (
            <div
              key={l as string}
              className="rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <p className="text-xs text-slate-500">{l}</p>
              <p className="text-lg font-bold text-white">{v}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card p-5">
        <p className="mb-3 text-sm font-semibold text-white">Rincian Harian</p>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="pb-2">Tanggal</th>
              <th className="pb-2">Transaksi</th>
              <th className="pb-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {dash.chart.map((c) => (
              <tr key={c.date}>
                <td className="py-2 text-slate-300">
                  {new Date(c.date).toLocaleDateString("id-ID")}
                </td>
                <td className="py-2 text-slate-400">{c.count}</td>
                <td className="py-2 text-right text-slate-300">
                  {rupiah(c.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {dash.chart.length === 0 && (
          <p className="text-sm text-slate-500">Belum ada transaksi PAID.</p>
        )}
      </div>
    </div>
  );
}
