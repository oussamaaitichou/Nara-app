import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, FileText, ImageIcon, Paperclip, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/lib/chat/markdown";
import { parseNaraPayload } from "@/lib/chat/parse";
import type { Perfil } from "./comun";

type Conv = { id: number; titulo: string; actualizado: string };
type Msg = { rol: "user" | "assistant"; contenido: string; adjuntos?: { nombre: string; tipo: string }[] };
type Adj = { nombre: string; datos: string; tipo: "imagen" | "documento"; tam: number };
type Config = { plan: "gratis" | "premium"; archivos: boolean; limite: number; usados: number; restantes: number; liberaA: string | null };

const MIME: Record<string, string> = {
  pdf: "application/pdf", csv: "text/csv", txt: "text/plain",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};
const MAX_BYTES = 3_000_000;
const hora = (iso: string) => new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

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

function leerArchivo(file: File, mime: string): Promise<string> {
  return new Promise((ok, ko) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).replace(/^data:[^;,]*/, `data:${mime}`));
    r.onerror = () => ko(new Error("lectura"));
    r.readAsDataURL(file);
  });
}

export function ChatErp({ onSesion }: { perfil: Perfil; onSesion: () => void }) {
  const [lista, setLista] = useState<Conv[]>([]);
  const [convId, setConvId] = useState<number | null>(null);
  const [mensajes, setMensajes] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [adj, setAdj] = useState<Adj[]>([]);
  const [cfg, setCfg] = useState<Config | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fin = useRef<HTMLDivElement>(null);

  const refrescar = useCallback(async () => {
    const [l, c] = await Promise.all([fetch("/api/erp-chat?r=conversaciones"), fetch("/api/erp-chat?r=config")]);
    if (l.status === 401) return onSesion();
    if (l.ok) setLista(((await l.json()) as { conversaciones: Conv[] }).conversaciones);
    if (c.ok) setCfg((await c.json()) as Config);
  }, [onSesion]);
  useEffect(() => void refrescar(), [refrescar]);
  useEffect(() => fin.current?.scrollIntoView({ behavior: "smooth" }), [mensajes]);

  async function abrir(id: number) {
    setError(null);
    const r = await fetch(`/api/erp-chat?r=conversacion&id=${id}`);
    if (!r.ok) return setError("No se ha podido abrir la conversación.");
    const j = (await r.json()) as { mensajes: { rol: "user" | "assistant"; contenido: string; adjuntos: { nombre: string; tipo: string }[] }[] };
    setConvId(id);
    setMensajes(j.mensajes);
  }
  function nueva() {
    setConvId(null);
    setMensajes([]);
    setError(null);
    setAdj([]);
  }
  async function borrar(id: number) {
    if (!window.confirm("¿Borrar esta conversación? No se puede deshacer.")) return;
    await fetch("/api/erp-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "borrar", id }) });
    if (id === convId) nueva();
    await refrescar();
  }

  async function adjuntar(files: FileList | null) {
    if (!files) return;
    setError(null);
    const nuevos: Adj[] = [];
    for (const f of Array.from(files)) {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      try {
        if (f.type.startsWith("image/") && /^image\/(png|jpeg|webp)$/.test(f.type)) {
          const d = await comprimirImagen(f);
          nuevos.push({ nombre: f.name.replace(/\.\w+$/, "") + ".jpg", datos: d, tipo: "imagen", tam: Math.round(d.length * 0.75) });
        } else if (MIME[ext]) {
          if (f.size > MAX_BYTES) {
            setError(`«${f.name}» pesa más de 3 MB.`);
            continue;
          }
          nuevos.push({ nombre: f.name, datos: await leerArchivo(f, MIME[ext]!), tipo: "documento", tam: f.size });
        } else setError(`«${f.name}»: tipo no admitido. Puedes subir imágenes (PNG, JPG, WebP), PDF, Word, Excel, CSV o TXT.`);
      } catch {
        setError(`No he podido leer «${f.name}».`);
      }
    }
    setAdj((a) => [...a, ...nuevos].slice(0, 8));
  }

  async function enviar(t?: string) {
    const q = (t ?? texto).trim();
    if ((!q && !adj.length) || enviando) return;
    setEnviando(true);
    setError(null);
    const subidos = adj;
    setMensajes((m) => [...m, { rol: "user", contenido: q, adjuntos: subidos.map((a) => ({ nombre: a.nombre, tipo: a.tipo })) }, { rol: "assistant", contenido: "" }]);
    setTexto("");
    setAdj([]);
    try {
      const res = await fetch("/api/erp-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "enviar", conversacionId: convId, texto: q, adjuntos: subidos.map(({ nombre, datos }) => ({ nombre, datos })) }),
      });
      if (!res.ok || !res.body) {
        if (res.status === 401) return onSesion();
        let msg = "No se ha podido enviar la consulta.";
        try {
          msg = ((await res.json()) as { error?: string }).error ?? msg;
        } catch {
          // sin cuerpo
        }
        setMensajes((m) => m.slice(0, -2));
        setTexto(q);
        setAdj(subidos);
        return setError(msg);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let acumulado = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lineas = buf.split("\n");
        buf = lineas.pop() ?? "";
        for (const l of lineas) {
          if (!l.startsWith("data: {")) continue;
          try {
            const d = JSON.parse(l.slice(6)) as { conv?: number; token?: string };
            if (d.conv) setConvId(d.conv);
            if (d.token) {
              acumulado += d.token;
              const copia = acumulado;
              setMensajes((m) => [...m.slice(0, -1), { rol: "assistant", contenido: copia }]);
            }
          } catch {
            // línea incompleta
          }
        }
      }
      await refrescar();
    } catch {
      setError("Se ha perdido la conexión. Vuelve a enviar la consulta.");
    } finally {
      setEnviando(false);
    }
  }

  const sinCuota = cfg && cfg.restantes <= 0;
  return (
    <div className="grid gap-4 md:grid-cols-[15rem_1fr]">
      <aside className="space-y-2">
        <Button className="w-full" variant="outline" onClick={nueva}><Plus className="size-4" /> Nueva conversación</Button>
        <ul className="max-h-48 space-y-1 overflow-y-auto md:max-h-[60vh]">
          {lista.map((c) => (
            <li key={c.id} className={`group flex items-center gap-1 rounded-md ${c.id === convId ? "bg-teal-mist" : "hover:bg-surface"}`}>
              <button type="button" onClick={() => void abrir(c.id)} className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm text-ink-soft">{c.titulo}</button>
              <button type="button" aria-label="Borrar conversación" onClick={() => void borrar(c.id)} className="px-1.5 text-subtle opacity-60 hover:text-danger hover:opacity-100"><Trash2 className="size-3.5" /></button>
            </li>
          ))}
          {lista.length === 0 ? <li className="px-2 text-sm text-subtle">Tus conversaciones se guardan aquí.</li> : null}
        </ul>
      </aside>

      <section className="flex min-h-[60vh] flex-col rounded-xl border border-line bg-surface">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {mensajes.length === 0 ? (
            <div className="space-y-2 py-8 text-center text-muted">
              <p className="font-display text-xl text-ink">Pregúntale a Nara</p>
              <p className="text-sm">Fiscal, laboral, normativa, gestión y compraventa de farmacias. Tus conversaciones quedan guardadas y no tienen límite de longitud.</p>
              <p className="text-xs text-subtle">No escribas datos de pacientes.</p>
            </div>
          ) : null}
          {mensajes.map((m, i) => {
            const p = m.rol === "assistant" ? parseNaraPayload(m.contenido) : null;
            const ultimo = i === mensajes.length - 1;
            return (
              <div key={i} className={m.rol === "user" ? "flex justify-end" : ""}>
                <div className={`max-w-[92%] rounded-xl px-4 py-3 text-sm ${m.rol === "user" ? "bg-teal text-white" : "border border-line bg-bg text-ink"}`}>
                  {m.adjuntos?.length ? <p className="mb-1 flex flex-wrap gap-2 text-xs opacity-90">{m.adjuntos.map((a) => <span key={a.nombre} className="inline-flex items-center gap-1 rounded bg-white/20 px-1.5 py-0.5">{a.tipo === "imagen" ? <ImageIcon className="size-3" /> : <FileText className="size-3" />}{a.nombre}</span>)}</p> : null}
                  {m.rol === "user" ? <p className="whitespace-pre-wrap">{m.contenido}</p> : p?.content ? <Markdown text={p.content} /> : enviando && ultimo ? <span className="text-muted">Nara está pensando…</span> : null}
                  {m.rol === "assistant" && ultimo && !enviando && p?.followUps.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">{p.followUps.map((f) => <button key={f} type="button" onClick={() => void enviar(f)} className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink-soft hover:border-teal">{f}</button>)}</div>
                  ) : null}
                </div>
              </div>
            );
          })}
          <div ref={fin} />
        </div>

        <div className="space-y-2 border-t border-line p-3">
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          {adj.length ? (
            <div className="flex flex-wrap gap-2">{adj.map((a, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-teal-mist px-2.5 py-1 text-xs text-teal-deep">
                {a.tipo === "imagen" ? <ImageIcon className="size-3" /> : <FileText className="size-3" />}{a.nombre}
                <button type="button" aria-label="Quitar archivo" onClick={() => setAdj((x) => x.filter((_, j) => j !== i))}><X className="size-3" /></button>
              </span>
            ))}</div>
          ) : null}
          <div className="flex items-end gap-2">
            {cfg?.archivos ? (
              <label className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-line text-ink-soft hover:border-teal" title="Adjuntar archivos o fotos">
                <Paperclip className="size-4" />
                <input type="file" multiple className="hidden" accept="image/png,image/jpeg,image/webp,.pdf,.csv,.txt,.docx,.xlsx" onChange={(e) => { void adjuntar(e.target.files); e.target.value = ""; }} />
              </label>
            ) : null}
            <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void enviar(); } }} rows={1} maxLength={4000} placeholder="Escribe tu consulta…" className="min-h-10 flex-1 resize-none text-sm" />
            <Button onClick={() => void enviar()} disabled={enviando || (!texto.trim() && !adj.length)} aria-label="Enviar"><ArrowUp className="size-4" /></Button>
          </div>
          {cfg?.archivos ? (
            <p className="text-xs text-subtle">
              {cfg.plan === "premium" ? "Plan Premium: uso ampliado y conversaciones sin fin." : `Archivos: te quedan ${cfg.restantes} de ${cfg.limite} cada 12 horas${sinCuota && cfg.liberaA ? ` (podrás subir más desde las ${hora(cfg.liberaA)})` : ""}.`} Word, Excel, PDF, CSV, TXT e imágenes, hasta 3 MB cada uno.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
