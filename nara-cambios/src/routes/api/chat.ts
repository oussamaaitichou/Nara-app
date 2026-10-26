import { createFileRoute } from "@tanstack/react-router";
import { construirPrompt, fechaHoy } from "@/lib/chat/cerebro";
import { clasificar } from "@/lib/chat/riesgo";
import { retrieve, formatContext, formatSources, ESTILO, CEREBRO } from "@/lib/knowledge";
import { accesoActivo, archivosActivos, errorConfiguracion } from "@/lib/piloto/config.server";
import { consumirConsulta, devolverConsulta } from "@/lib/piloto/db.server";
import { sesionDe, sesionUsuarioDe } from "@/lib/piloto/sesion.server";
import { SSE_HEADERS, flujoSSE, llamarIA, type MensajeIA, type Parte } from "@/lib/chat/motor.server";
import { procesarAdjuntos } from "@/lib/erp/adjuntos.server";

const MAX_MESSAGES = 40;
const MAX_TOTAL_CHARS = 28000;
const MAX_CHARS = 4000;

type Incoming = { role: "user" | "assistant"; content: string };

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      /** GET: si se pueden adjuntar archivos en este despliegue. */
      GET: async () => Response.json({ archivos: archivosActivos() }),

      POST: async ({ request }) => {
        let codigoId: number | null = null;
        let generacion = 0;
        if (accesoActivo()) {
          const fallo = errorConfiguracion();
          if (fallo) {
            console.error("[chat] Acceso mal configurado:", fallo);
            return fail("El acceso al piloto no está bien configurado.", 503);
          }
          const sesUser = await sesionUsuarioDe(request);
          if (sesUser) {
            codigoId = null;
          } else {
            const ses = await sesionDe(request);
            if (!ses) return fail("Necesitas tu código de acceso o una cuenta aprobada para consultar a Nara.", 401);
            codigoId = ses.cid;
            generacion = ses.gen;
          }
        }

        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return fail("No he podido leer la consulta (¿archivos demasiado grandes?).", 400);
        }

        const messages = body.messages as Incoming[] | undefined;
        const hayAdjuntos = Array.isArray(body.adjuntos) && body.adjuntos.length > 0;

        if ((!Array.isArray(messages) || messages.length === 0) && !hayAdjuntos) {
          return fail("Escribe una consulta o adjunta un archivo.", 400);
        }

        let items: Awaited<ReturnType<typeof procesarAdjuntos>> extends { ok: true; items: infer I } ? I : never = [];
        if (hayAdjuntos) {
          if (!archivosActivos()) {
            return fail("La subida de archivos no está activada en este servidor (ARCHIVOS_ACTIVOS).", 403);
          }
          const adjuntos = await procesarAdjuntos(body.adjuntos);
          if (!adjuntos.ok) return fail(adjuntos.error, 400);
          items = adjuntos.items;
        }

        const limpios: Incoming[] = [];
        for (const m of (messages ?? []).slice(-200)) {
          if (m?.role !== "user" && m?.role !== "assistant") return fail("Mensaje no válido.", 400);
          if (typeof m.content !== "string") return fail("Mensaje no válido.", 400);
          const content = m.content.trim().slice(0, MAX_CHARS);
          if (!content) continue;
          const previo = limpios[limpios.length - 1];
          if (previo && previo.role === m.role) previo.content = `${previo.content}\n\n${content}`.slice(0, MAX_CHARS * 2);
          else limpios.push({ role: m.role, content });
        }

        // Si solo hay archivos, inventamos un turno de usuario vacío que se rellenará con el contenido
        if (!limpios.length && items.length) {
          limpios.push({ role: "user", content: "Analiza los archivos adjuntos." });
        }

        let trimmed = limpios.slice(-MAX_MESSAGES);
        let total = trimmed.reduce((n, m) => n + m.content.length, 0);
        while (trimmed.length > 1 && total > MAX_TOTAL_CHARS) {
          total -= trimmed[0]!.content.length;
          trimmed = trimmed.slice(1);
        }
        while (trimmed.length > 1 && trimmed[0]!.role !== "user") trimmed = trimmed.slice(1);
        if (!trimmed.length || trimmed[trimmed.length - 1]?.role !== "user") {
          return fail("Escribe una consulta.", 400);
        }

        // Incorporar texto de documentos al último mensaje del usuario
        const last = trimmed[trimmed.length - 1]!;
        let ultimoTexto = last.content;
        for (const a of items) {
          if (a.texto) ultimoTexto += `\n\n[Documento adjunto «${a.nombre}»]\n${a.texto}`;
        }
        if (!ultimoTexto.trim() && items.some((a) => a.tipo === "imagen")) {
          ultimoTexto = "Describe y analiza las imágenes adjuntas en el contexto de una oficina de farmacia en España.";
        }
        last.content = ultimoTexto.slice(0, MAX_CHARS + 40_000);

        const userTurns = trimmed.filter((m) => m.role === "user");
        const query = userTurns.slice(-2).map((m) => m.content).join(" ").slice(0, 8000);
        const found = retrieve(query);
        const clasificacion = clasificar(query);
        const conArchivos = items.length > 0;
        const systemPrompt = construirPrompt({
          cerebro: CEREBRO,
          estilo: ESTILO,
          clasificacion,
          contexto: formatContext(found),
          fecha: fechaHoy(),
          adjuntos: conArchivos || archivosActivos(),
        });
        console.log(
          "[chat-log]",
          JSON.stringify({
            riesgo: clasificacion.riesgo,
            temas: clasificacion.temas,
            docs: found.map((c) => c.id),
            acceso: codigoId,
            archivos: items.length,
          }),
        );
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

        // Mensajes para la IA: historial en texto + último turno con imágenes si las hay
        const imagenes = items.filter((a) => a.tipo === "imagen");
        const hist: MensajeIA[] = trimmed.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
        const actual: MensajeIA["content"] = imagenes.length
          ? ([
              { type: "text", text: last.content || "Describe y analiza las imágenes adjuntas." },
              ...imagenes.map((i): Parte => ({ type: "image_url", image_url: { url: i.dataUrl! } })),
            ] as Parte[])
          : last.content;
        hist.push({ role: "user", content: actual });

        const r = await llamarIA(systemPrompt, hist);
        if (!r.ok) {
          reembolsar();
          return fail(r.mensaje, r.status);
        }
        return new Response(flujoSSE(r.upstream, { final: sources }), { headers: SSE_HEADERS });
      },
    },
  },
});
