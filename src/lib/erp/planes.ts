/** Límites por plan. "Premium" no es ilimitado de verdad: es un tope alto de uso razonable que protege los costes. */
export type Plan = "gratis" | "premium";
export const PLANES: Record<Plan, { archivos12h: number; mensajesDia: number }> = {
  gratis: { archivos12h: 5, mensajesDia: 300 },
  premium: { archivos12h: 200, mensajesDia: 3000 },
};
