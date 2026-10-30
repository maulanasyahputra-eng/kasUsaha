import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search, Gamepad2, Share2, ShieldCheck, Zap, Sparkles, MousePointerClick,
  CreditCard, ListChecks, ChevronDown, Star, Package, Users, TrendingUp, ArrowRight,
} from 'lucide-react';
import { api } from '../lib/api';
import { Skeleton, rupiah } from '../components/ui';

interface Product {
  id: string; slug: string; name: string; sellPrice: number; type: string; imageUrl?: string | null;
  category: { slug: string; name: string };
}
interface Category {
  id: string; slug: string; name: string; type: string; _count: { products: number };
}
interface ReviewItem {
  id: string; rating: number; comment: string | null; name: string; createdAt: string;
  product: { name: string };
}

/* ---------- HERO ---------- */
function Hero({ stats }: { stats: { products: number; categories: number } | null }) {
  return (
    <section className="relative overflow-hidden">
      {/* ambient decor */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-neon/20 blur-[140px]" />
        <div className="absolute -left-24 top-40 h-56 w-56 rounded-full bg-cyanx/10 blur-[100px]" />
        <div className="absolute right-10 top-24 h-40 w-40 animate-float rounded-2xl border border-white/5 bg-ink-800/60 backdrop-blur-sm" />
        <div className="absolute right-32 top-64 h-24 w-24 animate-float rounded-xl border border-white/5 bg-ink-800/60 backdrop-blur-sm" style={{ animationDelay: '1.4s' }} />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-16 text-center md:pt-20">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neon/30 bg-neon/10 px-3.5 py-1.5 text-xs font-semibold text-neon-soft">
          <Sparkles className="h-3.5 w-3.5" />
          Your Digital World, One Platform.
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.12] tracking-tight md:text-6xl">
          LEVEL UP YOUR{' '}
          <span className="bg-gradient-to-r from-neon via-neon-bright to-cyanx bg-clip-text text-transparent">
            DIGITAL EXPERIENCE.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-400 md:text-lg">
          Semua kebutuhan top up game dan layanan digital dalam satu platform.
          Cepat, praktis, dan nyaman.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/kategori" className="btn-primary !px-7 !py-3 text-base">
            Jelajahi Produk <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/kategori?filter=TOPUP" className="btn-ghost !px-7 !py-3 text-base">Lihat Kategori</Link>
        </div>

        {/* trust strip */}
        <div className="mx-auto mt-12 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-zinc-500">
          {stats && stats.products > 0 && (
            <span className="flex items-center gap-1.5"><Package className="h-4 w-4 text-neon" />{stats.products} produk aktif</span>
          )}
          {stats && stats.categories > 0 && (
            <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-cyanx" />{stats.categories} kategori</span>
          )}
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400" />Pembayaran terverifikasi</span>
        </div>
      </div>
    </section>
  );
}

/* ---------- CATEGORY ---------- */
const catIcon: Record<string, JSX.Element> = {
  TOPUP: <Gamepad2 className="h-5 w-5 text-neon" />,
  SMM: <Share2 className="h-5 w-5 text-cyanx" />,
};

function Categories({ cats }: { cats: Category[] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-7 text-center">
        <h2 className="section-title">Explore Digital Categories</h2>
        <p className="mt-2 text-sm text-zinc-500">Pilih kategori favoritmu dan mulai transaksi</p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cats.map((c) => (
          <Link key={c.id} to={`/kategori/${c.slug}`}
            className="glass-card glass-card-hover group flex flex-col items-center gap-2 p-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-neon/20 to-cyanx/10 transition group-hover:scale-110">
              {catIcon[c.type] ?? <Package className="h-5 w-5 text-neon" />}
            </span>
            <span className="font-semibold text-white">{c.name}</span>
            <span className="text-xs text-zinc-500">{c._count.products} produk</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------- PRODUCT CARD ---------- */
export function ProductCard({ p }: { p: Product }) {
  return (
    <Link to={`/produk/${p.slug}`} className="glass-card glass-card-hover group flex flex-col p-5">
      <div className="mb-3 flex h-24 items-center justify-center rounded-xl bg-gradient-to-br from-ink-700 to-ink-850">
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} loading="lazy" className="h-full w-full rounded-xl object-cover" />
        ) : (
          <Gamepad2 className="h-9 w-9 text-neon/50 transition group-hover:text-neon" />
        )}
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{p.category.name}</span>
      <span className="mt-1 line-clamp-2 min-h-[2.5rem] font-semibold text-white group-hover:text-neon-soft">{p.name}</span>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-bold text-neon-soft">{rupiah(p.sellPrice)}</span>
        <span className="flex items-center gap-1 text-xs text-zinc-500 transition group-hover:text-neon">Lihat <ArrowRight className="h-3 w-3" /></span>
      </div>
    </Link>
  );
}

/* ---------- HOW IT WORKS ---------- */
const steps = [
  { n: '01', icon: <MousePointerClick className="h-5 w-5" />, t: 'Pilih Produk', d: 'Cari produk dari kategori favoritmu.' },
  { n: '02', icon: <ListChecks className="h-5 w-5" />, t: 'Masukkan Data Tujuan', d: 'User ID game atau tautan media sosial.' },
  { n: '03', icon: <CreditCard className="h-5 w-5" />, t: 'Pilih Pembayaran', d: 'QRIS, Virtual Account, atau e-wallet.' },
  { n: '04', icon: <ShieldCheck className="h-5 w-5" />, t: 'Selesaikan Pembayaran', d: 'Pembayaran diverifikasi gateway resmi.' },
  { n: '05', icon: <Zap className="h-5 w-5" />, t: 'Pantau Status', d: 'Ikuti progres pesanan hingga selesai.' },
];

function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-7 text-center">
        <h2 className="section-title">Cara Melakukan Transaksi</h2>
        <p className="mt-2 text-sm text-zinc-500">Lima langkah sederhana</p>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        {steps.map((s) => (
          <div key={s.n} className="glass-card glass-card-hover relative p-5">
            <span className="text-3xl font-extrabold text-neon/20">{s.n}</span>
            <div className="mt-2 text-neon">{s.icon}</div>
            <p className="mt-2.5 text-sm font-bold text-white">{s.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- REVIEWS (data nyata) ---------- */
function Reviews() {
  const { data } = useQuery({
    queryKey: ['reviews-random'],
    queryFn: async () => (await api.get('/reviews/featured')).data as { reviews: ReviewItem[] },
    retry: false,
  });
  const items = data?.reviews ?? [];
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-7 text-center">
        <h2 className="section-title">Apa Kata Mereka</h2>
        <p className="mt-2 text-sm text-zinc-500">Ulasan asli dari pelanggan yang transaksinya berhasil</p>
      </div>
      {items.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-3 p-10 text-center">
          <Star className="h-8 w-8 text-neon/40" />
          <p className="font-semibold text-white">Belum ada ulasan yang dipublikasikan</p>
          <p className="max-w-md text-sm text-zinc-500">
            Ulasan hanya ditampilkan dari pelanggan dengan transaksi yang benar-benar berhasil — bukan testimoni buatan.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((r) => (
            <div key={r.id} className="glass-card p-5">
              <div className="flex gap-0.5">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">"{r.comment ?? 'Transaksi lancar.'}"</p>
              <p className="mt-3 text-xs text-zinc-500">{r.name} · {r.product.name}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- FAQ ---------- */
const faqs = [
  { q: 'Bagaimana cara melakukan top up?', a: 'Pilih game atau kategori, pilih nominal, masukkan User ID (dan Zone/Server ID jika diminta), lalu checkout dan selesaikan pembayaran.' },
  { q: 'Bagaimana cara melakukan pembayaran?', a: 'Melalui payment gateway resmi: QRIS, Virtual Account bank, atau e-wallet — tergantung metode yang aktif di akun merchant kami.' },
  { q: 'Berapa lama pesanan diproses?', a: 'Top up game biasanya beberapa menit. Layanan media sosial mengikuti estimasi provider (0–24 jam) — estimasi tidak dijamin pasti.' },
  { q: 'Bagaimana cara mengecek pesanan?', a: 'Buka halaman Cek Pesanan, masukkan nomor pesanan. Untuk guest, sertakan email/token verifikasi yang diberikan saat checkout.' },
  { q: 'Apa yang harus dilakukan jika transaksi gagal?', a: 'Status dapat dipantau di Cek Pesanan. Kegagalan setelah pembayaran ditangani sesuai kebijakan refund — diproses manual dengan pencatatan penuh.' },
  { q: 'Bagaimana menghubungi customer support?', a: 'Email support@nexora.test dengan menyertakan nomor pesanan. Kami tidak pernah meminta password akun game atau media sosial Anda.' },
];

function FAQ() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-7 text-center">
        <h2 className="section-title">FAQ</h2>
        <p className="mt-2 text-sm text-zinc-500">Pertanyaan yang sering diajukan</p>
      </div>
      <div className="space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="glass-card group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-white">
              {f.q}
              <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 transition group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ---------- PAGE ---------- */
export default function LandingPage() {
  const { data: catsData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data.categories as Category[],
  });
  const { data: prodData, isLoading } = useQuery({
    queryKey: ['products', 'home'],
    queryFn: async () => (await api.get('/products', { params: { perPage: 8, sort: 'price_asc' } })).data as { products: Product[] },
  });

  const cats = (catsData ?? []).slice(0, 8);
  const stats = catsData ? { products: catsData.reduce((a, c) => a + c._count.products, 0), categories: catsData.length } : null;

  return (
    <div>
      <Hero stats={stats} />

      {/* trust indicators non-numerik + status provider */}
      <TrustStrip />

      {cats.length > 0 && <Categories cats={cats} />}

      {/* Trending */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <h2 className="section-title">Trending Products</h2>
            <p className="mt-2 text-sm text-zinc-500">Paling banyak dicari pelanggan</p>
          </div>
          <Link to="/kategori" className="hidden items-center gap-1 text-sm font-medium text-neon hover:underline sm:flex">
            Lihat semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-60" />)}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(prodData?.products ?? []).map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      {/* Promo banner */}
      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="relative overflow-hidden rounded-3xl border border-neon/20 bg-gradient-to-r from-ink-800 via-ink-850 to-ink-900 p-8 md:p-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-neon/25 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-10 left-10 h-32 w-32 rounded-full bg-cyanx/10 blur-[70px]" />
          <div className="relative flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon-soft">Promo & Penawaran</p>
              <h3 className="mt-2 text-2xl font-extrabold text-white md:text-3xl">Your Favorite Games. Better Deals.</h3>
              <p className="mt-2 max-w-md text-sm text-zinc-400">Harga kompetitif dari katalog provider resmi — diperbarui berkala oleh tim kami.</p>
            </div>
            <Link to="/kategori?filter=TOPUP" className="btn-primary shrink-0 !px-7 !py-3">Mulai Sekarang <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-7 text-center">
          <h2 className="section-title">Why Choose NEXORA</h2>
          <p className="mt-2 text-sm text-zinc-500">Keunggulan yang bekerja untuk Anda</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: <MousePointerClick className="h-5 w-5 text-neon" />, t: 'Pemesanan Praktis', d: 'Alur pemesanan singkat: pilih produk, isi tujuan, bayar.' },
            { icon: <Package className="h-5 w-5 text-cyanx" />, t: 'Pilihan Produk Digital', d: 'Katalog top up game & layanan sosmed dari provider resmi.' },
            { icon: <CreditCard className="h-5 w-5 text-neon-soft" />, t: 'Pembayaran Lengkap', d: 'QRIS, Virtual Account, e-wallet — sesuai metode aktif merchant.' },
            { icon: <ListChecks className="h-5 w-5 text-emerald-400" />, t: 'Status Transparan', d: 'Pantau setiap tahap pesanan dari riwayat status nyata.' },
            { icon: <ShieldCheck className="h-5 w-5 text-neon" />, t: 'Aman & Terverifikasi', d: 'Webhook bertanda tangan kriptografi; tanpa data kartu disimpan.' },
            { icon: <Search className="h-5 w-5 text-cyanx" />, t: 'Dukungan Pelanggan', d: 'Bantuan lewat email dengan nomor pesanan sebagai referensi.' },
          ].map((f) => (
            <div key={f.t} className="glass-card glass-card-hover p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">{f.icon}</span>
              <p className="mt-3 font-bold text-white">{f.t}</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <HowItWorks />
      <Reviews />
      <FAQ />
    </div>
  );
}

/* ---------- TRUST STRIP (provider status + pengguna, non-numerik) ---------- */
function TrustStrip() {
  const { data: status } = useQuery({
    queryKey: ['status'],
    queryFn: async () => (await api.get('/status')).data as { providers: { code: string; name: string }[]; mode: string },
  });
  const { data: catsData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data.categories as Category[],
  });
  void catsData;
  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="glass-card flex flex-wrap items-center justify-center gap-x-6 gap-y-3 px-6 py-4 text-sm">
        {(status?.providers ?? []).map((p) => (
          <span key={p.code} className="flex items-center gap-1.5 text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{p.name}
          </span>
        ))}
        <span className="text-xs text-zinc-600">
          Mode: {status?.mode === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'}
        </span>
      </div>
    </section>
  );
}
