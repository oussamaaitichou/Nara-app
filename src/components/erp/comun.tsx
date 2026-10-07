import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Rol = "asesoria_admin" | "asesoria_staff" | "cliente";
export type Perfil = {
  usuario: { id: number; nombre: string; email: string; rol: Rol; debeCambiar: boolean; farmaciaId: number | null };
  asesoria: { id: number; nombre: string; logo: string | null };
};
export const ROL: Record<Rol, string> = { asesoria_admin: "Administrador", asesoria_staff: "Gestor", cliente: "Cliente" };

export async function erp(method: "GET" | "POST", body?: Record<string, unknown>, query = "") {
  const res = await fetch(`/api/erp${query}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json: Record<string, any> = {};
  try {
    json = await res.json();
  } catch {
    // sin cuerpo
  }
  return { ok: res.ok, status: res.status, json };
}

export const campo = "h-10 w-full rounded-md border border-line bg-bg px-3 text-sm text-ink outline-none focus:border-teal";
export const eur = (x: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(x);
export const pct = (x: number | null, d = 1) => (x === null ? "—" : `${(x * 100).toLocaleString("es-ES", { maximumFractionDigits: d })} %`);

export function ClaveTemporal({ titulo, clave, onCerrar }: { titulo: string; clave: string; onCerrar: () => void }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="space-y-2 rounded-lg border border-teal bg-teal-mist p-4">
      <p className="text-sm text-teal-deep">{titulo} Cópiala ahora y entrégala por un canal seguro: no se vuelve a mostrar. Tendrá que cambiarla al entrar.</p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded-md bg-surface px-3 py-2 font-mono text-base tracking-wide text-ink">{clave}</code>
        <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(clave).then(() => setCopiado(true)).catch(() => undefined)}>
          {copiado ? <Check className="size-4" /> : <Copy className="size-4" />} {copiado ? "Copiada" : "Copiar"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCerrar}>Cerrar</Button>
      </div>
    </div>
  );
}

/** Gráfico de barras sencillo en SVG; admite valores negativos. */
export function Barras({ datos, titulo, signo = false }: { datos: { etiqueta: string; valor: number }[]; titulo: string; signo?: boolean }) {
  const W = 480, H = 150, pad = 18;
  const max = Math.max(0, ...datos.map((d) => d.valor));
  const min = Math.min(0, ...datos.map((d) => d.valor));
  const rango = max - min || 1;
  const y = (v: number) => pad + ((max - v) / rango) * (H - pad * 2);
  const ancho = (W - 20) / Math.max(datos.length, 1);
  return (
    <figure className="space-y-1">
      <figcaption className="text-sm font-medium text-ink-soft">{titulo}</figcaption>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label={titulo}>
        <line x1="10" x2={W - 10} y1={y(0)} y2={y(0)} stroke="currentColor" className="text-line" />
        {datos.map((d, i) => {
          const x = 10 + i * ancho + ancho * 0.15;
          const top = Math.min(y(d.valor), y(0));
          const alto = Math.max(Math.abs(y(d.valor) - y(0)), 1);
          return (
            <g key={d.etiqueta}>
              <rect x={x} y={top} width={ancho * 0.7} height={alto} rx="2" className={signo && d.valor < 0 ? "fill-danger" : "fill-teal"}>
                <title>{`${d.etiqueta}: ${eur(d.valor)}`}</title>
              </rect>
              <text x={x + ancho * 0.35} y={H + 12} textAnchor="middle" className="fill-subtle text-[9px]">{d.etiqueta}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
