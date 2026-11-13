/**
 * Cabeceras de seguridad HTTP para todas las respuestas (Nitro / Vercel).
 * CSP orientada a app Vite + React sin scripts de terceros en el cliente.
 * La API de IA y la BD solo se usan en servidor; no hace falta abrir connect-src externos.
 */

interface SecurityEvent {
  url: URL;
  req: { method: string; headers: Headers };
}

/** CSP estricta pero usable con Tailwind (estilos inline) y assets propios. */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "X-DNS-Prefetch-Control": "off",
};

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    // No pisar si alguna ruta ya definió una CSP más específica
    if (key === "Content-Security-Policy" && headers.has("Content-Security-Policy")) continue;
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default async function securityHeadersMiddleware(
  _event: SecurityEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const result = await next();
  if (result instanceof Response) return withSecurityHeaders(result);
  return result;
}
