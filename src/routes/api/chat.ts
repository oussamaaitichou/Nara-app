import { createFileRoute } from "@tanstack/react-router";
import { construirPrompt, fechaHoy } from "@/lib/chat/cerebro";
import { clasificar } from "@/lib/chat/riesgo";
import { retrieve, formatContext, formatSources, ESTILO, CEREBRO } from "@/lib/knowledge";
import { accesoActivo, archivosActivos, errorConfiguracion, erpActivo } from "@/lib/piloto/config.server";
import { sesionErp } from "@/lib/erp/auth.server";
import { usuarioCtx } from "@/lib/erp/db.server";
import { consumirConsulta, devolverConsulta } from "@/lib/piloto/db.server";
import { sesionDe } from "@/lib/piloto/sesion.server";
import { SSE_HEADERS, flujoSSE, llamarIA, type MensajeIA, type Parte } from "@/lib/chat/motor.server";
import { procesarAdjuntos } from "@/lib/erp/adjuntos.server";
import { formatNaragestContext } from "@/lib/naragest/chat-context";

const MAX_MESSAGES = 40;
const MAX_TOTAL_CHARS = 28000;
const MAX_CHARS = 4000;
const MAX_SNAPSHOT = 12000;

type Incoming = { role: "user" | "assistant"; content: string };

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
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

        const controlAbierto = (() => {
          const v = process.env.CONTROL_ACCESO?.trim().toLowerCase();
          return v === "no" || v === "abierto" || v === "off" || v === "0";
        })();

        if (!controlAbierto) {
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
          if (!ok) return fail("Necesitas iniciar sesión en Acceso para consultar a Nara.", 401);
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
            ? body.naragestSnapshot.trim().slice(0, MAX_SNAPSHOT)
            : "";

        if ((!Array.isArray(messages) || messages.length === 0) && !hayAdjuntos) {
          return fail("Escribe una consulta o adjunta un archivo.", 400);
        }

        let items: Awaited<ReturnType<typeof procesarAdjuntos>> extends { ok: true; items: infer I } ? I : never = [];
        if (hayAdjuntos) {
          if (!archivosActivos()) {
            return fail("La subida de archivos no está activada (pon ARCHIVOS_ACTIVOS=si o quita ARCHIVOS_ACTIVOS=no).", 403);
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
        let trimmed = limpios.slice(-MAX_MESSAGES);
        let total = trimmed.reduce((n, m) => n + m.content.length, 0);
        while (trimmed.length > 1 && total > MAX_TOTAL_CHARS) {
          total -= trimmed[0]!.content.length;
          trimmed = trimmed.slice(1);
        }
        while (trimmed.length > 1 && trimmed[0]!.role !== "user") trimmed = trimmed.slice(1);
        if ((!trimmed.length || trimmed[trimmed.length - 1]?.role !== "user") && !items.length) {
          return fail("Escribe una consulta o adjunta un archivo.", 400);
        }

        const userTurns = trimmed.filter((m) => m.role === "user");
        const textosAdj = items
          .filter((i) => i.tipo === "texto")
          .map((i) => i.texto)
          .join("\n\n");
        const query = [userTurns.slice(-2).map((m) => m.content).join(" "), textosAdj].filter(Boolean).join("\n");
        const found = retrieve(query || "archivo adjunto farmacia");
        const clasificacion = clasificar(query || "documento");

        let contexto = formatContext(found);
        if (quiereDatosNegocio(query) || clientSnapshot) {
          try {
            const ng = clientSnapshot || formatNaragestContext(new Date());
            contexto = [contexto, ng].filter(Boolean).join("\n\n");
          } catch (e) {
            console.error("[chat] NaraGest context", e);
          }
        }

        const systemPrompt = construirPrompt({
          cerebro: CEREBRO,
          estilo: ESTILO,
          clasificacion,
          contexto,
          fecha: fechaHoy(),
          adjuntos: items.length > 0,
        });
        console.log(
          "[chat-log]",
          JSON.stringify({
            riesgo: clasificacion.riesgo,
            temas: clasificacion.temas,
            docs: found.map((c) => c.id),
            acceso: codigoId,
            adjuntos: items.length,
            naragest: !!(clientSnapshot || quiereDatosNegocio(query)),
            snapshotClient: !!clientSnapshot,
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

        const mensajesIA: MensajeIA[] = trimmed.map((m, idx) => {
          const esUltimoUser = m.role === "user" && idx === trimmed.length - 1;
          if (!esUltimoUser || !items.length) return { role: m.role, content: m.content };
          return {
            role: "user",
            content: partesAdjuntos(
              items,
              m.content || "Analiza el archivo adjunto en contexto de oficina de farmacia.",
            ),
          };
        });
        if (!trimmed.length && items.length) {
          mensajesIA.push({
            role: "user",
            content: partesAdjuntos(
              items,
              "Analiza estos archivos en contexto de oficina de farmacia española. Resume lo relevante y da orientación profesional.",
            ),
          });
        }

        const r = await llamarIA(systemPrompt, mensajesIA);
        if (!r.ok) {
          reembolsar();
          return fail(r.mensaje, r.status);
        }
        return new Response(flujoSSE(r.upstream, { final: sources }), { headers: SSE_HEADERS });
      },
    },
  },
});
