# Base de conocimiento de Nara

Aquí van los documentos que la app consulta antes de responder y cita en sus respuestas.

1. Copia `_plantilla.md` con el nombre del tema, por ejemplo `recetas-electronicas.md`.
2. Rellena la cabecera (título, fuente, fecha de revisión, ámbito) y escribe el contenido.
3. Pon `verificado: si` **solo** cuando tú u otro profesional habéis contrastado el contenido con la fuente.
   Mientras sea `no`, la app avisa al usuario de que está pendiente de verificar.
4. Reinicia `npm run dev` (se regenera el índice solo).

Consejos: un apartado `##` por idea; escribe las cifras y plazos con su fuente; si algo depende de la
comunidad autónoma, dilo. Los archivos que empiezan por `_` se ignoran.

## Metadatos de cada documento
Obligatorios: `titulo`, `fuente`, `revisado`, `territorio`, `verificado`. Recomendados para normativa: `referencia`, `url`,
`autoridad`, `estado`, `publicacion`, `version`. Nara los ve y respeta el estado: un documento «derogado» o «histórico»
no se presenta como norma vigente. No borres versiones antiguas: cámbialas de estado.
