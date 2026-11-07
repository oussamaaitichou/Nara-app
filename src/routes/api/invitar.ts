import { createFileRoute } from "@tanstack/react-router";
import { passwordInvalida } from "@/lib/erp/auth.server";
import { consumirInvitacion } from "@/lib/planes/admin.server";
import { baseDatosLista } from "@/lib/piloto/config.server";

export const Route = createFileRoute("/api/invitar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!baseDatosLista()) {
          return Response.json({ error: "Servicio no disponible." }, { status: 503 });
        }
        let b: Record<string, unknown>;
        try {
          b = (await request.json()) as Record<string, unknown>;
        } catch {
          return Response.json({ error: "Petición no válida." }, { status: 400 });
        }
        const token = typeof b.token === "string" ? b.token.trim() : "";
        const password = typeof b.password === "string" ? b.password : "";
        if (!token) return Response.json({ error: "Falta el enlace de invitación." }, { status: 400 });
        const invalida = passwordInvalida(password);
        if (invalida) return Response.json({ error: invalida }, { status: 400 });

        try {
          const r = await consumirInvitacion(token, password);
          if (!r.ok) return Response.json({ error: r.motivo }, { status: 400 });
          return Response.json({ ok: true, email: r.email });
        } catch (e) {
          console.error("[invitar]", e);
          return Response.json({ error: "No se ha podido activar la cuenta." }, { status: 503 });
        }
      },
    },
  },
});
