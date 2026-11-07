/** Planes comerciales del piloto Nara. */

export type PlanAcceso = "chat" | "gest";

export const PLANES: {
  id: PlanAcceso;
  nombre: string;
  descripcion: string;
}[] = [
  {
    id: "chat",
    nombre: "Solo chat",
    descripcion: "Asistente Nara (consultas). Sin NaraGest (stock, compras, ventas…).",
  },
  {
    id: "gest",
    nombre: "Gest + chat",
    descripcion: "NaraGest completo (panel, stock, compras, ventas, rentabilidad) + asistente Nara.",
  },
];

export function normalizarPlan(v: unknown): PlanAcceso {
  return v === "chat" ? "chat" : "gest";
}

export function etiquetaPlan(plan: PlanAcceso): string {
  return plan === "chat" ? "Solo chat" : "Gest + chat";
}

/** Rutas que requieren plan gest (NaraGest). El resto de la app queda libre o solo chat. */
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
