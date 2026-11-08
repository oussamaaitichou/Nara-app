import { createFileRoute } from "@tanstack/react-router";
import { construirPrompt, fechaHoy } from "@/lib/chat/cerebro";
import { clasificar } from "@/lib/chat/riesgo";
import { retrieve, formatContext, formatSources, ESTILO, CEREBRO } from "@/lib/knowledge";
import { accesoActivo, archivosActivos, errorConfiguracion, erpActivo } from "@/lib/piloto/config.server";
import { consumirConsulta, devolverConsulta } from "@/lib/piloto/db.server";
import { sesionDe } from "@/lib/piloto/sesion.server";
import { SSE_HEADERS, flujoSSE, llamarIA, type MensajeIA, type Parte } from "@/lib/chat/motor.server";
import { procesarAdjuntos } from "@/lib/erp/adjuntos.server";
import { formatNaragestContext } from "@/lib/naragest/chat-context";
import { sesionErp } from "@/lib/erp/auth.server";
import { usuarioCtx } from "@/lib/erp/db.server";

const MAX_MESSAGES = 40;
const MAX_TOTAL_CHARS = 28000;
const MAX_CHARS = 4000;
const MAX_SNAPSHOT = 12000;

type Incoming = { role: "user" | "assistant"; content: string };

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function controlAbierto(): boolean {
  const v = process.env.CONTROL_ACCESO?.trim().toLowerCase();
  return v === "no" || v === "abierto" || v === "off" || v === "0";
}

const NEGOCIO_KEYS = [
  "farmacia",
  "negocio",
  "ventas",
  "compra",
  "stock",
  "inventario",
  "margen",
  "rentabil",
  "caduc",
  "pedido",
  "proveedor",
  "como va",
  "cómo va",
  "como esta",
  "cómo está",
  "perd",
  "beneficio",
  "factur",
  "kpi",
  "dashboard",
  "panel",
  "naragest",
  "nara gest",
  "alert",
  "prioriz",
];

function quiereDatosNegocio(query: string): boolean {
  const q = query.toLowerCase();
  return NEGOCIO_KEYS.some((k) => q.includes(k));
}

function partesAdjuntos(
  items: { tipo: string; nombre: string; texto?: string; dataUrl?: string }[],
  textoBase: string,
): Parte[] {
  const partes: Parte[] = [{ type: "text", text: textoBase }];
  for (const it of items) {
    if (it.tipo === "texto" && it.texto) {
      partes.push({ type: "text", text: `\n\n--- Archivo: ${it.nombre} ---\n${it.texto}` });
    } else if (it.tipo === "imagen" && it.dataUrl) {
      partes.push({ type: "image_url", image_url: { url: it.dataUrl } });
    }
  }
  return partes;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      GET: async () => Response.json({ archivos: archivosActivos() }),

      POST: async ({ request }) => {
        let codigoId: number | null = null;
        let generacion = 0;

        // Control de acceso: sin sesión no se consulta (salvo CONTROL_ACCESO=abierto)
        if (!controlAbierto()) {
          let ok = false;

          if (erpActivo()) {
            try {
              const sid = await sesionErp(request);
              if (sid) {
                const u = await usuarioCtx(sid.uid);
                if (u && u.version === sid.v && u.activo) ok = true;
              }
            } catch (e) {
              console.error("[chat] sesion erp", e);
            }
          }

          if (!ok && accesoActivo()) {
            const fallo = errorConfiguracion();
            if (fallo) {
              console.error("[chat] Acceso mal configurado:", fallo);
              return fail("El acceso no está bien configurado.", 503);
            }
            const ses = await sesionDe(request);
            if (ses) {
              codigoId = ses.cid;
              generacion = ses.gen;
              ok = true;
            }
          }

          if (!ok) {
            return fail("Necesitas iniciar sesión en Acceso para consultar a Nara.", 401);
          }
        } else if (accesoActivo()) {
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

        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return fail("No he podido leer la consulta (¿archivos demasiado grandes?).", 400);
        }

        const messages = body.messages as Incoming[] | undefined;
        const hayAdjuntos = Array.isArray(body.adjuntos) && body.adjuntos.length > 0;
        const clientSnapshot =
          typeof body.naragestSnapshot === "string"
            ? body.naragestSnapshot.slice(0, MAX_SNAPSHOT)
            : "";

        if (!Array.isArray(messages) || messages.length === 0) {
          return fail("Falta el historial de la conversación.", 400);
        }
        if (messages.length > MAX_MESSAGES) {
          return fail("La conversación es demasiado larga. Empieza una nueva.", 400);
        }

        let total = 0;
        const clean: Incoming[] = [];
        for (const m of messages) {
          if (!m || (m.role !== "user" && m.role !== "assistant")) continue;
          const content = typeof m.content === "string" ? m.content.trim().slice(0, MAX_CHARS) : "";
          if (!content) continue;
          total += content.length;
          if (total > MAX_TOTAL_CHARS) {
            return fail("Has enviado demasiado texto. Resume o empieza de nuevo.", 400);
          }
          clean.push({ role: m.role, content });
        }
        if (clean.length === 0) return fail("No hay mensajes válidos.", 400);

        const lastUser = [...clean].reverse().find((m) => m.role === "user");
        if (!lastUser) return fail("Falta una pregunta del usuario.", 400);

        if (codigoId != null) {
          const r = await consumirConsulta(codigoId, generacion);
          if (!r.ok) return fail(r.error, 429);
        }

        try {
          const adjuntosRaw = Array.isArray(body.adjuntos) ? body.adjuntos : [];
          const adjuntos = hayAdjuntos ? await procesarAdjuntos(adjuntosRaw) : [];

          const query = lastUser.content;
          const hits = retrieve(query, 6);
          const contexto = formatContext(hits);
          const fuentes = formatSources(hits);
          const riesgo = clasificar(query);

          let negocio = "";
          if (quiereDatosNegocio(query)) {
            negocio = clientSnapshot || formatNaragestContext();
          }

          const systemParts = [
            ESTILO,
            CEREBRO,
            construirPrompt({ fecha: fechaHoy(), riesgo }),
            contexto ? `\n\n### Documentación de apoyo\n${contexto}` : "",
            fuentes ? `\n\n### Fuentes\n${fuentes}` : "",
            negocio ? `\n\n### Datos de la farmacia (piloto)\n${negocio}` : "",
          ].filter(Boolean);

          const system = systemParts.join("\n");

          const historial: MensajeIA[] = [{ role: "system", content: system }];
          for (let i = 0; i < clean.length; i++) {
            const m = clean[i]!;
            if (i === clean.length - 1 && m.role === "user" && adjuntos.length > 0) {
              historial.push({
                role: "user",
                content: partesAdjuntos(adjuntos, m.content),
              });
            } else {
              historial.push({ role: m.role, content: m.content });
            }
          }

          const stream = await llamarIA(historial, { stream: true });
          return flujoSSE(stream, SSE_HEADERS);
        } catch (e) {
          if (codigoId != null) await devolverConsulta(codigoId, generacion);
          console.error("[chat]", e);
          return fail("No he podido completar la respuesta. Inténtalo de nuevo.", 502);
        }
      },
    },
  },
});
