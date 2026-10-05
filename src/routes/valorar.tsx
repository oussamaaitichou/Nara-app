import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Calculator, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { SolicitudCta } from "@/components/valoracion/solicitud-form";
import { calcular, type Entrada } from "@/lib/valoracion/calculo";

export const Route = createFileRoute("/valorar")({
  component: ValorarPage,
  head: () => ({
    meta: [
      { title: "Valora tu farmacia — Nara" },
      { name: "description", content: "Calcula la rentabilidad y el valor orientativo de una oficina de farmacia, tuya o la que quieres comprar." },
    ],
  }),
});

type Modo = "vender" | "comprar";
type Form = Record<string, string>;

const EJEMPLO: Form = {
  ventas: "1000000", consumos: "700000", deducciones: "0", personal: "120000", arrendamiento: "20000", otros: "30000", titular: "60000",
  fondo: "500000", mobiliario: "10000", existencias: "60000", honorarios: "0", iva: "21", otrosCompra: "10000",
  financiado: "50", interes: "5", anosPrestamo: "10", anos: "10", crecIngresos: "0", crecGastos: "0", margen: "", amortizacion: "0",
  impuesto: "30", objetivo: "10",
};
const VACIO: Form = { ...Object.fromEntries(Object.keys(EJEMPLO).map((k) => [k, ""])), iva: "21", anos: "10", impuesto: "30", objetivo: "10" };

const num = (s: string) => {
  const v = parseFloat((s ?? "").replace(",", "."));
  return Number.isFinite(v) ? v : 0;
};
const eur = (x: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(x);
const pct = (x: number | null, d = 1) => (x === null ? "—" : `${(x * 100).toLocaleString("es-ES", { maximumFractionDigits: d })} %`);

const input = "h-10 w-full rounded-md border border-line bg-bg px-3 text-sm text-ink outline-none focus:border-teal";

function Campo({ id, label, value, onChange, sufijo, ayuda }: { id: string; label: string; value: string; onChange: (v: string) => void; sufijo?: string; ayuda?: string }) {
  return (
    <label className="block space-y-1 text-sm text-ink-soft" htmlFor={id}>
      <span>{label}</span>
      <div className="relative">
        <input id={id} type="number" inputMode="decimal" min={0} step="any" value={value} onChange={(e) => onChange(e.target.value)} className={`${input} ${sufijo ? "pr-9" : ""}`} />
        {sufijo ? <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-subtle">{sufijo}</span> : null}
      </div>
      {ayuda ? <span className="block text-xs text-subtle">{ayuda}</span> : null}
    </label>
  );
}

function Bloque({ titulo, children, nota }: { titulo: string; children: React.ReactNode; nota?: string }) {
  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <h2 className="font-display text-lg font-semibold text-ink">{titulo}</h2>
      {nota ? <p className="text-sm text-muted">{nota}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Dato({ etiqueta, valor, destacado }: { etiqueta: string; valor: string; destacado?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1.5 ${destacado ? "font-semibold text-ink" : "text-ink-soft"}`}>
      <span className="text-sm">{etiqueta}</span>
      <span className={destacado ? "text-base" : "text-sm"}>{valor}</span>
    </div>
  );
}

function ValorarPage() {
  const [modo, setModo] = useState<Modo>("vender");
  const [f, setF] = useState<Form>(VACIO);
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const entrada: Entrada = useMemo(
    () => ({
      ventas: num(f.ventas), consumos: num(f.consumos), deducciones: num(f.deducciones),
      gastosPersonal: num(f.personal), gastosArrendamiento: num(f.arrendamiento), otrosGastos: num(f.otros), remuneracionTitular: num(f.titular),
      fondoComercio: modo === "comprar" ? num(f.fondo) : 0, mobiliario: num(f.mobiliario), existencias: num(f.existencias),
      honorariosPct: num(f.honorarios) / 100, ivaHonorariosPct: num(f.iva) / 100, otrosGastosCompra: modo === "comprar" ? num(f.otrosCompra) : 0,
      financiadoPct: modo === "comprar" ? num(f.financiado) / 100 : 0, interes: num(f.interes) / 100, anosPrestamo: num(f.anosPrestamo),
      anosProyeccion: num(f.anos) || 10, crecIngresos: num(f.crecIngresos) / 100, crecGastos: num(f.crecGastos) / 100,
      margenBrutoPct: f.margen.trim() ? num(f.margen) / 100 : null, amortizacionAnual: num(f.amortizacion), tipoImpuesto: num(f.impuesto) / 100,
      rentabilidadObjetivo: num(f.objetivo) / 100,
    }),
    [f, modo],
  );
  const obj = entrada.rentabilidadObjetivo > 0 ? entrada.rentabilidadObjetivo : 0.1;
  const objetivos = useMemo(() => [obj - 0.04, obj - 0.02, obj, obj + 0.02, obj + 0.04].filter((x) => x >= 0.02), [obj]);
  const r = useMemo(() => calcular(entrada, objetivos), [entrada, objetivos]);
  const listo = entrada.ventas > 0;
  const principal = r.valores.find((v) => Math.abs(v.objetivo - obj) < 1e-9);
  const dif = principal && modo === "comprar" ? num(f.fondo) - principal.fondoMax : null;

  return (
    <div className="min-h-dvh bg-bg">
      <SiteHeader solid />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 space-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Valora tu farmacia</h1>
          <p className="max-w-2xl text-muted">Calcula cuánto rinde una oficina de farmacia y qué precio justifican sus números. Sirve para la tuya o para la que quieres comprar.</p>
          <p className="flex items-center gap-2 text-sm text-teal-deep">
            <ShieldCheck className="size-4" /> Los cálculos se hacen en tu navegador: lo que escribes no se envía ni se guarda.
          </p>
        </div>

        <div role="tablist" className="mb-6 inline-flex rounded-lg border border-line bg-surface p-1">
          {([["vender", "Valora tu farmacia"], ["comprar", "Valora la que quieres comprar"]] as const).map(([m, t]) => (
            <button key={m} role="tab" aria-selected={modo === m} type="button" onClick={() => setModo(m)}
              className={`rounded-md px-4 py-2 text-sm font-medium ${modo === m ? "bg-teal text-white" : "text-ink-soft hover:text-ink"}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_26rem]">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setF(EJEMPLO)}><Calculator className="size-4" /> Rellenar con un ejemplo</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setF(VACIO)}>Borrar todo</Button>
            </div>

            <Bloque titulo="1. Datos del último año" nota="Importes anuales sin IVA.">
              <Campo id="ventas" label="Ventas totales" value={f.ventas} onChange={set("ventas")} sufijo="€" />
              <Campo id="consumos" label="Compras (consumos a precio de coste)" value={f.consumos} onChange={set("consumos")} sufijo="€" />
              <Campo id="deducciones" label="Deducciones y ajustes del margen" value={f.deducciones} onChange={set("deducciones")} sufijo="€" ayuda="Lo que reduce el margen: deducciones sobre medicamentos, abonos…" />
              <Campo id="personal" label="Gastos de personal (con Seguridad Social)" value={f.personal} onChange={set("personal")} sufijo="€" />
              <Campo id="arrendamiento" label="Alquiler" value={f.arrendamiento} onChange={set("arrendamiento")} sufijo="€" />
              <Campo id="otros" label="Otros gastos de explotación" value={f.otros} onChange={set("otros")} sufijo="€" ayuda="Suministros, seguros, servicios, publicidad…" />
              <Campo id="titular" label="Coste del titular trabajando en la farmacia" value={f.titular} onChange={set("titular")} sufijo="€" ayuda="Si el titular trabaja en ella, ponlo aquí. Si lo dejas en 0, el resultado saldrá inflado." />
            </Bloque>

            {modo === "comprar" ? (
              <>
                <Bloque titulo="2. La operación">
                  <Campo id="fondo" label="Precio del fondo de comercio" value={f.fondo} onChange={set("fondo")} sufijo="€" />
                  <Campo id="mobiliario" label="Mobiliario e instalaciones" value={f.mobiliario} onChange={set("mobiliario")} sufijo="€" />
                  <Campo id="existencias" label="Existencias a precio de coste" value={f.existencias} onChange={set("existencias")} sufijo="€" />
                  <Campo id="otrosCompra" label="Otros gastos de la compra" value={f.otrosCompra} onChange={set("otrosCompra")} sufijo="€" ayuda="Notaría, registro, impuestos de la operación, hipoteca…" />
                  <Campo id="honorarios" label="Honorarios de intermediación" value={f.honorarios} onChange={set("honorarios")} sufijo="%" ayuda="Sobre fondo de comercio + mobiliario. Déjalo en 0 si no hay." />
                  <Campo id="iva" label="IVA de los honorarios" value={f.iva} onChange={set("iva")} sufijo="%" />
                </Bloque>
                <Bloque titulo="3. Financiación">
                  <Campo id="financiado" label="Parte de la inversión que financias" value={f.financiado} onChange={set("financiado")} sufijo="%" />
                  <Campo id="interes" label="Interés anual del préstamo" value={f.interes} onChange={set("interes")} sufijo="%" />
                  <Campo id="anosPrestamo" label="Plazo del préstamo" value={f.anosPrestamo} onChange={set("anosPrestamo")} sufijo="años" />
                </Bloque>
              </>
            ) : (
              <Bloque titulo="2. Activos que se traspasan" nota="Opcional. Sirven para calcular el valor total de la operación.">
                <Campo id="mobiliario" label="Mobiliario e instalaciones" value={f.mobiliario} onChange={set("mobiliario")} sufijo="€" />
                <Campo id="existencias" label="Existencias a precio de coste" value={f.existencias} onChange={set("existencias")} sufijo="€" />
              </Bloque>
            )}

            <Bloque titulo={modo === "comprar" ? "4. Supuestos" : "3. Supuestos"} nota="Son tuyos: cambia cualquier valor y el resultado se recalcula.">
              <Campo id="objetivo" label="Rentabilidad que exige el comprador" value={f.objetivo} onChange={set("objetivo")} sufijo="%" ayuda="Beneficio anual después de impuestos entre la inversión total." />
              <Campo id="impuesto" label="Tipo impositivo efectivo sobre el beneficio" value={f.impuesto} onChange={set("impuesto")} sufijo="%" ayuda="Estimación. Ajústala a la situación fiscal real; consúltalo con tu asesor." />
              <Campo id="amortizacion" label="Amortización anual deducible" value={f.amortizacion} onChange={set("amortizacion")} sufijo="€" />
              <Campo id="anos" label="Años de proyección" value={f.anos} onChange={set("anos")} sufijo="años" />
              <Campo id="crecIngresos" label="Crecimiento anual de las ventas" value={f.crecIngresos} onChange={set("crecIngresos")} sufijo="%" />
              <Campo id="crecGastos" label="Crecimiento anual de los gastos" value={f.crecGastos} onChange={set("crecGastos")} sufijo="%" />
              <Campo id="margen" label="Margen bruto previsto (opcional)" value={f.margen} onChange={set("margen")} sufijo="%" ayuda="Si lo dejas vacío se usa el del último año." />
            </Bloque>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            {!listo ? (
              <div className="rounded-xl border border-line bg-surface p-5 text-sm text-muted">Introduce las ventas anuales y los datos del último año para ver el resultado.</div>
            ) : (
              <>
                <section className="rounded-xl border border-line bg-surface p-5">
                  <h2 className="mb-1 font-display text-lg font-semibold text-ink">Último año</h2>
                  <Dato etiqueta="Margen bruto" valor={`${eur(r.margenBruto0)} (${pct(r.margenBrutoPct)})`} />
                  <Dato etiqueta="Gastos de explotación" valor={eur(r.gastos0)} />
                  <Dato destacado etiqueta="Resultado de explotación" valor={`${eur(r.resultadoExplotacion0)} (${pct(r.resultadoExplotacion0 / entrada.ventas)})`} />
                  {r.resultadoExplotacion0 <= 0 ? (
                    <p className="mt-2 flex gap-2 rounded-md bg-warn-soft px-3 py-2 text-sm text-warn"><AlertTriangle className="mt-0.5 size-4 shrink-0" /> Con estos datos la farmacia no genera beneficio, y por rentabilidad no se justifica ningún precio.</p>
                  ) : null}
                </section>

                <section className="rounded-xl border border-teal bg-teal-mist p-5">
                  <h2 className="mb-1 font-display text-lg font-semibold text-teal-deep">{modo === "vender" ? "Lo que podría pagar un comprador" : "Precio máximo que justifican los números"}</h2>
                  <p className="mb-2 text-sm text-teal-deep">Con una rentabilidad exigida del {pct(obj)}:</p>
                  <p className="font-display text-3xl font-semibold text-ink">{principal ? eur(principal.fondoMax) : "—"}</p>
                  <p className="text-sm text-muted">de fondo de comercio{principal ? ` · inversión total ${eur(principal.inversionMax)}` : ""}</p>
                  {dif !== null ? (
                    <p className={`mt-3 rounded-md px-3 py-2 text-sm ${dif > 0 ? "bg-warn-soft text-warn" : "bg-surface text-teal-deep"}`}>
                      {dif > 0 ? `El precio pedido está ${eur(dif)} por encima de lo que justifica tu rentabilidad.` : `El precio pedido está ${eur(-dif)} por debajo del máximo para tu rentabilidad.`}
                    </p>
                  ) : null}
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-xs text-subtle"><th className="pb-1 font-medium">Rentabilidad exigida</th><th className="pb-1 text-right font-medium">Fondo de comercio</th></tr></thead>
                      <tbody>
                        {r.valores.map((v) => (
                          <tr key={v.objetivo} className={Math.abs(v.objetivo - obj) < 1e-9 ? "font-semibold text-ink" : "text-ink-soft"}>
                            <td className="py-1">{pct(v.objetivo, 0)}</td><td className="py-1 text-right">{eur(v.fondoMax)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {modo === "comprar" ? (
                  <section className="rounded-xl border border-line bg-surface p-5">
                    <h2 className="mb-1 font-display text-lg font-semibold text-ink">La compra</h2>
                    <Dato etiqueta="Inversión total" valor={eur(r.inversion.total)} destacado />
                    <Dato etiqueta="Préstamo" valor={eur(r.prestamo)} />
                    <Dato etiqueta="Capital propio" valor={eur(r.capitalPropio)} />
                    <Dato etiqueta="Cuota anual del préstamo" valor={eur(r.cuota)} />
                    <div className="my-2 border-t border-line" />
                    <Dato etiqueta="Beneficio neto medio anual" valor={eur(r.beneficioNetoMedio)} destacado />
                    <Dato etiqueta="Rentabilidad sobre la inversión total" valor={pct(r.rentInversion)} />
                    <Dato etiqueta="Rentabilidad sobre el capital propio" valor={pct(r.rentCapitalPropio)} />
                    <Dato etiqueta="Recuperas tu capital propio en" valor={r.capitalPropio <= 0 ? "—" : r.payback === null ? `más de ${r.filas.length} años` : `${r.payback.toLocaleString("es-ES", { maximumFractionDigits: 1 })} años`} />
                    <Dato etiqueta="Cobertura de la deuda (año 1)" valor={r.cobertura === null ? "—" : `${r.cobertura.toLocaleString("es-ES", { maximumFractionDigits: 2 })} veces`} />
                    {r.cobertura !== null && r.cobertura < 1.2 ? <p className="mt-2 rounded-md bg-warn-soft px-3 py-2 text-sm text-warn">La cobertura es justa: el resultado apenas alcanza para pagar la deuda.</p> : null}
                    <details className="mt-3 text-sm">
                      <summary className="cursor-pointer font-medium text-teal-deep">Ver la proyección año a año</summary>
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead><tr className="text-right text-subtle"><th className="pb-1 text-left font-medium">Año</th><th className="pb-1 font-medium">Resultado expl.</th><th className="pb-1 font-medium">Beneficio neto</th><th className="pb-1 font-medium">Tras deuda</th></tr></thead>
                          <tbody>{r.filas.map((x) => (
                            <tr key={x.ano} className="text-right text-ink-soft"><td className="py-0.5 text-left">{x.ano}</td><td>{eur(x.resultadoExplotacion)}</td><td>{eur(x.beneficioNeto)}</td><td>{eur(x.excedente)}</td></tr>
                          ))}</tbody>
                        </table>
                      </div>
                    </details>
                  </section>
                ) : null}
              </>
            )}

            <SolicitudCta
              modo={modo}
              datos={{
                modo,
                introducido: f,
                resultado: listo ? { inversionTotal: r.inversion.total, resultadoExplotacion: r.resultadoExplotacion0, rentabilidadInversion: r.rentInversion, fondoMaximo: principal?.fondoMax ?? null } : null,
              }}
            />

            <p className="text-xs text-subtle">
              Estimación orientativa basada en los datos y supuestos que has introducido. No es una tasación, una oferta ni asesoramiento fiscal, jurídico o financiero: contrástala con tu asesor antes de decidir. El valor se calcula dividiendo el beneficio anual después de impuestos y antes de intereses entre la rentabilidad exigida; no recoge precios de mercado.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
