import { createFileRoute } from "@tanstack/react-router";
import { accesoActivo, errorConfiguracion, COOKIE_SESION } from "@/lib/piloto/config.server";
import {
  ROLES_REGISTRO,
  buscarInvitacionPorToken,
  buscarUsuarioPorEmail,
  registrarUsuario,
  type RolRegistro,
} from "@/lib/piloto/db.server";
import { hashPassword, verificarPassword } from "@/lib/piloto/password.server";
import {
  cookieSet,
  crearSesionUsuario,
  pausa,
} from "@/lib/piloto/sesion.server";

const TREINTA_DIAS = 60 * 60 * 24 * 30;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

const txt = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

export const Route = createFileRoute("/api/registro")({
  server: {
    handlers: {
      /** GET ?token=... → datos de la invitación (si es válida y no usada). */
      GET: async ({ request }) => {
        const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
        if (!token || token.length < 16) {
          return Response.json({ error: "Enlace de invitación no válido." }, { status: 400 });
        }
        try {
          const inv = await buscarInvitacionPorToken(token);
          if (!inv) return Response.json({ error: "Invitación no encontrada." }, { status: 404 });
          if (inv.usada) return Response.json({ error: "Esta invitación ya se ha utilizado." }, { status: 410 });
          return Response.json({
            email: inv.email,
            rol: inv.rol,
            token: inv.token,
          });
        } catch (error) {
          console.error("[registro] GET", error);
          return Response.json({ error: "No se ha podido comprobar la invitación." }, { status: 503 });
        }
      },

      POST: async ({ request }) => {
        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return Response.json({ error: "Petición no válida." }, { status: 400 });
        }

        const accion = typeof body.accion === "string" ? body.accion : "";

        // --- Registro con invitación ---
        if (accion === "registrar") {
          const token = txt(body.token, 80);
          const nombre = txt(body.nombre, 120);
          const password = typeof body.password === "string" ? body.password : "";
          const rolRaw = txt(body.rol, 30);

          if (!token || nombre.length < 2) {
            return Response.json({ error: "Indica tu nombre completo." }, { status: 400 });
          }
          if (password.length < 8) {
            return Response.json({ error: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 });
          }
          if (!(ROLES_REGISTRO as readonly string[]).includes(rolRaw)) {
            return Response.json({ error: "Rol no válido." }, { status: 400 });
          }
          const rol = rolRaw as RolRegistro;

          try {
            const inv = await buscarInvitacionPorToken(token);
            if (!inv) return Response.json({ error: "Invitación no encontrada." }, { status: 404 });
            if (inv.usada) return Response.json({ error: "Esta invitación ya se ha utilizado." }, { status: 410 });

            // El rol de la invitación manda; el del formulario solo se acepta si coincide
            if (rol !== inv.rol) {
              return Response.json({ error: "El rol no coincide con la invitación." }, { status: 400 });
            }

            const r = await registrarUsuario({
              email: inv.email,
              nombre,
              passwordHash: hashPassword(password),
              rol: inv.rol,
              invitacionId: inv.id,
            });
            if ("error" in r) {
              return Response.json(
                { error: "Ya existe una cuenta con este correo. Si estás pendiente de aprobación, espera o contacta con el administrador." },
                { status: 409 },
              );
            }
            return Response.json({
              ok: true,
              mensaje: "Registro recibido. Cuando el administrador te apruebe podrás entrar con tu correo y contraseña.",
            });
          } catch (error) {
            console.error("[registro] registrar", error);
            return Response.json({ error: "No se ha podido completar el registro." }, { status: 503 });
          }
        }

        // --- Login de usuario aprobado ---
        if (accion === "login") {
          if (accesoActivo()) {
            const fallo = errorConfiguracion();
            if (fallo) {
              console.error("[registro] login config", fallo);
              return Response.json({ error: "El acceso no está bien configurado." }, { status: 503 });
            }
          }
          const email = txt(body.email, 254).toLowerCase();
          const password = typeof body.password === "string" ? body.password : "";
          if (!EMAIL_RE.test(email) || !password) {
            return Response.json({ error: "Indica correo y contraseña." }, { status: 400 });
          }
          try {
            const user = await buscarUsuarioPorEmail(email);
            if (!user || !verificarPassword(password, user.password_hash)) {
              await pausa(700);
              return Response.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
            }
            if (user.estado === "pendiente") {
              return Response.json(
                { error: "Tu cuenta está pendiente de aprobación. Te avisaremos cuando puedas entrar." },
                { status: 403 },
              );
            }
            if (user.estado === "rechazado") {
              return Response.json({ error: "Tu solicitud de acceso no fue aceptada." }, { status: 403 });
            }
            const token = await crearSesionUsuario(user.id);
            return Response.json(
              { ok: true, nombre: user.nombre, rol: user.rol },
              { headers: { "Set-Cookie": cookieSet(request, COOKIE_SESION, token, TREINTA_DIAS) } },
            );
          } catch (error) {
            console.error("[registro] login", error);
            return Response.json({ error: "No se ha podido iniciar sesión." }, { status: 503 });
          }
        }

        return Response.json({ error: "Acción no válida." }, { status: 400 });
      },
    },
  },
});
