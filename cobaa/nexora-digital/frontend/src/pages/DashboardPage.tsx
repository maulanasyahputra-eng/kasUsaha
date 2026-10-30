import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { PackageCheck, Clock, Loader, Wallet, UserCog, ChevronRight, Bell } from 'lucide-react';
import { api } from '../lib/api';
import { Section, StatusBadge, Skeleton, rupiah } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

interface OrderRow {
  id: string; orderNo: string; status: string; fulfillment: string;
  priceTotal: number; createdAt: string; product: { name: string };
}

const accountMenu = [
  { to: '/dashboard/profil', label: 'Profil Saya', icon: UserCog },
  { to: '/dashboard/saldo', label: 'Saldo & Deposit', icon: Wallet },
  { to: '/cek-pesanan', label: 'Cek Pesanan', icon: PackageCheck },
  { to: '/bantuan', label: 'Bantuan', icon: Bell },
];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!loading && !user) navigate('/login'); }, [user, loading, navigate]);

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => (await api.get('/account/wallet')).data.wallet as { balance: string },
    enabled: !!user,
  });
  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => (await api.get('/account/orders')).data as { orders: OrderRow[] },
    enabled: !!user,
  });
  const { data: notifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/account/notifications')).data.notifications as { id: string; title: string; body: string; createdAt: string }[],
    enabled: !!user,
  });

  if (loading || !user) return <Section title="Dashboard"><Skeleton /></Section>;

  const list = orders?.orders ?? [];
  const summary = {
    total: list.length,
    done: list.filter((o) => o.fulfillment === 'SUCCESS').length,
    processing: list.filter((o) => o.status === 'PAID' && ['QUEUED', 'PROCESSING', 'UNKNOWN'].includes(o.fulfillment)).length,
    unpaid: list.filter((o) => o.status === 'PENDING').length,
  };

  const statCard = (icon: JSX.Element, label: string, value: string | number, accent: string) => (
    <div className="glass-card flex items-center gap-4 p-5">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>{icon}</span>
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Halo, {user.name.split(' ')[0]} 👋</h1>
          <p className="mt-1 text-sm text-zinc-500">Ringkasan akun Anda</p>
        </div>
        <Link to="/kategori" className="btn-primary !py-2.5 text-sm">Belanja Sekarang</Link>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCard(<Wallet className="h-5 w-5 text-neon" />, 'Saldo', rupiah(wallet?.balance ?? 0), 'bg-neon/15')}
        {statCard(<PackageCheck className="h-5 w-5 text-emerald-400" />, 'Pesanan Selesai', summary.done, 'bg-emerald-400/15')}
        {statCard(<Loader className="h-5 w-5 text-cyan-300" />, 'Diproses', summary.processing, 'bg-cyan-400/15')}
        {statCard(<Clock className="h-5 w-5 text-amber-300" />, 'Menunggu Bayar', summary.unpaid, 'bg-amber-400/15')}
        {statCard(<PackageCheck className="h-5 w-5 text-neon-soft" />, 'Total Transaksi', summary.total, 'bg-neon-soft/15')}
      </div>

      {/* Quick menu */}
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {accountMenu.map((m) => (
          <Link key={m.to} to={m.to} className="glass-card glass-card-hover flex items-center gap-3 p-4">
            <m.icon className="h-4 w-4 text-neon" />
            <span className="flex-1 text-sm font-medium text-white">{m.label}</span>
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </Link>
        ))}
      </div>

      {/* Orders */}
      <h2 className="mb-4 mt-10 text-lg font-bold">Riwayat Pesanan</h2>
      {isLoading ? <Skeleton count={3} /> : list.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <PackageCheck className="mx-auto h-8 w-8 text-zinc-600" />
          <p className="mt-3 font-medium text-zinc-300">Belum ada pesanan</p>
          <Link to="/kategori" className="btn-primary mt-4 !py-2 text-xs">Jelajahi Produk</Link>
        </div>
      ) : (
        <div className="glass-card divide-y divide-white/5">
          {list.slice(0, 10).map((o) => (
            <Link key={o.id} to={`/order/${o.id}/status`} className="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:bg-white/[0.04]">
              <div>
                <p className="text-sm font-medium text-white">{o.product.name}</p>
                <p className="text-xs text-zinc-500">{o.orderNo} · {new Date(o.createdAt).toLocaleString('id-ID')}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm">{rupiah(o.priceTotal)}</span>
                <StatusBadge status={o.status} />
                <StatusBadge status={o.fulfillment} />
                <ChevronRight className="h-4 w-4 text-zinc-600" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Notifications */}
      <h2 className="mb-4 mt-10 flex items-center gap-2 text-lg font-bold"><Bell className="h-4 w-4 text-neon" />Notifikasi</h2>
      <div className="glass-card divide-y divide-white/5">
        {(notifs ?? []).length === 0 ? <p className="p-6 text-sm text-zinc-500">Belum ada notifikasi.</p> :
          notifs!.map((n) => (
            <div key={n.id} className="p-4">
              <p className="text-sm font-medium text-white">{n.title}</p>
              <p className="text-sm text-zinc-400">{n.body}</p>
              <p className="mt-1 text-xs text-zinc-600">{new Date(n.createdAt).toLocaleString('id-ID')}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
