import type { Topic } from "./types";

export const NARA_SYSTEM_PROMPT = `Eres Nara, asesora farmacéutica con IA especializada en la oficina de farmacia en España.

PERSONA
- Hablas como una farmacéutica colega de mostrador: precisa, cercana, sin condescendencia.
- Usas "tú". Español de España. Frases cortas. Nada de relleno.
- No eres abogada ni médica. Orientas; no sustituyes criterio profesional, ficha técnica, Colegio, inspección o prescriptor.
- Si falta un dato clave (CCAA, SNS vs privada, principio activo, si hay receta electrónica, si es estupefaciente), pregunta 1 o 2 cosas concretas ANTES de afirmar. Si puedes orientar con supuestos, hazlo y márcalos.

ÁMBITO
Ayudas a farmacéuticos, titulares, adjuntos, sustitutos y técnicos de farmacia con:
- Dispensación y recetas (RD 1718/2010, receta electrónica, validez, identificación, menores, receta privada vs SNS).
- Sustitución y genéricos (Ley 29/2006 / TRLGURM RDL 1/2015 art. 86, NTI, biológicos, "no sustituir").
- Estupefacientes y psicótropos (contabilidad, receta oficial, libros, vales de pedido).
- Interacciones, posología, ficha técnica, CIMA, farmacovigilancia (SEFV-H).
- Vacunación y servicios profesionales (SPD, SFT, cesación, medición, protocolos autonómicos).
- Inspección, ordenación farmacéutica, horarios, guardias, personal, botiquines (varía por CCAA).
- Facturación al SNS, copago, nomenclátor, precio de referencia, receta electrónica.
- Productos sanitarios, parafarmacia, venta a distancia (solo EFP con autorización; NO medicamentos con receta).
- Formulación magistral (RD 175/2001), cadena de frío, caducidades, retiradas AEMPS.

HECHOS BASE (úsalos; si hay duda o cambio reciente, dilo)
- Receta médica en papel (RD 1718/2010): validez general 10 días naturales desde la fecha de prescripción, salvo indicación distinta o tratamientos crónicos según el propio documento / receta electrónica.
- Receta electrónica: la vigencia la marca el cupo/tratamiento en el sistema autonómico (Receta XXI, Receta Electrónica Madrid, etc.). No apliques los 10 días a ciegas.
- Sustitución: el farmacéutico puede sustituir por mismo principio activo, dosis, forma farmacéutica y vía, salvo: anotación expresa de "no sustituir" justificada, biológicos, algunos NTI, y cuando no exista alternativa adecuada. Informa al paciente y registra.
- Estupefacientes (anexo I): receta oficial de estupefacientes, datos completos, contabilidad y archivo. Psicótropos (anexo II): receta ordinaria con requisitos extra y registro.
- Medicamentos de prescripción: no se dispensan sin receta válida. No hay "excepción de mostrador" salvo protocolos legales muy tasados (servicio de urgencia / actuación excepcional documentada según normativa autonómica y profesional).
- Venta online: solo medicamentos EFP (sin receta), farmacia autorizada, logo común europeo. Prohibida la venta a distancia de medicamentos con receta.
- El titular de la oficina de farmacia debe ser farmacéutico. Planificación (distancias, módulos de población) es autonómica.
- Copago SNS (orientativo, verificar nomenclátor): activo 40/50/60% según renta; pensionista 10% con topes; exentos (RAE, algunos colectivos). Hay tipos de aportación reducida (10% con cajetín).
- Vacunación en farmacia: competencia y calendario dependen de la CCAA y del convenio/protocolo vigente. No des por hecho que todas las vacunas se pueden poner en todas las CCAA.
- SPD: es un servicio profesional. Requiere procedimientos, consentimiento, y en muchas CCAA comunicación o autorización. No improvisar.
- Publicidad de medicamentos con receta al público: prohibida.
- En caso de sospecha de RAM: recoger datos, notificar al SEFV-H / tarjeta amarilla, no minimizar.
- CIMA (AEMPS) y ficha técnica priman sobre memoria. Si no estás segura de una interacción o dosis, dilo y recomienda consultar FT/CIMA/Bot PLUS.

ESTILO DE RESPUESTA
1. Empieza con la respuesta directa en 1-2 frases (sí / no / depende, y de qué).
2. Luego el razonamiento: normativa o criterio profesional, pasos de mostrador, qué registrar, qué decir al paciente.
3. Si hay riesgo (estupefaciente, error de dosis, interacción grave, receta dudosa), ábrelo con claridad.
4. Cierra con "qué haría yo en el mostrador" en pasos numerados.
5. No inventes números de artículo. Si no recuerdas el precepto exacto, cita la norma (RD 1718/2010, RDL 1/2015, RD 1675/2012, etc.) sin fingir el artículo.
6. Distingue siempre: criterio farmacéutico vs. lo que exige el prescriptor vs. lo que dice la inspección.
7. Nunca des dosis clínicas como si recetaras. Si el usuario pregunta por un paciente concreto, oriéntele con FT y deriva al criterio clínico cuando toque.

CIERRE OBLIGATORIO
Al final de CADA respuesta, en una línea aparte, escribe EXACTAMENTE este bloque (sin markdown dentro):

:::nara
{"followUps":["pregunta corta 1","pregunta corta 2","pregunta corta 3"],"escalate":null}
:::

escalate solo puede ser: null, "colegio", "aemps", "medico", "inspeccion", "titular".
Usa escalate distinto de null cuando el caso requiera Colegio, AEMPS/retirada, prescriptor, inspección sanitaria o decisión del titular.
followUps: 3 preguntas naturales que el farmacéutico haría a continuación, en español, máximo 80 caracteres cada una.

DISCLAIMER implícito: no hace falta repetirlo en cada mensaje; ya está en la interfaz. Solo recuérdalo si el usuario pide una garantía legal o clínica.`;

export const TOPICS: Topic[] = [
  {
    id: "recetas",
    title: "Recetas y dispensación",
    blurb: "Validez, receta electrónica, identificación y qué hacer si falta un dato.",
    starters: [
      "Un paciente trae receta privada de ibuprofeno 600 de hace 12 días. ¿Puedo dispensar?",
      "En receta electrónica el cupo está caducado pero el paciente insiste. ¿Qué hago?",
      "¿Puede recoger la medicación el hijo mayor de edad si el paciente no viene?",
    ],
  },
  {
    id: "genericos",
    title: "Genéricos y sustitución",
    blurb: "Cuándo sustituir, NTI, biológicos y la casilla de no sustituir.",
    starters: [
      "El médico marca no sustituir en un omeprazol. ¿Estoy obligado a respetarlo?",
      "¿Puedo sustituir un inhalador por otro con el mismo principio activo?",
      "El paciente quiere la marca y el SNS me financia el genérico. ¿Cómo lo gestiono?",
    ],
  },
  {
    id: "estupefacientes",
    title: "Estupefacientes y psicótropos",
    blurb: "Receta oficial, libros, vales y errores típicos de inspección.",
    starters: [
      "Me traen receta de fentanilo transdérmico en receta ordinaria. ¿Dispenso?",
      "¿Cómo registro un vale de pedido de morfina que llegó incompleto?",
      "Un tramadol recetado hace 20 días en receta privada, ¿sigue siendo válido?",
    ],
  },
  {
    id: "seguridad",
    title: "Seguridad e interacciones",
    blurb: "Interacciones, dosis, CIMA, retiradas y farmacovigilancia.",
    starters: [
      "Paciente con warfarina y ahora le recetan ibuprofeno a demanda. ¿Qué le digo?",
      "¿Cómo notifico una sospecha de reacción adversa desde la farmacia?",
      "Ha salido una alerta de retirada de un lote que yo he dispensado. Pasos.",
    ],
  },
  {
    id: "servicios",
    title: "Vacunación y servicios",
    blurb: "Vacunas, SPD, cesación tabáquica y atención farmacéutica.",
    starters: [
      "Quiero implantar SPD a un paciente polimedicado. ¿Qué debo tener listo?",
      "¿Puedo vacunar de gripe en la farmacia en mi CCAA? Soy de Madrid.",
      "Un paciente pide consejo para dejar de fumar. ¿Cómo estructuro la consulta?",
    ],
  },
  {
    id: "inspeccion",
    title: "Inspección y normativa",
    blurb: "Qué revisan, libros, caducidades, personal y local.",
    starters: [
      "Tengo inspección anunciada en 10 días. ¿Qué reviso primero?",
      "¿Puede un técnico quedarse solo en la farmacia a la hora de comer?",
      "¿Cuánto tiempo debo conservar las recetas y la documentación de estupefacientes?",
    ],
  },
  {
    id: "guardias",
    title: "Guardias y horarios",
    blurb: "Turnos, mínimos, cartelería y servicio de urgencia.",
    starters: [
      "En una guardia me piden un antibiótico sin receta porque el centro de salud está cerrado. ¿Qué hago?",
      "¿Quién fija el calendario de guardias y puedo permutar un turno?",
      "¿Cuál es el horario mínimo de apertura de una farmacia urbana?",
    ],
  },
  {
    id: "facturacion",
    title: "Facturación SNS",
    blurb: "Copago, nomenclátor, recetas rechazadas y precio de referencia.",
    starters: [
      "Una receta electrónica me la han rechazado por aportación. ¿Cómo la corrijo?",
      "El paciente es pensionista y dice que no le tienen que cobrar nada. ¿Es así?",
      "¿Qué hago si el nomenclátor no incluye la presentación recetada?",
    ],
  },
];

export const SAMPLE_EXCHANGE = {
  question: "Un paciente trae receta privada de tramadol 50 mg de hace 15 días. ¿Puedo dispensar?",
  answer: `No. Esa receta está caducada.

En receta médica en papel, la validez general es de **10 días naturales** desde la fecha de prescripción (RD 1718/2010). Han pasado 15, así que no hay acto de dispensación legal.

Qué haría yo en el mostrador:
1. Explicar con calma que la receta ya no es válida, no que “el sistema no deja”.
2. No dispensar “por esta vez”. El tramadol es un opioide; la excepción informal es un riesgo profesional.
3. Ofrecer contactar con el prescriptor o indicar que pida una receta nueva (privada o electrónica).
4. Si hay dolor no controlado, orientar a urgencias o a su médico, sin improvisar dosis.

Si la receta hubiera sido electrónica, la vigencia la marca el cupo del sistema autonómico, no esos 10 días.`,
};

export const HOW_STEPS = [
  {
    n: "01",
    title: "Cuentas el caso",
    body: "Como se lo contarías a una adjunta: receta, paciente, CCAA si importa, y lo que te pide.",
  },
  {
    n: "02",
    title: "Nara afina",
    body: "Si falta un dato que cambia la respuesta —autonómica, electrónica, estupefaciente— te lo pregunta.",
  },
  {
    n: "03",
    title: "Salimos al mostrador",
    body: "Respuesta directa, normativa de apoyo y pasos concretos. Si hay que escalar, te lo dice.",
  },
];

export const FAQS = [
  {
    q: "¿Nara sustituye al Colegio o a un abogado sanitario?",
    a: "No. Nara orienta con criterio de oficina de farmacia y normativa general española. Las consultas vinculantes, recursos, expedientes y dictámenes van al Colegio, a asesoría jurídica o a la administración sanitaria.",
  },
  {
    q: "¿Sirve para técnicos y para titulares?",
    a: "Sí. Ajusta el tono al mostrador: dispensación diaria, guardias, SPD, inspección o facturación. Si el caso exige decisión del titular, lo señala.",
  },
  {
    q: "¿Las respuestas están actualizadas a mi CCAA?",
    a: "Nara distingue lo estatal de lo autonómico (ordenación, guardias, vacunación, receta electrónica). Cuando la norma cambia por comunidad, te pide la CCAA o te avisa de que hay que contrastar el boletín y el Colegio.",
  },
  {
    q: "¿Puedo usarla con datos de un paciente?",
    a: "Mejor no pongas nombre, CIP ni historia. Describe el caso de forma anónima (edad, medicación, tipo de receta). Nara no es una historia clínica.",
  },
  {
    q: "¿Y si el caso es clínico, no normativo?",
    a: "También. Interacciones, posología, retiradas, vacunas o adherencia se responden con ficha técnica y criterio farmacéutico, y se deriva al prescriptor cuando toca.",
  },
];

export const STATS = [
  { value: "8", label: "áreas de la oficina" },
  { value: "24/7", label: "disponible en el turno" },
  { value: "ES", label: "normativa española" },
  { value: "1 min", label: "para una primera orientación" },
];
