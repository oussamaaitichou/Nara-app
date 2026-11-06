import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

export type ModuleColumn = { key: string; label: string; className?: string };
export type ModuleRow = Record<string, string | number> & { id: string };

export function ModulePage({
  title,
  subtitle,
  icon: Icon,
  primaryAction,
  filters,
  columns,
  rows,
  emptyHint,
  stats,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  primaryAction?: { label: string; to?: string };
  filters?: string[];
  columns: ModuleColumn[];
  rows: ModuleRow[];
  emptyHint?: string;
  stats?: { label: string; value: string; hint?: string }[];
}) {
  return (
    <AppShell title={title} subtitle={subtitle}>
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-teal-mist text-teal">
              <Icon className="size-5" />
            </span>
            <p className="text-sm text-muted">{rows.length} registros · datos de demostración</p>
          </div>
          {primaryAction ? (
            primaryAction.to ? (
              <Link
                to={primaryAction.to}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-teal px-4 text-sm font-semibold text-primary-foreground"
              >
                <Plus className="size-4" />
                {primaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-teal px-4 text-sm font-semibold text-primary-foreground"
              >
                <Plus className="size-4" />
                {primaryAction.label}
              </button>
            )
          ) : null}
        </div>

        {stats && stats.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-soft)]">
                <p className="text-[11px] font-medium text-muted">{s.label}</p>
                <p className="mt-1 font-display text-2xl font-semibold text-ink">{s.value}</p>
                {s.hint ? <p className="mt-0.5 text-[11px] text-subtle">{s.hint}</p> : null}
              </div>
            ))}
          </div>
        ) : null}

        {filters && filters.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {filters.map((f, i) => (
              <button
                key={f}
                type="button"
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  i === 0
                    ? "border-teal bg-teal-mist text-teal-deep"
                    : "border-line bg-white text-muted hover:border-teal hover:text-teal"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-soft)]">
          {rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">{emptyHint ?? "No hay datos todavía."}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-line bg-[#FAF8F4] text-[11px] font-semibold tracking-wide text-muted uppercase">
                  <tr>
                    {columns.map((c) => (
                      <th key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                        {c.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right"> </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-line/70 last:border-0 hover:bg-teal-mist/30">
                      {columns.map((c) => (
                        <td key={c.key} className={`px-4 py-3 text-ink ${c.className ?? ""}`}>
                          {row[c.key]}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-teal">
                          Ver <ArrowRight className="size-3.5" />
                        </button>
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
