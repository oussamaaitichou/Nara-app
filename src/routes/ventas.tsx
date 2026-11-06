import { createFileRoute } from "@tanstack/react-router";
import { Download, Plus, Trash2, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { addSale, loadPilot, removeSale, type PilotSale } from "@/lib/naragest/pilot-store";

export const Route = createFileRoute("/ventas")({
  component: VentasPage,
  head: () => ({ meta: [{ title: "Ventas — NaraGest" }] }),
});

type Periodo = "hoy" | "semana" | "mes" | "todo";

function eur(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function VentasPage() {
  const [rows, setRows] = useState<PilotSale[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>("todo");
  const [soloDev, setSoloDev] = useState(false);
  const [open, setOpen] = useState(false);
  const nowIso = new Date().toISOString();
  const [form, setForm] = useState({
    fecha: nowIso.slice(0, 10),
    hora: nowIso.slice(11, 16),
    importe: 0,
    pago: "Tarjeta" as PilotSale["pago"],
    lineas: 1,
    tipo: "venta" as PilotSale["tipo"],
    categoria: "OTC",
  });

  function refresh() {
    setRows(loadPilot().sales);
  }
  useEffect(() => {
    refresh();
  }, []);

  const filtrados = useMemo(() => {
    const now = new Date();
    return rows.filter((t) => {
      if (soloDev && t.tipo !== "devolucion") return false;
      const d = new Date(t.fecha);
      if (periodo === "todo") return true;
      if (periodo === "hoy") return t.fecha === now.toISOString().slice(0, 10);
      if (periodo === "semana") {
        const diff = (now.getTime() - d.getTime()) / 86400000;
        return diff >= 0 && diff < 7;
      }
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [rows, periodo, soloDev]);

  const kpis = useMemo(() => {
    const ventas = filtrados.filter((t) => t.tipo === "venta");
    const neto = filtrados.reduce((s, t) => s + t.importe, 0);
    const bruto = ventas.reduce((s, t) => s + t.importe, 0);
    return {
      neto,
      tickets: ventas.length,
      medio: ventas.length ? bruto / ventas.length : 0,
      devoluciones: filtrados.filter((t) => t.tipo === "devolucion").length,
      tarjeta: filtrados.filter((t) => t.pago === "Tarjeta").reduce((s, t) => s + Math.max(t.importe, 0), 0),
      efectivo: filtrados.filter((t) => t.pago === "Efectivo").reduce((s, t) => s + Math.max(t.importe, 0), 0),
    };
  }, [filtrados]);

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (form.importe === 0) return;
    addSale({
      fecha: form.fecha,
      hora: form.hora,
      importe: form.importe,
      pago: form.pago,
      lineas: Math.max(1, form.lineas),
      tipo: form.tipo,
      categoria: form.categoria.trim() || "Otros",
    });
    setOpen(false);
    setForm((f) => ({ ...f, importe: 0, lineas: 1 }));
    refresh();
  }

  function exportCsv() {
    const header = "ticket,fecha,hora,importe,pago,lineas,tipo,categoria\n";
    const body = filtrados
      .map((t) => `${t.ticket},${t.fecha},${t.hora},${t.importe},${t.pago},${t.lineas},${t.tipo},${t.categoria}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ventas-naragest.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell title="Ventas" subtitle="Tickets reales del piloto · se guardan en este navegador">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-[#3B6EF5]">
              <Wallet className="size-5" />
            </span>
            <p className="text-sm text-slate-500">{filtrados.length} tickets en el filtro</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportCsv} className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold">
              <Download className="size-4" /> CSV
            </button>
            <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#3B6EF5] px-4 text-sm font-semibold text-white">
              <Plus className="size-4" /> Nuevo ticket
            </button>
          </div>
        </div>

        {open ? (
          <form onSubmit={onAdd} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
            <h3 className="font-display text-lg font-semibold sm:col-span-2">Alta de ticket</h3>
            <label className="text-sm">Fecha
              <input type="date" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <label className="text-sm">Hora
              <input type="time" value={form.hora} onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <label className="text-sm">Importe € *
              <input type="number" step="0.01" min={0.01} required value={form.importe || ""} onChange={(e) => setForm((f) => ({ ...f, importe: Number(e.target.value) }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <label className="text-sm">Líneas
              <input type="number" min={1} value={form.lineas} onChange={(e) => setForm((f) => ({ ...f, lineas: Number(e.target.value) }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <label className="text-sm">Pago
              <select value={form.pago} onChange={(e) => setForm((f) => ({ ...f, pago: e.target.value as PilotSale["pago"] }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
                <option>Tarjeta</option>
                <option>Efectivo</option>
              </select>
            </label>
            <label className="text-sm">Tipo
              <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as PilotSale["tipo"] }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
                <option value="venta">Venta</option>
                <option value="devolucion">Devolución</option>
              </select>
            </label>
            <label className="text-sm sm:col-span-2">Categoría
              <input value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" className="h-10 rounded-full bg-[#3B6EF5] px-4 text-sm font-semibold text-white">Guardar</button>
              <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-full border border-slate-200 px-4 text-sm font-semibold">Cancelar</button>
            </div>
          </form>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {([["todo", "Todo"], ["hoy", "Hoy"], ["semana", "Semana"], ["mes", "Mes"]] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setPeriodo(k)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${periodo === k ? "border-[#3B6EF5] bg-blue-50 text-[#3B6EF5]" : "border-slate-200 bg-white text-slate-500"}`}>{l}</button>
          ))}
          <button type="button" onClick={() => setSoloDev((v) => !v)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${soloDev ? "border-amber-400 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-500"}`}>Solo devoluciones</button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Ventas netas" value={eur(kpis.neto)} />
          <Kpi label="Tickets" value={String(kpis.tickets)} />
          <Kpi label="Ticket medio" value={eur(kpis.medio)} />
          <Kpi label="Devoluciones" value={String(kpis.devoluciones)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Kpi label="Tarjeta" value={eur(kpis.tarjeta)} />
          <Kpi label="Efectivo" value={eur(kpis.efectivo)} />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#F7F8FC] text-[11px] font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Importe</th>
                  <th className="px-4 py-3">Pago</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((t) => (
                  <tr key={t.id} className="border-t border-slate-50">
                    <td className="px-4 py-3 font-medium">{t.ticket}</td>
                    <td className="px-4 py-3">{new Date(t.fecha).toLocaleDateString("es-ES")} {t.hora}</td>
                    <td className={`px-4 py-3 font-medium ${t.importe < 0 ? "text-red-600" : ""}`}>{eur(t.importe)}</td>
                    <td className="px-4 py-3">{t.pago}</td>
                    <td className="px-4 py-3">{t.categoria}</td>
                    <td className="px-4 py-3">{t.tipo === "devolucion" ? "Devolución" : "Venta"}</td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => { removeSale(t.id); refresh(); }} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                        <Trash2 className="size-3.5" /> Borrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtrados.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No hay tickets. Crea uno con «Nuevo ticket».</p> : null}
        </div>
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
