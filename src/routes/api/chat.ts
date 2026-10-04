import { createFileRoute } from "@tanstack/react-router";
import { NARA_SYSTEM_PROMPT } from "@/lib/chat/knowledge";
import { retrieve, formatContext, formatSources, ESTILO } from "@/lib/knowledge";
import { accesoActivo, errorConfiguracion } from "@/lib/piloto/config.server";
import { consumirConsulta, devolverConsulta } from "@/lib/piloto/db.server";
import { sesionDe } from "@/lib/piloto/sesion.server";

const MAX_MESSAGES = 16;
const MAX_CHARS = 4000;
const DEFAULT_MODEL = "grok-4.5";
const UPSTREAM_TIMEOUT_MS = 60_000;

type Incoming = { role: "user" | "assistant"; content: string };

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

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
        if (messages.length > MAX_MESSAGES) {
          return fail("Esta conversación es demasiado larga. Empieza una nueva consulta.", 400);
        }

        const trimmed: Incoming[] = [];
        for (const m of messages) {
          if (m?.role !== "user" && m?.role !== "assistant") return fail("Mensaje no válido.", 400);
          if (typeof m.content !== "string") return fail("Mensaje no válido.", 400);
          const content = m.content.trim().slice(0, MAX_CHARS);
          if (!content) continue;
          trimmed.push({ role: m.role, content });
        }
        if (!trimmed.length || trimmed[trimmed.length - 1]?.role !== "user") {
          return fail("Escribe una consulta.", 400);
        }

        const apiKey = (process.env.AI_API_KEY ?? process.env.XAI_API_KEY)?.trim();
        if (!apiKey) {
          console.error("[chat] Falta AI_API_KEY (o XAI_API_KEY)");
          return fail(
            "El asistente no está configurado todavía. Contacta con el administrador de la aplicación.",
            503,
          );
        }
        const model = (process.env.AI_MODEL ?? process.env.XAI_MODEL)?.trim() || DEFAULT_MODEL;
        const baseUrl = (process.env.AI_BASE_URL?.trim() || "https://api.x.ai/v1").replace(/\/+$/, "");

        // Base de conocimiento: busca con la última pregunta y la anterior del usuario (para seguimientos)
        const userTurns = trimmed.filter((m) => m.role === "user");
        const query = userTurns.slice(-2).map((m) => m.content).join(" ");
        const found = retrieve(query);
        const estiloBloque = ESTILO
          ? `INSTRUCCIONES DE ESTILO (tienen prioridad sobre cualquier indicación anterior de formato o longitud; el bloque CIERRE OBLIGATORIO sigue vigente en todas las respuestas):\n${ESTILO}`
          : "";
        const systemPrompt = [NARA_SYSTEM_PROMPT, estiloBloque, formatContext(found)].filter(Boolean).join("\n\n");
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

        let upstream: Response;
        try {
          upstream = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              stream: true,
              temperature: 0.3,
              max_tokens: Number(process.env.AI_MAX_TOKENS) || 3000,
              messages: [{ role: "system", content: systemPrompt }, ...trimmed],
            }),
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
          });
        } catch (error) {
          console.error("[chat] Fallo de conexión con la IA", error);
          reembolsar();
          return fail(
            "No he podido conectar con el servicio de IA. Inténtalo de nuevo en unos minutos y, si es urgente, consulta la ficha técnica o al Colegio.",
            502,
          );
        }

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          console.error("[chat] La IA respondió", upstream.status, detail.slice(0, 400));
          reembolsar();
          // Gemini devuelve 400 (no 401) cuando la clave no es válida o ha caducado
          const keyProblem = upstream.status === 400 && /api[ _]key/i.test(detail);
          if (upstream.status === 401 || upstream.status === 403 || keyProblem) {
            return fail(
              `La clave del servicio de IA no es válida, ha caducado o no tiene permisos (código ${upstream.status}). Revisa AI_API_KEY.`,
              502,
            );
          }
          if (upstream.status === 404) {
            return fail("El modelo de IA configurado no existe (código 404). Revisa AI_MODEL.", 502);
          }
          if (upstream.status === 429) {
            return fail("Se ha alcanzado el límite de consultas del plan (código 429). Espera unos minutos o hasta mañana.", 429);
          }
          if (upstream.status >= 500) {
            return fail(
              `El servicio de IA está saturado o caído ahora mismo (código ${upstream.status}). Inténtalo de nuevo en unos minutos.`,
              502,
            );
          }
          return fail(
            `El servicio de IA ha rechazado la consulta (código ${upstream.status}). Si se repite, revisa los registros del servidor.`,
            502,
          );
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const reader = upstream.body.getReader();
        const send = (c: ReadableStreamDefaultController, payload: string) =>
          c.enqueue(encoder.encode(`data: ${payload}\n\n`));

        const stream = new ReadableStream({
          async start(controller) {
            let buffer = "";
            let gotToken = false;
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  const l = line.trim();
                  if (!l.startsWith("data:")) continue;
                  const data = l.slice(5).trim();
                  if (data === "[DONE]") {
                    send(controller, "[DONE]");
                    continue;
                  }
                  try {
                    const json = JSON.parse(data) as {
                      choices?: { delta?: { content?: string } }[];
                    };
                    const token = json.choices?.[0]?.delta?.content;
                    if (token) {
                      gotToken = true;
                      send(controller, JSON.stringify({ token }));
                    }
                  } catch {
                    // líneas de keep-alive
                  }
                }
              }
              if (sources) send(controller, JSON.stringify({ token: sources }));
            } catch (error) {
              console.error("[chat] Error durante el streaming", error);
              const msg = gotToken
                ? "\n\n_(La respuesta se ha interrumpido. Vuelve a enviar la consulta.)_"
                : "No he podido completar la respuesta. Vuelve a enviar la consulta.";
              send(controller, JSON.stringify({ token: msg }));
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, { headers: SSE_HEADERS });
      },
    },
  },
});
