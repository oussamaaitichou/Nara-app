import { z } from "zod";

export const clientStatusSchema = z.enum(["activo", "inactivo", "bloqueado"]);
export const casePrioritySchema = z.enum(["urgente", "alta", "media", "baja"]);
export const caseStatusSchema = z.enum([
  "abierto",
  "en_curso",
  "en_revision",
  "bloqueado",
  "cerrado",
]);
export const caseTypeSchema = z.enum([
  "spd",
  "reclamacion",
  "inspeccion_prep",
  "servicio",
  "otro",
]);

export const createClientSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  program: z.enum(["fidelizacion", "spd", "ninguno"]).default("ninguno"),
  status: clientStatusSchema.default("activo"),
  notesInternal: z.string().max(2000).optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const createCaseSchema = z.object({
  clientId: z.string().uuid(),
  type: caseTypeSchema,
  title: z.string().trim().min(3).max(160),
  description: z.string().max(4000).optional(),
  priority: casePrioritySchema.default("media"),
  status: caseStatusSchema.default("abierto"),
  assigneeUserId: z.string().min(1).max(80).optional(),
  dueAt: z.string().datetime().optional(),
});

export const updateCaseSchema = createCaseSchema.partial().omit({ clientId: true });

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
