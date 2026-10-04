import { useState } from "react";
import { Check, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Fase = "inicial" | "comentando" | "enviando" | "enviado";

export function FeedbackButtons({
  pregunta,
  respuesta,
  onAccesoPerdido,
}: {
  pregunta: string;
  respuesta: string;
  onAccesoPerdido: () => void;
}) {
  const [fase, setFase] = useState<Fase>("inicial");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function enviar(valor: "util" | "incorrecta") {
    setFase("enviando");
    setError(null);
    try {
      const res = await fetch("/api/valoracion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor, pregunta, respuesta, comentario: valor === "incorrecta" ? comentario : "" }),
      });
      if (res.status === 401) {
        onAccesoPerdido();
        return;
      }
      if (!res.ok) throw new Error("fallo");
      setFase("enviado");
    } catch {
      setError("No se ha podido enviar. Inténtalo de nuevo.");
      setFase(valor === "incorrecta" ? "comentando" : "inicial");
    }
  }

  if (fase === "enviado") {
    return (
      <p className="flex items-center gap-1.5 pl-11 text-xs text-subtle">
        <Check className="size-3.5" /> Gracias, lo revisaremos.
      </p>
    );
  }

  return (
    <div className="space-y-2 pl-11">
      {fase === "comentando" || (fase === "enviando" && comentario) ? (
        <div className="space-y-2 rounded-lg border border-line bg-surface p-3">
          <p className="text-sm font-medium text-ink-soft">¿Qué falla en esta respuesta? (opcional)</p>
          <Textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Por ejemplo: el plazo no es correcto, falta la normativa de mi comunidad… Sin datos de pacientes."
            className="min-h-16 resize-none text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void enviar("incorrecta")} disabled={fase === "enviando"}>
              Enviar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setFase("inicial")} disabled={fase === "enviando"}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-subtle">
          <span>¿Te ha servido?</span>
          <button
            type="button"
            onClick={() => void enviar("util")}
            disabled={fase === "enviando"}
            className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-ink-soft hover:border-teal hover:text-teal-deep"
          >
            <ThumbsUp className="size-3.5" /> Útil
          </button>
          <button
            type="button"
            onClick={() => setFase("comentando")}
            disabled={fase === "enviando"}
            className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-ink-soft hover:border-danger hover:text-danger"
          >
            <ThumbsDown className="size-3.5" /> Incorrecta
          </button>
        </div>
      )}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
