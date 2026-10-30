import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Wallet, X, LayoutDashboard } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  { label: "Beranda", to: "/" },
  { label: "Top Up Game", to: "/kategori?filter=TOPUP" },
  { label: "Sosial Media", to: "/kategori?filter=SMM" },
  { label: "Cek Pesanan", to: "/cek-pesanan" },
  { label: "Bantuan", to: "/bantuan" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((i) => (
            <Link
              key={i.label}
              to={i.to}
              className="text-sm text-slate-400 transition hover:text-white"
            >
              {i.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {user.role === "ADMIN" && (
                <Link to="/admin" className="btn-ghost !py-2 text-xs">
                  <LayoutDashboard className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <Link to="/dashboard" className="btn-ghost !py-2 text-xs">
                <Wallet className="h-4 w-4" />
                {user.name.split(" ")[0]}
              </Link>
              <Link to="/dashboard/profil" className="btn-ghost !py-2 text-xs">
                Profil
              </Link>
              <button
                className="btn-ghost !py-2 text-xs"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost !py-2 text-xs">
                Login
              </Link>
              <Link to="/daftar" className="btn-primary !py-2 text-xs">
                Daftar
              </Link>
            </>
          )}
        </div>
        <button
          className="md:hidden text-slate-300"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-white/5 bg-ink-900 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navItems.map((i) => (
              <Link
                key={i.label}
                to={i.to}
                className="text-sm text-slate-300"
                onClick={() => setOpen(false)}
              >
                {i.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm text-slate-300"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/dashboard/profil"
                  className="text-sm text-slate-300"
                  onClick={() => setOpen(false)}
                >
                  Profil
                </Link>
                <button
                  className="text-left text-sm text-rose-300"
                  onClick={() => {
                    logout();
                    navigate("/");
                    setOpen(false);
                  }}
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  Login
                </Link>
                <Link to="/daftar" className="btn-primary">
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
