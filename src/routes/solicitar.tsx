import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { NaraMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/solicitar")({
  component: SolicitarPage,
  head: () => ({
    meta: [
      { title: "Solicitar demo — Nara" },
      {
        name: "description",
        content: "Solicita una demo o un plan de Nara, la asesora de IA para oficinas de farmacia.",
      },
    ],
  }),
});

const campo =
  "h-10 w-full rounded-md border border-line bg-bg px-3 text-sm text-ink outline-none focus:border-teal";

function SolicitarPage() {
  const [c, setC] = useState({
    nombre: "",
    email: "",
    telefono: "",
    entidad: "",
    tipo_entidad: "farmacia" as "farmacia" | "asesoria",
    plan_interes: "demo",
    mensaje: "",
    web: "",
  });
  const [consent, setConsent] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/demo-solicitud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...c, consentimiento: consent }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "No se ha podido enviar la solicitud.");
        return;
      }
      setHecho(true);
    } catch {
      setError("No se ha podido conectar. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <NaraMark className="size-8" />
          <span className="font-display text-lg font-semibold text-ink">Nara</span>
        </Link>
        <Button asChild variant="outline" size="sm">
          <Link to="/login">Ya tengo acceso</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-ink">Solicitar demo o plan</h1>
        <p className="mt-2 text-sm text-muted">
          Nara no es de registro libre. Cuéntanos quién eres y te activamos el acceso (demo o plan) desde la
          asesoría.
        </p>

        {hecho ? (
          <div className="mt-8 space-y-3 rounded-xl border border-teal bg-teal-mist p-5">
            <p className="flex items-center gap-2 font-medium text-teal-deep">
              <Check className="size-5" /> Solicitud recibida
            </p>
            <p className="text-sm text-ink-soft">
              Te contactaremos por correo cuando el acceso esté listo. Revisaremos la solicitud en el panel y te
              enviaremos un enlace para poner tu contraseña.
            </p>
            <Button asChild variant="outline">
              <Link to="/">Volver al inicio</Link>
            </Button>
          </div>
        ) : (
          <form className="mt-8 space-y-3 rounded-xl border border-line bg-surface p-5" onSubmit={(e) => void enviar(e)}>
            <label className="block space-y-1 text-sm text-ink-soft">
              <span>Nombre y apellidos</span>
              <input className={campo} value={c.nombre} onChange={(e) => setC({ ...c, nombre: e.target.value })} required maxLength={120} autoComplete="name" />
            </label>
            <label className="block space-y-1 text-sm text-ink-soft">
              <span>Correo</span>
              <input className={campo} type="email" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} required maxLength={254} autoComplete="email" />
            </label>
            <label className="block space-y-1 text-sm text-ink-soft">
              <span>Teléfono (opcional)</span>
              <input className={campo} type="tel" value={c.telefono} onChange={(e) => setC({ ...c, telefono: e.target.value })} maxLength={30} autoComplete="tel" />
            </label>
            <label className="block space-y-1 text-sm text-ink-soft">
              <span>Farmacia o asesoría</span>
              <input className={campo} value={c.entidad} onChange={(e) => setC({ ...c, entidad: e.target.value })} required maxLength={160} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1 text-sm text-ink-soft">
                <span>Tipo</span>
                <select className={campo} value={c.tipo_entidad} onChange={(e) => setC({ ...c, tipo_entidad: e.target.value as "farmacia" | "asesoria" })}>
                  <option value="farmacia">Farmacia</option>
                  <option value="asesoria">Asesoría</option>
                </select>
              </label>
              <label className="block space-y-1 text-sm text-ink-soft">
                <span>Plan de interés</span>
                <select className={campo} value={c.plan_interes} onChange={(e) => setC({ ...c, plan_interes: e.target.value })}>
                  <option value="demo">Demo</option>
                  <option value="gratis">Gratis</option>
                  <option value="premium">Premium</option>
                  <option value="medida">A medida</option>
                </select>
              </label>
            </div>
            <label className="block space-y-1 text-sm text-ink-soft">
              <span>Mensaje (opcional)</span>
              <Textarea className="min-h-20 resize-none text-sm" value={c.mensaje} onChange={(e) => setC({ ...c, mensaje: e.target.value })} maxLength={2000} rows={3} placeholder="Cuéntanos qué necesitas. Sin datos de pacientes." />
            </label>
            {/* Honeypot */}
            <input name="web" value={c.web} onChange={(e) => setC({ ...c, web: e.target.value })} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
            <label className="flex items-start gap-2 text-xs text-ink-soft">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" required />
              <span>
                He leído la{" "}
                <a href="/legal/privacidad" target="_blank" rel="noopener noreferrer" className="underline">
                  política de privacidad
                </a>{" "}
                y acepto el tratamiento de estos datos para atender la solicitud.
              </span>
            </label>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={enviando || !consent}>
              {enviando ? "Enviando…" : "Enviar solicitud"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
