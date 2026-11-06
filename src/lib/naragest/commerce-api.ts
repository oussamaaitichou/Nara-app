/** Cliente API commerce con fallback a pilot-store si la API no está lista. */

import {
  addMarginLine as localAddMargin,
  addPurchase as localAddPurchase,
  addSale as localAddSale,
  loadPilot,
  removeMarginLine as localRemoveMargin,
  removePurchase as localRemovePurchase,
  removeSale as localRemoveSale,
  updatePurchaseEstado as localUpdatePurchase,
  type PilotMarginLine,
  type PilotPurchase,
  type PilotSale,
} from "./pilot-store";

async function tryJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data === "object" && data && "error" in data ? String((data as { error: unknown }).error) : `Error ${res.status}`);
  return data as T;
}

function mapPurchase(r: Record<string, unknown>): PilotPurchase {
  return {
    id: String(r.id),
    numero: String(r.number ?? r.numero ?? ""),
    proveedor: String(r.supplier ?? r.proveedor ?? ""),
    fecha: String(r.purchase_date ?? r.fecha ?? "").slice(0, 10),
    lineas: Number(r.lines_count ?? r.lineas ?? 1),
    importe: Number(r.amount ?? r.importe ?? 0),
    estado: (r.status ?? r.estado ?? "Pendiente") as PilotPurchase["estado"],
    familia: String(r.family ?? r.familia ?? "Otros"),
  };
}

function mapSale(r: Record<string, unknown>): PilotSale {
  return {
    id: String(r.id),
    ticket: String(r.ticket),
    fecha: String(r.sale_date ?? r.fecha ?? "").slice(0, 10),
    hora: String(r.sale_time ?? r.hora ?? "12:00"),
    importe: Number(r.amount ?? r.importe ?? 0),
    pago: (r.payment ?? r.pago ?? "Tarjeta") as PilotSale["pago"],
    lineas: Number(r.lines_count ?? r.lineas ?? 1),
    tipo: (r.kind ?? r.tipo ?? "venta") as PilotSale["tipo"],
    categoria: String(r.category ?? r.categoria ?? "Otros"),
  };
}

function mapMargin(r: Record<string, unknown>): PilotMarginLine {
  return {
    id: String(r.id),
    producto: String(r.product_name ?? r.producto ?? ""),
    categoria: String(r.category ?? r.categoria ?? "Otros"),
    unidades: Number(r.units ?? r.unidades ?? 1),
    pvp: Number(r.pvp ?? 0),
    coste: Number(r.unit_cost ?? r.coste ?? 0),
  };
}

export async function apiListPurchases(): Promise<PilotPurchase[]> {
  try {
    const res = await fetch("/api/naragest/compras", { credentials: "include" });
    const json = await tryJson<{ data: Record<string, unknown>[] }>(res);
    return (json.data ?? []).map(mapPurchase);
  } catch {
    return loadPilot().purchases;
  }
}

export async function apiCreatePurchase(input: {
  supplier: string;
  purchaseDate: string;
  linesCount: number;
  amount: number;
  status: string;
  family: string;
}): Promise<PilotPurchase> {
  try {
    const res = await fetch("/api/naragest/compras", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await tryJson<{ data: Record<string, unknown> }>(res);
    return mapPurchase(json.data);
  } catch {
    return localAddPurchase({
      proveedor: input.supplier,
      fecha: input.purchaseDate,
      lineas: input.linesCount,
      importe: input.amount,
      estado: input.status as PilotPurchase["estado"],
      familia: input.family,
    });
  }
}

export async function apiUpdatePurchaseStatus(id: string, status: string) {
  try {
    const res = await fetch("/api/naragest/compras", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await tryJson(res);
  } catch {
    localUpdatePurchase(id, status as PilotPurchase["estado"]);
  }
}

export async function apiDeletePurchase(id: string) {
  try {
    const res = await fetch(`/api/naragest/compras?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    await tryJson(res);
  } catch {
    localRemovePurchase(id);
  }
}

export async function apiListSales(): Promise<PilotSale[]> {
  try {
    const res = await fetch("/api/naragest/ventas", { credentials: "include" });
    const json = await tryJson<{ data: Record<string, unknown>[] }>(res);
    return (json.data ?? []).map(mapSale);
  } catch {
    return loadPilot().sales;
  }
}

export async function apiCreateSale(input: {
  saleDate: string;
  saleTime: string;
  amount: number;
  payment: string;
  linesCount: number;
  kind: string;
  category: string;
}): Promise<PilotSale> {
  try {
    const res = await fetch("/api/naragest/ventas", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await tryJson<{ data: Record<string, unknown> }>(res);
    return mapSale(json.data);
  } catch {
    return localAddSale({
      fecha: input.saleDate,
      hora: input.saleTime,
      importe: input.amount,
      pago: input.payment as PilotSale["pago"],
      lineas: input.linesCount,
      tipo: input.kind as PilotSale["tipo"],
      categoria: input.category,
    });
  }
}

export async function apiDeleteSale(id: string) {
  try {
    const res = await fetch(`/api/naragest/ventas?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    await tryJson(res);
  } catch {
    localRemoveSale(id);
  }
}

export async function apiListMargins(): Promise<PilotMarginLine[]> {
  try {
    const res = await fetch("/api/naragest/rentabilidad", { credentials: "include" });
    const json = await tryJson<{ data: Record<string, unknown>[] }>(res);
    return (json.data ?? []).map(mapMargin);
  } catch {
    return loadPilot().margins;
  }
}

export async function apiCreateMargin(input: {
  productName: string;
  category: string;
  units: number;
  pvp: number;
  unitCost: number;
}): Promise<PilotMarginLine> {
  try {
    const res = await fetch("/api/naragest/rentabilidad", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await tryJson<{ data: Record<string, unknown> }>(res);
    return mapMargin(json.data);
  } catch {
    return localAddMargin({
      producto: input.productName,
      categoria: input.category,
      unidades: input.units,
      pvp: input.pvp,
      coste: input.unitCost,
    });
  }
}

export async function apiDeleteMargin(id: string) {
  try {
    const res = await fetch(`/api/naragest/rentabilidad?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    await tryJson(res);
  } catch {
    localRemoveMargin(id);
  }
}
