import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiErrorMessage } from '../../lib/api';
import { Section, Skeleton, EmptyState, StatusBadge, Toast } from '../../components/ui';
import { ImagePlus, Trash2, Pencil, Eye } from 'lucide-react';

interface BannerRow {
  id: string; title: string; subtitle: string | null; image: string;
  buttonText: string | null; buttonUrl: string | null; sortOrder: number;
  isActive: boolean; startAt: string | null; endAt: string | null;
}

const EMPTY = { title: '', subtitle: '', buttonText: '', buttonUrl: '', sortOrder: 0, isActive: true, startAt: '', endAt: '' };

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 16);
}

export default function AdminBanners() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<{ id?: string; title: string; subtitle: string; buttonText: string; buttonUrl: string; sortOrder: number; isActive: boolean; startAt: string; endAt: string }>({ ...EMPTY });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => (await api.get('/banners/admin/all')).data as { banners: BannerRow[] },
  });

  const reset = () => { setEditing({ ...EMPTY }); setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; };

  const save = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('title', editing.title);
      if (editing.subtitle) fd.append('subtitle', editing.subtitle);
      if (editing.buttonText) fd.append('buttonText', editing.buttonText);
      if (editing.buttonUrl) fd.append('buttonUrl', editing.buttonUrl);
      fd.append('sortOrder', String(editing.sortOrder));
      fd.append('isActive', String(editing.isActive));
      if (editing.startAt) fd.append('startAt', new Date(editing.startAt).toISOString());
      if (editing.endAt) fd.append('endAt', new Date(editing.endAt).toISOString());
      if (file) fd.append('image', file);
      if (editing.id) {
        const cur = data?.banners.find((b) => b.id === editing.id);
        if (!file && cur) fd.append('keepImage', cur.image);
        return (await api.patch(`/banners/admin/${editing.id}`, fd)).data;
      }
      return (await api.post('/banners/admin', fd)).data;
    },
    onSuccess: () => {
      setToast({ msg: editing.id ? 'Banner diperbarui.' : 'Banner dibuat.', type: 'success' });
      reset();
      qc.invalidateQueries({ queryKey: ['admin-banners'] });
      qc.invalidateQueries({ queryKey: ['banners-active'] });
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: 'error' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/banners/admin/${id}`)).data,
    onSuccess: () => { setToast({ msg: 'Banner dihapus.', type: 'success' }); qc.invalidateQueries({ queryKey: ['admin-banners'] }); },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: 'error' }),
  });

  const toggle = useMutation({
    mutationFn: async (b: BannerRow) => {
      const fd = new FormData();
      fd.append('isActive', String(!b.isActive));
      fd.append('keepImage', b.image);
      return (await api.patch(`/banners/admin/${b.id}`, fd)).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-banners'] }),
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: 'error' }),
  });

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)) {
      setToast({ msg: 'Format harus JPG/PNG/WebP/GIF.', type: 'error' }); return;
    }
    if (f.size > 3 * 1024 * 1024) { setToast({ msg: 'Ukuran maksimal 3MB.', type: 'error' }); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const startEdit = (b: BannerRow) => {
    setEditing({
      id: b.id, title: b.title, subtitle: b.subtitle ?? '', buttonText: b.buttonText ?? '',
      buttonUrl: b.buttonUrl ?? '', sortOrder: b.sortOrder, isActive: b.isActive,
      startAt: toLocalInput(b.startAt), endAt: toLocalInput(b.endAt),
    });
    setPreview(b.image);
    setFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isEditing = Boolean(editing.id);

  return (
    <Section title="Manajemen Banner Promosi" subtitle="Banner aktif & dalam periode tampil otomatis di homepage storefront.">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Form */}
      <div className="glass-card mb-8 grid gap-4 p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="flex items-center gap-2 text-sm font-bold text-white">
            <ImagePlus className="h-4 w-4 text-neon" />
            {isEditing ? 'Edit Banner' : 'Banner Baru'}
          </p>
        </div>

        <div>
          <label className="label">Judul *</label>
          <input className="input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Diskon Gajian!" />
        </div>
        <div>
          <label className="label">Deskripsi</label>
          <input className="input" value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} placeholder="Top up lebih hemat..." />
        </div>
        <div>
          <label className="label">Teks Tombol</label>
          <input className="input" value={editing.buttonText} onChange={(e) => setEditing({ ...editing, buttonText: e.target.value })} placeholder="Top Up Sekarang" />
        </div>
        <div>
          <label className="label">Link Tujuan (URL atau path /)</label>
          <input className="input" value={editing.buttonUrl} onChange={(e) => setEditing({ ...editing, buttonUrl: e.target.value })} placeholder="/kategori?filter=TOPUP" />
        </div>
        <div>
          <label className="label">Mulai</label>
          <input className="input" type="datetime-local" value={editing.startAt} onChange={(e) => setEditing({ ...editing, startAt: e.target.value })} />
        </div>
        <div>
          <label className="label">Berakhir</label>
          <input className="input" type="datetime-local" value={editing.endAt} onChange={(e) => setEditing({ ...editing, endAt: e.target.value })} />
        </div>
        <div>
          <label className="label">Urutan tampil</label>
          <input className="input" type="number" min={0} value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} className="h-4 w-4 accent-[#8B5CF6]" />
            Aktif
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="label">Gambar banner * (JPG/PNG/WebP/GIF, maks 3MB, rekomendasi 1200×400)</label>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)} className="input !py-2 text-xs" />
          {(preview || (!file && editing.id)) && (
            <div className="mt-3">
              <p className="mb-1 flex items-center gap-1 text-xs text-zinc-500"><Eye className="h-3 w-3" />Preview:</p>
              <img src={preview ?? (editing.id ? data?.banners.find((b) => b.id === editing.id)?.image : '')} alt="preview"
                className="h-32 w-full max-w-md rounded-xl border border-white/10 object-cover" />
            </div>
          )}
        </div>

        <div className="flex gap-2 md:col-span-2">
          <button className="btn-primary !py-2 text-xs" disabled={save.isPending || !editing.title || (!file && !isEditing)} onClick={() => save.mutate()}>
            {save.isPending ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Banner'}
          </button>
          {isEditing && <button className="btn-ghost !py-2 text-xs" onClick={reset}>Batal Edit</button>}
        </div>
      </div>

      {/* Tabel */}
      {isLoading ? <Skeleton /> : (data?.banners ?? []).length === 0 ? (
        <EmptyState title="Belum ada banner" subtitle="Buat banner pertama untuk ditampilkan di homepage." />
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-zinc-400">
              <tr><th className="p-3">Thumbnail</th><th className="p-3">Judul</th><th className="p-3">Periode</th>
                <th className="p-3">Urutan</th><th className="p-3">Status</th><th className="p-3">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(data!.banners).map((b) => (
                <tr key={b.id}>
                  <td className="p-3"><img src={b.image} alt={b.title} className="h-10 w-24 rounded-lg object-cover" /></td>
                  <td className="p-3">
                    <p className="font-medium text-white">{b.title}</p>
                    {b.subtitle && <p className="text-xs text-zinc-500">{b.subtitle}</p>}
                  </td>
                  <td className="p-3 text-xs text-zinc-400">
                    {b.startAt ? new Date(b.startAt).toLocaleDateString('id-ID') : '∞'} — {b.endAt ? new Date(b.endAt).toLocaleDateString('id-ID') : '∞'}
                  </td>
                  <td className="p-3">{b.sortOrder}</td>
                  <td className="p-3"><StatusBadge status={b.isActive ? 'SUCCESS' : 'FAILED'} /></td>
                  <td className="p-3">
                    <div className="flex gap-1.5">
                      <button className="btn-ghost !p-1.5" onClick={() => startEdit(b)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                      <button className="btn-ghost !py-1.5 text-xs" onClick={() => toggle.mutate(b)}>
                        {b.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button className="btn-danger !p-1.5" onClick={() => { if (confirm(`Hapus banner "${b.title}"?`)) remove.mutate(b.id); }} aria-label="Hapus">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
