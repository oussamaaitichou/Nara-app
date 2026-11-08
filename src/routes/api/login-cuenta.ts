import { createFileRoute } from "@tanstack/react-router";
import { COOKIE_ERP, erpActivo, errorConfiguracion } from "@/lib/piloto/config.server";
import { cookieSet, pausa } from "@/lib/piloto/sesion.server";
import { crearSesionErp, verificarPassword, verificacionFalsa } from "@/lib/erp/auth.server";
import { auditar, falloLogin, loginOk, usuarioCtx } from "@/lib/erp/db.server";
import { usuarioPorIdentificador } from "@/lib/erp/login-id.server";
import { rutaPorPlan } from "@/lib/acceso-plan";

const DOCE_HORAS = 60 * 60 * 12;

export const Route = createFileRoute("/api/login-cuenta")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!erpActivo()) {
          return Response.json({ error: "El acceso por cuenta no esta activado (ERP_ACTIVO)." }, { status: 503 });
        }
        const falloCfg = errorConfiguracion();
        if (falloCfg) {
          console.error("[login-cuenta]", falloCfg);
          return Response.json({ error: "Configuracion incompleta." }, { status: 503 });
        }

        let identificador = "";
        let password = "";
        try {
          const body = (await request.json()) as { identificador?: unknown; password?: unknown };
          identificador = typeof body.identificador === "string" ? body.identificador.slice(0, 120) : "";
          password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
        } catch {
          return Response.json({ error: "Peticion no valida." }, { status: 400 });
        }

        if (identificador.trim().length < 2 || !password) {
          return Response.json({ error: "Indica identificador y contrasena." }, { status: 400 });
        }

        try {
          const fila = await usuarioPorIdentificador(identificador);
          const rechazo = async (id?: number) => {
            if (id) await falloLogin(id);
            else await verificacionFalsa(password);
            await pausa(600);
            return Response.json({ error: "Identificador o contrasena incorrectos." }, { status: 401 });
          };

          if (!fila) return rechazo();
          if (fila.bloqueado) {
            return Response.json(
              { error: "Cuenta bloqueada temporalmente. Prueba en 15 minutos." },
              { status: 429 },
            );
          }
          if (!(await verificarPassword(password, fila.pass_hash))) {
            await auditar(fila.id, fila.asesoria_id, "login_fallido");
            return rechazo(fila.id);
          }
          if (!fila.activo || !fila.asesoria_activa) return rechazo();

          await loginOk(fila.id);
          await auditar(fila.id, fila.asesoria_id, "login");
          const u = await usuarioCtx(fila.id);
          const plan = fila.plan || u?.plan || "gratis";
          const token = await crearSesionErp(fila.id, fila.version);

          return Response.json(
            {
              ok: true,
              plan,
              destino: rutaPorPlan(plan),
              usuario: u
                ? { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol }
                : { id: fila.id, nombre: fila.nombre, email: fila.email },
            },
            {
              headers: {
                "Set-Cookie": cookieSet(request, COOKIE_ERP, token, DOCE_HORAS),
              },
            },
          );
        } catch (e) {
          console.error("[login-cuenta]", e);
          return Response.json({ error: "No se ha podido iniciar sesion." }, { status: 503 });
        }
      },
    },
  },
});
