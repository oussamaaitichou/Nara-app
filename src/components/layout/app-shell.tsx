import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardList,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Sparkles,
  Star,
  Thermometer,
  UserCircle2,
  Users,
  Wallet,
  Workflow,
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
  badge?: number;
};

/** Nara = producto completo. NaraGest = gestión de la farmacia. */
const NAV: ShellItem[] = [
  { to: "/consulta", label: "Consultar a Nara", icon: MessageSquare, match: (p) => p.startsWith("/consulta"), section: "Nara" },
  { to: "/valorar", label: "Valorar farmacia", icon: Star, match: (p) => p.startsWith("/valorar") },
  {
    to: "/panel",
    label: "NaraGest",
    icon: LayoutDashboard,
    match: (p) => p === "/panel",
    section: "NaraGest",
  },
  { to: "/stock", label: "Stock y almacén", icon: Package, match: (p) => p.startsWith("/stock"), badge: 8 },
  { to: "/compras", label: "Compras", icon: ShoppingCart, match: (p) => p.startsWith("/compras") },
  { to: "/ventas", label: "Ventas y ticket", icon: Wallet, match: (p) => p.startsWith("/ventas") },
  { to: "/caducidades", label: "Caducidades", icon: AlertTriangle, match: (p) => p.startsWith("/caducidades"), badge: 12 },
  { to: "/caja", label: "Caja y tesorería", icon: BarChart3, match: (p) => p.startsWith("/caja") },
  { to: "/clientes-f", label: "Clientes", icon: Users, match: (p) => p.startsWith("/clientes-f"), section: "Equipo" },
  { to: "/equipo", label: "Equipo y turnos", icon: UserCircle2, match: (p) => p.startsWith("/equipo") },
  { to: "/tareas", label: "Tareas", icon: ClipboardList, match: (p) => p.startsWith("/tareas"), badge: 5 },
  { to: "/servicios-f", label: "Servicios", icon: Thermometer, match: (p) => p.startsWith("/servicios-f"), section: "Cumplimiento" },
  { to: "/documentos", label: "Documentación", icon: FileText, match: (p) => p.startsWith("/documentos") },
  { to: "/calendario", label: "Calendario", icon: CalendarDays, match: (p) => p.startsWith("/calendario") },
  { to: "/informes", label: "Informes", icon: BarChart3, match: (p) => p.startsWith("/informes"), section: "Sistema" },
  { to: "/automatizaciones", label: "Automatizaciones", icon: Workflow, match: (p) => p.startsWith("/automatizaciones") },
  { to: "/login", label: "Acceso", icon: KeyRound, match: (p) => p.startsWith("/login") },
  { to: "/configuracion", label: "Configuración", icon: Settings, match: (p) => p.startsWith("/configuracion") },
  { to: "/admin", label: "Admin", icon: Settings, match: (p) => p.startsWith("/admin") },
];

const MOBILE_TABS = [
  { to: "/panel", label: "Gest", icon: LayoutDashboard, match: (p: string) => p === "/panel" },
  { to: "/consulta", label: "Nara", icon: MessageSquare, match: (p: string) => p.startsWith("/consulta") },
  { to: "/stock", label: "Stock", icon: Package, match: (p: string) => p.startsWith("/stock") },
  { to: "/tareas", label: "Tareas", icon: ClipboardList, match: (p: string) => p.startsWith("/tareas") },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2" aria-label="Nara y NaraGest">
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
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.badge ? (
                <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white/90">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

/** Logo de Nara: al pulsar entra en NaraGest (gestión de farmacia). */
function LogoHome({ onNavigate, compact = false }: { onNavigate?: () => void; compact?: boolean }) {
  return (
    <Link
      to="/panel"
      onClick={onNavigate}
      className="flex min-w-0 items-center gap-2.5 transition hover:opacity-90"
      aria-label="Nara · abrir NaraGest"
    >
      <NaraMark className={compact ? "size-8" : "size-9"} />
      <div className="min-w-0">
        <p className={cn("font-display font-semibold leading-none tracking-tight", compact ? "text-base text-ink" : "text-lg text-white")}>
          Nara
        </p>
        {!compact ? (
          <p className="mt-1 text-[11px] font-medium text-white/50">
            <span className="text-white/80">NaraGest</span> · gestión de farmacia
          </p>
        ) : (
          <p className="truncate text-[10px] text-muted">NaraGest</p>
        )}
      </div>
    </Link>
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
      <aside className="hidden w-[260px] shrink-0 flex-col bg-[#0F2E2A] text-white md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <LogoHome />
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
          <p className="mt-2 px-3 text-[10px] leading-relaxed text-white/35">Nara · Conexión segura</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-[4.25rem] md:pb-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white/95 px-3 py-3 backdrop-blur-md md:hidden">
          <button
            type="button"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-line bg-[#F7F5F1] text-ink"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <div className="min-w-0 flex-1">
            <LogoHome compact />
            {title ? <p className="truncate pl-[2.6rem] text-xs text-muted">{title}</p> : null}
          </div>
          <Link
            to="/consulta"
            className="inline-flex h-9 shrink-0 items-center rounded-full bg-teal px-3 text-xs font-semibold text-primary-foreground"
          >
            Nara
          </Link>
        </header>

        {menuOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Cerrar" onClick={() => setMenuOpen(false)} />
            <div className="absolute inset-y-0 left-0 flex w-[min(100%,290px)] flex-col bg-[#0F2E2A] text-white shadow-[var(--shadow-lift)]">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
                <div className="min-w-0 flex-1">
                  <LogoHome onNavigate={() => setMenuOpen(false)} />
                </div>
                <button type="button" className="size-9 shrink-0 rounded-lg border border-white/15" onClick={() => setMenuOpen(false)} aria-label="Cerrar">
                  <X className="mx-auto size-4" />
                </button>
              </div>
              <NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} />
              <div className="mt-auto border-t border-white/10 p-3">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60">
                  <LogOut className="size-4" />
                  Acceso / sesión
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {(title || subtitle) && !fullBleed ? (
          <div className="hidden items-start justify-between gap-4 border-b border-line/80 bg-white/70 px-8 py-5 backdrop-blur-sm md:flex">
            <div>
              {title ? <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h1> : null}
              {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-white text-muted" aria-label="Notificaciones">
                <Bell className="size-4" />
              </button>
              <Link
                to="/consulta"
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-teal px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
              >
                <Sparkles className="size-4" />
                Preguntar a Nara
              </Link>
            </div>
          </div>
        ) : null}

        <div className={cn("flex-1", fullBleed ? "min-h-0" : "px-4 py-5 sm:px-8 sm:py-6")}>{children}</div>

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
