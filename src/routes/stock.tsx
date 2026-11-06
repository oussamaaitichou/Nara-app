import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Download,
  Package,
  Sparkles,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  STOCK_CSV_TEMPLATE,
  alertsToCsv,
  analyzeAll,
  getDemoProducts,
  parseStockCsv,
  stockKpis,
  type StockAlert,
  type StockAlertKind,
  type StockProduct,
} from "@/lib/naragest/stock-engine";

export const Route = createFileRoute("/stock")({
  component: StockInteligentePage,
  head: () => ({ meta: [{ title: "Stock inteligente — NaraGest" }] }),
});

type FilterKey = "todas" | "caducidad" | "bajo_minimo" | "exceso" | "pedido";

function eur(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function StockInteligentePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<StockProduct[]>(() => getDemoProducts());
  const [source, setSource] = useState<"demo" | "csv">("demo");
  const [filter, setFilter] = useState<FilterKey>("todas");
  const [importMsg, setImportMsg] = useState<string | null>(null);

  // Fecha de referencia del piloto (coherente con informes compras/ventas)
  const today = useMemo(() => new Date("2026-11-06"), []);
  const alerts = useMemo(() => analyzeAll(products, today), [products, today]);
  const kpis = useMemo(() => stockKpis(alerts), [alerts]);

  const visible = useMemo(() => {
    return alerts.filter((a) => {
      if (filter === "todas") return a.kind !== "ok";
      if (filter === "pedido") return a.suggestedOrder > 0;
      return a.kind === filter;
    });
  }, [alerts, filter]);

  function downloadTemplate() {
    const blob = new Blob([STOCK_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-stock-naragest.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportAlerts() {
    const blob = new Blob([alertsToCsv(alerts)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "alertas-stock-naragest.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const { products: parsed, errors } = parseStockCsv(text);
      if (parsed.length === 0) {
        setImportMsg(errors[0] ?? "No se pudieron leer productos");
        return;
      }
      setProducts(parsed);
      setSource("csv");
      setImportMsg(
        `Importados ${parsed.length} productos` +
          (errors.length ? ` · ${errors.length} avisos` : ""),
      );
    };
    reader.readAsText(file, "UTF-8");
  }

  function resetDemo() {
    setProducts(getDemoProducts());
    setSource("demo");
    setImportMsg("Datos de demostración restaurados");
  }

  return (
    <AppShell
      title="Stock inteligente"
      subtitle="Caducidades, mínimos, exceso y pedido sugerido"
    >
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>MVP piloto:</strong>{" "}
          {source === "demo"
            ? "Datos de ejemplo. Descarga la plantilla CSV, rellénala con tu stock y súbela para ver alertas reales."
            : "Estás viendo el CSV importado. Las reglas son orientativas; el pedido lo confirma el titular."}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-[#3B6EF5]">
              <Package className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-800">Control de inventario</p>
              <p className="text-[11px] text-slate-500">
                {products.length} referencias · fuente: {source === "demo" ? "demo" : "CSV"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
            >
              <Download className="size-4" /> Plantilla CSV
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#3B6EF5] px-4 text-sm font-semibold text-white"
            >
              <Upload className="size-4" /> Importar CSV
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={exportAlerts}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
            >
              <Download className="size-4" /> Alertas CSV
            </button>
            {source === "csv" ? (
              <button
                type="button"
                onClick={resetDemo}
                className="h-10 rounded-full border border-slate-200 px-3 text-xs font-semibold text-slate-500"
              >
                Volver a demo
              </button>
            ) : null}
          </div>
        </div>

        {importMsg ? (
          <p className="text-sm text-slate-600">{importMsg}</p>
        ) : null}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Caducidad (<90 d)" value={String(kpis.caducidad)} hint={eur(kpis.riskExpiryEur)} />
          <Kpi label="Bajo mínimo" value={String(kpis.bajo)} hint="Posible rotura" />
          <Kpi label="Exceso stock" value={String(kpis.exceso)} hint={eur(kpis.excessEur)} />
          <Kpi
            label="Pedido sugerido"
            value={`${kpis.orderLines} ref.`}
            hint={`${kpis.orderUnits} ud.`}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["todas", "Todas las alertas"],
              ["caducidad", "Caducidad"],
              ["bajo_minimo", "Bajo mínimo"],
              ["exceso", "Exceso"],
              ["pedido", "Con pedido sugerido"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                filter === k
                  ? "border-[#3B6EF5] bg-blue-50 text-[#3B6EF5]"
                  : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Alertas ({visible.length})
              </h3>
            </div>
            {visible.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">
                No hay alertas en este filtro.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-[#F7F8FC] text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                    <tr>
                      <th className="px-3 py-3">Alerta</th>
                      <th className="px-3 py-3">Producto</th>
                      <th className="px-3 py-3">Stock</th>
                      <th className="px-3 py-3">Mín.</th>
                      <th className="px-3 py-3">Caduca</th>
                      <th className="px-3 py-3">Pedido</th>
                      <th className="px-3 py-3">€</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((a) => (
                      <tr key={a.code} className="border-t border-slate-50">
                        <td className="px-3 py-2.5">
                          <KindBadge kind={a.kind} />
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-slate-900">{a.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {a.code} · {a.supplier}
                          </p>
                          <p className="text-[11px] text-slate-500">{a.reason}</p>
                        </td>
                        <td className="px-3 py-2.5">{a.stock}</td>
                        <td className="px-3 py-2.5">{a.minStock}</td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {a.expiry
                            ? new Date(a.expiry).toLocaleDateString("es-ES")
                            : "—"}
                          {a.daysToExpiry != null ? (
                            <span className="block text-[10px] text-slate-400">
                              {a.daysToExpiry < 0
                                ? "caducado"
                                : `${a.daysToExpiry} d`}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-[#3B6EF5]">
                          {a.suggestedOrder > 0 ? a.suggestedOrder : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">{eur(a.immobilizedEur)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="space-y-4">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold text-slate-900">
                <AlertTriangle className="size-4 text-amber-500" />
                Cómo se calcula
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>· <strong>Caducidad:</strong> ≤ 90 días (o ya caducado).</li>
                <li>· <strong>Bajo mínimo:</strong> stock ≤ mínimo configurado.</li>
                <li>· <strong>Exceso:</strong> más de ~3 meses de cobertura según ventas/mes.</li>
                <li>· <strong>Pedido sugerido:</strong> mínimo + 1 mes de venta − stock (0 si hay caducidad/exceso).</li>
              </ul>
            </section>

            <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[#3B6EF5] uppercase">
                <Sparkles className="size-3.5" /> Qué hace NaraGest aquí
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>· Evitar comprar lo que ya sobra o está a punto de caducar.</li>
                <li>· Priorizar roturas (bajo mínimo) con cantidad orientativa.</li>
                <li>· Exportar alertas para el pedido al mayorista o para la gestoría.</li>
                <li>· No sustituye el programa de gestión ni el criterio del titular.</li>
              </ul>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-[#F7F8FC] p-4 text-xs text-slate-500">
              Columnas del CSV:{" "}
              <code className="text-[10px] text-slate-700">
                codigo,nombre,stock,minimo,ventas_mes,caducidad,coste_unitario,proveedor
              </code>
              . Caducidad en AAAA-MM-DD o DD/MM/AAAA.
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  );
}

function KindBadge({ kind }: { kind: StockAlertKind }) {
  if (kind === "ok") return null;
  const map: Record<Exclude<StockAlertKind, "ok">, string> = {
    caducidad: "bg-amber-50 text-amber-800",
    bajo_minimo: "bg-red-50 text-red-700",
    exceso: "bg-slate-100 text-slate-700",
  };
  const label =
    kind === "caducidad" ? "Caducidad" : kind === "bajo_minimo" ? "Mínimo" : "Exceso";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[kind]}`}>
      {label}
    </span>
  );
}
