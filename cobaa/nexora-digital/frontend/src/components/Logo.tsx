import { Zap } from "lucide-react";
import { Link } from "react-router-dom";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-neon-deep to-cyanx/80 shadow-glow-sm">
        <Zap className="h-5 w-5 text-white" />
      </span>
      <span className="text-lg font-bold tracking-tight text-white">
        NEXORA<span className="text-neon"> DIGITAL</span>
      </span>
    </Link>
  );
}
