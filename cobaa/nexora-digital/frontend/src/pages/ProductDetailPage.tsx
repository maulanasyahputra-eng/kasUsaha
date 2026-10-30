import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, ShieldCheck, Clock, Star, Gamepad2, Info } from 'lucide-react';
import { api, apiErrorMessage } from '../lib/api';
import { Skeleton, rupiah, Toast } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

interface ProductDetail {
  id: string; slug: string; name: string; type: string; description?: string | null;
  sellPrice: number; requiresZoneId: boolean; minOrder?: number | null; maxOrder?: number | null;
  avgTime?: string | null; imageUrl?: string | null;
  category: { name: string; slug: string };
}
interface ReviewItem { id: string; rating: number; comment: string | null; name: string; createdAt: string }

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userIdInput, setUserIdInput] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [quantity, setQuantity] = useState(1000);
  const [contactEmail, setContactEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => (await api.get(`/products/${slug}`)).data.product as ProductDetail,
  });
  const { data: reviewData } = useQuery({
    queryKey: ['product-reviews', slug],
    queryFn: async () => {
      const p = product!;
      return (await api.get(`/reviews/products/${p.id}`)).data as { reviews: ReviewItem[]; avgRating: number | null };
    },
    enabled: !!product,
  });

  const idempotencyKey = useMemo(() => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`, []);

  const createOrder = useMutation({
    mutationFn: async () => {
      const res = await api.post('/orders', {
        productId: product!.id,
        kind: product!.type === 'SMM' ? 'SMM' : 'TOPUP',
        quantity: product!.type === 'SMM' ? quantity : 1,
        accountInput: userIdInput.trim(),
        accountInput2: product!.requiresZoneId ? zoneId.trim() : undefined,
        contactEmail: contactEmail || undefined,
        idempotencyKey,
      });
      return res.data.order as { id: string };
    },
    onSuccess: (order) => {
      const gt = localStorage.getItem(`guest_pending_${order.id}`);
      void gt;
      navigate(`/checkout/${order.id}`);
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: 'error' }),
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!userIdInput.trim()) e.userId = product?.type === 'SMM' ? 'Target wajib diisi.' : 'User ID wajib diisi.';
    else if (userIdInput.trim().length < 3) e.userId = 'Minimal 3 karakter.';
    else if (product?.type === 'SMM' && /(https?:\/\/[^\s]+)/.test(userIdInput) === false && !userIdInput.startsWith('@')) {
      // URL atau @username keduanya sah — tidak diblokir
    }
    if (product?.requiresZoneId && !zoneId.trim()) e.zone = 'Zone / Server ID wajib diisi.';
    if (product?.type === 'SMM') {
      if (quantity < (product.minOrder ?? 1)) e.qty = `Minimal ${product.minOrder?.toLocaleString('id-ID')}.`;
      if (quantity > (product.maxOrder ?? 1000000)) e.qty = `Maksimal ${product.maxOrder?.toLocaleString('id-ID')}.`;
    }
    if (!user && contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) e.email = 'Format email tidak valid.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  if (isLoading || !product) {
    return (
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_400px]">
        <div className="skeleton h-96" /><div className="skeleton h-96" />
      </div>
    );
  }

  const qty = product.type === 'SMM' ? quantity : 1;
  const total = product.sellPrice * qty;

  const submit = () => { if (validate()) createOrder.mutate(); };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-zinc-500" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-neon">Beranda</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to={`/kategori/${product.category.slug}`} className="hover:text-neon">{product.category.name}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate text-zinc-300">{product.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* LEFT: info */}
        <div className="space-y-5">
          <div className="glass-card overflow-hidden">
            <div className="flex h-52 items-center justify-center bg-gradient-to-br from-ink-700 via-ink-850 to-ink-900">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <Gamepad2 className="h-16 w-16 text-neon/40" />
              )}
            </div>
            <div className="p-6">
              <span className="badge bg-neon/15 text-neon-soft">{product.category.name}</span>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl">{product.name}</h1>
              {reviewData?.avgRating != null && (
                <p className="mt-2 flex items-center gap-1 text-sm text-zinc-400">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {reviewData.avgRating.toFixed(1)} · {reviewData.reviews.length} ulasan
                </p>
              )}
              {product.description && <p className="mt-4 text-sm leading-relaxed text-zinc-400">{product.description}</p>}
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />Produk aktif</span>
                {product.avgTime && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-cyanx" />Estimasi: {product.avgTime}</span>}
              </div>
            </div>
          </div>

          {/* Reviews */}
          {(reviewData?.reviews ?? []).length > 0 && (
            <div className="glass-card p-6">
              <h2 className="mb-4 font-bold text-white">Ulasan Pembeli</h2>
              <div className="space-y-3">
                {reviewData!.reviews.slice(0, 5).map((r) => (
                  <div key={r.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="flex gap-0.5">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-zinc-300">{r.comment}</p>
                    <p className="mt-1.5 text-xs text-zinc-600">{r.name} · {new Date(r.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: order form */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="glass-card space-y-5 p-6">
            <p className="text-lg font-bold text-white">Buat Pesanan</p>

            {product.type === 'SMM' ? (
              <>
                <div>
                  <label className="label" htmlFor="target">Link / Username tujuan *</label>
                  <input id="target" className={`input ${errors.userId ? '!border-bad' : ''}`}
                    placeholder="https://... atau @username" value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value)} />
                  {errors.userId && <p className="mt-1 text-xs text-red-400">{errors.userId}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="qty">
                    Jumlah ({(product.minOrder ?? 0).toLocaleString('id-ID')}–{(product.maxOrder ?? 0).toLocaleString('id-ID')}) *
                  </label>
                  <input id="qty" className={`input ${errors.qty ? '!border-bad' : ''}`} type="number"
                    min={product.minOrder ?? 1} max={product.maxOrder ?? 1000000}
                    value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
                  {errors.qty && <p className="mt-1 text-xs text-red-400">{errors.qty}</p>}
                </div>
                <p className="flex items-start gap-1.5 text-xs text-zinc-500">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyanx" />
                  Estimasi {product.avgTime ?? 'mengikuti provider'} — tidak dijamin pasti. Engagement dapat menurun (risiko platform sosial).
                </p>
              </>
            ) : (
              <>
                <div>
                  <label className="label" htmlFor="uid">User ID *</label>
                  <input id="uid" className={`input ${errors.userId ? '!border-bad' : ''}`}
                    placeholder="Masukkan User ID" value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value)} />
                  {errors.userId && <p className="mt-1 text-xs text-red-400">{errors.userId}</p>}
                </div>
                {product.requiresZoneId && (
                  <div>
                    <label className="label" htmlFor="zone">Zone / Server ID *</label>
                    <input id="zone" className={`input ${errors.zone ? '!border-bad' : ''}`}
                      placeholder="Masukkan Zone ID" value={zoneId}
                      onChange={(e) => setZoneId(e.target.value)} />
                    {errors.zone && <p className="mt-1 text-xs text-red-400">{errors.zone}</p>}
                  </div>
                )}
                <p className="flex items-start gap-1.5 text-xs text-zinc-500">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyanx" />
                  Validasi otomatis ID bergantung dukungan provider — pastikan ID benar sebelum membayar.
                </p>
              </>
            )}

            {!user && (
              <div>
                <label className="label" htmlFor="email">Email kontak (guest checkout)</label>
                <input id="email" className={`input ${errors.email ? '!border-bad' : ''}`} type="email"
                  placeholder="email@contoh.com" value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)} />
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
              </div>
            )}

            <hr className="border-white/10" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-400">Harga satuan</span><span>{rupiah(product.sellPrice)}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Jumlah</span><span>{qty.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold text-white">
                <span>Total</span><span className="text-neon-soft">{rupiah(total)}</span>
              </div>
              <p className="text-xs text-zinc-600">Total dihitung ulang oleh server saat pesanan dibuat.</p>
            </div>

            <button className="btn-primary w-full !py-3" disabled={!userIdInput.trim() || createOrder.isPending} onClick={submit}>
              {createOrder.isPending ? 'Memproses...' : 'Buat Pesanan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
