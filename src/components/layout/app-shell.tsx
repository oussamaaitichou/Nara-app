import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  BarChart3,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Settings,
  Star,
  UserCircle2,
  Users,
  Wallet,
  X,
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
  { to: "/panel", label: "Resumen", icon: LayoutDashboard, match: (p) => p === "/panel" || p === "/" },
  { to: "/consulta", label: "Consultar a Nara", icon: MessageSquare, match: (p) => p.startsWith("/consulta") },
  { to: "/erp", label: "Datos e IA", icon: BarChart3, match: (p) => p.startsWith("/erp"), section: "Gestión" },
  { to: "/erp", label: "Stock y compras", icon: Package, match: () => false },
  { to: "/erp", label: "Ticket y ventas", icon: Wallet, match: () => false },
  { to: "/erp", label: "Clientes", icon: Users, match: () => false, section: "Equipo" },
  { to: "/erp", label: "Personal", icon: UserCircle2, match: () => false },
  { to: "/valorar", label: "Valorar farmacia", icon: Star, match: (p) => p.startsWith("/valorar"), section: "Más" },
  { to: "/login", label: "Acceso", icon: KeyRound, match: (p) => p.startsWith("/login") },
  { to: "/admin", label: "Admin", icon: Settings, match: (p) => p.startsWith("/admin") },
];

const MOBILE_TABS = [
  { to: "/panel", label: "Panel", icon: LayoutDashboard, match: (p: string) => p === "/panel" || p === "/" },
  { to: "/consulta", label: "Chat", icon: MessageSquare, match: (p: string) => p.startsWith("/consulta") },
  { to: "/erp", label: "Datos", icon: BarChart3, match: (p: string) => p.startsWith("/erp") },
  { to: "/valorar", label: "Valorar", icon: Star, match: (p: string) => p.startsWith("/valorar") },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2" aria-label="Módulos">
      {NAV.map((item, i) => {
        const active = item.match?.(pathname) ?? pathname === item.to;
        const Icon = item.icon;
        return (
          <div key={`${item.label}-${i}`}>
            {item.section ? (
              <p className="mb-1.5 mt-5 px-3 text-[10px] font-semibold tracking-[0.14em] text-white/40 uppercase">
                {item.section}
              </p>
            ) : null}
            <Link
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-white/12 text-white shadow-sm ring-1 ring-white/10"
                  : "text-white/65 hover:bg-white/8 hover:text-white",
              )}
            >
              <Icon className="size-4 shrink-0 opacity-90" strokeWidth={active ? 2.25 : 1.75} />
              {item.label}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
  fullBleed = false,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  fullBleed?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-[#F7F5F1] text-ink">
      {/* Escritorio: lateral oscuro premium */}
      <aside className="hidden w-[260px] shrink-0 flex-col bg-[#0F2E2A] text-white md:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <NaraMark className="size-9" />
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold leading-none tracking-tight text-white">Nara</p>
            <p className="mt-1 text-[11px] font-medium text-white/50">Farmacia inteligente</p>
          </div>
        </div>

        <NavLinks pathname={pathname} />

        <div className="mt-auto border-t border-white/10 p-3">
          <div className="mb-2 rounded-xl bg-white/6 px-3 py-3">
            <p className="text-[11px] font-medium text-white/50">Turno actual</p>
            <p className="mt-0.5 text-sm font-medium text-white/90">Abierto</p>
          </div>
          <Link
            to="/login"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/8 hover:text-white"
          >
            <LogOut className="size-4" />
            Acceso / sesión
          </Link>
          <p className="mt-2 px-3 text-[10px] leading-relaxed text-white/35">
            Conexión segura · Datos protegidos
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-[4.25rem] md:pb-0">
        {/* Móvil: cabecera fija */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white/95 px-3 py-3 backdrop-blur-md md:hidden">
          <button
            type="button"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-line bg-[#F7F5F1] text-ink"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <NaraMark className="size-8" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-semibold leading-tight">Nara</p>
            {title ? <p className="truncate text-xs text-muted">{title}</p> : null}
          </div>
          <Link
            to="/consulta"
            className="inline-flex h-9 shrink-0 items-center rounded-full bg-teal px-3 text-xs font-semibold text-primary-foreground"
          >
            Chat
          </Link>
        </header>

        {/* Menú lateral móvil (oscuro) */}
        {menuOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Cerrar" onClick={() => setMenuOpen(false)} />
            <div className="absolute inset-y-0 left-0 flex w-[min(100%,290px)] flex-col bg-[#0F2E2A] text-white shadow-[var(--shadow-lift)]">
              <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-4">
                <NaraMark className="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-semibold">Nara</p>
                  <p className="text-[11px] text-white/50">Farmacia inteligente</p>
                </div>
                <button type="button" className="size-9 rounded-lg border border-white/15" onClick={() => setMenuOpen(false)} aria-label="Cerrar">
                  <X className="mx-auto size-4" />
                </button>
              </div>
              <NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} />
              <div className="mt-auto border-t border-white/10 p-3">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60"
                >
                  <LogOut className="size-4" />
                  Acceso / sesión
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {/* Título escritorio */}
        {(title || subtitle) && !fullBleed ? (
          <div className="hidden items-start justify-between gap-4 border-b border-line/80 bg-white/70 px-8 py-5 backdrop-blur-sm md:flex">
            <div>
              {title ? (
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h1>
              ) : null}
              {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
            </div>
            <Link
              to="/consulta"
              className="inline-flex h-10 shrink-0 items-center rounded-full bg-teal px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
            >
              Preguntar a Nara
            </Link>
          </div>
        ) : null}

        <div className={cn("flex-1", fullBleed ? "min-h-0" : "px-4 py-5 sm:px-8 sm:py-6")}>{children}</div>

        {/* Móvil: barra inferior */}
        <nav
          className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-white/95 backdrop-blur-md md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="Principal"
        >
          {MOBILE_TABS.map((tab) => {
            const active = tab.match(pathname);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to + tab.label}
                to={tab.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
                  active ? "text-teal" : "text-muted",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
