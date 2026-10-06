import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import legal from "@/lib/knowledge/legal.json";

const TITULOS: Record<string, string> = {
  privacidad: "Política de privacidad",
  "aviso-legal": "Aviso legal",
  condiciones: "Condiciones de uso",
  cookies: "Política de cookies",
};

export const Route = createFileRoute("/legal/$doc")({
  component: LegalPage,
  head: ({ params }) => ({ meta: [{ title: `${TITULOS[params.doc] ?? "Legal"} — Nara` }] }),
});

function Inline({ t }: { t: string }) {
  return (
    <>
      {t
        .split(/(\*\*[^*]+\*\*)/g)
        .filter(Boolean)
        .map((p, i) =>
          p.startsWith("**") ? (
            <strong key={i} className="font-semibold text-ink">{p.slice(2, -2)}</strong>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
    </>
  );
}

function Texto({ texto }: { texto: string }) {
  const bloques = texto.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  // El título del documento ya aparece como encabezado de la página
  const lista = bloques[0]?.startsWith("# ") ? bloques.slice(1) : bloques;
  return (
    <div className="space-y-4 text-ink-soft">
      {lista.map((l, i) => {
        if (/^-{3,}$/.test(l)) return <hr key={i} className="border-line" />;
        if (l.startsWith("### ")) return <h3 key={i} className="pt-1 font-display text-lg font-semibold text-ink">{l.slice(4)}</h3>;
        if (l.startsWith("## ")) return <h2 key={i} className="pt-2 font-display text-xl font-semibold text-ink">{l.slice(3)}</h2>;
        if (l.startsWith("# ")) return <h2 key={i} className="pt-4 font-display text-xl font-semibold text-ink">{l.slice(2)}</h2>;
        const filas = l.split("\n");
        if (filas.every((x) => /^[*-] /.test(x.trim()))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {filas.map((x, j) => <li key={j}><Inline t={x.trim().slice(2)} /></li>)}
            </ul>
          );
        }
        if (filas.every((x) => /^\d+\. /.test(x.trim()))) {
          return (
            <ol key={i} className="list-decimal space-y-1 pl-5">
              {filas.map((x, j) => <li key={j}><Inline t={x.trim().replace(/^\d+\. /, "")} /></li>)}
            </ol>
          );
        }
        return <p key={i} className="whitespace-pre-line"><Inline t={l} /></p>;
      })}
    </div>
  );
}

function LegalPage() {
  const { doc } = Route.useParams();
  const titulo = TITULOS[doc];
  const texto = (legal as Record<string, string>)[doc] ?? "";
  return (
    <div className="min-h-dvh bg-bg">
      <SiteHeader solid />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="mb-6 font-display text-3xl font-semibold tracking-tight text-ink">{titulo ?? "Documento no encontrado"}</h1>
        {!titulo ? <p className="text-muted">Este documento no existe.</p> : texto ? <Texto texto={texto} /> : <p className="text-muted">Este documento está en preparación.</p>}
      </main>
      <SiteFooter />
    </div>
  );
}
