/**
 * Operaciones de administración para solicitudes de demo/plan e invitaciones.
 * Aditivo: no toca tablas legacy (piloto_solicitudes).
 */
import { createHash, randomBytes } from "node:crypto";
import { getSql } from "@/lib/db";
import { crearAsesoria, crearUsuario, planAsesoria } from "@/lib/erp/db.server";
import { hashPassword, passwordTemporal } from "@/lib/erp/auth.server";

export type NaraSolicitud = {
  id: number;
  created_at: string;
  nombre: string;
  email: string;
  telefono: string | null;
  entidad: string;
  tipo_entidad: "farmacia" | "asesoria";
  plan_interes: string | null;
  mensaje: string | null;
  estado: "pendiente" | "aprobada" | "rechazada" | "convertida";
  ip: string | null;
  nota_admin: string | null;
};

async function sql() {
  return getSql();
}

export async function listarNaraSolicitudes(estado?: string): Promise<NaraSolicitud[]> {
  try {
    const filtro = estado && estado !== "todas" ? estado : null;
    return (
      await sql()
    ).query<NaraSolicitud>(
      `select id, created_at::text, nombre, email, telefono, entidad, tipo_entidad,
              plan_interes, mensaje, estado, ip, nota_admin
       from nara_solicitudes
       where ($1::text is null or estado = $1)
       order by created_at desc
       limit 200`,
      [filtro],
    );
  } catch {
    return [];
  }
}

export async function contarNaraPendientes(): Promise<number> {
  try {
    const r = await (await sql()).query<{ n: number }>(
      `select count(*)::int as n from nara_solicitudes where estado = 'pendiente'`,
    );
    return r[0]?.n ?? 0;
  } catch {
    return 0;
  }
}

export async function crearNaraSolicitud(s: {
  nombre: string;
  email: string;
  telefono: string | null;
  entidad: string;
  tipo_entidad: "farmacia" | "asesoria";
  plan_interes: string | null;
  mensaje: string | null;
  ip: string | null;
  user_agent: string | null;
}): Promise<number | null> {
  try {
    const rows = await (
      await sql()
    ).query<{ id: number }>(
      `insert into nara_solicitudes
         (nombre, email, telefono, entidad, tipo_entidad, plan_interes, mensaje, ip, user_agent)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       returning id`,
      [
        s.nombre,
        s.email,
        s.telefono,
        s.entidad,
        s.tipo_entidad,
        s.plan_interes,
        s.mensaje,
        s.ip,
        s.user_agent,
      ],
    );
    return rows[0]?.id ?? null;
  } catch (e) {
    console.error("[nara-solicitud] insert", e);
    return null;
  }
}

export async function contarNaraSolicitudesRecientes(email: string, ip: string | null) {
  try {
    const rows = await (
      await sql()
    ).query<{ por_email: number; por_ip: number }>(
      `select
         count(*) filter (where lower(email) = $1)::int as por_email,
         count(*) filter (where $2::text is not null and ip = $2)::int as por_ip
       from nara_solicitudes
       where created_at > now() - interval '24 hours'`,
      [email.toLowerCase(), ip],
    );
    return { porEmail: rows[0]?.por_email ?? 0, porIp: rows[0]?.por_ip ?? 0 };
  } catch {
    return { porEmail: 0, porIp: 0 };
  }
}

export async function actualizarNaraSolicitud(
  id: number,
  estado: string,
  nota: string | null,
): Promise<void> {
  await (
    await sql()
  ).query(
    `update nara_solicitudes
     set estado = $2, nota_admin = $3, procesada_at = now()
     where id = $1`,
    [id, estado, nota],
  );
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function crearInvitacion(erpUsuarioId: number, horas = 72): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  await (
    await sql()
  ).query(
    `insert into nara_invitaciones (token_hash, erp_usuario_id, expires_at)
     values ($1, $2, now() + ($3 || ' hours')::interval)`,
    [tokenHash, erpUsuarioId, String(horas)],
  );
  return token;
}

export async function consumirInvitacion(
  token: string,
  nuevaPassword: string,
): Promise<{ ok: true; email: string } | { ok: false; motivo: string }> {
  if (nuevaPassword.length < 8) return { ok: false, motivo: "La contraseña debe tener al menos 8 caracteres." };
  const tokenHash = hashToken(token);
  const rows = await (
    await sql()
  ).query<{ id: string; erp_usuario_id: number; email: string }>(
    `select i.id::text, i.erp_usuario_id, u.email
     from nara_invitaciones i
     join erp_usuarios u on u.id = i.erp_usuario_id
     where i.token_hash = $1 and i.used_at is null and i.expires_at > now()
     limit 1`,
    [tokenHash],
  );
  const inv = rows[0];
  if (!inv) return { ok: false, motivo: "El enlace no es válido o ha caducado." };

  const hash = await hashPassword(nuevaPassword);
  await (
    await sql()
  ).query(
    `update erp_usuarios
     set pass_hash = $1, debe_cambiar = false, version = version + 1, intentos = 0, bloqueado_hasta = null
     where id = $2`,
    [hash, inv.erp_usuario_id],
  );
  await (await sql()).query(`update nara_invitaciones set used_at = now() where id = $1::uuid`, [inv.id]);
  return { ok: true, email: inv.email };
}

/** Crea suscripción activa con fecha de fin opcional. */
export async function crearSuscripcion(opts: {
  erpUsuarioId?: number;
  erpAsesoriaId?: number;
  planId: string;
  dias: number | null;
}): Promise<string | null> {
  try {
    const rows = await (
      await sql()
    ).query<{ id: string }>(
      `insert into nara_suscripciones
         (erp_usuario_id, erp_asesoria_id, plan_id, starts_at, ends_at, status)
       values ($1, $2, $3, now(),
               case when $4::int is null then null else now() + ($4 || ' days')::interval end,
               'activa')
       returning id::text`,
      [opts.erpUsuarioId ?? null, opts.erpAsesoriaId ?? null, opts.planId, opts.dias],
    );
    return rows[0]?.id ?? null;
  } catch (e) {
    console.error("[suscripcion] crear", e);
    return null;
  }
}

export async function pausarOCortarSuscripcion(
  erpAsesoriaId: number,
  status: "pausada" | "cancelada" | "activa",
): Promise<void> {
  await (
    await sql()
  ).query(
    `update nara_suscripciones
     set status = $2, updated_at = now()
     where erp_asesoria_id = $1 and status in ('activa','pausada')`,
    [erpAsesoriaId, status],
  );
}

export async function ampliarSuscripcion(erpAsesoriaId: number, diasExtra: number): Promise<void> {
  await (
    await sql()
  ).query(
    `update nara_suscripciones
     set ends_at = coalesce(ends_at, now()) + ($2 || ' days')::interval,
         status = 'activa',
         updated_at = now()
     where erp_asesoria_id = $1 and status in ('activa','caducada','pausada')`,
    [erpAsesoriaId, String(diasExtra)],
  );
}

/**
 * Aprueba una solicitud de demo:
 * - Crea asesoría + admin (o usuario si ya hubiera flujo farmacia)
 * - Crea suscripción con plan y días
 * - Genera invitación one-time (token en claro solo para el correo)
 * - Marca solicitud como convertida
 */
export async function aprobarSolicitud(opts: {
  solicitudId: number;
  planId: string;
  dias: number;
  nota?: string | null;
}): Promise<
  | {
      ok: true;
      asesoriaId: number;
      usuarioId: number;
      email: string;
      invitacionToken: string;
      passwordTemporalFallback: string;
    }
  | { ok: false; error: string }
> {
  const rows = await (
    await sql()
  ).query<NaraSolicitud>(
    `select id, created_at::text, nombre, email, telefono, entidad, tipo_entidad,
            plan_interes, mensaje, estado, ip, nota_admin
     from nara_solicitudes where id = $1`,
    [opts.solicitudId],
  );
  const s = rows[0];
  if (!s) return { ok: false, error: "Solicitud no encontrada." };
  if (s.estado !== "pendiente") return { ok: false, error: "La solicitud ya no está pendiente." };

  const planId = ["demo", "gratis", "premium", "medida"].includes(opts.planId) ? opts.planId : "demo";
  const dias = opts.dias > 0 ? opts.dias : 7;

  // Crear asesoría + admin (reutiliza flujo existente)
  const creado = await crearAsesoria(s.entidad || s.nombre, s.email, s.nombre);
  if (!creado) return { ok: false, error: "Ya existe un usuario con ese correo." };

  // Alinear plan legacy de la asesoría
  const planLegacy = planId === "premium" || planId === "medida" ? "premium" : "gratis";
  await planAsesoria(creado.asesoriaId, planLegacy);

  await crearSuscripcion({
    erpAsesoriaId: creado.asesoriaId,
    erpUsuarioId: creado.usuarioId,
    planId,
    dias,
  });

  const invitacionToken = await crearInvitacion(creado.usuarioId, 72);

  await actualizarNaraSolicitud(
    s.id,
    "convertida",
    opts.nota ?? `Aprobada: plan ${planId}, ${dias} días`,
  );

  return {
    ok: true,
    asesoriaId: creado.asesoriaId,
    usuarioId: creado.usuarioId,
    email: s.email,
    invitacionToken,
    passwordTemporalFallback: creado.passwordTemporal,
  };
}

// Re-export útil para crear usuario suelto si hace falta
export { crearUsuario, passwordTemporal };
