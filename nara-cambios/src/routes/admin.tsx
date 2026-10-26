import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Check, Copy, KeyRound, LogOut, ThumbsDown, ThumbsUp } from "lucide-react";
import { NaraMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ClaveTemporal } from "@/components/erp/comun";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Panel del piloto — Nara" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

type Codigo = {
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
type Valoracion = {
  id: number;
  etiqueta: string | null;
  creado: string;
  valor: "util" | "incorrecta";
  pregunta: string;
  respuesta: string;
  comentario: string | null;
  estado: "pendiente" | "revisada" | "corregida" | "descartada";
  nota_admin: string | null;
};
type Solicitud = {
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
type Asesoria = { id: number; nombre: string; activa: boolean; plan: string; farmacias: number; usuarios: number; admin_id: number | null; admin_email: string | null };
type Invitacion = { id: number; email: string; rol: string; token: string; creada: string; usada: boolean; usada_en: string | null };
type UsuarioReg = { id: number; email: string; nombre: string; rol: string; estado: "pendiente" | "aprobado" | "rechazado"; creado: string; aprobado_en: string | null; nota_admin: string | null };
type Datos = {
  codigos: Codigo[];
  valoraciones: Valoracion[];
  pendientes: number;
  solicitudes: Solicitud[];
  nuevas: number;
  asesorias: Asesoria[];
  erpActivo: boolean;
  invitaciones: Invitacion[];
  usuarios: UsuarioReg[];
  usuariosPendientes: number;
};
const ESTADOS_SOLICITUD: Record<Solicitud["estado"], string> = {
  nueva: "Nueva", pendiente_pago: "Pendiente de pago", pagada: "Pagada", en_curso: "En curso", entregada: "Entregada", descartada: "Descartada",
};

const ESTADOS = ["pendiente", "revisada", "corregida", "descartada"] as const;
const fecha = (iso: string | null) => (iso ? new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }) : "—");
const campo =
  "h-10 rounded-md border border-line bg-bg px-3 text-sm text-ink outline-none focus:border-teal";

async function llamar(method: "GET" | "POST", body?: Record<string, unknown>, query = "") {
  const res = await fetch(`/api/admin${query}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    // sin cuerpo
  }
  return { ok: res.ok, status: res.status, json };
}

function AdminPage() {
  const [fase, setFase] = useState<"cargando" | "login" | "panel" | "error">("cargando");
  const [datos, setDatos] = useState<Datos | null>(null);
  const [filtro, setFiltro] = useState<string>("pendiente");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [nuevo, setNuevo] = useState<{ etiqueta: string; codigo: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [etiqueta, setEtiqueta] = useState("");
  const [limite, setLimite] = useState("30");
  const [invEmail, setInvEmail] = useState("");
  const [invRol, setInvRol] = useState("farmaceutico");
  const [nuevaInv, setNuevaInv] = useState<{ email: string; token: string; rol: string } | null>(null);
  const [filtroUsuarios, setFiltroUsuarios] = useState("pendiente");

  const cargar = useCallback(async (estado: string, usuarios = filtroUsuarios) => {
    const r = await llamar("GET", undefined, `?estado=${encodeURIComponent(estado)}&usuarios=${encodeURIComponent(usuarios)}`);
    if (r.status === 401) return setFase("login");
    if (!r.ok) {
      setMensaje((r.json.error as string) ?? "No se han podido cargar los datos.");
      return setFase("error");
    }
    setDatos(r.json as unknown as Datos);
    setFase("panel");
  }, []);

  useEffect(() => {
    void cargar(filtro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function accion(body: Record<string, unknown>, okMsg?: string) {
    setMensaje(null);
    const r = await llamar("POST", body);
    if (r.status === 401) {
      setFase("login");
      return null;
    }
    if (!r.ok) {
      setMensaje((r.json.error as string) ?? "No se ha podido completar la acción.");
      return null;
    }
    if (okMsg) setMensaje(okMsg);
    await cargar(filtro);
    return r.json;
  }

  async function login() {
    setMensaje(null);
    const r = await llamar("POST", { accion: "login", password });
    if (!r.ok) {
      setMensaje((r.json.error as string) ?? "No se ha podido iniciar sesión.");
      return;
    }
    setPassword("");
    await cargar(filtro);
  }

  async function crear() {
    const json = await accion({ accion: "crear", etiqueta, limite: Number(limite) });
    if (json?.codigo) {
      setNuevo({ etiqueta, codigo: json.codigo as string });
      setEtiqueta("");
      setCopiado(false);
    }
  }

  async function invitar() {
    const json = await accion({ accion: "invitar", email: invEmail, rol: invRol }, "Invitación creada.");
    if (json?.token) {
      setNuevaInv({ email: invEmail, token: json.token as string, rol: invRol });
      setInvEmail("");
      setCopiado(false);
    }
  }

  async function regenerar(c: Codigo) {
    if (!window.confirm(`Se generará un código nuevo para «${c.etiqueta}» y el anterior dejará de funcionar. ¿Continuar?`)) return;
    const json = await accion({ accion: "regenerar", id: c.id });
    if (json?.codigo) {
      setNuevo({ etiqueta: c.etiqueta, codigo: json.codigo as string });
      setCopiado(false);
    }
  }

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
    } catch {
      setMensaje("No se ha podido copiar. Selecciónalo y cópialo a mano.");
    }
  }

  if (fase === "cargando") return <div className="min-h-dvh bg-bg" aria-busy="true" />;

  if (fase === "login" || fase === "error") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
        <form
          className="w-full max-w-sm space-y-4 rounded-xl border border-line bg-surface p-6 shadow-[var(--shadow-soft)]"
          onSubmit={(e) => {
            e.preventDefault();
            void login();
          }}
        >
          <NaraMark className="size-10" />
          <h1 className="font-display text-2xl font-semibold text-ink">Panel del piloto</h1>
          {fase === "error" ? (
            <p className="text-sm text-danger">{mensaje}</p>
          ) : (
            <>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña de administración"
                autoComplete="current-password"
                className={`${campo} w-full`}
              />
              {mensaje ? <p className="text-sm text-danger">{mensaje}</p> : null}
              <Button type="submit" className="w-full" disabled={!password}>
                Entrar
              </Button>
            </>
          )}
        </form>
      </div>
    );
  }

  const d = datos!;
  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <NaraMark className="size-8" />
          <h1 className="font-display text-lg font-semibold text-ink">Panel del piloto</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await llamar("POST", { accion: "logout" });
            setFase("login");
          }}
        >
          <LogOut className="size-4" /> Cerrar sesión
        </Button>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:px-6">
        {mensaje ? <p className="rounded-md bg-warn-soft px-3 py-2 text-sm text-warn">{mensaje}</p> : null}

        {/* ---------- Invitaciones y registros */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-ink">
            Invitaciones y registros{" "}
            {d.usuariosPendientes > 0 ? (
              <span className="ml-1 rounded-full bg-warn-soft px-2 py-0.5 text-sm text-warn">
                {d.usuariosPendientes} pendientes
              </span>
            ) : null}
          </h2>

          {nuevaInv ? (
            <div className="space-y-2 rounded-lg border border-teal bg-teal-mist p-4">
              <p className="text-sm text-teal-deep">
                Enlace de invitación para <strong>{nuevaInv.email}</strong> ({nuevaInv.rol}). Cópialo y envíaselo por un canal seguro.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="max-w-full break-all rounded-md bg-surface px-3 py-2 font-mono text-xs text-ink">
                  {typeof window !== "undefined" ? `${window.location.origin}/registro?token=${nuevaInv.token}` : `/registro?token=${nuevaInv.token}`}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void copiar(
                      `${window.location.origin}/registro?token=${nuevaInv.token}`,
                    )
                  }
                >
                  {copiado ? <Check className="size-4" /> : <Copy className="size-4" />} {copiado ? "Copiado" : "Copiar enlace"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setNuevaInv(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          ) : null}

          <form
            className="flex flex-wrap items-end gap-2 rounded-lg border border-line bg-surface p-4"
            onSubmit={(e) => {
              e.preventDefault();
              void invitar();
            }}
          >
            <label className="space-y-1 text-sm text-ink-soft">
              <span>Correo a invitar</span>
              <input
                type="email"
                value={invEmail}
                onChange={(e) => setInvEmail(e.target.value)}
                placeholder="persona@ejemplo.com"
                className={`${campo} block w-56`}
              />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>Rol</span>
              <select value={invRol} onChange={(e) => setInvRol(e.target.value)} className={`${campo} block w-44`}>
                <option value="estudiante">Estudiante</option>
                <option value="tecnico">Técnico</option>
                <option value="adjunto">Adjunto</option>
                <option value="farmaceutico">Farmacéutico</option>
                <option value="titular">Titular</option>
              </select>
            </label>
            <Button type="submit" disabled={!invEmail.trim()}>
              Crear invitación
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-ink">Solicitudes de registro</h3>
            <select
              value={filtroUsuarios}
              onChange={(e) => {
                setFiltroUsuarios(e.target.value);
                void cargar(filtro, e.target.value);
              }}
              className={campo}
            >
              <option value="pendiente">Pendientes</option>
              <option value="aprobado">Aprobados</option>
              <option value="rechazado">Rechazados</option>
              <option value="todos">Todos</option>
            </select>
          </div>

          {!d.usuarios?.length ? (
            <p className="text-sm text-muted">No hay usuarios en este filtro.</p>
          ) : (
            <ul className="space-y-2">
              {d.usuarios.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface p-4">
                  <div>
                    <p className="font-medium text-ink">
                      {u.nombre}{" "}
                      <span className="text-sm font-normal text-muted">({u.rol})</span>
                    </p>
                    <p className="text-sm text-ink-soft">{u.email}</p>
                    <p className="text-xs text-muted">
                      {fecha(u.creado)} · {u.estado}
                      {u.aprobado_en ? ` · aprobado ${fecha(u.aprobado_en)}` : ""}
                    </p>
                  </div>
                  {u.estado === "pendiente" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => void accion({ accion: "aprobar_usuario", id: u.id }, "Usuario aprobado.")}
                      >
                        Aceptar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void accion({ accion: "rechazar_usuario", id: u.id }, "Usuario rechazado.")}
                      >
                        Rechazar
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {d.invitaciones?.filter((i) => !i.usada).length ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-ink">Invitaciones sin usar</h3>
              <ul className="space-y-1 text-sm text-ink-soft">
                {d.invitaciones
                  .filter((i) => !i.usada)
                  .slice(0, 20)
                  .map((i) => (
                    <li key={i.id}>
                      {i.email} · {i.rol} · {fecha(i.creada)}
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </section>

        {/* ---------- Códigos */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
            <KeyRound className="size-5" /> Códigos de acceso
          </h2>

          {nuevo ? (
            <div className="space-y-2 rounded-lg border border-teal bg-teal-mist p-4">
              <p className="text-sm text-teal-deep">
                Código para <strong>{nuevo.etiqueta}</strong>. Cópialo ahora: no se vuelve a mostrar.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded-md bg-surface px-3 py-2 font-mono text-base tracking-wide text-ink">{nuevo.codigo}</code>
                <Button size="sm" variant="outline" onClick={() => void copiar(nuevo.codigo)}>
                  {copiado ? <Check className="size-4" /> : <Copy className="size-4" />} {copiado ? "Copiado" : "Copiar"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setNuevo(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          ) : null}

          <form
            className="flex flex-wrap items-end gap-2 rounded-lg border border-line bg-surface p-4"
            onSubmit={(e) => {
              e.preventDefault();
              void crear();
            }}
          >
            <label className="space-y-1 text-sm text-ink-soft">
              <span>Farmacia o persona</span>
              <input value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} maxLength={80} placeholder="Farmacia Ejemplo" className={`${campo} block w-56`} />
            </label>
            <label className="space-y-1 text-sm text-ink-soft">
              <span>Consultas al día</span>
              <input type="number" min={1} max={1000} value={limite} onChange={(e) => setLimite(e.target.value)} className={`${campo} block w-28`} />
            </label>
            <Button type="submit" disabled={!etiqueta.trim()}>
              Crear código
            </Button>
          </form>

          {d.codigos.length === 0 ? (
            <p className="text-sm text-muted">Aún no hay códigos. Crea uno para la primera farmacia del piloto.</p>
          ) : (
            <ul className="space-y-2">
              {d.codigos.map((c) => (
                <CodigoItem key={c.id} c={c} accion={accion} regenerar={regenerar} />
              ))}
            </ul>
          )}
        </section>

        {/* ---------- Asesorías (Nara Gestión) */}
        {d.erpActivo ? <SeccionAsesorias asesorias={d.asesorias} accion={accion} /> : null}

        {/* ---------- Solicitudes */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-ink">
            Solicitudes {d.nuevas > 0 ? <span className="ml-1 rounded-full bg-warn-soft px-2 py-0.5 text-sm text-warn">{d.nuevas} por atender</span> : null}
          </h2>
          {d.solicitudes.length === 0 ? (
            <p className="text-sm text-muted">Aún no hay solicitudes de informe ni de acompañamiento.</p>
          ) : (
            <ul className="space-y-3">
              {d.solicitudes.map((s) => (
                <SolicitudItem key={s.id} s={s} accion={accion} />
              ))}
            </ul>
          )}
        </section>

        {/* ---------- Valoraciones */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-semibold text-ink">
              Valoraciones {d.pendientes > 0 ? <span className="ml-1 rounded-full bg-warn-soft px-2 py-0.5 text-sm text-warn">{d.pendientes} pendientes</span> : null}
            </h2>
            <select
              value={filtro}
              onChange={(e) => {
                setFiltro(e.target.value);
                void cargar(e.target.value);
              }}
              className={campo}
            >
              {[...ESTADOS, "todas"].map((e) => (
                <option key={e} value={e}>
                  {e === "todas" ? "Todas" : e[0]!.toUpperCase() + e.slice(1) + "s"}
                </option>
              ))}
            </select>
          </div>
          {d.valoraciones.length === 0 ? (
            <p className="text-sm text-muted">No hay valoraciones en este estado.</p>
          ) : (
            <ul className="space-y-3">
              {d.valoraciones.map((v) => (
                <ValoracionItem key={v.id} v={v} accion={accion} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

type Accion = (body: Record<string, unknown>, okMsg?: string) => Promise<Record<string, unknown> | null>;

function CodigoItem({ c, accion, regenerar }: { c: Codigo; accion: Accion; regenerar: (c: Codigo) => Promise<void> }) {
  const [lim, setLim] = useState(String(c.limite_diario));
  return (
    <li className="space-y-3 rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-ink">
            {c.etiqueta}{" "}
            <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${c.activo ? "bg-teal-mist text-teal-deep" : "bg-danger-soft text-danger"}`}>
              {c.activo ? "Activo" : "Desactivado"}
            </span>
          </p>
          <p className="text-xs text-muted">
            Código terminado en <span className="font-mono">{c.pista}</span> · hoy {c.hoy}/{c.limite_diario} · {c.valoraciones} valoraciones · último uso {fecha(c.ultimo_uso)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void accion({ accion: "estado", id: c.id, activo: !c.activo })}>
            {c.activo ? "Desactivar" : "Activar"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => void regenerar(c)}>
            Regenerar código
          </Button>
        </div>
      </div>
      <form
        className="flex items-center gap-2 text-sm text-ink-soft"
        onSubmit={(e) => {
          e.preventDefault();
          void accion({ accion: "limite", id: c.id, limite: Number(lim) }, "Límite actualizado.");
        }}
      >
        <span>Consultas al día</span>
        <input type="number" min={1} max={1000} value={lim} onChange={(e) => setLim(e.target.value)} className={`${campo} w-24`} />
        <Button size="sm" type="submit" variant="ghost" disabled={Number(lim) === c.limite_diario}>
          Guardar
        </Button>
      </form>
    </li>
  );
}

function SeccionAsesorias({ asesorias, accion }: { asesorias: Asesoria[]; accion: Accion }) {
  const [f, setF] = useState({ nombre: "", adminNombre: "", adminEmail: "" });
  const [clave, setClave] = useState<{ titulo: string; clave: string } | null>(null);
  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-ink">Asesorías (Nara Gestión)</h2>
      {clave ? <ClaveTemporal titulo={clave.titulo} clave={clave.clave} onCerrar={() => setClave(null)} /> : null}
      <form className="flex flex-wrap items-end gap-2 rounded-lg border border-line bg-surface p-4" onSubmit={async (e) => {
        e.preventDefault();
        const r = await accion({ accion: "crear_asesoria", nombre: f.nombre, adminNombre: f.adminNombre, adminEmail: f.adminEmail });
        if (r?.passwordTemporal) { setClave({ titulo: `Asesoría creada. Acceso de ${f.adminEmail}.`, clave: r.passwordTemporal as string }); setF({ nombre: "", adminNombre: "", adminEmail: "" }); }
      }}>
        <label className="space-y-1 text-sm text-ink-soft"><span>Nombre de la asesoría</span><input className={`${campo} block w-52`} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></label>
        <label className="space-y-1 text-sm text-ink-soft"><span>Administrador</span><input className={`${campo} block w-44`} value={f.adminNombre} onChange={(e) => setF({ ...f, adminNombre: e.target.value })} /></label>
        <label className="space-y-1 text-sm text-ink-soft"><span>Correo del administrador</span><input className={`${campo} block w-56`} type="email" value={f.adminEmail} onChange={(e) => setF({ ...f, adminEmail: e.target.value })} /></label>
        <Button type="submit" disabled={f.nombre.trim().length < 2 || f.adminNombre.trim().length < 2 || !f.adminEmail}>Crear asesoría</Button>
      </form>
      {asesorias.length === 0 ? <p className="text-sm text-muted">Aún no hay asesorías.</p> : (
        <ul className="space-y-2">
          {asesorias.map((a) => (
            <li key={a.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface p-3 ${a.activa ? "" : "opacity-60"}`}>
              <div><p className="text-sm font-medium text-ink">{a.nombre} {a.activa ? null : <span className="ml-1 rounded-full bg-danger-soft px-2 py-0.5 text-xs text-danger">Suspendida</span>} <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${a.plan === "premium" ? "bg-teal-mist text-teal-deep" : "bg-bg text-muted"}`}>{a.plan === "premium" ? "Premium" : "Gratis"}</span></p><p className="text-xs text-muted">{a.farmacias} farmacias · {a.usuarios} usuarios · {a.admin_email}</p></div>
              <div className="flex gap-2">
                {a.admin_id ? <Button size="sm" variant="outline" onClick={async () => { if (!window.confirm("Se creará una contraseña temporal para el administrador de esta asesoría. ¿Continuar?")) return; const r = await accion({ accion: "reset_admin_asesoria", id: a.admin_id }); if (r?.passwordTemporal) setClave({ titulo: `Nueva contraseña temporal de ${a.admin_email}.`, clave: r.passwordTemporal as string }); }}>Restablecer contraseña</Button> : null}
                <Button size="sm" variant="outline" onClick={() => void accion({ accion: "plan_asesoria", id: a.id, plan: a.plan === "premium" ? "gratis" : "premium" })}>{a.plan === "premium" ? "Pasar a Gratis" : "Pasar a Premium"}</Button>
                <Button size="sm" variant="ghost" onClick={() => void accion({ accion: "estado_asesoria", id: a.id, activa: !a.activa })}>{a.activa ? "Suspender" : "Reactivar"}</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SolicitudItem({ s, accion }: { s: Solicitud; accion: Accion }) {
  const [nota, setNota] = useState(s.nota_admin ?? "");
  let datos = "";
  try {
    datos = s.datos ? JSON.stringify(JSON.parse(s.datos), null, 2) : "";
  } catch {
    datos = s.datos ?? "";
  }
  return (
    <li className="space-y-3 rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="rounded-full bg-teal-mist px-2 py-0.5 text-teal-deep">{s.tipo === "informe" ? "Informe de valoración" : "Gestión de la operación"}</span>
        <span className="rounded-full bg-bg px-2 py-0.5">{s.rol === "vendedor" ? "Vendedor" : "Comprador"}</span>
        <span>{fecha(s.creado)}</span>
      </div>
      <div className="space-y-0.5 text-sm text-ink">
        <p className="font-medium">{s.nombre}</p>
        <p>
          <a className="underline" href={`mailto:${s.email}`}>{s.email}</a>
          {s.telefono ? <> · <a className="underline" href={`tel:${s.telefono}`}>{s.telefono}</a></> : null}
          {s.ccaa ? <> · {s.ccaa}</> : null}
        </p>
      </div>
      {s.mensaje ? <p className="rounded-md bg-bg p-3 text-sm whitespace-pre-wrap text-ink-soft">{s.mensaje}</p> : null}
      {datos ? (
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-teal-deep">Ver los datos de la calculadora</summary>
          <pre className="mt-2 max-h-72 overflow-auto rounded-md bg-bg p-3 text-xs text-ink-soft">{datos}</pre>
        </details>
      ) : null}
      <div className="space-y-2 border-t border-line pt-3">
        <Textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2} maxLength={1000} placeholder="Tu nota interna…" className="min-h-14 resize-none text-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <select value={s.estado} onChange={(e) => void accion({ accion: "solicitud", id: s.id, estado: e.target.value, nota })} className={campo}>
            {(Object.keys(ESTADOS_SOLICITUD) as Solicitud["estado"][]).map((k) => (
              <option key={k} value={k}>{ESTADOS_SOLICITUD[k]}</option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={() => void accion({ accion: "solicitud", id: s.id, estado: s.estado, nota }, "Nota guardada.")}>Guardar nota</Button>
          <Button size="sm" variant="ghost" onClick={() => { if (window.confirm("¿Eliminar esta solicitud y sus datos? No se puede deshacer.")) void accion({ accion: "borrar_solicitud", id: s.id }); }}>Eliminar</Button>
        </div>
      </div>
    </li>
  );
}

function ValoracionItem({ v, accion }: { v: Valoracion; accion: Accion }) {
  const [nota, setNota] = useState(v.nota_admin ?? "");
  const [abierta, setAbierta] = useState(false);
  return (
    <li className="space-y-3 rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${v.valor === "util" ? "bg-teal-mist text-teal-deep" : "bg-danger-soft text-danger"}`}>
          {v.valor === "util" ? <ThumbsUp className="size-3" /> : <ThumbsDown className="size-3" />}
          {v.valor === "util" ? "Útil" : "Incorrecta"}
        </span>
        <span>{v.etiqueta ?? "código eliminado"}</span>
        <span>· {fecha(v.creado)}</span>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-subtle uppercase">Pregunta</p>
        <p className="text-sm whitespace-pre-wrap text-ink">{v.pregunta}</p>
      </div>
      {v.comentario ? (
        <div className="rounded-md bg-warn-soft px-3 py-2 text-sm text-warn">
          <span className="font-medium">Qué falla: </span>
          {v.comentario}
        </div>
      ) : null}
      <div className="space-y-1">
        <button type="button" className="text-xs font-medium text-teal-deep underline" onClick={() => setAbierta(!abierta)}>
          {abierta ? "Ocultar la respuesta de Nara" : "Ver la respuesta de Nara"}
        </button>
        {abierta ? <p className="max-h-72 overflow-y-auto rounded-md bg-bg p-3 text-sm whitespace-pre-wrap text-ink-soft">{v.respuesta}</p> : null}
      </div>
      <div className="space-y-2 border-t border-line pt-3">
        <Textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2} maxLength={1000} placeholder="Tu nota: qué hay que corregir y en qué documento…" className="min-h-14 resize-none text-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={v.estado}
            onChange={(e) => void accion({ accion: "valoracion", id: v.id, estado: e.target.value, nota })}
            className={campo}
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e[0]!.toUpperCase() + e.slice(1)}
              </option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={() => void accion({ accion: "valoracion", id: v.id, estado: v.estado, nota }, "Nota guardada.")}>
            Guardar nota
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (window.confirm("¿Eliminar esta valoración? No se puede deshacer.")) void accion({ accion: "borrar_valoracion", id: v.id });
            }}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </li>
  );
}
