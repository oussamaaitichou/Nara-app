import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { NaraMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Panel del piloto — Nara" }, { name: "robots", content: "noindex, nofollow" }],
  }),
});

const campo =
  "h-10 rounded-md border border-line bg-bg px-3 text-sm text-ink outline-none focus:border-teal w-full";

const EMAIL_OK = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

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
  const [password, setPassword] = useState("");
  const [erpActivo, setErpActivo] = useState(false);
  const [asesorias, setAsesorias] = useState<Asesoria[]>([]);

  const [nombreAsesoria, setNombreAsesoria] = useState("");
  const [emailAdmin, setEmailAdmin] = useState("");
  const [nombreAdmin, setNombreAdmin] = useState("");
  const [creando, setCreando] = useState(false);
  const [passTemporal, setPassTemporal] = useState<string | null>(null);
  const [emailCreado, setEmailCreado] = useState<string | null>(null);

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

  async function login() {
    setMensaje(null);
    if (password.length < 8) {
      setMensaje("La contraseña de admin debe tener al menos 8 caracteres.");
      return;
    }
    const r = await llamar("POST", { accion: "login", password });
    if (!r.ok) {
      setMensaje((r.json.error as string) ?? "No se ha podido iniciar sesión.");
      return;
    }
    setPassword("");
    await cargar();
  }

  function validarAlta(): string | null {
    const nombre = nombreAsesoria.trim();
    const email = emailAdmin.trim().toLowerCase();
    const admin = nombreAdmin.trim();
    if (nombre.length < 2) return "El nombre de la asesoría debe tener al menos 2 caracteres.";
    if (admin.length < 2) return "El nombre del admin debe tener al menos 2 caracteres.";
    if (!EMAIL_OK.test(email)) return "Indica un email válido (ej. nombre@dominio.com).";
    return null;
  }

  async function crearAsesoria() {
    setMensaje(null);
    setPassTemporal(null);
    setEmailCreado(null);
    const error = validarAlta();
    if (error) {
      setMensaje(error);
      return;
    }
    setCreando(true);
    try {
      const r = await llamar("POST", {
        accion: "crear_asesoria",
        nombre: nombreAsesoria.trim(),
        adminEmail: emailAdmin.trim().toLowerCase(),
        adminNombre: nombreAdmin.trim(),
      });
      if (!r.ok) {
        setMensaje((r.json.error as string) ?? "No se pudo crear la asesoría.");
        return;
      }
      const pass = (r.json.passwordTemporal as string) ?? null;
      setPassTemporal(pass);
      setEmailCreado(emailAdmin.trim().toLowerCase());
      setNombreAsesoria("");
      setEmailAdmin("");
      setNombreAdmin("");
      setMensaje("Asesoría creada. Guarda la contraseña temporal.");
      await cargar();
    } finally {
      setCreando(false);
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
                className={campo}
                minLength={8}
                required
              />
              {mensaje ? <p className="text-sm text-danger">{mensaje}</p> : null}
              <Button type="submit" className="w-full" disabled={password.length < 8}>
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
          ERP: {erpActivo ? "activo" : "apagado"}. Crea la cuenta de prueba y usa la contraseña temporal en /login.
        </p>

        {mensaje ? <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink">{mensaje}</p> : null}

        {passTemporal ? (
          <div className="rounded-xl border border-teal/40 bg-surface p-4 space-y-2">
            <p className="font-medium text-ink">Cuenta lista para probar</p>
            <p className="text-sm text-muted">
              Email / usuario: <strong className="text-ink">{emailCreado}</strong>
            </p>
            <p className="text-sm text-muted">
              Contraseña temporal:{" "}
              <code className="rounded bg-bg px-2 py-0.5 text-ink font-mono text-base">{passTemporal}</code>
            </p>
            <p className="text-xs text-muted">
              Entra en <a className="text-teal underline" href="/login">/login</a> (modo cuenta).
            </p>
          </div>
        ) : null}

        <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
          <h2 className="font-display text-xl font-semibold text-ink">Crear asesoría + admin</h2>
          <input
            className={campo}
            placeholder="Nombre de la asesoría (mín. 2)"
            value={nombreAsesoria}
            onChange={(e) => setNombreAsesoria(e.target.value)}
            minLength={2}
            maxLength={120}
            required
          />
          <input
            className={campo}
            type="email"
            placeholder="Email del admin (login)"
            value={emailAdmin}
            onChange={(e) => setEmailAdmin(e.target.value)}
            maxLength={254}
            required
          />
          <input
            className={campo}
            placeholder="Nombre del admin (mín. 2)"
            value={nombreAdmin}
            onChange={(e) => setNombreAdmin(e.target.value)}
            minLength={2}
            maxLength={120}
            required
          />
          <Button type="button" disabled={creando} onClick={() => void crearAsesoria()} className="w-full">
            {creando ? "Creando…" : "Crear y generar contraseña"}
          </Button>
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
