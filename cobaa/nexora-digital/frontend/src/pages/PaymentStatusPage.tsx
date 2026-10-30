import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { Section, StatusBadge, rupiah } from "../components/ui";

interface HistoryItem {
  field: string;
  toValue?: string;
  note?: string;
  createdAt: string;
}
interface OrderStatus {
  orderNo: string;
  status: string;
  fulfillment: string;
  priceTotal: number;
  createdAt: string;
  failReason?: string;
  history: HistoryItem[];
  payment: { status: string; provider: string } | null;
}

export default function PaymentStatusPage() {
  const { orderId } = useParams();
  const [params] = useSearchParams();

  const { data, error } = useQuery({
    queryKey: ["order-status", orderId],
    queryFn: async () => {
      const token =
        params.get("token") ?? localStorage.getItem(`guest_${orderId}`) ?? "";
      return (await api.get(`/orders/${orderId}/status`, { params: { token } }))
        .data.order as OrderStatus;
    },
    refetchInterval: 10000, // polling halus; status sebenarnya tetap dari server
  });

  if (error) {
    return (
      <Section title="Status Pesanan">
        <p className="text-rose-300">
          Gagal memuat status. Periksa link/token verifikasi Anda.
        </p>
      </Section>
    );
  }
  if (!data)
    return (
      <Section title="Status Pesanan">
        <div className="skeleton h-48" />
      </Section>
    );

  const done =
    data.status === "PAID" &&
    (data.fulfillment === "SUCCESS" || data.fulfillment === "FAILED");

  return (
    <Section title="Status Pesanan" subtitle={data.orderNo}>
      <div className="mx-auto max-w-xl space-y-6">
        <div className="glass-card space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={data.status} />
            <StatusBadge status={data.fulfillment} />
            <span className="text-sm text-slate-400">
              {rupiah(data.priceTotal)}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            {data.status !== "PAID" &&
              "Pembayaran belum terverifikasi. Halaman ini tidak mengubah status — hanya menampilkan status terverifikasi dari server."}
            {data.status === "PAID" &&
              data.fulfillment === "SUCCESS" &&
              "Pesanan berhasil diproses."}
            {data.status === "PAID" &&
              data.fulfillment === "PROCESSING" &&
              "Pesanan sedang diproses provider."}
            {data.status === "PAID" &&
              data.fulfillment === "UNKNOWN" &&
              "Status provider belum diketahui; tim kami melakukan rekonsiliasi."}
            {data.status === "PAID" &&
              data.fulfillment === "FAILED" &&
              (data.failReason ??
                "Pesanan gagal diproses; silakan hubungi bantuan.")}
          </p>
          {!done && (
            <p className="text-xs text-slate-500">
              Halaman diperbarui otomatis setiap 10 detik.
            </p>
          )}
        </div>

        <div className="glass-card p-6">
          <p className="mb-3 text-sm font-semibold text-white">
            Riwayat Status
          </p>
          <ol className="space-y-2 text-sm">
            {data.history.map((h, i) => (
              <li key={i} className="flex justify-between gap-3 text-slate-400">
                <span>{h.note ?? `${h.field} → ${h.toValue ?? "-"}`}</span>
                <span className="shrink-0 text-xs">
                  {new Date(h.createdAt).toLocaleString("id-ID")}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}
