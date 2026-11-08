import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, KeyRound, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { NaraMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  component: AccesoPage,
  head: () => ({
    meta: [{ title: "Acceso — Nara" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

type EstadoAcceso =
  | { fase: "cargando" }
  | { fase: "abierto" }
  | { fase: "formulario"; error?: string }
  | { fase: "dentro"; etiqueta: string; restantes: number; limite: number }
  | { fase: "error"; mensaje: string };

function AccesoPage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<EstadoAcceso>({ fase: "cargando" });
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    void comprobar();
  }, []);

  async function comprobar() {
    try {
      const res = await fetch("/api/acceso");
      const json = (await res.json()) as {
        accesoActivo?: boolean;
        autenticado?: boolean;
        etiqueta?: string;
        restantes?: number;
        limite?: number;
        error?: string;
      };
      if (!res.ok) {
        setEstado({ fase: "error", mensaje: json.error ?? "No se ha podido comprobar el acceso." });
        return;
      }
      if (!json.accesoActivo) {
        setEstado({ fase: "abierto" });
        return;
      }
      if (json.autenticado) {
        setEstado({
          fase: "dentro",
          etiqueta: json.etiqueta ?? "Farmacia",
          restantes: json.restantes ?? 0,
          limite: json.limite ?? 0,
        });
        return;
      }
      setEstado({ fase: "formulario" });
    } catch {
      setEstado({ fase: "error", mensaje: "No se ha podido conectar. Inténtalo de nuevo." });
    }
  }

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim() || enviando) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/acceso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codigo.trim() }),
      });
      const json = (await res.json()) as { ok?: boolean; etiqueta?: string; error?: string };
      if (!res.ok) {
        setEstado({ fase: "formulario", error: json.error ?? "Código no válido." });
        setEnviando(false);
        return;
      }
      await comprobar();
      void navigate({ to: "/panel" });
    } catch {
      setEstado({ fase: "formulario", error: "No se ha podido validar el código." });
    } finally {
      setEnviando(false);
    }
  }

  async function salir() {
    await fetch("/api/acceso", { method: "DELETE" });
    setCodigo("");
    setEstado({ fase: "formulario" });
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F7F5F1] px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <div className="flex items-center gap-3">
          <NaraMark className="size-10" />
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Acceso</h1>
            <p className="text-sm text-muted">Nara · NaraGest</p>
          </div>
        </div>

        {estado.fase === "cargando" ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" /> Comprobando acceso…
          </div>
        ) : null}

        {estado.fase === "abierto" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-teal-soft bg-teal-mist/50 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-teal-deep">
                <ShieldCheck className="size-4" /> Acceso abierto
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Puedes entrar a NaraGest o consultar a Nara sin restricciones en este entorno.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="flex-1">
                <Link to="/panel">
                  Ir a NaraGest <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/consulta">Consultar a Nara</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {estado.fase === "formulario" ? (
          <form className="space-y-4" onSubmit={(e) => void entrar(e)}>
            <p className="text-sm leading-relaxed text-muted">
              Introduce el código que te ha dado la administración del piloto para entrar en Nara.
            </p>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-ink-soft">Código de acceso</span>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Tu código"
                  autoComplete="one-time-code"
                  autoFocus
                  className="h-11 w-full rounded-xl border border-line bg-[#FAF8F4] pr-3 pl-10 text-sm text-ink outline-none focus:border-teal"
                />
              </div>
            </label>
            {estado.error ? <p className="text-sm text-danger">{estado.error}</p> : null}
            <Button type="submit" className="w-full" disabled={!codigo.trim() || enviando}>
              {enviando ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Entrando…
                </>
              ) : (
                "Entrar"
              )}
            </Button>
            <p className="text-center text-xs text-subtle">
              ¿Sin código? <Link to="/" className="font-medium text-teal hover:underline">Volver al inicio</Link>
            </p>
          </form>
        ) : null}

        {estado.fase === "dentro" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-teal-soft bg-teal-mist/50 p-4">
              <p className="text-sm font-medium text-teal-deep">Sesión activa</p>
              <p className="mt-1 font-display text-lg font-semibold text-ink">{estado.etiqueta}</p>
              <p className="mt-1 text-sm text-muted">
                Consultas restantes hoy: <strong className="text-ink">{estado.restantes}</strong> / {estado.limite}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="flex-1">
                <Link to="/panel">
                  Ir a NaraGest <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/consulta">Consultar a Nara</Link>
              </Button>
            </div>
            <button
              type="button"
              onClick={() => void salir()}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-[#FAF8F4] hover:text-ink"
            >
              <LogOut className="size-4" /> Cerrar sesión
            </button>
          </div>
        ) : null}

        {estado.fase === "error" ? (
          <div className="space-y-4">
            <p className="text-sm text-danger">{estado.mensaje}</p>
            <Button variant="outline" className="w-full" onClick={() => void comprobar()}>
              Reintentar
            </Button>
            <p className="text-center text-xs text-subtle">
              <Link to="/" className="font-medium text-teal hover:underline">Volver al inicio</Link>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
