/** Planes y perfiles del piloto Nara — control centralizado. */

export type PlanAcceso = "chat" | "gest";

/** Quién es el titular del código (a quién se lo das). */
export type PerfilAcceso =
  | "farmacia"
  | "asesoria"
  | "farmaceutico"
  | "tecnico"
  | "estudiante"
  | "otro";

export const PLANES: { id: PlanAcceso; nombre: string; descripcion: string }[] = [
  {
    id: "chat",
    nombre: "Solo chat",
    descripcion: "Asistente Nara. Ideal para asesorías, técnicos, estudiantes y pruebas.",
  },
  {
    id: "gest",
    nombre: "Gest + chat",
    descripcion: "NaraGest (stock, compras, ventas, rentabilidad) + chat. Pensado sobre todo para farmacias.",
  },
];

export const PERFILES: { id: PerfilAcceso; nombre: string; planSugerido: PlanAcceso }[] = [
  { id: "farmacia", nombre: "Farmacia (titular / oficina)", planSugerido: "gest" },
  { id: "asesoria", nombre: "Asesoría / gestor",
    planSugerido: "chat" },
  { id: "farmaceutico", nombre: "Farmacéutico (sin oficina propia)", planSugerido: "chat" },
  { id: "tecnico", nombre: "Técnico / auxiliar",
    planSugerido: "chat" },
  { id: "estudiante", nombre: "Estudiante",
    planSugerido: "chat" },
  { id: "otro", nombre: "Otro",
    planSugerido: "chat" },
];

export function normalizarPlan(v: unknown): PlanAcceso {
  return v === "chat" ? "chat" : "gest";
}

export function normalizarPerfil(v: unknown): PerfilAcceso {
  const ok: PerfilAcceso[] = ["farmacia", "asesoria", "farmaceutico", "tecnico", "estudiante", "otro"];
  return typeof v === "string" && (ok as string[]).includes(v) ? (v as PerfilAcceso) : "otro";
}

export function etiquetaPlan(plan: PlanAcceso): string {
  return plan === "chat" ? "Solo chat" : "Gest + chat";
}

export function etiquetaPerfil(perfil: PerfilAcceso): string {
  return PERFILES.find((p) => p.id === perfil)?.nombre ?? perfil;
}

export const RUTAS_GEST = [
  "/panel",
  "/stock",
  "/compras",
  "/ventas",
  "/rentabilidad",
  "/oportunidades",
  "/caducidades",
  "/caja",
  "/clientes-f",
  "/expedientes",
  "/equipo",
  "/tareas",
  "/servicios-f",
  "/documentos",
  "/calendario",
  "/informes",
  "/automatizaciones",
  "/configuracion",
] as const;

export function rutaRequiereGest(pathname: string): boolean {
  return RUTAS_GEST.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}
