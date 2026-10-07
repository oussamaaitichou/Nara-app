import { createFileRoute } from "@tanstack/react-router";
import { adminPassword, COOKIE_ADMIN, erpActivo, errorConfiguracion } from "@/lib/piloto/config.server";
import {
  actualizarCodigo, actualizarSolicitud, actualizarValoracion, contarNuevas, contarPendientes, crearCodigo,
  eliminarSolicitud, eliminarValoracion, listarCodigos, listarSolicitudes, listarValoraciones, regenerarCodigo,
} from "@/lib/piloto/db.server";
import { crearAsesoria, estadoAsesoria, listarAsesorias, resetPasswordPlataforma } from "@/lib/erp/db.server";
import { cookieBorrar, cookieSet, crearSesionAdmin, esAdmin, igualesSeguro, pausa } from "@/lib/piloto/sesion.server";

const ESTADOS = ["pendiente", "revisada", "corregida", "descartada"];
const ESTADOS_SOLICITUD = ["nueva", "pendiente_pago", "pagada", "en_curso", "entregada", "descartada"];

function sinConfigurar(): Response | null {
  if (!adminPassword()) {
    return Response.json({ error: "Panel desactivado: falta ADMIN_PASSWORD (mínimo 8 caracteres)." }, { status: 503 });
  }
  const fallo = errorConfiguracion();
  if (fallo) {
    console.error("[admin]", fallo);
    return Response.json({ error: fallo }, { status: 503 });
  }
  return null;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isInteger(v) ? v : null);
const txt = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

export const Route = createFileRoute("/api/admin")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const mal = sinConfigurar();
        if (mal) return mal;
        if (!(await esAdmin(request))) return Response.json({ necesitaLogin: true }, { status: 401 });
        try {
          const estado = new URL(request.url).searchParams.get("estado");
          const [codigos, valoraciones, pendientes, solicitudes, nuevas, asesorias] = await Promise.all([
            listarCodigos(),
            listarValoraciones(estado && (ESTADOS.includes(estado) || estado === "todas") ? estado : "pendiente"),
            contarPendientes(),
            listarSolicitudes(),
            contarNuevas(),
            erpActivo() ? listarAsesorias() : Promise.resolve([]),
          ]);
          return Response.json({ codigos, valoraciones, pendientes, solicitudes, nuevas, asesorias, erpActivo: erpActivo() });
        } catch (error) {
          console.error("[admin] Error al leer datos", error);
          return Response.json({ error: "No se han podido leer los datos." }, { status: 503 });
        }
      },

      POST: async ({ request }) => {
        const mal = sinConfigurar();
        if (mal) return mal;
        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return Response.json({ error: "Petición no válida." }, { status: 400 });
        }
        const accion = body.accion;

        if (accion === "login") {
          const pass = typeof body.password === "string" ? body.password : "";
          if (!igualesSeguro(pass, adminPassword()!)) {
            await pausa(900);
            return Response.json({ error: "Contraseña incorrecta." }, { status: 401 });
          }
          const token = await crearSesionAdmin();
          return Response.json({ ok: true }, { headers: { "Set-Cookie": cookieSet(request, COOKIE_ADMIN, token, 60 * 60 * 8) } });
        }
        if (accion === "logout") {
          return Response.json({ ok: true }, { headers: { "Set-Cookie": cookieBorrar(request, COOKIE_ADMIN) } });
        }

        if (!(await esAdmin(request))) return Response.json({ necesitaLogin: true }, { status: 401 });

        try {
          if (accion === "crear") {
            const etiqueta = txt(body.etiqueta, 80);
            const limite = num(body.limite);
            if (!etiqueta || limite === null || limite < 1 || limite > 1000) {
              return Response.json({ error: "Indica un nombre y un límite diario entre 1 y 1000." }, { status: 400 });
            }
            const { id, codigo } = await crearCodigo(etiqueta, limite);
            return Response.json({ ok: true, id, codigo });
          }
          if (accion === "crear_asesoria") {
            if (!erpActivo()) return Response.json({ error: "El ERP no está activado (ERP_ACTIVO)." }, { status: 400 });
            const nombre = txt(body.nombre, 120);
            const email = txt(body.adminEmail, 254);
            const adminNombre = txt(body.adminNombre, 120);
            if (nombre.length < 2 || adminNombre.length < 2 || !/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(email)) {
              return Response.json({ error: "Indica el nombre de la asesoría, y nombre y correo válidos de su administrador." }, { status: 400 });
            }
            const r = await crearAsesoria(nombre, email, adminNombre);
            return r ? Response.json({ ok: true, ...r }) : Response.json({ error: "Ya existe un usuario con ese correo." }, { status: 409 });
          }
          const id = num(body.id);
          if (id === null) return Response.json({ error: "Falta el identificador." }, { status: 400 });

          if (accion === "estado_asesoria") {
            await estadoAsesoria(id, body.activa === true);
            return Response.json({ ok: true });
          }
          if (accion === "reset_admin_asesoria") {
            const pass = await resetPasswordPlataforma(id);
            return pass ? Response.json({ ok: true, passwordTemporal: pass }) : Response.json({ error: "No existe ese usuario." }, { status: 404 });
          }
          if (accion === "regenerar") {
            const codigo = await regenerarCodigo(id);
            return codigo ? Response.json({ ok: true, codigo }) : Response.json({ error: "No existe ese código." }, { status: 404 });
          }
          if (accion === "estado") {
            await actualizarCodigo(id, { activo: body.activo === true });
            return Response.json({ ok: true });
          }
          if (accion === "limite") {
            const limite = num(body.limite);
            if (limite === null || limite < 1 || limite > 1000) return Response.json({ error: "Límite entre 1 y 1000." }, { status: 400 });
            await actualizarCodigo(id, { limite });
            return Response.json({ ok: true });
          }
          if (accion === "valoracion") {
            const estado = typeof body.estado === "string" && ESTADOS.includes(body.estado) ? body.estado : null;
            if (!estado) return Response.json({ error: "Estado no válido." }, { status: 400 });
            await actualizarValoracion(id, estado, txt(body.nota, 1000) || null);
            return Response.json({ ok: true });
          }
          if (accion === "solicitud") {
            const estado = typeof body.estado === "string" && ESTADOS_SOLICITUD.includes(body.estado) ? body.estado : null;
            if (!estado) return Response.json({ error: "Estado no válido." }, { status: 400 });
            await actualizarSolicitud(id, estado, txt(body.nota, 1000) || null);
            return Response.json({ ok: true });
          }
          if (accion === "borrar_solicitud") {
            await eliminarSolicitud(id);
            return Response.json({ ok: true });
          }
          if (accion === "borrar_valoracion") {
            await eliminarValoracion(id);
            return Response.json({ ok: true });
          }
          return Response.json({ error: "Acción no válida." }, { status: 400 });
        } catch (error) {
          console.error("[admin] Error en la acción", accion, error);
          return Response.json({ error: "No se ha podido completar la acción." }, { status: 503 });
        }
      },
    },
  },
});
