import { createFileRoute } from "@tanstack/react-router";
import { Download, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/ventas")({
  component: VentasInformePage,
  head: () => ({ meta: [{ title: "Informe de ventas — NaraGest" }] }),
});

type Periodo = "hoy" | "semana" | "mes";

const TICKETS = [
  { id: "1", ticket: "T-10482", fecha: "2026-11-06", hora: "09:14", importe: 24.5, pago: "Tarjeta", lineas: 3, tipo: "venta" as const },
  { id: "2", ticket: "T-10483", fecha: "2026-11-06", hora: "09:22", importe: 8.9, pago: "Efectivo", lineas: 1, tipo: "venta" as const },
  { id: "3", ticket: "T-10484", fecha: "2026-11-06", hora: "09:41", importe: 56.2, pago: "Tarjeta", lineas: 5, tipo: "venta" as const },
  { id: "4", ticket: "T-10485", fecha: "2026-11-06", hora: "10:05", importe: 12.4, pago: "Tarjeta", lineas: 2, tipo: "venta" as const },
  { id: "5", ticket: "T-10486", fecha: "2026-11-06", hora: "10:18", importe: -8.9, pago: "Tarjeta", lineas: 1, tipo: "devolucion" as const },
  { id: "6", ticket: "T-10440", fecha: "2026-11-05", hora: "11:02", importe: 33.1, pago: "Efectivo", lineas: 4, tipo: "venta" as const },
  { id: "7", ticket: "T-10441", fecha: "2026-11-05", hora: "12:40", importe: 19.75, pago: "Tarjeta", lineas: 2, tipo: "venta" as const },
  { id: "8", ticket: "T-10390", fecha: "2026-11-03", hora: "16:20", importe: 41.0, pago: "Tarjeta", lineas: 3, tipo: "venta" as const },
  { id: "9", ticket: "T-10350", fecha: "2026-10-28", hora: "10:10", importe: 27.3, pago: "Efectivo", lineas: 2, tipo: "venta" as const },
  { id: "10", ticket: "T-10351", fecha: "2026-10-28", hora: "13:45", importe: 64.8, pago: "Tarjeta", lineas: 6, tipo: "venta" as const },
];

function eur(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function VentasInformePage() {
  const [periodo, setPeriodo] = useState<Periodo>("hoy");
  const [soloDev, setSoloDev] = useState(false);
  const ref = new Date("2026-11-06");

  const filtrados = useMemo(() => {
    return TICKETS.filter((t) => {
      const d = new Date(t.fecha);
      if (soloDev && t.tipo !== "devolucion") return false;
      if (periodo === "hoy") return t.fecha === "2026-11-06";
      if (periodo === "semana") {
        const diff = (ref.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff < 7;
      }
      return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
    });
  }, [periodo, soloDev]);

  const kpis = useMemo(() => {
    const ventas = filtrados.filter((t) => t.tipo === "venta");
    const devs = filtrados.filter((t) => t.tipo === "devolucion");
    const bruto = ventas.reduce((s, t) => s + t.importe, 0);
    const neto = filtrados.reduce((s, t) => s + t.importe, 0);
    const ticketMedio = ventas.length ? bruto / ventas.length : 0;
    const tarjeta = filtrados.filter((t) => t.pago === "Tarjeta").reduce((s, t) => s + Math.max(t.importe, 0), 0);
    const efectivo = filtrados.filter((t) => t.pago === "Efectivo").reduce((s, t) => s + Math.max(t.importe, 0), 0);
    return {
      bruto,
      neto,
      tickets: ventas.length,
      ticketMedio,
      devoluciones: devs.length,
      tarjeta,
      efectivo,
    };
  }, [filtrados]);

  function exportCsv() {
    const header = "ticket,fecha,hora,importe,pago,lineas,tipo\n";
    const body = filtrados
      .map((t) => `${t.ticket},${t.fecha},${t.hora},${t.importe},${t.pago},${t.lineas},${t.tipo}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "informe-ventas-naragest.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell
      title="Informe de ventas"
      subtitle="Tickets, medios de pago y devoluciones · ejemplo de piloto"
    >
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Piloto:</strong> tickets de demostración. El objetivo es validar el informe con el farmacéutico.
          Después se podrá importar Excel del TPV o conectar la caja.
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-[#3B6EF5]">
              <Wallet className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-800">Ventas y ticket</p>
              <p className="text-[11px] text-slate-500">Caja del día / semana / mes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
          >
            <Download className="size-4" /> Exportar CSV
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["hoy", "Hoy"],
              ["semana", "Semana"],
              ["mes", "Mes"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setPeriodo(k)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                periodo === k
                  ? "border-[#3B6EF5] bg-blue-50 text-[#3B6EF5]"
                  : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSoloDev((v) => !v)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              soloDev
                ? "border-amber-400 bg-amber-50 text-amber-800"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            Solo devoluciones
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Ventas netas" value={eur(kpis.neto)} icon={TrendingUp} />
          <Kpi label="Tickets" value={String(kpis.tickets)} />
          <Kpi label="Ticket medio" value={eur(kpis.ticketMedio)} />
          <Kpi label="Devoluciones" value={String(kpis.devoluciones)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-medium text-slate-500">Tarjeta</p>
            <p className="mt-1 font-display text-xl font-semibold text-slate-900">{eur(kpis.tarjeta)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-medium text-slate-500">Efectivo</p>
            <p className="mt-1 font-display text-xl font-semibold text-slate-900">{eur(kpis.efectivo)}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="font-display text-base font-semibold text-slate-900">Detalle de tickets</h3>
            </div>
            {filtrados.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">No hay tickets en este filtro.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-[#F7F8FC] text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Ticket</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Hora</th>
                      <th className="px-4 py-3">Importe</th>
                      <th className="px-4 py-3">Pago</th>
                      <th className="px-4 py-3">Líneas</th>
                      <th className="px-4 py-3">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((t) => (
                      <tr key={t.id} className="border-t border-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{t.ticket}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(t.fecha).toLocaleDateString("es-ES")}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{t.hora}</td>
                        <td
                          className={`px-4 py-3 font-medium ${t.importe < 0 ? "text-red-600" : "text-slate-900"}`}
                        >
                          {eur(t.importe)}
                        </td>
                        <td className="px-4 py-3">{t.pago}</td>
                        <td className="px-4 py-3">{t.lineas}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              t.tipo === "devolucion"
                                ? "bg-red-50 text-red-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {t.tipo === "devolucion" ? "Devolución" : "Venta"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[#3B6EF5] uppercase">
              <Sparkles className="size-3.5" /> Qué puede hacer NaraGest
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>· Ver ventas del día, semana o mes sin abrir el TPV a cada rato.</li>
              <li>· Separar tarjeta / efectivo para el arqueo de caja.</li>
              <li>· Controlar devoluciones y ticket medio.</li>
              <li>· Exportar CSV para contabilidad o gestoría.</li>
              <li>· Más adelante: importar Excel del TPV y cruzar ventas con compras (margen).</li>
              <li>· Nara puede resumir “cómo va el día” y avisar si el ticket medio cae; no sustituye la caja oficial.</li>
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof TrendingUp;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-slate-500">{label}</p>
        {Icon ? <Icon className="size-4 text-slate-300" /> : null}
      </div>
      <p className="mt-1 font-display text-xl font-semibold text-slate-900 sm:text-2xl">{value}</p>
    </div>
  );
}
