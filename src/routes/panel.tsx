import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  MessageSquare,
  Package,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/panel")({
  component: PanelPage,
  head: () => ({
    meta: [{ title: "Panel de la farmacia — Nara" }],
  }),
});

function PanelPage() {
  return (
    <AppShell title="Panel de la farmacia" subtitle="Resumen del día y accesos rápidos">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Consultas"
            value="—"
            hint="Con el uso del chat"
            icon={MessageSquare}
            tone="mint"
          />
          <MetricCard
            label="Ticket medio"
            value="—"
            hint="Excel de ventas"
            icon={TrendingUp}
            tone="sand"
          />
          <MetricCard
            label="Stock"
            value="—"
            hint="Datos de stock"
            icon={Package}
            tone="sky"
          />
          <MetricCard
            label="Equipo"
            value="—"
            hint="NaraGest"
            icon={Users}
            tone="lavender"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          {/* Qué es Nara */}
          <section className="rounded-2xl border border-line/80 bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-mist text-teal">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Qué es Nara</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  No sustituye tu programa de gestión. Es el{" "}
                  <strong className="font-medium text-ink">asesor con IA</strong> del mostrador y, más
                  adelante, <strong className="font-medium text-ink">NaraGest</strong> para el equipo.
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
              <li className="flex items-center gap-2.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-teal-mist text-[11px] font-bold text-teal">✓</span>
                Criterio (recetas, inspección…)
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-teal-mist text-[11px] font-bold text-teal">✓</span>
                Datos e IA (Excel ahora)
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-teal-mist text-[11px] font-bold text-teal">✓</span>
                Equipo en orden (próximo)
              </li>
            </ul>
          </section>

          {/* Empezar ahora */}
          <section className="rounded-2xl border border-line/80 bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Empezar ahora</h2>
            <div className="mt-4 space-y-2.5">
              <QuickLink to="/consulta" icon={MessageSquare} label="Consultar a Nara" />
              <QuickLink to="/erp" icon={Package} label="Datos e IA" />
              <QuickLink to="/valorar" icon={Users} label="Valorar farmacia" />
            </div>
          </section>
        </div>

        {/* Acciones rápidas + NaraGest */}
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-line/80 bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <h2 className="font-display text-base font-semibold tracking-tight text-ink">Acciones rápidas</h2>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <ActionTile icon={MessageSquare} label="Nueva consulta" to="/consulta" />
              <ActionTile icon={ShoppingCart} label="Datos e IA" to="/erp" />
              <ActionTile icon={Package} label="Stock" to="/erp" />
              <ActionTile icon={Bell} label="Alertas" to="/panel" />
            </div>
          </section>

          <section className="relative overflow-hidden rounded-2xl border border-teal-soft bg-gradient-to-br from-teal-mist to-white p-5 sm:p-6">
            <div className="relative z-10">
              <p className="text-xs font-semibold tracking-wide text-teal uppercase">Próximo</p>
              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-teal-deep">NaraGest</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Fichaje, tareas, caja, temperaturas y notas entre turnos.
              </p>
              <p className="mt-3 inline-flex items-center rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">
                En preparación
              </p>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "soft",
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof MessageSquare;
  tone?: "mint" | "sand" | "sky" | "lavender" | "soft";
}) {
  const tones = {
    mint: "bg-[#E8F3EF] border-[#C5DFD4]",
    sand: "bg-[#F7F0E4] border-[#E6D9C3]",
    sky: "bg-[#E8F1F6] border-[#C9DBE8]",
    lavender: "bg-[#F0EAF6] border-[#D9CEE8]",
    soft: "bg-white border-line",
  };
  return (
    <div className={`rounded-2xl border p-4 shadow-[var(--shadow-soft)] ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted sm:text-xs">{label}</p>
        <Icon className="size-4 text-teal/70" />
      </div>
      <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] text-subtle">{hint}</p>
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof MessageSquare;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-line bg-[#FAF8F4] px-3.5 py-3 text-sm font-medium text-ink transition hover:border-teal hover:bg-teal-mist"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-white text-teal shadow-sm">
        <Icon className="size-4" />
      </span>
      {label}
      <ArrowRight className="ml-auto size-4 text-subtle transition group-hover:translate-x-0.5 group-hover:text-teal" />
    </Link>
  );
}

function ActionTile({
  icon: Icon,
  label,
  to,
}: {
  icon: typeof MessageSquare;
  label: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-start gap-2 rounded-xl border border-line bg-[#FAF8F4] p-3.5 transition hover:border-teal hover:bg-teal-mist"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-white text-teal shadow-sm">
        <Icon className="size-4" />
      </span>
      <span className="text-sm font-medium text-ink">{label}</span>
    </Link>
  );
}
