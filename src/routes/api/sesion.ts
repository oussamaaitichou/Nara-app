import { createFileRoute } from "@tanstack/react-router";
import { accesoActivo, erpActivo } from "@/lib/piloto/config.server";
import { sesionDe } from "@/lib/piloto/sesion.server";
import { sesionErp } from "@/lib/erp/auth.server";
import { usuarioCtx } from "@/lib/erp/db.server";
import { estadoUso } from "@/lib/piloto/db.server";

/** true = hay que estar autenticado. Solo se abre con CONTROL_ACCESO=no|abierto (desarrollo). */
function debeExigirLogin(): boolean {
  const v = process.env.CONTROL_ACCESO?.trim().toLowerCase();
  if (v === "no" || v === "abierto" || v === "off" || v === "0") return false;
  // Por defecto: cerrado. También si ERP o piloto están activos.
  return true;
}

export const Route = createFileRoute("/api/sesion")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requiereLogin = debeExigirLogin();

        try {
          if (erpActivo()) {
            const sid = await sesionErp(request);
            if (sid) {
              const u = await usuarioCtx(sid.uid);
              if (u && u.version === sid.v) {
                return Response.json({
                  requiereLogin,
                  autenticado: true,
                  tipo: "cuenta",
                  etiqueta: u.nombre,
                  plan: u.plan ?? "gratis",
                  rol: u.rol,
                });
              }
            }
          }
        } catch (e) {
          console.error("[sesion] erp", e);
        }

        try {
          if (accesoActivo()) {
            const ses = await sesionDe(request);
            if (ses) {
              const est = await estadoUso(ses.cid);
              if (est && est.activo && est.generacion === ses.gen) {
                return Response.json({
                  requiereLogin,
                  autenticado: true,
                  tipo: "piloto",
                  etiqueta: est.etiqueta,
                  plan: est.plan,
                });
              }
            }
          }
        } catch (e) {
          console.error("[sesion] piloto", e);
        }

        return Response.json({
          requiereLogin,
          autenticado: false,
          tipo: null,
        });
      },
    },
  },
});
