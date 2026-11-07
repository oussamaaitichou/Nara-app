import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { NaraMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/invitar/$token")({
  component: InvitarPage,
  head: () => ({
    meta: [{ title: "Activar acceso — Nara" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

const campo =
  "h-10 w-full rounded-md border border-line bg-bg px-3 text-sm text-ink outline-none focus:border-teal";

function InvitarPage() {
  const { token } = Route.useParams();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/invitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "No se ha podido activar la cuenta.");
        return;
      }
      setOk(true);
    } catch {
      setError("No se ha podido conectar. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-line bg-surface p-6 shadow-[var(--shadow-soft)]">
        <NaraMark className="size-10" />
        <h1 className="font-display text-2xl font-semibold text-ink">Activar tu acceso</h1>
        {ok ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-soft">Contraseña guardada. Ya puedes entrar al panel de Nara.</p>
            <Button asChild className="w-full">
              <Link to="/login">Ir al inicio de sesión</Link>
            </Button>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={(e) => void enviar(e)}>
            <p className="text-sm text-muted">Elige una contraseña (mínimo 10 caracteres, con letras y números).</p>
            <input
              type="password"
              className={campo}
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={10}
            />
            <input
              type="password"
              className={campo}
              placeholder="Repite la contraseña"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
              required
              minLength={10}
            />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={enviando || password.length < 10}>
              {enviando ? "Guardando…" : "Activar acceso"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
