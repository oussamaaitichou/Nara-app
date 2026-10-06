/** Clasificación orientativa de una consulta: nivel de riesgo, temas y dependencia de fecha o territorio. */
export type Riesgo = "bajo" | "medio" | "alto" | "critico";
export type Clasificacion = {
  riesgo: Riesgo;
  temas: string[];
  dependeFecha: boolean;
  dependeTerritorio: boolean;
  comunidad: string | null;
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const ORDEN: Riesgo[] = ["bajo", "medio", "alto", "critico"];

const REGLAS: { tema: string; riesgo: Riesgo; re: RegExp }[] = [
  { tema: "medicamentos y seguridad del paciente", riesgo: "critico", re: /\b(medicament|dosis|posolog|interaccion|contraindic|efecto adverso|reaccion adversa|farmacovigilancia|estupefaciente|psicotrop|alerta sanitaria|retirada de lote|falsificad|embaraz|lactancia|paciente)/ },
  { tema: "receta y dispensación", riesgo: "critico", re: /\b(receta|dispens|sustitu|antibiotic|fentanilo|morfina|tramadol)/ },
  { tema: "inspección y sanciones", riesgo: "critico", re: /\b(inspeccion|sancion|expediente|multa|requerimiento)/ },
  { tema: "fiscal", riesgo: "alto", re: /\b(iva|irpf|impuesto|hacienda|aeat|modelo \d{3}|sociedades|recargo de equivalencia|retencion|declaracion|tributa|fiscal|amortizacion|plusvalia)\b/ },
  { tema: "laboral y Seguridad Social", riesgo: "alto", re: /\b(nomina|contrato laboral|contrato de trabajo|despido|convenio|seguridad social|cotizacion|bonificacion|finiquito|baja laboral|jornada|vacaciones|autonomo|empleado|trabajador)/ },
  { tema: "compraventa y valoración", riesgo: "alto", re: /\b(compraventa|comprar una farmacia|comprar farmacia|vender (mi|la|una) farmacia|traspaso|valoracion|valorar|fondo de comercio|due diligence|tasacion|sucesion|donacion|herencia)/ },
  { tema: "financiación", riesgo: "alto", re: /\b(prestamo|financiacion|financiar|hipoteca|credito|intereses|cuota|endeudamiento|leasing)\b/ },
  { tema: "ayudas y subvenciones", riesgo: "alto", re: /\b(subvencion|ayudas\b|ayudas? (publicas?|economicas?)|convocatoria|kit digital|incentivo)/ },
  { tema: "protección de datos", riesgo: "alto", re: /\b(rgpd|proteccion de datos|lopd|aepd|datos personales|consentimiento|cookies)\b/ },
  { tema: "contratos y obligaciones legales", riesgo: "alto", re: /\b(contrato|clausula|alquiler|arrendamiento|normativa|real decreto|obligacion)/ },
  { tema: "gestión (compras, stock, ventas)", riesgo: "medio", re: /\b(compras?|stock|rotacion|caducidad|ventas|margen|proveedor|distribuidor|cooperativa|rappel|descuento|ticket|marketing|fidelizacion|rentabilidad|turnos)\b/ },
];

const FECHA = /\b(actual|actualmente|hoy|este ano|ahora|vigente|nuevo|nueva|reciente|ultim[oa]s?|20\d\d|plazo|convocatoria|tipo impositivo|porcentaje|bonificacion|importe|limite|cuantia|tarifa)\b/;
const TEMAS_QUE_CAMBIAN = new Set(["fiscal", "laboral y Seguridad Social", "ayudas y subvenciones"]);
const CCAA = ["andalucia", "aragon", "asturias", "baleares", "canarias", "cantabria", "castilla-la mancha", "castilla la mancha", "castilla y leon", "cataluna", "comunidad valenciana", "valencia", "extremadura", "galicia", "madrid", "murcia", "navarra", "pais vasco", "euskadi", "la rioja", "ceuta", "melilla"];
const TERRITORIAL = /\b(comunidad autonoma|ccaa|autonomic|municipio|ayuntamiento|horario|guardia|vacunacion|ordenacion|traslado|apertura|transmision|titularidad|cotitularidad|farmacia rural|zona basica|modulo)/;
const TEMAS_TERRITORIALES = new Set(["inspección y sanciones", "ayudas y subvenciones", "compraventa y valoración"]);

export function clasificar(texto: string): Clasificacion {
  const t = norm(texto);
  const hallados = REGLAS.filter((r) => r.re.test(t));
  const temas = [...new Set(hallados.map((r) => r.tema))];
  let nivel = 0;
  for (const r of hallados) nivel = Math.max(nivel, ORDEN.indexOf(r.riesgo));
  const comunidad = CCAA.find((c) => t.includes(c)) ?? null;
  return {
    riesgo: ORDEN[nivel]!,
    temas,
    dependeFecha: FECHA.test(t) || temas.some((x) => TEMAS_QUE_CAMBIAN.has(x)),
    dependeTerritorio: !!comunidad || TERRITORIAL.test(t) || temas.some((x) => TEMAS_TERRITORIALES.has(x)),
    comunidad,
  };
}

export function describir(c: Clasificacion): string {
  const lineas = [
    "CLASIFICACIÓN AUTOMÁTICA DE LA CONSULTA (orientativa; si ves que es errónea, aplica tu criterio):",
    `- Nivel de riesgo: ${c.riesgo.toUpperCase()}`,
    `- Temas detectados: ${c.temas.length ? c.temas.join("; ") : "ninguno en concreto"}`,
    `- Puede depender de la fecha o de cambios normativos: ${c.dependeFecha ? "sí" : "no parece"}`,
    `- Puede depender de la comunidad autónoma: ${c.dependeTerritorio ? (c.comunidad ? `sí (el usuario menciona: ${c.comunidad})` : "sí (el usuario no ha indicado cuál)") : "no parece"}`,
  ];
  if (c.riesgo === "alto" || c.riesgo === "critico") {
    lineas.push("Aplica el nivel de verificación de riesgo alto o crítico: no afirmes como vigente lo que no puedas respaldar con un documento de referencia, pide los datos que falten (fecha, comunidad autónoma, régimen, tipo de contrato u operación) antes de dar cifras, e indica la fuente oficial que debe consultar.");
  }
  return lineas.join("\n");
}
