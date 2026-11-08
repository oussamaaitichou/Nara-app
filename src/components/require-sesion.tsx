import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Estado =
  | { fase: "cargando" }
  | { fase: "ok" }
  | { fase: "redirigir" };

/**
 * Envuelve páginas de Nara / NaraGest.
 * Si el servidor exige login y no hay sesión → /login.
 */
export function RequireSesion({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<Estado>({ fase: "cargando" });

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch("/api/sesion", { credentials: "include" });
        const json = (await res.json()) as {
          requiereLogin?: boolean;
          autenticado?: boolean;
        };
        if (cancel) return;
        if (json.requiereLogin && !json.autenticado) {
          setEstado({ fase: "redirigir" });
          void navigate({ to: "/login" });
          return;
        }
        setEstado({ fase: "ok" });
      } catch {
        if (!cancel) setEstado({ fase: "ok" });
      }
    })();
    return () => {
      cancel = true;
    };
  }, [navigate]);

  if (estado.fase === "cargando" || estado.fase === "redirigir") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F7F8FC] text-sm text-slate-500">
        <Loader2 className="mr-2 size-4 animate-spin" />
        {estado.fase === "redirigir" ? "Redirigiendo a Acceso…" : "Comprobando acceso…"}
      </div>
    );
  }

  return <>{children}</>;
}
