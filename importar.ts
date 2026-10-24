/**
 * Importa una exportación CSV (ventas + stock) a la lista de productos que analiza calculo.ts.
 *
 * Los nombres de columna aceptados son SUPUESTOS razonables: no se ha verificado qué columnas exporta
 * cada ERP (Farmatic, Unycop, Nixfarma…). Cuando haya una exportación real, basta con añadir sus
 * cabeceras a ALIAS. Si falta una columna obligatoria, se devuelve un error claro en vez de adivinar.
 */
import type { Producto } from "./calculo.ts";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

type Campo = "codigo" | "nombre" | "proveedor" | "unidadesVendidas" | "stock" | "coste" | "caducidad";

const ALIAS: Record<Campo, string[]> = {
  codigo: ["codigo", "cn", "codigo nacional", "ean", "referencia", "cod", "id"],
  nombre: ["nombre", "descripcion", "articulo", "producto", "denominacion"],
  proveedor: ["proveedor", "laboratorio", "distribuidor", "mayorista", "marca"],
  unidadesVendidas: ["unidades vendidas", "uds vendidas", "vendidas", "ventas unidades", "unidades", "ventas", "salidas"],
  stock: ["stock", "existencias", "stock actual", "unidades stock", "uds stock"],
  coste: ["coste", "precio coste", "puc", "pmc", "precio de coste", "coste unitario", "pvl"],
  caducidad: ["caducidad", "fecha caducidad", "fecha de caducidad", "caduca", "proxima caducidad"],
};

const OBLIGATORIAS: Campo[] = ["codigo", "nombre", "unidadesVendidas", "stock"];

function detectarSeparador(linea: string): string {
  const cuentas = [";", "\t", ","].map((s) => ({ s, c: linea.split(s).length }));
  cuentas.sort((a, b) => b.c - a.c);
  return cuentas[0]!.s;
}

/** Divide una línea CSV respetando comillas. */
function partir(linea: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let comillas = false;
  for (let i = 0; i < linea.length; i++) {
    const ch = linea[i]!;
    if (ch === '"') {
      if (comillas && linea[i + 1] === '"') {
        cur += '"';
        i++;
      } else comillas = !comillas;
    } else if (ch === sep && !comillas) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

/** Acepta 1.234,56 · 1234,56 · 1,234.56 · 1234.56 */
export function numero(texto: string): number | null {
  let t = texto.replace(/\s|€|%/g, "");
  if (!t) return null;
  const coma = t.lastIndexOf(",");
  const punto = t.lastIndexOf(".");
  if (coma > -1 && punto > -1) t = coma > punto ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  else if (coma > -1) t = t.replace(",", ".");
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
}

/** Acepta AAAA-MM-DD, DD/MM/AAAA, DD-MM-AAAA y MM/AAAA (se toma el último día del mes). */
export function fecha(texto: string): string | null {
  const t = texto.trim();
  if (!t) return null;
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2]!.padStart(2, "0")}-${m[3]!.padStart(2, "0")}`;
  m = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
  m = t.match(/^(\d{1,2})[/-](\d{4})$/);
  if (m) {
    const ultimo = new Date(Date.UTC(Number(m[2]), Number(m[1]), 0)).getUTCDate();
    return `${m[2]}-${m[1]!.padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`;
  }
  return null;
}

export type Importacion = {
  productos: Producto[];
  errores: string[]; // problemas que impiden o ensucian el análisis
  columnasNoReconocidas: string[];
};

export function importarCSV(texto: string): Importacion {
  const lineas = texto.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lineas.length < 2) return { productos: [], errores: ["El archivo no tiene datos (necesita cabecera y al menos una fila)."], columnasNoReconocidas: [] };

  const sep = detectarSeparador(lineas[0]!);
  const cabecera = partir(lineas[0]!, sep);
  const indice: Partial<Record<Campo, number>> = {};
  const noReconocidas: string[] = [];
  cabecera.forEach((h, i) => {
    const hn = norm(h);
    const campo = (Object.keys(ALIAS) as Campo[]).find((c) => indice[c] === undefined && ALIAS[c].some((a) => norm(a) === hn));
    if (campo) indice[campo] = i;
    else noReconocidas.push(h);
  });

  const faltan = OBLIGATORIAS.filter((c) => indice[c] === undefined);
  if (faltan.length) {
    return {
      productos: [],
      errores: [`Faltan columnas obligatorias: ${faltan.join(", ")}. Columnas encontradas: ${cabecera.join(", ")}.`],
      columnasNoReconocidas: noReconocidas,
    };
  }

  const productos: Producto[] = [];
  const errores: string[] = [];
  for (let r = 1; r < lineas.length; r++) {
    const celdas = partir(lineas[r]!, sep);
    const get = (c: Campo) => (indice[c] === undefined ? "" : (celdas[indice[c]!] ?? ""));
    const ventas = numero(get("unidadesVendidas"));
    const stock = numero(get("stock"));
    if (ventas === null || stock === null) {
      errores.push(`Fila ${r + 1}: unidades vendidas o stock no son números (“${get("unidadesVendidas")}”, “${get("stock")}”). Se omite.`);
      continue;
    }
    const cadTxt = get("caducidad");
    const cad = cadTxt ? fecha(cadTxt) : null;
    if (cadTxt && !cad) errores.push(`Fila ${r + 1}: fecha de caducidad no reconocida (“${cadTxt}”). Se ignora la caducidad de esa fila.`);
    productos.push({
      codigo: get("codigo"),
      nombre: get("nombre"),
      proveedor: get("proveedor") || undefined,
      unidadesVendidas: ventas,
      stock,
      coste: numero(get("coste")) ?? 0,
      caducidad: cad,
    });
  }
  return { productos, errores, columnasNoReconocidas: noReconocidas };
}
