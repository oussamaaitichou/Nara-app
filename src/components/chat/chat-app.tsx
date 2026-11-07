import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
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

async function streamNara(
  history: { role: "user" | "assistant"; content: string }[],
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
    body: JSON.stringify({ messages: history, naragestSnapshot }),
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
  }, [active?.messages, busy]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy || !hydrated) return;
    setError(null);
    setDraft("");
    const conversationId = ensureActive();
    appendMessage(conversationId, { role: "user", content });
    const assistantId = appendMessage(conversationId, { role: "assistant", content: "" });
    setBusy(true);
    const conv = useChatStore.getState().conversations.find((c) => c.id === conversationId);
    const history = (conv?.messages ?? [])
      .filter((m) => m.id !== assistantId && m.content && !m.error)
      .map((m) => ({ role: m.role, content: m.content }));
    let raw = "";
    try {
      await streamNara(history, (token) => {
        raw += token;
        const parsed = parseNaraPayload(raw);
        patchMessage(conversationId, assistantId, {
          content: parsed.content,
          followUps: parsed.followUps,
          escalate: parsed.escalate,
        });
      });
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

  if (acceso.cargando) return <div className="flex min-h-dvh items-center justify-center bg-bg" aria-busy="true" />;
  if (acceso.requerido && !acceso.autenticado) return <AccessGate onSuccess={() => void refrescarAcceso()} />;

  const empty = !active || active.messages.length === 0;
  const topicStarters = TOPICS.flatMap((t) => t.starters.slice(0, 1)).slice(0, 4);
  const starters = [...BUSINESS_STARTERS, ...topicStarters].slice(0, 8);

  return (
    <div className="flex h-dvh min-h-0 bg-bg">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/90 px-3 sm:px-5">
          <NaraWordmark />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a href="/panel">Panel</a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/">Inicio</a>
            </Button>
          </div>
        </header>
        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
          {empty ? (
            <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
              <NaraMark className="size-12" />
              <h1 className="font-display text-3xl font-semibold text-ink">¿En qué te ayudo hoy?</h1>
              <p className="text-muted">
                Gestión, stock, márgenes o mostrador. Cada consulta lleva el snapshot de NaraGest de este navegador
                (compras, ventas, márgenes y alertas de stock).
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {starters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    disabled={busy || !hydrated}
                    className="rounded-lg border border-line bg-surface px-4 py-3 text-left text-sm hover:border-teal"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
              {active.messages.map((m) => (
                <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
                  {m.role !== "user" && <NaraMark className="mt-1 size-8 shrink-0" />}
                  <div
                    className={cn(
                      "max-w-[min(100%,40rem)] rounded-xl px-4 py-3",
                      m.role === "user" ? "bg-teal text-primary-foreground" : "bg-surface ring-1 ring-line",
                    )}
                  >
                    {m.role === "user" ? <p className="whitespace-pre-wrap">{m.content}</p> : <Markdown text={m.content} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-line bg-surface px-3 py-3 sm:px-5">
          <form
            className="mx-auto flex max-w-3xl items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(draft);
            }}
          >
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
              placeholder="Escribe el caso… Enter para enviar"
              rows={1}
              className="min-h-12 max-h-40 resize-none py-3"
              disabled={busy}
              maxLength={4000}
            />
            <Button type="submit" size="icon" disabled={busy || !draft.trim()} aria-label="Enviar">
              <ArrowUp className="size-5" />
            </Button>
          </form>
          {error ? <p className="mx-auto mt-2 max-w-3xl text-sm text-danger">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
