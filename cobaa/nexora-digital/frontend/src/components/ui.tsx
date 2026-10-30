import { ReactNode } from "react";

const statusMap: Record<string, string> = {
  PAID: "bg-emerald-500/15 text-emerald-300",
  SUCCESS: "bg-emerald-500/15 text-emerald-300",
  PENDING: "bg-amber-500/15 text-amber-300",
  QUEUED: "bg-amber-500/15 text-amber-300",
  PROCESSING: "bg-cyan-500/15 text-cyan-300",
  FAILED: "bg-rose-500/15 text-rose-300",
  EXPIRED: "bg-slate-500/15 text-slate-300",
  UNKNOWN: "bg-violet-500/15 text-violet-300",
  REFUNDED: "bg-fuchsia-500/15 text-fuchsia-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`badge ${statusMap[status] ?? "bg-white/10 text-slate-300"}`}
    >
      {status}
    </span>
  );
}

export function Toast({
  message,
  type,
}: {
  message: string;
  type: "error" | "success";
}) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 rounded-xl border px-4 py-3 text-sm shadow-lg ${
        type === "error"
          ? "border-rose-500/40 bg-rose-950/90 text-rose-200"
          : "border-emerald-500/40 bg-emerald-950/90 text-emerald-200"
      }`}
    >
      {message}
    </div>
  );
}

export function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="glass-card flex flex-col items-center gap-2 p-10 text-center">
      <p className="font-medium text-slate-300">{title}</p>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function Skeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-28" />
      ))}
    </div>
  );
}

export function Section({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function rupiah(n: number | string): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(n));
}
