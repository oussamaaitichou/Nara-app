import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Send } from "lucide-react";
import { NaraMark } from "@/components/brand/logo";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/solicitar")({
  component: SolicitarDemoPage,
  head: () => ({
    meta: [
      { title: "Solicitar demo — Nara" },
      {
        name: "description",
        content: "Solicita una demo de Nara y NaraGest para tu oficina de farmacia o asesoría.",
      },
    ],
  }),
});

const CCAA = [
  "Andalucía",
  "Aragón",
  "Asturias",
  "Baleares",
  "Canarias",
  "Cantabria",
  "Castilla-La Mancha",
  "Castilla y León",
  "Cataluña",
  "Comunidad Valenciana",
  "Extremadura",
  "Galicia",
  "La Rioja",
  "Madrid",
  "Murcia",
  "Navarra",
  "País Vasco",
  "Ceuta",
  "Melilla",
  "Otra / fuera de España",
];

function SolicitarDemoPage() {
  const [activas, setActivas] = useState<boolean | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [farmacia, setFarmacia] = useState("");
  const [ccaa, setCcaa] = useState("");
  const [tipoCliente, setTipoCliente] = useState<"farmacia" | "asesoria">("farmacia");
  const [mensaje, setMensaje] = useState("");
  const [consentimiento, setConsentimiento] = useState(false);
  const [web, setWeb] = useState(""); // honeypot

  useEffect(() => {
    void fetch("/api/solicitud")
      .then((r) => r.json())
      .then((j: { activas?: boolean }) => setActivas(!!j.activas))
      .catch(() => setActivas(false));
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setError(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/solicitud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "acompanamiento",
          rol: tipoCliente === "asesoria" ? "comprador" : "vendedor",
          nombre: nombre.trim(),
          email: email.trim(),
          telefono: telefono.trim() || undefined,
          ccaa: ccaa || undefined,
          mensaje: [
            `[DEMO Nara] Tipo: ${tipoCliente === "asesoria" ? "Asesoría (solo chat)" : "Farmacia (Nara + NaraGest)"}`,
            farmacia.trim() ? `Farmacia / empresa: ${farmacia.trim()}` : null,
            mensaje.trim() || null,
          ]
            .filter(Boolean)
            .join("\n"),
          consentimiento: true,
          web,
          datos: {
            origen: "solicitar-demo",
            tipoCliente,
            farmacia: farmacia.trim() || null,
          },
        }),
      });
      const json = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setError(json.error ?? "No se ha podido enviar. Inténtalo de nuevo.");
        setEnviando(false);
        return;
      }
      setOk(true);
    } catch {
      setError("No se ha podido conectar. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  const campo =
    "h-11 w-full rounded-xl border border-slate-200 bg-[#FAFBFE] px-3 text-sm text-slate-900 outline-none focus:border-[#3B6EF5]";
  const label = "block text-sm font-medium text-slate-700";

  return (
    <div className="min-h-dvh bg-[#F7F8FC] text-slate-900">
      <SiteHeader solid />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#3B6EF5]"
        >
          <ArrowLeft className="size-4" /> Volver al inicio
        </Link>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/40 sm:p-8">
          <div className="flex items-center gap-3">
            <NaraMark className="size-10" />
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
                Solicita una demo
              </h1>
              <p className="text-sm text-slate-500">Nara · NaraGest</p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Déjanos tus datos y te activamos un acceso de prueba. Las{" "}
            <strong className="text-slate-800">farmacias</strong> prueban chat + gestión; las{" "}
            <strong className="text-slate-800">asesorías</strong> el chat de mostrador.
          </p>

          {activas === false ? (
            <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Las solicitudes están temporalmente desactivadas. Escríbenos o vuelve más tarde. También puedes
              usar <Link to="/login" className="font-semibold text-[#3B6EF5] underline">Acceso</Link> si ya
              tienes cuenta.
            </div>
          ) : null}

          {ok ? (
            <div className="mt-8 space-y-4 text-center">
              <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
              <h2 className="font-display text-xl font-semibold text-slate-900">Solicitud enviada</h2>
              <p className="text-sm text-slate-600">
                Hemos recibido tus datos. Te contactaremos para activar la demo.
              </p>
              <Button asChild className="rounded-full bg-[#3B6EF5] hover:bg-[#2f5cd6]">
                <Link to="/">Volver al inicio</Link>
              </Button>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={(e) => void enviar(e)}>
              {/* honeypot anti-bots */}
              <input
                type="text"
                name="web"
                value={web}
                onChange={(e) => setWeb(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
              />

              <div className="space-y-2">
                <span className={label}>Tipo de cliente</span>
                <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setTipoCliente("farmacia")}
                    className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                      tipoCliente === "farmacia" ? "bg-[#3B6EF5] text-white shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Farmacia
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoCliente("asesoria")}
                    className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                      tipoCliente === "asesoria" ? "bg-[#3B6EF5] text-white shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Asesoría
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  {tipoCliente === "farmacia"
                    ? "Demo de Nara (chat) + NaraGest (gestión)."
                    : "Demo centrada en Nara (chat de mostrador)."}
                </p>
              </div>

              <label className="block space-y-1.5">
                <span className={label}>Nombre *</span>
                <input
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={campo}
                  placeholder="Tu nombre"
                  autoComplete="name"
                />
              </label>

              <label className="block space-y-1.5">
                <span className={label}>Email *</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={campo}
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
              </label>

              <label className="block space-y-1.5">
                <span className={label}>Teléfono</span>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className={campo}
                  placeholder="600 000 000"
                  autoComplete="tel"
                />
              </label>

              <label className="block space-y-1.5">
                <span className={label}>
                  {tipoCliente === "asesoria" ? "Nombre de la asesoría" : "Nombre de la farmacia"}
                </span>
                <input
                  value={farmacia}
                  onChange={(e) => setFarmacia(e.target.value)}
                  className={campo}
                  placeholder={tipoCliente === "asesoria" ? "Tu asesoría" : "Farmacia…"}
                />
              </label>

              <label className="block space-y-1.5">
                <span className={label}>Comunidad autónoma</span>
                <select value={ccaa} onChange={(e) => setCcaa(e.target.value)} className={campo}>
                  <option value="">Selecciona…</option>
                  {CCAA.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className={label}>Mensaje (opcional)</span>
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-[#FAFBFE] px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#3B6EF5]"
                  placeholder="Cuéntanos qué te interesa probar…"
                />
              </label>

              <label className="flex items-start gap-2.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={consentimiento}
                  onChange={(e) => setConsentimiento(e.target.checked)}
                  className="mt-1 size-4 rounded border-slate-300"
                  required
                />
                <span>
                  Acepto que Nara trate estos datos para gestionar la demo.{" "}
                  <Link to="/legal/$doc" params={{ doc: "privacidad" }} className="text-[#3B6EF5] underline">
                    Política de privacidad
                  </Link>
                  .
                </span>
              </label>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <Button
                type="submit"
                disabled={enviando || activas === false || !consentimiento}
                className="w-full rounded-full bg-[#3B6EF5] hover:bg-[#2f5cd6]"
              >
                {enviando ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Enviando…
                  </>
                ) : (
                  <>
                    <Send className="size-4" /> Enviar solicitud de demo
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
