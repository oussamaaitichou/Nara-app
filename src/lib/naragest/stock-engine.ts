/** Motor de stock inteligente — reglas puras, sin dependencias de servidor. */

export type StockProduct = {
  code: string;
  name: string;
  stock: number;
  minStock: number;
  salesPerMonth: number;
  expiry: string | null; // YYYY-MM-DD
  unitCost: number;
  supplier: string;
};

export type StockAlertKind = "caducidad" | "bajo_minimo" | "exceso" | "ok";

export type StockAlert = StockProduct & {
  kind: StockAlertKind;
  daysToExpiry: number | null;
  monthsOfCover: number | null;
  suggestedOrder: number;
  immobilizedEur: number;
  reason: string;
};

export const STOCK_CSV_HEADER =
  "codigo,nombre,stock,minimo,ventas_mes,caducidad,coste_unitario,proveedor";

export const STOCK_CSV_TEMPLATE = `${STOCK_CSV_HEADER}
8470001,Paracetamol 1g 20 comp,42,20,25,2027-03-15,1.20,COFARES
8470002,Ibuprofeno 600mg 20 comp,8,15,18,2026-12-10,1.45,Alliance
8470003,Amoxicilina 500mg 24 caps,5,10,12,2026-11-20,2.10,COFARES
8470004,Insulina glargina,12,8,6,2026-11-28,18.50,Hefame
8470005,Omeprazol 20mg 28 caps,60,25,8,2028-01-10,1.80,COFARES
8470006,Vitamina D3 30 caps,80,10,2,2027-06-01,3.20,Bidafarma
8470007,Crema solar SPF50 50ml,45,12,3,2026-12-01,4.50,Alliance
8470008,Suero fisiologico 30 ud,4,15,20,2027-08-15,0.35,Hefame
`;

const DEMO_PRODUCTS: StockProduct[] = [
  { code: "8470001", name: "Paracetamol 1g 20 comp.", stock: 42, minStock: 20, salesPerMonth: 25, expiry: "2027-03-15", unitCost: 1.2, supplier: "COFARES" },
  { code: "8470002", name: "Ibuprofeno 600mg 20 comp.", stock: 8, minStock: 15, salesPerMonth: 18, expiry: "2026-12-10", unitCost: 1.45, supplier: "Alliance" },
  { code: "8470003", name: "Amoxicilina 500mg 24 cáps.", stock: 5, minStock: 10, salesPerMonth: 12, expiry: "2026-11-20", unitCost: 2.1, supplier: "COFARES" },
  { code: "8470004", name: "Insulina glargina", stock: 12, minStock: 8, salesPerMonth: 6, expiry: "2026-11-28", unitCost: 18.5, supplier: "Hefame" },
  { code: "8470005", name: "Omeprazol 20mg 28 cáps.", stock: 60, minStock: 25, salesPerMonth: 8, expiry: "2028-01-10", unitCost: 1.8, supplier: "COFARES" },
  { code: "8470006", name: "Vitamina D3 30 cáps.", stock: 80, minStock: 10, salesPerMonth: 2, expiry: "2027-06-01", unitCost: 3.2, supplier: "Bidafarma" },
  { code: "8470007", name: "Crema solar SPF50 50ml", stock: 45, minStock: 12, salesPerMonth: 3, expiry: "2026-12-01", unitCost: 4.5, supplier: "Alliance" },
  { code: "8470008", name: "Suero fisiológico 30 ud", stock: 4, minStock: 15, salesPerMonth: 20, expiry: "2027-08-15", unitCost: 0.35, supplier: "Hefame" },
];

export function getDemoProducts(): StockProduct[] {
  return DEMO_PRODUCTS.map((p) => ({ ...p }));
}

export function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function analyzeProduct(p: StockProduct, today: Date = new Date()): StockAlert {
  const immobilizedEur = Math.max(0, p.stock) * Math.max(0, p.unitCost);
  let daysToExpiry: number | null = null;
  if (p.expiry) {
    const exp = new Date(p.expiry);
    if (!Number.isNaN(exp.getTime())) daysToExpiry = daysBetween(today, exp);
  }
  const monthsOfCover =
    p.salesPerMonth > 0 ? p.stock / p.salesPerMonth : p.stock > 0 ? 99 : 0;

  // Pedido sugerido: cubrir mínimo + ~1 mes de venta, menos stock actual
  const target = p.minStock + Math.max(p.salesPerMonth, 0);
  let suggestedOrder = Math.max(0, Math.ceil(target - p.stock));

  // Caducidad próxima: no recomendar comprar más
  if (daysToExpiry !== null && daysToExpiry <= 90) {
    suggestedOrder = 0;
  }
  // Exceso claro: no pedir
  if (monthsOfCover > 3 && p.stock > p.minStock) {
    suggestedOrder = 0;
  }

  if (daysToExpiry !== null && daysToExpiry < 0) {
    return {
      ...p,
      kind: "caducidad",
      daysToExpiry,
      monthsOfCover,
      suggestedOrder: 0,
      immobilizedEur,
      reason: "Caducado — retirar / gestionar",
    };
  }
  if (daysToExpiry !== null && daysToExpiry <= 90) {
    return {
      ...p,
      kind: "caducidad",
      daysToExpiry,
      monthsOfCover,
      suggestedOrder: 0,
      immobilizedEur,
      reason: `Caduca en ${daysToExpiry} días`,
    };
  }
  if (p.stock <= p.minStock) {
    return {
      ...p,
      kind: "bajo_minimo",
      daysToExpiry,
      monthsOfCover,
      suggestedOrder,
      immobilizedEur,
      reason: `Stock ${p.stock} ≤ mínimo ${p.minStock}`,
    };
  }
  if (p.salesPerMonth > 0 && monthsOfCover > 3) {
    return {
      ...p,
      kind: "exceso",
      daysToExpiry,
      monthsOfCover,
      suggestedOrder: 0,
      immobilizedEur,
      reason: `~${monthsOfCover.toFixed(1)} meses de cobertura (exceso)`,
    };
  }
  return {
    ...p,
    kind: "ok",
    daysToExpiry,
    monthsOfCover,
    suggestedOrder: 0,
    immobilizedEur,
    reason: "Sin alerta",
  };
}

export function analyzeAll(products: StockProduct[], today?: Date): StockAlert[] {
  return products.map((p) => analyzeProduct(p, today)).sort((a, b) => {
    const order = { caducidad: 0, bajo_minimo: 1, exceso: 2, ok: 3 };
    return order[a.kind] - order[b.kind] || a.name.localeCompare(b.name, "es");
  });
}

export function stockKpis(alerts: StockAlert[]) {
  const caducidad = alerts.filter((a) => a.kind === "caducidad");
  const bajo = alerts.filter((a) => a.kind === "bajo_minimo");
  const exceso = alerts.filter((a) => a.kind === "exceso");
  const riskExpiryEur = caducidad.reduce((s, a) => s + a.immobilizedEur, 0);
  const excessEur = exceso.reduce((s, a) => s + a.immobilizedEur, 0);
  const orderLines = alerts.filter((a) => a.suggestedOrder > 0);
  return {
    total: alerts.length,
    caducidad: caducidad.length,
    bajo: bajo.length,
    exceso: exceso.length,
    riskExpiryEur,
    excessEur,
    orderLines: orderLines.length,
    orderUnits: orderLines.reduce((s, a) => s + a.suggestedOrder, 0),
  };
}

/** Parse CSV simple (coma). Primera fila = cabecera. */
export function parseStockCsv(text: string): { products: StockProduct[]; errors: string[] } {
  const errors: string[] = [];
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return { products: [], errors: ["El CSV no tiene filas de datos"] };
  }
  const products: StockProduct[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]!);
    if (cols.length < 3) {
      errors.push(`Línea ${i + 1}: columnas insuficientes`);
      continue;
    }
    const code = (cols[0] ?? "").trim();
    const name = (cols[1] ?? "").trim();
    const stock = num(cols[2]);
    const minStock = num(cols[3] ?? "0");
    const salesPerMonth = num(cols[4] ?? "0");
    const expiryRaw = (cols[5] ?? "").trim();
    const unitCost = num(cols[6] ?? "0");
    const supplier = (cols[7] ?? "").trim() || "—";
    if (!code || !name) {
      errors.push(`Línea ${i + 1}: falta código o nombre`);
      continue;
    }
    let expiry: string | null = null;
    if (expiryRaw) {
      const d = normalizeDate(expiryRaw);
      if (!d) errors.push(`Línea ${i + 1}: caducidad no válida (${expiryRaw})`);
      else expiry = d;
    }
    products.push({ code, name, stock, minStock, salesPerMonth, expiry, unitCost, supplier });
  }
  return { products, errors };
}

function num(s: string): number {
  const n = Number(String(s).replace(",", ".").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function normalizeDate(s: string): string | null {
  // YYYY-MM-DD or DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const dd = m[1]!.padStart(2, "0");
    const mm = m[2]!.padStart(2, "0");
    return `${m[3]}-${mm}-${dd}`;
  }
  return null;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (c === "," && !inQ) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

export function alertsToCsv(alerts: StockAlert[]): string {
  const header =
    "codigo,nombre,alerta,motivo,stock,minimo,ventas_mes,caducidad,dias_caduca,pedido_sugerido,euros_inmovilizados,proveedor\n";
  const body = alerts
    .filter((a) => a.kind !== "ok")
    .map((a) =>
      [
        a.code,
        csvEscape(a.name),
        a.kind,
        csvEscape(a.reason),
        a.stock,
        a.minStock,
        a.salesPerMonth,
        a.expiry ?? "",
        a.daysToExpiry ?? "",
        a.suggestedOrder,
        a.immobilizedEur.toFixed(2),
        csvEscape(a.supplier),
      ].join(","),
    )
    .join("\n");
  return header + body;
}

function csvEscape(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
