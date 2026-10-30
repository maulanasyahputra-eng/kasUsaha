import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import { StatusBadge, rupiah, Toast } from "../../components/ui";
import { Plus, Search, Trash2 } from "lucide-react";

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  type: string;
  sellPrice: number;
  costPrice: number;
  isActive: boolean;
  providerSku?: string | null;
  requiresZoneId: boolean;
  sortOrder: number;
  description?: string | null;
  minOrder?: number | null;
  maxOrder?: number | null;
  avgTime?: string | null;
  category: { id: string; name: string };
  provider?: { code: string } | null;
}
interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  type: string;
}
interface ProviderRow {
  id: string;
  code: string;
  name: string;
}

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    type: "TOPUP",
    categoryId: "",
    providerSku: "",
    sellPrice: 10000,
    costPrice: 9000,
    requiresZoneId: false,
    description: "",
    minOrder: "",
    maxOrder: "",
  });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", search],
    queryFn: async () =>
      (await api.get("/admin/products", { params: { search } })).data as {
        products: ProductRow[];
      },
  });
  const { data: cats } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () =>
      (await api.get("/admin/categories")).data as {
        categories: CategoryRow[];
      },
  });
  const { data: provs } = useQuery({
    queryKey: ["admin-providers"],
    queryFn: async () =>
      (await api.get("/admin/providers")).data as { providers: ProviderRow[] },
  });

  const patch = useMutation({
    mutationFn: async (p: { id: string; data: Record<string, unknown> }) =>
      (await api.patch(`/admin/products/${p.id}`, p.data)).data,
    onSuccess: () => {
      setToast({ msg: "Produk diperbarui.", type: "success" });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) =>
      (await api.delete(`/admin/products/${id}`)).data,
    onSuccess: (r) => {
      setToast({ msg: r.note ?? "Produk dihapus.", type: "success" });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });
  const create = useMutation({
    mutationFn: async () =>
      (
        await api.post("/admin/products", {
          ...form,
          slug:
            form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          sellPrice: Number(form.sellPrice),
          costPrice: Number(form.costPrice),
          minOrder: form.minOrder ? Number(form.minOrder) : null,
          maxOrder: form.maxOrder ? Number(form.maxOrder) : null,
        })
      ).data,
    onSuccess: () => {
      setToast({ msg: "Produk dibuat.", type: "success" });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">
          Produk {data ? `(${data.products.length})` : ""}
        </h1>
        <button
          className="btn-primary !py-2 text-xs"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-4 w-4" />
          Produk Baru
        </button>
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {showForm && (
        <div className="glass-card grid gap-3 p-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Nama *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Slug (opsional)
            </label>
            <input
              className="input"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Tipe *</label>
            <select
              className="input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="TOPUP">TOPUP</option>
              <option value="SMM">SMM</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Kategori *
            </label>
            <select
              className="input"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">— pilih —</option>
              {(cats?.categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              SKU Provider
            </label>
            <input
              className="input"
              value={form.providerSku}
              onChange={(e) =>
                setForm({ ...form, providerSku: e.target.value })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Harga Modal
            </label>
            <input
              className="input"
              type="number"
              value={form.costPrice}
              onChange={(e) =>
                setForm({ ...form, costPrice: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Harga Jual *
            </label>
            <input
              className="input"
              type="number"
              value={form.sellPrice}
              onChange={(e) =>
                setForm({ ...form, sellPrice: Number(e.target.value) })
              }
            />
          </div>
          {form.type === "TOPUP" ? (
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.requiresZoneId}
                  onChange={(e) =>
                    setForm({ ...form, requiresZoneId: e.target.checked })
                  }
                />
                Perlu Zone/Server ID
              </label>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Min Order
                </label>
                <input
                  className="input"
                  type="number"
                  value={form.minOrder}
                  onChange={(e) =>
                    setForm({ ...form, minOrder: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Max Order
                </label>
                <input
                  className="input"
                  type="number"
                  value={form.maxOrder}
                  onChange={(e) =>
                    setForm({ ...form, maxOrder: e.target.value })
                  }
                />
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-slate-400">
              Deskripsi
            </label>
            <textarea
              className="input"
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button
              className="btn-primary !py-2 text-xs"
              disabled={!form.name || !form.categoryId || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Menyimpan..." : "Simpan Produk"}
            </button>
            <button
              className="btn-ghost !py-2 text-xs"
              onClick={() => setShowForm(false)}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          className="input pl-9"
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="skeleton h-64" />
      ) : (
        <div className="glass-card divide-y divide-white/5">
          {(data?.products ?? []).map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{p.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {p.slug} · {p.category.name} · SKU: {p.providerSku ?? "-"}
                  {p.provider ? ` · ${p.provider.code}` : ""}
                </p>
                <p className="text-xs text-slate-500">
                  Modal {rupiah(p.costPrice)} · Jual {rupiah(p.sellPrice)} ·
                  Margin {rupiah(p.sellPrice - p.costPrice)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="input !w-28 !py-1.5 text-sm"
                  type="number"
                  defaultValue={p.sellPrice}
                  aria-label="Harga jual"
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v !== p.sellPrice && v >= 0)
                      patch.mutate({ id: p.id, data: { sellPrice: v } });
                  }}
                />
                <input
                  className="input !w-28 !py-1.5 text-sm"
                  type="number"
                  defaultValue={p.costPrice}
                  aria-label="Harga modal"
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v !== p.costPrice && v >= 0)
                      patch.mutate({ id: p.id, data: { costPrice: v } });
                  }}
                />
                <StatusBadge status={p.isActive ? "SUCCESS" : "FAILED"} />
                <button
                  className="btn-ghost !py-1.5 text-xs"
                  onClick={() =>
                    patch.mutate({ id: p.id, data: { isActive: !p.isActive } })
                  }
                >
                  {p.isActive ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button
                  className="btn-ghost !py-1.5 text-xs !text-rose-300"
                  onClick={() => {
                    if (confirm(`Hapus produk ${p.name}?`)) remove.mutate(p.id);
                  }}
                  aria-label="Hapus"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {(data?.products ?? []).length === 0 && (
            <p className="p-6 text-sm text-slate-400">Tidak ada produk.</p>
          )}
        </div>
      )}
    </div>
  );
}
