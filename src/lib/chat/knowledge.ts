import type { Topic } from "./types";

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
