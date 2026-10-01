import { NaraWordmark } from "@/components/brand/logo";

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
        <p className="text-xs text-subtle">España · normativa de oficina de farmacia</p>
      </div>
    </footer>
  );
}
