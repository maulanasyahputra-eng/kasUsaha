import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiErrorMessage } from '../../lib/api';
import { Section, Skeleton, EmptyState, Toast } from '../../components/ui';
import { RefreshCcw, Puzzle } from 'lucide-react';

interface ProviderRow { id: string; code: string; name: string; isActive: boolean; configured: boolean; connStatus?: string; _count: { products: number; transactions: number } }

export default function AdminSync() {
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-providers'],
    queryFn: async () => (await api.get('/admin/providers')).data as { providers: ProviderRow[] },
  });
  const sync = useMutation({
    mutationFn: async (code: string) => {
      if (code === 'DIGIFLAZZ') return (await api.post('/admin/sync/digiflazz')).data;
      throw new Error('Sinkronisasi otomatis untuk provider ini belum tersedia — gunakan mapping manual di menu Produk.');
    },
    onSuccess: (r) => { setToast({ msg: `Sinkronisasi selesai: ${JSON.stringify(r)}`, type: 'success' }); qc.invalidateQueries(); },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: 'error' }),
  });

  return (
    <Section title="Product Sync" subtitle="Tarik katalog terbaru dari provider ke produk internal. Harga jual admin dipertahankan.">
      {toast && <Toast message={toast.msg} type={toast.type} />}
      {isLoading ? <Skeleton /> : (data?.providers ?? []).length === 0 ? (
        <EmptyState title="Belum ada provider terdaftar" />
      ) : (
        <div className="space-y-4">
          {(data!.providers).map((p) => (
            <div key={p.id} className="glass-card flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon/15"><Puzzle className="h-5 w-5 text-neon" /></span>
                <div>
                  <p className="font-semibold text-white">{p.name} <span className="text-xs text-zinc-500">({p.code})</span></p>
                  <p className="text-xs text-zinc-500">{p._count.products} produk · {p._count.transactions} transaksi · {p.isActive ? 'aktif' : 'nonaktif'}{p.connStatus ? ` · ${p.connStatus}` : ''}</p>
                </div>
              </div>
              <button className="btn-primary !py-2 text-xs" disabled={sync.isPending || !p.isActive}
                onClick={() => sync.mutate(p.code)}>
                <RefreshCcw className={`h-3.5 w-3.5 ${sync.isPending ? 'animate-spin' : ''}`} />
                Sinkronkan Produk
              </button>
            </div>
          ))}
          <p className="text-xs text-zinc-500">
            Sinkronisasi menambah/memperbarui produk &amp; harga modal dari provider. Harga jual yang sudah Anda tetapkan tidak berubah otomatis; produk yang tidak tersedia lagi dinonaktifkan, bukan dihapus.
          </p>
        </div>
      )}
    </Section>
  );
}
