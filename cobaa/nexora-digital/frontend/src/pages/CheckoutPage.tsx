import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ShieldCheck, Loader2, CreditCard, Wallet, ChevronRight, AlertTriangle } from 'lucide-react';
import { api, apiErrorMessage } from '../lib/api';
import { Section, Skeleton, rupiah, Toast, StatusBadge } from '../components/ui';

interface Order {
  id: string; orderNo: string; status: string; priceTotal: number; priceBase: number; priceDiscount: number;
  quantity: number; accountInput: string; accountInput2?: string;
  product: { name: string; type: string };
}

declare global { interface Window { snap?: any; } }

function loadSnap(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.snap) return resolve();
    const s = document.createElement('script');
    s.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('snap'));
    document.body.appendChild(s);
  });
}

const payMethods = [
  { id: '', label: 'Semua Metode', desc: 'QRIS, VA, e-wallet — pilih saat pembayaran', icon: <CreditCard className="h-4 w-4" /> },
  { id: 'qris', label: 'QRIS', desc: 'Scan dari aplikasi pembayaran mana pun', icon: <Wallet className="h-4 w-4" /> },
  { id: 'gopay', label: 'GoPay / ShopeePay', desc: 'E-wallet instan', icon: <Wallet className="h-4 w-4" /> },
  { id: 'bca_va', label: 'BCA Virtual Account', desc: 'Transfer otomatis terverifikasi', icon: <CreditCard className="h-4 w-4" /> },
  { id: 'bni_va', label: 'BNI Virtual Account', desc: 'Transfer otomatis terverifikasi', icon: <CreditCard className="h-4 w-4" /> },
];

export default function CheckoutPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [method, setMethod] = useState('');
  const [agree, setAgree] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const token = localStorage.getItem(`guest_${orderId}`) ?? '';
      return (await api.get(`/orders/${orderId}`, { params: { token } })).data.order as Order;
    },
    enabled: !!orderId,
  });

  useEffect(() => { loadSnap().catch(() => undefined); }, []);

  const payMidtrans = useMutation({
    mutationFn: async () => (await api.post(`/orders/${orderId}/pay`, method ? { paymentMethod: method } : {})).data.payment,
    onSuccess: async (payment: { snapToken: string; redirectUrl: string }) => {
      setProcessing(true);
      try {
        await loadSnap();
        window.snap!.pay(payment.snapToken, {
          onSuccess: () => { qc.invalidateQueries(); navigate(`/order/${orderId}/status`); },
          onPending: () => navigate(`/order/${orderId}/status`),
          onError: () => { setProcessing(false); setToast({ msg: 'Pembayaran gagal diproses gateway.', type: 'error' }); },
          onClose: () => { setProcessing(false); setToast({ msg: 'Popup ditutup sebelum selesai — pesanan tetap menunggu pembayaran.', type: 'error' }); },
        });
      } catch {
        window.open(payment.redirectUrl, '_blank');
        setProcessing(false);
      }
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: 'error' }),
  });

  const payWallet = useMutation({
    mutationFn: async () => (await api.post(`/orders/${orderId}/pay-wallet`)).data,
    onSuccess: () => { qc.invalidateQueries(); navigate(`/order/${orderId}/status`); },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: 'error' }),
  });

  if (isLoading) return <Section title="Checkout"><div className="mx-auto max-w-xl"><Skeleton /></div></Section>;
  if (error || !order) {
    return (
      <Section title="Checkout">
        <div className="glass-card mx-auto max-w-md p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-400" />
          <p className="mt-3 font-semibold text-white">Pesanan tidak dapat dimuat</p>
          <p className="mt-1 text-sm text-zinc-500">Verifikasi guest d atau pesanan bukan milik Anda.</p>
          <Link to="/cek-pesanan" className="btn-ghost mt-4 !py-2 text-xs">Cek Pesanan</Link>
        </div>
      </Section>
    );
  }
  if (order.status !== 'PENDING') {
    return (
      <Section title="Checkout">
        <div className="glass-card mx-auto max-w-md p-8 text-center">
          <p className="font-semibold text-white">Pesanan ini sudah diproses</p>
          <StatusBadge status={order.status} />
          <Link to={`/order/${orderId}/status`} className="btn-primary mt-4 !py-2 text-xs">Lihat Status</Link>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Checkout" subtitle={`Selesaikan pembayaran untuk ${order.orderNo}`}>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      {processing && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-ink-950/90 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-neon" />
          <p className="text-sm text-zinc-300">Memproses pembayaran...</p>
          <p className="text-xs text-zinc-500">Jangan tutup halaman ini</p>
        </div>
      )}

      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: detail + methods */}
        <div className="space-y-4">
          <div className="glass-card space-y-3 p-6">
            <p className="flex items-center gap-2 text-sm font-bold text-white"><ShieldCheck className="h-4 w-4 text-emerald-400" />Detail Pesanan</p>
            <div className="flex justify-between text-sm"><span className="text-zinc-400">Produk</span><span>{order.product.name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-zinc-400">Jumlah</span><span>{order.quantity.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Tujuan</span>
              <span className="break-all text-right">{order.accountInput}{order.accountInput2 ? ` (${order.accountInput2})` : ''}</span>
            </div>
            {order.priceDiscount > 0 && (
              <div className="flex justify-between text-sm text-emerald-300"><span>Diskon</span><span>-{rupiah(order.priceDiscount)}</span></div>
            )}
          </div>

          <div className="glass-card space-y-2 p-6">
            <p className="mb-1 text-sm font-bold text-white">Metode Pembayaran</p>
            {payMethods.map((m) => (
              <button key={m.id || 'all'}
                onClick={() => setMethod(m.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition ${
                  method === m.id ? 'border-neon/60 bg-neon/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                }`}>
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${method === m.id ? 'bg-neon/20 text-neon-soft' : 'bg-white/5 text-zinc-400'}`}>
                  {m.icon}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-white">{m.label}</span>
                  <span className="block text-xs text-zinc-500">{m.desc}</span>
                </span>
                {method === m.id && <span className="h-2.5 w-2.5 rounded-full bg-neon shadow-glow-sm" />}
              </button>
            ))}
            <p className="pt-1 text-xs text-zinc-600">
              Metode aktif mengikuti konfigurasi merchant Midtrans; jika satu metode tidak tersedia, pilih "Semua Metode".
            </p>
          </div>
        </div>

        {/* Right: summary */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="glass-card space-y-4 p-6">
            <div className="flex justify-between border-t border-white/10 pt-4 text-lg font-bold text-white">
              <span>Total</span><span className="text-neon-soft">{rupiah(order.priceTotal)}</span>
            </div>
            <p className="text-xs text-zinc-600">Nominal diverifikasi & dihitung ulang oleh server — tidak dapat diubah dari browser.</p>

            <label className="flex items-start gap-2.5 text-xs leading-relaxed text-zinc-400">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#8B5CF6]" />
              Saya menyetujui syarat transaksi: pesanan diproses setelah pembayaran terverifikasi; status pemrosesan mengikuti provider; kebijakan refund berlaku untuk pesanan gagal.
            </label>

            <button className="btn-primary w-full !py-3" disabled={!agree || payMidtrans.isPending || processing}
              onClick={() => payMidtrans.mutate()}>
              {payMidtrans.isPending ? 'Menyiapkan...' : <><CreditCard className="h-4 w-4" />Bayar Sekarang</>}
            </button>
            <button className="btn-ghost w-full !py-2.5 text-xs" disabled={!agree || payWallet.isPending}
              onClick={() => payWallet.mutate()}>
              <Wallet className="h-3.5 w-3.5" />Bayar dengan Saldo
            </button>

            <Link to="/cek-pesanan" className="flex items-center justify-center gap-1 text-xs text-zinc-500 hover:text-neon">
              Punya pesanan lain? Cek status <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
