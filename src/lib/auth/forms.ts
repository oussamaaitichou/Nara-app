import { z } from "zod";

/** Alineado con /api/admin crear_asesoria */
export const crearAsesoriaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(120, "Máximo 120 caracteres"),
  adminEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email no válido")
    .max(254),
  adminNombre: z
    .string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(120, "Máximo 120 caracteres"),
});
export type CrearAsesoriaInput = z.infer<typeof crearAsesoriaSchema>;

export const adminLoginSchema = z.object({
  password: z.string().min(8, "Mínimo 8 caracteres"),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

/** Login por cuenta (usuario/email + password) */
export const loginCuentaSchema = z.object({
  identificador: z
    .string()
    .trim()
    .min(2, "Indica usuario o email"),
  password: z.string().min(1, "Introduce la contraseña"),
});
export type LoginCuentaInput = z.infer<typeof loginCuentaSchema>;

export const loginCodigoSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(4, "Código demasiado corto")
    .max(64, "Código demasiado largo"),
});
export type LoginCodigoInput = z.infer<typeof loginCodigoSchema>;
