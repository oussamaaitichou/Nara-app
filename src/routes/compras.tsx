import { createFileRoute } from "@tanstack/react-router";
import {
  Download,
  ShoppingCart,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/compras")({
  component: ComprasInformePage,
  head: () => ({ meta: [{ title: "Informe de compras — NaraGest" }] }),
});

type Periodo = "mes" | "trimestre" | "anio";

const PEDIDOS = [
  { id: "1", numero: "P-2026-118", proveedor: "COFARES", fecha: "2026-11-05", lineas: 24, importe: 1842.5, estado: "Pendiente" as const, familia: "Genéricos" },
  { id: "2", numero: "P-2026-117", proveedor: "Alliance", fecha: "2026-11-04", lineas: 11, importe: 620.0, estado: "Parcial" as const, familia: "OTC" },
  { id: "3", numero: "P-2026-116", proveedor: "Hefame", fecha: "2026-11-03", lineas: 18, importe: 980.25, estado: "Recibido" as const, familia: "Dermocosmética" },
  { id: "4", numero: "P-2026-115", proveedor: "COFARES", fecha: "2026-10-28", lineas: 32, importe: 2410.8, estado: "Recibido" as const, familia: "Genéricos" },
  { id: "5", numero: "P-2026-114", proveedor: "Bidafarma", fecha: "2026-10-22", lineas: 9, importe: 415.4, estado: "Recibido" as const, familia: "Parafarmacia" },
  { id: "6", numero: "P-2026-113", proveedor: "Alliance", fecha: "2026-10-15", lineas: 15, importe: 890.0, estado: "Recibido" as const, familia: "OTC" },
  { id: "7", numero: "P-2026-112", proveedor: "Hefame", fecha: "2026-10-08", lineas: 21, importe: 1320.6, estado: "Recibido" as const, familia: "Genéricos" },
  { id: "8", numero: "P-2026-111", proveedor: "COFARES", fecha: "2026-09-30", lineas: 27, importe: 1980.0, estado: "Recibido" as const, familia: "Genéricos" },
];

function eur(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function ComprasInformePage() {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [proveedor, setProveedor] = useState("todos");

  const proveedores = useMemo(
    () => ["todos", ...Array.from(new Set(PEDIDOS.map((p) => p.proveedor)))],
    [],
  );

  const filtrados = useMemo(() => {
    const now = new Date("2026-11-06");
    return PEDIDOS.filter((p) => {
      const d = new Date(p.fecha);
      if (proveedor !== "todos" && p.proveedor !== proveedor) return false;
      if (periodo === "mes") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (periodo === "trimestre") {
        const q = Math.floor(now.getMonth() / 3);
        return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === now.getFullYear();
      }
      return d.getFullYear() === now.getFullYear();
    });
  }, [periodo, proveedor]);

  const kpis = useMemo(() => {
    const total = filtrados.reduce((s, p) => s + p.importe, 0);
    const pendientes = filtrados.filter((p) => p.estado === "Pendiente" || p.estado === "Parcial");
    const porProv = new Map<string, number>();
    for (const p of filtrados) porProv.set(p.proveedor, (porProv.get(p.proveedor) ?? 0) + p.importe);
    const top = [...porProv.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      total,
      pedidos: filtrados.length,
      ticketMedio: filtrados.length ? total / filtrados.length : 0,
      pendientes: pendientes.length,
      importePendiente: pendientes.reduce((s, p) => s + p.importe, 0),
      topProveedor: top ? `${top[0]} (${eur(top[1])})` : "—",
    };
  }, [filtrados]);

  const porProveedor = useMemo(() => {
    const m = new Map<string, { importe: number; pedidos: number }>();
    for (const p of filtrados) {
      const cur = m.get(p.proveedor) ?? { importe: 0, pedidos: 0 };
      cur.importe += p.importe;
      cur.pedidos += 1;
      m.set(p.proveedor, cur);
    }
    return [...m.entries()].sort((a, b) => b[1].importe - a[1].importe);
  }, [filtrados]);

  function exportCsv() {
    const header = "numero,proveedor,fecha,lineas,importe,estado,familia\n";
    const body = filtrados
      .map((p) => `${p.numero},${p.proveedor},${p.fecha},${p.lineas},${p.importe},${p.estado},${p.familia}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "informe-compras-naragest.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell
      title="Informe de compras"
      subtitle="Pedidos a mayoristas · ejemplo de piloto (datos de demostración)"
    >
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Piloto:</strong> cifras de ejemplo para validar el informe con el farmacéutico.
          Más adelante se conectan albaranes / Excel de proveedor. No son datos de una farmacia real.
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-[#3B6EF5]">
              <ShoppingCart className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-800">Compras a mayoristas</p>
              <p className="text-[11px] text-slate-500">Filtro por periodo y proveedor</p>
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
              ["mes", "Este mes"],
              ["trimestre", "Trimestre"],
              ["anio", "Año 2026"],
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
          <select
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            {proveedores.map((p) => (
              <option key={p} value={p}>
                {p === "todos" ? "Todos los proveedores" : p}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Importe compras" value={eur(kpis.total)} icon={TrendingUp} />
          <Kpi label="Nº pedidos" value={String(kpis.pedidos)} />
          <Kpi label="Pedido medio" value={eur(kpis.ticketMedio)} />
          <Kpi
            label="Pendiente de recibir"
            value={`${kpis.pendientes} · ${eur(kpis.importePendiente)}`}
            icon={TrendingDown}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="font-display text-base font-semibold text-slate-900">Detalle de pedidos</h3>
            </div>
            {filtrados.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">No hay pedidos en este filtro.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-[#F7F8FC] text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Nº</th>
                      <th className="px-4 py-3">Proveedor</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Familia</th>
                      <th className="px-4 py-3">Líneas</th>
                      <th className="px-4 py-3">Importe</th>
                      <th className="px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((p) => (
                      <tr key={p.id} className="border-t border-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{p.numero}</td>
                        <td className="px-4 py-3">{p.proveedor}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(p.fecha).toLocaleDateString("es-ES")}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{p.familia}</td>
                        <td className="px-4 py-3">{p.lineas}</td>
                        <td className="px-4 py-3 font-medium">{eur(p.importe)}</td>
                        <td className="px-4 py-3">
                          <EstadoBadge estado={p.estado} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="space-y-4">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-display text-base font-semibold text-slate-900">Por proveedor</h3>
              <ul className="mt-3 space-y-2">
                {porProveedor.map(([nombre, v]) => (
                  <li key={nombre} className="flex items-center justify-between rounded-xl bg-[#F7F8FC] px-3 py-2 text-sm">
                    <span className="font-medium text-slate-800">{nombre}</span>
                    <span className="text-slate-600">
                      {v.pedidos} ped. · {eur(v.importe)}
                    </span>
                  </li>
                ))}
                {porProveedor.length === 0 ? (
                  <li className="text-sm text-slate-500">Sin datos</li>
                ) : null}
              </ul>
              <p className="mt-3 text-[11px] text-slate-400">Mayor volumen: {kpis.topProveedor}</p>
            </section>

            <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[#3B6EF5] uppercase">
                <Sparkles className="size-3.5" /> Qué puede hacer NaraGest
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>· Ver de un vistazo cuánto se compra y a quién (COFARES, Alliance…).</li>
                <li>· Detectar pedidos pendientes o parciales antes de quedarse sin stock.</li>
                <li>· Comparar mes / trimestre / año y exportar para la gestoría.</li>
                <li>· Más adelante: cruzar compras con ventas y caducidades para no sobrecomprar.</li>
                <li>· Nara (IA) podrá resumir el informe y proponer alertas; las decisiones las toma el titular.</li>
              </ul>
            </section>
          </div>
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

function EstadoBadge({ estado }: { estado: "Pendiente" | "Parcial" | "Recibido" }) {
  const cls =
    estado === "Recibido"
      ? "bg-emerald-50 text-emerald-700"
      : estado === "Parcial"
        ? "bg-amber-50 text-amber-800"
        : "bg-blue-50 text-[#3B6EF5]";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{estado}</span>
  );
}
