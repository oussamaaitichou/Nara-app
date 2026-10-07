import { createFileRoute } from "@tanstack/react-router";
import { COOKIE_ERP, baseDatosLista, erpActivo, errorConfiguracion } from "@/lib/piloto/config.server";
import { cookieBorrar, cookieSet, pausa } from "@/lib/piloto/sesion.server";
import { crearSesionErp, hashPassword, passwordInvalida, sesionErp, verificacionFalsa, verificarPassword } from "@/lib/erp/auth.server";
import {
  auditar, borrarMes, cambiarPassword, crearFarmacia, crearUsuario, datosFarmacia, estadoFarmacia, estadoUsuario, falloLogin,
  farmaciaDe, guardarLogo, importarDatos, listarFarmacias, listarUsuarios, loginOk, resetPassword, usuarioCtx, usuarioPorEmail, type UsuarioCtx,
} from "@/lib/erp/db.server";
import { leerTabla } from "@/lib/erp/importar";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const DOCE_HORAS = 60 * 60 * 12;
const json = (d: unknown, status = 200, headers?: HeadersInit) => Response.json(d, { status, headers });
const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const idNum = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v > 0 ? v : null);

function servicio(): Response | null {
  if (!erpActivo()) return json({ error: "El ERP no está disponible todavía.", activo: false }, 404);
  const fallo = errorConfiguracion();
  if (fallo || !baseDatosLista()) {
    console.error("[erp]", fallo ?? "falta DATABASE_URL");
    return json({ error: "El servicio no está bien configurado." }, 503);
  }
  return null;
}

/** Identifica al usuario por su cookie y comprueba en la base de datos que sigue activo y que la sesión no ha sido invalidada. */
async function acceso(request: Request, permitirCambio = false): Promise<UsuarioCtx | Response> {
  const s = await sesionErp(request);
  if (!s) return json({ error: "Inicia sesión.", sesion: false }, 401);
  const u = await usuarioCtx(s.uid);
  if (!u || !u.activo || !u.asesoria_activa || u.version !== s.v) return json({ error: "La sesión ya no es válida. Inicia sesión de nuevo.", sesion: false }, 401, { "Set-Cookie": cookieBorrar(request, COOKIE_ERP) });
  if (u.debe_cambiar && !permitirCambio) return json({ error: "Debes cambiar tu contraseña antes de continuar.", debeCambiar: true }, 403);
  return u;
}
const esAsesoria = (u: UsuarioCtx) => u.rol !== "cliente";
const esAdmin = (u: UsuarioCtx) => u.rol === "asesoria_admin";

/** La farmacia debe ser de la asesoría del usuario y, si es cliente, la suya. Si no, se responde "no existe". */
async function farmaciaPermitida(u: UsuarioCtx, id: number | null) {
  if (id === null) return null;
  if (u.rol === "cliente" && u.farmacia_id !== id) return null;
  const f = await farmaciaDe(id, u.asesoria_id);
  return f && f.activa ? f : null;
}
const perfil = (u: UsuarioCtx) => ({
  usuario: { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, debeCambiar: u.debe_cambiar, farmaciaId: u.farmacia_id },
  asesoria: { id: u.asesoria_id, nombre: u.asesoria_nombre, logo: u.logo },
});

const BASE64_IMG = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/;
function imagenValida(d: string): boolean {
  const m = d.match(BASE64_IMG);
  if (!m || d.length > 280_000) return false;
  const b = Buffer.from(m[2]!, "base64");
  if (m[1] === "png") return b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  if (m[1] === "jpeg") return b.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  return b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP";
}

export const Route = createFileRoute("/api/erp")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const mal = servicio();
        if (mal) return mal;
        try {
          const url = new URL(request.url);
          const r = url.searchParams.get("r");
          const u = await acceso(request, r === "yo");
          if (u instanceof Response) return u;
          if (r === "yo") return json(perfil(u));
          if (r === "farmacias") return json({ farmacias: await listarFarmacias(u.asesoria_id, u.rol === "cliente" ? u.farmacia_id : null) });
          if (r === "usuarios") {
            if (!esAdmin(u)) return json({ error: "No tienes permiso." }, 403);
            return json({ usuarios: await listarUsuarios(u.asesoria_id) });
          }
          if (r === "datos") {
            const f = await farmaciaPermitida(u, idNum(Number(url.searchParams.get("farmacia"))));
            if (!f) return json({ error: "No encontrada." }, 404);
            return json({ farmacia: f, filas: await datosFarmacia(f.id) });
          }
          return json({ error: "Petición no válida." }, 400);
        } catch (e) {
          console.error("[erp] GET", e);
          return json({ error: "No se han podido leer los datos." }, 503);
        }
      },

      POST: async ({ request }) => {
        const mal = servicio();
        if (mal) return mal;
        let b: Record<string, unknown>;
        try {
          b = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ error: "Petición no válida." }, 400);
        }
        const accion = b.accion;
        try {
          if (accion === "login") {
            const email = txt(b.email, 254);
            const pass = typeof b.password === "string" ? b.password.slice(0, 200) : "";
            const fila = EMAIL.test(email) ? await usuarioPorEmail(email) : null;
            const fallo = async (id?: number) => {
              if (id) await falloLogin(id);
              else await verificacionFalsa(pass);
              await pausa(600);
              return json({ error: "Correo o contraseña incorrectos." }, 401);
            };
            if (!fila) return fallo();
            if (fila.bloqueado) return json({ error: "Cuenta bloqueada temporalmente por varios intentos fallidos. Prueba en 15 minutos." }, 429);
            if (!(await verificarPassword(pass, fila.pass_hash))) {
              await auditar(fila.id, fila.asesoria_id, "login_fallido");
              return fallo(fila.id);
            }
            if (!fila.activo || !fila.asesoria_activa) return fallo();
            await loginOk(fila.id);
            await auditar(fila.id, fila.asesoria_id, "login");
            const u = (await usuarioCtx(fila.id))!;
            return json(perfil(u), 200, { "Set-Cookie": cookieSet(request, COOKIE_ERP, await crearSesionErp(fila.id, fila.version), DOCE_HORAS) });
          }
          if (accion === "logout") return json({ ok: true }, 200, { "Set-Cookie": cookieBorrar(request, COOKIE_ERP) });

          const u = await acceso(request, accion === "cambiar_password");
          if (u instanceof Response) return u;

          if (accion === "cambiar_password") {
            const actual = typeof b.actual === "string" ? b.actual : "";
            const nueva = typeof b.nueva === "string" ? b.nueva : "";
            const sql = await usuarioPorEmail(u.email);
            if (!sql || !(await verificarPassword(actual, sql.pass_hash))) return json({ error: "La contraseña actual no es correcta." }, 400);
            const err = passwordInvalida(nueva);
            if (err) return json({ error: err }, 400);
            if (nueva === actual) return json({ error: "La nueva contraseña debe ser distinta de la actual." }, 400);
            const version = await cambiarPassword(u.id, await hashPassword(nueva));
            await auditar(u.id, u.asesoria_id, "cambiar_password");
            return json({ ok: true }, 200, { "Set-Cookie": cookieSet(request, COOKIE_ERP, await crearSesionErp(u.id, version), DOCE_HORAS) });
          }

          if (accion === "crear_farmacia") {
            if (!esAsesoria(u)) return json({ error: "No tienes permiso." }, 403);
            const nombre = txt(b.nombre, 120);
            if (nombre.length < 2) return json({ error: "Escribe el nombre de la farmacia." }, 400);
            const id = await crearFarmacia(u.asesoria_id, nombre, txt(b.ccaa, 60) || null, txt(b.titular, 120) || null);
            await auditar(u.id, u.asesoria_id, "crear_farmacia", nombre);
            return json({ ok: true, id });
          }
          if (accion === "estado_farmacia") {
            if (!esAdmin(u)) return json({ error: "No tienes permiso." }, 403);
            const id = idNum(b.id);
            if (!id) return json({ error: "Falta la farmacia." }, 400);
            await estadoFarmacia(id, u.asesoria_id, b.activa === true);
            await auditar(u.id, u.asesoria_id, "estado_farmacia", `${id}:${b.activa === true}`);
            return json({ ok: true });
          }

          if (accion === "crear_usuario") {
            if (!esAdmin(u)) return json({ error: "No tienes permiso." }, 403);
            const email = txt(b.email, 254);
            const nombre = txt(b.nombre, 120);
            const rol = b.rol === "cliente" || b.rol === "asesoria_staff" ? b.rol : null;
            if (!EMAIL.test(email) || nombre.length < 2 || !rol) return json({ error: "Indica nombre, un correo válido y el tipo de usuario." }, 400);
            let farmaciaId: number | null = null;
            if (rol === "cliente") {
              const f = await farmaciaDe(idNum(b.farmaciaId) ?? 0, u.asesoria_id);
              if (!f) return json({ error: "Elige la farmacia del cliente." }, 400);
              farmaciaId = f.id;
            }
            const r = await crearUsuario({ asesoriaId: u.asesoria_id, farmaciaId, email, nombre, rol });
            if (!r) return json({ error: "Ya existe un usuario con ese correo." }, 409);
            await auditar(u.id, u.asesoria_id, "crear_usuario", `${rol}:${r.id}`);
            return json({ ok: true, id: r.id, passwordTemporal: r.passwordTemporal });
          }
          if (accion === "reset_password") {
            if (!esAdmin(u)) return json({ error: "No tienes permiso." }, 403);
            const id = idNum(b.id);
            const pass = id ? await resetPassword(id, u.asesoria_id) : null;
            if (!pass) return json({ error: "No existe ese usuario." }, 404);
            await auditar(u.id, u.asesoria_id, "reset_password", String(id));
            return json({ ok: true, passwordTemporal: pass });
          }
          if (accion === "estado_usuario") {
            if (!esAdmin(u)) return json({ error: "No tienes permiso." }, 403);
            const id = idNum(b.id);
            if (!id) return json({ error: "Falta el usuario." }, 400);
            if (id === u.id) return json({ error: "No puedes desactivarte a ti mismo." }, 400);
            await estadoUsuario(id, u.asesoria_id, b.activo === true);
            await auditar(u.id, u.asesoria_id, "estado_usuario", `${id}:${b.activo === true}`);
            return json({ ok: true });
          }

          if (accion === "logo" || accion === "quitar_logo") {
            if (!esAdmin(u)) return json({ error: "No tienes permiso." }, 403);
            if (accion === "logo") {
              const d = typeof b.dataUrl === "string" ? b.dataUrl : "";
              if (!imagenValida(d)) return json({ error: "Usa una imagen PNG, JPG o WebP de menos de 200 KB." }, 400);
              await guardarLogo(u.asesoria_id, d);
            } else await guardarLogo(u.asesoria_id, null);
            await auditar(u.id, u.asesoria_id, accion);
            return json({ ok: true });
          }

          if (accion === "importar" || accion === "borrar_mes") {
            const f = await farmaciaPermitida(u, idNum(b.farmaciaId));
            if (!f) return json({ error: "No encontrada." }, 404);
            if (accion === "borrar_mes") {
              const p = txt(b.periodo, 7);
              if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(p)) return json({ error: "Mes no válido." }, 400);
              await borrarMes(f.id, p);
              await auditar(u.id, u.asesoria_id, "borrar_mes", `${f.id}:${p}`);
              return json({ ok: true });
            }
            const texto = typeof b.texto === "string" ? b.texto.slice(0, 60_000) : "";
            const lectura = leerTabla(texto);
            if (!lectura.filas.length) return json({ error: lectura.errores[0] ?? "No he encontrado datos.", errores: lectura.errores }, 400);
            await importarDatos(f.id, lectura.filas);
            await auditar(u.id, u.asesoria_id, "importar", `${f.id}:${lectura.filas.length} meses`);
            return json({ ok: true, importados: lectura.filas.length, errores: lectura.errores });
          }
          return json({ error: "Acción no válida." }, 400);
        } catch (e) {
          console.error("[erp] POST", accion, e);
          return json({ error: "No se ha podido completar la acción." }, 503);
        }
      },
    },
  },
});
