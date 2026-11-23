import { createFileRoute } from "@tanstack/react-router";
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
import { adminPassword, COOKIE_ADMIN, errorConfiguracion, erpActivo } from "@/lib/piloto/config.server";
import { cookieBorrar, cookieSet, crearSesionAdmin, esAdmin, igualesSeguro, pausa } from "@/lib/piloto/sesion.server";
import { crearAsesoria, eliminarAsesoria, estadoAsesoria, listarAsesorias, listarAuditoria, planAsesoria, resetPasswordPlataforma } from "@/lib/erp/db.server";

const ESTADOS = ["pendiente", "revisada", "corregida", "descartada"] as const;
const ESTADOS_SOLICITUD = ["nueva", "pendiente_pago", "pagada", "en_curso", "entregada", "descartada"] as const;

function txt(v: unknown, max: number) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
function num(v: unknown) {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}
function normalizarPlan(v: unknown): "chat" | "gest" {
  return v === "gest" ? "gest" : "chat";
}
function normalizarPerfil(v: unknown): "vendedor" | "comprador" | "ambos" {
  if (v === "vendedor" || v === "comprador") return v;
  return "ambos";
}
function sinConfigurar() {
  const err = errorConfiguracion();
  return err ? Response.json({ error: err }, { status: 503 }) : null;
}

export const Route = createFileRoute("/api/admin")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const mal = sinConfigurar();
        if (mal) return mal;
        if (!(await esAdmin(request))) return Response.json({ necesitaLogin: true }, { status: 401 });
        const url = new URL(request.url);
        const estado = url.searchParams.get("estado") ?? "";
        try {
          const [codigos, valoraciones, pendientes, solicitudes, nuevas, asesorias, auditoria] = await Promise.all([
            listarCodigos(),
            listarValoraciones(estado && (ESTADOS.includes(estado as (typeof ESTADOS)[number]) || estado === "todas") ? estado : "pendiente"),
            contarPendientes(),
            listarSolicitudes(),
            contarNuevas(),
            erpActivo() ? listarAsesorias() : Promise.resolve([]),
            erpActivo() ? listarAuditoria(100) : Promise.resolve([]),
          ]);
          return Response.json({ codigos, valoraciones, pendientes, solicitudes, nuevas, asesorias, auditoria, erpActivo: erpActivo() });
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
        const accion = typeof body.accion === "string" ? body.accion : "";

        if (accion === "login") {
          await pausa(300);
          const password = typeof body.password === "string" ? body.password : "";
          const expected = adminPassword();
          if (!expected) {
            return Response.json(
              { error: "Panel desactivado: falta ADMIN_PASSWORD (mínimo 8 caracteres)." },
              { status: 503 },
            );
          }
          const ok = igualesSeguro(password, expected);
          if (!ok) return Response.json({ error: "Contraseña incorrecta." }, { status: 401 });
          const token = await crearSesionAdmin();
          return new Response(JSON.stringify({ ok: true }), {
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": cookieSet(request, COOKIE_ADMIN, token, 60 * 60 * 12),
            },
          });
        }

        if (!(await esAdmin(request))) return Response.json({ error: "No autorizado." }, { status: 401 });

        if (accion === "logout") {
          return new Response(JSON.stringify({ ok: true }), {
            headers: { "Content-Type": "application/json", "Set-Cookie": cookieBorrar(request, COOKIE_ADMIN) },
          });
        }

        const id = num(body.id);

        try {
          if (accion === "crear") {
            const etiqueta = txt(body.etiqueta, 80);
            const limite = num(body.limite);
            const plan = normalizarPlan(body.plan);
            const perfil = normalizarPerfil(body.perfil);
            if (!etiqueta || limite === null || limite < 1 || limite > 1000) {
              return Response.json({ error: "Indica un nombre y un límite diario entre 1 y 1000." }, { status: 400 });
            }
            const { id: newId, codigo } = await crearCodigo(etiqueta, limite, plan, perfil);
            return Response.json({ ok: true, id: newId, codigo, plan, perfil });
          }
          if (accion === "crear_asesoria") {
            if (!erpActivo()) return Response.json({ error: "El ERP no está activado (ERP_ACTIVO)." }, { status: 400 });
            const nombre = txt(body.nombre, 120);
            const email = txt(body.adminEmail, 254);
            const adminNombre = txt(body.adminNombre, 120);
            if (nombre.length < 2 || adminNombre.length < 2 || !/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(email)) {
              return Response.json({ error: "Nombre de asesoría, nombre del admin y un email válido." }, { status: 400 });
            }
            const r = await crearAsesoria(nombre, email.toLowerCase(), adminNombre);
            if (!r) return Response.json({ error: "Ese email ya está en uso." }, { status: 409 });
            return Response.json({ ok: true, ...r });
          }
          if (accion === "plan_asesoria") {
            if (id === null) return Response.json({ error: "Falta id." }, { status: 400 });
            if (body.plan !== "gratis" && body.plan !== "premium") return Response.json({ error: "Plan no válido." }, { status: 400 });
            await planAsesoria(id, body.plan);
            return Response.json({ ok: true });
          }
          if (accion === "estado_asesoria") {
            if (id === null || typeof body.activa !== "boolean") return Response.json({ error: "Faltan datos." }, { status: 400 });
            await estadoAsesoria(id, body.activa);
            return Response.json({ ok: true });
          }
          if (accion === "borrar_asesoria") {
            if (id === null) return Response.json({ error: "Falta id." }, { status: 400 });
            const ok = await eliminarAsesoria(id);
            return ok ? Response.json({ ok: true }) : Response.json({ error: "No encontrada." }, { status: 404 });
          }
          if (accion === "reset_admin_asesoria") {
            if (id === null) return Response.json({ error: "Falta id." }, { status: 400 });
            const pass = await resetPasswordPlataforma(id);
            return pass
              ? Response.json({ ok: true, passwordTemporal: pass })
              : Response.json({ error: "No existe ese usuario." }, { status: 404 });
          }
          if (accion === "regenerar") {
            if (id === null) return Response.json({ error: "Falta id." }, { status: 400 });
            const codigo = await regenerarCodigo(id);
            return codigo ? Response.json({ ok: true, codigo }) : Response.json({ error: "No encontrado." }, { status: 404 });
          }
          if (accion === "estado") {
            if (id === null || typeof body.activo !== "boolean") return Response.json({ error: "Faltan datos." }, { status: 400 });
            await actualizarCodigo(id, { activo: body.activo });
            return Response.json({ ok: true });
          }
          if (accion === "limite") {
            const limite = num(body.limite);
            if (id === null || limite === null || limite < 1 || limite > 1000) {
              return Response.json({ error: "Límite entre 1 y 1000." }, { status: 400 });
            }
            await actualizarCodigo(id, { limite_diario: limite });
            return Response.json({ ok: true });
          }
          if (accion === "plan_codigo") {
            if (id === null) return Response.json({ error: "Falta id." }, { status: 400 });
            const plan = normalizarPlan(body.plan);
            await actualizarCodigo(id, { plan });
            return Response.json({ ok: true, plan });
          }
          if (accion === "perfil_codigo") {
            if (id === null) return Response.json({ error: "Falta id." }, { status: 400 });
            const perfil = normalizarPerfil(body.perfil);
            await actualizarCodigo(id, { perfil });
            return Response.json({ ok: true, perfil });
          }
          if (accion === "valoracion") {
            if (id === null) return Response.json({ error: "Falta id." }, { status: 400 });
            const estado = typeof body.estado === "string" && ESTADOS.includes(body.estado as (typeof ESTADOS)[number]) ? body.estado : null;
            if (!estado) return Response.json({ error: "Estado no válido." }, { status: 400 });
            const nota = typeof body.nota_admin === "string" ? body.nota_admin : undefined;
            await actualizarValoracion(id, estado, nota);
            return Response.json({ ok: true });
          }
          if (accion === "solicitud") {
            if (id === null) return Response.json({ error: "Falta id." }, { status: 400 });
            const estado = typeof body.estado === "string" && ESTADOS_SOLICITUD.includes(body.estado as (typeof ESTADOS_SOLICITUD)[number]) ? body.estado : null;
            if (!estado) return Response.json({ error: "Estado no válido." }, { status: 400 });
            const nota = typeof body.nota_admin === "string" ? body.nota_admin : undefined;
            await actualizarSolicitud(id, estado, nota);
            return Response.json({ ok: true });
          }
          if (accion === "borrar_solicitud") {
            if (id === null) return Response.json({ error: "Falta id." }, { status: 400 });
            await eliminarSolicitud(id);
            return Response.json({ ok: true });
          }
          if (accion === "borrar_valoracion") {
            if (id === null) return Response.json({ error: "Falta id." }, { status: 400 });
            await eliminarValoracion(id);
            return Response.json({ ok: true });
          }
          return Response.json({ error: "Acción no reconocida." }, { status: 400 });
        } catch (error) {
          console.error("[admin] Error en acción", accion, error);
          return Response.json({ error: "No se ha podido completar la acción." }, { status: 503 });
        }
      },
    },
  },
});
