import { SignJWT, jwtVerify } from "jose";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { COOKIE_ADMIN, COOKIE_SESION, secreto } from "./config.server";

const enc = new TextEncoder();
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin O/0, I/1 para evitar confusiones

export const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function firmar(payload: Record<string, unknown>, expira: string): Promise<string> {
  const s = secreto();
  if (!s) throw new Error("SESSION_SECRET no configurado");
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(expira).sign(enc.encode(s));
}

export async function leer(token: string | undefined): Promise<Record<string, unknown> | null> {
  const s = secreto();
  if (!s || !token) return null;
  try {
    const { payload } = await jwtVerify(token, enc.encode(s), { algorithms: ["HS256"] });
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function leerCookie(request: Request, nombre: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const parte of header.split(";")) {
    const i = parte.indexOf("=");
    if (i > 0 && parte.slice(0, i).trim() === nombre) return decodeURIComponent(parte.slice(i + 1).trim());
  }
  return undefined;
}

function seguro(request: Request): boolean {
  try {
    return new URL(request.url).protocol === "https:" || process.env.NODE_ENV === "production";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

export function cookieSet(request: Request, nombre: string, valor: string, maxAgeSeg: number): string {
  return `${nombre}=${encodeURIComponent(valor)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeg}${seguro(request) ? "; Secure" : ""}`;
}

export function cookieBorrar(request: Request, nombre: string): string {
  return `${nombre}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${seguro(request) ? "; Secure" : ""}`;
}

export async function crearSesionFarmacia(codigoId: number, generacion: number): Promise<string> {
  return firmar({ tipo: "farmacia", cid: codigoId, gen: generacion }, "30d");
}

/** Devuelve el id del código si la cookie de sesión es válida. No comprueba la base de datos. */
export async function sesionDe(request: Request): Promise<{ cid: number; gen: number } | null> {
  const p = await leer(leerCookie(request, COOKIE_SESION));
  if (!p || p.tipo !== "farmacia" || typeof p.cid !== "number" || typeof p.gen !== "number") return null;
  return { cid: p.cid, gen: p.gen };
}

export async function crearSesionAdmin(): Promise<string> {
  return firmar({ tipo: "admin" }, "8h");
}

export async function esAdmin(request: Request): Promise<boolean> {
  const p = await leer(leerCookie(request, COOKIE_ADMIN));
  return !!p && p.tipo === "admin";
}

export function normalizarCodigo(texto: string): string {
  let n = texto.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (n.length === 10) n = "NARA" + n; // por si lo escriben sin el prefijo
  return n;
}

export function hashCodigo(texto: string): string {
  return createHash("sha256").update(`${secreto() ?? ""}|${normalizarCodigo(texto)}`).digest("hex");
}

/** Formato NARA-XXXXX-XXXXX (10 caracteres al azar, unos 50 bits). */
export function generarCodigo(): string {
  const bloque = () => Array.from({ length: 5 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
  return `NARA-${bloque()}-${bloque()}`;
}

/** Comparación en tiempo constante. */
export function igualesSeguro(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
