import { createFileRoute } from "@tanstack/react-router";
import { Download, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  apiCreatePurchase,
  apiDeletePurchase,
  apiListPurchases,
  apiUpdatePurchaseStatus,
} from "@/lib/naragest/commerce-api";
import type { PilotPurchase } from "@/lib/naragest/pilot-store";

export const Route = createFileRoute("/compras")({
  component: ComprasPage,
  head: () => ({ meta: [{ title: "Compras — NaraGest" }] }),
});

type Periodo = "mes" | "trimestre" | "anio" | "todo";

function eur(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function ComprasPage() {
  const [rows, setRows] = useState<PilotPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>("todo");
  const [proveedor, setProveedor] = useState("todos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    proveedor: "COFARES",
    fecha: new Date().toISOString().slice(0, 10),
    lineas: 1,
    importe: 0,
    estado: "Pendiente" as PilotPurchase["estado"],
    familia: "Genéricos",
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await apiListPurchases());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const proveedores = useMemo(
    () => ["todos", ...Array.from(new Set(rows.map((p) => p.proveedor)))],
    [rows],
  );

  const filtrados = useMemo(() => {
    const now = new Date();
    return rows.filter((p) => {
      const d = new Date(p.fecha);
      if (proveedor !== "todos" && p.proveedor !== proveedor) return false;
      if (periodo === "todo") return true;
      if (periodo === "mes") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (periodo === "trimestre") {
        return Math.floor(d.getMonth() / 3) === Math.floor(now.getMonth() / 3) && d.getFullYear() === now.getFullYear();
      }
      return d.getFullYear() === now.getFullYear();
    });
  }, [rows, periodo, proveedor]);

  const kpis = useMemo(() => {
    const total = filtrados.reduce((s, p) => s + p.importe, 0);
    const pendientes = filtrados.filter((p) => p.estado !== "Recibido");
    return {
      total,
      pedidos: filtrados.length,
      medio: filtrados.length ? total / filtrados.length : 0,
      pendientes: pendientes.length,
      importePendiente: pendientes.reduce((s, p) => s + p.importe, 0),
    };
  }, [filtrados]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.proveedor.trim() || form.importe <= 0) return;
    await apiCreatePurchase({
      supplier: form.proveedor.trim(),
      purchaseDate: form.fecha,
      linesCount: Math.max(1, form.lineas),
      amount: form.importe,
      status: form.estado,
      family: form.familia.trim() || "Otros",
    });
    setOpen(false);
    setForm((f) => ({ ...f, lineas: 1, importe: 0 }));
    await refresh();
  }

  function exportCsv() {
    const header = "numero,proveedor,fecha,lineas,importe,estado,familia\n";
    const body = filtrados
      .map((p) => `${p.numero},${p.proveedor},${p.fecha},${p.lineas},${p.importe},${p.estado},${p.familia}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compras-naragest.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell title="Compras" subtitle="Pedidos multi-farmacia · API + respaldo local">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-[#3B6EF5]">
              <ShoppingCart className="size-5" />
            </span>
            <p className="text-sm text-slate-500">
              {loading ? "Cargando…" : `${filtrados.length} pedidos en el filtro`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportCsv} className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold">
              <Download className="size-4" /> CSV
            </button>
            <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#3B6EF5] px-4 text-sm font-semibold text-white">
              <Plus className="size-4" /> Nuevo pedido
            </button>
          </div>
        </div>

        {open ? (
          <form onSubmit={(e) => void onAdd(e)} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
            <h3 className="font-display text-lg font-semibold sm:col-span-2">Alta de pedido</h3>
            <label className="text-sm">Proveedor *
              <input required value={form.proveedor} onChange={(e) => setForm((f) => ({ ...f, proveedor: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <label className="text-sm">Fecha
              <input type="date" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <label className="text-sm">Familia
              <input value={form.familia} onChange={(e) => setForm((f) => ({ ...f, familia: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <label className="text-sm">Estado
              <select value={form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value as PilotPurchase["estado"] }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
                <option>Pendiente</option>
                <option>Parcial</option>
                <option>Recibido</option>
              </select>
            </label>
            <label className="text-sm">Líneas
              <input type="number" min={1} value={form.lineas} onChange={(e) => setForm((f) => ({ ...f, lineas: Number(e.target.value) }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <label className="text-sm">Importe € *
              <input type="number" step="0.01" min={0.01} required value={form.importe || ""} onChange={(e) => setForm((f) => ({ ...f, importe: Number(e.target.value) }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" className="h-10 rounded-full bg-[#3B6EF5] px-4 text-sm font-semibold text-white">Guardar</button>
              <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-full border border-slate-200 px-4 text-sm font-semibold">Cancelar</button>
            </div>
          </form>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {([["todo", "Todo"], ["mes", "Este mes"], ["trimestre", "Trimestre"], ["anio", "Año"]] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setPeriodo(k)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${periodo === k ? "border-[#3B6EF5] bg-blue-50 text-[#3B6EF5]" : "border-slate-200 bg-white text-slate-500"}`}>{l}</button>
          ))}
          <select value={proveedor} onChange={(e) => setProveedor(e.target.value)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs">
            {proveedores.map((p) => <option key={p} value={p}>{p === "todos" ? "Todos los proveedores" : p}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Importe" value={eur(kpis.total)} />
          <Kpi label="Pedidos" value={String(kpis.pedidos)} />
          <Kpi label="Pedido medio" value={eur(kpis.medio)} />
          <Kpi label="Pendiente" value={`${kpis.pendientes} · ${eur(kpis.importePendiente)}`} />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#F7F8FC] text-[11px] font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nº</th>
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Familia</th>
                  <th className="px-4 py-3">Importe</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p.id} className="border-t border-slate-50">
                    <td className="px-4 py-3 font-medium">{p.numero}</td>
                    <td className="px-4 py-3">{p.proveedor}</td>
                    <td className="px-4 py-3">{new Date(p.fecha).toLocaleDateString("es-ES")}</td>
                    <td className="px-4 py-3">{p.familia}</td>
                    <td className="px-4 py-3 font-medium">{eur(p.importe)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={p.estado}
                        onChange={(e) => {
                          void apiUpdatePurchaseStatus(p.id, e.target.value).then(() => refresh());
                        }}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                      >
                        <option>Pendiente</option>
                        <option>Parcial</option>
                        <option>Recibido</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => void apiDeletePurchase(p.id).then(() => refresh())} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                        <Trash2 className="size-3.5" /> Borrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filtrados.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No hay pedidos. Crea uno con «Nuevo pedido».</p> : null}
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
