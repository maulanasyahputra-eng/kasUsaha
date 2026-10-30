import { Section } from "../components/ui";

const faqs = [
  {
    q: "Bagaimana cara top up game?",
    a: "Pilih menu Top Up Game, pilih game & nominal, masukkan User ID (dan Zone/Server ID jika diminta), lalu checkout. Pesanan diproses otomatis setelah pembayaran terverifikasi.",
  },
  {
    q: "Apakah ID game saya divalidasi otomatis?",
    a: "Validasi bergantung dukungan provider. Jika provider tidak menyediakan endpoint validasi akun, pastikan ID benar sebelum membayar — kesalahan ID bukan tanggung jawab platform.",
  },
  {
    q: "Berapa lama pesanan diproses?",
    a: "Top up game biasanya beberapa menit. Layanan media sosial mengikuti estimasi provider (biasanya 0–24 jam) — estimasi tidak dijamin pasti.",
  },
  {
    q: "Bagaimana kalau pesanan gagal?",
    a: "Status dapat dipantau di halaman Cek Pesanan. Jika pesanan gagal dipenuhi setelah dibayar, tim kami memproses refund sesuai kebijakan (manual, tercatat di ledger).",
  },
  {
    q: "Apakah engagement media sosial bisa turun?",
    a: "Ya, ada risiko penurunan engagement karena kebijakan platform sosial. Kami tidak menjanjikan hasil permanen. Kami tidak pernah meminta password akun Anda.",
  },
  {
    q: "Bagaimana keamanan pembayaran?",
    a: "Pembayaran melalui payment gateway resmi (Midtrans). Kami tidak menyimpan data kartu. Status pembayaran diverifikasi lewat webhook bertanda tangan kriptografi.",
  },
];

export default function HelpPage() {
  return (
    <Section
      title="Bantuan & Kebijakan"
      subtitle="Pusat bantuan NEXORA DIGITAL"
    >
      <div className="mx-auto max-w-2xl space-y-4">
        {faqs.map((f) => (
          <details key={f.q} className="glass-card p-5" open={false}>
            <summary className="cursor-pointer list-none font-medium text-white">
              {f.q}
            </summary>
            <p className="mt-2 text-sm text-slate-400">{f.a}</p>
          </details>
        ))}
        <div className="glass-card p-5 text-sm text-slate-400">
          <p className="mb-2 font-semibold text-white">
            Kebijakan Layanan (ringkas)
          </p>
          <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed">
            <li>
              Estimasi waktu pemrosesan berasal dari provider dan tidak dijamin
              pasti.
            </li>
            <li>
              Layanan media sosial memiliki risiko penurunan engagement,
              pembatalan, dan refill mengikuti ketentuan provider.
            </li>
            <li>
              Refund diproses manual setelah verifikasi status transaksi dan
              kebijakan payment gateway.
            </li>
            <li>
              Kami tidak pernah meminta password akun media sosial, PIN, atau
              OTP Anda.
            </li>
            <li>
              Transaksi bermasalah: hubungi support@nexora.test dengan
              menyertakan nomor pesanan.
            </li>
          </ul>
        </div>
      </div>
    </Section>
  );
}
