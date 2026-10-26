import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AlertTriangle, ArrowUp, FileText, LogOut, Menu, Paperclip, Plus, ShieldAlert, Trash2, X } from "lucide-react";
import { NaraMark, NaraWordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AccessGate } from "@/components/chat/access-gate";
import { FeedbackButtons } from "@/components/chat/feedback-buttons";
import { Markdown } from "@/lib/chat/markdown";
import { TOPICS } from "@/lib/chat/knowledge";
import { parseNaraPayload, ESCALATE_COPY } from "@/lib/chat/parse";
import { selectActive, useChatStore } from "@/lib/chat/store";
import type { ChatMessage } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

type AdjuntoCliente = { nombre: string; datos: string };

async function streamNara(
  history: { role: "user" | "assistant"; content: string }[],
  onToken: (t: string) => void,
  adjuntos?: AdjuntoCliente[],
) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: history, adjuntos: adjuntos?.length ? adjuntos : undefined }),
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

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  csv: "text/csv",
  txt: "text/plain",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};
const MAX_BYTES = 3_000_000;

async function comprimirImagen(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ko(new Error("imagen"));
      i.src = url;
    });
    const k = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function leerDataUrl(file: File, mime: string): Promise<string> {
  return new Promise((ok, ko) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).replace(/^data:[^;,]*/, `data:${mime}`));
    r.onerror = () => ko(new Error("lectura"));
    r.readAsDataURL(file);
  });
}

function ConversationList({ onPick }: { onPick?: () => void }) {
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeId);
  const setActive = useChatStore((s) => s.setActive);
  const newConversation = useChatStore((s) => s.newConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);

  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <Button
          className="w-full"
          variant="outline"
          onClick={() => {
            newConversation();
            onPick?.();
          }}
        >
          <Plus className="size-4" />
          Nueva consulta
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <p className="px-2 pb-2 text-xs font-medium tracking-wide text-subtle uppercase">Recientes</p>
        {conversations.length === 0 ? (
          <p className="px-2 text-sm text-muted">Aún no hay consultas en este dispositivo.</p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((c) => (
              <li key={c.id} className="group relative">
                <button
                  type="button"
                  onClick={() => {
                    setActive(c.id);
                    onPick?.();
                  }}
                  className={cn(
                    "w-full rounded-md px-3 py-2.5 pr-10 text-left text-sm leading-snug",
                    c.id === activeId ? "bg-teal-mist text-teal-deep" : "text-ink-soft hover:bg-surface-2",
                  )}
                >
                  <span className="line-clamp-2">{c.title}</span>
                </button>
                <button
                  type="button"
                  aria-label="Eliminar consulta"
                  className="absolute top-1.5 right-1.5 inline-flex size-8 items-center justify-center rounded-sm text-subtle hover:bg-danger-soft hover:text-danger sm:opacity-0 sm:group-hover:opacity-100"
                  onClick={() => deleteConversation(c.id)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message, streaming }: { message: ChatMessage; streaming?: boolean }) {
  const isUser = message.role === "user";
  const escalate = message.escalate ? ESCALATE_COPY[message.escalate] : null;

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && <NaraMark className="mt-1 size-8 shrink-0" />}
      <div
        className={cn(
          "max-w-[min(100%,40rem)] rounded-xl px-4 py-3",
          isUser
            ? "rounded-br-sm bg-teal text-primary-foreground"
            : "rounded-bl-sm bg-surface text-ink shadow-[var(--shadow-soft)] ring-1 ring-line",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <>
            {streaming && !message.content ? (
              <span className="mr-2 text-sm text-muted">Nara está pensando…</span>
            ) : null}
            {message.content ? <Markdown text={message.content} /> : null}
            {streaming ? (
              <span className="mt-1 inline-block h-4 w-1.5 rounded-xs bg-teal align-middle animate-[nara-caret_1s_steps(1)_infinite]" />
            ) : null}
            {escalate ? (
              <div className="mt-3 flex gap-2 rounded-md bg-warn-soft px-3 py-2 text-sm text-warn">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">{escalate.label}</p>
                  <p className="text-[0.92em] opacity-90">{escalate.hint}</p>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

type EstadoAcceso = {
  cargando: boolean;
  requerido: boolean;
  autenticado: boolean;
  restantes?: number;
  limite?: number;
};

export function ChatApp({
  initialQuestion,
  initialTopic,
}: {
  initialQuestion?: string;
  initialTopic?: string;
}) {
  const active = useChatStore(selectActive);
  const ensureActive = useChatStore((s) => s.ensureActive);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const patchMessage = useChatStore((s) => s.patchMessage);

  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [acceso, setAcceso] = useState<EstadoAcceso>({ cargando: true, requerido: false, autenticado: true });
  const [adjuntos, setAdjuntos] = useState<{ nombre: string; datos: string; tipo: string }[]>([]);
  const [archivosOk, setArchivosOk] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const topic = useMemo(
    () => TOPICS.find((t) => t.id === initialTopic) ?? null,
    [initialTopic],
  );

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
      // sin conexión: se mantiene el estado anterior
      setAcceso((a) => ({ ...a, cargando: false }));
    }
  }

  async function salir() {
    await fetch("/api/acceso", { method: "DELETE" }).catch(() => undefined);
    await refrescarAcceso();
  }

  useEffect(() => {
    void refrescarAcceso();
    void fetch("/api/chat")
      .then((r) => r.json())
      .then((j: { archivos?: boolean }) => setArchivosOk(!!j.archivos))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let alive = true;
    const done = () => {
      if (alive) setHydrated(true);
    };
    const result = useChatStore.persist.rehydrate();
    if (result && typeof result.then === "function") {
      void result.then(done, done);
    } else {
      done();
    }
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (seeded.current) return;
    if (initialQuestion?.trim()) {
      seeded.current = true;
      setDraft(initialQuestion);
    }
  }, [initialQuestion]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [active?.messages, busy]);

  async function adjuntar(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const nuevos: { nombre: string; datos: string; tipo: string }[] = [];
    for (const file of Array.from(files).slice(0, 8 - adjuntos.length)) {
      if (file.size > MAX_BYTES) {
        setError(`«${file.name}» pesa más de 3 MB.`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      let mime = file.type || MIME[ext] || "";
      if (ext && MIME[ext]) mime = MIME[ext];
      try {
        let datos: string;
        if (/^image\/(png|jpeg|webp)$/.test(mime) || /^(png|jpe?g|webp)$/.test(ext)) {
          datos = await comprimirImagen(file);
          mime = "image/jpeg";
        } else {
          datos = await leerDataUrl(file, mime || "application/octet-stream");
        }
        nuevos.push({ nombre: file.name.slice(0, 120), datos, tipo: mime.startsWith("image/") ? "imagen" : "documento" });
      } catch {
        setError(`No se ha podido leer «${file.name}».`);
      }
    }
    if (nuevos.length) setAdjuntos((a) => [...a, ...nuevos].slice(0, 8));
  }

  async function send(text: string) {
    const content = text.trim();
    const pendientes = adjuntos;
    if ((!content && !pendientes.length) || busy || !hydrated) return;
    setError(null);
    setDraft("");
    setAdjuntos([]);
    const conversationId = ensureActive();
    const etiquetaAdj =
      pendientes.length > 0
        ? (content ? `${content}\n\n` : "") + pendientes.map((a) => `[Adjunto: ${a.nombre}]`).join(" ")
        : content;
    appendMessage(conversationId, { role: "user", content: etiquetaAdj || "Archivos adjuntos" });
    const assistantId = appendMessage(conversationId, { role: "assistant", content: "" });
    setBusy(true);

    const conv = useChatStore.getState().conversations.find((c) => c.id === conversationId);
    const history = (conv?.messages ?? [])
      .filter((m) => m.id !== assistantId && m.content && !m.error)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    // El último user ya incluye la etiqueta; el API recibe el texto limpio + adjuntos
    if (history.length && history[history.length - 1]?.role === "user") {
      history[history.length - 1] = { role: "user", content: content || "Analiza los archivos adjuntos." };
    }

    let raw = "";
    let shown = 0;
    const reveal = () => {
      const pendiente = raw.length - shown;
      if (pendiente <= 0) return;
      shown += Math.min(pendiente, Math.max(3, Math.min(40, Math.ceil(pendiente / 10))));
      const parsed = parseNaraPayload(raw.slice(0, shown));
      patchMessage(conversationId, assistantId, {
        content: parsed.content,
        followUps: parsed.followUps,
        escalate: parsed.escalate,
      });
    };
    const timer = setInterval(reveal, 25);
    try {
      await streamNara(
        history,
        (token) => {
          raw += token;
        },
        pendientes.map((a) => ({ nombre: a.nombre, datos: a.datos })),
      );
      // esperar a que termine de escribirse lo que queda pendiente
      await new Promise<void>((resolve) => {
        const espera = setInterval(() => {
          if (shown >= raw.length) {
            clearInterval(espera);
            resolve();
          }
        }, 25);
      });
      const parsed = parseNaraPayload(raw);
      patchMessage(conversationId, assistantId, {
        content: parsed.content || "No he podido completar la respuesta. Prueba a reformular.",
        followUps: parsed.followUps,
        escalate: parsed.escalate,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nara no ha podido responder.";
      setError(message);
      patchMessage(conversationId, assistantId, { content: message, error: true });
      if ((err as { status?: number }).status === 401) void refrescarAcceso();
    } finally {
      clearInterval(timer);
      setBusy(false);
      void refrescarAcceso();
      textareaRef.current?.focus();
    }
  }

  const lastAssistant = [...(active?.messages ?? [])].reverse().find((m) => m.role === "assistant");
  const empty = !active || active.messages.length === 0;
  const starters = topic?.starters ?? TOPICS.flatMap((t) => t.starters.slice(0, 1)).slice(0, 6);

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(draft);
    }
  }

  if (acceso.cargando) {
    return <div className="flex min-h-dvh items-center justify-center bg-bg" aria-busy="true" />;
  }
  if (acceso.requerido && !acceso.autenticado) {
    return <AccessGate onSuccess={() => void refrescarAcceso()} />;
  }

  return (
    <div className="flex h-dvh min-h-0 bg-bg">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="flex h-16 items-center border-b border-line px-4">
          <NaraWordmark />
        </div>
        {hydrated ? <ConversationList /> : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/90 px-3 backdrop-blur-sm sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Consultas">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Consultas</SheetTitle>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-hidden">
                  {hydrated ? <ConversationList onPick={() => setSheetOpen(false)} /> : null}
                </div>
              </SheetContent>
            </Sheet>
            <div className="min-w-0 md:hidden">
              <NaraWordmark />
            </div>
            <p className="hidden truncate text-sm text-muted md:block">
              Asesora de oficina de farmacia · orientación profesional
            </p>
          </div>
          <div className="flex items-center gap-1">
            {acceso.requerido && acceso.autenticado && acceso.restantes !== undefined ? (
              <span className="hidden text-xs text-muted sm:inline">
                {acceso.restantes} de {acceso.limite} consultas hoy
              </span>
            ) : null}
            {acceso.requerido && acceso.autenticado ? (
              <Button variant="ghost" size="sm" onClick={() => void salir()} aria-label="Salir">
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" asChild>
              <a href="/valorar">Valorar farmacia</a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/">Inicio</a>
            </Button>
          </div>
        </header>

        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
          {empty ? (
            <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10 sm:py-14">
              <div className="space-y-3">
                <NaraMark className="size-12" />
                <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                  {topic ? topic.title : "¿Qué te está pasando en el mostrador?"}
                </h1>
                <p className="max-w-xl text-muted">
                  {topic
                    ? topic.blurb
                    : "Receta, sustitución, guardia, inspección o una interacción rara. Cuéntalo como a una compañera de turno."}
                </p>
              </div>
              <div className="flex gap-2 rounded-lg bg-warn-soft px-3 py-2.5 text-sm text-warn">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                <p>
                  <span className="font-medium">No escribas datos de pacientes</span> (nombre, DNI, CIP, historia clínica).
                  Describe el caso de forma anónima: edad, medicación y tipo de receta.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {starters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    disabled={busy || !hydrated}
                    className="rounded-lg border border-line bg-surface px-4 py-3 text-left text-sm leading-snug text-ink-soft shadow-[var(--shadow-soft)] transition-colors hover:border-teal hover:text-teal-deep"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
              {active.messages.map((m, idx) => {
                const streamingMsg = busy && idx === active.messages.length - 1 && m.role === "assistant";
                const pregunta =
                  [...active.messages.slice(0, idx)].reverse().find((x) => x.role === "user")?.content ?? "";
                const valorable =
                  acceso.requerido && acceso.autenticado && m.role === "assistant" && !streamingMsg && !m.error && !!m.content && !!pregunta;
                return (
                  <div key={m.id} className="flex flex-col gap-2">
                    <MessageBubble message={m} streaming={streamingMsg} />
                    {valorable ? (
                      <FeedbackButtons pregunta={pregunta} respuesta={m.content} onAccesoPerdido={() => void refrescarAcceso()} />
                    ) : null}
                  </div>
                );
              })}
              {lastAssistant && !busy && lastAssistant.followUps && lastAssistant.followUps.length > 0 ? (
                <div className="flex flex-wrap gap-2 pl-11">
                  {lastAssistant.followUps.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void send(q)}
                      className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft hover:border-teal hover:text-teal-deep"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="border-t border-line bg-surface px-3 py-3 sm:px-5">
          {adjuntos.length > 0 ? (
            <div className="mx-auto mb-2 flex max-w-3xl flex-wrap gap-2">
              {adjuntos.map((a, i) => (
                <span
                  key={`${a.nombre}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-bg px-2 py-1 text-xs text-ink-soft"
                >
                  {a.tipo === "imagen" ? (
                    <span className="text-teal">img</span>
                  ) : (
                    <FileText className="size-3 text-teal" />
                  )}
                  <span className="max-w-[10rem] truncate">{a.nombre}</span>
                  <button
                    type="button"
                    aria-label="Quitar archivo"
                    className="text-subtle hover:text-danger"
                    onClick={() => setAdjuntos((x) => x.filter((_, j) => j !== i))}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <form
            className="mx-auto flex max-w-3xl items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(draft);
            }}
          >
            {archivosOk ? (
              <label
                className="inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md border border-line text-ink-soft hover:border-teal hover:text-teal"
                title="Adjuntar PDF, Excel, Word, imagen…"
              >
                <Paperclip className="size-5" />
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/png,image/jpeg,image/webp,.pdf,.csv,.txt,.docx,.xlsx"
                  onChange={(e) => {
                    void adjuntar(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            ) : null}
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                archivosOk
                  ? "Escribe el caso o adjunta PDF/Excel… Enter para enviar"
                  : "Escribe el caso… Enter para enviar"
              }
              rows={1}
              className="min-h-12 max-h-40 resize-none py-3"
              disabled={busy}
              maxLength={4000}
            />
            <Button
              type="submit"
              size="icon"
              disabled={busy || (!draft.trim() && adjuntos.length === 0)}
              aria-label="Enviar consulta"
            >
              <ArrowUp className="size-5" />
            </Button>
          </form>
          {error ? <p className="mx-auto mt-2 max-w-3xl text-sm text-danger">{error}</p> : null}
          <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-subtle">
            Orientación profesional. Contrasta ficha técnica, nomenclátor y normativa de tu CCAA. No escribas datos de
            pacientes
            {archivosOk
              ? ". Puedes adjuntar PDF, Word, Excel de ventas/stock, CSV o imágenes (máx. 3 MB)."
              : "."}
          </p>
        </div>
      </div>
    </div>
  );
}
