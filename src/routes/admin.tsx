import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut } from "lucide-react";
import { NaraMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  adminLoginSchema,
  crearAsesoriaSchema,
  type AdminLoginInput,
  type CrearAsesoriaInput,
} from "@/lib/auth/forms";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Panel del piloto — Nara" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

const campo =
  "h-10 rounded-md border border-line bg-bg px-3 text-sm text-ink outline-none focus:border-teal w-full";
const errorCls = "text-xs text-danger";

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
    /* sin cuerpo */
  }
  return { ok: res.ok, status: res.status, json };
}

type Asesoria = {
  id: number;
  nombre: string;
  activa: boolean;
  plan: string;
  admin_email: string | null;
  farmacias: number;
  usuarios: number;
};

function AdminPage() {
  const [fase, setFase] = useState<"cargando" | "login" | "panel" | "error">("cargando");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [erpActivo, setErpActivo] = useState(false);
  const [asesorias, setAsesorias] = useState<Asesoria[]>([]);
  const [passTemporal, setPassTemporal] = useState<string | null>(null);
  const [emailCreado, setEmailCreado] = useState<string | null>(null);

  const loginForm = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { password: "" },
  });

  const altaForm = useForm<CrearAsesoriaInput>({
    resolver: zodResolver(crearAsesoriaSchema),
    defaultValues: { nombre: "", adminEmail: "", adminNombre: "" },
  });

  const cargar = useCallback(async () => {
    const r = await llamar("GET");
    if (r.status === 401) return setFase("login");
    if (!r.ok) {
      setMensaje((r.json.error as string) ?? "No se han podido cargar los datos.");
      return setFase("error");
    }
    setErpActivo(!!r.json.erpActivo);
    setAsesorias((r.json.asesorias as Asesoria[]) ?? []);
    setFase("panel");
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function onLogin(data: AdminLoginInput) {
    setMensaje(null);
    const r = await llamar("POST", { accion: "login", password: data.password });
    if (!r.ok) {
      setMensaje((r.json.error as string) ?? "No se ha podido iniciar sesión.");
      return;
    }
    loginForm.reset();
    await cargar();
  }

  async function onCrear(data: CrearAsesoriaInput) {
    setMensaje(null);
    setPassTemporal(null);
    setEmailCreado(null);
    const r = await llamar("POST", {
      accion: "crear_asesoria",
      nombre: data.nombre,
      adminEmail: data.adminEmail,
      adminNombre: data.adminNombre,
    });
    if (!r.ok) {
      setMensaje((r.json.error as string) ?? "No se pudo crear la asesoría.");
      return;
    }
    setPassTemporal((r.json.passwordTemporal as string) ?? null);
    setEmailCreado(data.adminEmail);
    altaForm.reset();
    setMensaje("Asesoría creada. Guarda la contraseña temporal.");
    await cargar();
  }

  if (fase === "cargando") return <div className="min-h-dvh bg-bg" aria-busy="true" />;

  if (fase === "login" || fase === "error") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
        <form
          className="w-full max-w-sm space-y-4 rounded-xl border border-line bg-surface p-6 shadow-[var(--shadow-soft)]"
          onSubmit={loginForm.handleSubmit((d) => void onLogin(d))}
          noValidate
        >
          <NaraMark className="size-10" />
          <h1 className="font-display text-2xl font-semibold text-ink">Panel del piloto</h1>
          {fase === "error" ? (
            <p className="text-sm text-danger">{mensaje}</p>
          ) : (
            <>
              <div className="space-y-1">
                <input
                  type="password"
                  placeholder="Contraseña de administración"
                  autoComplete="current-password"
                  className={campo}
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password ? (
                  <p className={errorCls}>{loginForm.formState.errors.password.message}</p>
                ) : null}
              </div>
              {mensaje ? <p className="text-sm text-danger">{mensaje}</p> : null}
              <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                Entrar
              </Button>
            </>
          )}
        </form>
      </div>
    );
  }

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

      <main className="mx-auto max-w-xl space-y-8 px-4 py-8">
        <p className="text-sm text-muted">
          ERP: {erpActivo ? "activo" : "apagado"}. Validación con Zod + react-hook-form.
        </p>

        {mensaje ? <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink">{mensaje}</p> : null}

        {passTemporal ? (
          <div className="space-y-2 rounded-xl border border-teal/40 bg-surface p-4">
            <p className="font-medium text-ink">Cuenta lista para probar</p>
            <p className="text-sm text-muted">
              Email / usuario: <strong className="text-ink">{emailCreado}</strong>
            </p>
            <p className="text-sm text-muted">
              Contraseña temporal:{" "}
              <code className="rounded bg-bg px-2 py-0.5 font-mono text-base text-ink">{passTemporal}</code>
            </p>
            <p className="text-xs text-muted">
              Entra en{" "}
              <a className="text-teal underline" href="/login">
                /login
              </a>{" "}
              (modo cuenta).
            </p>
          </div>
        ) : null}

        <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
          <h2 className="font-display text-xl font-semibold text-ink">Crear asesoría + admin</h2>
          <form className="space-y-3" onSubmit={altaForm.handleSubmit((d) => void onCrear(d))} noValidate>
            <div className="space-y-1">
              <input className={campo} placeholder="Nombre de la asesoría" {...altaForm.register("nombre")} />
              {altaForm.formState.errors.nombre ? (
                <p className={errorCls}>{altaForm.formState.errors.nombre.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <input
                className={campo}
                type="email"
                placeholder="Email del admin (login)"
                {...altaForm.register("adminEmail")}
              />
              {altaForm.formState.errors.adminEmail ? (
                <p className={errorCls}>{altaForm.formState.errors.adminEmail.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <input className={campo} placeholder="Nombre del admin" {...altaForm.register("adminNombre")} />
              {altaForm.formState.errors.adminNombre ? (
                <p className={errorCls}>{altaForm.formState.errors.adminNombre.message}</p>
              ) : null}
            </div>
            <Button type="submit" className="w-full" disabled={altaForm.formState.isSubmitting}>
              {altaForm.formState.isSubmitting ? "Creando…" : "Crear y generar contraseña"}
            </Button>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">Asesorías</h2>
          {asesorias.length === 0 ? (
            <p className="text-sm text-muted">Aún no hay asesorías.</p>
          ) : (
            <ul className="space-y-2">
              {asesorias.map((a) => (
                <li key={a.id} className="rounded-lg border border-line bg-surface p-3 text-sm">
                  <span className="font-medium text-ink">{a.nombre}</span>
                  <span className="ml-2 text-muted">
                    {a.plan} · {a.usuarios} usuarios · {a.admin_email ?? "sin email"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
