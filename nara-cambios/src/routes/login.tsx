import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { NaraMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Entrar — Nara" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const campo =
  "h-10 w-full rounded-md border border-line bg-bg px-3 text-sm text-ink outline-none focus:border-teal";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setMensaje(null);
    try {
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "login", email, password }),
      });
      const json = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setMensaje(json.error ?? "No se ha podido entrar.");
        setEnviando(false);
        return;
      }
      void navigate({ to: "/consulta" });
    } catch {
      setMensaje("Error de red. Inténtalo de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <form
        className="w-full max-w-sm space-y-4 rounded-xl border border-line bg-surface p-6 shadow-[var(--shadow-soft)]"
        onSubmit={(e) => void enviar(e)}
      >
        <NaraMark className="size-10" />
        <h1 className="font-display text-2xl font-semibold text-ink">Entrar en Nara</h1>
        <p className="text-sm text-ink-soft">
          Solo cuentas aprobadas. Si tienes un código de prueba, úsalo en la consulta.
        </p>
        <label className="block space-y-1 text-sm text-ink-soft">
          <span>Correo</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={campo}
            autoComplete="email"
          />
        </label>
        <label className="block space-y-1 text-sm text-ink-soft">
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={campo}
            autoComplete="current-password"
          />
        </label>
        {mensaje ? <p className="text-sm text-danger">{mensaje}</p> : null}
        <Button type="submit" className="w-full" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </Button>
        <p className="text-xs text-muted">
          ¿No tienes cuenta? Necesitas una{" "}
          <span className="text-ink">invitación del administrador</span>.{" "}
          <Link to="/" className="text-teal underline">
            Volver al inicio
          </Link>
        </p>
      </form>
    </div>
  );
}
