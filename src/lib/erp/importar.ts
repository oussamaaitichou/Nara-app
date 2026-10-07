/** Lectura de datos mensuales pegados desde Excel o subidos como CSV. Funciones puras. */

export type FilaMes = { periodo: string; ventas: number; compras: number; personal: number; alquiler: number; otros: number };
export type Lectura = { filas: FilaMes[]; errores: string[] };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

const ALIAS: Record<keyof FilaMes, string[]> = {
  periodo: ["periodo", "mes", "fecha", "month"],
  ventas: ["ventas", "facturacion", "ingresos", "ventastotales"],
  compras: ["compras", "consumos", "consumo", "costeventas", "costedeventas"],
  personal: ["personal", "gastospersonal", "gastosdepersonal", "nominas", "salarios"],
  alquiler: ["alquiler", "arrendamiento", "arrendamientos", "renta"],
  otros: ["otros", "otrosgastos", "otrosgastosdeexplotacion", "gastosexplotacion"],
};

const MESES: Record<string, number> = {
  enero: 1, ene: 1, febrero: 2, feb: 2, marzo: 3, mar: 3, abril: 4, abr: 4, mayo: 5, may: 5, junio: 6, jun: 6,
  julio: 7, jul: 7, agosto: 8, ago: 8, septiembre: 9, setiembre: 9, sep: 9, sept: 9, octubre: 10, oct: 10,
  noviembre: 11, nov: 11, diciembre: 12, dic: 12,
};

const ym = (y: number, m: number): string | null => {
  const yy = y < 100 ? 2000 + y : y;
  return m >= 1 && m <= 12 && yy >= 2000 && yy <= 2100 ? `${yy}-${String(m).padStart(2, "0")}` : null;
};

/** Devuelve AAAA-MM o null. Acepta 2026-03, 03/2026, 3-2026, 01/03/2026, «marzo 2026», «mar-26». */
export function parsearPeriodo(texto: string): string | null {
  const t = texto.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let m = t.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.]\d{1,2})?$/);
  if (m) return ym(+m[1]!, +m[2]!);
  m = t.match(/^\d{1,2}[-/.](\d{1,2})[-/.](\d{4})$/); // dd/mm/aaaa
  if (m) return ym(+m[2]!, +m[1]!);
  m = t.match(/^(\d{1,2})[-/.](\d{2}|\d{4})$/);
  if (m) return ym(+m[2]!, +m[1]!);
  m = t.match(/^([a-z]+)[\s\-/.]+(\d{2}|\d{4})$/);
  if (m && MESES[m[1]!]) return ym(+m[2]!, MESES[m[1]!]!);
  return null;
}

/** Número en formato español o inglés: «1.234,56», «1234.56», «1.234», «(500)», «-12,5 €». */
export function parsearNumero(texto: string): number | null {
  let t = texto.trim().replace(/[€\s\u00a0]/g, "");
  if (!t) return 0;
  let neg = false;
  if (/^\(.*\)$/.test(t)) {
    neg = true;
    t = t.slice(1, -1);
  }
  if (t.startsWith("-")) {
    neg = !neg;
    t = t.slice(1);
  }
  if (!/^[\d.,]+$/.test(t)) return null;
  const punto = t.lastIndexOf(".");
  const coma = t.lastIndexOf(",");
  let limpio: string;
  if (punto >= 0 && coma >= 0) {
    const dec = punto > coma ? "." : ",";
    limpio = t.split(dec === "." ? "," : ".").join("").replace(dec, ".");
  } else if (coma >= 0) {
    limpio = t.replace(",", ".");
    if ((t.match(/,/g) ?? []).length > 1) return null;
  } else if (punto >= 0) {
    limpio = /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, "") : t;
    if (!/^\d{1,3}(\.\d{3})+$/.test(t) && (t.match(/\./g) ?? []).length > 1) return null;
  } else limpio = t;
  const n = Number(limpio);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

export function leerTabla(texto: string, maxFilas = 120): Lectura {
  const errores: string[] = [];
  const lineas = texto.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (lineas.length < 2) return { filas: [], errores: ["Pega al menos la fila de títulos y una fila de datos."] };
  const cab = lineas[0]!;
  const cuenta = (c: string) => cab.split(c).length - 1;
  const sep = [";", "\t", ","].sort((a, b) => cuenta(b) - cuenta(a))[0]!;
  if (cuenta(sep) === 0) return { filas: [], errores: ["No he encontrado columnas. Separa con tabulador (pegado desde Excel), punto y coma o coma."] };

  const cols = cab.split(sep).map((c) => norm(c));
  const idx = {} as Record<keyof FilaMes, number>;
  for (const k of Object.keys(ALIAS) as (keyof FilaMes)[]) idx[k] = cols.findIndex((c) => ALIAS[k].includes(c));
  if (idx.periodo < 0) errores.push("Falta la columna del mes (por ejemplo «mes» o «periodo»).");
  if (idx.ventas < 0) errores.push("Falta la columna «ventas» (o «facturación»).");
  if (errores.length) return { filas: [], errores };

  const porPeriodo = new Map<string, FilaMes>();
  lineas.slice(1, maxFilas + 1).forEach((linea, i) => {
    const c = linea.split(sep);
    const n = i + 2;
    const periodo = parsearPeriodo(c[idx.periodo] ?? "");
    if (!periodo) return void errores.push(`Fila ${n}: no entiendo el mes «${(c[idx.periodo] ?? "").trim()}».`);
    const fila: FilaMes = { periodo, ventas: 0, compras: 0, personal: 0, alquiler: 0, otros: 0 };
    for (const k of ["ventas", "compras", "personal", "alquiler", "otros"] as const) {
      if (idx[k] < 0) continue;
      const v = parsearNumero(c[idx[k]] ?? "");
      if (v === null) return void errores.push(`Fila ${n}: el valor de «${k}» no es un número.`);
      if (Math.abs(v) > 1e9) return void errores.push(`Fila ${n}: el valor de «${k}» es demasiado grande.`);
      fila[k] = Math.round(v * 100) / 100;
    }
    porPeriodo.set(periodo, fila);
  });
  if (lineas.length - 1 > maxFilas) errores.push(`Solo se leen las primeras ${maxFilas} filas.`);
  return { filas: [...porPeriodo.values()].sort((a, b) => a.periodo.localeCompare(b.periodo)), errores };
}

export const PLANTILLA_CSV =
  "mes;ventas;compras;personal;alquiler;otros\n2026-01;85000,00;59500,00;12000,00;2000,00;4500,00\n2026-02;81000,00;56700,00;12000,00;2000,00;4300,00\n";
