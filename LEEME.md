# Nara — puesta en marcha

1. Instala Node.js 22 o superior.
2. `npm install`
3. Copia `.env.example` como `.env` y pon tu clave en `AI_API_KEY` (solo en ese archivo, nunca en el código).
4. `npm run dev` y abre http://localhost:8080/consulta

## Base de conocimiento
Tus documentos van en `conocimiento/` (mira `README.md` y `_plantilla.md` de esa carpeta).
Al reiniciar `npm run dev` se indexan solos y Nara los cita en sus respuestas.

## Pruebas de calidad
Rellena `evaluacion/preguntas.json` con la respuesta correcta de cada pregunta y, con la app en marcha,
ejecuta `npm run eval`. Se genera `evaluacion/resultados.md` para revisar a mano.
Hazlo cada vez que cambies el prompt, los documentos o el motor de IA.

## Importante
- Mientras uses un plan gratuito, escribe solo casos ficticios: no metas datos reales de clientes ni pacientes.
- No subas `.env` a GitHub (ya está en `.gitignore`).
