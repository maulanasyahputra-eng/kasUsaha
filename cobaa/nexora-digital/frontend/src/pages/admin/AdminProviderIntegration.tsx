import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  PlugZap,
  RefreshCw,
  Server,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
import { StatusBadge, Toast } from "../../components/ui";

interface ProviderRow {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  priority: number;
  productCount: number;
  credential: {
    baseUrl: string | null;
    username: string | null;
    environment: string;
    hasApiKey: boolean;
    hasApiSecret: boolean;
    hasSignatureKey: boolean;
    connStatus: "NOT_CONFIGURED" | "CONNECTED" | "CONNECTION_FAILED";
    connMessage: string | null;
    lastConnectedAt: string | null;
    lastCheckedAt: string | null;
  };
}
interface LogRow {
  id: string;
  kind: string;
  status: string;
  message?: string;
  createdAt: string;
}

const connBadge = (s: string) =>
  s === "CONNECTED"
    ? "SUCCESS"
    : s === "CONNECTION_FAILED"
      ? "FAILED"
      : "UNKNOWN";

const providerMeta: Record<string, { desc: string; color: string }> = {
  DIGIFLAZZ: {
    desc: "Top up game & produk digital prepaid",
    color: "from-rose-500/80 to-orange-400/80",
  },
  SOSMEDMEDIA: {
    desc: "Layanan media sosial (followers, likes, views)",
    color: "from-fuchsia-500/80 to-violet-500/80",
  },
  SIMULATION: {
    desc: "Provider simulasi — DEVELOPMENT ONLY",
    color: "from-slate-500/80 to-slate-400/80",
  },
};

function ProviderCard({
  p,
  onOpenSettings,
}: {
  p: ProviderRow;
  onOpenSettings: () => void;
}) {
  const qc = useQueryClient();
  const test = useMutation({
    mutationFn: async () =>
      (await api.post(`/admin/providers/${p.code}/test-connection`)).data as {
        status: string;
        message: string;
        balance?: number;
      },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-providers-status"] }),
  });
  const toggle = useMutation({
    mutationFn: async () =>
      (await api.patch(`/admin/providers/${p.id}`, { isActive: !p.isActive }))
        .data,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-providers-status"] }),
  });
  const meta = providerMeta[p.code] ?? {
    desc: "Provider kustom",
    color: "from-cyan-500/80 to-blue-500/80",
  };

  return (
    <div className="glass-card glass-card-hover overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${meta.color}`} />
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5">
              <Server className="h-5 w-5 text-neon" />
            </span>
            <div>
              <p className="font-semibold text-white">{p.name}</p>
              <p className="text-xs text-slate-500">{meta.desc}</p>
            </div>
          </div>
          <StatusBadge status={p.isActive ? "SUCCESS" : "FAILED"} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
            <p className="text-slate-500">Status koneksi</p>
            <p className="mt-1">
              <StatusBadge status={connBadge(p.credential.connStatus)} />
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
            <p className="text-slate-500">Konfigurasi</p>
            <p className="mt-1 flex items-center gap-1 text-slate-300">
              <KeyRound className="h-3.5 w-3.5 text-neon" />
              {p.credential.hasApiKey
                ? "API key tersimpan (terenkripsi)"
                : "Belum ada API key"}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
            <p className="text-slate-500">Environment</p>
            <p className="mt-1 uppercase text-slate-300">
              {p.credential.environment}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
            <p className="text-slate-500">Terakhir terhubung</p>
            <p className="mt-1 text-slate-300">
              {p.credential.lastConnectedAt
                ? new Date(p.credential.lastConnectedAt).toLocaleString("id-ID")
                : "—"}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          {p.productCount} produk terhubung
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            className="btn-ghost !py-1.5 text-xs"
            onClick={onOpenSettings}
          >
            Pengaturan
          </button>
          <button
            className="btn-ghost !py-1.5 text-xs"
            disabled={test.isPending}
            onClick={() => test.mutate()}
          >
            <PlugZap className="h-3.5 w-3.5" />
            {test.isPending ? "Menguji..." : "Test Koneksi"}
          </button>
          <button
            className="btn-ghost !py-1.5 text-xs"
            disabled={toggle.isPending}
            onClick={() => toggle.mutate()}
          >
            {p.isActive ? "Nonaktifkan" : "Aktifkan"}
          </button>
        </div>
        {test.data && (
          <div
            className={`rounded-lg border p-2.5 text-xs ${
              test.data.status === "CONNECTED"
                ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
                : test.data.status === "CONNECTION_FAILED"
                  ? "border-rose-500/40 bg-rose-950/40 text-rose-200"
                  : "border-amber-500/40 bg-amber-950/40 text-amber-200"
            }`}
          >
            <b>{test.data.status}</b>: {test.data.message}
            {test.data.balance != null &&
              ` · Saldo: Rp${test.data.balance.toLocaleString("id-ID")}`}
          </div>
        )}
        {p.credential.connMessage && !test.data && (
          <p className="text-xs text-slate-500">
            Pemeriksaan terakhir: {p.credential.connMessage}
          </p>
        )}
      </div>
    </div>
  );
}

function SettingsModal({
  code,
  name,
  onClose,
}: {
  code: string;
  name: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: statusData } = useQuery({
    queryKey: ["admin-providers-status"],
    queryFn: async () =>
      (await api.get("/admin/providers/status")).data as {
        providers: ProviderRow[];
      },
  });
  const current = statusData?.providers.find((p) => p.code === code);
  const { data: logs } = useQuery({
    queryKey: ["provider-logs", code],
    queryFn: async () =>
      (await api.get(`/admin/providers/${code}/logs`)).data as {
        logs: LogRow[];
      },
  });

  const [form, setForm] = useState({
    baseUrl: "",
    username: "",
    apiKey: "",
    apiSecret: "",
    signatureKey: "",
    environment: "sandbox" as "sandbox" | "production",
  });
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

  const save = useMutation({
    mutationFn: async () =>
      (await api.post(`/admin/providers/${code}/credential`, form)).data,
    onSuccess: () => {
      setToast({
        msg: "Konfigurasi tersimpan (credential terenkripsi).",
        type: "success",
      });
      qc.invalidateQueries({ queryKey: ["admin-providers-status"] });
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });
  const saveAndConnect = useMutation({
    mutationFn: async () =>
      (await api.post(`/admin/providers/${code}/connect`, form)).data as {
        connection: { status: string; message: string };
      },
    onSuccess: (r) => {
      const ok = r.connection.status === "CONNECTED";
      setToast({
        msg: `${r.connection.status}: ${r.connection.message}`,
        type: ok ? "success" : "error",
      });
      qc.invalidateQueries({ queryKey: ["admin-providers-status"] });
      qc.invalidateQueries({ queryKey: ["provider-logs", code] });
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });

  const field = (
    key: keyof typeof form,
    label: string,
    secret = false,
    placeholder = "",
  ) => (
    <div>
      <label className="mb-1 block text-xs text-slate-400">{label}</label>
      <div className="relative">
        <input
          className="input pr-10"
          type={secret && !show[key] ? "password" : "text"}
          placeholder={
            secret &&
            current?.credential[
              key === "apiKey"
                ? "hasApiKey"
                : key === "apiSecret"
                  ? "hasApiSecret"
                  : "hasSignatureKey"
            ]
              ? "•••••••• (tersimpan — isi untuk mengganti)"
              : placeholder
          }
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          autoComplete="off"
        />
        {secret && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            onClick={() => setShow({ ...show, [key]: !show[key] })}
            aria-label="Tampilkan/sembunyikan"
          >
            {show[key] ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="glass-card max-h-[88vh] w-full max-w-lg overflow-y-auto bg-ink-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              Pengaturan — {name}
            </h2>
            <p className="text-xs text-slate-500">
              Credential dienkripsi AES-256-GCM & tidak pernah dikirim kembali
              ke browser.
            </p>
          </div>
          <button
            className="text-slate-400 hover:text-white"
            onClick={onClose}
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {toast && <Toast message={toast.msg} type={toast.type} />}

        <div className="space-y-3">
          {field("baseUrl", "API Base URL", false, "https://api.provider.com")}
          {field("username", "Username / Customer ID", false)}
          {field("apiKey", "API Key", true)}
          {field("apiSecret", "API Secret (opsional)", true)}
          {field("signatureKey", "Signature Key (opsional)", true)}
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Environment
            </label>
            <select
              className="input"
              value={form.environment}
              onChange={(e) =>
                setForm({
                  ...form,
                  environment: e.target.value as "sandbox" | "production",
                })
              }
            >
              <option value="sandbox">Sandbox</option>
              <option value="production">Production</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            className="btn-ghost !py-2 text-xs"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            Simpan Konfigurasi
          </button>
          <button
            className="btn-ghost !py-2 text-xs"
            disabled={saveAndConnect.isPending}
            onClick={() => saveAndConnect.mutate()}
          >
            <Link2 className="h-3.5 w-3.5" />
            Simpan & Hubungkan
          </button>
        </div>

        <div className="mt-5">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-white">
            <RefreshCw className="h-3.5 w-3.5 text-neon" />
            Riwayat Koneksi & Sinkronisasi
          </p>
          <div className="max-h-40 space-y-1.5 overflow-y-auto">
            {(logs?.logs ?? []).length === 0 && (
              <p className="text-xs text-slate-500">Belum ada riwayat.</p>
            )}
            {(logs?.logs ?? []).map((l) => (
              <div
                key={l.id}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-xs"
              >
                <div className="flex justify-between gap-2">
                  <StatusBadge
                    status={
                      l.status === "CONNECTED" || l.status === "SUCCESS"
                        ? "SUCCESS"
                        : l.status === "FAILED" ||
                            l.status === "CONNECTION_FAILED"
                          ? "FAILED"
                          : "UNKNOWN"
                    }
                  />
                  <span className="text-slate-600">
                    {new Date(l.createdAt).toLocaleString("id-ID")}
                  </span>
                </div>
                <p className="mt-1 text-slate-400">
                  {l.kind} · {l.message}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 flex items-start gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
          Test koneksi hanya memanggil endpoint read-only resmi provider (saldo
          / daftar layanan) — tidak pernah melakukan transaksi pembelian.
        </p>
      </div>
    </div>
  );
}

export default function AdminProviderIntegration() {
  const [settingsFor, setSettingsFor] = useState<{
    code: string;
    name: string;
  } | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-providers-status"],
    queryFn: async () =>
      (await api.get("/admin/providers/status")).data as {
        providers: ProviderRow[];
      },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Integrasi Provider</h1>
        <p className="text-sm text-slate-400">
          Kelola koneksi API provider digital. Credential tersimpan terenkripsi;
          status koneksi berdasarkan hasil pemeriksaan terakhir yang nyata.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        Provider tanpa credential tampil sebagai <b>NOT CONFIGURED</b>. Status
        CONNECTED hanya muncul setelah test koneksi berhasil terhadap API resmi
        provider.
      </div>

      {isLoading ? (
        <div className="skeleton h-56" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(data?.providers ?? []).map((p) => (
            <ProviderCard
              key={p.id}
              p={p}
              onOpenSettings={() =>
                setSettingsFor({ code: p.code, name: p.name })
              }
            />
          ))}
        </div>
      )}

      {settingsFor && (
        <SettingsModal
          code={settingsFor.code}
          name={settingsFor.name}
          onClose={() => setSettingsFor(null)}
        />
      )}
    </div>
  );
}
