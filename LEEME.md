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
