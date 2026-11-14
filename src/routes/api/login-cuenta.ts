import { createFileRoute } from "@tanstack/react-router";
import { COOKIE_ERP, errorConfiguracion, erpActivo } from "@/lib/piloto/config.server";
import { cookieSet, pausa } from "@/lib/piloto/sesion.server";
import { auditar, falloLogin, loginOk, usuarioCtx, usuarioPorEmail } from "@/lib/erp/db.server";
import { rutaPorPlan } from "@/lib/acceso-plan";
import { crearSesionErp, verificarPassword, verificacionFalsa } from "@/lib/erp/auth.server";

const CATORCE_DIAS = 60 * 60 * 24 * 14;

export const Route = createFileRoute("/api/login-cuenta")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!erpActivo()) {
          return Response.json({ error: "El acceso por cuenta no está activado." }, { status: 403 });
        }
        if (errorConfiguracion()) {
          return Response.json({ error: "Configuración incompleta." }, { status: 503 });
        }

        let identificador = "";
        let password = "";
        try {
          const body = (await request.json()) as { identificador?: unknown; password?: unknown };
          identificador = typeof body.identificador === "string" ? body.identificador.slice(0, 120) : "";
          password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
        } catch {
          return Response.json({ error: "Petición no válida." }, { status: 400 });
        }

        if (identificador.trim().length < 2 || !password) {
          return Response.json({ error: "Indica usuario y contraseña." }, { status: 400 });
        }

        try {
          const filaBase = await usuarioPorEmail(identificador.trim());
          const rechazo = async (id?: number) => {
            if (id) await falloLogin(id);
            else await verificacionFalsa(password);
            await pausa(600);
            return Response.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
          };

          if (!filaBase) return rechazo();
          if (filaBase.bloqueado) {
            return Response.json(
              { error: "Cuenta bloqueada temporalmente. Prueba en 15 minutos." },
              { status: 429 },
            );
          }
          if (!(await verificarPassword(password, filaBase.pass_hash))) {
            await auditar(filaBase.id, filaBase.asesoria_id, "login_fallido");
            return rechazo(filaBase.id);
          }
          if (!filaBase.activo || !filaBase.asesoria_activa) return rechazo();

          await loginOk(filaBase.id);
          await auditar(filaBase.id, filaBase.asesoria_id, "login");
          const u = await usuarioCtx(filaBase.id);
          const plan = (u?.plan as string) || "gratis";
          const token = await crearSesionErp(filaBase.id, filaBase.version);

          return Response.json(
            {
              ok: true,
              plan,
              destino: rutaPorPlan(plan),
              usuario: u
                ? { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol }
                : { id: filaBase.id, nombre: "", email: identificador.trim() },
            },
            { headers: { "Set-Cookie": cookieSet(request, COOKIE_ERP, token, CATORCE_DIAS) } },
          );
        } catch (e) {
          console.error("[login-cuenta]", e);
          return Response.json({ error: "No se ha podido iniciar sesión." }, { status: 503 });
        }
      },
    },
  },
});
