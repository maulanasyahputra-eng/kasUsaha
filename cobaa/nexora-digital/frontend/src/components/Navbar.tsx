import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Search, Wallet, LayoutDashboard, UserCircle2, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';

const navItems = [
  { label: 'Beranda', to: '/' },
  { label: 'Top Up Game', to: '/kategori?filter=TOPUP' },
  { label: 'Sosial Media', to: '/kategori?filter=SMM' },
  { label: 'Cek Pesanan', to: '/cek-pesanan' },
  { label: 'Bantuan', to: '/bantuan' },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-neon to-cyanx shadow-glow-sm transition-shadow group-hover:shadow-glow">
        <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
      </span>
      {!compact && (
        <span className="text-lg font-extrabold tracking-tight text-white">
          NEXORA<span className="bg-gradient-to-r from-neon-soft to-cyanx bg-clip-text text-transparent"> DIGITAL</span>
        </span>
      )}
    </Link>
  );
}

/** Announcement bar — konten dari Setting backend (site_announcement), fallback default. */
function AnnouncementBar() {
  const [text, setText] = useState('Welcome to NEXORA DIGITAL — Your Trusted Digital Marketplace.');
  useEffect(() => {
    api.get('/settings?keys=site_announcement')
      .then((r) => { if (r.data.settings?.site_announcement) setText(r.data.settings.site_announcement); })
      .catch(() => undefined);
  }, []);
  return (
    <div className="border-b border-white/5 bg-gradient-to-r from-neon/15 via-neon-bright/10 to-cyanx/10">
      <p className="mx-auto max-w-6xl px-4 py-1.5 text-center text-xs font-medium text-neon-soft">
        {text}
      </p>
    </div>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname + location.search === to || location.pathname.startsWith(to.split('?')[0]) && to !== '/';

  return (
    <>
      <AnnouncementBar />
      <header className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? 'border-b border-white/5 bg-ink-950/85 shadow-card backdrop-blur-xl' : 'bg-transparent'
      }`}>
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo />

          <div className="hidden items-center gap-1 lg:flex">
            {navItems.map((i) => (
              <NavLink
                key={i.label}
                to={i.to}
                className={({ isActive }) => `relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {({ isActive }) => (
                  <>
                    {i.label}
                    {isActive && <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-neon to-cyanx" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <button
              className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-zinc-400 transition hover:border-neon/40 hover:text-white"
              onClick={() => navigate('/kategori')}
              aria-label="Cari produk"
            >
              <Search className="h-4 w-4" />
            </button>
            {user ? (
              <>
                {user.role === 'ADMIN' && (
                  <Link to="/admin" className="btn-ghost !py-2 text-xs"><LayoutDashboard className="h-4 w-4" />Admin</Link>
                )}
                <Link to="/dashboard" className="btn-ghost !py-2 text-xs"><Wallet className="h-4 w-4" />{user.name.split(' ')[0]}</Link>
                <Link to="/dashboard/profil" className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-zinc-300 transition hover:border-neon/40 hover:text-white" aria-label="Profil">
                  <UserCircle2 className="h-4 w-4" />
                </Link>
                <button className="btn-ghost !py-2 text-xs" onClick={() => { logout(); navigate('/'); }}>Keluar</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost !py-2 text-xs">Login</Link>
                <Link to="/daftar" className="btn-primary !py-2 text-xs">Daftar</Link>
              </>
            )}
          </div>

          <button className="rounded-lg p-2 text-zinc-300 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </button>
        </nav>

        {open && (
          <div className="border-t border-white/5 bg-ink-900/95 px-4 py-4 backdrop-blur-xl lg:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((i) => (
                <NavLink key={i.label} to={i.to}
                  className={({ isActive }) => `rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-neon/15 text-white' : 'text-zinc-300'}`}>
                  {i.label}
                </NavLink>
              ))}
              <hr className="my-2 border-white/5" />
              {user ? (
                <>
                  <Link to="/dashboard" className="rounded-lg px-3 py-2.5 text-sm text-zinc-300">Dashboard</Link>
                  <Link to="/dashboard/profil" className="rounded-lg px-3 py-2.5 text-sm text-zinc-300">Profil</Link>
                  {user.role === 'ADMIN' && <Link to="/admin" className="rounded-lg px-3 py-2.5 text-sm text-zinc-300">Admin</Link>}
                  <button className="rounded-lg px-3 py-2.5 text-left text-sm text-red-300" onClick={() => { logout(); navigate('/'); }}>Keluar</button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link to="/login" className="btn-ghost flex-1 !py-2 text-sm">Login</Link>
                  <Link to="/daftar" className="btn-primary flex-1 !py-2 text-sm">Daftar</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
