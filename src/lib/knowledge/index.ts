import chunks from "./chunks.json";
import instrucciones from "./instrucciones.json";
import { buildIndex, search, formatContext, formatSources, type Chunk } from "./core";

const index = buildIndex(chunks as Chunk[]);

export function retrieve(query: string, k = 4): Chunk[] {
  return search(index, query, k);
}

export { formatContext, formatSources };
export const ESTILO: string = (instrucciones as { estilo?: string }).estilo ?? "";
export const CEREBRO: string = (instrucciones as { cerebro?: string }).cerebro ?? "";
export const KNOWLEDGE_CHUNKS = index.chunks.length;
