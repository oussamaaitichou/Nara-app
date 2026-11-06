import { createFileRoute } from "@tanstack/react-router";
import { Download, Plus, Trash2, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  addMarginLine,
  loadPilot,
  marginStats,
  removeMarginLine,
  type PilotMarginLine,
} from "@/lib/naragest/pilot-store";

export const Route = createFileRoute("/rentabilidad")({
  component: RentabilidadPage,
  head: () => ({ meta: [{ title: "Rentabilidad — NaraGest" }] }),
});

function eur(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function RentabilidadPage() {
  const [rows, setRows] = useState<PilotMarginLine[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    producto: "",
    categoria: "OTC",
    unidades: 1,
    pvp: 0,
    coste: 0,
  });

  function refresh() {
    setRows(loadPilot().margins);
  }
  useEffect(() => {
    refresh();
  }, []);

  const enriched = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        ...marginStats(r),
      })),
    [rows],
  );

  const totals = useMemo(() => {
    const ventas = enriched.reduce((s, r) => s + r.ventas, 0);
    const coste = enriched.reduce((s, r) => s + r.coste, 0);
    const margen = ventas - coste;
    const pct = ventas > 0 ? (margen / ventas) * 100 : 0;
    return { ventas, coste, margen, pct };
  }, [enriched]);

  const byCat = useMemo(() => {
    const m = new Map<string, { ventas: number; coste: number }>();
    for (const r of enriched) {
      const cur = m.get(r.categoria) ?? { ventas: 0, coste: 0 };
      cur.ventas += r.ventas;
      cur.coste += r.coste;
      m.set(r.categoria, cur);
    }
    return [...m.entries()]
      .map(([cat, v]) => ({
        cat,
        ventas: v.ventas,
        coste: v.coste,
        margen: v.ventas - v.coste,
        pct: v.ventas > 0 ? ((v.ventas - v.coste) / v.ventas) * 100 : 0,
      }))
      .sort((a, b) => b.margen - a.margen);
  }, [enriched]);

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.producto.trim() || form.pvp <= 0) return;
    addMarginLine({
      producto: form.producto.trim(),
      categoria: form.categoria.trim() || "Otros",
      unidades: Math.max(1, form.unidades),
      pvp: form.pvp,
      coste: Math.max(0, form.coste),
    });
    setForm({ producto: "", categoria: "OTC", unidades: 1, pvp: 0, coste: 0 });
    setOpen(false);
    refresh();
  }

  function exportCsv() {
    const header = "producto,categoria,unidades,pvp,coste,margen_ud,margen_pct,margen_total,ventas\n";
    const body = enriched
      .map(
        (r) =>
          `${r.producto},${r.categoria},${r.unidades},${r.pvp},${r.coste},${r.marginUnit.toFixed(2)},${r.marginPct.toFixed(1)},${r.marginTotal.toFixed(2)},${r.ventas.toFixed(2)}`,
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rentabilidad-naragest.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell title="Rentabilidad" subtitle="Márgenes por producto y categoría · datos editables">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-[#3B6EF5]">
              <TrendingUp className="size-5" />
            </span>
            <p className="text-sm text-slate-500">{rows.length} productos en el análisis</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportCsv} className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold">
              <Download className="size-4" /> CSV
            </button>
            <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#3B6EF5] px-4 text-sm font-semibold text-white">
              <Plus className="size-4" /> Añadir producto
            </button>
          </div>
        </div>

        {open ? (
          <form onSubmit={onAdd} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
            <h3 className="font-display text-lg font-semibold sm:col-span-2">Nueva línea de margen</h3>
            <label className="text-sm sm:col-span-2">Producto *
              <input required value={form.producto} onChange={(e) => setForm((f) => ({ ...f, producto: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <label className="text-sm">Categoría
              <input value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <label className="text-sm">Unidades
              <input type="number" min={1} value={form.unidades} onChange={(e) => setForm((f) => ({ ...f, unidades: Number(e.target.value) }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <label className="text-sm">PVP unitario € *
              <input type="number" step="0.01" min={0.01} required value={form.pvp || ""} onChange={(e) => setForm((f) => ({ ...f, pvp: Number(e.target.value) }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <label className="text-sm">Coste unitario €
              <input type="number" step="0.01" min={0} value={form.coste || ""} onChange={(e) => setForm((f) => ({ ...f, coste: Number(e.target.value) }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" className="h-10 rounded-full bg-[#3B6EF5] px-4 text-sm font-semibold text-white">Guardar</button>
              <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-full border border-slate-200 px-4 text-sm font-semibold">Cancelar</button>
            </div>
          </form>
        ) : null}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Ventas" value={eur(totals.ventas)} />
          <Kpi label="Coste" value={eur(totals.coste)} />
          <Kpi label="Margen bruto" value={eur(totals.margen)} />
          <Kpi label="Margen %" value={`${totals.pct.toFixed(1)} %`} />
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-display text-base font-semibold">Por categoría</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-[11px] font-semibold uppercase text-slate-500">
                <tr>
                  <th className="py-2">Categoría</th>
                  <th className="py-2">Ventas</th>
                  <th className="py-2">Coste</th>
                  <th className="py-2">Margen €</th>
                  <th className="py-2">Margen %</th>
                </tr>
              </thead>
              <tbody>
                {byCat.map((c) => (
                  <tr key={c.cat} className="border-t border-slate-50">
                    <td className="py-2 font-medium">{c.cat}</td>
                    <td className="py-2">{eur(c.ventas)}</td>
                    <td className="py-2">{eur(c.coste)}</td>
                    <td className="py-2 font-medium">{eur(c.margen)}</td>
                    <td className={`py-2 font-semibold ${c.pct < 25 ? "text-red-600" : "text-emerald-700"}`}>
                      {c.pct.toFixed(1)} %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-display text-base font-semibold">Detalle por producto</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-[#F7F8FC] text-[11px] font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Cat.</th>
                  <th className="px-4 py-3">Ud.</th>
                  <th className="px-4 py-3">PVP</th>
                  <th className="px-4 py-3">Coste</th>
                  <th className="px-4 py-3">Margen ud.</th>
                  <th className="px-4 py-3">Margen %</th>
                  <th className="px-4 py-3">Margen total</th>
                  <th className="px-4 py-3 text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {enriched
                  .slice()
                  .sort((a, b) => a.marginPct - b.marginPct)
                  .map((r) => (
                    <tr key={r.id} className="border-t border-slate-50">
                      <td className="px-4 py-3 font-medium">{r.producto}</td>
                      <td className="px-4 py-3">{r.categoria}</td>
                      <td className="px-4 py-3">{r.unidades}</td>
                      <td className="px-4 py-3">{eur(r.pvp)}</td>
                      <td className="px-4 py-3">{eur(r.coste)}</td>
                      <td className="px-4 py-3">{eur(r.marginUnit)}</td>
                      <td className={`px-4 py-3 font-semibold ${r.marginPct < 22 ? "text-red-600" : "text-emerald-700"}`}>
                        {r.marginPct.toFixed(1)} %
                      </td>
                      <td className="px-4 py-3 font-medium">{eur(r.marginTotal)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            removeMarginLine(r.id);
                            refresh();
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"
                        >
                          <Trash2 className="size-3.5" /> Borrar
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">Añade productos con PVP y coste para ver márgenes.</p>
          ) : null}
        </section>

        <p className="text-xs text-slate-400">
          Fórmulas: margen ud. = PVP − coste · margen % = margen ud. / PVP · margen total = unidades × margen ud.
          Los datos se guardan en este navegador (piloto). En rojo: margen < 22 % (producto) o < 25 % (categoría).
        </p>
      </div>
    </AppShell>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
