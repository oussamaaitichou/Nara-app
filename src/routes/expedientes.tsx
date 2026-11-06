import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  createCaseApi,
  fetchCases,
  fetchClients,
  updateCaseApi,
  type ApiCase,
  type ApiClient,
  type NgMeta,
} from "@/lib/naragest/client-api";

export const Route = createFileRoute("/expedientes")({
  component: ExpedientesPage,
  head: () => ({ meta: [{ title: "Expedientes — NaraGest" }] }),
});

function ExpedientesPage() {
  const [rows, setRows] = useState<ApiCase[]>([]);
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [meta, setMeta] = useState<NgMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState<string>("");
  const [openForm, setOpenForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clientId: "",
    type: "servicio" as "spd" | "reclamacion" | "inspeccion_prep" | "servicio" | "otro",
    title: "",
    description: "",
    priority: "media" as "urgente" | "alta" | "media" | "baja",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesRes, clientsRes] = await Promise.all([
        fetchCases(clientFilter || undefined),
        fetchClients(),
      ]);
      setRows(casesRes.data ?? []);
      setMeta(casesRes.meta ?? clientsRes.meta ?? null);
      setClients(clientsRes.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar expedientes");
    } finally {
      setLoading(false);
    }
  }, [clientFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const abiertos = rows.filter((r) => r.status === "abierto" || r.status === "en_curso").length;
    const urgentes = rows.filter((r) => r.priority === "urgente" || r.priority === "alta").length;
    const cerrados = rows.filter((r) => r.status === "cerrado").length;
    return { total: rows.length, abiertos, urgentes, cerrados };
  }, [rows]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId || !form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createCaseApi({
        clientId: form.clientId,
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
      });
      setForm({
        clientId: form.clientId,
        type: "servicio",
        title: "",
        description: "",
        priority: "media",
      });
      setOpenForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear");
    } finally {
      setSaving(false);
    }
  }

  async function onClose(id: string) {
    try {
      await updateCaseApi(id, { status: "cerrado" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cerrar");
    }
  }

  const canWrite = meta?.canWrite !== false;

  return (
    <AppShell title="Expedientes" subtitle="Casos de trabajo 1:N por cliente · misma organización">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-[#3B6EF5]">
              <ClipboardList className="size-5" />
            </span>
            <div>
              <p className="text-sm text-slate-500">
                {loading ? "Cargando…" : `${rows.length} expedientes`}
              </p>
              {meta ? (
                <p className="text-[11px] text-slate-400">
                  {meta.orgName ?? "Org"} · rol {meta.roleId}
                  {!canWrite ? " · solo lectura" : ""}
                </p>
              ) : null}
            </div>
          </div>
          {canWrite ? (
            <button
              type="button"
              onClick={() => setOpenForm((v) => !v)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#3B6EF5] px-4 text-sm font-semibold text-white"
            >
              <Plus className="size-4" /> Nuevo expediente
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Total", value: String(stats.total) },
            { label: "Abiertos / en curso", value: String(stats.abiertos) },
            { label: "Prioridad alta", value: String(stats.urgentes) },
            { label: "Cerrados", value: String(stats.cerrados) },
          ].map((s) => (
            <div key={s.label} className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-medium text-slate-500">{s.label}</p>
              <p className="mt-1 font-display text-2xl font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-slate-500">
            Cliente{" "}
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="ml-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            >
              <option value="">Todos</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.full_name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {openForm && canWrite ? (
          <form onSubmit={(e) => void onCreate(e)} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-display text-lg font-semibold text-slate-900">Nuevo expediente</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">
                <span className="text-slate-500">Cliente *</span>
                <select
                  required
                  value={form.clientId}
                  onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                >
                  <option value="">Seleccionar…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} · {c.full_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="text-slate-500">Título *</span>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="text-slate-500">Tipo</span>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof form.type }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                >
                  <option value="servicio">Servicio</option>
                  <option value="spd">SPD</option>
                  <option value="reclamacion">Reclamación</option>
                  <option value="inspeccion_prep">Prep. inspección</option>
                  <option value="otro">Otro</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="text-slate-500">Prioridad</span>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as typeof form.priority }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                >
                  <option value="urgente">Urgente</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="text-slate-500">Descripción</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#3B6EF5] px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setOpenForm(false)}
                className="h-10 rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-600"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
              <Loader2 className="size-5 animate-spin" /> Cargando expedientes…
            </div>
          ) : rows.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">
              No hay expedientes. Crea un cliente y luego un expediente vinculado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-[#F7F8FC] text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Nº</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Título</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Prioridad</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right"> </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/40">
                      <td className="px-4 py-3 font-medium text-slate-700">{r.number}</td>
                      <td className="px-4 py-3 text-slate-800">{r.client_name ?? r.client_id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-slate-900">{r.title}</td>
                      <td className="px-4 py-3 text-slate-600">{r.type}</td>
                      <td className="px-4 py-3 text-slate-600">{r.priority}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#3B6EF5]">
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canWrite && r.status !== "cerrado" ? (
                          <button
                            type="button"
                            onClick={() => void onClose(r.id)}
                            className="text-xs font-semibold text-[#3B6EF5]"
                          >
                            Cerrar
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
