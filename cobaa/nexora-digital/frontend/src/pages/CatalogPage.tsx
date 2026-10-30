import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { Skeleton, EmptyState, rupiah } from '../components/ui';
import { ProductCard } from './LandingPage';

interface Product {
  id: string; slug: string; name: string; sellPrice: number; type: string;
  isActive: boolean; imageUrl?: string | null;
  category: { slug: string; name: string };
}
interface Category { id: string; slug: string; name: string; type: string; _count: { products: number } }

const sortOptions = [
  { value: '', label: 'Populer' },
  { value: 'price_asc', label: 'Harga Termurah' },
  { value: 'price_desc', label: 'Harga Tertinggi' },
];

export default function CatalogPage() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const filter = params.get('filter') ?? '';
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: cats } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data.categories as Category[],
  });

  const priceQ = (minPrice || maxPrice)
    ? `&minPrice=${minPrice || 0}&maxPrice=${maxPrice || 99999999}` : '';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', slug, filter, debounced, sort, page, minPrice, maxPrice],
    queryFn: async () => (await api.get(`/products?page=${page}&perPage=12&category=${slug || ''}&type=${filter || ''}&search=${encodeURIComponent(debounced)}&sort=${sort}${priceQ}`)).data as
      { products: Product[]; pagination: { page: number; totalPages: number; total: number } },
    retry: 1,
  });

  const activeCats = (cats ?? []).filter((c) => !filter || c.type === filter);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          {slug ? (cats?.find((c) => c.slug === slug)?.name ?? 'Katalog')
            : filter === 'SMM' ? 'Layanan Media Sosial' : filter === 'TOPUP' ? 'Top Up Game' : 'Semua Produk'}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {data ? `${data.pagination.total} produk` : 'Memuat...'} · Harga final dihitung server saat checkout
        </p>
      </div>

      {/* Category chips */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <Link to="/kategori" className={`chip whitespace-nowrap ${!slug && !filter ? 'chip-active' : ''}`}>Semua</Link>
        <Link to="/kategori?filter=TOPUP" className={`chip whitespace-nowrap ${filter === 'TOPUP' ? 'chip-active' : ''}`}>🎮 Top Up</Link>
        <Link to="/kategori?filter=SMM" className={`chip whitespace-nowrap ${filter === 'SMM' ? 'chip-active' : ''}`}>📱 Sosmed</Link>
        {activeCats.map((c) => (
          <Link key={c.id} to={`/kategori/${c.slug}`} className={`chip whitespace-nowrap ${slug === c.slug ? 'chip-active' : ''}`}>
            {c.name}
          </Link>
        ))}
      </div>

      {/* Toolbar */}
      <div className="glass-card mb-6 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input className="input pl-9" placeholder="Cari produk..." value={search}
            onChange={(e) => setSearch(e.target.value)} aria-label="Cari produk" />
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost !py-2 text-xs lg:hidden" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-3.5 w-3.5" />Filter
          </button>
          <select className="input !w-auto !py-2 text-xs" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} aria-label="Urutkan">
            {sortOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="glass-card mb-6 grid gap-3 p-4 sm:grid-cols-3">
          <div>
            <label className="label !text-xs">Harga minimum</label>
            <input className="input !py-2 text-sm" type="number" min={0} placeholder="0"
              value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="label !text-xs">Harga maksimum</label>
            <input className="input !py-2 text-sm" type="number" min={0} placeholder="Tanpa batas"
              value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} />
          </div>
          <div className="flex items-end">
            <button className="btn-ghost !py-2 text-xs" onClick={() => { setMinPrice(''); setMaxPrice(''); }}>
              <X className="h-3.5 w-3.5" />Reset Filter
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-60" />)}
        </div>
      ) : isError ? (
        <EmptyState title="Gagal memuat produk" subtitle="Periksa koneksi lalu coba lagi." />
      ) : (data?.products ?? []).length === 0 ? (
        <EmptyState title="Produk tidak ditemukan" subtitle="Coba kata kunci, kategori, atau rentang harga lain." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data!.products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
          {data!.pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button className="btn-ghost !p-2" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Sebelumnya">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-sm text-zinc-400">Hal {page} / {data!.pagination.totalPages}</span>
              <button className="btn-ghost !p-2" disabled={page >= data!.pagination.totalPages} onClick={() => setPage(page + 1)} aria-label="Berikutnya">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
