import { getSql } from "@/lib/db";
import { generarCodigo, hashCodigo } from "./sesion.server";

let listo: Promise<void> | null = null;

/** Crea las tablas del piloto si no existen (idempotente: vale en cada arranque, con cualquier Postgres). */
function asegurarEsquema(): Promise<void> {
  listo ??= (async () => {
    const sql = await getSql();
    await sql.query(`create table if not exists piloto_codigos (
      id serial primary key,
      etiqueta text not null,
      codigo_hash text not null unique,
      pista text not null,
      limite_diario integer not null default 30,
      activo boolean not null default true,
      creado timestamptz not null default now(),
      ultimo_uso timestamptz
    )`);
    await sql.query(`alter table piloto_codigos add column if not exists generacion integer not null default 1`);
    await sql.query(`create table if not exists piloto_uso (
      codigo_id integer not null references piloto_codigos(id) on delete cascade,
      dia date not null,
      consultas integer not null default 0,
      primary key (codigo_id, dia)
    )`);
    await sql.query(`create table if not exists piloto_valoraciones (
      id serial primary key,
      codigo_id integer references piloto_codigos(id) on delete set null,
      creado timestamptz not null default now(),
      valor text not null check (valor in ('util','incorrecta')),
      pregunta text not null,
      respuesta text not null,
      comentario text,
      estado text not null default 'pendiente' check (estado in ('pendiente','revisada','corregida','descartada')),
      nota_admin text
    )`);
    await sql.query(`create table if not exists piloto_solicitudes (
      id serial primary key,
      creado timestamptz not null default now(),
      tipo text not null check (tipo in ('informe','acompanamiento')),
      rol text not null check (rol in ('vendedor','comprador')),
      nombre text not null,
      email text not null,
      telefono text,
      ccaa text,
      mensaje text,
      datos text,
      estado text not null default 'nueva' check (estado in ('nueva','pendiente_pago','pagada','en_curso','entregada','descartada')),
      nota_admin text,
      consentimiento_en timestamptz not null
    )`);
  })().catch((e) => {
    listo = null;
    throw e;
  });
  return listo;
}

async function db() {
  await asegurarEsquema();
  return getSql();
}

/** Día actual en España (YYYY-MM-DD): los límites diarios se reinician a medianoche hora de Madrid. */
export function diaMadrid(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
}

export type CodigoFila = {
  id: number;
  etiqueta: string;
  pista: string;
  limite_diario: number;
  activo: boolean;
  creado: string;
  ultimo_uso: string | null;
  hoy: number;
  valoraciones: number;
};

export type ValoracionFila = {
  id: number;
  codigo_id: number | null;
  etiqueta: string | null;
  creado: string;
  valor: "util" | "incorrecta";
  pregunta: string;
  respuesta: string;
  comentario: string | null;
  estado: "pendiente" | "revisada" | "corregida" | "descartada";
  nota_admin: string | null;
};

export async function crearCodigo(etiqueta: string, limite: number): Promise<{ id: number; codigo: string }> {
  const sql = await db();
  const codigo = generarCodigo();
  const rows = await sql<{ id: number }>`
    insert into piloto_codigos (etiqueta, codigo_hash, pista, limite_diario)
    values (${etiqueta}, ${hashCodigo(codigo)}, ${codigo.slice(-4)}, ${limite})
    returning id`;
  return { id: rows[0]!.id, codigo };
}

export async function regenerarCodigo(id: number): Promise<string | null> {
  const sql = await db();
  const codigo = generarCodigo();
  const rows = await sql<{ id: number }>`
    update piloto_codigos set codigo_hash = ${hashCodigo(codigo)}, pista = ${codigo.slice(-4)}, generacion = generacion + 1
    where id = ${id} returning id`;
  return rows.length ? codigo : null;
}

export async function buscarCodigo(
  texto: string,
): Promise<{ id: number; etiqueta: string; activo: boolean; generacion: number } | null> {
  const sql = await db();
  const rows = await sql<{ id: number; etiqueta: string; activo: boolean; generacion: number }>`
    select id, etiqueta, activo, generacion from piloto_codigos where codigo_hash = ${hashCodigo(texto)}`;
  return rows[0] ?? null;
}

export async function estadoUso(id: number) {
  const sql = await db();
  const rows = await sql<{ etiqueta: string; limite_diario: number; activo: boolean; generacion: number; consultas: number }>`
    select c.etiqueta, c.limite_diario, c.activo, c.generacion, coalesce(u.consultas, 0) as consultas
    from piloto_codigos c
    left join piloto_uso u on u.codigo_id = c.id and u.dia = ${diaMadrid()}::date
    where c.id = ${id}`;
  return rows[0] ?? null;
}

export type Consumo = { ok: true; restantes: number; limite: number } | { ok: false; motivo: "inactivo" | "limite"; limite: number };

/** Descuenta una consulta de forma atómica; si se ha llegado al límite diario, no descuenta. */
export async function consumirConsulta(id: number, generacion: number): Promise<Consumo> {
  const sql = await db();
  const rows = await sql<{ limite: number | null; consultas: number | null }>`
    with c as (select id, limite_diario from piloto_codigos where id = ${id} and activo and generacion = ${generacion}),
    ins as (
      insert into piloto_uso (codigo_id, dia, consultas)
      select id, ${diaMadrid()}::date, 1 from c where limite_diario > 0
      on conflict (codigo_id, dia) do update set consultas = piloto_uso.consultas + 1
        where piloto_uso.consultas < (select limite_diario from c)
      returning consultas
    )
    select (select limite_diario from c) as limite, (select consultas from ins) as consultas`;
  const r = rows[0];
  if (!r || r.limite == null) return { ok: false, motivo: "inactivo", limite: 0 };
  if (r.consultas == null) return { ok: false, motivo: "limite", limite: r.limite };
  await sql`update piloto_codigos set ultimo_uso = now() where id = ${id}`;
  return { ok: true, restantes: Math.max(0, r.limite - r.consultas), limite: r.limite };
}

/** Si la IA falla, no se le cobra la consulta al usuario. */
export async function devolverConsulta(id: number): Promise<void> {
  const sql = await db();
  await sql`update piloto_uso set consultas = greatest(consultas - 1, 0) where codigo_id = ${id} and dia = ${diaMadrid()}::date`;
}

export async function listarCodigos(): Promise<CodigoFila[]> {
  const sql = await db();
  return sql<CodigoFila>`
    select c.id, c.etiqueta, c.pista, c.limite_diario, c.activo, c.creado, c.ultimo_uso,
      coalesce(u.consultas, 0) as hoy,
      (select count(*) from piloto_valoraciones v where v.codigo_id = c.id) as valoraciones
    from piloto_codigos c
    left join piloto_uso u on u.codigo_id = c.id and u.dia = ${diaMadrid()}::date
    order by c.creado desc`;
}

export async function actualizarCodigo(id: number, campos: { activo?: boolean; limite?: number }): Promise<void> {
  const sql = await db();
  if (campos.activo !== undefined) await sql`update piloto_codigos set activo = ${campos.activo} where id = ${id}`;
  if (campos.limite !== undefined) await sql`update piloto_codigos set limite_diario = ${campos.limite} where id = ${id}`;
}

export async function guardarValoracion(v: {
  codigoId: number;
  valor: "util" | "incorrecta";
  pregunta: string;
  respuesta: string;
  comentario: string | null;
}): Promise<void> {
  const sql = await db();
  await sql`insert into piloto_valoraciones (codigo_id, valor, pregunta, respuesta, comentario)
    values (${v.codigoId}, ${v.valor}, ${v.pregunta}, ${v.respuesta}, ${v.comentario})`;
}

export async function listarValoraciones(estado: string | null): Promise<ValoracionFila[]> {
  const sql = await db();
  const filtro = estado && estado !== "todas" ? estado : null;
  return sql<ValoracionFila>`
    select v.id, v.codigo_id, c.etiqueta, v.creado, v.valor, v.pregunta, v.respuesta, v.comentario, v.estado, v.nota_admin
    from piloto_valoraciones v left join piloto_codigos c on c.id = v.codigo_id
    where (${filtro}::text is null or v.estado = ${filtro}::text)
    order by v.creado desc limit 200`;
}

export async function actualizarValoracion(id: number, estado: string, nota: string | null): Promise<void> {
  const sql = await db();
  await sql`update piloto_valoraciones set estado = ${estado}, nota_admin = ${nota} where id = ${id}`;
}

export async function eliminarValoracion(id: number): Promise<void> {
  const sql = await db();
  await sql`delete from piloto_valoraciones where id = ${id}`;
}

export async function contarPendientes(): Promise<number> {
  const sql = await db();
  const rows = await sql<{ n: number }>`select count(*) as n from piloto_valoraciones where estado = 'pendiente'`;
  return rows[0]?.n ?? 0;
}

// ---------- Solicitudes de informe y acompañamiento

export type SolicitudFila = {
  id: number;
  creado: string;
  tipo: "informe" | "acompanamiento";
  rol: "vendedor" | "comprador";
  nombre: string;
  email: string;
  telefono: string | null;
  ccaa: string | null;
  mensaje: string | null;
  datos: string | null;
  estado: "nueva" | "pendiente_pago" | "pagada" | "en_curso" | "entregada" | "descartada";
  nota_admin: string | null;
};

export async function crearSolicitud(s: {
  tipo: "informe" | "acompanamiento";
  rol: "vendedor" | "comprador";
  nombre: string;
  email: string;
  telefono: string | null;
  ccaa: string | null;
  mensaje: string | null;
  datos: string | null;
}): Promise<number> {
  const sql = await db();
  const estado = s.tipo === "informe" ? "pendiente_pago" : "nueva";
  const rows = await sql<{ id: number }>`
    insert into piloto_solicitudes (tipo, rol, nombre, email, telefono, ccaa, mensaje, datos, estado, consentimiento_en)
    values (${s.tipo}, ${s.rol}, ${s.nombre}, ${s.email}, ${s.telefono}, ${s.ccaa}, ${s.mensaje}, ${s.datos}, ${estado}, now())
    returning id`;
  return rows[0]!.id;
}

/** Para frenar abusos: solicitudes del mismo correo y totales en las últimas 24 horas. */
export async function contarSolicitudesRecientes(email: string): Promise<{ porEmail: number; total: number }> {
  const sql = await db();
  const rows = await sql<{ por_email: number; total: number }>`
    select count(*) filter (where lower(email) = ${email.toLowerCase()}) as por_email, count(*) as total
    from piloto_solicitudes where creado > now() - interval '24 hours'`;
  return { porEmail: rows[0]?.por_email ?? 0, total: rows[0]?.total ?? 0 };
}

export async function listarSolicitudes(): Promise<SolicitudFila[]> {
  const sql = await db();
  return sql<SolicitudFila>`
    select id, creado, tipo, rol, nombre, email, telefono, ccaa, mensaje, datos, estado, nota_admin
    from piloto_solicitudes order by creado desc limit 200`;
}

export async function actualizarSolicitud(id: number, estado: string, nota: string | null): Promise<void> {
  const sql = await db();
  await sql`update piloto_solicitudes set estado = ${estado}, nota_admin = ${nota} where id = ${id}`;
}

export async function eliminarSolicitud(id: number): Promise<void> {
  const sql = await db();
  await sql`delete from piloto_solicitudes where id = ${id}`;
}

export async function contarNuevas(): Promise<number> {
  const sql = await db();
  const rows = await sql<{ n: number }>`select count(*) as n from piloto_solicitudes where estado = 'nueva' or estado = 'pagada'`;
  return rows[0]?.n ?? 0;
}
