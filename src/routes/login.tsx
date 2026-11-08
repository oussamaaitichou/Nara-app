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
      // Sesión ERP (cuenta creada por admin)
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
        // Si el piloto no está, igual mostramos formulario de cuenta
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
      // Siempre priorizamos login por cuenta (usuario + contraseña)
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
    "h-11 w-full rounded-xl border border-slate-200 bg-[#FAFBFE] px-3 text-sm text-slate-900 outline-none focus:border-[#3B6EF5]";

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F7F8FC] px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
        <div className="flex items-center gap-3">
          <NaraMark className="size-10" />
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">Acceso</h1>
            <p className="text-sm text-slate-500">Nara · NaraGest</p>
          </div>
        </div>

        {estado.fase === "cargando" ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin" /> Comprobando acceso…
          </div>
        ) : null}

        {estado.fase === "formulario" ? (
          <div className="space-y-4">
            <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setModo("cuenta")}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                  modo === "cuenta" ? "bg-[#3B6EF5] text-white shadow-sm" : "text-slate-600"
                }`}
              >
                Usuario y contraseña
              </button>
              <button
                type="button"
                onClick={() => setModo("codigo")}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                  modo === "codigo" ? "bg-[#3B6EF5] text-white shadow-sm" : "text-slate-600"
                }`}
              >
                Código piloto
              </button>
            </div>

            {modo === "cuenta" ? (
              <form className="space-y-4" onSubmit={(e) => void entrarCuenta(e)}>
                <p className="text-sm leading-relaxed text-slate-500">
                  Introduce el <strong className="text-slate-800">usuario</strong> (nombre o email) y la{" "}
                  <strong className="text-slate-800">contraseña</strong> que te ha asignado el administrador.
                </p>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Usuario</span>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
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
                  <span className="text-sm font-medium text-slate-700">Contraseña</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                    className={campo}
                  />
                </label>
                {estado.error ? <p className="text-sm text-red-600">{estado.error}</p> : null}
                <Button
                  type="submit"
                  className="w-full rounded-full bg-[#3B6EF5] hover:bg-[#2f5cd6]"
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
                <p className="text-sm leading-relaxed text-slate-500">
                  Solo si te dieron un <strong className="text-slate-800">código de piloto</strong>.
                </p>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Código</span>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
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
                {estado.error ? <p className="text-sm text-red-600">{estado.error}</p> : null}
                <Button
                  type="submit"
                  className="w-full rounded-full bg-[#3B6EF5] hover:bg-[#2f5cd6]"
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

            <p className="text-center text-xs text-slate-400">
              ¿Sin cuenta? Pídesela al administrador.{" "}
              <Link to="/" className="font-medium text-[#3B6EF5] hover:underline">
                Inicio
              </Link>
            </p>
          </div>
        ) : null}

        {estado.fase === "dentro" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-sm font-medium text-[#3B6EF5]">Sesión activa</p>
              <p className="mt-1 font-display text-lg font-semibold text-slate-900">{estado.etiqueta}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="flex-1 rounded-full bg-[#3B6EF5] hover:bg-[#2f5cd6]">
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
              className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            >
              <LogOut className="size-4" /> Cerrar sesión
            </button>
          </div>
        ) : null}

        {estado.fase === "error" ? (
          <div className="space-y-4">
            <p className="text-sm text-red-600">{estado.mensaje}</p>
            <Button variant="outline" className="w-full rounded-full" onClick={() => void comprobar()}>
              Reintentar
            </Button>
          </div>
        ) : null}

        {estado.fase === "abierto" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-[#3B6EF5]">
                <ShieldCheck className="size-4" /> Entorno abierto
              </p>
            </div>
            <Button asChild className="w-full rounded-full bg-[#3B6EF5] hover:bg-[#2f5cd6]">
              <Link to="/panel">Ir a NaraGest</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
