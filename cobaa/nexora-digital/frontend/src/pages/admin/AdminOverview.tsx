import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { rupiah, StatusBadge } from "../../components/ui";
import { Link } from "react-router-dom";

interface Dash {
  totalTransactions: number;
  grossRevenue: number;
  providerCost: number;
  estimatedMargin: number;
  pending: number;
  successCount: number;
  failedCount: number;
  totalRefund: number;
  refundCount: number;
  customers: number;
  depositTotal: number;
  depositCount: number;
  activeProducts: number;
  chart: { date: string; total: number; count: number }[];
  topProducts: { name: string; count: number; total: number }[];
  topCustomers: { name: string; email: string; count: number; total: number }[];
  byCategory: { name: string; count: number; total: number }[];
  recentOrders: { id: string; orderNo: string; status: string; fulfillment: string; priceTotal: number; createdAt: string; product: { name: string } }[];
  providerHealth: { code: string; name: string; isActive: boolean; connStatus: string; lastConnectedAt: string | null }[];
}

export default function AdminOverview() {
  const { data: dash } = useQuery({
    queryKey: ["admin-dash"],
    queryFn: async () => (await api.get("/admin/dashboard")).data as Dash,
    refetchInterval: 30000,
  });

  if (!dash) return <div className="skeleton h-96" />;

  const maxDaily = Math.max(1, ...dash.chart.map((c) => c.total));
  const stat = (l: string, v: string | number, accent = "text-white") => (
    <div className="glass-card p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{l}</p>
      <p className={`mt-1 text-xl font-bold ${accent}`}>{v}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stat("Total Transaksi (PAID)", dash.totalTransactions)}
        {stat("Pendapatan Kotor", rupiah(dash.grossRevenue), "text-neon")}
        {stat("Biaya Provider", rupiah(dash.providerCost), "text-rose-300")}
        {stat(
          "Estimasi Margin",
          rupiah(dash.estimatedMargin),
          dash.estimatedMargin >= 0 ? "text-emerald-300" : "text-rose-300",
        )}
        {stat(
          "Pesanan Pending",
          dash.pending,
          dash.pending > 0 ? "text-amber-300" : "text-white",
        )}
        {stat("Pesanan Sukses", dash.successCount, "text-emerald-300")}
        {stat(
          "Pesanan Gagal",
          dash.failedCount,
          dash.failedCount > 0 ? "text-rose-300" : "text-white",
        )}
        {stat(
          "Total Refund",
          `${rupiah(dash.totalRefund)} (${dash.refundCount})`,
          "text-fuchsia-300",
        )}
        {stat("Customer Terdaftar", dash.customers)}
        {stat("Produk Aktif", dash.activeProducts)}
        {stat("Deposit Masuk", rupiah(dash.depositTotal), "text-cyan-300")}
        {stat("Jumlah Deposit", dash.depositCount)}
      </div>

      <div className="glass-card p-6">
        <p className="mb-4 text-sm font-semibold text-white">
          Penjualan 14 Hari (status PAID)
        </p>
        <div className="flex h-36 items-end gap-2">
          {dash.chart.length === 0 && (
            <p className="text-sm text-slate-500">Belum ada data.</p>
          )}
          {dash.chart.map((c) => (
            <div
              key={c.date}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div
                className="w-full rounded-t bg-gradient-to-t from-neon to-neon transition-all"
                style={{
                  height: `${Math.max(4, (c.total / maxDaily) * 100)}%`,
                }}
                title={`${new Date(c.date).toLocaleDateString("id-ID")}: ${rupiah(c.total)} (${c.count} order)`}
              />
              <span className="text-[10px] text-slate-500">
                {new Date(c.date).getDate()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent orders + provider health */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card divide-y divide-white/5">
          <p className="p-5 pb-3 text-sm font-semibold text-white">Pesanan Terbaru</p>
          {(dash.recentOrders ?? []).length === 0 && <p className="p-5 text-sm text-zinc-500">Belum ada pesanan.</p>}
          {(dash.recentOrders ?? []).map((o) => (
            <Link key={o.id} to={`/admin/orders`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition hover:bg-white/[0.04]">
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{o.product.name}</p>
                <p className="text-xs text-zinc-500">{o.orderNo} · {new Date(o.createdAt).toLocaleString("id-ID")}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span>{rupiah(o.priceTotal)}</span>
                <StatusBadge status={o.status} />
              </div>
            </Link>
          ))}
        </div>
        <div className="glass-card divide-y divide-white/5">
          <p className="p-5 pb-3 text-sm font-semibold text-white">Status Provider</p>
          {(dash.providerHealth ?? []).map((p) => (
            <div key={p.code} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <span className="text-zinc-300">{p.name}</span>
              <div className="flex items-center gap-2">
                <StatusBadge status={p.connStatus === "CONNECTED" ? "SUCCESS" : p.connStatus === "CONNECTION_FAILED" ? "FAILED" : "UNKNOWN"} />
                {p.lastConnectedAt && <span className="text-xs text-zinc-600">{new Date(p.lastConnectedAt).toLocaleString("id-ID")}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-card p-5">
          <p className="mb-3 text-sm font-semibold text-white">
            Produk Terlaris
          </p>
          {dash.topProducts.length === 0 ? (
            <p className="text-sm text-slate-500">-</p>
          ) : (
            dash.topProducts.map((p, i) => (
              <div
                key={i}
                className="flex justify-between border-b border-white/5 py-2 text-sm last:border-0"
              >
                <span className="truncate text-slate-300">{p.name}</span>
                <span className="shrink-0 text-slate-400">
                  {p.count}× · {rupiah(p.total)}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="glass-card p-5">
          <p className="mb-3 text-sm font-semibold text-white">
            Customer Teratas
          </p>
          {dash.topCustomers.length === 0 ? (
            <p className="text-sm text-slate-500">-</p>
          ) : (
            dash.topCustomers.map((c, i) => (
              <div
                key={i}
                className="border-b border-white/5 py-2 text-sm last:border-0"
              >
                <div className="flex justify-between">
                  <span className="text-slate-300">{c.name}</span>
                  <span className="text-slate-400">{rupiah(c.total)}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {c.email} · {c.count} order
                </p>
              </div>
            ))
          )}
        </div>
        <div className="glass-card p-5">
          <p className="mb-3 text-sm font-semibold text-white">
            Penjualan per Kategori
          </p>
          {dash.byCategory.length === 0 ? (
            <p className="text-sm text-slate-500">-</p>
          ) : (
            dash.byCategory.map((c, i) => (
              <div
                key={i}
                className="flex justify-between border-b border-white/5 py-2 text-sm last:border-0"
              >
                <span className="text-slate-300">{c.name}</span>
                <span className="text-slate-400">
                  {c.count}× · {rupiah(c.total)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
