import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Building2, KeyRound, LogOut } from "lucide-react";
import { NaraMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ClaveTemporal, ROL, campo, erp, type Perfil, type Rol } from "@/components/erp/comun";
import { FarmaciaPanel } from "@/components/erp/farmacia-panel";

export const Route = createFileRoute("/erp")({
  component: ErpPage,
  head: () => ({ meta: [{ title: "Nara — Gestión" }, { name: "robots", content: "noindex, nofollow" }] }),
});

type Farmacia = { id: number; nombre: string; ccaa: string | null; titular: string | null; activa: boolean; meses: number };
type Usuario = { id: number; email: string; nombre: string; rol: Rol; activo: boolean; farmacia: string | null; ultimo_acceso: string | null };

function Marco({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh items-center justify-center bg-bg px-4"><div className="w-full max-w-sm space-y-4 rounded-xl border border-line bg-surface p-6 shadow-[var(--shadow-soft)]">{children}</div></div>;
}

function Login({ onOk }: { onOk: () => void }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Marco>
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setError(null);
        const r = await erp("POST", { accion: "login", email, password: pass });
        setBusy(false);
        if (r.ok) onOk(); else setError((r.json.error as string) ?? "No se ha podido entrar.");
      }}>
        <NaraMark className="size-10" />
        <h1 className="font-display text-2xl font-semibold text-ink">Acceso a Nara Gestión</h1>
        <input className={campo} type="email" autoComplete="username" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={campo} type="password" autoComplete="current-password" placeholder="Contraseña" value={pass} onChange={(e) => setPass(e.target.value)} required />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</Button>
        <p className="text-xs text-subtle">¿Sin acceso? Pídelo a tu asesoría.</p>
      </form>
    </Marco>
  );
}

function CambiarPassword({ forzado, onHecho, onCancelar }: { forzado: boolean; onHecho: () => void; onCancelar?: () => void }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repite, setRepite] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <Marco>
      <form className="space-y-3" onSubmit={async (e) => {
        e.preventDefault();
        if (nueva !== repite) return setError("Las contraseñas nuevas no coinciden.");
        const r = await erp("POST", { accion: "cambiar_password", actual, nueva });
        if (r.ok) onHecho(); else setError((r.json.error as string) ?? "No se ha podido cambiar.");
      }}>
        <h1 className="font-display text-xl font-semibold text-ink">{forzado ? "Elige tu contraseña" : "Cambiar contraseña"}</h1>
        {forzado ? <p className="text-sm text-muted">Estás usando una contraseña temporal. Elige una propia para continuar.</p> : null}
        <input className={campo} type="password" autoComplete="current-password" placeholder={forzado ? "Contraseña temporal" : "Contraseña actual"} value={actual} onChange={(e) => setActual(e.target.value)} required />
        <input className={campo} type="password" autoComplete="new-password" placeholder="Contraseña nueva (mín. 10, con letras y números)" value={nueva} onChange={(e) => setNueva(e.target.value)} required />
        <input className={campo} type="password" autoComplete="new-password" placeholder="Repite la contraseña nueva" value={repite} onChange={(e) => setRepite(e.target.value)} required />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex gap-2"><Button type="submit" className="flex-1">Guardar</Button>{onCancelar ? <Button type="button" variant="ghost" onClick={onCancelar}>Cancelar</Button> : null}</div>
      </form>
    </Marco>
  );
}

function Clientes({ onAbrir, esAdmin }: { onAbrir: (f: Farmacia) => void; esAdmin: boolean }) {
  const [lista, setLista] = useState<Farmacia[]>([]);
  const [nombre, setNombre] = useState("");
  const [ccaa, setCcaa] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cargar = useCallback(async () => { const r = await erp("GET", undefined, "?r=farmacias"); if (r.ok) setLista(r.json.farmacias); }, []);
  useEffect(() => void cargar(), [cargar]);
  return (
    <div className="space-y-4">
      <form className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-4" onSubmit={async (e) => {
        e.preventDefault();
        const r = await erp("POST", { accion: "crear_farmacia", nombre, ccaa });
        if (r.ok) { setNombre(""); setCcaa(""); setError(null); await cargar(); } else setError((r.json.error as string) ?? "No se ha podido crear.");
      }}>
        <label className="space-y-1 text-sm text-ink-soft"><span>Nueva farmacia cliente</span><input className={`${campo} w-64`} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la farmacia" maxLength={120} /></label>
        <label className="space-y-1 text-sm text-ink-soft"><span>Comunidad autónoma</span><input className={`${campo} w-52`} value={ccaa} onChange={(e) => setCcaa(e.target.value)} maxLength={60} /></label>
        <Button type="submit" disabled={nombre.trim().length < 2}>Añadir</Button>
        {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
      </form>
      {lista.length === 0 ? <p className="text-sm text-muted">Aún no hay farmacias. Añade la primera.</p> : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {lista.map((f) => (
            <li key={f.id} className={`rounded-xl border border-line bg-surface p-4 ${f.activa ? "" : "opacity-60"}`}>
              <button type="button" className="w-full text-left" onClick={() => onAbrir(f)} disabled={!f.activa}>
                <p className="flex items-center gap-2 font-medium text-ink"><Building2 className="size-4 text-teal" /> {f.nombre}</p>
                <p className="text-sm text-muted">{f.ccaa ?? "Sin comunidad"} · {f.meses} meses de datos{f.activa ? "" : " · desactivada"}</p>
              </button>
              {esAdmin ? <button type="button" className="mt-2 text-xs text-subtle underline" onClick={async () => { await erp("POST", { accion: "estado_farmacia", id: f.id, activa: !f.activa }); await cargar(); }}>{f.activa ? "Desactivar" : "Reactivar"}</button> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Usuarios() {
  const [lista, setLista] = useState<Usuario[]>([]);
  const [farmacias, setFarmacias] = useState<Farmacia[]>([]);
  const [f, setF] = useState({ email: "", nombre: "", rol: "cliente" as "cliente" | "asesoria_staff", farmaciaId: "" });
  const [clave, setClave] = useState<{ titulo: string; clave: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cargar = useCallback(async () => {
    const [u, fa] = await Promise.all([erp("GET", undefined, "?r=usuarios"), erp("GET", undefined, "?r=farmacias")]);
    if (u.ok) setLista(u.json.usuarios);
    if (fa.ok) setFarmacias(fa.json.farmacias);
  }, []);
  useEffect(() => void cargar(), [cargar]);
  return (
    <div className="space-y-4">
      {clave ? <ClaveTemporal titulo={clave.titulo} clave={clave.clave} onCerrar={() => setClave(null)} /> : null}
      <form className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-4" onSubmit={async (e) => {
        e.preventDefault();
        const r = await erp("POST", { accion: "crear_usuario", email: f.email, nombre: f.nombre, rol: f.rol, farmaciaId: f.rol === "cliente" ? Number(f.farmaciaId) : undefined });
        if (!r.ok) return setError((r.json.error as string) ?? "No se ha podido crear.");
        setError(null); setClave({ titulo: `Usuario creado: ${f.email}.`, clave: r.json.passwordTemporal });
        setF({ ...f, email: "", nombre: "" }); await cargar();
      }}>
        <label className="space-y-1 text-sm text-ink-soft"><span>Nombre</span><input className={`${campo} w-44`} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></label>
        <label className="space-y-1 text-sm text-ink-soft"><span>Correo</span><input className={`${campo} w-56`} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label className="space-y-1 text-sm text-ink-soft"><span>Tipo</span>
          <select className={`${campo} w-40`} value={f.rol} onChange={(e) => setF({ ...f, rol: e.target.value as "cliente" | "asesoria_staff" })}><option value="cliente">Cliente (farmacia)</option><option value="asesoria_staff">Gestor de la asesoría</option></select></label>
        {f.rol === "cliente" ? (
          <label className="space-y-1 text-sm text-ink-soft"><span>Farmacia</span>
            <select className={`${campo} w-52`} value={f.farmaciaId} onChange={(e) => setF({ ...f, farmaciaId: e.target.value })}><option value="">Elige…</option>{farmacias.filter((x) => x.activa).map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select></label>
        ) : null}
        <Button type="submit" disabled={!f.email || f.nombre.trim().length < 2 || (f.rol === "cliente" && !f.farmaciaId)}>Crear usuario</Button>
        {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
      </form>
      <ul className="space-y-2">
        {lista.map((u) => (
          <li key={u.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface p-3 ${u.activo ? "" : "opacity-60"}`}>
            <div><p className="text-sm font-medium text-ink">{u.nombre} <span className="ml-1 rounded-full bg-bg px-2 py-0.5 text-xs text-muted">{ROL[u.rol]}</span></p><p className="text-xs text-muted">{u.email}{u.farmacia ? ` · ${u.farmacia}` : ""}</p></div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={async () => { if (!window.confirm(`Se creará una contraseña temporal para ${u.email} y su sesión se cerrará. ¿Continuar?`)) return; const r = await erp("POST", { accion: "reset_password", id: u.id }); if (r.ok) setClave({ titulo: `Nueva contraseña temporal de ${u.email}.`, clave: r.json.passwordTemporal }); }}><KeyRound className="size-4" /> Restablecer</Button>
              <Button size="sm" variant="ghost" onClick={async () => { const r = await erp("POST", { accion: "estado_usuario", id: u.id, activo: !u.activo }); if (r.ok) await cargar(); else setError((r.json.error as string) ?? null); }}>{u.activo ? "Desactivar" : "Activar"}</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiAsesoria({ perfil, onCambio }: { perfil: Perfil; onCambio: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="max-w-xl space-y-4 rounded-xl border border-line bg-surface p-5">
      <h2 className="font-display text-lg font-semibold text-ink">Logo de {perfil.asesoria.nombre}</h2>
      <p className="text-sm text-muted">Aparecerá junto a la marca Nara en la pantalla y en los informes que imprimas para tus clientes. PNG, JPG o WebP de menos de 150 KB.</p>
      {perfil.asesoria.logo ? <img src={perfil.asesoria.logo} alt="Logo actual" className="max-h-20 max-w-60 rounded border border-line bg-white p-2 object-contain" /> : <p className="text-sm text-subtle">Todavía no has subido ningún logo.</p>}
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex h-9 cursor-pointer items-center rounded-md bg-teal px-3 text-sm font-medium text-white">
          Subir logo
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0]; e.target.value = "";
            if (!file) return;
            if (file.size > 150_000) return setMsg("El archivo pesa demasiado (máximo 150 KB).");
            const lector = new FileReader();
            lector.onload = async () => { const r = await erp("POST", { accion: "logo", dataUrl: lector.result }); setMsg(r.ok ? "Logo guardado." : ((r.json.error as string) ?? "No se ha podido guardar.")); if (r.ok) onCambio(); };
            lector.readAsDataURL(file);
          }} />
        </label>
        {perfil.asesoria.logo ? <Button variant="ghost" onClick={async () => { await erp("POST", { accion: "quitar_logo" }); onCambio(); }}>Quitar logo</Button> : null}
      </div>
      {msg ? <p className="text-sm text-muted">{msg}</p> : null}
    </div>
  );
}

function ErpPage() {
  const [perfil, setPerfil] = useState<Perfil | null | undefined>(undefined);
  const [disponible, setDisponible] = useState(true);
  const [cambiando, setCambiando] = useState(false);
  const [vista, setVista] = useState<"clientes" | "usuarios" | "asesoria">("clientes");
  const [abierta, setAbierta] = useState<{ id: number; nombre: string } | null>(null);

  const cargar = useCallback(async () => {
    const r = await erp("GET", undefined, "?r=yo");
    if (r.status === 404) return setDisponible(false);
    setPerfil(r.ok ? (r.json as unknown as Perfil) : null);
  }, []);
  useEffect(() => void cargar(), [cargar]);

  if (!disponible) return <Marco><NaraMark className="size-10" /><p className="text-ink">Nara Gestión todavía no está disponible.</p></Marco>;
  if (perfil === undefined) return <div className="min-h-dvh bg-bg" aria-busy="true" />;
  if (perfil === null) return <Login onOk={() => void cargar()} />;
  if (perfil.usuario.debeCambiar) return <CambiarPassword forzado onHecho={() => void cargar()} />;
  if (cambiando) return <CambiarPassword forzado={false} onHecho={() => { setCambiando(false); void cargar(); }} onCancelar={() => setCambiando(false)} />;

  const u = perfil.usuario;
  const asesoria = u.rol !== "cliente";
  const sesionPerdida = () => { setAbierta(null); setPerfil(null); };
  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 sm:px-6 print:hidden">
        <div className="flex items-center gap-3">
          <NaraMark className="size-8" />
          <span className="font-display text-lg font-semibold text-ink">Nara</span>
          <span className="text-subtle">×</span>
          {perfil.asesoria.logo ? <img src={perfil.asesoria.logo} alt={perfil.asesoria.nombre} className="max-h-9 max-w-36 object-contain" /> : <span className="text-sm font-medium text-ink-soft">{perfil.asesoria.nombre}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted sm:inline">{u.nombre} · {ROL[u.rol]}</span>
          <Button variant="ghost" size="sm" onClick={() => setCambiando(true)}><KeyRound className="size-4" /> Contraseña</Button>
          <Button variant="ghost" size="sm" onClick={async () => { await erp("POST", { accion: "logout" }); sesionPerdida(); }}><LogOut className="size-4" /> Salir</Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {!asesoria ? (
          u.farmaciaId ? <FarmaciaPanel farmaciaId={u.farmaciaId} perfil={perfil} onSesion={sesionPerdida} /> : <p className="text-muted">Tu usuario no tiene ninguna farmacia asignada. Contacta con tu asesoría.</p>
        ) : abierta ? (
          <>
            <Button variant="ghost" size="sm" className="print:hidden" onClick={() => setAbierta(null)}><ArrowLeft className="size-4" /> Volver a clientes</Button>
            <FarmaciaPanel farmaciaId={abierta.id} perfil={perfil} onSesion={sesionPerdida} />
          </>
        ) : (
          <>
            <div role="tablist" className="inline-flex rounded-lg border border-line bg-surface p-1">
              {([["clientes", "Clientes"], ...(u.rol === "asesoria_admin" ? [["usuarios", "Usuarios"], ["asesoria", "Mi asesoría"]] : [])] as [typeof vista, string][]).map(([k, t]) => (
                <button key={k} role="tab" aria-selected={vista === k} type="button" onClick={() => setVista(k)} className={`rounded-md px-4 py-1.5 text-sm font-medium ${vista === k ? "bg-teal text-white" : "text-ink-soft"}`}>{t}</button>
              ))}
            </div>
            {vista === "clientes" ? <Clientes esAdmin={u.rol === "asesoria_admin"} onAbrir={(f) => setAbierta({ id: f.id, nombre: f.nombre })} /> : null}
            {vista === "usuarios" ? <Usuarios /> : null}
            {vista === "asesoria" ? <MiAsesoria perfil={perfil} onCambio={() => void cargar()} /> : null}
          </>
        )}
      </main>
    </div>
  );
}
