import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-32 text-center">
      <p className="text-6xl font-bold text-neon">404</p>
      <p className="text-slate-400">Halaman tidak ditemukan.</p>
      <Link to="/" className="btn-ghost mt-2">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
