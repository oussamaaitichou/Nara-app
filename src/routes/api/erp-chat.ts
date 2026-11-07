import { createFileRoute } from "@tanstack/react-router";
import { construirPrompt, fechaHoy } from "@/lib/chat/cerebro";
import { SSE_HEADERS, flujoSSE, llamarIA, recogerTexto, type MensajeIA, type Parte } from "@/lib/chat/motor.server";
import { parseNaraPayload } from "@/lib/chat/parse";
import { clasificar } from "@/lib/chat/riesgo";
import { acceso, idNum, json, servicio, txt } from "@/lib/erp/acceso.server";
import { procesarAdjuntos } from "@/lib/erp/adjuntos.server";
import {
  archivosUsados, borrarConversacion, conversacionDe, crearConversacion, guardarMensaje, guardarResumen, listarConversaciones, mensajesDe,
  mensajesDesde, mensajesHoy, registrarArchivos, type MensajeFila, type UsuarioCtx,
} from "@/lib/erp/db.server";
import { PLANES } from "@/lib/erp/planes";
import { CEREBRO, ESTILO, formatContext, formatSources, retrieve } from "@/lib/knowledge";
import { verificarPlanErp, textoAvisoCaducidad } from "@/lib/planes/verificar.server";
import { archivosActivos } from "@/lib/piloto/config.server";

const MAX_TEXTO = 4000;
const MAX_MENSAJES_IA = 40;
const MAX_CHARS_IA = 60_000;
const UMBRAL_RESUMEN = 24_000; // en premium, al pasar de este texto se resume lo antiguo
const MANTENER = 8; // mensajes recientes que se conservan completos
const SISTEMA_RESUMEN = `Resume la conversación que se te da, para que quien la continúe no pierda el hilo. Escribe en español, en un máximo de 350 palabras: los datos y cifras mencionados, las decisiones tomadas, los documentos comentados y las dudas pendientes. Conserva exactamente las cifras, fechas y nombres de normas. No añadas nada que no esté en la conversación.`;
const hora = (d: Date) => new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" }).format(d);

async function cuota(u: UsuarioCtx, archivos12h?: number) {
  const limite = archivos12h ?? PLANES[u.plan].archivos12h;
  const { usados, masAntiguo } = await archivosUsados(u.id);
  const liberaA = masAntiguo ? new Date(new Date(masAntiguo).getTime() + 12 * 3600 * 1000) : null;
  return { limite, usados, restantes: Math.max(0, limite - usados), liberaA };
}

async function resumir(previo: string, msgs: MensajeFila[]): Promise<string | null> {
  const lineas = msgs.map((m) => {
    let c = m.rol === "assistant" ? parseNaraPayload(m.contenido).content : m.contenido;
    if (m.rol === "user" && m.adjuntos) {
      try {
        for (const a of JSON.parse(m.adjuntos) as { nombre: string; texto?: string }[]) c += a.texto ? `\n[Documento «${a.nombre}»]: ${a.texto.slice(0, 1500)}` : `\n[Imagen: ${a.nombre}]`;
      } catch {
        // adjuntos ilegibles
      }
    }
    return `${m.rol === "user" ? "Usuario" : "Nara"}: ${c}`;
  });
  const entrada = `${previo ? `Resumen anterior:\n${previo}\n\n` : ""}Conversación a resumir:\n${lineas.join("\n\n")}`.slice(0, 60_000);
  const r = await llamarIA(SISTEMA_RESUMEN, [{ role: "user", content: entrada }]);
  if (!r.ok) return null;
  const t = (await recogerTexto(r.upstream)).trim();
  return t.length > 20 ? t : null;
}

export const Route = createFileRoute("/api/erp-chat")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const mal = servicio();
        if (mal) return mal;
        try {
          const u = await acceso(request);
          if (u instanceof Response) return u;
          const url = new URL(request.url);
          const r = url.searchParams.get("r");
          if (r === "config") {
            const plan = await verificarPlanErp(u);
            const archivos12h = plan.ok ? plan.archivos12h : PLANES[u.plan].archivos12h;
            const c = await cuota(u, archivos12h);
            const aviso = plan.ok ? textoAvisoCaducidad(plan.diasRestantes) : null;
            return json({
              plan: plan.ok ? plan.planId : u.plan,
              archivos: archivosActivos(),
              limite: c.limite,
              usados: c.usados,
              restantes: c.restantes,
              liberaA: c.liberaA?.toISOString() ?? null,
              diasRestantes: plan.ok ? plan.diasRestantes : null,
              avisoCaducidad: aviso,
            });
          }
          if (r === "conversaciones") return json({ conversaciones: await listarConversaciones(u.id) });
          if (r === "conversacion") {
            const conv = await conversacionDe(Number(url.searchParams.get("id")), u.id);
            if (!conv) return json({ error: "No encontrada." }, 404);
            const mensajes = (await mensajesDe(conv.id)).map((m) => {
              let adj: { nombre: string; tipo: string; tam: number }[] = [];
              try {
                adj = m.adjuntos ? (JSON.parse(m.adjuntos) as { nombre: string; tipo: string; tam: number }[]).map(({ nombre, tipo, tam }) => ({ nombre, tipo, tam })) : [];
              } catch {
                adj = [];
              }
              return { id: m.id, rol: m.rol, contenido: m.contenido, adjuntos: adj };
            });
            return json({ conversacion: { id: conv.id, titulo: conv.titulo, actualizado: conv.actualizado }, mensajes });
          }
          return json({ error: "Petición no válida." }, 400);
        } catch (e) {
          console.error("[erp-chat] GET", e);
          return json({ error: "No se han podido leer los datos." }, 503);
        }
      },

      POST: async ({ request }) => {
        const mal = servicio();
        if (mal) return mal;
        let b: Record<string, unknown>;
        try {
          b = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ error: "Petición no válida (¿archivos demasiado grandes?)." }, 400);
        }
        try {
          const u = await acceso(request);
          if (u instanceof Response) return u;

          if (b.accion === "borrar") {
            const id = idNum(b.id);
            if (!id) return json({ error: "Falta la conversación." }, 400);
            await borrarConversacion(id, u.id);
            return json({ ok: true });
          }
          if (b.accion !== "enviar") return json({ error: "Acción no válida." }, 400);

          // --- Filtro de plan (antes de Gemini) ---
          const usadosHoy = await mensajesHoy(u.id);
          const plan = await verificarPlanErp(u, { comprobarMensajes: true, mensajesUsadosHoy: usadosHoy });
          if (!plan.ok) {
            const status = plan.motivo === "limite_mensajes" ? 429 : 403;
            return json({ error: plan.mensaje, motivo: plan.motivo }, status);
          }

          const texto = txt(b.texto, MAX_TEXTO);
          const hayArchivos = Array.isArray(b.adjuntos) && b.adjuntos.length > 0;
          if (!texto && !hayArchivos) return json({ error: "Escribe tu consulta." }, 400);

          let adjuntos: Awaited<ReturnType<typeof procesarAdjuntos>> = { ok: true, items: [] };
          if (hayArchivos) {
            if (!archivosActivos()) return json({ error: "La subida de archivos todavía no está disponible." }, 403);
            adjuntos = await procesarAdjuntos(b.adjuntos);
            if (!adjuntos.ok) return json({ error: adjuntos.error }, 400);
            const c = await cuota(u, plan.archivos12h);
            if (adjuntos.items.length > c.restantes) {
              const cuando = c.liberaA ? ` Podrás subir más a partir de las ${hora(c.liberaA)}.` : "";
              return json({ error: `Has alcanzado el límite de ${c.limite} archivos cada 12 horas del plan ${plan.planId}.${cuando}` }, 429);
            }
          }
          const items = adjuntos.ok ? adjuntos.items : [];

          // Conversación (si es nueva, solo se crea cuando la IA ya ha aceptado la consulta)
          let conv: Awaited<ReturnType<typeof conversacionDe>> = null;
          if (b.conversacionId !== undefined && b.conversacionId !== null) {
            conv = await conversacionDe(idNum(b.conversacionId) ?? 0, u.id);
            if (!conv) return json({ error: "No encontrada." }, 404);
          }

          let previos = conv ? await mensajesDesde(conv.id, conv.resumido_hasta, 400) : [];
          let memoria = conv?.resumen ?? "";
          // Premium / plan con límites altos: la conversación no tiene fin. Cuando lo antiguo es muy largo, se resume.
          const esPremium = plan.planId === "premium" || plan.planId === "medida" || u.plan === "premium";
          if (conv && esPremium && previos.length > MANTENER + 2 && previos.reduce((n, m) => n + m.contenido.length, 0) > UMBRAL_RESUMEN) {
            const corte = previos.length - MANTENER;
            const nuevo = await resumir(memoria, previos.slice(0, corte));
            if (nuevo) {
              memoria = nuevo;
              await guardarResumen(conv.id, nuevo, previos[corte - 1]!.id);
              previos = previos.slice(corte);
            }
          }

          // Historial guardado, limpio de bloques técnicos y con el texto de los documentos ya subidos
          let hist: { role: "user" | "assistant"; content: string }[] = [];
          for (const m of previos) {
            let c = m.rol === "assistant" ? parseNaraPayload(m.contenido).content : m.contenido;
            if (m.rol === "user" && m.adjuntos) {
              try {
                for (const a of JSON.parse(m.adjuntos) as { nombre: string; texto?: string }[]) {
                  c += a.texto ? `\n\n[Documento adjunto «${a.nombre}»]\n${a.texto}` : `\n\n[Imagen adjunta: ${a.nombre}]`;
                }
              } catch {
                // adjuntos ilegibles: se ignoran
              }
            }
            c = c.trim();
            if (!c) continue;
            const prev = hist.at(-1);
            if (prev && prev.role === m.rol) prev.content += `\n\n${c}`;
            else hist.push({ role: m.rol, content: c });
          }
          let total = hist.reduce((n, m) => n + m.content.length, 0);
          hist = hist.slice(-MAX_MENSAJES_IA);
          while (hist.length > 1 && total > MAX_CHARS_IA) total -= hist.shift()!.content.length;
          while (hist.length && hist[0]!.role !== "user") hist.shift();

          let completo = texto;
          for (const a of items) if (a.texto) completo += `\n\n[Documento adjunto «${a.nombre}»]\n${a.texto}`;
          if (hist.at(-1)?.role === "user") completo = `${hist.pop()!.content}\n\n${completo}`;
          const imagenes = items.filter((a) => a.tipo === "imagen");
          const actual: MensajeIA["content"] = imagenes.length
            ? ([{ type: "text", text: completo || "Describe y analiza las imágenes adjuntas." }, ...imagenes.map((i): Parte => ({ type: "image_url", image_url: { url: i.dataUrl! } }))] as Parte[])
            : completo;
          const mensajes: MensajeIA[] = [...hist, { role: "user", content: actual }];

          const consulta = [previos.filter((m) => m.rol === "user").at(-1)?.contenido ?? "", texto].join(" ");
          const found = retrieve(consulta);
          const clasificacion = clasificar(consulta);
          const systemPrompt = construirPrompt({ cerebro: CEREBRO, estilo: ESTILO, clasificacion, contexto: formatContext(found), fecha: fechaHoy(), adjuntos: archivosActivos(), memoria });
          console.log("[chat-log]", JSON.stringify({ riesgo: clasificacion.riesgo, temas: clasificacion.temas, docs: found.map((c) => c.id), erp: u.id, archivos: items.length, plan: plan.planId }));

          const r = await llamarIA(systemPrompt, mensajes);
          if (!r.ok) return json({ error: r.mensaje }, r.status);

          const titulo = (texto || `Archivo: ${items[0]?.nombre ?? "adjunto"}`).replace(/\s+/g, " ").slice(0, 60);
          const convId = conv ? conv.id : await crearConversacion(u.id, titulo);
          await guardarMensaje(convId, "user", texto, items.length ? JSON.stringify(items.map(({ nombre, tipo, tam, texto: t }) => ({ nombre, tipo, tam, texto: t }))) : null);
          if (items.length) await registrarArchivos(u.id, items);
          const sources = formatSources(found);
          return new Response(
            flujoSSE(r.upstream, {
              inicio: [JSON.stringify({ conv: convId, titulo: conv ? conv.titulo : titulo, avisoCaducidad: textoAvisoCaducidad(plan.diasRestantes) })],
              final: sources || undefined,
              alTerminar: async (t) => {
                if (t.trim()) await guardarMensaje(convId, "assistant", t + sources, null);
              },
            }),
            { headers: SSE_HEADERS },
          );
        } catch (e) {
          console.error("[erp-chat] POST", e);
          return json({ error: "No se ha podido completar la consulta." }, 503);
        }
      },
    },
  },
});
