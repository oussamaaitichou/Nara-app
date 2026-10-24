/**
 * Rotación, riesgo de caducidad y propuesta de pedido de una oficina de farmacia.
 * Funciones puras: sin red, sin base de datos, sin escribir en ningún ERP (solo lectura de datos que se le pasan).
 *
 * IMPORTANTE: los parámetros por defecto (días de cobertura, umbrales ABC, etc.) son SUPUESTOS de partida,
 * no estándares verificados. Los debe ajustar el titular o el farmacéutico responsable.
 */

export type Producto = {
  codigo: string; // CN, EAN o el código interno que exporte el ERP
  nombre: string;
  proveedor?: string;
  unidadesVendidas: number; // unidades vendidas en el periodo analizado
  stock: number; // unidades en existencias hoy
  coste: number; // precio de coste unitario sin IVA (0 si se desconoce)
  caducidad?: string | null; // próxima caducidad del stock, en formato AAAA-MM-DD
};

export type Parametros = {
  diasPeriodo: number; // días que cubren las ventas de la exportación
  hoy: string; // AAAA-MM-DD
  plazoEntregaDias: number; // días que tarda en llegar un pedido
  stockSeguridadDias: number;
  cicloPedidoDias: number; // cada cuántos días se hace pedido
  umbralSobrestockDias: number; // cobertura a partir de la cual se considera exceso
  avisoCaducidadDias: number; // se vigila lo que caduca en menos de estos días
  abcA: number; // fracción acumulada del valor de ventas que forma la clase A (0.8 = 80 %)
  abcB: number; // fracción acumulada hasta la que llega la clase B (0.95)
};

export const PARAMETROS_POR_DEFECTO: Omit<Parametros, "hoy" | "diasPeriodo"> = {
  plazoEntregaDias: 1,
  stockSeguridadDias: 3,
  cicloPedidoDias: 7,
  umbralSobrestockDias: 90,
  avisoCaducidadDias: 120,
  abcA: 0.8,
  abcB: 0.95,
};

export type Estado = "sin_salida" | "sobrestock" | "riesgo_rotura" | "ok" | "sin_stock_sin_ventas";
export type ClaseABC = "A" | "B" | "C";

export type Fila = {
  codigo: string;
  nombre: string;
  proveedor: string | null;
  unidadesVendidas: number;
  stock: number;
  ventaDiaria: number;
  coberturaDias: number | null; // null si no hay ventas
  clase: ClaseABC;
  estado: Estado;
  valorStock: number; // stock * coste
  diasParaCaducar: number | null;
  unidadesEnRiesgoCaducidad: number;
  valorEnRiesgoCaducidad: number;
  pedidoSugerido: number; // unidades; 0 si no hace falta
};

export type Resumen = {
  productos: number;
  valorStock: number;
  valorStockParado: number; // stock con cero ventas en el periodo
  valorSobrestock: number; // parte del stock que excede el umbral de cobertura
  valorEnRiesgoCaducidad: number;
  porEstado: Record<Estado, number>;
  porClase: Record<ClaseABC, number>;
  pedidosSugeridos: number; // nº de referencias con pedido sugerido
};

export type Resultado = { filas: Fila[]; resumen: Resumen; avisos: string[] };

const n = (x: number) => (Number.isFinite(x) ? x : 0);
const MS_DIA = 86_400_000;

export function diasEntre(desde: string, hasta: string): number | null {
  const a = Date.parse(`${desde}T00:00:00Z`);
  const b = Date.parse(`${hasta}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) / MS_DIA);
}

export function analizar(productos: Producto[], p: Parametros): Resultado {
  const avisos: string[] = [];
  const dias = Math.max(1, n(p.diasPeriodo));
  if (p.diasPeriodo < 30) avisos.push("El periodo de ventas es inferior a 30 días: la rotación y los pedidos sugeridos pueden ser poco fiables (estacionalidad, picos).");
  if (productos.some((x) => n(x.coste) <= 0)) avisos.push("Hay productos sin coste: sus valores en euros salen como 0 y no entran bien en la clasificación ABC.");

  // Clasificación ABC por valor de ventas a coste (unidades vendidas * coste)
  const valorVentas = productos.map((x) => Math.max(0, n(x.unidadesVendidas)) * Math.max(0, n(x.coste)));
  const totalVentas = valorVentas.reduce((a, b) => a + b, 0);
  const orden = productos.map((_, i) => i).sort((i, j) => valorVentas[j]! - valorVentas[i]!);
  const clases: ClaseABC[] = new Array(productos.length).fill("C");
  let acumulado = 0;
  for (const i of orden) {
    const antes = totalVentas > 0 ? acumulado / totalVentas : 1;
    clases[i] = antes < p.abcA ? "A" : antes < p.abcB ? "B" : "C";
    acumulado += valorVentas[i]!;
  }

  const filas: Fila[] = productos.map((x, i) => {
    const ventas = Math.max(0, n(x.unidadesVendidas));
    const stock = Math.max(0, n(x.stock));
    const coste = Math.max(0, n(x.coste));
    const ventaDiaria = ventas / dias;
    const cobertura = ventaDiaria > 0 ? stock / ventaDiaria : null;

    let estado: Estado;
    if (ventas === 0) estado = stock > 0 ? "sin_salida" : "sin_stock_sin_ventas";
    else if (cobertura !== null && cobertura > p.umbralSobrestockDias) estado = "sobrestock";
    else if (cobertura !== null && cobertura < p.plazoEntregaDias + p.stockSeguridadDias) estado = "riesgo_rotura";
    else estado = "ok";

    // Caducidad: lo que no se vende antes de caducar, al ritmo de venta actual
    let diasParaCaducar: number | null = null;
    let enRiesgo = 0;
    if (x.caducidad) {
      diasParaCaducar = diasEntre(p.hoy, x.caducidad);
      if (diasParaCaducar !== null && diasParaCaducar <= p.avisoCaducidadDias) {
        const vendibles = ventaDiaria * Math.max(0, diasParaCaducar);
        enRiesgo = Math.max(0, Math.ceil(stock - vendibles));
      }
    }

    // Pedido sugerido: cubrir plazo + ciclo + seguridad con el ritmo actual. No se pide si hay sobrestock.
    let pedido = 0;
    if (ventaDiaria > 0 && estado !== "sobrestock") {
      const objetivo = ventaDiaria * (p.plazoEntregaDias + p.cicloPedidoDias + p.stockSeguridadDias);
      const puntoPedido = ventaDiaria * (p.plazoEntregaDias + p.stockSeguridadDias);
      if (stock <= puntoPedido) pedido = Math.max(0, Math.ceil(objetivo - stock));
    }

    return {
      codigo: x.codigo,
      nombre: x.nombre,
      proveedor: x.proveedor ?? null,
      unidadesVendidas: ventas,
      stock,
      ventaDiaria,
      coberturaDias: cobertura,
      clase: clases[i]!,
      estado,
      valorStock: stock * coste,
      diasParaCaducar,
      unidadesEnRiesgoCaducidad: enRiesgo,
      valorEnRiesgoCaducidad: enRiesgo * coste,
      pedidoSugerido: pedido,
    };
  });

  const porEstado: Record<Estado, number> = { sin_salida: 0, sobrestock: 0, riesgo_rotura: 0, ok: 0, sin_stock_sin_ventas: 0 };
  const porClase: Record<ClaseABC, number> = { A: 0, B: 0, C: 0 };
  let valorStock = 0;
  let valorParado = 0;
  let valorSobre = 0;
  let valorCad = 0;
  let pedidos = 0;
  filas.forEach((f, i) => {
    porEstado[f.estado]++;
    porClase[f.clase]++;
    valorStock += f.valorStock;
    valorCad += f.valorEnRiesgoCaducidad;
    if (f.pedidoSugerido > 0) pedidos++;
    if (f.estado === "sin_salida") valorParado += f.valorStock;
    if (f.estado === "sobrestock" && f.coberturaDias !== null) {
      const coste = Math.max(0, n(productos[i]!.coste));
      const exceso = Math.max(0, f.stock - f.ventaDiaria * p.umbralSobrestockDias);
      valorSobre += exceso * coste;
    }
  });

  return {
    filas,
    resumen: {
      productos: filas.length,
      valorStock,
      valorStockParado: valorParado,
      valorSobrestock: valorSobre,
      valorEnRiesgoCaducidad: valorCad,
      porEstado,
      porClase,
      pedidosSugeridos: pedidos,
    },
    avisos,
  };
}
