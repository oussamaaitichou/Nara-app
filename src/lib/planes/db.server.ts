/**
 * Lectura de planes y suscripciones (nara_*).
 * Solo consultas. No escribe. Si las tablas aún no existen o no hay filas,
 * devuelve null / vacío y el llamador usa el comportamiento actual.
 */
import { getSql } from "@/lib/db";

export type PlanConfig = {
  mensajes_dia?: number;
  archivos_12h?: number;
  duracion_default_dias?: number;
  [key: string]: unknown;
};

export type PlanFila = {
  id: string;
  nombre: string;
  descripcion: string | null;
  config: PlanConfig;
  activo: boolean;
};

export type SuscripcionFila = {
  id: string;
  erp_usuario_id: number | null;
  erp_asesoria_id: number | null;
  plan_id: string;
  starts_at: string;
  ends_at: string | null;
  status: "activa" | "caducada" | "pausada" | "cancelada";
  plan_nombre: string;
  plan_config: PlanConfig;
};

async function sql() {
  return getSql();
}

/** Devuelve el plan por id o null si no existe / tablas no creadas. */
export async function planPorId(id: string): Promise<PlanFila | null> {
  try {
    const rows = await (
      await sql()
    ).query<PlanFila>(
      `select id, nombre, descripcion, config, activo from nara_planes where id = $1 and activo limit 1`,
      [id],
    );
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      ...r,
      config: (typeof r.config === "object" && r.config ? r.config : {}) as PlanConfig,
    };
  } catch {
    return null;
  }
}

/**
 * Suscripción activa más reciente del usuario o de su asesoría.
 * Prioriza la del usuario; si no hay, la de la asesoría.
 */
export async function suscripcionActiva(
  erpUsuarioId: number,
  erpAsesoriaId: number,
): Promise<SuscripcionFila | null> {
  try {
    const rows = await (
      await sql()
    ).query<SuscripcionFila>(
      `select s.id, s.erp_usuario_id, s.erp_asesoria_id, s.plan_id,
              s.starts_at::text, s.ends_at::text, s.status,
              p.nombre as plan_nombre, p.config as plan_config
       from nara_suscripciones s
       join nara_planes p on p.id = s.plan_id and p.activo
       where s.status = 'activa'
         and (
           s.erp_usuario_id = $1
           or (s.erp_usuario_id is null and s.erp_asesoria_id = $2)
         )
       order by
         case when s.erp_usuario_id = $1 then 0 else 1 end,
         s.starts_at desc
       limit 1`,
      [erpUsuarioId, erpAsesoriaId],
    );
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      ...r,
      plan_config: (typeof r.plan_config === "object" && r.plan_config
        ? r.plan_config
        : {}) as PlanConfig,
    };
  } catch {
    // Tabla aún no migrada o sin datos → null (fallback al sistema actual)
    return null;
  }
}

/** Marca como caducadas las suscripciones cuya ends_at ya pasó (idempotente). */
export async function caducarVencidas(): Promise<void> {
  try {
    await (
      await sql()
    ).query(
      `update nara_suscripciones
       set status = 'caducada', updated_at = now()
       where status = 'activa' and ends_at is not null and ends_at < now()`,
    );
  } catch {
    // silencioso: no bloquear el request
  }
}

/** Cuenta mensajes del usuario en las últimas 24 h (tabla nara_uso o fallback). */
export async function contarMensajesHoy(erpUsuarioId: number): Promise<number | null> {
  try {
    const rows = await (
      await sql()
    ).query<{ n: number }>(
      `select coalesce(sum(cantidad), 0)::int as n
       from nara_uso
       where erp_usuario_id = $1
         and tipo = 'mensaje'
         and periodo_inicio > now() - interval '24 hours'`,
      [erpUsuarioId],
    );
    return rows[0]?.n ?? 0;
  } catch {
    return null; // tabla no existe → el llamador usa mensajesHoy de erp
  }
}

/** Registra un mensaje en nara_uso (no falla el request si la tabla no existe). */
export async function registrarMensaje(erpUsuarioId: number): Promise<void> {
  try {
    // periodo_inicio = inicio del día en Madrid (aprox. truncado a día UTC+1)
    await (
      await sql()
    ).query(
      `insert into nara_uso (erp_usuario_id, tipo, cantidad, periodo_inicio)
       values ($1, 'mensaje', 1, date_trunc('day', now() at time zone 'Europe/Madrid') at time zone 'Europe/Madrid')`,
      [erpUsuarioId],
    );
  } catch {
    // no crítico
  }
}
