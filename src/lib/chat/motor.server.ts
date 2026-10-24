/** Llamada a la IA (con reintentos y modelo de reserva) y transmisión de la respuesta. La usan el chat público y el del ERP. */

export type Parte = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export type MensajeIA = { role: "user" | "assistant"; content: string | Parte[] };
export type ResultadoIA = { ok: true; upstream: Response } | { ok: false; status: number; mensaje: string };

export const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

const DEFAULT_MODEL = "grok-4.5";
const UPSTREAM_TIMEOUT_MS = 60_000;
const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function llamarIA(systemPrompt: string, mensajes: MensajeIA[]): Promise<ResultadoIA> {
  const apiKey = (process.env.AI_API_KEY ?? process.env.XAI_API_KEY)?.trim();
  if (!apiKey) {
    console.error("[chat] Falta AI_API_KEY (o XAI_API_KEY)");
    return { ok: false, status: 503, mensaje: "El asistente no está configurado todavía. Contacta con el administrador de la aplicación." };
  }
  const model = (process.env.AI_MODEL ?? process.env.XAI_MODEL)?.trim() || DEFAULT_MODEL;
  const baseUrl = (process.env.AI_BASE_URL?.trim() || "https://api.x.ai/v1").replace(/\/+$/, "");

  const reservas = [model];
  const modeloReserva = process.env.AI_FALLBACK_MODEL?.trim();
  if (modeloReserva && modeloReserva !== model) reservas.push(modeloReserva);
  const esGemini = baseUrl.includes("generativelanguage.googleapis.com");
  // Menos "pensar" antes de responder = empieza a escribir antes. Con Gemini, "low" por defecto.
  const esfuerzo = process.env.AI_REASONING_EFFORT?.trim() || (esGemini ? "low" : "");
  const maxTokens = Number(process.env.AI_MAX_TOKENS) || 4096;

  const llamar = (modelo: string, conEsfuerzo: boolean) =>
    fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: modelo,
        stream: true,
        temperature: 0.3,
        ...(conEsfuerzo && esfuerzo ? { reasoning_effort: esfuerzo } : {}),
        max_tokens: maxTokens,
        messages: [{ role: "system", content: systemPrompt }, ...mensajes],
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

  const esProblemaClave = (f: { status: number; detail: string }) =>
    f.status === 401 || f.status === 403 || (f.status === 400 && /api[ _]key/i.test(f.detail));

  let upstream: Response | null = null;
  let ultimo: { status: number; detail: string } | "red" | null = null;
  busqueda: for (const modelo of reservas) {
    let conEsfuerzo = true;
    let intentos = 0;
    while (intentos < 2) {
      intentos++;
      let res: Response;
      try {
        res = await llamar(modelo, conEsfuerzo);
      } catch (error) {
        console.error("[chat] Fallo de conexión con la IA", modelo, error);
        ultimo = "red";
        if (intentos < 2) await esperar(700);
        continue;
      }
      if (res.ok && res.body) {
        upstream = res;
        break busqueda;
      }
      const detail = await res.text().catch(() => "");
      console.error("[chat] La IA respondió", res.status, modelo, detail.slice(0, 400));
      ultimo = { status: res.status, detail };
      // Si el modelo no admite el ajuste de razonamiento, se reintenta sin él (no cuenta como intento)
      if (res.status === 400 && conEsfuerzo && esfuerzo && /reasoning|thinking/i.test(detail)) {
        conEsfuerzo = false;
        intentos--;
        continue;
      }
      if (res.status >= 500) {
        if (intentos < 2) await esperar(700);
        continue;
      }
      break; // 429, 404, 400, 401, 403: no se reintenta con este modelo
    }
    if (ultimo && ultimo !== "red" && esProblemaClave(ultimo)) break; // con la clave mal, el modelo de reserva tampoco sirve
  }

  if (upstream) return { ok: true, upstream };
  if (ultimo === "red" || ultimo === null) {
    return { ok: false, status: 502, mensaje: "No he podido conectar con el servicio de IA. Inténtalo de nuevo en unos minutos y, si es urgente, consulta la ficha técnica o al Colegio." };
  }
  if (esProblemaClave(ultimo)) {
    return { ok: false, status: 502, mensaje: `La clave del servicio de IA no es válida, ha caducado o no tiene permisos (código ${ultimo.status}). Revisa AI_API_KEY.` };
  }
  if (ultimo.status === 404) return { ok: false, status: 502, mensaje: "El modelo de IA configurado no existe (código 404). Revisa AI_MODEL." };
  if (ultimo.status === 429) return { ok: false, status: 429, mensaje: "Se ha alcanzado el límite de consultas del plan (código 429). Espera unos minutos o hasta mañana." };
  if (ultimo.status >= 500) {
    return { ok: false, status: 502, mensaje: `El servicio de IA sigue saturado tras reintentarlo automáticamente (código ${ultimo.status}). Inténtalo de nuevo en un minuto.` };
  }
  return { ok: false, status: 502, mensaje: `El servicio de IA ha rechazado la consulta (código ${ultimo.status}). Si se repite, revisa los registros del servidor.` };
}

/** Convierte la respuesta de la IA en el flujo de eventos de Nara. `alTerminar` recibe el texto completo (por ejemplo para guardarlo). */
export function flujoSSE(
  upstream: Response,
  opts: { inicio?: string[]; final?: string; alTerminar?: (texto: string, completo: boolean) => Promise<void> } = {},
): ReadableStream {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body!.getReader();
  const send = (c: ReadableStreamDefaultController, payload: string) => c.enqueue(encoder.encode(`data: ${payload}\n\n`));
  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      let texto = "";
      let completo = false;
      let cortada = false;
      try {
        for (const i of opts.inicio ?? []) send(controller, i);
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
              const json = JSON.parse(data) as { choices?: { delta?: { content?: string }; finish_reason?: string | null }[] };
              if (json.choices?.[0]?.finish_reason === "length") cortada = true;
              const token = json.choices?.[0]?.delta?.content;
              if (token) {
                texto += token;
                send(controller, JSON.stringify({ token }));
              }
            } catch {
              // líneas de keep-alive
            }
          }
        }
        completo = true;
        if (cortada) {
          const nota = "\n\n_(La respuesta se ha cortado por su longitud. Escribe «continúa» y sigo desde aquí.)_";
          texto += nota;
          send(controller, JSON.stringify({ token: nota }));
        }
        if (opts.final) send(controller, JSON.stringify({ token: opts.final }));
      } catch (error) {
        console.error("[chat] Error durante el streaming", error);
        const msg = texto ? "\n\n_(La respuesta se ha interrumpido. Vuelve a enviar la consulta.)_" : "No he podido completar la respuesta. Vuelve a enviar la consulta.";
        send(controller, JSON.stringify({ token: msg }));
      } finally {
        try {
          await opts.alTerminar?.(texto, completo);
        } catch (e) {
          console.error("[chat] Error al guardar la respuesta", e);
        }
        controller.close();
      }
    },
  });
}

/** Lee una respuesta completa (sin mostrarla): sirve, por ejemplo, para resumir conversaciones largas. */
export async function recogerTexto(upstream: Response): Promise<string> {
  const reader = upstream.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let texto = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const l of lines) {
      if (!l.trim().startsWith("data:")) continue;
      const d = l.trim().slice(5).trim();
      if (d === "[DONE]") continue;
      try {
        texto += (JSON.parse(d) as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta?.content ?? "";
      } catch {
        // keep-alive
      }
    }
  }
  return texto;
}
