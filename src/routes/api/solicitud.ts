import { createFileRoute } from "@tanstack/react-router";
import { baseDatosLista, precioTexto, solicitudesActivas, urlPago } from "@/lib/piloto/config.server";
import { contarSolicitudesRecientes, crearSolicitud } from "@/lib/piloto/db.server";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const MAX_POR_EMAIL = 3;
const MAX_TOTAL_DIA = 200;

const txt = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

export const Route = createFileRoute("/api/solicitud")({
  server: {
    handlers: {
      // Configuración pública: ¿se aceptan solicitudes?, precio y si hay enlace de pago
      GET: async () => {
        const activas = solicitudesActivas() && baseDatosLista();
        return Response.json({ activas, precio: precioTexto(), pago: !!urlPago() });
      },

      POST: async ({ request }) => {
        if (!solicitudesActivas()) return Response.json({ error: "Las solicitudes no están disponibles." }, { status: 404 });
        if (!baseDatosLista()) return Response.json({ error: "El servicio no está bien configurado." }, { status: 503 });

        let b: Record<string, unknown>;
        try {
          b = (await request.json()) as Record<string, unknown>;
        } catch {
          return Response.json({ error: "No he podido leer la solicitud." }, { status: 400 });
        }

        // Campo trampa para robots: una persona no lo rellena. Se responde "ok" sin guardar nada.
        if (txt(b.web, 100)) return Response.json({ ok: true });

        const tipo = b.tipo === "informe" || b.tipo === "acompanamiento" ? b.tipo : null;
        const rol = b.rol === "vendedor" || b.rol === "comprador" ? b.rol : null;
        const nombre = txt(b.nombre, 120);
        const email = txt(b.email, 254);
        if (!tipo || !rol) return Response.json({ error: "Solicitud no válida." }, { status: 400 });
        if (nombre.length < 2) return Response.json({ error: "Escribe tu nombre." }, { status: 400 });
        if (!EMAIL.test(email)) return Response.json({ error: "Escribe un correo electrónico válido." }, { status: 400 });
        if (b.consentimiento !== true) {
          return Response.json({ error: "Debes aceptar la política de privacidad para enviar la solicitud." }, { status: 400 });
        }

        let datos: string | null = null;
        if (b.datos && typeof b.datos === "object") {
          datos = JSON.stringify(b.datos);
          if (datos.length > 20000) return Response.json({ error: "Los datos adjuntos son demasiado grandes." }, { status: 400 });
        }

        try {
          const { porEmail, total } = await contarSolicitudesRecientes(email);
          if (porEmail >= MAX_POR_EMAIL || total >= MAX_TOTAL_DIA) {
            return Response.json({ error: "Has enviado varias solicitudes hoy. Te responderemos lo antes posible." }, { status: 429 });
          }
          await crearSolicitud({
            tipo, rol, nombre, email,
            telefono: txt(b.telefono, 30) || null,
            ccaa: txt(b.ccaa, 60) || null,
            mensaje: txt(b.mensaje, 2000) || null,
            datos,
          });
          return Response.json({ ok: true, pago: tipo === "informe" ? urlPago() : null });
        } catch (error) {
          console.error("[solicitud] Error al guardar", error);
          return Response.json({ error: "No se ha podido enviar la solicitud. Inténtalo de nuevo." }, { status: 503 });
        }
      },
    },
  },
});
