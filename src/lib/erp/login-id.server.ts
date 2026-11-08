/**
 * Login por identificador (nombre, email o DNI) enlazado al usuario ERP.
 * Aditivo: no cambia el esquema; busca por email o nombre.
 */
import { getSql } from "@/lib/db";

export type FilaLogin = {
  id: number;
  pass_hash: string;
  activo: boolean;
  version: number;
  asesoria_id: number;
  bloqueado: boolean;
  asesoria_activa: boolean;
  email: string;
  nombre: string;
  plan: string;
};

/** Normaliza identificador de acceso (sin espacios extremos, lower para comparacion). */
export function normalizarIdentificador(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/**
 * Busca usuario por email exacto (lower) o por nombre exacto (lower).
 * El DNI puede guardarse como nombre/identificador de acceso hasta tener columna dedicada.
 */
export async function usuarioPorIdentificador(identificador: string): Promise<FilaLogin | null> {
  const id = normalizarIdentificador(identificador);
  if (id.length < 2) return null;
  const sql = await getSql();
  const key = id.toLowerCase();
  const rows = await sql.query<FilaLogin>(
    `select u.id, u.pass_hash, u.activo, u.version, u.asesoria_id,
            (u.bloqueado_hasta is not null and u.bloqueado_hasta > now()) as bloqueado,
            a.activa as asesoria_activa, u.email, u.nombre, coalesce(a.plan, 'gratis') as plan
     from erp_usuarios u
     join erp_asesorias a on a.id = u.asesoria_id
     where lower(u.email) = $1
        or lower(u.nombre) = $1
     limit 1`,
    [key],
  );
  return rows[0] ?? null;
}

/** Destino tras login segun plan de la asesoria / codigo. */
export function rutaPorPlan(plan: string | null | undefined): "/panel" | "/consulta" {
  const p = (plan ?? "gest").toLowerCase();
  if (p === "chat") return "/consulta";
  // gest, demo, premium, gratis con ERP, medida → panel (incluye chat desde ahi)
  return "/panel";
}
