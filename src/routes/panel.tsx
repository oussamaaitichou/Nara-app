import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  Package,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/panel")({
  component: NaraGestHome,
  head: () => ({
    meta: [{ title: "NaraGest — Gestión de farmacia" }],
  }),
});

function saludo() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

function NaraGestHome() {
  const fecha = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <AppShell title="NaraGest" subtitle="Gestión de la oficina de farmacia">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl border border-line/80 bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-teal uppercase">{fecha}</p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
                {saludo()}. Estás en NaraGest.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                <strong className="font-medium text-ink">Nara</strong> es el producto completo (asesora + gestión).
                <strong className="font-medium text-ink"> NaraGest</strong> es el módulo que gestiona la farmacia:
                stock, equipo, caja, caducidades y el día a día del turno.
              </p>
            </div>
            <Link
              to="/consulta"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-teal px-4 text-sm font-semibold text-primary-foreground"
            >
              <Sparkles className="size-4" /> Preguntar a Nara
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <MetricCard label="Ventas del día" value="—" hint="Ticket / caja" icon={Wallet} tone="mint" to="/ventas" />
          <MetricCard label="Ticket medio" value="—" hint="Excel o TPV" icon={TrendingUp} tone="sand" to="/ventas" />
          <MetricCard label="Stock bajo" value="8" hint="Bajo mínimo" icon={Package} tone="sky" to="/stock" />
          <MetricCard label="Caducidades" value="12" hint="Próximos 90 días" icon={AlertTriangle} tone="sand" to="/caducidades" />
          <MetricCard label="Tareas pendientes" value="5" hint="Turno actual" icon={ClipboardList} tone="lavender" to="/tareas" />
          <MetricCard label="Equipo en turno" value="—" hint="Plantilla" icon={Users} tone="mint" to="/equipo" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-2xl border border-line/80 bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-ink">Próximos vencimientos</h3>
              <Link to="/calendario" className="text-xs font-semibold text-teal">
                Ver calendario
              </Link>
            </div>
            <ul className="mt-4 space-y-2.5">
              {[
                { c: "Caducidad lote amoxicilina", d: "En 12 días", s: "Stock" },
                { c: "Revisión temperatura nevera 2", d: "Hoy", s: "Control" },
                { c: "Guardia de domingo", d: "En 4 días", s: "Equipo" },
                { c: "Pedido programado COFARES", d: "Mañana", s: "Compras" },
              ].map((v) => (
                <li key={v.c} className="flex items-center gap-3 rounded-xl border border-line bg-[#FAF8F4] px-3 py-2.5">
                  <CalendarDays className="size-4 shrink-0 text-teal" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{v.c}</p>
                    <p className="text-[11px] text-muted">{v.s}</p>
                  </div>
                  <span className="text-xs font-semibold text-teal">{v.d}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-line/80 bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-ink">Tareas prioritarias</h3>
              <Link to="/tareas" className="text-xs font-semibold text-teal">
                Ver todas
              </Link>
            </div>
            <ul className="mt-4 space-y-2.5">
              {[
                { t: "Revisar caducidades góndola A", p: "Urgente" },
                { t: "Arqueo de caja turno mañana", p: "Hoy" },
                { t: "Confirmar pedido pendiente", p: "Hoy" },
                { t: "Actualizar cartel de guardias", p: "Próximos días" },
              ].map((x) => (
                <li key={x.t} className="flex items-center gap-3 rounded-xl border border-line bg-[#FAF8F4] px-3 py-2.5">
                  <CheckCircle2 className="size-4 shrink-0 text-muted" />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{x.t}</p>
                  <span className="rounded-full bg-teal-mist px-2 py-0.5 text-[10px] font-semibold text-teal-deep">{x.p}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-teal-soft bg-gradient-to-br from-teal-mist to-white p-5 sm:p-6">
            <p className="text-xs font-semibold tracking-wide text-teal uppercase">Nara · asesora</p>
            <h3 className="mt-1 font-display text-xl font-semibold text-teal-deep">Recomendaciones</h3>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-teal" />
                Hay 12 referencias con caducidad en los próximos 90 días.
              </li>
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-teal" />
                8 productos están bajo el stock mínimo configurado.
              </li>
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-teal" />
                5 tareas del turno siguen abiertas.
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/caducidades" className="inline-flex items-center gap-1 rounded-full bg-teal px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                Ver en NaraGest <ArrowRight className="size-3.5" />
              </Link>
              <Link to="/consulta" className="inline-flex items-center gap-1 rounded-full border border-teal/30 bg-white px-3 py-1.5 text-xs font-semibold text-teal">
                Preguntar a Nara
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-line/80 bg-white p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <h3 className="font-display text-lg font-semibold text-ink">Accesos rápidos · NaraGest</h3>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <ActionTile icon={MessageSquare} label="Consultar a Nara" to="/consulta" />
              <ActionTile icon={Package} label="Stock" to="/stock" />
              <ActionTile icon={Wallet} label="Ventas" to="/ventas" />
              <ActionTile icon={Bell} label="Caducidades" to="/caducidades" />
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
  tone,
  to,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof MessageSquare;
  tone: "mint" | "sand" | "sky" | "lavender";
  to: string;
}) {
  const tones = {
    mint: "bg-[#E8F3EF] border-[#C5DFD4]",
    sand: "bg-[#F7F0E4] border-[#E6D9C3]",
    sky: "bg-[#E8F1F6] border-[#C9DBE8]",
    lavender: "bg-[#F0EAF6] border-[#D9CEE8]",
  };
  return (
    <Link to={to} className={`rounded-2xl border p-4 shadow-[var(--shadow-soft)] transition hover:ring-2 hover:ring-teal/20 ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted sm:text-xs">{label}</p>
        <Icon className="size-4 text-teal/70" />
      </div>
      <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] text-subtle">{hint}</p>
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
