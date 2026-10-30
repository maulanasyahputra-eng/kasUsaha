import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import { StatusBadge, Toast } from "../../components/ui";
import { Plus } from "lucide-react";

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  type: string;
  isActive: boolean;
  sortOrder: number;
  _count: { products: number };
}

export default function AdminCategories() {
  const [form, setForm] = useState({ name: "", slug: "", type: "TOPUP" });
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () =>
      (await api.get("/admin/categories")).data as {
        categories: CategoryRow[];
      },
  });

  const create = useMutation({
    mutationFn: async () =>
      (
        await api.post("/admin/categories", {
          ...form,
          slug:
            form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        })
      ).data,
    onSuccess: () => {
      setToast({ msg: "Kategori dibuat.", type: "success" });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });
  const patch = useMutation({
    mutationFn: async (p: { id: string; data: Record<string, unknown> }) =>
      (await api.patch(`/admin/categories/${p.id}`, p.data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categories"] }),
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Kategori</h1>
        <button
          className="btn-primary !py-2 text-xs"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-4 w-4" />
          Kategori Baru
        </button>
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {showForm && (
        <div className="glass-card grid gap-3 p-5 sm:grid-cols-3">
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
          <div className="flex gap-2 sm:col-span-3">
            <button
              className="btn-primary !py-2 text-xs"
              disabled={!form.name || create.isPending}
              onClick={() => create.mutate()}
            >
              Simpan
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

      {isLoading ? (
        <div className="skeleton h-40" />
      ) : (
        <div className="glass-card divide-y divide-white/5">
          {(data?.categories ?? []).map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="text-sm font-medium text-white">{c.name}</p>
                <p className="text-xs text-slate-500">
                  {c.slug} · {c.type} · {c._count.products} produk
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={c.isActive ? "SUCCESS" : "FAILED"} />
                <button
                  className="btn-ghost !py-1.5 text-xs"
                  onClick={() =>
                    patch.mutate({ id: c.id, data: { isActive: !c.isActive } })
                  }
                >
                  {c.isActive ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
