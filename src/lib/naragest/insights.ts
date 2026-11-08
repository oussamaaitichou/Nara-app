/** Insights proactivos Nara · Gestión a partir de stock + piloto compras/ventas/márgenes. */

import { analyzeAll, getDemoProducts, stockKpis } from "./stock-engine";
import { loadPilot, marginStats } from "./pilot-store";

export type InsightTone = "urgente" | "atencion" | "oportunidad" | "ok";

export type Insight = {
  id: string;
  tone: InsightTone;
  title: string;
  body: string;
  /** Pasos concretos que el titular puede hacer hoy */
  actionPlan?: string[];
  impact?: string;
  href: string;
  cta: string;
  source: string;
};

function eur(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export function buildDashboardInsights(today: Date = new Date()): {
  insights: Insight[];
  kpis: {
    ventasNetas: number;
    compras: number;
    margenPct: number;
    margenEur: number;
    stockCaducidad: number;
    stockBajo: number;
    stockExceso: number;
    pedidosPendientes: number;
  };
} {
  const stockAlerts = analyzeAll(getDemoProducts(), today);
  const sk = stockKpis(stockAlerts);
  const pilot = loadPilot();

  const compras = pilot.purchases.reduce((s, p) => s + p.importe, 0);
  const ventasNetas = pilot.sales.reduce((s, t) => s + t.importe, 0);
  const pedidosPendientes = pilot.purchases.filter((p) => p.estado !== "Recibido").length;

  const marginLines = pilot.margins;
  let ventasM = 0;
  let costeM = 0;
  for (const line of marginLines) {
    const st = marginStats(line);
    ventasM += st.ventas;
    costeM += st.coste;
  }
  const margenEur = ventasM - costeM;
  const margenPct = ventasM > 0 ? (margenEur / ventasM) * 100 : 0;

  const insights: Insight[] = [];

  if (sk.caducidad > 0) {
    insights.push({
      id: "caducidad",
      tone: "urgente",
      title: "Riesgo de caducidad",
      body: `Hay ${sk.caducidad} referencias con caducidad ≤ 90 días (o ya caducadas). Conviene priorizar venta o retirada.`,
      actionPlan: [
        "Ordena salida FEFO (primero lo que caduca antes)",
        "Marca en mostrador las 3–5 referencias con más € en riesgo",
        "Valora devolución a mayorista o campaña de liquidación esta semana",
      ],
      impact: sk.riskExpiryEur > 0 ? `Capital en riesgo ~ ${eur(sk.riskExpiryEur)}` : undefined,
      href: "/caducidades",
      cta: "Plan de caducidades",
      source: "Nara · regla ≤ 90 días",
    });
  }

  if (sk.bajo > 0) {
    insights.push({
      id: "minimo",
      tone: "atencion",
      title: "Rotura de stock posible",
      body: `${sk.bajo} productos están en o por debajo del mínimo. Hay pedido sugerido en el módulo de stock.`,
      actionPlan: [
        "Revisa el pedido orientativo en Stock",
        "Prioriza referencias de alta rotación y tratamiento crónico",
        "Confirma recepción para no dejar huecos en mostrador",
      ],
      impact: sk.orderUnits > 0 ? `Pedido orientativo: ${sk.orderUnits} ud. en ${sk.orderLines} ref.` : undefined,
      href: "/stock",
      cta: "Revisar mínimos",
      source: "Nara · stock ≤ mínimo",
    });
  }

  if (sk.exceso > 0) {
    insights.push({
      id: "exceso",
      tone: "oportunidad",
      title: "Capital inmovilizado (stock parado)",
      body: `${sk.exceso} referencias con más de ~3 meses de cobertura. Evita reponer hasta bajar existencias.`,
      actionPlan: [
        "No repongas estas referencias hasta bajar de 60–90 días de cobertura",
        "Saca del pedido automático lo que sobra",
        "Destina el espacio liberado a categorías de más margen (dermo, suplementación)",
      ],
      impact: sk.excessEur > 0 ? `Exceso estimado ~ ${eur(sk.excessEur)}` : undefined,
      href: "/stock",
      cta: "Ver excesos",
      source: "Nara · cobertura > 3 meses",
    });
  }

  if (pedidosPendientes > 0) {
    insights.push({
      id: "pedidos",
      tone: "atencion",
      title: "Pedidos sin cerrar",
      body: `${pedidosPendientes} pedidos a mayorista pendientes o parciales. Revisa recepción y facturas.`,
      actionPlan: [
        "Cierra recepciones parciales en Compras",
        "Cuadra albarán vs factura de las líneas abiertas",
        "Anota incidencias de rotura del mayorista",
      ],
      href: "/compras",
      cta: "Ir a compras",
      source: "Nara · estado ≠ Recibido",
    });
  }

  const lowMargin = marginLines
    .map((l) => ({ ...l, ...marginStats(l) }))
    .filter((l) => l.marginPct < 22 && l.unidades > 0)
    .sort((a, b) => a.marginPct - b.marginPct);

  if (lowMargin.length > 0) {
    const top = lowMargin[0]!;
    insights.push({
      id: "margen",
      tone: "oportunidad",
      title: "Márgenes flojos",
      body: `${lowMargin.length} productos con margen < 22 %. Ejemplo: «${top.producto}» al ${top.marginPct.toFixed(1)} %.`,
      actionPlan: [
        "Revisa descuento de laboratorio o alternativa de más margen",
        "Comprueba si el PVP está alineado con la zona",
        "Prioriza genérico o marca con mejor condición de compra",
      ],
      impact: `Margen bruto del análisis: ${eur(margenEur)} (${margenPct.toFixed(1)} %)`,
      href: "/rentabilidad",
      cta: "Ver rentabilidad",
      source: "Nara · margen % = (PVP − coste) / PVP",
    });
  }

  if (compras > 0 && ventasNetas > 0 && compras > ventasNetas * 1.15) {
    insights.push({
      id: "compras-vs-ventas",
      tone: "atencion",
      title: "Compras por encima de ventas",
      body: `Las compras registradas (${eur(compras)}) superan claramente las ventas netas (${eur(ventasNetas)}). Revisa pedidos y rotación.`,
      actionPlan: [
        "Pausa pedidos no urgentes esta semana",
        "Cruza compras con rotación real del stock",
        "Pregunta a Nara un plan de ajuste de pedidos",
      ],
      href: "/compras",
      cta: "Revisar compras",
      source: "Nara · comparativa compras vs ventas",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "ok",
      tone: "ok",
      title: "Sin alertas prioritarias",
      body: "Con los datos actuales no hay caducidades críticas, mínimos ni márgenes bajos detectados. Sigue cargando compras, ventas y stock.",
      actionPlan: [
        "Importa o actualiza stock si tienes datos nuevos",
        "Pregunta a Nara cómo va el margen del mes",
      ],
      href: "/consulta",
      cta: "Preguntar a Nara",
      source: "Nara · Gestión",
    });
  }

  return {
    insights: insights.slice(0, 5),
    kpis: {
      ventasNetas,
      compras,
      margenPct,
      margenEur,
      stockCaducidad: sk.caducidad,
      stockBajo: sk.bajo,
      stockExceso: sk.exceso,
      pedidosPendientes,
    },
  };
}

export function buildOpportunityCards(today?: Date): Insight[] {
  return buildDashboardInsights(today).insights.filter((i) => i.tone !== "ok");
}
