import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import { StatusBadge } from "../../components/ui";

interface ProviderRow {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  priority: number;
  configured: boolean;
  _count: { products: number; transactions: number };
}

export default function AdminProviders() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-providers"],
    queryFn: async () =>
      (await api.get("/admin/providers")).data as { providers: ProviderRow[] },
  });
  const sync = useMutation({
    mutationFn: async () => (await api.post("/admin/sync/digiflazz")).data,
    onSuccess: (r) => {
      window.alert(`Sinkronisasi selesai: ${JSON.stringify(r)}`);
      qc.invalidateQueries();
    },
    onError: (e) => window.alert(apiErrorMessage(e)),
  });
  const patch = useMutation({
    mutationFn: async (p: { id: string; data: Record<string, unknown> }) =>
      (await api.patch(`/admin/providers/${p.id}`, p.data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-providers"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Provider</h1>
        <button
          className="btn-primary !py-2 text-xs"
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
        >
          {sync.isPending ? "Menyinkronkan..." : "Sinkronkan Katalog Digiflazz"}
        </button>
      </div>
      {isLoading ? (
        <div className="skeleton h-40" />
      ) : (
        <div className="glass-card divide-y divide-white/5">
          {(data?.providers ?? []).map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="text-sm font-medium text-white">
                  {p.name}{" "}
                  <span className="text-xs text-slate-500">({p.code})</span>
                </p>
                <p className="text-xs text-slate-500">
                  {p._count.products} produk · {p._count.transactions} transaksi
                  · prioritas {p.priority}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={p.configured ? "SUCCESS" : "UNKNOWN"} />
                <span className="text-xs text-slate-500">
                  {p.configured
                    ? "kredensial terpasang"
                    : "kredensial belum diisi (.env)"}
                </span>
                <StatusBadge status={p.isActive ? "SUCCESS" : "FAILED"} />
                <button
                  className="btn-ghost !py-1.5 text-xs"
                  onClick={() =>
                    patch.mutate({ id: p.id, data: { isActive: !p.isActive } })
                  }
                >
                  {p.isActive ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <label className="flex items-center gap-1 text-xs text-slate-400">
                  Prioritas
                  <input
                    className="input !w-16 !py-1 text-xs"
                    type="number"
                    defaultValue={p.priority}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v !== p.priority)
                        patch.mutate({ id: p.id, data: { priority: v } });
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-500">
        Provider dengan transaksi berstatus tidak pasti tidak di-failover
        otomatis ke provider lain — ini mencegah pesanan ganda. Rekonsiliasi
        dilakukan manual lewat menu Pesanan.
      </p>
    </div>
  );
}
