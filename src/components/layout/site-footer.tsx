import { NaraWordmark } from "@/components/brand/logo";
import legal from "@/lib/knowledge/legal.json";

const ENLACES: [string, string][] = [["privacidad", "Privacidad"], ["aviso-legal", "Aviso legal"], ["condiciones", "Condiciones"], ["cookies", "Cookies"]];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface-2">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="space-y-3">
          <NaraWordmark />
          <p className="max-w-md text-sm leading-relaxed text-muted">
            Orientación profesional para la oficina de farmacia. No sustituye
            ficha técnica, Colegio, inspección ni prescriptor.
          </p>
        </div>
        <div className="space-y-2 sm:text-right">
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted sm:justify-end">
            {ENLACES.filter(([k]) => (legal as Record<string, string>)[k]).map(([k, t]) => (
              <a key={k} href={`/legal/${k}`} className="hover:text-ink">{t}</a>
            ))}
          </nav>
          <p className="text-xs text-subtle">España · normativa de oficina de farmacia</p>
        </div>
      </div>
    </footer>
  );
}
