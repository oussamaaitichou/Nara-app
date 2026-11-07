import { useEffect, useRef, useState } from "react";
import { ArrowUp, FileText, Image as ImageIcon, Paperclip, X } from "lucide-react";
import { NaraMark, NaraWordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AccessGate } from "@/components/chat/access-gate";
import { Markdown } from "@/lib/chat/markdown";
import { TOPICS } from "@/lib/chat/knowledge";
import { parseNaraPayload } from "@/lib/chat/parse";
import { selectActive, useChatStore } from "@/lib/chat/store";
import { formatNaragestContext } from "@/lib/naragest/chat-context";
import { cn } from "@/lib/utils";

type AdjuntoLocal = { id: string; nombre: string; datos: string; esImagen: boolean };

const ACCEPT =
  "image/png,image/jpeg,image/webp,application/pdf,.docx,.xlsx,.csv,text/plain,text/csv";
const MAX_FILES = 8;
const MAX_FILE_BYTES = 3_000_000;

function leerArchivo(file: File): Promise<AdjuntoLocal> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_BYTES) {
      reject(new Error(`«${file.name}» pesa más de 3 MB.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const datos = String(reader.result ?? "");
      if (!datos.startsWith("data:")) {
        reject(new Error(`No se ha podido leer «${file.name}».`));
        return;
      }
      resolve({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        nombre: file.name,
        datos,
        esImagen: file.type.startsWith("image/"),
      });
    };
    reader.onerror = () => reject(new Error(`No se ha podido leer «${file.name}».`));
    reader.readAsDataURL(file);
  });
}

async function streamNara(
  history: { role: "user" | "assistant"; content: string }[],
  adjuntos: { nombre: string; datos: string }[],
  onToken: (t: string) => void,
) {
  let naragestSnapshot = "";
  try {
    naragestSnapshot = formatNaragestContext(new Date());
  } catch {
    naragestSnapshot = "";
  }

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: history,
      naragestSnapshot,
      adjuntos: adjuntos.length ? adjuntos : undefined,
    }),
  });
  if (!res.ok) {
    let message = "Nara no ha podido responder.";
    try {
      const json = (await res.json()) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      // keep default
    }
    throw Object.assign(new Error(message), { status: res.status });
  }
  if (!res.body) throw new Error("Nara no ha podido responder.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data) as { token?: string };
        if (json.token) onToken(json.token);
      } catch {
        // ignore
      }
    }
  }
}

const BUSINESS_STARTERS = [
  "¿Cómo está funcionando mi farmacia?",
  "¿Qué debería revisar hoy en el stock?",
  "¿Dónde estoy perdiendo margen?",
  "¿Qué pedidos tengo pendientes?",
];

export function ChatApp({ initialQuestion }: { initialQuestion?: string; initialTopic?: string }) {
  const active = useChatStore(selectActive);
  const ensureActive = useChatStore((s) => s.ensureActive);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const patchMessage = useChatStore((s) => s.patchMessage);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<AdjuntoLocal[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [acceso, setAcceso] = useState({
    cargando: true,
    requerido: false,
    autenticado: true as boolean,
    restantes: undefined as number | undefined,
    limite: undefined as number | undefined,
  });
  const scroller = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bootstrapped = useRef(false);

  async function refrescarAcceso() {
    try {
      const res = await fetch("/api/acceso");
      const json = (await res.json()) as {
        accesoActivo?: boolean;
        autenticado?: boolean;
        restantes?: number;
        limite?: number;
      };
      setAcceso({
        cargando: false,
        requerido: !!json.accesoActivo,
        autenticado: json.accesoActivo ? !!json.autenticado : true,
        restantes: json.restantes,
        limite: json.limite,
      });
    } catch {
      setAcceso((a) => ({ ...a, cargando: false }));
    }
  }

  useEffect(() => {
    void refrescarAcceso();
  }, []);
  useEffect(() => {
    let alive = true;
    const done = () => {
      if (alive) setHydrated(true);
    };
    const result = useChatStore.persist.rehydrate();
    if (result && typeof (result as Promise<void>).then === "function") void (result as Promise<void>).then(done, done);
    else done();
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [active?.messages, busy, pending]);

  async function onPickFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    const room = MAX_FILES - pending.length;
    if (room <= 0) {
      setError(`Máximo ${MAX_FILES} archivos por mensaje.`);
      return;
    }
    const files = Array.from(list).slice(0, room);
    try {
      const leidos = await Promise.all(files.map(leerArchivo));
      setPending((p) => [...p, ...leidos].slice(0, MAX_FILES));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se han podido leer los archivos.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function send(text: string, files = pending) {
    const content = text.trim();
    if ((!content && files.length === 0) || busy || !hydrated) return;
    setError(null);
    setDraft("");
    setPending([]);
    const conversationId = ensureActive();
    const label =
      content ||
      (files.length === 1
        ? `📎 ${files[0]!.nombre}`
        : `📎 ${files.length} archivos`);
    const userShown =
      files.length && content
        ? `${content}\n\n(${files.length === 1 ? files[0]!.nombre : `${files.length} archivos adjuntos`})`
        : label;
    appendMessage(conversationId, { role: "user", content: userShown });
    const assistantId = appendMessage(conversationId, { role: "assistant", content: "" });
    setBusy(true);
    const conv = useChatStore.getState().conversations.find((c) => c.id === conversationId);
    const history = (conv?.messages ?? [])
      .filter((m) => m.id !== assistantId && m.content && !m.error)
      .map((m) => ({ role: m.role, content: m.content }));
    if (history.length) {
      history[history.length - 1] = {
        role: "user",
        content: content || "Analiza el archivo adjunto en contexto de oficina de farmacia.",
      };
    }
    let raw = "";
    try {
      await streamNara(
        history,
        files.map((f) => ({ nombre: f.nombre, datos: f.datos })),
        (token) => {
          raw += token;
          const parsed = parseNaraPayload(raw);
          patchMessage(conversationId, assistantId, {
            content: parsed.content,
            followUps: parsed.followUps,
            escalate: parsed.escalate,
          });
        },
      );
      const parsed = parseNaraPayload(raw);
      patchMessage(conversationId, assistantId, {
        content: parsed.content || "No he podido completar la respuesta.",
        followUps: parsed.followUps,
        escalate: parsed.escalate,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nara no ha podido responder.";
      setError(message);
      patchMessage(conversationId, assistantId, { content: message, error: true });
      if ((err as { status?: number }).status === 401) void refrescarAcceso();
    } finally {
      setBusy(false);
      void refrescarAcceso();
      textareaRef.current?.focus();
    }
  }

  useEffect(() => {
    if (!hydrated || bootstrapped.current || !initialQuestion?.trim()) return;
    bootstrapped.current = true;
    void send(initialQuestion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, initialQuestion]);

  if (acceso.cargando) {
    return <div className="flex min-h-dvh items-center justify-center bg-[#F4F0E8]" aria-busy="true" />;
  }
  if (acceso.requerido && !acceso.autenticado) return <AccessGate onSuccess={() => void refrescarAcceso()} />;

  const empty = !active || active.messages.length === 0;
  const topicStarters = TOPICS.flatMap((t) => t.starters.slice(0, 1)).slice(0, 4);
  const starters = [...BUSINESS_STARTERS, ...topicStarters].slice(0, 8);
  const canSend = !busy && hydrated && (!!draft.trim() || pending.length > 0);

  return (
    <div className="flex h-dvh min-h-0 bg-[#F4F0E8] text-[#1A2320]">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-15 items-center justify-between gap-3 border-b border-[#D9D1C3] bg-[#FFFDF8]/95 px-3 backdrop-blur-md sm:px-5">
          <div className="flex items-center gap-3">
            <NaraWordmark />
            <span className="hidden rounded-full bg-[#EEF5F1] px-2.5 py-0.5 text-[11px] font-medium text-[#1B5C4E] sm:inline">
              Asistente
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <a
              href="/panel"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-[#5C6B64] transition hover:bg-[#EEF5F1] hover:text-[#1B5C4E]"
            >
              Panel
            </a>
            <a
              href="/"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-[#5C6B64] transition hover:bg-[#EBE4D6] hover:text-[#1A2320]"
            >
              Inicio
            </a>
          </div>
        </header>

        <div
          ref={scroller}
          className="min-h-0 flex-1 overflow-y-auto"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, #EEF5F1 0%, transparent 55%), #F4F0E8",
          }}
        >
          {empty ? (
            <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#EEF5F1] ring-1 ring-[#DCEAE4]">
                <NaraMark className="size-9" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-[#1A2320]">
                  ¿En qué te ayudo hoy?
                </h1>
                <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-[#5C6B64]">
                  Gestión, stock, márgenes o mostrador. Puedes adjuntar fotos o documentos con el clip. Cada consulta
                  puede usar el snapshot de NaraGest de este navegador.
                </p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {starters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    disabled={busy || !hydrated}
                    className="rounded-2xl border border-[#D9D1C3] bg-[#FFFDF8] px-4 py-3.5 text-left text-sm text-[#2C3833] shadow-[0_1px_2px_rgb(26_35_32/0.04)] transition hover:border-[#1B5C4E]/35 hover:bg-[#EEF5F1]/60 hover:text-[#123F36]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
              {active.messages.map((m) => (
                <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
                  {m.role !== "user" ? (
                    <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#EEF5F1] ring-1 ring-[#DCEAE4]">
                      <NaraMark className="size-5" />
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      "max-w-[min(100%,40rem)] px-4 py-3 text-[15px] leading-relaxed",
                      m.role === "user"
                        ? "rounded-2xl rounded-br-md bg-[#1B5C4E] text-[#F4F0E8] shadow-sm"
                        : "rounded-2xl rounded-bl-md border border-[#D9D1C3] bg-[#FFFDF8] text-[#1A2320] shadow-[0_1px_2px_rgb(26_35_32/0.04)]",
                      m.error && m.role !== "user" ? "border-[#E8C9C4] bg-[#FBF4F2] text-[#8F2D2D]" : null,
                    )}
                  >
                    {m.role === "user" ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <div className="prose-chat">
                        <Markdown text={m.content} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {busy ? (
                <p className="pl-11 text-sm text-[#7A877F]">Nara está pensando…</p>
              ) : null}
            </div>
          )}
        </div>

        <div className="border-t border-[#D9D1C3] bg-[#FFFDF8]/95 px-3 py-3 backdrop-blur-md sm:px-5">
          {pending.length > 0 ? (
            <div className="mx-auto mb-2.5 flex max-w-3xl flex-wrap gap-2">
              {pending.map((f) => (
                <span
                  key={f.id}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#DCEAE4] bg-[#EEF5F1] px-2.5 py-1 text-xs text-[#123F36]"
                >
                  {f.esImagen ? <ImageIcon className="size-3.5 shrink-0" /> : <FileText className="size-3.5 shrink-0" />}
                  <span className="truncate">{f.nombre}</span>
                  <button
                    type="button"
                    className="rounded-full p-0.5 text-[#5C6B64] hover:bg-[#DCEAE4] hover:text-[#1A2320]"
                    aria-label={`Quitar ${f.nombre}`}
                    onClick={() => setPending((p) => p.filter((x) => x.id !== f.id))}
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <form
            className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-[#D9D1C3] bg-[#F8F3EA] p-2 shadow-[0_1px_2px_rgb(26_35_32/0.04)]"
            onSubmit={(e) => {
              e.preventDefault();
              void send(draft);
            }}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept={ACCEPT}
              multiple
              onChange={(e) => void onPickFiles(e.target.files)}
            />
            <button
              type="button"
              disabled={busy || pending.length >= MAX_FILES}
              aria-label="Adjuntar archivo o foto"
              title="Fotos, PDF, Word, Excel, CSV o TXT (máx. 3 MB c/u)"
              onClick={() => fileRef.current?.click()}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-[#1B5C4E] transition hover:bg-[#EEF5F1] disabled:opacity-40"
            >
              <Paperclip className="size-5" />
            </button>
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(draft);
                }
              }}
              placeholder="Escribe o adjunta un archivo…"
              rows={1}
              className="min-h-11 max-h-40 flex-1 resize-none border-0 bg-transparent py-2.5 text-[15px] text-[#1A2320] shadow-none focus-visible:ring-0"
              disabled={busy}
              maxLength={4000}
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Enviar"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#1B5C4E] text-[#F4F0E8] transition hover:bg-[#123F36] disabled:opacity-40"
            >
              <ArrowUp className="size-5" />
            </button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-[#7A877F]">
            PNG, JPG, WebP, PDF, Word, Excel, CSV · máx. {MAX_FILES} archivos · 3 MB c/u · sin datos de pacientes
          </p>
          {error ? <p className="mx-auto mt-2 max-w-3xl text-center text-sm text-[#8F2D2D]">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
