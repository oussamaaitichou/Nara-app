/** Insights proactivos tipo FarmaIA a partir de stock + piloto compras/ventas/márgenes. */

import { analyzeAll, getDemoProducts, stockKpis } from "./stock-engine";
import { loadPilot, marginStats, type PilotMarginLine } from "./pilot-store";

export type InsightTone = "urgente" | "atencion" | "oportunidad" | "ok";

export type Insight = {
  id: string;
  tone: InsightTone;
  title: string;
  body: string;
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
  const pilot = typeof window !== "undefined" ? loadPilot() : {
    purchases: [],
    sales: [],
    margins: [] as PilotMarginLine[],
  };

  // Si hay localStorage con datos, se usan; en SSR se queda en 0 hasta hidratar
  const compras = pilot.purchases.reduce((s, p) => s + p.importe, 0);
  const ventasNetas = pilot.sales.reduce((s, t) => s + t.importe, 0);
  const pedidosPendientes = pilot.purchases.filter((p) => p.estado !== "Recibido").length;

  const marginLines = pilot.margins.length ? pilot.margins : [];
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
      impact: sk.riskExpiryEur > 0 ? `Capital en riesgo ~ ${eur(sk.riskExpiryEur)}` : undefined,
      href: "/stock",
      cta: "Ver stock inteligente",
      source: "Motor de stock · regla ≤ 90 días",
    });
  }

  if (sk.bajo > 0) {
    insights.push({
      id: "minimo",
      tone: "atencion",
      title: "Rotura de stock posible",
      body: `${sk.bajo} productos están en o por debajo del mínimo. Hay pedido sugerido en el módulo de stock.`,
      impact: sk.orderUnits > 0 ? `Pedido orientativo: ${sk.orderUnits} ud. en ${sk.orderLines} ref.` : undefined,
      href: "/stock",
      cta: "Revisar mínimos",
      source: "Stock · stock ≤ mínimo",
    });
  }

  if (sk.exceso > 0) {
    insights.push({
      id: "exceso",
      tone: "oportunidad",
      title: "Capital inmovilizado",
      body: `${sk.exceso} referencias con más de ~3 meses de cobertura. Evita reponer hasta bajar existencias.`,
      impact: sk.excessEur > 0 ? `Exceso estimado ~ ${eur(sk.excessEur)}` : undefined,
      href: "/stock",
      cta: "Ver excesos",
      source: "Stock · cobertura > 3 meses",
    });
  }

  if (pedidosPendientes > 0) {
    insights.push({
      id: "pedidos",
      tone: "atencion",
      title: "Pedidos sin cerrar",
      body: `${pedidosPendientes} pedidos a mayorista pendientes o parciales. Revisa recepción y facturas.`,
      href: "/compras",
      cta: "Ir a compras",
      source: "Compras · estado ≠ Recibido",
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
      impact: `Margen bruto del análisis: ${eur(margenEur)} (${margenPct.toFixed(1)} %)`,
      href: "/rentabilidad",
      cta: "Ver rentabilidad",
      source: "Rentabilidad · margen % = (PVP − coste) / PVP",
    });
  }

  if (compras > 0 && ventasNetas > 0 && compras > ventasNetas * 1.15) {
    insights.push({
      id: "compras-vs-ventas",
      tone: "atencion",
      title: "Compras por encima de ventas",
      body: `Las compras registradas (${eur(compras)}) superan claramente las ventas netas (${eur(ventasNetas)}). Revisa pedidos y rotación.`,
      href: "/compras",
      cta: "Revisar compras",
      source: "Comparativa compras vs ventas del piloto",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "ok",
      tone: "ok",
      title: "Sin alertas prioritarias",
      body: "Con los datos actuales no hay caducidades críticas, mínimos ni márgenes bajos detectados. Sigue cargando compras, ventas y stock.",
      href: "/consulta",
      cta: "Preguntar a Nara",
      source: "NaraGest",
    });
  }

  return {
    insights,
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
