import { COOKIE_ERP, baseDatosLista, erpActivo, errorConfiguracion } from "@/lib/piloto/config.server";
import { cookieBorrar } from "@/lib/piloto/sesion.server";
import { sesionErp } from "./auth.server";
import { usuarioCtx, type UsuarioCtx } from "./db.server";

export const json = (d: unknown, status = 200, headers?: HeadersInit) => Response.json(d, { status, headers });
export const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const idNum = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v > 0 ? v : null);

export function servicio(): Response | null {
  if (!erpActivo()) return json({ error: "El ERP no está disponible todavía.", activo: false }, 404);
  const fallo = errorConfiguracion();
  if (fallo || !baseDatosLista()) {
    console.error("[erp]", fallo ?? "falta DATABASE_URL");
    return json({ error: "El servicio no está bien configurado." }, 503);
  }
  return null;
}

/** Identifica al usuario por su cookie y comprueba en la base de datos que sigue activo y que la sesión no ha sido invalidada. */
export async function acceso(request: Request, permitirCambio = false): Promise<UsuarioCtx | Response> {
  const s = await sesionErp(request);
  if (!s) return json({ error: "Inicia sesión.", sesion: false }, 401);
  const u = await usuarioCtx(s.uid);
  if (!u || !u.activo || !u.asesoria_activa || u.version !== s.v) {
    return json({ error: "La sesión ya no es válida. Inicia sesión de nuevo.", sesion: false }, 401, { "Set-Cookie": cookieBorrar(request, COOKIE_ERP) });
  }
  if (u.debe_cambiar && !permitirCambio) return json({ error: "Debes cambiar tu contraseña antes de continuar.", debeCambiar: true }, 403);
  return u;
}
