import type { FilaMes } from "./importar";

export type Mes = { periodo: string; ventas: number; compras: number; margen: number; margenPct: number | null; gastos: number; resultado: number; resultadoPct: number | null };
export type Senal = { nivel: "aviso" | "info"; texto: string };
export type Indicadores = {
  meses: Mes[];
  ultimo: Mes | null;
  anterior: Mes | null;
  interanual: Mes | null;
  ytd: { ventas: number; margen: number; resultado: number; meses: number } | null;
  senales: Senal[];
};

const pct = (a: number, b: number): number | null => (b > 0 ? a / b : null);
export const variacion = (a: number, b: number): number | null => (b !== 0 ? (a - b) / Math.abs(b) : null);

export function calcularMeses(filas: FilaMes[]): Mes[] {
  return [...filas]
    .sort((a, b) => a.periodo.localeCompare(b.periodo))
    .map((f) => {
      const margen = f.ventas - f.compras;
      const gastos = f.personal + f.alquiler + f.otros;
      const resultado = margen - gastos;
      return { periodo: f.periodo, ventas: f.ventas, compras: f.compras, margen, margenPct: pct(margen, f.ventas), gastos, resultado, resultadoPct: pct(resultado, f.ventas) };
    });
}

const MESES_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const nombrePeriodo = (p: string) => `${MESES_ES[+p.slice(5, 7) - 1] ?? p} ${p.slice(0, 4)}`;

export function calcularIndicadores(filas: FilaMes[]): Indicadores {
  const meses = calcularMeses(filas);
  const ultimo = meses.at(-1) ?? null;
  if (!ultimo) return { meses, ultimo: null, anterior: null, interanual: null, ytd: null, senales: [] };
  const anterior = meses.length > 1 ? meses.at(-2)! : null;
  const prevAno = `${+ultimo.periodo.slice(0, 4) - 1}-${ultimo.periodo.slice(5, 7)}`;
  const interanual = meses.find((m) => m.periodo === prevAno) ?? null;
  const delAno = meses.filter((m) => m.periodo.slice(0, 4) === ultimo.periodo.slice(0, 4));
  const ytd = { ventas: 0, margen: 0, resultado: 0, meses: delAno.length };
  for (const m of delAno) {
    ytd.ventas += m.ventas;
    ytd.margen += m.margen;
    ytd.resultado += m.resultado;
  }

  // Señales orientativas por reglas fijas (no son un diagnóstico): comparan el último mes con la media de los 3 anteriores
  const senales: Senal[] = [];
  const previos = meses.slice(-4, -1);
  if (ultimo.resultado < 0) senales.push({ nivel: "aviso", texto: `El resultado de ${nombrePeriodo(ultimo.periodo)} es negativo.` });
  if (previos.length === 3) {
    const media = (f: (m: Mes) => number) => previos.reduce((s, m) => s + f(m), 0) / previos.length;
    const mv = media((m) => m.ventas);
    if (mv > 0 && ultimo.ventas < mv * 0.9) senales.push({ nivel: "aviso", texto: `Las ventas del último mes están un ${Math.round((1 - ultimo.ventas / mv) * 100)} % por debajo de la media de los 3 meses anteriores.` });
    const mm = previos.map((m) => m.margenPct).filter((x): x is number => x !== null);
    if (mm.length === 3 && ultimo.margenPct !== null) {
      const caida = (mm.reduce((a, b) => a + b, 0) / 3 - ultimo.margenPct) * 100;
      if (caida >= 2) senales.push({ nivel: "aviso", texto: `El margen bruto ha bajado ${caida.toFixed(1).replace(".", ",")} puntos respecto a la media de los 3 meses anteriores.` });
    }
  }
  if (!senales.length) senales.push({ nivel: "info", texto: "No hay señales de alerta con los datos cargados." });
  return { meses, ultimo, anterior, interanual, ytd, senales };
}
