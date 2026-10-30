import { NavLink, Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Server,
  ShoppingBag,
  CreditCard,
  Users,
  Wallet,
  Tag,
  RotateCcw,
  BarChart3,
  Settings,
  ScrollText,
  Star,
  Megaphone,
  Zap,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Puzzle,
  RefreshCcw,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Skeleton } from "../../components/ui";
import { api } from "../../lib/api";

const menuGroups: {
  group: string;
  items: {
    to: string;
    label: string;
    icon: typeof LayoutDashboard;
    end?: boolean;
  }[];
}[] = [
  {
    group: "Utama",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/admin/orders", label: "Pesanan", icon: ShoppingBag },
      { to: "/admin/payments", label: "Transaksi", icon: CreditCard },
      { to: "/admin/customers", label: "Pelanggan", icon: Users },
    ],
  },
  {
    group: "Katalog",
    items: [
      { to: "/admin/products", label: "Produk", icon: Package },
      { to: "/admin/categories", label: "Kategori", icon: FolderTree },
      { to: "/admin/coupons", label: "Promo & Voucher", icon: Tag },
      { to: "/admin/banners", label: "Manajemen Banner", icon: Megaphone },
    ],
  },
  {
    group: "Provider",
    items: [
      { to: "/admin/providers", label: "Integrasi Provider", icon: Puzzle },
      {
        to: "/admin/providers-classic",
        label: "Status Provider",
        icon: Server,
      },
      { to: "/admin/sync", label: "Product Sync", icon: RefreshCcw },
    ],
  },
  {
    group: "Analitik",
    items: [
      { to: "/admin/reports", label: "Laporan", icon: BarChart3 },
      { to: "/admin/refunds", label: "Refund", icon: RotateCcw },
      { to: "/admin/reviews", label: "Moderasi Ulasan", icon: Star },
      { to: "/admin/settings", label: "Pengaturan", icon: Settings },
      { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
    ],
  },
];

const titles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/orders": "Pesanan",
  "/admin/payments": "Transaksi Pembayaran",
  "/admin/customers": "Pelanggan",
  "/admin/products": "Produk",
  "/admin/categories": "Kategori",
  "/admin/coupons": "Promo & Voucher",
  "/admin/banners": "Manajemen Banner Promosi",
  "/admin/providers": "Integrasi Provider",
  "/admin/providers-classic": "Status Provider",
  "/admin/sync": "Product Sync",
  "/admin/reports": "Laporan",
  "/admin/refunds": "Refund",
  "/admin/reviews": "Moderasi Ulasan",
  "/admin/settings": "Pengaturan",
  "/admin/audit": "Audit Log",
};

function Breadcrumb() {
  const loc = useLocation();
  const title = titles[loc.pathname] ?? "Admin";
  return (
    <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      <Link to="/admin" className="text-zinc-500 hover:text-neon-soft">
        Admin
      </Link>
      <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
      <span className="font-medium text-white">{title}</span>
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-neon to-cyanx shadow-glow-sm">
          <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
        </span>
        <div>
          <p className="text-sm font-extrabold tracking-tight text-white">
            NEXORA
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neon-soft">
            Admin Console
          </p>
        </div>
      </Link>

      {/* Menu */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 [scrollbar-width:none]">
        {menuGroups.map((g) => (
          <div key={g.group}>
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
              {g.group}
            </p>
            <div className="space-y-0.5">
              {g.items.map((m) => (
                <NavLink
                  key={m.to}
                  to={m.to}
                  end={m.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-neon/25 to-neon/5 text-white shadow-glow-sm"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <m.icon
                        className={`h-4 w-4 shrink-0 ${isActive ? "text-neon-soft" : "text-zinc-500 group-hover:text-neon-soft"}`}
                      />
                      {m.label}
                      {isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-neon" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile */}
      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neon to-neon-bright text-sm font-bold text-white">
            {user?.name?.[0] ?? "A"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user?.name}
            </p>
            <p className="truncate text-xs text-zinc-500">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              api.post("/auth/logout").catch(() => undefined);
              localStorage.removeItem("nexora_token");
              window.location.href = "/";
            }}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-red-300"
            title="Keluar"
            aria-label="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const loc = useLocation();

  if (loading)
    return (
      <div className="p-8">
        <Skeleton />
      </div>
    );
  if (!user || user.role !== "ADMIN") return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-ink-950">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/5 bg-ink-900/80 backdrop-blur-xl lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-white/10 bg-ink-900">
            <button
              className="absolute right-3 top-4 text-zinc-400"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup"
            >
              <X />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-white/5 bg-ink-950/80 backdrop-blur-xl">
          <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
            <button
              className="rounded-lg p-2 text-zinc-400 hover:text-white lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Breadcrumb />
            <div className="ml-auto flex items-center gap-2">
              <Link
                to="/"
                className="hidden rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-400 transition hover:border-neon/40 hover:text-white sm:block"
              >
                Lihat Storefront ↗
              </Link>
              <button
                className="relative rounded-lg border border-white/10 bg-white/[0.04] p-2 text-zinc-400 transition hover:text-white"
                aria-label="Notifikasi"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-neon" />
              </button>
            </div>
          </div>
        </header>

        <main key={loc.pathname} className="flex-1 animate-fade-up p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
