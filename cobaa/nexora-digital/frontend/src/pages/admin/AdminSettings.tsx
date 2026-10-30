import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import { Toast } from "../../components/ui";

interface SettingRow {
  key: string;
  value: string;
  updatedAt: string;
}

export default function AdminSettings() {
  const [toast, setToast] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () =>
      (await api.get("/admin/settings")).data as { settings: SettingRow[] },
  });

  const save = useMutation({
    mutationFn: async (p: { key: string; value: string }) =>
      (await api.put(`/admin/settings/${p.key}`, { value: p.value })).data,
    onSuccess: () => {
      setToast({ msg: "Pengaturan disimpan.", type: "success" });
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Pengaturan</h1>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <p className="text-xs text-slate-500">
        Key-value konfigurasi runtime (mis. support email, banner). Perubahan
        tercatat di audit log. Kredensial provider diatur di file .env, bukan di
        sini.
      </p>
      {isLoading ? (
        <div className="skeleton h-40" />
      ) : (
        <div className="glass-card divide-y divide-white/5">
          {(data?.settings ?? []).map((s) => (
            <div key={s.key} className="flex items-center gap-3 p-4">
              <span className="w-40 shrink-0 font-mono text-xs text-slate-400">
                {s.key}
              </span>
              <input
                className="input !py-1.5 text-sm"
                defaultValue={s.value}
                onBlur={(e) => {
                  if (e.target.value !== s.value)
                    save.mutate({ key: s.key, value: e.target.value });
                }}
              />
            </div>
          ))}
          {(data?.settings ?? []).length === 0 && (
            <p className="p-6 text-sm text-slate-400">Belum ada pengaturan.</p>
          )}
        </div>
      )}
      <div className="glass-card flex flex-wrap gap-3 p-5">
        <input
          className="input !w-48"
          placeholder="key baru (mis. support_email)"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
        />
        <input
          className="input flex-1"
          placeholder="value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
        />
        <button
          className="btn-primary !py-2 text-xs"
          disabled={!newKey || !newValue}
          onClick={() => {
            save.mutate({ key: newKey, value: newValue });
            setNewKey("");
            setNewValue("");
          }}
        >
          Tambah
        </button>
      </div>
    </div>
  );
}
