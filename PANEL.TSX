import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageSquare, Package, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/panel")({
  component: PanelPage,
});

function PanelPage() {
  return (
    <AppShell title="Panel de la farmacia" subtitle="Resumen del día y accesos rápidos">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card label="Consultas a Nara" value="—" hint="Se activará con el uso del chat" tone="mint" />
          <Card label="Ticket medio" value="—" hint="Sube un Excel de ventas" tone="sand" />
          <Card label="Alertas de stock" value="—" hint="Conecta datos de stock" tone="soft" />
          <Card label="Equipo" value="—" hint="Próximo: NaraGest y personal" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-sm font-semibold text-ink">Qué es Nara</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              No sustituye tu programa de gestión (Unycop u otro). Es el{" "}
              <strong className="font-medium text-ink">asesor con IA</strong> para decidir mejor y,
              más adelante, <strong className="font-medium text-ink">NaraGest</strong> para ordenar
              cada turno: fichaje, tareas, caja, temperaturas y notas.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              <li className="flex gap-2"><span className="text-teal">✓</span> Criterio de mostrador (recetas, inspección…)</li>
              <li className="flex gap-2"><span className="text-teal">✓</span> Datos e IA (Excel ahora · ERP después)</li>
              <li className="flex gap-2"><span className="text-teal">✓</span> Equipo en orden (NaraGest · en desarrollo)</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-sm font-semibold text-ink">Empezar ahora</h2>
            <div className="mt-3 space-y-2">
              <QuickLink to="/consulta" icon={MessageSquare} label="Consultar a Nara" />
              <QuickLink to="/erp" icon={Package} label="Datos e IA / gestión" />
              <QuickLink to="/valorar" icon={Users} label="Valorar farmacia" />
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-teal-soft bg-teal-mist/50 p-5">
          <h2 className="font-display text-lg font-semibold text-teal-deep">Próximo: NaraGest</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Cada turno en orden. Fichaje, tareas por perfil, caja, temperaturas, notas entre
            turnos e incidencias — para que el equipo sepa qué hacer y tú controles sin estar en
            el mostrador.
          </p>
          <p className="mt-3 text-xs font-medium text-teal">Fase en preparación · tras acceso y datos</p>
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
    : tone === "sand" ? "bg-surface-2 border-line"
    : tone === "soft" ? "bg-bg-warm border-line"
    : "bg-surface border-line";
  return (
    <div className={`rounded-2xl border p-4 shadow-[var(--shadow-soft)] ${bg}`}>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-xs text-subtle">{hint}</p>
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
      className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm font-medium text-ink transition hover:border-teal hover:bg-teal-mist/40"
    >
      <Icon className="size-4 text-teal" />
      {label}
      <ArrowRight className="ml-auto size-4 text-subtle" />
    </Link>
  );
}
