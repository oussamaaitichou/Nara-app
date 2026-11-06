/** Persistencia local del piloto NaraGest (compras / ventas / margen). */

export type PilotPurchase = {
  id: string;
  numero: string;
  proveedor: string;
  fecha: string; // YYYY-MM-DD
  lineas: number;
  importe: number;
  estado: "Pendiente" | "Parcial" | "Recibido";
  familia: string;
};

export type PilotSale = {
  id: string;
  ticket: string;
  fecha: string;
  hora: string;
  importe: number;
  pago: "Tarjeta" | "Efectivo";
  lineas: number;
  tipo: "venta" | "devolucion";
  categoria: string;
};

export type PilotMarginLine = {
  id: string;
  producto: string;
  categoria: string;
  unidades: number;
  pvp: number;
  coste: number;
};

const KEY = "naragest-pilot-v1";

type PilotState = {
  purchases: PilotPurchase[];
  sales: PilotSale[];
  margins: PilotMarginLine[];
};

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEED: PilotState = {
  purchases: [
    { id: "p1", numero: "P-2026-118", proveedor: "COFARES", fecha: "2026-11-05", lineas: 24, importe: 1842.5, estado: "Pendiente", familia: "Genéricos" },
    { id: "p2", numero: "P-2026-117", proveedor: "Alliance", fecha: "2026-11-04", lineas: 11, importe: 620, estado: "Parcial", familia: "OTC" },
    { id: "p3", numero: "P-2026-116", proveedor: "Hefame", fecha: "2026-11-03", lineas: 18, importe: 980.25, estado: "Recibido", familia: "Dermocosmética" },
    { id: "p4", numero: "P-2026-115", proveedor: "COFARES", fecha: "2026-10-28", lineas: 32, importe: 2410.8, estado: "Recibido", familia: "Genéricos" },
    { id: "p5", numero: "P-2026-114", proveedor: "Bidafarma", fecha: "2026-10-22", lineas: 9, importe: 415.4, estado: "Recibido", familia: "Parafarmacia" },
  ],
  sales: [
    { id: "s1", ticket: "T-10482", fecha: "2026-11-06", hora: "09:14", importe: 24.5, pago: "Tarjeta", lineas: 3, tipo: "venta", categoria: "OTC" },
    { id: "s2", ticket: "T-10483", fecha: "2026-11-06", hora: "09:22", importe: 8.9, pago: "Efectivo", lineas: 1, tipo: "venta", categoria: "Genéricos" },
    { id: "s3", ticket: "T-10484", fecha: "2026-11-06", hora: "09:41", importe: 56.2, pago: "Tarjeta", lineas: 5, tipo: "venta", categoria: "Dermocosmética" },
    { id: "s4", ticket: "T-10485", fecha: "2026-11-06", hora: "10:05", importe: 12.4, pago: "Tarjeta", lineas: 2, tipo: "venta", categoria: "Higiene" },
    { id: "s5", ticket: "T-10486", fecha: "2026-11-06", hora: "10:18", importe: -8.9, pago: "Tarjeta", lineas: 1, tipo: "devolucion", categoria: "OTC" },
    { id: "s6", ticket: "T-10440", fecha: "2026-11-05", hora: "11:02", importe: 33.1, pago: "Efectivo", lineas: 4, tipo: "venta", categoria: "OTC" },
    { id: "s7", ticket: "T-10390", fecha: "2026-11-03", hora: "16:20", importe: 41, pago: "Tarjeta", lineas: 3, tipo: "venta", categoria: "Nutrición" },
    { id: "s8", ticket: "T-10350", fecha: "2026-10-28", hora: "10:10", importe: 27.3, pago: "Efectivo", lineas: 2, tipo: "venta", categoria: "Genéricos" },
  ],
  margins: [
    { id: "m1", producto: "Genérico A 500 mg", categoria: "Genéricos", unidades: 420, pvp: 3.2, coste: 2.7 },
    { id: "m2", producto: "Genérico B 20 mg", categoria: "Genéricos", unidades: 310, pvp: 4.1, coste: 3.4 },
    { id: "m3", producto: "OTC resfriado pack", categoria: "OTC", unidades: 120, pvp: 8.5, coste: 5.27 },
    { id: "m4", producto: "Dermocosmética Z 50 ml", categoria: "Dermocosmética", unidades: 85, pvp: 24.9, coste: 11.95 },
    { id: "m5", producto: "Protector solar SPF50", categoria: "Dermocosmética", unidades: 70, pvp: 18.5, coste: 9.62 },
    { id: "m6", producto: "Omega-3 60 cáps", categoria: "Nutrición", unidades: 60, pvp: 16.9, coste: 9.8 },
    { id: "m7", producto: "Champú pharma 250 ml", categoria: "Higiene", unidades: 95, pvp: 7.5, coste: 4.5 },
    { id: "m8", producto: "Parafarmacia Y", categoria: "Parafarmacia", unidades: 40, pvp: 12, coste: 9.8 },
  ],
};

function read(): PilotState {
  if (typeof window === "undefined") return structuredClone(SEED);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(SEED);
    const parsed = JSON.parse(raw) as PilotState;
    if (!parsed.purchases || !parsed.sales || !parsed.margins) return structuredClone(SEED);
    return parsed;
  } catch {
    return structuredClone(SEED);
  }
}

function write(state: PilotState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function loadPilot(): PilotState {
  return read();
}

export function resetPilot() {
  write(structuredClone(SEED));
  return read();
}

export function addPurchase(
  input: Omit<PilotPurchase, "id" | "numero"> & { numero?: string },
): PilotPurchase {
  const state = read();
  const row: PilotPurchase = {
    id: uid(),
    numero: input.numero?.trim() || `P-${new Date().getFullYear()}-${String(state.purchases.length + 100).padStart(3, "0")}`,
    proveedor: input.proveedor,
    fecha: input.fecha,
    lineas: input.lineas,
    importe: input.importe,
    estado: input.estado,
    familia: input.familia,
  };
  state.purchases = [row, ...state.purchases];
  write(state);
  return row;
}

export function removePurchase(id: string) {
  const state = read();
  state.purchases = state.purchases.filter((p) => p.id !== id);
  write(state);
}

export function updatePurchaseEstado(id: string, estado: PilotPurchase["estado"]) {
  const state = read();
  state.purchases = state.purchases.map((p) => (p.id === id ? { ...p, estado } : p));
  write(state);
}

export function addSale(
  input: Omit<PilotSale, "id" | "ticket"> & { ticket?: string },
): PilotSale {
  const state = read();
  const row: PilotSale = {
    id: uid(),
    ticket: input.ticket?.trim() || `T-${10400 + state.sales.length}`,
    fecha: input.fecha,
    hora: input.hora,
    importe: input.tipo === "devolucion" ? -Math.abs(input.importe) : Math.abs(input.importe),
    pago: input.pago,
    lineas: input.lineas,
    tipo: input.tipo,
    categoria: input.categoria,
  };
  state.sales = [row, ...state.sales];
  write(state);
  return row;
}

export function removeSale(id: string) {
  const state = read();
  state.sales = state.sales.filter((s) => s.id !== id);
  write(state);
}

export function addMarginLine(input: Omit<PilotMarginLine, "id">): PilotMarginLine {
  const state = read();
  const row: PilotMarginLine = { id: uid(), ...input };
  state.margins = [row, ...state.margins];
  write(state);
  return row;
}

export function removeMarginLine(id: string) {
  const state = read();
  state.margins = state.margins.filter((m) => m.id !== id);
  write(state);
}

export function marginStats(line: PilotMarginLine) {
  const marginUnit = line.pvp - line.coste;
  const marginPct = line.pvp > 0 ? (marginUnit / line.pvp) * 100 : 0;
  const marginTotal = marginUnit * line.unidades;
  const ventas = line.pvp * line.unidades;
  const coste = line.coste * line.unidades;
  return { marginUnit, marginPct, marginTotal, ventas, coste };
}
