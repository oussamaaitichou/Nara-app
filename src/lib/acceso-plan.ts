/** Rutas post-login segun plan. */
export function rutaPorPlan(plan: string | null | undefined): "/panel" | "/consulta" {
  const p = (plan ?? "gest").toLowerCase();
  if (p === "chat") return "/consulta";
  return "/panel";
}
