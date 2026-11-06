import { createFileRoute } from "@tanstack/react-router";
import { Download, Loader2, Plus, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  createClientApi,
  deleteClientApi,
  exportClientsCsv,
  fetchClients,
  type ApiClient,
  type NgMeta,
} from "@/lib/naragest/client-api";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/clientes-f")({
  component: ClientesFPage,
  head: () => ({ meta: [{ title: "Clientes — NaraGest" }] }),
});

type FilterKey = "todos" | "fidelizacion" | "spd" | "activo";

function ClientesFPage() {
  const { user, isPending: authPending } = useCurrentUserState();
  const [rows, setRows] = useState<ApiClient[]>([]);
  const [meta, setMeta] = useState<NgMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("todos");
  const [openForm, setOpenForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    program: "ninguno" as "fidelizacion" | "spd" | "ninguno",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchClients();
      setRows(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authPending) return;
    void load();
  }, [authPending, load]);

  const canWrite = meta?.canWrite !== false;
  const canDelete = meta?.canDelete !== false;
  const canExport = meta?.canExport !== false;

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "fidelizacion") return r.program === "fidelizacion";
      if (filter === "spd") return r.program === "spd";
      if (filter === "activo") return r.status === "activo";
      return true;
    });
  }, [rows, filter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const fidel = rows.filter((r) => r.program === "fidelizacion").length;
    const spd = rows.filter((r) => r.program === "spd").length;
    const activos = rows.filter((r) => r.status === "activo").length;
    return { total, fidel, spd, activos };
  }, [rows]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createClientApi({
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        program: form.program,
        status: "activo",
      });
      setForm({ fullName: "", phone: "", email: "", program: "ninguno" });
      setOpenForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("¿Archivar este cliente? (borrado lógico)")) return;
    try {
      await deleteClientApi(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  }

  async function onExport() {
    try {
      const blob = await exportClientsCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "clientes-naragest.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Exportación fallida");
    }
  }

  return (
    <AppShell title="Clientes" subtitle="Datos vivos desde la API NaraGest · multi-org y roles">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-[#3B6EF5]">
              <Users className="size-5" />
            </span>
            <div>
              <p className="text-sm text-slate-500">
                {loading ? "Cargando…" : `${filtered.length} de ${rows.length} clientes`}
              </p>
              {user ? (
                <p className="text-[11px] text-slate-400">
                  Sesión: {user.displayName ?? user.primaryEmail ?? user.id}
                  {user.isDevFallback ? " · modo desarrollo" : ""}
                  {meta ? ` · ${meta.roleId}` : ""}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canExport ? (
              <button
                type="button"
                onClick={() => void onExport()}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
              >
                <Download className="size-4" /> CSV
              </button>
            ) : null}
            {canWrite ? (
              <button
                type="button"
                onClick={() => setOpenForm((v) => !v)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#3B6EF5] px-4 text-sm font-semibold text-white"
              >
                <Plus className="size-4" /> Nuevo cliente
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Clientes", value: String(stats.total) },
            { label: "Fidelizados", value: String(stats.fidel) },
            { label: "SPD", value: String(stats.spd) },
            { label: "Activos", value: String(stats.activos) },
          ].map((s) => (
            <div key={s.label} className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-medium text-slate-500">{s.label}</p>
              <p className="mt-1 font-display text-2xl font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        {openForm && canWrite ? (
          <form
            onSubmit={(e) => void onCreate(e)}
            className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h3 className="font-display text-lg font-semibold text-slate-900">Alta de cliente</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="text-slate-500">Nombre completo *</span>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="text-slate-500">Teléfono</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="text-slate-500">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="text-slate-500">Programa</span>
                <select
                  value={form.program}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      program: e.target.value as "fidelizacion" | "spd" | "ninguno",
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                >
                  <option value="ninguno">Ninguno</option>
                  <option value="fidelizacion">Fidelización</option>
                  <option value="spd">SPD</option>
                </select>
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

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["todos", "Todos"],
              ["fidelizacion", "Fidelizados"],
              ["spd", "SPD"],
              ["activo", "Activos"],
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

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
              <Loader2 className="size-5 animate-spin" /> Cargando clientes…
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">
              No hay clientes todavía. Crea el primero con «Nuevo cliente».
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-[#F7F8FC] text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Teléfono</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Programa</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right"> </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/40">
                      <td className="px-4 py-3 font-medium text-slate-700">{r.code}</td>
                      <td className="px-4 py-3 text-slate-900">{r.full_name}</td>
                      <td className="px-4 py-3 text-slate-600">{r.phone || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{r.email || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{r.program || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => void onDelete(r.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                            aria-label="Archivar"
                          >
                            <Trash2 className="size-3.5" /> Archivar
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
