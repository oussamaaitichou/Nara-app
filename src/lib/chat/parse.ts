import type { EscalateTo } from "./types";

const FENCE = /:::nara\s*([\s\S]*?):::/i;

const ESCALATE: EscalateTo[] = ["colegio", "aemps", "medico", "inspeccion", "titular"];

export function parseNaraPayload(raw: string): {
  content: string;
  followUps: string[];
  escalate: EscalateTo;
} {
  const match = raw.match(FENCE);
  if (!match) {
    return { content: raw.trim(), followUps: [], escalate: null };
  }

  let followUps: string[] = [];
  let escalate: EscalateTo = null;
  try {
    const json = JSON.parse(match[1] ?? "{}") as {
      followUps?: unknown;
      escalate?: unknown;
    };
    if (Array.isArray(json.followUps)) {
      followUps = json.followUps.filter((x): x is string => typeof x === "string").slice(0, 3);
    }
    if (typeof json.escalate === "string" && (ESCALATE as string[]).includes(json.escalate)) {
      escalate = json.escalate as Exclude<EscalateTo, null>;
    }
  } catch {
    // keep empty meta
  }

  return {
    content: raw.replace(FENCE, "").trim(),
    followUps,
    escalate,
  };
}

export const ESCALATE_COPY: Record<Exclude<EscalateTo, null>, { label: string; hint: string }> = {
  colegio: {
    label: "Derivar al Colegio",
    hint: "Este caso pide criterio colegial o asesoría jurídica sanitaria.",
  },
  aemps: {
    label: "Contrastar con AEMPS",
    hint: "Retirada, calidad, ficha técnica o farmacovigilancia de agencia.",
  },
  medico: {
    label: "Hablar con el prescriptor",
    hint: "Hace falta criterio clínico o una receta nueva, no solo el mostrador.",
  },
  inspeccion: {
    label: "Revisar con inspección",
    hint: "Puede haber un requisito de ordenación o un expediente administrativo.",
  },
  titular: {
    label: "Decisión del titular",
    hint: "Organización, personal o responsabilidad de la oficina, no solo del turno.",
  },
};
