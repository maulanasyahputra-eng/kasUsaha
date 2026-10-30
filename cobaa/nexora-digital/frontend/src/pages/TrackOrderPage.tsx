import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../lib/api";
import { Section, StatusBadge, rupiah, Toast } from "../components/ui";

interface TrackResult {
  orderNo: string;
  product: string;
  status: string;
  fulfillment: string;
  priceTotal: number;
  createdAt: string;
  failReason?: string;
  history: {
    field: string;
    to: string | null;
    note: string | null;
    at: string;
  }[];
}

export default function TrackOrderPage() {
  const [orderNo, setOrderNo] = useState("");
  const [verification, setVerification] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState("");

  const track = useMutation({
    mutationFn: async () =>
      (
        await api.post("/orders/track", {
          orderNo,
          verification: verification || undefined,
        })
      ).data.order as TrackResult,
    onSuccess: (o) => {
      setResult(o);
      setError("");
    },
    onError: (e) => {
      setError(apiErrorMessage(e));
      setResult(null);
    },
  });

  return (
    <Section
      title="Cek Pesanan"
      subtitle="Masukkan nomor pesanan. Guest wajib menyertakan email/token verifikasi agar data tidak bocor."
    >
      <div className="mx-auto max-w-xl space-y-6">
        <div className="glass-card space-y-4 p-6">
          <input
            className="input"
            placeholder="Contoh: NX-XXXXXX-XXXXXX"
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
          />
          <input
            className="input"
            placeholder="Email / token verifikasi (guest)"
            value={verification}
            onChange={(e) => setVerification(e.target.value)}
          />
          <button
            className="btn-primary w-full"
            disabled={!orderNo || track.isPending}
            onClick={() => track.mutate()}
          >
            {track.isPending ? "Mencari..." : "Cari Pesanan"}
          </button>
          {error && <p className="text-sm text-rose-300">{error}</p>}
        </div>

        {result && (
          <div className="glass-card space-y-4 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={result.status} />
              <StatusBadge status={result.fulfillment} />
            </div>
            <div className="text-sm text-slate-300">{result.product}</div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total</span>
              <span>{rupiah(result.priceTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Waktu transaksi</span>
              <span>{new Date(result.createdAt).toLocaleString("id-ID")}</span>
            </div>
            {result.failReason && (
              <p className="text-sm text-rose-300">{result.failReason}</p>
            )}
            <div>
              <p className="mb-2 text-sm font-semibold text-white">
                Riwayat Status
              </p>
              <ol className="space-y-1.5 text-sm text-slate-400">
                {result.history.map((h, i) => (
                  <li key={i}>
                    {h.note ?? `${h.field} → ${h.to ?? "-"}`}{" "}
                    <span className="text-xs">
                      · {new Date(h.at).toLocaleString("id-ID")}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <p className="text-xs text-slate-500">
              Butuh bantuan? Hubungi support@nexora.test dengan menyertakan
              nomor pesanan.
            </p>
          </div>
        )}

        <p className="text-center text-sm text-slate-500">
          Punya akun?{" "}
          <Link to="/login" className="text-neon hover:underline">
            Login
          </Link>{" "}
          untuk melihat semua riwayat.
        </p>
      </div>
    </Section>
  );
}
