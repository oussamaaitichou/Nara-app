/**
 * Cálculo de rentabilidad y valor orientativo de una oficina de farmacia.
 * Funciones puras: sin red, sin base de datos. Los porcentajes se expresan como fracciones (0.06 = 6 %).
 */

export type Entrada = {
  // Datos del último año (euros, sin IVA)
  ventas: number;
  consumos: number; // compras a precio de coste
  deducciones: number; // deducciones y ajustes que reducen el margen (importe positivo)
  gastosPersonal: number;
  gastosArrendamiento: number;
  otrosGastos: number;
  remuneracionTitular: number; // lo que costaría el titular trabajando en la farmacia
  // Operación
  fondoComercio: number;
  mobiliario: number;
  existencias: number; // a precio de coste
  honorariosPct: number; // sobre fondo de comercio + mobiliario
  ivaHonorariosPct: number;
  otrosGastosCompra: number; // notaría, registro, impuestos de la operación, otros
  // Financiación
  financiadoPct: number; // parte de la inversión total que se financia
  interes: number; // interés anual
  anosPrestamo: number;
  // Proyección
  anosProyeccion: number;
  crecIngresos: number;
  crecGastos: number;
  margenBrutoPct: number | null; // si es null se usa el del último año
  amortizacionAnual: number; // amortización anual deducible (importe)
  tipoImpuesto: number; // tipo efectivo sobre el beneficio
  // Valoración
  rentabilidadObjetivo: number;
};

export type Fila = {
  ano: number;
  ingresos: number;
  margenBruto: number;
  gastos: number;
  resultadoExplotacion: number;
  intereses: number;
  devolucionPrestamo: number;
  impuestos: number;
  beneficioNeto: number;
  excedente: number; // beneficio neto + amortización - devolución del préstamo
};

export type Resultado = {
  margenBruto0: number;
  margenBrutoPct: number;
  gastos0: number;
  resultadoExplotacion0: number;
  inversion: { base: number; honorarios: number; iva: number; existencias: number; otros: number; total: number };
  prestamo: number;
  capitalPropio: number;
  cuota: number;
  filas: Fila[];
  beneficioNetoMedio: number;
  beneficioOperativoMedio: number; // después de impuestos y antes de intereses
  rentInversion: number | null;
  rentCapitalPropio: number | null;
  payback: number | null; // años; null si no se recupera en el horizonte
  cobertura: number | null; // cobertura de la deuda del primer año
  valores: { objetivo: number; inversionMax: number; fondoMax: number }[];
};

const n = (x: number) => (Number.isFinite(x) ? x : 0);

/** Cuota anual constante de un préstamo (sistema francés, pagos anuales). */
export function cuotaAnual(prestamo: number, interes: number, anos: number): number {
  if (prestamo <= 0 || anos <= 0) return 0;
  if (interes <= 0) return prestamo / anos;
  return (prestamo * interes) / (1 - Math.pow(1 + interes, -anos));
}

export function calcular(e: Entrada, objetivos: number[] = []): Resultado {
  const ventas = n(e.ventas);
  const margenBruto0 = ventas - n(e.consumos) - n(e.deducciones);
  const margenBrutoPct = e.margenBrutoPct ?? (ventas > 0 ? margenBruto0 / ventas : 0);
  const gastos0 = n(e.gastosPersonal) + n(e.gastosArrendamiento) + n(e.otrosGastos) + n(e.remuneracionTitular);

  const base = n(e.fondoComercio) + n(e.mobiliario);
  const honorarios = base * n(e.honorariosPct);
  const iva = honorarios * n(e.ivaHonorariosPct);
  const total = base + honorarios + iva + n(e.existencias) + n(e.otrosGastosCompra);

  const prestamo = total * Math.min(1, Math.max(0, n(e.financiadoPct)));
  const capitalPropio = total - prestamo;
  const anosPrestamo = Math.max(0, Math.round(n(e.anosPrestamo)));
  const cuota = cuotaAnual(prestamo, n(e.interes), anosPrestamo);

  const horizonte = Math.min(30, Math.max(1, Math.round(n(e.anosProyeccion)) || 1));
  const filas: Fila[] = [];
  let saldo = prestamo;
  let acumulado = 0;
  let payback: number | null = null;
  for (let t = 1; t <= horizonte; t++) {
    const ingresos = ventas * Math.pow(1 + n(e.crecIngresos), t);
    const margen = ingresos * margenBrutoPct;
    const gastos = gastos0 * Math.pow(1 + n(e.crecGastos), t);
    const resultado = margen - gastos;
    let intereses = 0;
    let devolucion = 0;
    if (t <= anosPrestamo && saldo > 0) {
      intereses = saldo * Math.max(0, n(e.interes));
      devolucion = Math.min(saldo, cuota - intereses);
      saldo -= devolucion;
    }
    const bai = resultado - n(e.amortizacionAnual) - intereses;
    const impuestos = Math.max(0, bai) * n(e.tipoImpuesto);
    const beneficioNeto = bai - impuestos;
    const excedente = beneficioNeto + n(e.amortizacionAnual) - devolucion;
    filas.push({ ano: t, ingresos, margenBruto: margen, gastos, resultadoExplotacion: resultado, intereses, devolucionPrestamo: devolucion, impuestos, beneficioNeto, excedente });
    if (payback === null && capitalPropio > 0) {
      const previo = acumulado;
      acumulado += excedente;
      if (acumulado >= capitalPropio) payback = t - 1 + (excedente > 0 ? (capitalPropio - previo) / excedente : 1);
    }
  }

  const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const beneficioNetoMedio = media(filas.map((f) => f.beneficioNeto));
  // Beneficio operativo después de impuestos y antes de intereses: no depende del precio ni de la financiación
  const beneficioOperativoMedio = media(
    filas.map((f) => {
      const b = f.resultadoExplotacion - n(e.amortizacionAnual);
      return b - Math.max(0, b) * n(e.tipoImpuesto);
    }),
  );

  const f1 = filas[0]!;
  const valores = [...new Set(objetivos.filter((o) => o > 0))]
    .sort((a, b) => a - b)
    .map((objetivo) => {
      const inversionMax = Math.max(0, beneficioOperativoMedio / objetivo);
      const fondoMax = Math.max(
        0,
        (inversionMax - n(e.existencias) - n(e.otrosGastosCompra)) / (1 + n(e.honorariosPct) * (1 + n(e.ivaHonorariosPct))) - n(e.mobiliario),
      );
      return { objetivo, inversionMax, fondoMax };
    });

  return {
    margenBruto0,
    margenBrutoPct,
    gastos0,
    resultadoExplotacion0: margenBruto0 - gastos0,
    inversion: { base, honorarios, iva, existencias: n(e.existencias), otros: n(e.otrosGastosCompra), total },
    prestamo,
    capitalPropio,
    cuota,
    filas,
    beneficioNetoMedio,
    beneficioOperativoMedio,
    rentInversion: total > 0 ? beneficioOperativoMedio / total : null,
    rentCapitalPropio: capitalPropio > 0 ? beneficioNetoMedio / capitalPropio : null,
    payback,
    cobertura: cuota > 0 ? (f1.resultadoExplotacion - f1.impuestos) / cuota : null,
    valores,
  };
}
