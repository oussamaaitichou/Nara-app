import { createFileRoute } from "@tanstack/react-router";
import {
  contarNaraSolicitudesRecientes,
  crearNaraSolicitud,
} from "@/lib/planes/admin.server";
import { emailNuevaSolicitud } from "@/lib/planes/email.server";
import { baseDatosLista } from "@/lib/piloto/config.server";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const MAX_EMAIL = 3;
const MAX_IP = 10;

const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function clientIp(request: Request): string | null {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip");
}

export const Route = createFileRoute("/api/demo-solicitud")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({
          activas: baseDatosLista(),
          planes: [
            { id: "demo", nombre: "Demo" },
            { id: "gratis", nombre: "Gratis" },
            { id: "premium", nombre: "Premium" },
            { id: "medida", nombre: "A medida" },
          ],
        });
      },

      POST: async ({ request }) => {
        if (!baseDatosLista()) {
          return Response.json({ error: "El servicio no está disponible temporalmente." }, { status: 503 });
        }

        let b: Record<string, unknown>;
        try {
          b = (await request.json()) as Record<string, unknown>;
        } catch {
          return Response.json({ error: "No he podido leer la solicitud." }, { status: 400 });
        }

        // Honeypot: bots rellenan "web"; humanos no lo ven
        if (txt(b.web, 100)) return Response.json({ ok: true });

        const nombre = txt(b.nombre, 120);
        const email = txt(b.email, 254);
        const entidad = txt(b.entidad, 160);
        const tipo_entidad = b.tipo_entidad === "asesoria" ? "asesoria" : "farmacia";
        const plan_interes = ["demo", "gratis", "premium", "medida"].includes(String(b.plan_interes))
          ? String(b.plan_interes)
          : "demo";
        const telefono = txt(b.telefono, 30) || null;
        const mensaje = txt(b.mensaje, 2000) || null;

        if (nombre.length < 2) return Response.json({ error: "Escribe tu nombre." }, { status: 400 });
        if (!EMAIL.test(email)) return Response.json({ error: "Escribe un correo válido." }, { status: 400 });
        if (entidad.length < 2) return Response.json({ error: "Indica el nombre de la farmacia o asesoría." }, { status: 400 });
        if (b.consentimiento !== true) {
          return Response.json({ error: "Debes aceptar la política de privacidad." }, { status: 400 });
        }

        const ip = clientIp(request);
        const { porEmail, porIp } = await contarNaraSolicitudesRecientes(email, ip);
        if (porEmail >= MAX_EMAIL || porIp >= MAX_IP) {
          return Response.json(
            { error: "Has enviado varias solicitudes hoy. Te responderemos lo antes posible." },
            { status: 429 },
          );
        }

        const id = await crearNaraSolicitud({
          nombre,
          email,
          telefono,
          entidad,
          tipo_entidad,
          plan_interes,
          mensaje,
          ip,
          user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
        });
        if (!id) return Response.json({ error: "No se ha podido guardar la solicitud." }, { status: 503 });

        void emailNuevaSolicitud({ id, nombre, email, entidad, plan_interes });

        return Response.json({ ok: true, id });
      },
    },
  },
});
