import { useEffect, useState } from "react";
import { Check, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Tipo = "informe" | "acompanamiento";
type Config = { activas: boolean; precio: string; pago: boolean };
const campo = "h-10 w-full rounded-md border border-line bg-bg px-3 text-sm text-ink outline-none focus:border-teal";

export function SolicitudCta({ modo, datos }: { modo: "vender" | "comprar"; datos: Record<string, unknown> }) {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [c, setC] = useState({ nombre: "", email: "", telefono: "", ccaa: "", mensaje: "", web: "" });
  const [consent, setConsent] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<{ tipo: Tipo; pago: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/solicitud")
      .then((r) => r.json() as Promise<Config>)
      .then(setCfg)
      .catch(() => setCfg(null));
  }, []);

  if (!cfg?.activas) return null;

  async function enviar() {
    if (!tipo || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/solicitud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...c, tipo, rol: modo === "vender" ? "vendedor" : "comprador", consentimiento: consent, datos }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; pago?: string | null };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "No se ha podido enviar la solicitud.");
        return;
      }
      setHecho({ tipo, pago: json.pago ?? null });
    } catch {
      setError("No se ha podido conectar. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (hecho) {
    return (
      <section className="space-y-3 rounded-xl border border-teal bg-teal-mist p-5">
        <p className="flex items-center gap-2 font-medium text-teal-deep">
          <Check className="size-5" /> Solicitud recibida
        </p>
        {hecho.tipo === "informe" ? (
          <>
            <p className="text-sm text-ink-soft">
              {hecho.pago
                ? "Para empezar la valoración, realiza el pago del informe. Cuando lo confirmemos, nos pondremos en contacto contigo."
                : "Nos pondremos en contacto contigo para el pago y para empezar la valoración."}
            </p>
            {hecho.pago ? (
              <Button asChild>
                <a href={hecho.pago} target="_blank" rel="noopener noreferrer">
                  Pagar el informe ({cfg.precio})
                </a>
              </Button>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-ink-soft">Nos pondremos en contacto contigo para hablar de la operación.</p>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
      <h2 className="font-display text-lg font-semibold text-ink">¿Quieres la valoración completa?</h2>
      <p className="text-sm text-muted">
        El informe de valoración cuesta {cfg.precio}. Si encargas la gestión de la operación (asesoramiento, negociación y financiación), el informe va incluido sin coste.
      </p>
      <div className="grid gap-2">
        <Button type="button" variant={tipo === "informe" ? "default" : "outline"} onClick={() => setTipo("informe")}>
          <FileText className="size-4" /> Pedir el informe ({cfg.precio})
        </Button>
        <Button type="button" variant={tipo === "acompanamiento" ? "default" : "outline"} onClick={() => setTipo("acompanamiento")}>
          <Users className="size-4" /> Quiero que gestionéis la operación
        </Button>
      </div>

      {tipo ? (
        <form
          className="space-y-3 border-t border-line pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            void enviar();
          }}
        >
          <input className={campo} placeholder="Nombre y apellidos" value={c.nombre} onChange={(e) => setC({ ...c, nombre: e.target.value })} maxLength={120} required autoComplete="name" />
          <input className={campo} type="email" placeholder="Correo electrónico" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} maxLength={254} required autoComplete="email" />
          <input className={campo} type="tel" placeholder="Teléfono (opcional)" value={c.telefono} onChange={(e) => setC({ ...c, telefono: e.target.value })} maxLength={30} autoComplete="tel" />
          <input className={campo} placeholder="Comunidad autónoma (opcional)" value={c.ccaa} onChange={(e) => setC({ ...c, ccaa: e.target.value })} maxLength={60} />
          <Textarea placeholder="Cuéntanos tu situación (opcional). No incluyas datos de pacientes." value={c.mensaje} onChange={(e) => setC({ ...c, mensaje: e.target.value })} maxLength={2000} rows={3} className="min-h-20 resize-none text-sm" />
          {/* Campo trampa para robots: no lo ve ninguna persona */}
          <input name="web" value={c.web} onChange={(e) => setC({ ...c, web: e.target.value })} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
          <p className="text-xs text-subtle">Se adjuntarán los datos que has introducido en la calculadora y sus resultados, para poder preparar la valoración.</p>
          <label className="flex items-start gap-2 text-xs text-ink-soft">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" required />
            <span>
              He leído la{" "}
              <a href="/legal/privacidad" target="_blank" rel="noopener noreferrer" className="underline">
                política de privacidad
              </a>{" "}
              y acepto que se traten estos datos para atender mi solicitud.
            </span>
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={enviando || !consent}>
            {enviando ? "Enviando…" : "Enviar solicitud"}
          </Button>
        </form>
      ) : null}
    </section>
  );
}
