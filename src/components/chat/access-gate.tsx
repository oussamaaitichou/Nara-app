import { useState } from "react";
import { KeyRound } from "lucide-react";
import { NaraMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export function AccessGate({ onSuccess }: { onSuccess: () => void }) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function entrar() {
    if (!codigo.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/acceso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      if (res.ok) {
        onSuccess();
        return;
      }
      let msg = "No se ha podido comprobar el código.";
      try {
        const json = (await res.json()) as { error?: string };
        if (json.error) msg = json.error;
      } catch {
        // mensaje por defecto
      }
      setError(msg);
    } catch {
      setError("No se ha podido conectar. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <form
        className="w-full max-w-sm space-y-5 rounded-xl border border-line bg-surface p-6 shadow-[var(--shadow-soft)]"
        onSubmit={(e) => {
          e.preventDefault();
          void entrar();
        }}
      >
        <div className="space-y-3">
          <NaraMark className="size-10" />
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Acceso al piloto de Nara</h1>
          <p className="text-sm text-muted">
            Esta fase de pruebas es solo para las farmacias invitadas. Escribe el código que te hemos facilitado.
          </p>
        </div>
        <div className="space-y-2">
          <label htmlFor="codigo" className="flex items-center gap-2 text-sm font-medium text-ink-soft">
            <KeyRound className="size-4" /> Código de acceso
          </label>
          <input
            id="codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="NARA-XXXXX-XXXXX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="h-11 w-full rounded-md border border-line bg-bg px-3 font-mono text-sm tracking-wide text-ink outline-none focus:border-teal"
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
        <Button type="submit" className="w-full" disabled={busy || !codigo.trim()}>
          {busy ? "Comprobando…" : "Entrar"}
        </Button>
        <p className="text-xs text-subtle">
          Si no tienes código, solicítalo a la persona que te invitó al piloto. Orientación profesional: no escribas datos de pacientes.
        </p>
      </form>
    </div>
  );
}
