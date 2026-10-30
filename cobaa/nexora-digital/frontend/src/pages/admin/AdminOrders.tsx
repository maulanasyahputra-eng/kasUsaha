import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import { StatusBadge, rupiah, Toast } from "../../components/ui";
import { X } from "lucide-react";

interface OrderRow {
  id: string;
  orderNo: string;
  status: string;
  fulfillment: string;
  priceTotal: number;
  quantity: number;
  createdAt: string;
  failReason?: string;
  accountInput: string;
  product: { name: string; providerSku?: string | null };
  user?: { email: string; name: string } | null;
  transactions: { providerRef?: string | null; status: string; createdAt?: string }[];
  payments: { provider: string; status: string; externalId?: string | null }[];
  history: {
    note?: string;
    toValue?: string;
    field: string;
    createdAt: string;
  }[];
}

const statusFilters = ["", "PENDING", "PAID", "EXPIRED", "FAILED", "REFUNDED"];
const fulfillFilters = [
  "",
  "QUEUED",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "UNKNOWN",
];

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [fulfillment, setFulfillment] = useState("");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", page, status, fulfillment, search],
    queryFn: async () =>
      (
        await api.get("/admin/orders", {
          params: { page, status, fulfillment, search },
        })
      ).data as {
        orders: OrderRow[];
        pagination: { totalPages: number; total: number };
      },
  });

  const { data: detailData } = useQuery({
    queryKey: ["admin-order", detail],
    queryFn: async () =>
      (await api.get(`/admin/orders/${detail}`)).data.order as OrderRow & {
        refunds: { amount: number; reason: string }[];
      },
    enabled: !!detail,
  });

  const recheck = useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/admin/orders/${id}/recheck`)).data,
    onSuccess: (r) => {
      setToast({ msg: r.note, type: "success" });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">
        Pesanan {data ? `(${data.pagination.total})` : ""}
      </h1>
      {toast && <Toast message={toast.msg} type={toast.type} />}

      <div className="glass-card flex flex-wrap gap-2 p-3">
        <input
          className="input !w-56 !py-1.5 text-sm"
          placeholder="Cari no. pesanan..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="input !w-36 !py-1.5 text-sm"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          {statusFilters.map((s) => (
            <option key={s} value={s}>
              {s || "Semua Status"}
            </option>
          ))}
        </select>
        <select
          className="input !w-40 !py-1.5 text-sm"
          value={fulfillment}
          onChange={(e) => {
            setFulfillment(e.target.value);
            setPage(1);
          }}
        >
          {fulfillFilters.map((s) => (
            <option key={s} value={s}>
              {s || "Semua Fulfillment"}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="skeleton h-64" />
      ) : (
        <div className="glass-card divide-y divide-white/5">
          {(data?.orders ?? []).map((o) => (
            <div key={o.id} className="space-y-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button className="text-left" onClick={() => setDetail(o.id)}>
                  <p className="text-sm font-medium text-white hover:text-neon">
                    {o.product.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {o.orderNo} ·{" "}
                    {new Date(o.createdAt).toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {o.user ? `${o.user.name} (${o.user.email})` : "Guest"} ·
                    Tujuan: {o.accountInput}
                  </p>
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm">{rupiah(o.priceTotal)}</span>
                  {o.payments[0] && (
                    <span className="badge bg-white/10 text-slate-300">
                      {o.payments[0].provider}
                    </span>
                  )}
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
            </div>
          ))}
          {(data?.orders ?? []).length === 0 && (
            <p className="p-6 text-sm text-slate-400">Tidak ada pesanan.</p>
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

      {/* Panel detail */}
      {detail && detailData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="glass-card max-h-[85vh] w-full max-w-2xl overflow-y-auto bg-ink-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {detailData.orderNo}
                </h2>
                <p className="text-sm text-slate-400">
                  {detailData.product.name} ·{" "}
                  {detailData.product.providerSku ?? "-"}
                </p>
              </div>
              <button
                className="text-slate-400 hover:text-white"
                onClick={() => setDetail(null)}
                aria-label="Tutup"
              >
                <X />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <p className="text-slate-400">Status</p>
                <p>
                  <StatusBadge status={detailData.status} />
                </p>
                <p className="text-slate-400">Fulfillment</p>
                <p>
                  <StatusBadge status={detailData.fulfillment} />
                </p>
                <p className="text-slate-400">Total</p>
                <p>{rupiah(detailData.priceTotal)}</p>
                <p className="text-slate-400">Tujuan</p>
                <p className="break-all">{detailData.accountInput}</p>
                <p className="text-slate-400">Customer</p>
                <p>
                  {detailData.user
                    ? `${detailData.user.name} (${detailData.user.email})`
                    : "Guest"}
                </p>
              </div>
              {detailData.payments.length > 0 && (
                <div>
                  <p className="mb-1 font-semibold text-white">Pembayaran</p>
                  {detailData.payments.map((p, i) => (
                    <p key={i} className="text-slate-400">
                      {p.provider} — {p.status}{" "}
                      {p.externalId ? `(${p.externalId})` : ""}
                    </p>
                  ))}
                </div>
              )}
              {detailData.transactions.length > 0 && (
                <div>
                  <p className="mb-1 font-semibold text-white">
                    Transaksi Provider
                  </p>
                  {detailData.transactions.map((t, i) => (
                    <p key={i} className="text-slate-400">
                      {t.status} · ref: {t.providerRef ?? "-"}
                      {t.createdAt ? ` · ${new Date(t.createdAt as string).toLocaleString("id-ID")}` : ""}
                    </p>
                  ))}
                </div>
              )}
              {detailData.refunds.length > 0 && (
                <div>
                  <p className="mb-1 font-semibold text-white">Refund</p>
                  {detailData.refunds.map((r, i) => (
                    <p key={i} className="text-fuchsia-300">
                      {rupiah(r.amount)} — {r.reason}
                    </p>
                  ))}
                </div>
              )}
              <div>
                <p className="mb-1 font-semibold text-white">Riwayat Status</p>
                <ol className="space-y-1 text-slate-400">
                  {detailData.history.map((h, i) => (
                    <li key={i}>
                      • {h.note ?? `${h.field} → ${h.toValue ?? "-"}`}{" "}
                      <span className="text-xs text-slate-600">
                        {new Date(h.createdAt).toLocaleString("id-ID")}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
              <p className="text-xs text-slate-500">
                Sistem tidak mengizinkan perubahan status manual ke SUCCESS —
                status hanya berubah dari bukti provider/payment gateway yang
                terverifikasi.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
