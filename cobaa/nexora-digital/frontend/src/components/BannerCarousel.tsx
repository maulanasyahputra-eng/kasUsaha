import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';
import { api } from '../lib/api';

interface Banner {
  id: string; title: string; subtitle: string | null;
  image: string; buttonText: string | null; buttonUrl: string | null;
}

/** Carousel banner promosi dinamis dari DB — hanya banner aktif & dalam periode. */
export default function BannerCarousel() {
  const { data, isLoading } = useQuery({
    queryKey: ['banners-active'],
    queryFn: async () => (await api.get('/banners')).data as { banners: Banner[] },
    refetchInterval: 60000,
  });
  const banners = data?.banners ?? [];
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => { if (idx >= banners.length) setIdx(0); }, [banners.length, idx]);
  useEffect(() => {
    if (banners.length < 2 || paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length, paused]);

  if (isLoading) {
    return <div className="mx-auto max-w-6xl px-4 py-6"><div className="skeleton h-48 md:h-56" /></div>;
  }
  if (banners.length === 0) return null; // sembunyikan rapi — tanpa banner demo

  const go = (d: number) => setIdx((i) => (i + d + banners.length) % banners.length);
  const b = banners[idx];
  const isInternal = b.buttonUrl?.startsWith('/');

  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <div
        className="group relative overflow-hidden rounded-3xl border border-neon/25 shadow-glow-sm transition-shadow hover:shadow-glow"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) go(dx > 0 ? -1 : 1);
          touchX.current = null;
        }}
        role="region"
        aria-label="Banner promosi"
      >
        <div className="relative h-52 md:h-60">
          {banners.map((bn, i) => (
            <img
              key={bn.id}
              src={bn.image}
              alt={bn.title}
              loading={i === 0 ? 'eager' : 'lazy'}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          {/* gradient overlay untuk keterbacaan */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/55 to-transparent" />

          {/* Caption */}
          <div className="absolute inset-0 flex flex-col justify-center gap-2 p-7 md:p-10">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-cyanx/40 bg-cyanx/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-cyanx">
              <Megaphone className="h-3 w-3" />Promosi
            </span>
            <h3 className="max-w-lg text-xl font-extrabold leading-tight text-white md:text-3xl">{b.title}</h3>
            {b.subtitle && <p className="max-w-md text-sm text-zinc-300 md:text-base">{b.subtitle}</p>}
            {b.buttonUrl && (
              isInternal ? (
                <Link to={b.buttonUrl} className="btn-primary mt-2 w-fit !px-5 !py-2 text-xs">{b.buttonText ?? 'Lihat'}</Link>
              ) : (
                <a href={b.buttonUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-2 w-fit !px-5 !py-2 text-xs">{b.buttonText ?? 'Lihat'}</a>
              )
            )}
          </div>

          {/* Nav arrows */}
          {banners.length > 1 && (
            <>
              <button onClick={() => go(-1)} aria-label="Sebelumnya"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-ink-950/60 p-2 text-white opacity-0 transition group-hover:opacity-100">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => go(1)} aria-label="Berikutnya"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-ink-950/60 p-2 text-white opacity-0 transition group-hover:opacity-100">
                <ChevronRight className="h-4 w-4" />
              </button>
              {/* indicators */}
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {banners.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)} aria-label={`Slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-neon' : 'w-1.5 bg-white/40'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
