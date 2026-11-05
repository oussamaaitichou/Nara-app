import { Link } from "@tanstack/react-router";
import { NaraWordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

/** Cabecera de la web pública (landing). El panel usa AppShell. */
export function SiteHeader({ solid = false }: { solid?: boolean }) {
  return (
    <header
      className={
        solid
          ? "border-b border-line bg-surface/90 backdrop-blur-sm"
          : "absolute inset-x-0 top-0 z-20"
      }
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-[4.25rem] sm:px-6">
        <NaraWordmark />
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/consulta"
            className="hidden h-11 items-center px-3 text-sm font-medium text-muted hover:text-ink sm:inline-flex"
          >
            Probar consulta
          </Link>
          <Button asChild size="sm" variant="outline">
            <Link to="/login">Acceder</Link>
          </Button>
          <Button asChild size="sm" className="sm:hidden">
            <Link to="/consulta">Consultar</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
