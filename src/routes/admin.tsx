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
    /* sin cuerpo */
  }
  return { ok: res.ok, status: res.status, json };
}

function AdminPage() {
  const [fase, setFase] = useState<"cargando" | "login" | "panel" | "error">("cargando");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [erpActivo, setErpActivo] = useState(false);
  const [asesorias, setAsesorias] = useState<
    { id: number; nombre: string; activa: boolean; plan: string; admin_email: string | null; farmacias: number; usuarios: number }[]
  >([]);

  const cargar = useCallback(async () => {
    const r = await llamar("GET");
    if (r.status === 401) return setFase("login");
    if (!r.ok) {
      setMensaje((r.json.error as string) ?? "No se han podido cargar los datos.");
      return setFase("error");
    }
    setErpActivo(!!r.json.erpActivo);
    setAsesorias((r.json.asesorias as typeof asesorias) ?? []);
    setFase("panel");
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function login() {
    setMensaje(null);
    const r = await llamar("POST", { accion: "login", password });
    if (!r.ok) {
      setMensaje((r.json.error as string) ?? "No se ha podido iniciar sesión.");
      return;
    }
    setPassword("");
    await cargar();
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
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <p className="text-sm text-muted">
          Panel restaurado (versión estable). ERP: {erpActivo ? "activo" : "apagado"}.
        </p>
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">Asesorías</h2>
          {asesorias.length === 0 ? (
            <p className="text-sm text-muted">Aún no hay asesorías o ERP no está activo.</p>
          ) : (
            <ul className="space-y-2">
              {asesorias.map((a) => (
                <li key={a.id} className="rounded-lg border border-line bg-surface p-3 text-sm">
                  <span className="font-medium text-ink">{a.nombre}</span>
                  <span className="ml-2 text-muted">
                    {a.plan} · {a.usuarios} usuarios · {a.admin_email}
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
