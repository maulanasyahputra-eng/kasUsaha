import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "../lib/api";
import { Section, Skeleton, rupiah, Toast } from "../components/ui";

interface Order {
  id: string;
  orderNo: string;
  status: string;
  priceTotal: number;
  quantity: number;
  accountInput: string;
  accountInput2?: string;
  guestEmail?: string;
  product: { name: string; type: string };
}

declare global {
  interface Window {
    snap?: any;
  }
}

function loadSnapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.snap) return resolve();
    const s = document.createElement("script");
    s.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    s.setAttribute("data-client-key", ""); // diisi saat pay() sukses via popup Midtrans
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Gagal memuat Midtrans Snap."));
    document.body.appendChild(s);
  });
}

export default function CheckoutPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [coupon, setCoupon] = useState("");
  const [payWithWallet, setPayWithWallet] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () =>
      (await api.get(`/orders/${orderId}`)).data.order as Order,
    enabled: !!orderId,
  });

  useEffect(() => {
    loadSnapScript().catch(() => undefined);
  }, []);

  const payMidtrans = useMutation({
    mutationFn: async () =>
      (await api.post(`/orders/${orderId}/pay`)).data.payment,
    onSuccess: async (payment: {
      snapToken: string;
      clientKey: string;
      redirectUrl: string;
    }) => {
      try {
        await loadSnapScript();
        window.snap!.pay(payment.snapToken, {
          onSuccess: () => {
            qc.invalidateQueries();
            navigate(`/order/${orderId}/status`);
          },
          onPending: () => navigate(`/order/${orderId}/status`),
          onError: () =>
            setToast({ msg: "Pembayaran gagal. Coba lagi.", type: "error" }),
          onClose: () =>
            setToast({
              msg: "Popup pembayaran ditutup sebelum selesai.",
              type: "error",
            }),
        });
      } catch {
        window.open(payment.redirectUrl, "_blank");
      }
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });

  const payWallet = useMutation({
    mutationFn: async () =>
      (await api.post(`/orders/${orderId}/pay-wallet`)).data,
  });

  if (isLoading || !order)
    return (
      <Section title="Memuat...">
        <Skeleton count={2} />
      </Section>
    );

  return (
    <Section title="Checkout" subtitle={`Order ${order.orderNo}`}>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div className="mx-auto max-w-xl space-y-6">
        <div className="glass-card space-y-3 p-6 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Produk</span>
            <span>{order.product.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Jumlah</span>
            <span>{order.quantity.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Tujuan</span>
            <span className="break-all">
              {order.accountInput}
              {order.accountInput2 ? ` (${order.accountInput2})` : ""}
            </span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-3 font-semibold text-white">
            <span>Total</span>
            <span className="text-neon">{rupiah(order.priceTotal)}</span>
          </div>
          <p className="text-xs text-slate-500">
            Nominal sudah dihitung ulang oleh server; tidak dapat diubah dari
            browser.
          </p>
        </div>

        <div className="glass-card space-y-3 p-6">
          <p className="text-sm font-semibold text-white">Metode Pembayaran</p>
          <button
            className="btn-primary w-full"
            disabled={payMidtrans.isPending || order.status !== "PENDING"}
            onClick={() => payMidtrans.mutate()}
          >
            {payMidtrans.isPending
              ? "Menyiapkan..."
              : "Bayar Sekarang (Payment Gateway)"}
          </button>
          <button
            className="btn-ghost w-full"
            disabled={payWallet.isPending || order.status !== "PENDING"}
            onClick={() => payWallet.mutate()}
          >
            {payWallet.isPending ? "Memproses..." : "Bayar dengan Saldo"}
          </button>
        </div>

        <p className="text-center text-xs text-slate-500">
          Dengan membayar, Anda menyetujui ketentuan transaksi: pesanan diproses
          setelah pembayaran terverifikasi; status pemrosesan mengikuti
          provider.
        </p>
      </div>
    </Section>
  );
}
