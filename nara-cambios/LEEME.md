# Nara — puesta en marcha

1. Instala Node.js 22 o superior.
2. `npm install`
3. Copia `.env.example` como `.env` y pon tu clave en `AI_API_KEY` (solo en ese archivo, nunca en el código).
4. `npm run dev` y abre http://localhost:8080/consulta

## Base de conocimiento
Tus documentos van en `conocimiento/` (mira `README.md` y `_plantilla.md` de esa carpeta).
Al reiniciar `npm run dev` se indexan solos y Nara los cita en sus respuestas.

## Acceso del piloto, valoraciones y panel
Con `PILOTO_ACCESO=activo` (más `SESSION_SECRET`, `ADMIN_PASSWORD` y `DATABASE_URL`) solo entra quien tenga un código.
En `/admin` creas los códigos (uno por farmacia, con límite de consultas al día) y revisas las valoraciones
"Útil" e "Incorrecta". Sin esas variables, la app funciona abierta como siempre.


## Registro por invitación
En `/admin` puedes crear una invitación (correo + rol: estudiante, técnico, adjunto, farmacéutico, titular).
Se genera un enlace `/registro?token=...` que envías a la persona.
Al registrarse queda **pendiente**; tú la aceptas o rechazas en el panel.
Los aprobados entran en `/login` con correo y contraseña (sin límite del código piloto).
Los códigos de acceso siguen sirviendo para la prueba limitada.

## Nara Gestión (ERP para asesorías y farmacias)
Con `ERP_ACTIVO=si` (más `DATABASE_URL`, `SESSION_SECRET` y `ADMIN_PASSWORD`) se activa `/erp`.
El propietario crea cada asesoría desde `/admin` (recibe una contraseña temporal que debe entregar por un canal seguro).
La asesoría crea sus farmacias y usuarios (gestores y clientes), sube su logo y ve el cuadro de mando de cada cliente,
alimentado con datos mensuales pegados desde Excel. Cada cliente solo ve su farmacia; cada asesoría, solo la suya.

## Chat dentro del ERP
En `/erp`, pestaña «Consultar a Nara»: conversaciones guardadas por usuario, sin límite de longitud. En plan Premium, lo antiguo
se resume automáticamente para no perder el hilo. Los archivos y fotos se activan con `ARCHIVOS_ACTIVOS=si` (ver `.env.example`).
Los usuarios no se registran solos: los da de alta la administradora de cada asesoría.

## El cerebro de Nara
`instrucciones/cerebro.md` es el prompt maestro (identidad, reglas de verificación, fuentes, riesgos). Se edita con el Bloc de notas.
El código añade siempre las capacidades reales de esta versión, las protecciones y el formato de cierre.

## Forma de responder
El archivo `instrucciones/estilo.md` define cómo responde Nara (longitud, tono, criterios propios y ejemplos).
Edítalo con el Bloc de notas, haz Commit y Push, y en unos minutos Nara responde así.

## Pruebas de calidad
Rellena `evaluacion/preguntas.json` con la respuesta correcta de cada pregunta y, con la app en marcha,
ejecuta `npm run eval`. Se genera `evaluacion/resultados.md` para revisar a mano.
Hazlo cada vez que cambies el prompt, los documentos o el motor de IA.

## Importante
- Mientras uses un plan gratuito, escribe solo casos ficticios: no metas datos reales de clientes ni pacientes.
- No subas `.env` a GitHub (ya está en `.gitignore`).
