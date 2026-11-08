import { Link } from "@tanstack/react-router";
import { NaraWordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

/** Cabecera publica: solo marca + Acceso. */
export function SiteHeader({ solid = false }: { solid?: boolean }) {
  return (
    <header
      className={
        solid
          ? "border-b border-slate-200/80 bg-white/90 backdrop-blur-sm"
          : "absolute inset-x-0 top-0 z-20"
      }
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-[4.25rem] sm:px-6">
        <Link to="/" className="inline-flex items-center">
          <NaraWordmark />
        </Link>
        <nav className="flex items-center">
          <Button
            asChild
            size="sm"
            className="rounded-full bg-[#3B6EF5] px-5 text-white shadow-sm shadow-blue-500/20 hover:bg-[#2f5cd6]"
          >
            <Link to="/login">Acceso</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
