import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  MessageSquare,
  Package,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { buildDashboardInsights, type Insight } from "@/lib/naragest/insights";

export const Route = createFileRoute("/panel")({
  component: NaraGestHome,
  head: () => ({
    meta: [{ title: "NaraGest — Dashboard inteligente" }],
  }),
});

function saludo() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

function eur(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function NaraGestHome() {
  const fecha = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const [insights, setInsights] = useState<Insight[]>([]);
  const [kpis, setKpis] = useState({
    ventasNetas: 0,
    compras: 0,
    margenPct: 0,
    margenEur: 0,
    stockCaducidad: 0,
    stockBajo: 0,
    stockExceso: 0,
    pedidosPendientes: 0,
  });

  useEffect(() => {
    const data = buildDashboardInsights(new Date("2026-11-06"));
    setInsights(data.insights);
    setKpis(data.kpis);
  }, []);

  return (
    <AppShell title="NaraGest" subtitle="Dashboard inteligente · qué pasa y qué hacer">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-[#3B6EF5] uppercase">{fecha}</p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-slate-900">
                {saludo()}. Tu farmacia de un vistazo.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                <strong className="text-slate-800">Nara</strong> interpreta y recomienda.{" "}
                <strong className="text-slate-800">NaraGest</strong> concentra stock, compras, ventas y rentabilidad.
                Las cifras sensibles las valida siempre el titular.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/oportunidades"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
              >
                <Lightbulb className="size-4 text-amber-500" /> Ideas
              </Link>
              <Link
                to="/consulta"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#3B6EF5] px-4 text-sm font-semibold text-white shadow-sm shadow-blue-500/20"
              >
                <Sparkles className="size-4" /> Preguntar a Nara
              </Link>
            </div>
          </div>
        </section>

        {/* FarmaIA: Tu IA ha detectado esto */}
        <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-[#3B6EF5]" />
            <h3 className="font-display text-lg font-semibold text-slate-900">
              Nara ha detectado esto hoy
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Conclusiones con reglas transparentes sobre stock, compras, ventas y márgenes. No sustituyen el criterio profesional.
          </p>
          <ul className="mt-4 space-y-3">
            {insights.map((ins) => (
              <li
                key={ins.id}
                className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ToneBadge tone={ins.tone} />
                      <p className="font-semibold text-slate-900">{ins.title}</p>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-600">{ins.body}</p>
                    {ins.impact ? (
                      <p className="mt-1 text-xs font-medium text-slate-800">{ins.impact}</p>
                    ) : null}
                    <p className="mt-1 text-[10px] text-slate-400">Fuente: {ins.source}</p>
                  </div>
                  <Link
                    to={ins.href}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#3B6EF5] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    {ins.cta} <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Ventas netas" value={eur(kpis.ventasNetas)} hint="Tickets del piloto" icon={Wallet} tone="peach" to="/ventas" />
          <MetricCard label="Compras" value={eur(kpis.compras)} hint={`${kpis.pedidosPendientes} pendientes`} icon={ShoppingCart} tone="lilac" to="/compras" />
          <MetricCard label="Margen bruto" value={eur(kpis.margenEur)} hint={`${kpis.margenPct.toFixed(1)} %`} icon={TrendingUp} tone="mint" to="/rentabilidad" />
          <MetricCard label="Alertas stock" value={String(kpis.stockCaducidad + kpis.stockBajo + kpis.stockExceso)} hint={`${kpis.stockCaducidad} cad. · ${kpis.stockBajo} mín. · ${kpis.stockExceso} exceso`} icon={Package} tone="sky" to="/stock" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="font-display text-lg font-semibold text-slate-900">Accesos · gestión</h3>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <ActionTile icon={MessageSquare} label="Asistente Nara" to="/consulta" />
              <ActionTile icon={Package} label="Stock inteligente" to="/stock" />
              <ActionTile icon={ShoppingCart} label="Compras" to="/compras" />
              <ActionTile icon={Wallet} label="Ventas" to="/ventas" />
              <ActionTile icon={TrendingUp} label="Rentabilidad" to="/rentabilidad" />
              <ActionTile icon={Lightbulb} label="Ideas y oportunidades" to="/oportunidades" />
              <ActionTile icon={AlertTriangle} label="Caducidades" to="/caducidades" />
              <ActionTile icon={Sparkles} label="Informes (CSV en módulos)" to="/rentabilidad" />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="font-display text-lg font-semibold text-slate-900">Cómo trabaja Nara</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>· <strong>Inteligencia:</strong> interpreta stock, compras y márgenes, no solo lista datos.</li>
              <li>· <strong>Proactividad:</strong> las alertas de arriba salen solas al entrar al panel.</li>
              <li>· <strong>Acción:</strong> cada alerta enlaza al módulo donde puedes actuar.</li>
              <li>· <strong>Límite:</strong> Nara no lanza pedidos ni altera el ERP sin tu autorización.</li>
            </ul>
            <p className="mt-4 text-xs text-slate-400">
              Si importas CSV en Stock o das de alta compras/ventas/márgenes, este panel se actualiza al recargar.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function ToneBadge({ tone }: { tone: Insight["tone"] }) {
  const map = {
    urgente: "bg-red-50 text-red-700",
    atencion: "bg-amber-50 text-amber-800",
    oportunidad: "bg-emerald-50 text-emerald-800",
    ok: "bg-slate-100 text-slate-600",
  };
  const label = {
    urgente: "Urgente",
    atencion: "Atención",
    oportunidad: "Oportunidad",
    ok: "OK",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[tone]}`}>
      {label[tone]}
    </span>
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
  tone: "peach" | "lilac" | "sky" | "mint";
  to: string;
}) {
  const tones = {
    peach: "bg-[#FFF4E8] border-[#F5E0C8]",
    lilac: "bg-[#F3EEFF] border-[#E0D6F5]",
    sky: "bg-[#E8F3FF] border-[#C9DBF0]",
    mint: "bg-[#E8F8F2] border-[#C5E8DA]",
  };
  return (
    <Link to={to} className={`rounded-3xl border p-4 shadow-sm transition hover:shadow-md ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-slate-500 sm:text-xs">{label}</p>
        <Icon className="size-4 text-slate-400" />
      </div>
      <p className="mt-1 font-display text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>
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
      className="flex flex-col items-start gap-2 rounded-2xl border border-slate-100 bg-[#F7F8FC] p-3.5 transition hover:border-blue-200 hover:bg-blue-50/50"
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-white text-[#3B6EF5] shadow-sm">
        <Icon className="size-4" />
      </span>
      <span className="text-sm font-medium text-slate-800">{label}</span>
    </Link>
  );
}
