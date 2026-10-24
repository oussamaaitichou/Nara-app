import ExcelJS from "exceljs";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

export type AdjuntoProcesado = { nombre: string; tipo: "imagen" | "texto"; tam: number; texto?: string; dataUrl?: string };
type Resultado = { ok: true; items: AdjuntoProcesado[] } | { ok: false; error: string };

const MAX_POR_ARCHIVO = 3_000_000;
const MAX_TOTAL_BASE64 = 4_200_000; // el cuerpo de una petición en Vercel admite unos 4,5 MB
const MAX_TEXTO = 40_000;
const MAX_POR_MENSAJE = 8;
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const limpiar = (n: unknown) => (String(n ?? "archivo").split(/[\\/]/).pop() ?? "archivo").replace(/[^\p{L}\p{N}._ ()-]/gu, "").slice(0, 120) || "archivo";
const fallo = (error: string): Resultado => ({ ok: false, error });
const esZip = (b: Buffer) => b.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));

function imagenReal(mime: string, b: Buffer): boolean {
  if (mime === "image/png") return b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  if (mime === "image/jpeg") return b.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  return b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP";
}

async function excelATexto(buf: Buffer): Promise<string> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  const partes: string[] = [];
  for (const hoja of wb.worksheets.slice(0, 5)) {
    partes.push(`# Hoja: ${hoja.name}`);
    let n = 0;
    hoja.eachRow({ includeEmpty: false }, (fila) => {
      if (n++ >= 300) return;
      const celdas: string[] = [];
      for (let c = 1; c <= Math.min(fila.cellCount, 30); c++) {
        const v = fila.getCell(c).value;
        const x = v && typeof v === "object" ? ("result" in v ? v.result : "text" in v ? v.text : v instanceof Date ? v.toISOString().slice(0, 10) : "") : v;
        celdas.push(x === null || x === undefined ? "" : String(x).replace(/[;\n\r]/g, " "));
      }
      partes.push(celdas.join(";"));
    });
  }
  return partes.join("\n").trim();
}

/** Valida los archivos y extrae su contenido: imágenes tal cual (para que la IA las vea) y texto de PDF, Word, Excel, CSV y TXT. */
export async function procesarAdjuntos(entradas: unknown): Promise<Resultado> {
  if (!Array.isArray(entradas) || entradas.length === 0) return { ok: true, items: [] };
  if (entradas.length > MAX_POR_MENSAJE) return fallo(`Puedes adjuntar como máximo ${MAX_POR_MENSAJE} archivos por mensaje.`);
  const items: AdjuntoProcesado[] = [];
  let total = 0;
  for (const e of entradas as { nombre?: unknown; datos?: unknown }[]) {
    const nombre = limpiar(e?.nombre);
    const d = typeof e?.datos === "string" ? e.datos : "";
    total += d.length;
    if (total > MAX_TOTAL_BASE64) return fallo("Los archivos pesan demasiado en total (máximo 4 MB por mensaje).");
    const m = d.match(/^data:([a-z0-9.+/-]+)(?:;[^,;]*)*;base64,([A-Za-z0-9+/=]+)$/i);
    if (!m) return fallo(`No he podido leer «${nombre}».`);
    const mime = m[1]!.toLowerCase();
    const buf = Buffer.from(m[2]!, "base64");
    if (buf.length > MAX_POR_ARCHIVO) return fallo(`«${nombre}» pesa más de 3 MB.`);

    if (/^image\/(png|jpeg|webp)$/.test(mime)) {
      if (!imagenReal(mime, buf)) return fallo(`«${nombre}» no es una imagen válida.`);
      items.push({ nombre, tipo: "imagen", tam: buf.length, dataUrl: `data:${mime};base64,${m[2]}` });
    } else if (mime === "application/pdf") {
      if (buf.subarray(0, 5).toString("latin1") !== "%PDF-") return fallo(`«${nombre}» no es un PDF válido.`);
      try {
        const pdf = await getDocumentProxy(new Uint8Array(buf));
        const { text } = await extractText(pdf, { mergePages: true });
        const t = text.trim();
        if (t.length < 20) return fallo(`«${nombre}» no tiene texto que se pueda leer (¿es un escaneo?). Sube una foto o pega el texto.`);
        items.push({ nombre, tipo: "texto", tam: buf.length, texto: t.slice(0, MAX_TEXTO) });
      } catch {
        return fallo(`No he podido leer el PDF «${nombre}».`);
      }
    } else if (mime === DOCX) {
      if (!esZip(buf)) return fallo(`«${nombre}» no es un documento Word (.docx) válido.`);
      try {
        const t = (await mammoth.extractRawText({ buffer: buf })).value.trim();
        if (t.length < 5) return fallo(`«${nombre}» no tiene texto.`);
        items.push({ nombre, tipo: "texto", tam: buf.length, texto: t.slice(0, MAX_TEXTO) });
      } catch {
        return fallo(`No he podido leer el documento «${nombre}».`);
      }
    } else if (mime === XLSX) {
      if (!esZip(buf)) return fallo(`«${nombre}» no es un Excel (.xlsx) válido.`);
      try {
        const t = await excelATexto(buf);
        if (t.length < 3) return fallo(`«${nombre}» no tiene datos.`);
        items.push({ nombre, tipo: "texto", tam: buf.length, texto: t.slice(0, MAX_TEXTO) });
      } catch {
        return fallo(`No he podido leer el Excel «${nombre}». Si es un .xls antiguo, guárdalo como .xlsx o CSV.`);
      }
    } else if (/^text\/(plain|csv)$/.test(mime) || mime === "application/vnd.ms-excel" || mime === "application/csv") {
      if (buf.includes(0)) return fallo(`«${nombre}» no es un archivo de texto.`);
      const t = buf.toString("utf8").replace(/^\uFEFF/, "").trim();
      if (!t) return fallo(`«${nombre}» está vacío.`);
      items.push({ nombre, tipo: "texto", tam: buf.length, texto: t.slice(0, MAX_TEXTO) });
    } else {
      return fallo(`«${nombre}»: tipo no admitido. Puedes subir imágenes (PNG, JPG, WebP), PDF, Word (.docx), Excel (.xlsx), CSV o TXT.`);
    }
  }
  return { ok: true, items };
}
