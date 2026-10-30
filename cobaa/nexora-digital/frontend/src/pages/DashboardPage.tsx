import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Section, StatusBadge, Skeleton, rupiah } from "../components/ui";
import { useAuth } from "../hooks/useAuth";

interface OrderRow {
  id: string;
  orderNo: string;
  status: string;
  fulfillment: string;
  priceTotal: number;
  createdAt: string;
  product: { name: string };
  payments: { status: string; provider: string }[];
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () =>
      (await api.get("/account/wallet")).data.wallet as { balance: string },
    enabled: !!user,
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () =>
      (await api.get("/account/orders")).data as { orders: OrderRow[] },
    enabled: !!user,
  });

  const { data: notifs } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () =>
      (await api.get("/account/notifications")).data.notifications as {
        id: string;
        title: string;
        body: string;
        createdAt: string;
      }[],
    enabled: !!user,
  });

  if (loading || !user)
    return (
      <Section title="Dashboard">
        <Skeleton />
      </Section>
    );

  return (
    <Section title={`Halo, ${user.name}`} subtitle="Ringkasan akun Anda.">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-6">
          <p className="text-sm text-slate-400">Saldo</p>
          <p className="mt-1 text-2xl font-bold text-neon">
            {rupiah(wallet?.balance ?? 0)}
          </p>
          <Link
            to="/dashboard/saldo"
            className="mt-3 inline-block text-sm text-neon hover:underline"
          >
            Kelola saldo & deposit →
          </Link>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-slate-400">Total Pesanan</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {orders?.orders.length ?? 0}
          </p>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm text-slate-400">Profil</p>
          <p className="mt-1 text-sm text-slate-300">{user.email}</p>
          <p className="text-xs text-slate-500">Role: {user.role}</p>
        </div>
      </div>

      <h3 className="mb-3 mt-10 text-lg font-bold text-white">
        Riwayat Pesanan
      </h3>
      {isLoading ? (
        <Skeleton />
      ) : (orders?.orders ?? []).length === 0 ? (
        <p className="glass-card p-8 text-center text-slate-400">
          Belum ada pesanan.
        </p>
      ) : (
        <div className="glass-card divide-y divide-white/5">
          {orders!.orders.map((o) => (
            <Link
              key={o.id}
              to={`/order/${o.id}/status`}
              className="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:bg-white/5"
            >
              <div>
                <p className="text-sm font-medium text-white">
                  {o.product.name}
                </p>
                <p className="text-xs text-slate-500">
                  {o.orderNo} · {new Date(o.createdAt).toLocaleString("id-ID")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm">{rupiah(o.priceTotal)}</span>
                <StatusBadge status={o.status} />
                <StatusBadge status={o.fulfillment} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <h3 className="mb-3 mt-10 text-lg font-bold text-white">Notifikasi</h3>
      <div className="glass-card divide-y divide-white/5">
        {(notifs ?? []).length === 0 ? (
          <p className="p-6 text-sm text-slate-400">Belum ada notifikasi.</p>
        ) : (
          notifs!.map((n) => (
            <div key={n.id} className="p-4">
              <p className="text-sm font-medium text-white">{n.title}</p>
              <p className="text-sm text-slate-400">{n.body}</p>
              <p className="mt-1 text-xs text-slate-600">
                {new Date(n.createdAt).toLocaleString("id-ID")}
              </p>
            </div>
          ))
        )}
      </div>
    </Section>
  );
}
