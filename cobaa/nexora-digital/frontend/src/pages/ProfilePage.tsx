import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { UserCog, Star } from 'lucide-react';
import { api, apiErrorMessage } from '../lib/api';
import { Section, Skeleton, Toast, rupiah } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

interface MyOrder {
  id: string; orderNo: string; status: string; fulfillment: string; priceTotal: number;
  createdAt: string; productId: string;
  product: { name: string };
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);
  const [reviewFor, setReviewFor] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => { if (!loading && !user) navigate('/login'); }, [user, loading, navigate]);
  useEffect(() => { if (user) setName(user.name); }, [user]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders-full'],
    queryFn: async () => (await api.get('/account/orders')).data as { orders: MyOrder[] },
    enabled: !!user,
  });

  const saveName = useMutation({
    mutationFn: async () => (await api.patch('/auth/me', { name })).data,
    onSuccess: () => setToast({ msg: 'Nama diperbarui.', type: 'success' }),
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: 'error' }),
  });
  const savePass = useMutation({
    mutationFn: async () => (await api.patch('/auth/me', { currentPassword: curPass, password: newPass })).data,
    onSuccess: () => { setToast({ msg: 'Password diperbarui — sesi lain dicabut.', type: 'success' }); setCurPass(''); setNewPass(''); },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: 'error' }),
  });
  const sendReview = useMutation({
    mutationFn: async (orderId: string) => {
      const order = orders!.orders.find((o) => o.id === orderId)!;
      return (await api.post('/reviews', { productId: order.productId, orderId, rating, comment: comment || undefined })).data;
    },
    onSuccess: () => { setToast({ msg: 'Terima kasih atas ulasannya!', type: 'success' }); setReviewFor(null); setComment(''); },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: 'error' }),
  });

  if (loading || !user) return <Section title="Profil"><Skeleton /></Section>;

  return (
    <Section title="Profil Saya" subtitle="Kelola akun & lihat seluruh riwayat transaksi.">
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="glass-card space-y-3 p-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-white"><UserCog className="h-4 w-4 text-neon" />Data Akun</p>
          <div className="text-sm text-slate-400">Email: <span className="text-slate-200">{user.email}</span> · Role: {user.role}</div>
          <div className="flex gap-2">
            <input className="input flex-1" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nama" />
            <button className="btn-primary !py-2 text-xs" disabled={saveName.isPending || name === user.name} onClick={() => saveName.mutate()}>Simpan</button>
          </div>
          <hr className="border-white/10" />
          <p className="text-sm font-semibold text-white">Ganti Password</p>
          <input className="input" type="password" placeholder="Password saat ini" value={curPass} onChange={(e) => setCurPass(e.target.value)} />
          <input className="input" type="password" placeholder="Password baru (min. 10, huruf besar+kecil+angka)" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
          <button className="btn-primary !py-2 text-xs" disabled={!curPass || newPass.length < 10 || savePass.isPending} onClick={() => savePass.mutate()}>Ganti Password</button>
        </div>

        <div className="glass-card divide-y divide-white/5">
          <p className="p-4 text-sm font-semibold text-white">Riwayat Transaksi</p>
          {isLoading && <div className="skeleton m-4 h-32" />}
          {(orders?.orders ?? []).length === 0 && !isLoading && <p className="p-4 text-sm text-slate-400">Belum ada transaksi.</p>}
          {(orders?.orders ?? []).map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium text-white">{o.product.name}</p>
                <p className="text-xs text-slate-500">{o.orderNo} · {new Date(o.createdAt).toLocaleString('id-ID')} · {rupiah(o.priceTotal)}</p>
                <p className="text-xs text-slate-500">Status: {o.status} / {o.fulfillment}</p>
              </div>
              {o.fulfillment === 'SUCCESS' && (
                <button className="btn-ghost !py-1.5 text-xs" onClick={() => setReviewFor(reviewFor === o.id ? null : o.id)}>
                  <Star className="h-3.5 w-3.5" />Beri Ulasan
                </button>
              )}
            </div>
          ))}
        </div>

        {reviewFor && (
          <div className="glass-card space-y-3 p-6">
            <p className="text-sm font-semibold text-white">Ulasan</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} aria-label={`${n} bintang`}>
                  <Star className={`h-6 w-6 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>
            <textarea className="input" rows={3} placeholder="Bagaimana pengalaman Anda? (opsional)" value={comment} onChange={(e) => setComment(e.target.value)} />
            <div className="flex gap-2">
              <button className="btn-primary !py-2 text-xs" disabled={sendReview.isPending} onClick={() => sendReview.mutate(reviewFor)}>Kirim Ulasan</button>
              <button className="btn-ghost !py-2 text-xs" onClick={() => setReviewFor(null)}>Batal</button>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
