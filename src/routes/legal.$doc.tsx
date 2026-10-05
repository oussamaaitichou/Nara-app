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

function Texto({ texto }: { texto: string }) {
  const bloques = texto.split(/\n{2,}/);
  return (
    <div className="space-y-4 text-ink-soft">
      {bloques.map((b, i) => {
        const l = b.trim();
        if (l.startsWith("## ")) return <h2 key={i} className="pt-2 font-display text-xl font-semibold text-ink">{l.slice(3)}</h2>;
        if (l.startsWith("# ")) return <h2 key={i} className="pt-2 font-display text-2xl font-semibold text-ink">{l.slice(2)}</h2>;
        if (l.split("\n").every((x) => x.trim().startsWith("- "))) {
          return <ul key={i} className="list-disc space-y-1 pl-5">{l.split("\n").map((x, j) => <li key={j}>{x.trim().slice(2)}</li>)}</ul>;
        }
        return <p key={i} className="whitespace-pre-line">{l}</p>;
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
