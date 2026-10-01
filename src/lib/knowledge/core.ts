export type Chunk = {
  id: string;
  doc: string;
  titulo: string;
  seccion: string;
  fuente: string;
  revisado: string;
  ambito: string;
  verificado: boolean;
  texto: string;
};

const STOP = new Set(
  "que los las del una uno unos unas por con para como pero sus este esta esto estos estas ese esa eso son del al lo le les se su mas muy sin sobre entre cuando donde quien cual cuales hay ser esta estan tiene tienen puede pueden hacer hago tengo quiero necesito".split(
    " ",
  ),
);

function stem(t: string): string {
  if (t.length > 4 && t.endsWith("es")) return t.slice(0, -2);
  if (t.length > 3 && t.endsWith("s")) return t.slice(0, -1);
  return t;
}

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP.has(t))
    .map(stem);
}

export type Index = {
  chunks: Chunk[];
  tfs: Map<string, number>[];
  lens: number[];
  df: Map<string, number>;
  avgLen: number;
};

export function buildIndex(chunks: Chunk[]): Index {
  const tfs: Map<string, number>[] = [];
  const lens: number[] = [];
  const df = new Map<string, number>();
  for (const c of chunks) {
    // el título y la sección pesan doble
    const tokens = tokenize(`${c.titulo} ${c.seccion} ${c.titulo} ${c.seccion} ${c.texto}`);
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    tfs.push(tf);
    lens.push(tokens.length);
  }
  const avgLen = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  return { chunks, tfs, lens, df, avgLen };
}

export function search(index: Index, query: string, k = 4): Chunk[] {
  const q = [...new Set(tokenize(query))];
  const N = index.chunks.length;
  if (!q.length || !N) return [];
  const k1 = 1.5;
  const b = 0.75;
  const scored: { i: number; score: number; matched: number }[] = [];
  for (let i = 0; i < N; i++) {
    let score = 0;
    let matched = 0;
    for (const term of q) {
      const f = index.tfs[i]!.get(term);
      if (!f) continue;
      matched++;
      const n = index.df.get(term) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * index.lens[i]!) / (index.avgLen || 1))));
    }
    // exige al menos dos términos en común (o uno si la consulta solo tiene uno)
    if (matched >= Math.min(2, q.length)) scored.push({ i, score, matched });
  }
  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, k).map((s) => index.chunks[s.i]!);
}

export function formatContext(found: Chunk[]): string {
  if (!found.length) {
    return [
      "DOCUMENTOS DE REFERENCIA: no hay ningún documento de la base de conocimiento que cubra esta consulta.",
      "Responde con cautela, no cites artículos, plazos ni porcentajes concretos si no estás seguro, y di claramente qué hay que contrastar y con quién.",
    ].join("\n");
  }
  const head = [
    "DOCUMENTOS DE REFERENCIA (base de conocimiento del equipo):",
    "Usa estos documentos como fuente prioritaria para plazos, cifras, artículos y criterios. Cítalos en el texto con su código entre corchetes, por ejemplo [D1].",
    "No inventes artículos, plazos ni porcentajes que no estén aquí o que no conozcas con seguridad.",
    "Si un documento figura como «pendiente de verificar», dilo al usuario. Si estos documentos no cubren del todo la pregunta, indícalo y recomienda contrastarlo.",
    "",
  ];
  const body = found.map((c, i) => {
    const estado = c.verificado ? "verificado" : "pendiente de verificar";
    return `[D${i + 1}] ${c.titulo} — ${c.seccion} (ámbito: ${c.ambito} · fuente: ${c.fuente} · revisado: ${c.revisado} · ${estado})\n${c.texto}`;
  });
  return [...head, ...body].join("\n\n");
}

export function formatSources(found: Chunk[]): string {
  if (!found.length) return "";
  const lines = found.map(
    (c, i) =>
      `- [D${i + 1}] ${c.titulo} — ${c.seccion} (${c.fuente}, revisado ${c.revisado}${c.verificado ? "" : ", pendiente de verificar"})`,
  );
  return `\n\n---\n**Documentos consultados**\n${lines.join("\n")}`;
}
