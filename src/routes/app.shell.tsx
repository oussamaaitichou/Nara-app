import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  BarChart3, KeyRound, LayoutDashboard, MessageSquare, Package,
  Settings, Star, Users, UserCircle2, Wallet,
} from "lucide-react";
import { NaraMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export type ShellItem = {
  to: string;
  label: string;
  icon: typeof MessageSquare;
  match?: (path: string) => boolean;
  section?: string;
};

const NAV: ShellItem[] = [
  { to: "/panel", label: "Panel", icon: LayoutDashboard, match: (p) => p === "/panel" || p === "/" },
  { to: "/consulta", label: "Consultar a Nara", icon: MessageSquare, match: (p) => p.startsWith("/consulta") },
  { to: "/erp", label: "Datos e IA", icon: BarChart3, match: (p) => p.startsWith("/erp"), section: "Gestión" },
  { to: "/erp", label: "Stock y compras", icon: Package, match: () => false },
  { to: "/erp", label: "Ticket y ventas", icon: Wallet, match: () => false },
  { to: "/erp", label: "Clientes", icon: Users, match: () => false, section: "Equipo" },
  { to: "/erp", label: "Personal", icon: UserCircle2, match: () => false },
  { to: "/valorar", label: "Valorar farmacia", icon: Star, match: (p) => p.startsWith("/valorar"), section: "Más" },
  { to: "/login", label: "Acceso", icon: KeyRound, match: (p) => p.startsWith("/login") || p.startsWith("/registro") },
  { to: "/admin", label: "Admin", icon: Settings, match: (p) => p.startsWith("/admin") },
];

export function AppShell({
  children, title, subtitle, fullBleed = false,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  fullBleed?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-dvh bg-bg text-ink">
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-5">
          <NaraMark className="size-9" />
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold leading-none tracking-tight">Nara</p>
            <p className="mt-1 text-[11px] font-medium text-muted">Oficina de farmacia</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Módulos">
          {NAV.map((item, i) => {
            const active = item.match?.(pathname) ?? pathname === item.to;
            const Icon = item.icon;
            return (
              <div key={`${item.label}-${i}`}>
                {item.section ? (
                  <p className="mb-1 mt-4 px-3 text-[10px] font-semibold tracking-wider text-subtle uppercase">
                    {item.section}
                  </p>
                ) : null}
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-teal-soft text-teal-deep" : "text-ink-soft hover:bg-bg-warm hover:text-ink",
                  )}
                >
                  <Icon className="size-4 shrink-0 opacity-90" strokeWidth={active ? 2.25 : 1.75} />
                  {item.label}
                </Link>
              </div>
            );
          })}
        </nav>
        <p className="border-t border-line px-4 py-3 text-[11px] text-subtle">
          Asesor IA · no sustituye al ERP
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {(title || subtitle) && !fullBleed ? (
          <header className="flex items-start justify-between gap-4 border-b border-line bg-surface/80 px-4 py-5 backdrop-blur-sm sm:px-8">
            <div>
              {title ? (
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h1>
              ) : null}
              {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
            </div>
            <Link
              to="/consulta"
              className="hidden h-10 shrink-0 items-center rounded-full bg-teal px-4 text-sm font-semibold text-primary-foreground sm:inline-flex"
            >
              Preguntar a Nara
            </Link>
          </header>
        ) : null}

        <div className="flex items-center gap-3 border-b border-line bg-surface px-3 py-3 md:hidden">
          <NaraMark className="size-8" />
          <span className="font-display font-semibold">Nara</span>
          <Link to="/consulta" className="ml-auto text-sm font-semibold text-teal">Chat</Link>
          <Link to="/panel" className="text-sm font-medium text-muted">Panel</Link>
        </div>

        <div className={cn("flex-1", fullBleed ? "min-h-0" : "px-4 py-6 sm:px-8")}>{children}</div>
      </div>
    </div>
  );
}
