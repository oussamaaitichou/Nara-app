import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, KeyRound, Loader2, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { NaraMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { rutaPorPlan } from "@/lib/acceso-plan";

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
  | { fase: "dentro"; etiqueta: string; restantes: number; limite: number; plan?: string }
  | { fase: "error"; mensaje: string };

function AccesoPage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<EstadoAcceso>({ fase: "cargando" });
  const [modo, setModo] = useState<"cuenta" | "codigo">("cuenta");
  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    void comprobar();
  }, []);

  async function comprobar() {
    try {
      const erp = await fetch("/api/erp?r=yo");
      if (erp.ok) {
        const j = (await erp.json()) as { usuario?: { nombre?: string }; asesoria?: { plan?: string } };
        if (j.usuario) {
          setEstado({
            fase: "dentro",
            etiqueta: j.usuario.nombre ?? "Usuario",
            restantes: 0,
            limite: 0,
            plan: j.asesoria?.plan,
          });
          return;
        }
      }

      const res = await fetch("/api/acceso");
      const json = (await res.json()) as {
        accesoActivo?: boolean;
        autenticado?: boolean;
        etiqueta?: string;
        restantes?: number;
        limite?: number;
        plan?: string;
        error?: string;
      };
      if (!res.ok) {
        setEstado({ fase: "formulario" });
        return;
      }
      if (json.autenticado) {
        setEstado({
          fase: "dentro",
          etiqueta: json.etiqueta ?? "Farmacia",
          restantes: json.restantes ?? 0,
          limite: json.limite ?? 0,
          plan: json.plan,
        });
        return;
      }
      setEstado({ fase: "formulario" });
    } catch {
      setEstado({ fase: "formulario" });
    }
  }

  async function entrarCuenta(e: React.FormEvent) {
    e.preventDefault();
    if (!identificador.trim() || !password || enviando) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/login-cuenta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificador: identificador.trim(), password }),
      });
      const json = (await res.json()) as {
        error?: string;
        plan?: string;
        destino?: "/panel" | "/consulta";
      };
      if (!res.ok) {
        setEstado({ fase: "formulario", error: json.error ?? "Usuario o contraseña incorrectos." });
        setEnviando(false);
        return;
      }
      void navigate({ to: json.destino ?? rutaPorPlan(json.plan) });
    } catch {
      setEstado({ fase: "formulario", error: "No se ha podido validar el acceso." });
    } finally {
      setEnviando(false);
    }
  }

  async function entrarCodigo(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim() || enviando) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/acceso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codigo.trim() }),
      });
      const json = (await res.json()) as { ok?: boolean; plan?: string; error?: string };
      if (!res.ok) {
        setEstado({ fase: "formulario", error: json.error ?? "Código no válido." });
        setEnviando(false);
        return;
      }
      void navigate({ to: rutaPorPlan(json.plan) });
    } catch {
      setEstado({ fase: "formulario", error: "No se ha podido validar el código." });
    } finally {
      setEnviando(false);
    }
  }

  async function salir() {
    await fetch("/api/acceso", { method: "DELETE" });
    await fetch("/api/erp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "logout" }),
    });
    setCodigo("");
    setIdentificador("");
    setPassword("");
    setEstado({ fase: "formulario" });
  }

  const campo =
    "h-11 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/90 px-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-teal)]";

  return (
    <div className="nara-stage nara-lens flex min-h-dvh items-center justify-center px-4">
      <div className="nara-glass nara-rise relative w-full max-w-md space-y-6 rounded-2xl p-6 sm:p-8">
        <div className="relative flex items-center gap-3">
          <NaraMark className="size-10" />
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)]">Acceso</h1>
            <p className="text-sm text-[var(--color-muted)]">Nara · NaraGest</p>
          </div>
        </div>

        {estado.fase === "cargando" ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--color-muted)]">
            <Loader2 className="size-4 animate-spin" /> Comprobando acceso…
          </div>
        ) : null}

        {estado.fase === "formulario" ? (
          <div className="relative space-y-4">
            <div className="flex rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)]/80 p-1">
              <button
                type="button"
                onClick={() => setModo("cuenta")}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                  modo === "cuenta"
                    ? "nara-thermal shadow-sm"
                    : "text-[var(--color-muted)]"
                }`}
              >
                Usuario y contraseña
              </button>
              <button
                type="button"
                onClick={() => setModo("codigo")}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                  modo === "codigo"
                    ? "nara-thermal shadow-sm"
                    : "text-[var(--color-muted)]"
                }`}
              >
                Código piloto
              </button>
            </div>

            {modo === "cuenta" ? (
              <form className="space-y-4" onSubmit={(e) => void entrarCuenta(e)}>
                <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                  Introduce el <strong className="text-[var(--color-ink)]">usuario</strong> (nombre o email) y la{" "}
                  <strong className="text-[var(--color-ink)]">contraseña</strong> que te ha asignado el administrador.
                </p>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[var(--color-ink-soft)]">Usuario</span>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-subtle)]" />
                    <input
                      type="text"
                      value={identificador}
                      onChange={(e) => setIdentificador(e.target.value)}
                      placeholder="Nombre, DNI o email"
                      autoComplete="username"
                      autoFocus
                      className={`${campo} pl-10`}
                    />
                  </div>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[var(--color-ink-soft)]">Contraseña</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                    className={campo}
                  />
                </label>
                {estado.error ? <p className="text-sm text-[var(--color-danger)]">{estado.error}</p> : null}
                <Button
                  type="submit"
                  className="nara-thermal w-full rounded-full border-0"
                  disabled={!identificador.trim() || !password || enviando}
                >
                  {enviando ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Entrando…
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={(e) => void entrarCodigo(e)}>
                <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                  Solo si te dieron un <strong className="text-[var(--color-ink)]">código de piloto</strong>.
                </p>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[var(--color-ink-soft)]">Código</span>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-subtle)]" />
                    <input
                      type="text"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value)}
                      placeholder="NARA-XXXXX-XXXXX"
                      autoComplete="one-time-code"
                      className={`${campo} pl-10`}
                    />
                  </div>
                </label>
                {estado.error ? <p className="text-sm text-[var(--color-danger)]">{estado.error}</p> : null}
                <Button
                  type="submit"
                  className="nara-thermal w-full rounded-full border-0"
                  disabled={!codigo.trim() || enviando}
                >
                  {enviando ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Entrando…
                    </>
                  ) : (
                    "Entrar con código"
                  )}
                </Button>
              </form>
            )}

            <p className="text-center text-xs text-[var(--color-subtle)]">
              ¿Sin cuenta? Pídesela al administrador.{" "}
              <Link to="/" className="font-medium text-[var(--color-teal)] hover:underline">
                Inicio
              </Link>
            </p>
          </div>
        ) : null}

        {estado.fase === "dentro" ? (
          <div className="relative space-y-4">
            <div className="nara-thermal-soft rounded-xl border border-[var(--color-line)] p-4">
              <p className="text-sm font-medium text-[var(--color-teal)]">Sesión activa</p>
              <p className="mt-1 font-display text-lg font-semibold text-[var(--color-ink)]">{estado.etiqueta}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="nara-thermal flex-1 rounded-full border-0">
                <Link to="/panel">
                  Ir a NaraGest <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 rounded-full">
                <Link to="/consulta">Consultar a Nara</Link>
              </Button>
            </div>
            <button
              type="button"
              onClick={() => void salir()}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
            >
              <LogOut className="size-4" /> Cerrar sesión
            </button>
          </div>
        ) : null}

        {estado.fase === "error" ? (
          <div className="relative space-y-4">
            <p className="text-sm text-[var(--color-danger)]">{estado.mensaje}</p>
            <Button variant="outline" className="w-full rounded-full" onClick={() => void comprobar()}>
              Reintentar
            </Button>
          </div>
        ) : null}

        {estado.fase === "abierto" ? (
          <div className="relative space-y-4">
            <div className="nara-thermal-soft rounded-xl border border-[var(--color-line)] p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-[var(--color-teal)]">
                <ShieldCheck className="size-4" /> Entorno abierto
              </p>
            </div>
            <Button asChild className="nara-thermal w-full rounded-full border-0">
              <Link to="/panel">Ir a NaraGest</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
