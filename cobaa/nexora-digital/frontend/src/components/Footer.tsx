import { Link } from 'react-router-dom';
import { Zap, Mail, ShieldCheck, CreditCard, FileText } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5 bg-ink-900/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-neon to-cyanx">
              <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-white">
              NEXORA<span className="bg-gradient-to-r from-neon-soft to-cyanx bg-clip-text text-transparent"> DIGITAL</span>
            </span>
          </Link>
          <p className="text-sm leading-relaxed text-zinc-500">
            Your Digital World, One Platform. Top up game, voucher, dan layanan digital dalam satu tempat — cepat, aman, terpercaya.
          </p>
          <div className="flex items-center gap-2 pt-1 text-xs text-zinc-600">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Pembayaran terverifikasi gateway resmi
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-bold text-white">Layanan</p>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><Link to="/kategori?filter=TOPUP" className="transition hover:text-neon-soft">Top Up Game</Link></li>
            <li><Link to="/kategori?filter=SMM" className="transition hover:text-neon-soft">Layanan Media Sosial</Link></li>
            <li><Link to="/kategori" className="transition hover:text-neon-soft">Semua Kategori</Link></li>
            <li><Link to="/cek-pesanan" className="transition hover:text-neon-soft">Cek Pesanan</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-bold text-white">Bantuan</p>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><Link to="/bantuan" className="transition hover:text-neon-soft">Pusat Bantuan & FAQ</Link></li>
            <li><a href="mailto:support@nexora.test" className="flex items-center gap-1.5 transition hover:text-neon-soft"><Mail className="h-3.5 w-3.5" />support@nexora.test</a></li>
            <li><Link to="/cek-pesanan" className="transition hover:text-neon-soft">Lacak Transaksi</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-bold text-white">Kebijakan</p>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><Link to="/bantuan" className="transition hover:text-neon-soft">Kebijakan Privasi</Link></li>
            <li><Link to="/bantuan" className="transition hover:text-neon-soft">Syarat & Ketentuan</Link></li>
          </ul>
          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-600">
            <CreditCard className="h-3.5 w-3.5" /> QRIS · Virtual Account · E-Wallet
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} NEXORA DIGITAL — Your Digital World, One Platform. Semua hak dilindungi.
      </div>
    </footer>
  );
}
