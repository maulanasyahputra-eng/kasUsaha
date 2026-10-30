import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import { StatusBadge, rupiah, Toast } from "../../components/ui";
import { Users, Ban, CheckCircle2, History } from "lucide-react";

interface CustomerRow {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  wallet: { balance: string } | null;
  _count: { orders: number };
}
interface OrderRow {
  id: string;
  orderNo: string;
  status: string;
  priceTotal: number;
  createdAt: string;
  product: { name: string };
}

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-customers", search],
    queryFn: async () =>
      (await api.get("/admin/customers", { params: { search } })).data as {
        users: CustomerRow[];
      },
  });
  const { data: custOrders } = useQuery({
    queryKey: ["admin-cust-orders", detailId],
    queryFn: async () =>
      (await api.get(`/admin/customers/${detailId}/orders`)).data as {
        orders: OrderRow[];
      },
    enabled: !!detailId,
  });
  const patch = useMutation({
    mutationFn: async (p: { id: string; isActive: boolean }) =>
      (await api.patch(`/admin/customers/${p.id}`, p)).data,
    onSuccess: () =>
      setToast({ msg: "Status customer diperbarui.", type: "success" }),
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-bold text-white">
        <Users className="h-5 w-5 text-neon" />
        Customer
      </h1>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <input
        className="input"
        placeholder="Cari email / nama..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {isLoading ? (
        <div className="skeleton h-64" />
      ) : (
        <div className="glass-card divide-y divide-white/5">
          {(data?.users ?? []).map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="text-sm font-medium text-white">
                  {u.name}{" "}
                  <span className="badge ml-1 bg-white/10 text-slate-300">
                    {u.role}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  {u.email} · {u._count.orders} pesanan · saldo{" "}
                  {rupiah(u.wallet?.balance ?? 0)}
                </p>
                <p className="text-xs text-slate-600">
                  Sejak {new Date(u.createdAt).toLocaleDateString("id-ID")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={u.isActive ? "SUCCESS" : "FAILED"} />
                {u.role !== "ADMIN" && (
                  <button
                    className="btn-ghost !py-1.5 text-xs"
                    onClick={() =>
                      patch.mutate({ id: u.id, isActive: !u.isActive })
                    }
                  >
                    {u.isActive ? (
                      <>
                        <Ban className="h-3.5 w-3.5" />
                        Nonaktifkan
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Aktifkan
                      </>
                    )}
                  </button>
                )}
                <button
                  className="btn-ghost !py-1.5 text-xs"
                  onClick={() => setDetailId(detailId === u.id ? null : u.id)}
                >
                  <History className="h-3.5 w-3.5" />
                  Riwayat
                </button>
              </div>
              {detailId === u.id && (
                <div className="w-full rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="mb-2 text-xs font-semibold text-white">
                    Riwayat Pesanan
                  </p>
                  {(custOrders?.orders ?? []).length === 0 ? (
                    <p className="text-xs text-slate-500">Belum ada.</p>
                  ) : (
                    custOrders!.orders.map((o) => (
                      <div
                        key={o.id}
                        className="flex justify-between border-b border-white/5 py-1.5 text-xs last:border-0"
                      >
                        <span className="text-slate-300">
                          {o.product.name} · {o.orderNo}
                        </span>
                        <span className="text-slate-400">
                          {rupiah(o.priceTotal)} · {o.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
          {(data?.users ?? []).length === 0 && (
            <p className="p-6 text-sm text-slate-400">Tidak ditemukan.</p>
          )}
        </div>
      )}
    </div>
  );
}
