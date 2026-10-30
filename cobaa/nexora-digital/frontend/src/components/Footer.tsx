import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-ink-900/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-slate-500">
            One Platform. Endless Digital Possibilities.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Layanan</p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>
              <Link to="/kategori?filter=TOPUP" className="hover:text-neon">
                Top Up Game
              </Link>
            </li>
            <li>
              <Link to="/kategori?filter=SMM" className="hover:text-neon">
                Layanan Media Sosial
              </Link>
            </li>
            <li>
              <Link to="/cek-pesanan" className="hover:text-neon">
                Cek Pesanan
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Bantuan</p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>
              <a href="mailto:support@nexora.test" className="hover:text-neon">
                support@nexora.test
              </a>
            </li>
            <li>
              <Link to="/bantuan" className="hover:text-neon">
                Bantuan & FAQ
              </Link>
            </li>
            <li>
              <Link to="/cek-pesanan" className="hover:text-neon">
                Lacak Transaksi
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Kebijakan</p>
          <p className="text-xs leading-relaxed text-slate-500">
            Estimasi waktu pemrosesan berasal dari provider dan tidak dijamin
            pasti. Layanan media sosial memiliki risiko penurunan engagement;
            kebijakan refill/refund mengikuti ketentuan provider. Kami tidak
            pernah meminta password akun media sosial Anda.
          </p>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} NEXORA DIGITAL. Semua hak dilindungi.
      </div>
    </footer>
  );
}
