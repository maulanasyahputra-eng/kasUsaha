import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../lib/api";
import { Section, Skeleton, rupiah, Toast } from "../components/ui";
import { useAuth } from "../hooks/useAuth";

interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  type: string;
  description?: string;
  sellPrice: number;
  requiresZoneId: boolean;
  minOrder?: number;
  maxOrder?: number;
  avgTime?: string;
  category: { name: string };
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userIdInput, setUserIdInput] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [quantity, setQuantity] = useState(1000);
  const [contactEmail, setContactEmail] = useState("");
  const [toast, setToast] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () =>
      (await api.get(`/products/${slug}`)).data.product as ProductDetail,
  });

  const idempotencyKey = useMemo(
    () =>
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`,
    [],
  );

  const createOrder = useMutation({
    mutationFn: async () => {
      const res = await api.post("/orders", {
        productId: data!.id,
        kind: data!.type === "SMM" ? "SMM" : "TOPUP",
        quantity: data!.type === "SMM" ? quantity : 1,
        accountInput: userIdInput,
        accountInput2: data!.requiresZoneId ? zoneId : undefined,
        contactEmail: contactEmail || undefined,
        idempotencyKey,
      });
      return res.data.order as { id: string; guestToken?: string };
    },
    onSuccess: (order) => {
      if (order.guestToken)
        localStorage.setItem(`guest_${order.id}`, order.guestToken);
      navigate(`/checkout/${order.id}`);
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });

  if (isLoading || !data)
    return (
      <Section title="Memuat...">
        <Skeleton count={2} />
      </Section>
    );

  const qty = data.type === "SMM" ? quantity : 1;
  const total = data.sellPrice * qty;

  return (
    <Section title={data.name} subtitle={data.category.name}>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="glass-card space-y-5 p-6">
          {data.type === "SMM" ? (
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">
                Link / Username tujuan
              </label>
              <input
                className="input"
                placeholder="https://... atau @username"
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
              />
              <label className="mb-1.5 mt-4 block text-sm text-slate-300">
                Jumlah ({(data.minOrder ?? 0).toLocaleString("id-ID")} –{" "}
                {(data.maxOrder ?? 0).toLocaleString("id-ID")})
              </label>
              <input
                className="input"
                type="number"
                min={data.minOrder}
                max={data.maxOrder}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
              <p className="mt-2 text-xs text-slate-500">
                Estimasi: {data.avgTime ?? "mengikuti provider"}. Estimasi tidak
                dijamin pasti; engagement dapat menurun (risiko provider).
              </p>
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">
                User ID
              </label>
              <input
                className="input"
                placeholder="Masukkan User ID"
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
              />
              {data.requiresZoneId && (
                <>
                  <label className="mb-1.5 mt-4 block text-sm text-slate-300">
                    Zone / Server ID
                  </label>
                  <input
                    className="input"
                    placeholder="Masukkan Zone ID"
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                  />
                </>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Validasi otomatis ID bergantung dukungan provider. Pastikan ID
                benar sebelum membayar.
              </p>
            </div>
          )}
          {!user && (
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">
                Email kontak (untuk verifikasi guest checkout)
              </label>
              <input
                className="input"
                type="email"
                placeholder="email@contoh.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="glass-card h-fit space-y-4 p-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Harga satuan</span>
            <span>{rupiah(data.sellPrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Jumlah</span>
            <span>{qty.toLocaleString("id-ID")}</span>
          </div>
          <hr className="border-white/10" />
          <div className="flex justify-between font-semibold text-white">
            <span>Total</span>
            <span className="text-neon">{rupiah(total)}</span>
          </div>
          <p className="text-xs text-slate-500">
            Harga final dihitung ulang oleh server saat pembuatan pesanan.
          </p>
          <button
            className="btn-primary w-full"
            disabled={!userIdInput || createOrder.isPending}
            onClick={() => createOrder.mutate()}
          >
            {createOrder.isPending ? "Memproses..." : "Buat Pesanan"}
          </button>
        </div>
      </div>
    </Section>
  );
}
