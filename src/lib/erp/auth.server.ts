import { randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { COOKIE_ERP } from "@/lib/piloto/config.server";
import { firmar, leer, leerCookie } from "@/lib/piloto/sesion.server";

type Scrypt = (pw: string, salt: Buffer, len: number, o: { N: number; r: number; p: number }) => Promise<Buffer>;
const scrypt = promisify(scryptCb) as unknown as Scrypt;
const N = 16384;
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, 64, { N, r: 8, p: 1 });
  return `scrypt$${N}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verificarPassword(pw: string, almacenado: string): Promise<boolean> {
  const [alg, n, salt, key] = almacenado.split("$");
  if (alg !== "scrypt" || !n || !salt || !key) return false;
  const esperado = Buffer.from(key, "base64");
  const calculado = await scrypt(pw, Buffer.from(salt, "base64"), esperado.length, { N: Number(n), r: 8, p: 1 });
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

let falso: Promise<string> | null = null;
/** Verifica contra un hash falso para que un correo inexistente tarde lo mismo que uno real. */
export async function verificacionFalsa(pw: string): Promise<void> {
  falso ??= hashPassword("contraseña-falsa-para-igualar-tiempos");
  await verificarPassword(pw, await falso);
}

export function passwordTemporal(): string {
  while (true) {
    const p = Array.from({ length: 12 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
    if (/[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p)) return p;
  }
}

/** Devuelve un mensaje de error o null si la contraseña es aceptable. */
export function passwordInvalida(pw: string): string | null {
  if (pw.length < 10) return "La contraseña debe tener al menos 10 caracteres.";
  if (pw.length > 100) return "La contraseña es demasiado larga.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Usa letras y al menos un número.";
  return null;
}

export const crearSesionErp = (uid: number, version: number) => firmar({ tipo: "erp", uid, v: version }, "12h");

export async function sesionErp(request: Request): Promise<{ uid: number; v: number } | null> {
  const p = await leer(leerCookie(request, COOKIE_ERP));
  if (!p || p.tipo !== "erp" || typeof p.uid !== "number" || typeof p.v !== "number") return null;
  return { uid: p.uid, v: p.v };
}
