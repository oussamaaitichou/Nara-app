/**
 * Desactivado como middleware Nitro (provocaba fallos de build en algunos deploys).
 * Las cabeceras CSP y de seguridad se aplican en vercel.json.
 * Este archivo solo reenvía la petición para no romper el escaneo de server/middleware.
 */
export default async function securityHeadersPassthrough(
  _event: unknown,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  return next();
}
