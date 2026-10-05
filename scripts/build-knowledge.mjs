// Lee conocimiento/*.md (menos los que empiezan por "_") y genera src/lib/knowledge/chunks.json
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "conocimiento");
const out = join(root, "src/lib/knowledge/chunks.json");
const MAX = 1400;

function parse(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
  }
  return { meta, body: m[2] };
}

function splitLong(text) {
  if (text.length <= MAX) return [text];
  const parts = [];
  let cur = "";
  for (const para of text.split(/\n{2,}/)) {
    if (cur && (cur + "\n\n" + para).length > MAX) {
      parts.push(cur);
      cur = para;
    } else cur = cur ? cur + "\n\n" + para : para;
  }
  if (cur) parts.push(cur);
  return parts;
}

const chunks = [];
let files = [];
try {
  files = readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("_") && f.toLowerCase() !== "readme.md");
} catch {
  // carpeta inexistente: índice vacío
}

for (const file of files.sort()) {
  const { meta, body } = parse(readFileSync(join(dir, file), "utf8"));
  const doc = file.replace(/\.md$/, "");
  const titulo = meta.titulo || doc;
  const base = {
    doc,
    titulo,
    fuente: meta.fuente || "sin indicar",
    revisado: meta.revisado || "sin fecha",
    ambito: meta.ambito || "sin indicar",
    verificado: ["si", "sí", "true", "yes"].includes((meta.verificado || "").toLowerCase()),
  };
  const sections = body.split(/^##\s+/m);
  const intro = sections.shift()?.replace(/^#\s+.*\n?/, "").trim();
  const list = [];
  if (intro) list.push({ seccion: "Introducción", texto: intro });
  for (const s of sections) {
    const nl = s.indexOf("\n");
    const seccion = (nl === -1 ? s : s.slice(0, nl)).trim();
    const texto = (nl === -1 ? "" : s.slice(nl + 1)).trim();
    if (texto) list.push({ seccion, texto });
  }
  for (const item of list) {
    splitLong(item.texto).forEach((t, n) =>
      chunks.push({ id: `${doc}#${chunks.length}`, ...base, seccion: n ? `${item.seccion} (cont.)` : item.seccion, texto: t }),
    );
  }
}

writeFileSync(out, JSON.stringify(chunks, null, 1) + "\n");
console.log(`[conocimiento] ${files.length} documento(s), ${chunks.length} fragmento(s)`);

// ---- Instrucciones de estilo: instrucciones/estilo.md -> src/lib/knowledge/instrucciones.json
let estilo = "";
try {
  estilo = readFileSync(join(root, "instrucciones/estilo.md"), "utf8")
    .replace(/<!--[\s\S]*?-->/g, "") // las notas entre <!-- --> no llegan a la IA
    .replace(/^#\s+.*\n?/m, "") // quita el título principal
    .replace(/\n{3,}/g, "\n\n")
    .trim();
} catch {
  // sin archivo: sin instrucciones extra
}
writeFileSync(join(root, "src/lib/knowledge/instrucciones.json"), JSON.stringify({ estilo }, null, 1) + "\n");
console.log(`[instrucciones] estilo: ${estilo.length} caracteres`);

// ---- Textos legales: legal/*.md -> src/lib/knowledge/legal.json (se muestran en /legal/<documento>)
const legal = {};
for (const doc of ["privacidad", "aviso-legal", "condiciones", "cookies"]) {
  let t = "";
  try {
    t = readFileSync(join(root, "legal", `${doc}.md`), "utf8").replace(/<!--[\s\S]*?-->/g, "").trim();
  } catch {
    // sin archivo: documento sin publicar
  }
  legal[doc] = t;
}
writeFileSync(join(root, "src/lib/knowledge/legal.json"), JSON.stringify(legal, null, 1) + "\n");
console.log(`[legal] publicados: ${Object.entries(legal).filter(([, v]) => v).map(([k]) => k).join(", ") || "ninguno"}`);
