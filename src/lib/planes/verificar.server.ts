/**
 * Filtro de plan en el servidor.
 * Se ejecuta ANTES de llamar a Gemini y de consumir cuota.
 *
 * Comportamiento:
 * - Si existe suscripción en nara_suscripciones → aplica sus límites y fechas.
 * - Si no existe (caso actual de todos los usuarios) → usa el plan de la
 *   asesoría (erp_asesorias.plan) + PLANES hardcodeados. Nada se rompe.
 * - Si la suscripción está caducada/pausada → bloquea con mensaje claro.
 * - Aviso de caducidad en los últimos 3 días (solo informativo).
 */
import type { UsuarioCtx } from "@/lib/erp/db.server";
import { PLANES, type Plan } from "@/lib/erp/planes";
import {
  caducarVencidas,
  contarMensajesHoy,
  suscripcionActiva,
  type PlanConfig,
  type SuscripcionFila,
} from "./db.server";

export type ResultadoPlan =
  | {
      ok: true;
      planId: string;
      mensajesDia: number;
      archivos12h: number;
      diasRestantes: number | null;
      avisoCaducidad: boolean; // true si quedan ≤ 3 días
      origen: "suscripcion" | "legacy";
    }
  | {
      ok: false;
      motivo: "caducada" | "pausada" | "cancelada" | "limite_mensajes";
      mensaje: string;
      diasRestantes?: number;
    };

const MS_DIA = 24 * 60 * 60 * 1000;

function limitesDesdeConfig(
  config: PlanConfig,
  fallbackPlan: Plan,
): { mensajesDia: number; archivos12h: number } {
  const fb = PLANES[fallbackPlan] ?? PLANES.gratis;
  return {
    mensajesDia:
      typeof config.mensajes_dia === "number" && config.mensajes_dia > 0
        ? config.mensajes_dia
        : fb.mensajesDia,
    archivos12h:
      typeof config.archivos_12h === "number" && config.archivos_12h >= 0
        ? config.archivos_12h
        : fb.archivos12h,
  };
}

function diasHasta(endsAt: string | null): number | null {
  if (!endsAt) return null;
  const fin = new Date(endsAt).getTime();
  if (Number.isNaN(fin)) return null;
  return Math.ceil((fin - Date.now()) / MS_DIA);
}

function mensajeCaducada(): string {
  return "Tu prueba ha terminado, solicita tu plan.";
}

function mensajePausada(): string {
  return "Tu acceso está pausado. Contacta con Nara o con tu asesoría para reactivarlo.";
}

/**
 * Comprueba plan y (opcionalmente) cuota de mensajes del día.
 * No consume nada; solo lee. El consumo de mensajes sigue en el endpoint.
 */
export async function verificarPlanErp(
  u: UsuarioCtx,
  opts: { comprobarMensajes?: boolean; mensajesUsadosHoy?: number } = {},
): Promise<ResultadoPlan> {
  // Limpieza oportunista de suscripciones vencidas (no bloquea)
  void caducarVencidas();

  const sub = await suscripcionActiva(u.id, u.asesoria_id);

  if (sub) {
    return evaluarSuscripcion(sub, u, opts);
  }

  // --- Fallback legacy (comportamiento actual) ---
  const planLegacy = (u.plan === "premium" ? "premium" : "gratis") as Plan;
  const lim = PLANES[planLegacy];
  if (opts.comprobarMensajes) {
    const usados =
      opts.mensajesUsadosHoy ??
      (await contarMensajesHoy(u.id)) ??
      null;
    // Si nara_uso no tiene datos, el endpoint seguirá usando mensajesHoy de erp
    if (usados !== null && usados >= lim.mensajesDia) {
      return {
        ok: false,
        motivo: "limite_mensajes",
        mensaje: `Has alcanzado el límite técnico de mensajes de hoy (${lim.mensajesDia}). Mañana podrás seguir.`,
      };
    }
  }
  return {
    ok: true,
    planId: planLegacy,
    mensajesDia: lim.mensajesDia,
    archivos12h: lim.archivos12h,
    diasRestantes: null,
    avisoCaducidad: false,
    origen: "legacy",
  };
}

async function evaluarSuscripcion(
  sub: SuscripcionFila,
  u: UsuarioCtx,
  opts: { comprobarMensajes?: boolean; mensajesUsadosHoy?: number },
): Promise<ResultadoPlan> {
  if (sub.status === "pausada") {
    return { ok: false, motivo: "pausada", mensaje: mensajePausada() };
  }
  if (sub.status === "cancelada") {
    return { ok: false, motivo: "cancelada", mensaje: mensajeCaducada() };
  }

  const dias = diasHasta(sub.ends_at);

  // Caducada por fecha (aunque el status aún diga activa; caducarVencidas es best-effort)
  if (dias !== null && dias < 0) {
    return { ok: false, motivo: "caducada", mensaje: mensajeCaducada(), diasRestantes: 0 };
  }
  if (sub.status === "caducada") {
    return { ok: false, motivo: "caducada", mensaje: mensajeCaducada(), diasRestantes: 0 };
  }

  const fallbackPlan = (u.plan === "premium" ? "premium" : "gratis") as Plan;
  const lim = limitesDesdeConfig(sub.plan_config, fallbackPlan);

  if (opts.comprobarMensajes) {
    const usados =
      opts.mensajesUsadosHoy ??
      (await contarMensajesHoy(u.id)) ??
      null;
    if (usados !== null && usados >= lim.mensajesDia) {
      return {
        ok: false,
        motivo: "limite_mensajes",
        mensaje: `Has alcanzado el límite de mensajes de hoy (${lim.mensajesDia}) de tu plan ${sub.plan_nombre}. Mañana podrás seguir.`,
      };
    }
  }

  return {
    ok: true,
    planId: sub.plan_id,
    mensajesDia: lim.mensajesDia,
    archivos12h: lim.archivos12h,
    diasRestantes: dias,
    avisoCaducidad: dias !== null && dias <= 3 && dias >= 0,
    origen: "suscripcion",
  };
}

/** Mensaje corto para UI cuando quedan ≤ 3 días. */
export function textoAvisoCaducidad(dias: number | null): string | null {
  if (dias === null || dias > 3 || dias < 0) return null;
  if (dias === 0) return "Tu prueba termina hoy. Solicita tu plan para no perder el acceso.";
  if (dias === 1) return "Te queda 1 día de prueba.";
  return `Te quedan ${dias} días de prueba.`;
}
