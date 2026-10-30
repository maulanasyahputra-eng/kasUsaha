import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { api } from "../lib/api";
import { Section, Skeleton, EmptyState, rupiah } from "../components/ui";

interface Product {
  id: string;
  slug: string;
  name: string;
  sellPrice: number;
  type: string;
  description?: string;
  minOrder?: number;
  maxOrder?: number;
  category: { slug: string; name: string };
}
interface Category {
  id: string;
  slug: string;
  name: string;
  type: string;
}

export default function CatalogPage() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const filter = params.get("filter") ?? "";
  const [search, setSearch] = useState("");

  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn: async () =>
      (await api.get("/categories")).data.categories as Category[],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["products", slug, filter, search],
    queryFn: async () =>
      (
        await api.get("/products", {
          params: {
            category: slug,
            type: filter || undefined,
            search: search || undefined,
            perPage: 50,
          },
        })
      ).data as { products: Product[] },
  });

  return (
    <Section
      title={
        slug
          ? (cats?.find((c) => c.slug === slug)?.name ?? "Katalog")
          : filter === "SMM"
            ? "Layanan Media Sosial"
            : "Top Up Game"
      }
      subtitle="Harga dihitung ulang oleh server saat checkout."
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9"
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari produk"
          />
        </div>
        <div className="flex gap-2">
          <button
            className={`btn-ghost !py-2 text-xs ${!filter ? "!border-neon/50 !text-white" : ""}`}
            onClick={() => setParams({})}
          >
            Semua
          </button>
          <button
            className={`btn-ghost !py-2 text-xs ${filter === "TOPUP" ? "!border-neon/50 !text-white" : ""}`}
            onClick={() => setParams({ filter: "TOPUP" })}
          >
            Top Up
          </button>
          <button
            className={`btn-ghost !py-2 text-xs ${filter === "SMM" ? "!border-neon/50 !text-white" : ""}`}
            onClick={() => setParams({ filter: "SMM" })}
          >
            SMM
          </button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton count={6} />
      ) : (data?.products ?? []).length === 0 ? (
        <EmptyState
          title="Produk tidak ditemukan"
          subtitle="Coba kata kunci atau kategori lain."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data!.products.map((p) => (
            <Link
              key={p.id}
              to={`/produk/${p.slug}`}
              className="glass-card glass-card-hover flex flex-col gap-1.5 p-5"
            >
              <span className="text-xs uppercase tracking-wide text-slate-500">
                {p.category.name}
              </span>
              <span className="font-medium text-white">{p.name}</span>
              {p.type === "SMM" && p.minOrder != null && (
                <span className="text-xs text-slate-500">
                  Min {p.minOrder?.toLocaleString("id-ID")} · Maks{" "}
                  {p.maxOrder?.toLocaleString("id-ID")}
                </span>
              )}
              <span className="mt-2 text-neon">
                {rupiah(p.sellPrice)}
                {p.type === "SMM" && (
                  <span className="text-xs text-slate-500"> /unit</span>
                )}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Section>
  );
}
