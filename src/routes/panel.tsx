import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageSquare, Package, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/panel")({
  component: PanelPage,
});

function PanelPage() {
  return (
    <AppShell title="Panel de la farmacia" subtitle="Resumen del día y accesos rápidos">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card label="Consultas" value="—" hint="Con el uso del chat" tone="mint" />
          <Card label="Ticket medio" value="—" hint="Excel de ventas" tone="sand" />
          <Card label="Stock" value="—" hint="Datos de stock" tone="soft" />
          <Card label="Equipo" value="—" hint="NaraGest" />
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-sm font-semibold text-ink">Qué es Nara</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              No sustituye tu programa de gestión. Es el{" "}
              <strong className="font-medium text-ink">asesor con IA</strong> del mostrador y, más
              adelante, <strong className="font-medium text-ink">NaraGest</strong> para el equipo.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              <li className="flex gap-2"><span className="text-teal">✓</span> Criterio (recetas, inspección…)</li>
              <li className="flex gap-2"><span className="text-teal">✓</span> Datos e IA (Excel ahora)</li>
              <li className="flex gap-2"><span className="text-teal">✓</span> Equipo en orden (próximo)</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-sm font-semibold text-ink">Empezar ahora</h2>
            <div className="mt-3 space-y-2">
              <QuickLink to="/consulta" icon={MessageSquare} label="Consultar a Nara" />
              <QuickLink to="/erp" icon={Package} label="Datos e IA" />
              <QuickLink to="/valorar" icon={Users} label="Valorar farmacia" />
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-teal-soft bg-teal-mist p-4 sm:p-5">
          <h2 className="font-display text-base font-semibold text-teal-deep sm:text-lg">Próximo: NaraGest</h2>
          <p className="mt-1 text-sm text-muted">
            Fichaje, tareas, caja, temperaturas y notas entre turnos.
          </p>
          <p className="mt-2 text-xs font-medium text-teal">En preparación</p>
        </section>
      </div>
    </AppShell>
  );
}

function Card({
  label, value, hint, tone,
}: {
  label: string; value: string; hint: string; tone?: "mint" | "sand" | "soft";
}) {
  const bg =
    tone === "mint" ? "bg-teal-mist border-teal-soft"
    : tone === "sand" ? "bg-surface border-line"
    : tone === "soft" ? "bg-surface border-line"
    : "bg-surface border-line";
  return (
    <div className={`rounded-xl border p-3 sm:rounded-2xl sm:p-4 shadow-[var(--shadow-soft)] ${bg}`}>
      <p className="text-[11px] font-medium text-muted sm:text-xs">{label}</p>
      <p className="mt-0.5 font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">{value}</p>
      <p className="mt-0.5 text-[11px] text-subtle sm:text-xs">{hint}</p>
    </div>
  );
}

function QuickLink({
  to, icon: Icon, label,
}: {
  to: string; icon: typeof MessageSquare; label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-line bg-bg/50 px-3 py-2.5 text-sm font-medium text-ink transition hover:border-teal hover:bg-teal-mist"
    >
      <Icon className="size-4 text-teal" />
      {label}
      <ArrowRight className="ml-auto size-4 text-subtle" />
    </Link>
  );
}
