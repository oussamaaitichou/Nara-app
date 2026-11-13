/**
 * Utilidades anti-XSS.
 * En React el texto en hijos ya se escapa; estas funciones refuerzan entradas
 * de API, logs y cualquier futuro renderizado HTML.
 */

/** Elimina caracteres de control (salvo tab/LF/CR) y limita tamaño. */
export function sanitizeUserText(input: unknown, maxLen = 8000): string {
  if (typeof input !== "string") return "";
  // eslint-disable-next-line no-control-regex
  const limpio = input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  return limpio.slice(0, maxLen);
}

/** Escapa HTML por si alguna vez hay que interpolar en strings HTML (emails, etc.). */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Detecta patrones típicos de intento XSS en texto libre.
 * No bloquea el mensaje (el render ya es seguro); sirve para logs / métricas.
 */
export function pareceIntentoXss(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /<script\b/.test(t) ||
    /javascript\s*:/.test(t) ||
    /\bon\w+\s*=/.test(t) ||
    /<iframe\b/.test(t) ||
    /data\s*:\s*text\/html/.test(t)
  );
}
