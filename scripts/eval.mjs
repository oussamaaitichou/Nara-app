// Lanza las preguntas de evaluacion/preguntas.json contra la app en marcha y genera evaluacion/resultados.md
// Uso: con "npm run dev" abierto en otra terminal ->  npm run eval
import { readFileSync, writeFileSync } from "node:fs";

const URL = process.env.EVAL_URL || "http://127.0.0.1:8080/api/chat";
const DELAY = Number(process.env.EVAL_DELAY_MS || 6000); // respeta los límites de los planes gratuitos
const preguntas = JSON.parse(readFileSync("evaluacion/preguntas.json", "utf8"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ask(pregunta) {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: pregunta }] }),
  });
  if (!res.ok) return `⚠️ ERROR ${res.status}: ${(await res.text()).slice(0, 200)}`;
  const text = await res.text();
  return text
    .split("\n")
    .filter((l) => l.startsWith("data:"))
    .map((l) => {
      try { return JSON.parse(l.slice(5)).token ?? ""; } catch { return ""; }
    })
    .join("");
}

let md = `# Resultados de evaluación — ${new Date().toISOString().slice(0, 16).replace("T", " ")}\n\nMarca cada respuesta: ✅ correcta · ⚠️ parcial · ❌ incorrecta.\n`;
for (const p of preguntas) {
  console.log(`(${p.id}/${preguntas.length}) ${p.pregunta}`);
  const r = await ask(p.pregunta);
  md += `\n---\n\n## ${p.id}. ${p.pregunta}\n\n**Respuesta correcta (tuya):** ${p.respuesta_correcta || "_sin rellenar_"}\n\n**Notas:** ${p.notas || "-"}\n\n**Respuesta de Nara:**\n\n${r}\n\n**Valoración:** \n`;
  await sleep(DELAY);
}
writeFileSync("evaluacion/resultados.md", md);
console.log("Listo -> evaluacion/resultados.md");
