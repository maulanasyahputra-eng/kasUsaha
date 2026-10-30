import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import { StatusBadge, rupiah, Toast } from "../../components/ui";
import { Plus, Power } from "lucide-react";

interface CouponRow {
  id: string;
  code: string;
  type: string;
  value: number;
  minSpend: number;
  maxDiscount?: number | null;
  quota: number;
  used: number;
  isActive: boolean;
  expiresAt?: string | null;
}

export default function AdminCoupons() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "PERCENT",
    value: 10,
    minSpend: 0,
    quota: 100,
  });
  const [toast, setToast] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () =>
      (await api.get("/admin/coupons")).data as { coupons: CouponRow[] },
  });

  const create = useMutation({
    mutationFn: async () =>
      (
        await api.post("/admin/coupons", {
          ...form,
          value: Number(form.value),
          minSpend: Number(form.minSpend),
          quota: Number(form.quota),
        })
      ).data,
    onSuccess: () => {
      setToast({ msg: "Promo dibuat.", type: "success" });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });
  const patch = useMutation({
    mutationFn: async (p: { id: string; data: Record<string, unknown> }) =>
      (await api.patch(`/admin/coupons/${p.id}`, p.data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Kode Promo</h1>
        <button
          className="btn-primary !py-2 text-xs"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-4 w-4" />
          Promo Baru
        </button>
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {showForm && (
        <div className="glass-card grid gap-3 p-5 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Kode *</label>
            <input
              className="input"
              placeholder="NEXORA10"
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Tipe *</label>
            <select
              className="input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="PERCENT">Persen (%)</option>
              <option value="FIXED">Nominal (Rp)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Nilai *</label>
            <input
              className="input"
              type="number"
              value={form.value}
              onChange={(e) =>
                setForm({ ...form, value: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Min. Belanja
            </label>
            <input
              className="input"
              type="number"
              value={form.minSpend}
              onChange={(e) =>
                setForm({ ...form, minSpend: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Kuota *</label>
            <input
              className="input"
              type="number"
              value={form.quota}
              onChange={(e) =>
                setForm({ ...form, quota: Number(e.target.value) })
              }
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              className="btn-primary !py-2 text-xs"
              disabled={!form.code || create.isPending}
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
          {(data?.coupons ?? []).map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="font-mono text-sm font-medium text-neon">
                  {c.code}
                </p>
                <p className="text-xs text-slate-500">
                  {c.type === "PERCENT" ? `${c.value}%` : rupiah(c.value)} ·
                  min. {rupiah(c.minSpend)} · terpakai {c.used}/{c.quota}
                  {c.expiresAt &&
                    ` · kedaluwarsa ${new Date(c.expiresAt).toLocaleDateString("id-ID")}`}
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
                  <Power className="h-3.5 w-3.5" />
                  {c.isActive ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </div>
            </div>
          ))}
          {(data?.coupons ?? []).length === 0 && (
            <p className="p-6 text-sm text-slate-400">Belum ada promo.</p>
          )}
        </div>
      )}
    </div>
  );
}
