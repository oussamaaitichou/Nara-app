/**
 * Correo transaccional via Resend.
 * Variables de entorno:
 *   RESEND_API_KEY  - clave de API
 *   EMAIL_FROM      - remitente verificado, p.ej. Nara <noreply@tudominio.com>
 *   APP_URL         - base publica, p.ej. https://nara-farmacias.vercel.app
 *
 * Si faltan, las funciones no fallan: registran en consola y devuelven false.
 */

function from(): string | null {
  const f = process.env.EMAIL_FROM?.trim();
  return f && f.includes("@") ? f : null;
}

function apiKey(): string | null {
  const k = process.env.RESEND_API_KEY?.trim();
  return k || null;
}

export function appUrl(): string {
  const u = process.env.APP_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (!u) return "https://nara-farmacias.vercel.app";
  return u.startsWith("http") ? u.replace(/\/$/, "") : `https://${u.replace(/\/$/, "")}`;
}

async function enviar(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const key = apiKey();
  const remitente = from();
  if (!key || !remitente) {
    console.warn("[email] RESEND_API_KEY o EMAIL_FROM no configurados - no se envia:", opts.subject, "->", opts.to);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: remitente,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[email] Resend error", res.status, body);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] fallo de red", e);
    return false;
  }
}

export async function emailNuevaSolicitud(s: {
  id: number;
  nombre: string;
  email: string;
  entidad: string;
  plan_interes: string | null;
}): Promise<boolean> {
  const adminTo = process.env.ADMIN_EMAIL?.trim() || from();
  if (!adminTo) return false;
  const subject = `[Nara] Nueva solicitud de demo #${s.id}`;
  const text = `Nueva solicitud de demo\n\nNombre: ${s.nombre}\nEmail: ${s.email}\nEntidad: ${s.entidad}\nPlan de interes: ${s.plan_interes ?? "-"}\n\nRevisa el panel: ${appUrl()}/admin`;
  return enviar({
    to: adminTo,
    subject,
    text,
    html: `<p>Nueva solicitud de demo <strong>#${s.id}</strong></p>
      <ul>
        <li><strong>Nombre:</strong> ${escapeHtml(s.nombre)}</li>
        <li><strong>Email:</strong> ${escapeHtml(s.email)}</li>
        <li><strong>Entidad:</strong> ${escapeHtml(s.entidad)}</li>
        <li><strong>Plan:</strong> ${escapeHtml(s.plan_interes ?? "-")}</li>
      </ul>
      <p><a href="${appUrl()}/admin">Abrir panel de administracion</a></p>`,
  });
}

export async function emailInvitacion(opts: {
  to: string;
  nombre: string;
  token: string;
  planId: string;
  dias: number;
}): Promise<boolean> {
  const link = `${appUrl()}/invitar/${opts.token}`;
  const subject = "Tu acceso a Nara esta listo";
  const text = `Hola ${opts.nombre},\n\nTu acceso a Nara (${opts.planId}, ${opts.dias} dias) esta listo.\n\nEstablece tu contrasena aqui (enlace de un solo uso, valido 72 h):\n${link}\n\nSi no has solicitado esto, ignora este correo.`;
  return enviar({
    to: opts.to,
    subject,
    text,
    html: `<p>Hola ${escapeHtml(opts.nombre)},</p>
      <p>Tu acceso a <strong>Nara</strong> (plan <strong>${escapeHtml(opts.planId)}</strong>, ${opts.dias} dias) esta listo.</p>
      <p><a href="${link}" style="display:inline-block;padding:10px 16px;background:#1B5C4E;color:#fff;border-radius:6px;text-decoration:none">Establecer mi contrasena</a></p>
      <p style="color:#666;font-size:13px">El enlace es de un solo uso y caduca en 72 horas.</p>
      <p style="color:#666;font-size:13px">Si no has solicitado esto, ignora este correo.</p>`,
  });
}

export async function emailAvisoCaducidad(opts: {
  to: string;
  nombre: string;
  dias: number;
}): Promise<boolean> {
  const subject =
    opts.dias <= 0
      ? "Tu prueba de Nara ha terminado"
      : opts.dias === 1
        ? "Te queda 1 dia de prueba en Nara"
        : `Te quedan ${opts.dias} dias de prueba en Nara`;
  const text =
    opts.dias <= 0
      ? `Hola ${opts.nombre},\n\nTu prueba de Nara ha terminado. Solicita tu plan para seguir usando el chat y el ERP.\n${appUrl()}/solicitar`
      : `Hola ${opts.nombre},\n\nTe quedan ${opts.dias} dia(s) de prueba en Nara. Si quieres continuar sin interrupciones, solicita tu plan:\n${appUrl()}/solicitar`;
  return enviar({
    to: opts.to,
    subject,
    text,
    html: `<p>Hola ${escapeHtml(opts.nombre)},</p><p>${escapeHtml(text.split("\n\n")[1] ?? text)}</p>
      <p><a href="${appUrl()}/solicitar">Solicitar plan</a></p>`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """);
}
