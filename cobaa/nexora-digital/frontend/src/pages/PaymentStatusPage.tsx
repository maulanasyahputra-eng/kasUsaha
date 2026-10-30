import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Circle, Clock, XCircle, RefreshCcw, HelpCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Section, StatusBadge, rupiah } from '../components/ui';

interface HistoryItem { field: string; toValue?: string; note?: string; createdAt: string }
interface OrderStatus {
  orderNo: string; status: string; fulfillment: string; priceTotal: number;
  createdAt: string; failReason?: string; history: HistoryItem[];
  payment: { status: string; provider: string } | null;
}

const timelineSteps = [
  { key: 'created', label: 'Order Created', match: () => true },
  { key: 'paid', label: 'Payment Confirmed', match: (s: OrderStatus) => s.status === 'PAID' || s.status === 'REFUNDED' },
  { key: 'processing', label: 'Order Processing', match: (s: OrderStatus) => ['PAID', 'REFUNDED'].includes(s.status) },
  { key: 'provider', label: 'Provider Completed', match: (s: OrderStatus) => s.fulfillment === 'SUCCESS' },
  { key: 'done', label: 'Order Completed', match: (s: OrderStatus) => s.fulfillment === 'SUCCESS' },
];

const failStates = ['FAILED', 'EXPIRED'];

export default function PaymentStatusPage() {
  const { orderId } = useParams();
  const [params] = useSearchParams();

  const { data, error, isLoading } = useQuery({
    queryKey: ['order-status', orderId],
    queryFn: async () => {
      const token = params.get('token') ?? localStorage.getItem(`guest_${orderId}`) ?? '';
      return (await api.get(`/orders/${orderId}/status`, { params: { token } })).data.order as OrderStatus;
    },
    refetchInterval: (q) => (q.state.data?.status === 'PAID' && q.state.data?.fulfillment === 'SUCCESS' ? false : 8000),
  });

  if (isLoading) return <Section title="Status Pesanan"><div className="skeleton mx-auto h-64 max-w-xl" /></Section>;
  if (error || !data) {
    return (
      <Section title="Status Pesanan">
        <div className="glass-card mx-auto max-w-md p-8 text-center">
          <HelpCircle className="mx-auto h-8 w-8 text-amber-400" />
          <p className="mt-3 font-semibold text-white">Pesanan tidak ditemukan</p>
          <p className="mt-1 text-sm text-zinc-500">Periksa link / token verifikasi Anda.</p>
        </div>
      </Section>
    );
  }

  const paid = data.status === 'PAID';
  const failed = failStates.includes(data.status);
  const refunded = data.status === 'REFUNDED';
  const reachedIdx = timelineSteps.reduce((last, s, i) => (s.match(data) ? i : last), 0);

  return (
    <Section title="Status Pesanan" subtitle={data.orderNo}>
      <div className="mx-auto max-w-xl space-y-5">
        {/* Status hero */}
        <div className={`glass-card p-6 ${paid ? '!border-emerald-500/30' : failed ? '!border-red-500/30' : ''}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {paid && !failed && <CheckCircle2 className="h-9 w-9 text-emerald-400" />}
              {failed && <XCircle className="h-9 w-9 text-red-400" />}
              {!paid && !failed && <Clock className="h-9 w-9 animate-pulse text-amber-400" />}
              <div>
                <p className="font-bold text-white">
                  {refunded ? 'Pesanan Direfund' : failed ? (data.status === 'EXPIRED' ? 'Pembayaran Kedaluwarsa' : 'Pembayaran Gagal') : paid ? 'Pembayaran Berhasil' : 'Menunggu Pembayaran'}
                </p>
                <p className="text-xs text-zinc-500">{rupiah(data.priceTotal)} · {new Date(data.createdAt).toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <StatusBadge status={data.status} />
              <StatusBadge status={data.fulfillment} />
            </div>
          </div>
          {data.fulfillment === 'PROCESSING' && <p className="mt-3 text-sm text-cyan-300">Pesanan sedang diproses provider.</p>}
          {data.fulfillment === 'UNKNOWN' && <p className="mt-3 text-sm text-violet-300">Status provider belum diketahui — tim kami melakukan rekonsiliasi.</p>}
          {data.fulfillment === 'FAILED' && <p className="mt-3 text-sm text-red-300">{data.failReason ?? 'Pesanan gagal diproses; hubungi bantuan untuk refund.'}</p>}
          {!paid && !failed && <p className="mt-3 text-xs text-zinc-500">Halaman diperbarui otomatis setiap 8 detik. Status hanya berubah setelah webhook gateway terverifikasi.</p>}
          {data.payment && (
            <p className="mt-2 text-xs text-zinc-600">Metode: {data.payment.provider} ({data.payment.status})</p>
          )}
        </div>

        {/* Timeline */}
        <div className="glass-card p-6">
          <p className="mb-4 text-sm font-bold text-white">Timeline Pesanan</p>
          <ol className="relative space-y-4 border-l border-white/10 pl-6">
            {timelineSteps.map((s, i) => {
              const done = i <= reachedIdx && !failed;
              const active = i === reachedIdx && !done;
              return (
                <li key={s.key} className="relative">
                  <span className={`absolute -left-[31px] flex h-[18px] w-[18px] items-center justify-center rounded-full ${
                    done ? 'bg-emerald-500' : active ? 'bg-amber-400 animate-pulse' : 'bg-zinc-700'
                  }`}>
                    {done && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                  </span>
                  <p className={`text-sm font-medium ${done ? 'text-white' : active ? 'text-amber-300' : 'text-zinc-600'}`}>{s.label}</p>
                  {i < timelineSteps.length - 1 && data.history.find((h) => h.field === 'status' && h.toValue)?.createdAt && done && (
                    <p className="text-xs text-zinc-600">
                      {new Date(data.history.filter((h) => h.field === 'status').map((h) => h.createdAt)[i] ?? Date.now()).toLocaleString('id-ID')}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
          {failed && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-200">
              Pesanan berhenti pada tahap ini. {data.failReason ?? 'Hubungi support untuk bantuan.'}
            </p>
          )}
        </div>

        {/* Riwayat */}
        <details className="glass-card px-5 py-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-white">Riwayat Perubahan Status ({data.history.length})</summary>
          <ol className="mt-3 space-y-1.5 text-sm text-zinc-400">
            {data.history.map((h, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>{h.note ?? `${h.field} → ${h.toValue ?? '-'}`}</span>
                <span className="shrink-0 text-xs text-zinc-600">{new Date(h.createdAt).toLocaleString('id-ID')}</span>
              </li>
            ))}
          </ol>
        </details>

        <div className="flex justify-center gap-3">
          <button className="btn-ghost !py-2 text-xs" onClick={() => window.location.reload()}>
            <RefreshCcw className="h-3.5 w-3.5" />Segarkan Status
          </button>
          <Link to="/" className="btn-primary !py-2 text-xs">Kembali ke Beranda</Link>
        </div>
      </div>
    </Section>
  );
}
