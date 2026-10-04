import { createFileRoute } from "@tanstack/react-router";
import { accesoActivo, errorConfiguracion, COOKIE_SESION } from "@/lib/piloto/config.server";
import { buscarCodigo, estadoUso } from "@/lib/piloto/db.server";
import { cookieBorrar, cookieSet, crearSesionFarmacia, pausa, sesionDe } from "@/lib/piloto/sesion.server";

const TREINTA_DIAS = 60 * 60 * 24 * 30;

export const Route = createFileRoute("/api/acceso")({
  server: {
    handlers: {
      // Estado del acceso: ¿está activo el piloto?, ¿hay sesión?, ¿cuántas consultas quedan hoy?
      GET: async ({ request }) => {
        if (!accesoActivo()) return Response.json({ accesoActivo: false });
        const fallo = errorConfiguracion();
        if (fallo) {
          console.error("[acceso]", fallo);
          return Response.json({ error: "El acceso al piloto no está bien configurado." }, { status: 503 });
        }
        try {
          const ses = await sesionDe(request);
          if (!ses) return Response.json({ accesoActivo: true, autenticado: false });
          const est = await estadoUso(ses.cid);
          if (!est || !est.activo || est.generacion !== ses.gen) {
            return Response.json(
              { accesoActivo: true, autenticado: false },
              { headers: { "Set-Cookie": cookieBorrar(request, COOKIE_SESION) } },
            );
          }
          return Response.json({
            accesoActivo: true,
            autenticado: true,
            etiqueta: est.etiqueta,
            limite: est.limite_diario,
            restantes: Math.max(0, est.limite_diario - est.consultas),
          });
        } catch (error) {
          console.error("[acceso] Error de base de datos", error);
          return Response.json({ error: "No se ha podido comprobar el acceso." }, { status: 503 });
        }
      },

      // Entrar con un código
      POST: async ({ request }) => {
        if (!accesoActivo()) return Response.json({ error: "El acceso por código no está activado." }, { status: 404 });
        const fallo = errorConfiguracion();
        if (fallo) {
          console.error("[acceso]", fallo);
          return Response.json({ error: "El acceso al piloto no está bien configurado." }, { status: 503 });
        }
        let codigo = "";
        try {
          const body = (await request.json()) as { codigo?: unknown };
          codigo = typeof body.codigo === "string" ? body.codigo.slice(0, 40) : "";
        } catch {
          return Response.json({ error: "No he podido leer el código." }, { status: 400 });
        }
        try {
          const fila = codigo.trim() ? await buscarCodigo(codigo) : null;
          if (!fila || !fila.activo) {
            await pausa(700); // frena los intentos al azar
            return Response.json({ error: "Código no válido o desactivado." }, { status: 401 });
          }
          const token = await crearSesionFarmacia(fila.id, fila.generacion);
          return Response.json(
            { ok: true, etiqueta: fila.etiqueta },
            { headers: { "Set-Cookie": cookieSet(request, COOKIE_SESION, token, TREINTA_DIAS) } },
          );
        } catch (error) {
          console.error("[acceso] Error al validar el código", error);
          return Response.json({ error: "No se ha podido comprobar el código. Inténtalo de nuevo." }, { status: 503 });
        }
      },

      // Salir
      DELETE: async ({ request }) =>
        Response.json({ ok: true }, { headers: { "Set-Cookie": cookieBorrar(request, COOKIE_SESION) } }),
    },
  },
});
