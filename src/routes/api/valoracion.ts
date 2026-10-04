import { createFileRoute } from "@tanstack/react-router";
import { accesoActivo, errorConfiguracion } from "@/lib/piloto/config.server";
import { estadoUso, guardarValoracion } from "@/lib/piloto/db.server";
import { sesionDe } from "@/lib/piloto/sesion.server";

export const Route = createFileRoute("/api/valoracion")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!accesoActivo() || errorConfiguracion()) {
          return Response.json({ error: "Las valoraciones no están disponibles." }, { status: 404 });
        }
        const ses = await sesionDe(request);
        if (!ses) return Response.json({ error: "Necesitas tu código de acceso.", acceso: true }, { status: 401 });

        let body: { valor?: unknown; pregunta?: unknown; respuesta?: unknown; comentario?: unknown };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Valoración no válida." }, { status: 400 });
        }
        const valor = body.valor === "util" || body.valor === "incorrecta" ? body.valor : null;
        const pregunta = typeof body.pregunta === "string" ? body.pregunta.trim().slice(0, 4000) : "";
        const respuesta = typeof body.respuesta === "string" ? body.respuesta.trim().slice(0, 12000) : "";
        const comentario = typeof body.comentario === "string" && body.comentario.trim() ? body.comentario.trim().slice(0, 1000) : null;
        if (!valor || !pregunta || !respuesta) return Response.json({ error: "Valoración no válida." }, { status: 400 });

        try {
          const est = await estadoUso(ses.cid);
          if (!est || !est.activo || est.generacion !== ses.gen) return Response.json({ error: "Acceso desactivado.", acceso: true }, { status: 401 });
          await guardarValoracion({ codigoId: ses.cid, valor, pregunta, respuesta, comentario });
          return Response.json({ ok: true });
        } catch (error) {
          console.error("[valoracion] Error al guardar", error);
          return Response.json({ error: "No se ha podido guardar la valoración." }, { status: 503 });
        }
      },
    },
  },
});
