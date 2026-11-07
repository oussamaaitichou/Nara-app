import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lightbulb, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { buildOpportunityCards, type Insight } from "@/lib/naragest/insights";

export const Route = createFileRoute("/oportunidades")({
  component: OportunidadesPage,
  head: () => ({ meta: [{ title: "Ideas y oportunidades — NaraGest" }] }),
});

function OportunidadesPage() {
  const [items, setItems] = useState<Insight[]>([]);
  const [status, setStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    setItems(buildOpportunityCards(new Date("2026-11-06")));
    try {
      const raw = localStorage.getItem("naragest-oportunidades-status");
      if (raw) setStatus(JSON.parse(raw) as Record<string, string>);
    } catch {
      /* ignore */
    }
  }, []);

  function setItemStatus(id: string, value: string) {
    setStatus((prev) => {
      const next = { ...prev, [id]: value };
      localStorage.setItem("naragest-oportunidades-status", JSON.stringify(next));
      return next;
    });
  }

  return (
    <AppShell
      title="Ideas y oportunidades"
      subtitle="Recomendaciones proactivas con datos · seguimiento simple"
    >
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>FarmaIA / Nara:</strong> no esperamos a que preguntes. Cada tarjeta se justifica con una regla
          sobre stock, compras o márgenes. Las estimaciones no son beneficios garantizados.
        </div>

        {items.length === 0 ? (
          <p className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No hay oportunidades detectadas con los datos actuales.
          </p>
        ) : (
          items.map((ins) => (
            <article key={ins.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <Lightbulb className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">{ins.tone}</p>
                  <h3 className="font-display text-lg font-semibold text-slate-900">{ins.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    <strong className="text-slate-800">Problema / hallazgo:</strong> {ins.body}
                  </p>
                  {ins.impact ? (
                    <p className="mt-2 text-sm text-slate-700">
                      <strong>Impacto:</strong> {ins.impact}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-400">Datos: {ins.source}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      to={ins.href}
                      className="inline-flex items-center gap-1 rounded-full bg-[#3B6EF5] px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Actuar <ArrowRight className="size-3.5" />
                    </Link>
                    {(["pendiente", "aceptada", "descartada", "completada"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setItemStatus(ins.id, s)}
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize ${
                          (status[ins.id] ?? "pendiente") === s
                            ? "border-[#3B6EF5] bg-blue-50 text-[#3B6EF5]"
                            : "border-slate-200 text-slate-500"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))
        )}

        <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-slate-600">
          <p className="flex items-center gap-2 font-semibold text-[#3B6EF5]">
            <Sparkles className="size-4" /> Siguiente nivel
          </p>
          <p className="mt-1">
            Cuando haya más histórico e integraciones, estas ideas incorporarán coste estimado, dificultad y
            prioridad automática. Mientras tanto, usa el seguimiento manual y pregunta a Nara en el chat.
          </p>
          <Link to="/consulta" className="mt-3 inline-flex text-sm font-semibold text-[#3B6EF5]">
            Abrir asistente Nara →
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
