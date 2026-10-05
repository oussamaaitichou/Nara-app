import { Link } from "@tanstack/react-router";
import { NaraWordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

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
        <nav className="flex items-center gap-1 sm:gap-2">
          <a
            href="/#temas"
            className="hidden h-11 items-center px-3 text-sm font-medium text-muted hover:text-ink sm:inline-flex"
          >
            Temas
          </a>
          <a
            href="/#como-funciona"
            className="hidden h-11 items-center px-3 text-sm font-medium text-muted hover:text-ink md:inline-flex"
          >
            Cómo funciona
          </a>
          <Link
            to="/valorar"
            className="hidden h-11 items-center px-3 text-sm font-medium text-muted hover:text-ink sm:inline-flex"
          >
            Valorar farmacia
          </Link>
          <Button asChild size="sm">
            <Link to="/consulta">Consultar a Nara</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
