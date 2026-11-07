import { dbSource } from "@/lib/db";

export const COOKIE_SESION = "nara_sesion";
export const COOKIE_ADMIN = "nara_admin";

/** El acceso por código solo se activa cuando PILOTO_ACCESO=activo (si no, la app sigue abierta como hasta ahora). */
export function accesoActivo(): boolean {
  return process.env.PILOTO_ACCESO?.trim().toLowerCase() === "activo";
}

/** Clave para firmar las sesiones. Mínimo 32 caracteres. */
export function secreto(): string | null {
  const s = process.env.SESSION_SECRET?.trim();
  return s && s.length >= 32 ? s : null;
}

/** Contraseña del panel de administración. Mínimo 8 caracteres. Sin ella, el panel está desactivado. */
export function adminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD;
  return p && p.length >= 8 ? p : null;
}

/** En producción hace falta una base de datos real (DATABASE_URL); la embebida se borra entre peticiones. */
export function baseDatosLista(): boolean {
  return !(process.env.NODE_ENV === "production" && dbSource === "pglite");
}

export function errorConfiguracion(): string | null {
  if (!secreto()) return "Falta SESSION_SECRET (mínimo 32 caracteres) en la configuración del servidor.";
  if (!baseDatosLista()) return "Falta DATABASE_URL en la configuración del servidor.";
  return null;
}

/** Las solicitudes de informe y de acompañamiento solo se aceptan con SOLICITUDES_ACTIVAS=si (apagado por defecto). */
export function solicitudesActivas(): boolean {
  return process.env.SOLICITUDES_ACTIVAS?.trim().toLowerCase() === "si";
}

/** Enlace de pago del informe (por ejemplo, un enlace de pago de Stripe). Solo se admite https. */
export function urlPago(): string | null {
  const u = process.env.INFORME_PAGO_URL?.trim();
  return u && u.startsWith("https://") ? u : null;
}

/** Texto del precio que se muestra al usuario. Cámbialo con INFORME_PRECIO_TEXTO (por ejemplo "100 € + IVA"). */
export function precioTexto(): string {
  return process.env.INFORME_PRECIO_TEXTO?.trim() || "100 € + IVA";
}

export const COOKIE_ERP = "nara_erp";

/** El ERP (asesorías, farmacias y usuarios) solo funciona con ERP_ACTIVO=si. Apagado por defecto. */
export function erpActivo(): boolean {
  return process.env.ERP_ACTIVO?.trim().toLowerCase() === "si";
}

/**
 * Subida de fotos y archivos en el chat.
 * Activado por defecto. Para desactivar: ARCHIVOS_ACTIVOS=no
 * (Sigue sin persistir archivos: van en la petición y no se guardan en disco.)
 */
export function archivosActivos(): boolean {
  const v = process.env.ARCHIVOS_ACTIVOS?.trim().toLowerCase();
  if (!v) return true;
  return v === "si" || v === "yes" || v === "1" || v === "true";
}
