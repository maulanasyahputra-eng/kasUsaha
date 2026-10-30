import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Gamepad2, Share2, ShieldCheck, Zap } from "lucide-react";
import { api } from "../lib/api";
import { Section, Skeleton, rupiah } from "../components/ui";

interface Product {
  id: string;
  slug: string;
  name: string;
  sellPrice: number;
  type: string;
  category: { slug: string; name: string };
}
interface Category {
  id: string;
  slug: string;
  name: string;
  type: string;
  _count: { products: number };
}

export default function LandingPage() {
  const [params] = useSearchParams();
  const filter = params.get("filter") ?? "";

  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn: async () =>
      (await api.get("/categories")).data.categories as Category[],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["products", "home", filter],
    queryFn: async () =>
      (
        await api.get("/products", {
          params: { perPage: 9, type: filter || undefined },
        })
      ).data as { products: Product[] },
  });

  const { data: status } = useQuery({
    queryKey: ["status"],
    queryFn: async () =>
      (await api.get("/status")).data as {
        providers: { code: string; name: string }[];
        mode: string;
      },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 text-center">
          <span className="badge border border-neon/30 bg-neon/10 text-neon-soft">
            One Platform. Endless Digital Possibilities.
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold leading-tight text-white md:text-5xl">
            Semua Kebutuhan Digital,{" "}
            <span className="bg-gradient-to-r from-neon to-cyanx bg-clip-text text-transparent">
              Satu Platform.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Top up game, pesan layanan digital, dan pantau transaksi dalam satu
            dashboard yang mudah digunakan.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/kategori?filter=TOPUP" className="btn-primary">
              <Zap className="h-4 w-4" />
              Mulai Sekarang
            </Link>
            <Link to="/kategori" className="btn-ghost">
              Jelajahi Produk
            </Link>
          </div>
        </div>
      </section>

      {/* Kategori */}
      <Section
        title="Kategori Produk"
        subtitle="Semua produk berasal dari katalog backend — bukan hardcode."
      >
        <div className="flex flex-wrap gap-3">
          {(cats ?? []).map((c) => (
            <Link
              key={c.id}
              to={`/kategori/${c.slug}`}
              className="glass-card glass-card-hover flex items-center gap-3 px-4 py-3 text-sm"
            >
              {c.type === "TOPUP" ? (
                <Gamepad2 className="h-4 w-4 text-neon" />
              ) : (
                <Share2 className="h-4 w-4 text-cyanx" />
              )}
              <span className="text-slate-200">{c.name}</span>
              <span className="text-xs text-slate-500">
                {c._count.products} produk
              </span>
            </Link>
          ))}
          {!cats && <Skeleton count={3} />}
        </div>
      </Section>

      {/* Produk populer */}
      <Section
        title={
          filter === "SMM"
            ? "Layanan Media Sosial Populer"
            : "Game & Produk Populer"
        }
        action={
          <Link to="/kategori" className="text-sm text-neon hover:underline">
            Lihat semua
          </Link>
        }
      >
        {isLoading ? (
          <Skeleton />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.products ?? []).map((p) => (
              <Link
                key={p.id}
                to={`/produk/${p.slug}`}
                className="glass-card glass-card-hover flex flex-col gap-1 p-5"
              >
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  {p.category.name}
                </span>
                <span className="font-medium text-white">{p.name}</span>
                <span className="mt-2 text-neon">{rupiah(p.sellPrice)}</span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* Keunggulan */}
      <Section title="Keunggulan Platform">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: <Zap className="h-5 w-5 text-neon" />,
              t: "Pemrosesan Otomatis",
              d: "Order diproses ke provider otomatis setelah pembayaran terverifikasi.",
            },
            {
              icon: <ShieldCheck className="h-5 w-5 text-cyanx" />,
              t: "Pembayaran Aman",
              d: "Verifikasi webhook & nominal melalui payment gateway resmi.",
            },
            {
              icon: <Search className="h-5 w-5 text-neon-soft" />,
              t: "Transparan",
              d: "Riwayat status pesanan dan ledger saldo dapat dipantau kapan saja.",
            },
          ].map((f) => (
            <div key={f.t} className="glass-card glass-card-hover p-6">
              {f.icon}
              <p className="mt-3 font-semibold text-white">{f.t}</p>
              <p className="mt-1 text-sm text-slate-400">{f.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Status provider */}
      <Section title="Status Layanan Provider">
        <div className="glass-card p-5">
          <div className="flex flex-wrap items-center gap-4">
            {(status?.providers ?? []).map((p) => (
              <span
                key={p.code}
                className="badge bg-emerald-500/15 text-emerald-300"
              >
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {p.name}
              </span>
            ))}
            <span className="text-xs text-slate-500">
              Mode sistem:{" "}
              {status?.mode === "production"
                ? "PRODUCTION"
                : "DEVELOPMENT/SIMULASI"}
              {status?.mode !== "production" &&
                " — transaksi simulasi, bukan transaksi nyata."}
            </span>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section title="FAQ">
        <div className="space-y-3">
          {[
            {
              q: "Berapa lama pesanan diproses?",
              a: "Top up game biasanya beberapa menit; layanan media sosial mengikuti estimasi provider (0–24 jam, tidak dijamin pasti).",
            },
            {
              q: "Apakah ID game saya divalidasi otomatis?",
              a: "Validasi bergantung pada dukungan provider. Jika provider tidak menyediakan endpoint validasi akun, pastikan ID benar sebelum membayar.",
            },
            {
              q: "Bagaimana jika pesanan gagal?",
              a: "Status pesanan dapat dipantau di halaman Cek Pesanan. Kegagalan ditangani sesuai kebijakan refund — bukan otomatis.",
            },
          ].map((f) => (
            <details key={f.q} className="glass-card group p-5">
              <summary className="cursor-pointer list-none font-medium text-white">
                {f.q}
              </summary>
              <p className="mt-2 text-sm text-slate-400">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>
    </div>
  );
}
