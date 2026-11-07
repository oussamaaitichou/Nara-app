import { createFileRoute } from "@tanstack/react-router";
import { adminPassword, COOKIE_ADMIN, erpActivo, errorConfiguracion } from "@/lib/piloto/config.server";
import {
  actualizarCodigo,
  actualizarSolicitud,
  actualizarValoracion,
  contarNuevas,
  contarPendientes,
  crearCodigo,
  eliminarSolicitud,
  eliminarValoracion,
  listarCodigos,
  listarSolicitudes,
  listarValoraciones,
  regenerarCodigo,
} from "@/lib/piloto/db.server";
import { crearAsesoria, estadoAsesoria, listarAsesorias, planAsesoria, resetPasswordPlataforma } from "@/lib/erp/db.server";
import {
  ampliarSuscripcion,
  aprobarSolicitud,
  actualizarNaraSolicitud,
  contarNaraPendientes,
  listarNaraSolicitudes,
  pausarOCortarSuscripcion,
} from "@/lib/planes/admin.server";
import { emailInvitacion } from "@/lib/planes/email.server";
import { normalizarPerfil, normalizarPlan } from "@/lib/piloto/planes";
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
          const [codigos, valoraciones, pendientes, solicitudes, nuevas, asesorias, naraSolicitudes, naraPendientes] =
            await Promise.all([
              listarCodigos(),
              listarValoraciones(estado && (ESTADOS.includes(estado) || estado === "todas") ? estado : "pendiente"),
              contarPendientes(),
              listarSolicitudes(),
              contarNuevas(),
              erpActivo() ? listarAsesorias() : Promise.resolve([]),
              listarNaraSolicitudes("pendiente"),
              contarNaraPendientes(),
            ]);
          return Response.json({
            codigos,
            valoraciones,
            pendientes,
            solicitudes,
            nuevas,
            asesorias,
            erpActivo: erpActivo(),
            naraSolicitudes,
            naraPendientes,
          });
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
            const plan = normalizarPlan(body.plan);
            const perfil = normalizarPerfil(body.perfil);
            if (!etiqueta || limite === null || limite < 1 || limite > 1000) {
              return Response.json({ error: "Indica un nombre y un límite diario entre 1 y 1000." }, { status: 400 });
            }
            const { id, codigo } = await crearCodigo(etiqueta, limite, plan, perfil);
            return Response.json({ ok: true, id, codigo, plan, perfil });
          }
          if (accion === "crear_asesoria") {
            if (!erpActivo()) return Response.json({ error: "El ERP no está activado (ERP_ACTIVO)." }, { status: 400 });
            const nombre = txt(body.nombre, 120);
            const email = txt(body.adminEmail, 254);
            const adminNombre = txt(body.adminNombre, 120);
            if (nombre.length < 2 || adminNombre.length < 2 || !/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(email)) {
              return Response.json(
                { error: "Indica el nombre de la asesoría, y nombre y correo válidos de su administrador." },
                { status: 400 },
              );
            }
            const r = await crearAsesoria(nombre, email, adminNombre);
            return r ? Response.json({ ok: true, ...r }) : Response.json({ error: "Ya existe un usuario con ese correo." }, { status: 409 });
          }

          // --- Solicitudes de demo Nara (nuevas) ---
          if (accion === "nara_aprobar") {
            if (!erpActivo()) return Response.json({ error: "Activa ERP_ACTIVO para aprobar demos con cuenta." }, { status: 400 });
            const sid = num(body.id);
            const dias = num(body.dias) ?? 7;
            const planId = txt(body.planId, 20) || "demo";
            if (sid === null || dias < 1 || dias > 365) {
              return Response.json({ error: "Indica la solicitud y una duración entre 1 y 365 días." }, { status: 400 });
            }
            const r = await aprobarSolicitud({
              solicitudId: sid,
              planId,
              dias,
              nota: txt(body.nota, 500) || null,
            });
            if (!r.ok) return Response.json({ error: r.error }, { status: 400 });
            const enviado = await emailInvitacion({
              to: r.email,
              nombre: r.email,
              token: r.invitacionToken,
              planId,
              dias,
            });
            return Response.json({
              ok: true,
              asesoriaId: r.asesoriaId,
              usuarioId: r.usuarioId,
              email: r.email,
              invitacionEnviada: enviado,
              // Solo si el correo falló: contraseña temporal de respaldo (no ideal; preferir reenviar invitación)
              passwordTemporalFallback: enviado ? undefined : r.passwordTemporalFallback,
              invitacionToken: enviado ? undefined : r.invitacionToken,
            });
          }
          if (accion === "nara_rechazar") {
            const sid = num(body.id);
            if (sid === null) return Response.json({ error: "Falta el identificador." }, { status: 400 });
            await actualizarNaraSolicitud(sid, "rechazada", txt(body.nota, 500) || null);
            return Response.json({ ok: true });
          }
          if (accion === "nara_ampliar") {
            const asesoriaId = num(body.asesoriaId);
            const dias = num(body.dias) ?? 7;
            if (asesoriaId === null || dias < 1) return Response.json({ error: "Datos no válidos." }, { status: 400 });
            await ampliarSuscripcion(asesoriaId, dias);
            return Response.json({ ok: true });
          }
          if (accion === "nara_pausar" || accion === "nara_cortar" || accion === "nara_reactivar") {
            const asesoriaId = num(body.asesoriaId);
            if (asesoriaId === null) return Response.json({ error: "Falta la asesoría." }, { status: 400 });
            const status =
              accion === "nara_pausar" ? "pausada" : accion === "nara_cortar" ? "cancelada" : "activa";
            await pausarOCortarSuscripcion(asesoriaId, status);
            return Response.json({ ok: true });
          }

          const id = num(body.id);
          if (id === null) return Response.json({ error: "Falta el identificador." }, { status: 400 });

          if (accion === "plan_asesoria") {
            if (body.plan !== "gratis" && body.plan !== "premium") return Response.json({ error: "Plan no válido." }, { status: 400 });
            await planAsesoria(id, body.plan);
            return Response.json({ ok: true });
          }
          if (accion === "estado_asesoria") {
            await estadoAsesoria(id, body.activa === true);
            return Response.json({ ok: true });
          }
          if (accion === "reset_admin_asesoria") {
            const pass = await resetPasswordPlataforma(id);
            return pass
              ? Response.json({ ok: true, passwordTemporal: pass })
              : Response.json({ error: "No existe ese usuario." }, { status: 404 });
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
          if (accion === "plan_codigo") {
            if (body.plan !== "chat" && body.plan !== "gest") return Response.json({ error: "Plan no válido (chat o gest)." }, { status: 400 });
            await actualizarCodigo(id, { plan: body.plan });
            return Response.json({ ok: true });
          }
          if (accion === "perfil_codigo") {
            const perfil = normalizarPerfil(body.perfil);
            await actualizarCodigo(id, { perfil });
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
