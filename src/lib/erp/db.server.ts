import { getSql } from "@/lib/db";
import type { FilaMes } from "./importar";
import { hashPassword, passwordTemporal } from "./auth.server";

let listo: Promise<void> | null = null;
function asegurar(): Promise<void> {
  listo ??= (async () => {
    const sql = await getSql();
    const q = (t: string) => sql.query(t);
    await q(`create table if not exists erp_asesorias (id serial primary key, nombre text not null, logo text, activa boolean not null default true, creado timestamptz not null default now())`);
    await q(`create table if not exists erp_farmacias (id serial primary key, asesoria_id integer not null references erp_asesorias(id) on delete cascade, nombre text not null, ccaa text, titular text, activa boolean not null default true, creado timestamptz not null default now())`);
    await q(`create table if not exists erp_usuarios (id serial primary key, asesoria_id integer not null references erp_asesorias(id) on delete cascade, farmacia_id integer references erp_farmacias(id) on delete set null, email text not null, nombre text not null, rol text not null check (rol in ('asesoria_admin','asesoria_staff','cliente')), pass_hash text not null, debe_cambiar boolean not null default true, activo boolean not null default true, version integer not null default 1, intentos integer not null default 0, bloqueado_hasta timestamptz, creado timestamptz not null default now(), ultimo_acceso timestamptz)`);
    await q(`create unique index if not exists erp_usuarios_email on erp_usuarios (lower(email))`);
    await q(`create table if not exists erp_datos_mensuales (farmacia_id integer not null references erp_farmacias(id) on delete cascade, periodo text not null, ventas numeric(14,2) not null default 0, compras numeric(14,2) not null default 0, personal numeric(14,2) not null default 0, alquiler numeric(14,2) not null default 0, otros numeric(14,2) not null default 0, actualizado timestamptz not null default now(), primary key (farmacia_id, periodo))`);
    await q(`create table if not exists erp_auditoria (id serial primary key, ts timestamptz not null default now(), usuario_id integer, asesoria_id integer, accion text not null, detalle text)`);
    await q(`alter table erp_asesorias add column if not exists plan text not null default 'gratis'`);
    await q(`create table if not exists erp_conversaciones (id serial primary key, usuario_id integer not null references erp_usuarios(id) on delete cascade, titulo text not null, creado timestamptz not null default now(), actualizado timestamptz not null default now())`);
    await q(`create index if not exists erp_conv_usuario on erp_conversaciones (usuario_id, actualizado desc)`);
    await q(`alter table erp_conversaciones add column if not exists resumen text`);
    await q(`alter table erp_conversaciones add column if not exists resumido_hasta integer not null default 0`);
    await q(`create table if not exists erp_mensajes (id serial primary key, conversacion_id integer not null references erp_conversaciones(id) on delete cascade, rol text not null check (rol in ('user','assistant')), contenido text not null, adjuntos text, creado timestamptz not null default now())`);
    await q(`create index if not exists erp_msg_conv on erp_mensajes (conversacion_id, id)`);
    await q(`create table if not exists erp_archivos_uso (id serial primary key, usuario_id integer not null references erp_usuarios(id) on delete cascade, ts timestamptz not null default now(), nombre text not null, tipo text not null, tam integer not null)`);
    await q(`create index if not exists erp_arch_usuario on erp_archivos_uso (usuario_id, ts)`);
  })().catch((e) => {
    listo = null;
    throw e;
  });
  return listo;
}
const db = async () => {
  await asegurar();
  return getSql();
};

export type Rol = "asesoria_admin" | "asesoria_staff" | "cliente";
export type UsuarioCtx = {
  id: number; asesoria_id: number; farmacia_id: number | null; email: string; nombre: string; rol: Rol; debe_cambiar: boolean;
  activo: boolean; version: number; asesoria_nombre: string; logo: string | null; asesoria_activa: boolean; plan: "gratis" | "premium";
};
export type FarmaciaFila = { id: number; nombre: string; ccaa: string | null; titular: string | null; activa: boolean; meses: number };

export async function auditar(usuarioId: number | null, asesoriaId: number | null, accion: string, detalle = ""): Promise<void> {
  try {
    const sql = await db();
    await sql`insert into erp_auditoria (usuario_id, asesoria_id, accion, detalle) values (${usuarioId}, ${asesoriaId}, ${accion}, ${detalle.slice(0, 300)})`;
  } catch (e) {
    console.error("[erp] no se pudo auditar", e);
  }
}

// ---------- Asesorías (las gestiona el propietario de Nara desde /admin)
export async function crearAsesoria(nombre: string, adminEmail: string, adminNombre: string) {
  const sql = await db();
  if ((await sql`select 1 as x from erp_usuarios where lower(email) = ${adminEmail.toLowerCase()}`).length) return null;
  const a = await sql<{ id: number }>`insert into erp_asesorias (nombre) values (${nombre}) returning id`;
  const pass = passwordTemporal();
  const u = await sql<{ id: number }>`insert into erp_usuarios (asesoria_id, email, nombre, rol, pass_hash) values (${a[0]!.id}, ${adminEmail}, ${adminNombre}, 'asesoria_admin', ${await hashPassword(pass)}) returning id`;
  await auditar(null, a[0]!.id, "crear_asesoria", nombre);
  return { asesoriaId: a[0]!.id, usuarioId: u[0]!.id, passwordTemporal: pass };
}
export async function listarAsesorias() {
  const sql = await db();
  return sql<{ id: number; nombre: string; activa: boolean; plan: string; creado: string; farmacias: number; usuarios: number; admin_id: number | null; admin_email: string | null }>`
    select a.id, a.nombre, a.activa, a.plan, a.creado,
      (select count(*) from erp_farmacias f where f.asesoria_id = a.id) as farmacias,
      (select count(*) from erp_usuarios u where u.asesoria_id = a.id) as usuarios,
      (select u.id from erp_usuarios u where u.asesoria_id = a.id and u.rol = 'asesoria_admin' order by u.id limit 1) as admin_id,
      (select u.email from erp_usuarios u where u.asesoria_id = a.id and u.rol = 'asesoria_admin' order by u.id limit 1) as admin_email
    from erp_asesorias a order by a.creado desc`;
}
export async function estadoAsesoria(id: number, activa: boolean) {
  const sql = await db();
  await sql`update erp_asesorias set activa = ${activa} where id = ${id}`;
  await auditar(null, id, activa ? "activar_asesoria" : "suspender_asesoria");
}
export async function resetPasswordPlataforma(usuarioId: number): Promise<string | null> {
  const sql = await db();
  const pass = passwordTemporal();
  const r = await sql<{ asesoria_id: number }>`update erp_usuarios set pass_hash = ${await hashPassword(pass)}, debe_cambiar = true, version = version + 1, intentos = 0, bloqueado_hasta = null where id = ${usuarioId} returning asesoria_id`;
  if (!r.length) return null;
  await auditar(null, r[0]!.asesoria_id, "reset_password_plataforma", String(usuarioId));
  return pass;
}

// ---------- Usuarios y sesión
export async function usuarioPorEmail(email: string) {
  const sql = await db();
  const r = await sql<{ id: number; pass_hash: string; activo: boolean; version: number; asesoria_id: number; bloqueado: boolean; asesoria_activa: boolean }>`
    select u.id, u.pass_hash, u.activo, u.version, u.asesoria_id, (u.bloqueado_hasta is not null and u.bloqueado_hasta > now()) as bloqueado, a.activa as asesoria_activa
    from erp_usuarios u join erp_asesorias a on a.id = u.asesoria_id where lower(u.email) = ${email.toLowerCase()}`;
  return r[0] ?? null;
}
export async function usuarioCtx(id: number): Promise<UsuarioCtx | null> {
  const sql = await db();
  const r = await sql<UsuarioCtx>`
    select u.id, u.asesoria_id, u.farmacia_id, u.email, u.nombre, u.rol, u.debe_cambiar, u.activo, u.version, a.nombre as asesoria_nombre, a.logo, a.activa as asesoria_activa, a.plan
    from erp_usuarios u join erp_asesorias a on a.id = u.asesoria_id where u.id = ${id}`;
  return r[0] ?? null;
}
export async function falloLogin(id: number) {
  const sql = await db();
  await sql`update erp_usuarios set intentos = intentos + 1 where id = ${id}`;
  await sql`update erp_usuarios set bloqueado_hasta = now() + interval '15 minutes', intentos = 0 where id = ${id} and intentos >= 5`;
}
export async function loginOk(id: number) {
  const sql = await db();
  await sql`update erp_usuarios set intentos = 0, bloqueado_hasta = null, ultimo_acceso = now() where id = ${id}`;
}
export async function cambiarPassword(id: number, hash: string): Promise<number> {
  const sql = await db();
  const r = await sql<{ version: number }>`update erp_usuarios set pass_hash = ${hash}, debe_cambiar = false, version = version + 1 where id = ${id} returning version`;
  return r[0]!.version;
}
export async function listarUsuarios(asesoriaId: number) {
  const sql = await db();
  return sql<{ id: number; email: string; nombre: string; rol: Rol; activo: boolean; farmacia_id: number | null; farmacia: string | null; ultimo_acceso: string | null }>`
    select u.id, u.email, u.nombre, u.rol, u.activo, u.farmacia_id, f.nombre as farmacia, u.ultimo_acceso
    from erp_usuarios u left join erp_farmacias f on f.id = u.farmacia_id where u.asesoria_id = ${asesoriaId} order by u.rol, u.nombre`;
}
export async function crearUsuario(u: { asesoriaId: number; farmaciaId: number | null; email: string; nombre: string; rol: Rol }) {
  const sql = await db();
  if ((await sql`select 1 as x from erp_usuarios where lower(email) = ${u.email.toLowerCase()}`).length) return null;
  const pass = passwordTemporal();
  const r = await sql<{ id: number }>`insert into erp_usuarios (asesoria_id, farmacia_id, email, nombre, rol, pass_hash) values (${u.asesoriaId}, ${u.farmaciaId}, ${u.email}, ${u.nombre}, ${u.rol}, ${await hashPassword(pass)}) returning id`;
  return { id: r[0]!.id, passwordTemporal: pass };
}
export async function resetPassword(id: number, asesoriaId: number): Promise<string | null> {
  const sql = await db();
  const pass = passwordTemporal();
  const r = await sql`update erp_usuarios set pass_hash = ${await hashPassword(pass)}, debe_cambiar = true, version = version + 1, intentos = 0, bloqueado_hasta = null where id = ${id} and asesoria_id = ${asesoriaId} returning id`;
  return r.length ? pass : null;
}
export async function estadoUsuario(id: number, asesoriaId: number, activo: boolean) {
  const sql = await db();
  await sql`update erp_usuarios set activo = ${activo}, version = version + 1 where id = ${id} and asesoria_id = ${asesoriaId}`;
}
export async function guardarLogo(asesoriaId: number, logo: string | null) {
  const sql = await db();
  await sql`update erp_asesorias set logo = ${logo} where id = ${asesoriaId}`;
}

// ---------- Farmacias y datos
export async function listarFarmacias(asesoriaId: number, soloId: number | null) {
  const sql = await db();
  return sql<FarmaciaFila>`
    select f.id, f.nombre, f.ccaa, f.titular, f.activa, (select count(*) from erp_datos_mensuales d where d.farmacia_id = f.id) as meses
    from erp_farmacias f where f.asesoria_id = ${asesoriaId} and (${soloId}::int is null or f.id = ${soloId}::int) order by f.nombre`;
}
export async function farmaciaDe(id: number, asesoriaId: number) {
  const sql = await db();
  const r = await sql<{ id: number; nombre: string; ccaa: string | null; titular: string | null; activa: boolean }>`select id, nombre, ccaa, titular, activa from erp_farmacias where id = ${id} and asesoria_id = ${asesoriaId}`;
  return r[0] ?? null;
}
export async function crearFarmacia(asesoriaId: number, nombre: string, ccaa: string | null, titular: string | null) {
  const sql = await db();
  const r = await sql<{ id: number }>`insert into erp_farmacias (asesoria_id, nombre, ccaa, titular) values (${asesoriaId}, ${nombre}, ${ccaa}, ${titular}) returning id`;
  return r[0]!.id;
}
export async function estadoFarmacia(id: number, asesoriaId: number, activa: boolean) {
  const sql = await db();
  await sql`update erp_farmacias set activa = ${activa} where id = ${id} and asesoria_id = ${asesoriaId}`;
}
export async function datosFarmacia(farmaciaId: number): Promise<FilaMes[]> {
  const sql = await db();
  return sql<FilaMes>`select periodo, ventas::float8 as ventas, compras::float8 as compras, personal::float8 as personal, alquiler::float8 as alquiler, otros::float8 as otros from erp_datos_mensuales where farmacia_id = ${farmaciaId} order by periodo`;
}
export async function importarDatos(farmaciaId: number, filas: FilaMes[]) {
  const sql = await db();
  for (const f of filas) {
    await sql`insert into erp_datos_mensuales (farmacia_id, periodo, ventas, compras, personal, alquiler, otros)
      values (${farmaciaId}, ${f.periodo}, ${f.ventas}, ${f.compras}, ${f.personal}, ${f.alquiler}, ${f.otros})
      on conflict (farmacia_id, periodo) do update set ventas = excluded.ventas, compras = excluded.compras, personal = excluded.personal, alquiler = excluded.alquiler, otros = excluded.otros, actualizado = now()`;
  }
}
export async function borrarMes(farmaciaId: number, periodo: string) {
  const sql = await db();
  await sql`delete from erp_datos_mensuales where farmacia_id = ${farmaciaId} and periodo = ${periodo}`;
}

export async function planAsesoria(id: number, plan: "gratis" | "premium") {
  const sql = await db();
  await sql`update erp_asesorias set plan = ${plan} where id = ${id}`;
  await auditar(null, id, "plan_asesoria", plan);
}

// ---------- Chat del ERP: conversaciones guardadas y cuotas
export type ConversacionFila = { id: number; titulo: string; actualizado: string };
export type ConversacionDetalle = ConversacionFila & { resumen: string | null; resumido_hasta: number };
export type MensajeFila = { id: number; rol: "user" | "assistant"; contenido: string; adjuntos: string | null; creado: string };

export async function listarConversaciones(usuarioId: number) {
  const sql = await db();
  return sql<ConversacionFila>`select id, titulo, actualizado from erp_conversaciones where usuario_id = ${usuarioId} order by actualizado desc limit 100`;
}
export async function conversacionDe(id: number, usuarioId: number): Promise<ConversacionDetalle | null> {
  const sql = await db();
  const r = await sql<ConversacionDetalle>`select id, titulo, actualizado, resumen, resumido_hasta from erp_conversaciones where id = ${id} and usuario_id = ${usuarioId}`;
  return r[0] ?? null;
}
export async function crearConversacion(usuarioId: number, titulo: string) {
  const sql = await db();
  const r = await sql<{ id: number }>`insert into erp_conversaciones (usuario_id, titulo) values (${usuarioId}, ${titulo}) returning id`;
  return r[0]!.id;
}
export async function mensajesDe(conversacionId: number, ultimos = 200) {
  const sql = await db();
  return sql<MensajeFila>`select id, rol, contenido, adjuntos, creado from (select id, rol, contenido, adjuntos, creado from erp_mensajes where conversacion_id = ${conversacionId} order by id desc limit ${ultimos}) t order by id`;
}
export async function mensajesDesde(conversacionId: number, desdeId: number, limite = 400) {
  const sql = await db();
  return sql<MensajeFila>`select id, rol, contenido, adjuntos, creado from (select id, rol, contenido, adjuntos, creado from erp_mensajes where conversacion_id = ${conversacionId} and id > ${desdeId} order by id desc limit ${limite}) t order by id`;
}
export async function guardarMensaje(conversacionId: number, rol: "user" | "assistant", contenido: string, adjuntos: string | null) {
  const sql = await db();
  await sql`insert into erp_mensajes (conversacion_id, rol, contenido, adjuntos) values (${conversacionId}, ${rol}, ${contenido}, ${adjuntos})`;
  await sql`update erp_conversaciones set actualizado = now() where id = ${conversacionId}`;
}
export async function guardarResumen(conversacionId: number, resumen: string, hastaId: number) {
  const sql = await db();
  await sql`update erp_conversaciones set resumen = ${resumen}, resumido_hasta = ${hastaId} where id = ${conversacionId}`;
}
export async function borrarConversacion(id: number, usuarioId: number) {
  const sql = await db();
  await sql`delete from erp_conversaciones where id = ${id} and usuario_id = ${usuarioId}`;
}
export async function mensajesHoy(usuarioId: number): Promise<number> {
  const sql = await db();
  const r = await sql<{ n: number }>`select count(*) as n from erp_mensajes m join erp_conversaciones c on c.id = m.conversacion_id where c.usuario_id = ${usuarioId} and m.rol = 'user' and m.creado > now() - interval '24 hours'`;
  return r[0]?.n ?? 0;
}
export async function archivosUsados(usuarioId: number): Promise<{ usados: number; masAntiguo: string | null }> {
  const sql = await db();
  const r = await sql<{ usados: number; antiguo: string | null }>`select count(*) as usados, min(ts) as antiguo from erp_archivos_uso where usuario_id = ${usuarioId} and ts > now() - interval '12 hours'`;
  return { usados: r[0]?.usados ?? 0, masAntiguo: r[0]?.antiguo ?? null };
}
export async function registrarArchivos(usuarioId: number, items: { nombre: string; tipo: string; tam: number }[]) {
  const sql = await db();
  for (const a of items) await sql`insert into erp_archivos_uso (usuario_id, nombre, tipo, tam) values (${usuarioId}, ${a.nombre}, ${a.tipo}, ${a.tam})`;
}
