import { createFileRoute } from "@tanstack/react-router";
import { accesoActivo, erpActivo, COOKIE_ERP, COOKIE_SESION } from "@/lib/piloto/config.server";
import { sesionDe } from "@/lib/piloto/sesion.server";
import { sesionErp } from "@/lib/erp/auth.server";
import { usuarioCtx } from "@/lib/erp/db.server";
import { estadoUso } from "@/lib/piloto/db.server";

/**
 * Estado de sesión unificado para control de acceso.
 * CONTROL_ACCESO=si fuerza login siempre.
 * Si no, se exige login cuando ERP_ACTIVO o PILOTO_ACCESO están activos.
 */
export const Route = createFileRoute("/api/sesion")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const control =
          process.env.CONTROL_ACCESO?.trim().toLowerCase() === "si" ||
          process.env.CONTROL_ACCESO?.trim().toLowerCase() === "activo";
        const requiereLogin = control || erpActivo() || accesoActivo();

        // Sesión ERP (usuario/contraseña)
        try {
          if (erpActivo()) {
            const sid = await sesionErp(request);
            if (sid) {
              const u = await usuarioCtx(sid.userId);
              if (u) {
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

        // Sesión piloto (código)
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
