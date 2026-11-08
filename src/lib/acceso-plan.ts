/** Rutas post-login segun plan contratado (usable en cliente y servidor). */

export function rutaPorPlan(plan: string | null | undefined): "/panel" | "/consulta" {
  const p = (plan ?? "gest").toLowerCase();
  if (p === "chat") return "/consulta";
  // gest | demo | premium | gratis (ERP) | medida → panel NaraGest (+ chat)
  return "/panel";
}
