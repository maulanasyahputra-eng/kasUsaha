import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { ScrollText } from "lucide-react";

interface LogRow {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  detail?: unknown;
  createdAt: string;
  user?: { email: string } | null;
}

export default function AdminAudit() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit", page],
    queryFn: async () =>
      (await api.get("/admin/audit-logs", { params: { page } })).data as {
        logs: LogRow[];
        pagination: { totalPages: number };
      },
  });

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-bold text-white">
        <ScrollText className="h-5 w-5 text-neon" />
        Audit Log
      </h1>
      <p className="text-xs text-slate-500">
        Semua aksi admin (produk, provider, refund, pengaturan) tercatat di sini
        — tidak dapat diubah dari frontend.
      </p>
      {isLoading ? (
        <div className="skeleton h-64" />
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="p-3">Waktu</th>
                <th className="p-3">Admin</th>
                <th className="p-3">Aksi</th>
                <th className="p-3">Entitas</th>
                <th className="p-3">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(data?.logs ?? []).map((l) => (
                <tr key={l.id}>
                  <td className="p-3 text-slate-400">
                    {new Date(l.createdAt).toLocaleString("id-ID")}
                  </td>
                  <td className="p-3 text-slate-300">{l.user?.email ?? "-"}</td>
                  <td className="p-3 font-mono text-xs text-neon-soft">
                    {l.action}
                  </td>
                  <td className="p-3 text-slate-400">
                    {l.entity}
                    {l.entityId ? ` · ${l.entityId.slice(0, 8)}…` : ""}
                  </td>
                  <td className="max-w-56 truncate p-3 text-xs text-slate-500">
                    {l.detail ? JSON.stringify(l.detail) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(data?.logs ?? []).length === 0 && (
            <p className="p-6 text-center text-sm text-slate-400">
              Belum ada log.
            </p>
          )}
        </div>
      )}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            className="btn-ghost !py-2 text-xs"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Sebelumnya
          </button>
          <span className="px-2 py-2 text-sm text-slate-400">
            Hal {page}/{data.pagination.totalPages}
          </span>
          <button
            className="btn-ghost !py-2 text-xs"
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Berikutnya
          </button>
        </div>
      )}
    </div>
  );
}
