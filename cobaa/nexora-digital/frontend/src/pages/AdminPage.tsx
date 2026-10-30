import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api, apiErrorMessage } from "../lib/api";
import {
  Section,
  StatusBadge,
  Skeleton,
  rupiah,
  Toast,
} from "../components/ui";
import { useAuth } from "../hooks/useAuth";

interface AdminOrder {
  id: string;
  orderNo: string;
  status: string;
  fulfillment: string;
  priceTotal: number;
  createdAt: string;
  failReason?: string;
  product: { name: string };
  history: {
    note?: string;
    toValue?: string;
    field: string;
    createdAt: string;
  }[];
}
interface Dash {
  totalTransactions: number;
  grossRevenue: number;
  providerCost: number;
  estimatedMargin: number;
  pending: number;
  successCount: number;
  failedCount: number;
  totalRefund: number;
  chart: { date: string; total: number; count: number }[];
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "orders" | "products">(
    "overview",
  );
  const [toast, setToast] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) navigate("/login");
  }, [user, loading, navigate]);

  const { data: dash } = useQuery({
    queryKey: ["admin-dash"],
    queryFn: async () => (await api.get("/admin/dashboard")).data as Dash,
    enabled: !!user && user.role === "ADMIN",
  });

  const { data: orders, refetch: refetchOrders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () =>
      (await api.get("/admin/orders")).data as { orders: AdminOrder[] },
    enabled: !!user && user.role === "ADMIN" && tab === "orders",
  });

  const { data: products, refetch: refetchProducts } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () =>
      (await api.get("/admin/products")).data as {
        products: {
          id: string;
          name: string;
          slug: string;
          sellPrice: number;
          isActive: boolean;
          providerSku?: string;
        }[];
      },
    enabled: !!user && user.role === "ADMIN" && tab === "products",
  });

  const sync = useMutation({
    mutationFn: async () => (await api.post("/admin/sync/digiflazz")).data,
    onSuccess: (r) => {
      setToast({ msg: `Sinkronisasi: ${JSON.stringify(r)}`, type: "success" });
      refetchProducts();
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });

  const toggleProduct = useMutation({
    mutationFn: async (p: { id: string; isActive: boolean }) =>
      (await api.patch(`/admin/products/${p.id}`, { isActive: !p.isActive }))
        .data,
    onSuccess: () => refetchProducts(),
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });

  const updatePrice = useMutation({
    mutationFn: async (p: { id: string; price: number }) =>
      (await api.patch(`/admin/products/${p.id}`, { sellPrice: p.price })).data,
    onSuccess: () => {
      setToast({ msg: "Harga diperbarui.", type: "success" });
      refetchProducts();
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });

  const recheck = useMutation({
    mutationFn: async (orderId: string) =>
      (await api.post(`/admin/orders/${orderId}/recheck`)).data,
    onSuccess: (r) => setToast({ msg: r.note, type: "success" }),
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });

  if (loading || !user || user.role !== "ADMIN")
    return (
      <Section title="Admin">
        <Skeleton />
      </Section>
    );

  const maxDaily = Math.max(1, ...(dash?.chart ?? []).map((c) => c.total));

  return (
    <Section
      title="Dashboard Admin"
      subtitle="Semua angka dihitung dari transaksi nyata di database."
    >
      {toast && <Toast message={toast.msg} type={toast.type} />}

      <div className="mb-6 flex gap-2">
        {(["overview", "orders", "products"] as const).map((t) => (
          <button
            key={t}
            className={`btn-ghost !py-2 text-xs capitalize ${tab === t ? "!border-neon/50 !text-white" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && dash && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { l: "Total Transaksi", v: dash.totalTransactions },
              { l: "Pendapatan Kotor", v: rupiah(dash.grossRevenue) },
              { l: "Biaya Provider", v: rupiah(dash.providerCost) },
              { l: "Estimasi Margin", v: rupiah(dash.estimatedMargin) },
              { l: "Pesanan Pending", v: dash.pending },
              { l: "Pesanan Sukses", v: dash.successCount },
              { l: "Pesanan Gagal", v: dash.failedCount },
              { l: "Total Refund", v: rupiah(dash.totalRefund) },
            ].map((s) => (
              <div key={s.l} className="glass-card p-5">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {s.l}
                </p>
                <p className="mt-1 text-xl font-bold text-white">{s.v}</p>
              </div>
            ))}
          </div>
          <div className="glass-card p-6">
            <p className="mb-4 text-sm font-semibold text-white">
              Penjualan 14 Hari (status PAID)
            </p>
            <div className="flex h-32 items-end gap-2">
              {dash.chart.length === 0 && (
                <p className="text-sm text-slate-500">Belum ada data.</p>
              )}
              {dash.chart.map((c) => (
                <div
                  key={c.date}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-neon-deep to-neon"
                    style={{
                      height: `${Math.max(4, (c.total / maxDaily) * 100)}%`,
                    }}
                    title={`${c.date}: ${rupiah(c.total)}`}
                  />
                  <span className="text-[10px] text-slate-500">
                    {new Date(c.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="glass-card divide-y divide-white/5">
          {(orders?.orders ?? []).map((o) => (
            <div key={o.id} className="space-y-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    {o.product.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {o.orderNo} ·{" "}
                    {new Date(o.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{rupiah(o.priceTotal)}</span>
                  <StatusBadge status={o.status} />
                  <StatusBadge status={o.fulfillment} />
                  <button
                    className="btn-ghost !py-1.5 text-xs"
                    onClick={() => recheck.mutate(o.id)}
                  >
                    Re-check
                  </button>
                </div>
              </div>
              {o.failReason && (
                <p className="text-xs text-rose-300">{o.failReason}</p>
              )}
              {o.history.length > 0 && (
                <p className="text-xs text-slate-500">
                  Terakhir:{" "}
                  {o.history[o.history.length - 1].note ??
                    `${o.history[o.history.length - 1].field} → ${o.history[o.history.length - 1].toValue ?? "-"}`}
                </p>
              )}
            </div>
          ))}
          {(orders?.orders ?? []).length === 0 && (
            <p className="p-6 text-sm text-slate-400">Belum ada pesanan.</p>
          )}
        </div>
      )}

      {tab === "products" && (
        <div className="space-y-4">
          <button
            className="btn-primary !py-2 text-xs"
            onClick={() => sync.mutate()}
            disabled={sync.isPending}
          >
            {sync.isPending
              ? "Menyinkronkan..."
              : "Sinkronkan Katalog Digiflazz"}
          </button>
          <div className="glass-card divide-y divide-white/5">
            {(products?.products ?? []).map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-slate-500">
                    {p.slug} · SKU: {p.providerSku ?? "-"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    className="input !w-28 !py-1.5 text-sm"
                    type="number"
                    defaultValue={p.sellPrice}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v !== p.sellPrice && v >= 0)
                        updatePrice.mutate({ id: p.id, price: v });
                    }}
                    aria-label="Harga jual"
                  />
                  <StatusBadge status={p.isActive ? "SUCCESS" : "FAILED"} />
                  <button
                    className="btn-ghost !py-1.5 text-xs"
                    onClick={() =>
                      toggleProduct.mutate({ id: p.id, isActive: p.isActive })
                    }
                  >
                    {p.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Perubahan harga & status dicatat di audit log dengan ID admin. Admin
            tidak dapat memaksa status pesanan menjadi SUCCESS.
          </p>
        </div>
      )}
    </Section>
  );
}
