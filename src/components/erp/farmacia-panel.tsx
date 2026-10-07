import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Download, Info, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { calcularIndicadores, nombrePeriodo, variacion } from "@/lib/erp/indicadores";
import { leerTabla, PLANTILLA_CSV, type FilaMes } from "@/lib/erp/importar";
import { Barras, erp, eur, pct, type Perfil } from "./comun";

const corto = (p: string) => `${["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"][+p.slice(5, 7) - 1]} ${p.slice(2, 4)}`;
const Var = ({ v }: { v: number | null }) =>
  v === null ? null : <span className={v >= 0 ? "text-teal-deep" : "text-danger"}>{v >= 0 ? "▲" : "▼"} {Math.abs(v * 100).toLocaleString("es-ES", { maximumFractionDigits: 1 })} %</span>;

function Tarjeta({ titulo, valor, sub, extra }: { titulo: string; valor: string; sub?: string; extra?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs font-medium tracking-wide text-subtle uppercase">{titulo}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink">{valor}</p>
      {sub ? <p className="text-sm text-muted">{sub}</p> : null}
      {extra ? <p className="mt-1 text-xs text-muted">{extra}</p> : null}
    </div>
  );
}

export function FarmaciaPanel({ farmaciaId, perfil, onSesion }: { farmaciaId: number; perfil: Perfil; onSesion: () => void }) {
  const [pestana, setPestana] = useState<"mando" | "importar">("mando");
  const [datos, setDatos] = useState<{ farmacia: { nombre: string; ccaa: string | null }; filas: FilaMes[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    const r = await erp("GET", undefined, `?r=datos&farmacia=${farmaciaId}`);
    if (r.status === 401) return onSesion();
    if (!r.ok) return setError((r.json.error as string) ?? "No se han podido cargar los datos.");
    setDatos({ farmacia: r.json.farmacia, filas: r.json.filas });
    setError(null);
  }, [farmaciaId, onSesion]);
  useEffect(() => void cargar(), [cargar]);

  const ind = useMemo(() => calcularIndicadores(datos?.filas ?? []), [datos]);
  const lectura = useMemo(() => (texto.trim() ? leerTabla(texto) : null), [texto]);
  const u = ind.ultimo;
  const ult12 = ind.meses.slice(-12);

  async function importar() {
    setEnviando(true);
    setAviso(null);
    const r = await erp("POST", { accion: "importar", farmaciaId, texto });
    setEnviando(false);
    if (r.status === 401) return onSesion();
    if (!r.ok) return setAviso((r.json.error as string) ?? "No se ha podido importar.");
    setTexto("");
    setAviso(`Importados ${r.json.importados} meses.`);
    setPestana("mando");
    await cargar();
  }
  async function borrar(p: string) {
    if (!window.confirm(`¿Borrar los datos de ${nombrePeriodo(p)}?`)) return;
    await erp("POST", { accion: "borrar_mes", farmaciaId, periodo: p });
    await cargar();
  }
  function plantilla() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + PLANTILLA_CSV], { type: "text/csv;charset=utf-8" }));
    a.download = "plantilla-nara.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (error) return <p className="text-danger">{error}</p>;
  if (!datos) return <p className="text-muted">Cargando…</p>;

  return (
    <div className="space-y-6">
      {/* Cabecera del informe: se ve también al imprimir */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {perfil.asesoria.logo ? <img src={perfil.asesoria.logo} alt={perfil.asesoria.nombre} className="max-h-12 max-w-40 object-contain" /> : null}
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">{datos.farmacia.nombre}</h2>
            <p className="text-sm text-muted">{datos.farmacia.ccaa ? `${datos.farmacia.ccaa} · ` : ""}{u ? `Datos hasta ${nombrePeriodo(u.periodo)}` : "Sin datos todavía"} · {perfil.asesoria.nombre}</p>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <div role="tablist" className="inline-flex rounded-lg border border-line bg-surface p-1">
            {([["mando", "Cuadro de mando"], ["importar", "Importar datos"]] as const).map(([k, t]) => (
              <button key={k} role="tab" aria-selected={pestana === k} type="button" onClick={() => setPestana(k)} className={`rounded-md px-3 py-1.5 text-sm font-medium ${pestana === k ? "bg-teal text-white" : "text-ink-soft"}`}>{t}</button>
            ))}
          </div>
          {u ? <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="size-4" /> Imprimir informe</Button> : null}
        </div>
      </div>
      {aviso ? <p className="rounded-md bg-teal-mist px-3 py-2 text-sm text-teal-deep print:hidden">{aviso}</p> : null}

      {pestana === "importar" ? (
        <section className="space-y-4 rounded-xl border border-line bg-surface p-5 print:hidden">
          <h3 className="font-display text-lg font-semibold text-ink">Importar datos mensuales</h3>
          <p className="flex gap-2 text-sm text-muted"><Info className="mt-0.5 size-4 shrink-0" /> Copia las filas desde Excel y pégalas aquí, o sube un CSV. Una fila por mes, con las columnas <strong>mes, ventas, compras, personal, alquiler, otros</strong>. Importes sin IVA. Si un mes ya existe, se actualiza. No incluyas datos de pacientes.</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={plantilla}><Download className="size-4" /> Descargar plantilla</Button>
            <label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-line bg-surface px-3 text-sm font-medium text-ink hover:border-teal">
              Subir un CSV
              <input type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f && f.size < 100_000) void f.text().then(setTexto); e.target.value = ""; }} />
            </label>
          </div>
          <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={8} placeholder={"mes\tventas\tcompras\tpersonal\talquiler\totros\n2026-01\t85000\t59500\t12000\t2000\t4500"} className="font-mono text-xs" />
          {lectura ? (
            <div className="space-y-1 text-sm">
              {lectura.filas.length ? <p className="text-teal-deep">Se han entendido {lectura.filas.length} meses: de {nombrePeriodo(lectura.filas[0]!.periodo)} a {nombrePeriodo(lectura.filas.at(-1)!.periodo)}.</p> : null}
              {lectura.errores.map((e) => <p key={e} className="text-danger">{e}</p>)}
            </div>
          ) : null}
          <Button onClick={() => void importar()} disabled={enviando || !lectura?.filas.length}>{enviando ? "Importando…" : "Importar"}</Button>
        </section>
      ) : !u ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center">
          <p className="text-ink">Esta farmacia todavía no tiene datos.</p>
          <p className="mb-4 text-sm text-muted">Importa los datos mensuales para ver su cuadro de mando.</p>
          <Button onClick={() => setPestana("importar")}>Importar datos</Button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Tarjeta titulo={`Ventas · ${nombrePeriodo(u.periodo)}`} valor={eur(u.ventas)} extra={<>{ind.anterior ? <>vs mes anterior <Var v={variacion(u.ventas, ind.anterior.ventas)} /></> : null}{ind.interanual ? <> · vs mismo mes del año anterior <Var v={variacion(u.ventas, ind.interanual.ventas)} /></> : null}</>} />
            <Tarjeta titulo="Margen bruto" valor={eur(u.margen)} sub={pct(u.margenPct)} extra={ind.anterior ? <>mes anterior: {pct(ind.anterior.margenPct)}</> : undefined} />
            <Tarjeta titulo="Resultado del mes" valor={eur(u.resultado)} sub={pct(u.resultadoPct)} extra="Margen − personal, alquiler y otros gastos" />
            <Tarjeta titulo={`Acumulado ${u.periodo.slice(0, 4)}`} valor={eur(ind.ytd?.resultado ?? 0)} sub={`${eur(ind.ytd?.ventas ?? 0)} de ventas`} extra={`${ind.ytd?.meses} meses con datos`} />
          </div>

          <section className="space-y-2 rounded-xl border border-line bg-surface p-5">
            <h3 className="font-display text-lg font-semibold text-ink">Señales</h3>
            <ul className="space-y-1.5">
              {ind.senales.map((s) => (
                <li key={s.texto} className={`flex gap-2 text-sm ${s.nivel === "aviso" ? "text-warn" : "text-muted"}`}>
                  {s.nivel === "aviso" ? <AlertTriangle className="mt-0.5 size-4 shrink-0" /> : <Info className="mt-0.5 size-4 shrink-0" />} {s.texto}
                </li>
              ))}
            </ul>
            <p className="text-xs text-subtle">Señales automáticas por reglas fijas: comparan el último mes con la media de los 3 anteriores. Son orientativas, no un diagnóstico.</p>
          </section>

          <div className="grid gap-6 rounded-xl border border-line bg-surface p-5 md:grid-cols-2">
            <Barras titulo="Ventas por mes" datos={ult12.map((m) => ({ etiqueta: corto(m.periodo), valor: m.ventas }))} />
            <Barras titulo="Resultado por mes" signo datos={ult12.map((m) => ({ etiqueta: corto(m.periodo), valor: m.resultado }))} />
          </div>

          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-line text-right text-xs text-subtle"><th className="p-3 text-left font-medium">Mes</th><th className="p-3 font-medium">Ventas</th><th className="p-3 font-medium">Margen</th><th className="p-3 font-medium">Gastos</th><th className="p-3 font-medium">Resultado</th><th className="p-3 print:hidden" /></tr></thead>
              <tbody>
                {[...ult12].reverse().map((m) => (
                  <tr key={m.periodo} className="border-b border-line/60 text-right text-ink-soft last:border-0">
                    <td className="p-3 text-left capitalize">{nombrePeriodo(m.periodo)}</td><td className="p-3">{eur(m.ventas)}</td><td className="p-3">{eur(m.margen)} <span className="text-xs text-subtle">({pct(m.margenPct, 0)})</span></td><td className="p-3">{eur(m.gastos)}</td>
                    <td className={`p-3 font-medium ${m.resultado < 0 ? "text-danger" : "text-ink"}`}>{eur(m.resultado)}</td>
                    <td className="p-3 print:hidden"><button type="button" aria-label={`Borrar ${m.periodo}`} onClick={() => void borrar(m.periodo)} className="text-subtle hover:text-danger"><Trash2 className="size-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-subtle">Resultado = ventas − compras − personal − alquiler − otros gastos, antes de impuestos y amortizaciones. Informe orientativo elaborado con los datos importados.</p>
        </>
      )}
    </div>
  );
}
