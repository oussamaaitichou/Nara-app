import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { NaraMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

type Invitacion = { email: string; rol: string; token: string };

const ROLES_LABEL: Record<string, string> = {
  estudiante: "Estudiante de farmacia",
  tecnico: "Técnico de farmacia",
  adjunto: "Adjunto",
  farmaceutico: "Farmacéutico",
  titular: "Titular de farmacia",
};

export const Route = createFileRoute("/registro")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  component: RegistroPage,
  head: () => ({
    meta: [
      { title: "Registro — Nara" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const campo =
  "h-10 w-full rounded-md border border-line bg-bg px-3 text-sm text-ink outline-none focus:border-teal";

function RegistroPage() {
  const { token: tokenSearch } = Route.useSearch();
  const [inv, setInv] = useState<Invitacion | null>(null);
  const [fase, setFase] = useState<"cargando" | "form" | "ok" | "error">("cargando");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const token = tokenSearch?.trim();
    if (!token) {
      setMensaje("Falta el enlace de invitación. Pide una invitación al administrador de Nara.");
      setFase("error");
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`/api/registro?token=${encodeURIComponent(token)}`);
        const json = (await res.json()) as Invitacion & { error?: string };
        if (!res.ok) {
          setMensaje(json.error ?? "Invitación no válida.");
          setFase("error");
          return;
        }
        setInv({ email: json.email, rol: json.rol, token: json.token });
        setFase("form");
      } catch {
        setMensaje("No se ha podido comprobar la invitación.");
        setFase("error");
      }
    })();
  }, [tokenSearch]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!inv) return;
    if (password.length < 8) {
      setMensaje("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== password2) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }
    setEnviando(true);
    setMensaje(null);
    try {
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "registrar",
          token: inv.token,
          nombre,
          password,
          rol: inv.rol,
        }),
      });
      const json = (await res.json()) as { error?: string; mensaje?: string };
      if (!res.ok) {
        setMensaje(json.error ?? "No se ha podido registrar.");
        setEnviando(false);
        return;
      }
      setFase("ok");
    } catch {
      setMensaje("Error de red. Inténtalo de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md space-y-5 rounded-xl border border-line bg-surface p-6 shadow-[var(--shadow-soft)]">
        <NaraMark className="size-10" />
        <h1 className="font-display text-2xl font-semibold text-ink">Registro en Nara</h1>

        {fase === "cargando" ? <p className="text-sm text-muted">Comprobando invitación…</p> : null}

        {fase === "error" ? (
          <>
            <p className="text-sm text-danger">{mensaje}</p>
            <Link to="/" className="text-sm text-teal underline">
              Volver al inicio
            </Link>
          </>
        ) : null}

        {fase === "ok" ? (
          <>
            <p className="text-sm text-ink">
              Registro recibido. Cuando el administrador te apruebe podrás entrar con tu correo y
              contraseña.
            </p>
            <Link to="/login" className="inline-block">
              <Button>Ir al inicio de sesión</Button>
            </Link>
          </>
        ) : null}

        {fase === "form" && inv ? (
          <form className="space-y-4" onSubmit={(e) => void enviar(e)}>
            <p className="text-sm text-ink-soft">
              Invitación para <strong className="text-ink">{inv.email}</strong> como{" "}
              <strong className="text-ink">{ROLES_LABEL[inv.rol] ?? inv.rol}</strong>.
            </p>
            <label className="block space-y-1 text-sm text-ink-soft">
              <span>Nombre completo</span>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                minLength={2}
                maxLength={120}
                className={campo}
                autoComplete="name"
              />
            </label>
            <label className="block space-y-1 text-sm text-ink-soft">
              <span>Contraseña (mín. 8 caracteres)</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className={campo}
                autoComplete="new-password"
              />
            </label>
            <label className="block space-y-1 text-sm text-ink-soft">
              <span>Repetir contraseña</span>
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                minLength={8}
                className={campo}
                autoComplete="new-password"
              />
            </label>
            {mensaje ? <p className="text-sm text-danger">{mensaje}</p> : null}
            <Button type="submit" className="w-full" disabled={enviando || nombre.trim().length < 2}>
              {enviando ? "Enviando…" : "Solicitar acceso"}
            </Button>
            <p className="text-xs text-muted">
              Tras el registro quedarás pendiente de aprobación. Solo entonces podrás usar Nara.
            </p>
          </form>
        ) : null}
      </div>
    </div>
  );
}
