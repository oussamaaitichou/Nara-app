import { createFileRoute } from "@tanstack/react-router";
import { construirPrompt, fechaHoy } from "@/lib/chat/cerebro";
import { clasificar } from "@/lib/chat/riesgo";
import { retrieve, formatContext, formatSources, ESTILO, CEREBRO } from "@/lib/knowledge";
import { accesoActivo, errorConfiguracion } from "@/lib/piloto/config.server";
import { consumirConsulta, devolverConsulta } from "@/lib/piloto/db.server";
import { sesionDe } from "@/lib/piloto/sesion.server";
import { SSE_HEADERS, flujoSSE, llamarIA } from "@/lib/chat/motor.server";

const MAX_MESSAGES = 40; // mensajes recientes que se envían a la IA
const MAX_TOTAL_CHARS = 28000; // tope de texto del historial enviado
const MAX_CHARS = 4000;

type Incoming = { role: "user" | "assistant"; content: string };

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Acceso por código (solo si PILOTO_ACCESO=activo): sin sesión válida no se llega a la IA
        let codigoId: number | null = null;
        let generacion = 0;
        if (accesoActivo()) {
          const fallo = errorConfiguracion();
          if (fallo) {
            console.error("[chat] Acceso mal configurado:", fallo);
            return fail("El acceso al piloto no está bien configurado.", 503);
          }
          const ses = await sesionDe(request);
          if (!ses) return fail("Necesitas tu código de acceso para consultar a Nara.", 401);
          codigoId = ses.cid;
          generacion = ses.gen;
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return fail("No he podido leer la consulta.", 400);
        }

        const messages = (body as { messages?: Incoming[] }).messages;
        if (!Array.isArray(messages) || messages.length === 0) {
          return fail("Escribe una consulta.", 400);
        }
        // Nunca se rechaza una conversación por larga: se conserva la parte más reciente y se descarta lo más antiguo.
        const limpios: Incoming[] = [];
        for (const m of messages.slice(-200)) {
          if (m?.role !== "user" && m?.role !== "assistant") return fail("Mensaje no válido.", 400);
          if (typeof m.content !== "string") return fail("Mensaje no válido.", 400);
          const content = m.content.trim().slice(0, MAX_CHARS);
          if (!content) continue;
          const previo = limpios[limpios.length - 1];
          // Si dos mensajes seguidos son del mismo autor (por ejemplo, tras un error y un reintento), se unen en uno
          if (previo && previo.role === m.role) previo.content = `${previo.content}\n\n${content}`.slice(0, MAX_CHARS * 2);
          else limpios.push({ role: m.role, content });
        }
        let trimmed = limpios.slice(-MAX_MESSAGES);
        let total = trimmed.reduce((n, m) => n + m.content.length, 0);
        while (trimmed.length > 1 && total > MAX_TOTAL_CHARS) {
          total -= trimmed[0]!.content.length;
          trimmed = trimmed.slice(1);
        }
        while (trimmed.length > 1 && trimmed[0]!.role !== "user") trimmed = trimmed.slice(1); // empieza siempre por una pregunta
        if (!trimmed.length || trimmed[trimmed.length - 1]?.role !== "user") {
          return fail("Escribe una consulta.", 400);
        }

        // Base de conocimiento: busca con la última pregunta y la anterior del usuario (para seguimientos)
        const userTurns = trimmed.filter((m) => m.role === "user");
        const query = userTurns.slice(-2).map((m) => m.content).join(" ");
        const found = retrieve(query);
        const clasificacion = clasificar(query);
        const systemPrompt = construirPrompt({
          cerebro: CEREBRO,
          estilo: ESTILO,
          clasificacion,
          contexto: formatContext(found),
          fecha: fechaHoy(),
        });
        // Registro de trazabilidad: nivel de riesgo, temas y documentos usados. No se guarda el contenido de la consulta.
        console.log("[chat-log]", JSON.stringify({ riesgo: clasificacion.riesgo, temas: clasificacion.temas, docs: found.map((c) => c.id), acceso: codigoId }));
        const sources = formatSources(found);

        if (codigoId !== null) {
          try {
            const consumo = await consumirConsulta(codigoId, generacion);
            if (!consumo.ok) {
              return consumo.motivo === "inactivo"
                ? fail("Tu código de acceso está desactivado o ha cambiado. Contacta con quien te invitó al piloto.", 401)
                : fail(`Has alcanzado el límite de ${consumo.limite} consultas de hoy. Mañana podrás seguir.`, 429);
            }
          } catch (error) {
            console.error("[chat] Error al descontar la consulta", error);
            return fail("No se ha podido comprobar tu acceso. Inténtalo de nuevo.", 503);
          }
        }
        const reembolsar = () => {
          if (codigoId !== null) void devolverConsulta(codigoId).catch(() => undefined);
        };

        const r = await llamarIA(systemPrompt, trimmed);
        if (!r.ok) {
          reembolsar();
          return fail(r.mensaje, r.status);
        }
        return new Response(flujoSSE(r.upstream, { final: sources }), { headers: SSE_HEADERS });
      },
    },
  },
});
