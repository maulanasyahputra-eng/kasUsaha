import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import {
  Section,
  Skeleton,
  EmptyState,
  StatusBadge,
  Toast,
} from "../../components/ui";
import { Star } from "lucide-react";

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  createdAt: string;
  user: { email: string };
  product: { name: string };
}

export default function AdminReviews() {
  const [toast, setToast] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () =>
      (await api.get("/reviews/admin/all")).data as { reviews: ReviewRow[] },
  });
  const moderate = useMutation({
    mutationFn: async (p: { id: string; status: string }) =>
      (await api.patch(`/reviews/admin/${p.id}`, { status: p.status })).data,
    onSuccess: () => {
      setToast({ msg: "Status ulasan diperbarui.", type: "success" });
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });

  return (
    <Section
      title="Moderasi Ulasan"
      subtitle="Hanya ulasan PUBLISHED yang tampil di storefront. Semua aksi tercatat di audit log."
    >
      {toast && <Toast message={toast.msg} type={toast.type} />}
      {isLoading ? (
        <Skeleton />
      ) : (data?.reviews ?? []).length === 0 ? (
        <EmptyState
          title="Belum ada ulasan"
          subtitle="Ulasan muncul setelah pelanggan memberi rating pada pesanan yang berhasil."
        />
      ) : (
        <div className="space-y-3">
          {data!.reviews.map((r) => (
            <div
              key={r.id}
              className="glass-card flex flex-wrap items-center justify-between gap-3 p-5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-1.5 text-sm text-zinc-300">
                  "{r.comment ?? "-"}"
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {r.user.email} · {r.product.name} ·{" "}
                  {new Date(r.createdAt).toLocaleDateString("id-ID")}
                </p>
              </div>
              <div className="flex gap-2">
                {r.status !== "PUBLISHED" && (
                  <button
                    className="btn-primary !py-1.5 text-xs"
                    onClick={() =>
                      moderate.mutate({ id: r.id, status: "PUBLISHED" })
                    }
                  >
                    Publikasikan
                  </button>
                )}
                {r.status !== "REJECTED" && (
                  <button
                    className="btn-danger !py-1.5 text-xs"
                    onClick={() =>
                      moderate.mutate({ id: r.id, status: "REJECTED" })
                    }
                  >
                    Tolak
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
