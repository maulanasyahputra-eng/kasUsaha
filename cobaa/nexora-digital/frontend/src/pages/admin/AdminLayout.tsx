import { NavLink, Outlet, Navigate } from "react-router-dom";
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
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Section, Skeleton } from "../../components/ui";

const menu = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/orders", label: "Pesanan", icon: ShoppingBag },
  { to: "/admin/products", label: "Produk", icon: Package },
  { to: "/admin/categories", label: "Kategori", icon: FolderTree },
  { to: "/admin/providers", label: "Integrasi Provider", icon: Server },
  { to: "/admin/payments", label: "Pembayaran", icon: CreditCard },
  { to: "/admin/deposits", label: "Deposit", icon: Wallet },
  { to: "/admin/customers", label: "Customer", icon: Users },
  { to: "/admin/coupons", label: "Promo", icon: Tag },
  { to: "/admin/refunds", label: "Refund", icon: RotateCcw },
  { to: "/admin/reports", label: "Laporan", icon: BarChart3 },
  { to: "/admin/settings", label: "Pengaturan", icon: Settings },
  { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
];

export default function AdminLayout() {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <Section title="Admin">
        <Skeleton />
      </Section>
    );
  if (!user || user.role !== "ADMIN") return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-8">
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="glass-card sticky top-20 p-3">
          <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Panel Admin
          </p>
          <nav className="flex flex-col gap-0.5">
            {menu.map((m) => (
              <NavLink
                key={m.to}
                to={m.to}
                end={m.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-neon/15 text-white shadow-glow-sm"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <m.icon className="h-4 w-4" />
                {m.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        {/* Mobile nav */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {menu.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs ${
                  isActive
                    ? "border-neon/50 text-white"
                    : "border-white/10 text-slate-400"
                }`
              }
            >
              {m.label}
            </NavLink>
          ))}
        </div>
        <Outlet />
      </div>
    </div>
  );
}
