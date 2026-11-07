/** Texto de contexto NaraGest para inyectar en el chat de Nara. */

import { buildDashboardInsights } from "./insights";

function eur(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

/**
 * Resumen operativo del piloto (stock + compras/ventas/márgenes).
 * En el navegador usa localStorage; en servidor usa seed.
 * El cliente puede enviarlo en el body del chat para que Nara vea datos reales del piloto.
 */
export function formatNaragestContext(today: Date = new Date()): string {
  const { insights, kpis } = buildDashboardInsights(today);
  const origen =
    typeof window !== "undefined"
      ? "snapshot del navegador (localStorage / seed del piloto)"
      : "snapshot del servidor (seed de demostración)";

  const lines: string[] = [
    "DATOS NARAGEST (piloto de la farmacia — úsalos solo si la pregunta es sobre el negocio, stock, compras, ventas o rentabilidad de ESTA farmacia)",
    `Origen: ${origen}.`,
    "No son contabilidad oficial ni el ERP de gestión. No los presentes como cifras auditadas.",
    "Si faltan datos, dilo y orienta al módulo correspondiente.",
    "",
    "KPIs:",
    `- Ventas netas (tickets piloto): ${eur(kpis.ventasNetas)}`,
    `- Compras registradas: ${eur(kpis.compras)}`,
    `- Pedidos pendientes/parciales: ${kpis.pedidosPendientes}`,
    `- Margen bruto (análisis de líneas): ${eur(kpis.margenEur)} (${kpis.margenPct.toFixed(1)} %)`,
    `- Alertas stock — caducidad: ${kpis.stockCaducidad}; bajo mínimo: ${kpis.stockBajo}; exceso: ${kpis.stockExceso}`,
    "",
    "Alertas / insights activos:",
  ];

  for (const ins of insights) {
    lines.push(
      `- [${ins.tone.toUpperCase()}] ${ins.title}: ${ins.body}` +
        (ins.impact ? ` Impacto: ${ins.impact}.` : "") +
        ` Fuente: ${ins.source}. Módulo: ${ins.href}.`,
    );
  }

  lines.push(
    "",
    "Si el usuario pregunta cómo va la farmacia, qué pedir, dónde pierde margen o qué revisar hoy, basa la respuesta en estos datos y menciona los módulos /panel, /stock, /compras, /ventas, /rentabilidad u /oportunidades.",
    "No ejecutes pedidos ni cambios de stock; propone y deja la decisión al titular.",
  );

  return lines.join("\n");
}

/** Pregunta sugerida al abrir el chat desde una alerta del panel. */
export function questionForInsight(ins: {
  title: string;
  body: string;
  impact?: string;
}): string {
  const impact = ins.impact ? ` ${ins.impact}` : "";
  return `Sobre esta alerta de NaraGest: «${ins.title}». ${ins.body}${impact} ¿Qué debería priorizar y qué pasos concretos me recomiendas?`;
}
