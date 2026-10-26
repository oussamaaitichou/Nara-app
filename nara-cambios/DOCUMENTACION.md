# Nara — Documentación para programar

Guía práctica para desarrollar, desplegar y ampliar Nara (asesora IA para oficina de farmacia en España).

---

## 1. Qué es Nara

Nara es una aplicación web que:

- Responde consultas de mostrador (recetas, estupefacientes, sustitución, inspección, SNS…).
- Usa una **base de conocimiento** propia (`conocimiento/`) + un **cerebro** (`instrucciones/cerebro.md`).
- Puede restringir el acceso con **códigos de piloto** (prueba limitada) y **registro por invitación + aprobación**.
- Tiene un módulo opcional **ERP / Nara Gestión** para asesorías y farmacias.

Stack principal:

| Pieza | Tecnología |
|--------|------------|
| Frontend / app | React 19 + Vite + TanStack Router / Start |
| Estilos | Tailwind CSS 4 |
| Auth federado (opcional) | better-auth |
| Acceso piloto / registro | JWT (jose) + cookies + Postgres |
| Base de datos | Postgres (`DATABASE_URL`) o PGLite en local |
| IA | API compatible OpenAI (Gemini, xAI, etc.) |
| Despliegue | Vercel |

---

## 2. Arranque en local

```bash
# Requisitos: Node.js 22+
git clone https://github.com/oussamaaitichou/Nara-app.git
cd Nara-app
npm install
cp .env.example .env
# Edita .env y pon al menos AI_API_KEY
npm run dev
```

Abre: **http://localhost:8080/consulta**

Comandos útiles:

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Desarrollo (puerto 8080) |
| `npm run build` | Build + migraciones |
| `npm run typecheck` | TypeScript sin emitir |
| `npm run eval` | Pruebas de calidad del cerebro |
| `npm run knowledge:build` | Reindexa `conocimiento/` |

---

## 3. Variables de entorno (`.env`)

Copia desde `.env.example`. **Nunca subas `.env` a GitHub.**

### Obligatorias para el chat

```env
AI_API_KEY=...
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
AI_MODEL=gemini-3.6-flash
```

### Acceso piloto (códigos + panel admin)

```env
PILOTO_ACCESO=activo
SESSION_SECRET=minimo_32_caracteres_aleatorios
ADMIN_PASSWORD=minimo_8_caracteres
DATABASE_URL=postgresql://...
```

Sin estas variables la app queda **abierta** (cualquiera consulta).

### ERP (opcional)

```env
ERP_ACTIVO=si
# + DATABASE_URL, SESSION_SECRET, ADMIN_PASSWORD
ARCHIVOS_ACTIVOS=si   # subida de archivos en chat ERP (solo con IA que no entrene con datos)
```

### Otras

```env
SOLICITUDES_ACTIVAS=si
INFORME_PAGO_URL=https://...
INFORME_PRECIO_TEXTO=100 € + IVA
```

En **Vercel**: Settings → Environment Variables (Production + Preview).

---

## 4. Estructura del repositorio

```
Nara-app/
├── conocimiento/          # Documentos que Nara cita (markdown)
├── instrucciones/
│   ├── cerebro.md         # Prompt maestro (identidad, reglas, riesgos)
│   └── estilo.md          # Tono, longitud, forma de responder
├── evaluacion/
│   └── preguntas.json     # Casos de prueba para npm run eval
├── legal/                 # Textos legales
├── migrations/auth/       # Esquema better-auth (no editar a mano)
├── public/                # Estáticos (logo, favicon, manifest)
├── scripts/               # build-knowledge, migrate, eval, etc.
├── server/                # Servidor auxiliar si aplica
├── src/
│   ├── components/        # UI (chat, brand, erp, layout, ui)
│   ├── lib/
│   │   ├── auth/          # better-auth (federado / preview)
│   │   ├── chat/          # cerebro, riesgo, motor IA
│   │   ├── knowledge/     # Retrieval de conocimiento
│   │   ├── piloto/        # Códigos, sesiones, registro, admin
│   │   ├── erp/           # Nara Gestión
│   │   ├── db.ts          # Conexión Postgres / PGLite
│   │   └── env.server.ts
│   └── routes/
│       ├── index.tsx      # Landing
│       ├── consulta.tsx   # Chat principal
│       ├── admin.tsx      # Panel del piloto
│       ├── login.tsx      # Login usuarios aprobados
│       ├── registro.tsx   # Registro con invitación
│       ├── erp.tsx
│       ├── valorar.tsx
│       └── api/
│           ├── chat.ts
│           ├── acceso.ts
│           ├── admin.ts
│           ├── registro.ts
│           ├── valoracion.ts
│           ├── solicitud.ts
│           └── erp*.ts
├── LEEME.md               # Puesta en marcha corta
├── DOCUMENTACION.md       # Este archivo
├── package.json
└── vercel.json
```

---

## 5. Rutas de la aplicación

| Ruta | Descripción |
|------|-------------|
| `/` | Landing pública |
| `/consulta` | Chat con Nara |
| `/admin` | Panel admin (códigos, invitaciones, aprobaciones, valoraciones) |
| `/login` | Login de usuarios registrados y aprobados |
| `/registro?token=...` | Registro solo con invitación |
| `/erp` | Nara Gestión (si `ERP_ACTIVO=si`) |
| `/valorar` | Valoraciones / solicitudes |
| `/legal/$doc` | Documentos legales |
| `/api/chat` | API del chat (SSE) |
| `/api/acceso` | Estado / login por código |
| `/api/admin` | Acciones del panel |
| `/api/registro` | Registro e login de usuarios |

---

## 6. Acceso: códigos vs registro

### 6.1 Códigos de piloto (prueba limitada)

1. Activas `PILOTO_ACCESO=activo` + secretos + `DATABASE_URL`.
2. En `/admin` creas un código (etiqueta + límite diario).
3. El usuario introduce el código; tiene N consultas/día (hora Madrid).
4. Las consultas se descuentan en `/api/chat` si la sesión es de tipo código.

Tablas (creadas al vuelo en `src/lib/piloto/db.server.ts`):

- `piloto_codigos`
- `piloto_uso`
- `piloto_valoraciones`
- `piloto_solicitudes`

### 6.2 Registro por invitación + aprobación

1. En `/admin` → **Crear invitación** (email + rol).
2. Se genera enlace: `/registro?token=XXXX`.
3. La persona rellena nombre y contraseña → estado **pendiente**.
4. Tú **aceptas** o **rechazas** en el panel.
5. Si está **aprobado**, entra en `/login`.
6. Sesión de usuario: **sin límite** de consultas del piloto.

Roles:

- `estudiante` · `tecnico` · `adjunto` · `farmaceutico` · `titular`

Tablas:

- `registro_invitaciones`
- `registro_usuarios`

Contraseñas: scrypt (`src/lib/piloto/password.server.ts`).  
Sesiones: JWT en cookie `nara_sesion` (`src/lib/piloto/sesion.server.ts`).

Tipos de sesión en la cookie:

- `{ tipo: "farmacia", cid, gen }` → código piloto  
- `{ tipo: "usuario", uid }` → usuario aprobado  
- Cookie admin aparte: `nara_admin`

---

## 7. Cerebro y conocimiento (cómo “programa” el comportamiento)

### Prompt y estilo (sin tocar TypeScript)

| Archivo | Uso |
|---------|-----|
| `instrucciones/cerebro.md` | Identidad, reglas, fuentes, riesgos |
| `instrucciones/estilo.md` | Tono, longitud, ejemplos |

Tras editar: commit + push → en el siguiente build/dev se usa el nuevo texto.

### Base de conocimiento

1. Añade `.md` en `conocimiento/` (sigue la plantilla de esa carpeta).
2. `npm run dev` o `npm run knowledge:build` indexa.
3. En el chat, `retrieve()` busca fragmentos relevantes y los mete en el prompt.

### Flujo del chat (`/api/chat`)

1. Comprueba acceso (código o usuario aprobado) si el piloto está activo.
2. Limpia y recorta el historial de mensajes.
3. Retrieval sobre la última(s) pregunta(s).
4. Clasificación de riesgo.
5. Construye system prompt (`construirPrompt` + cerebro + estilo + contexto).
6. Llama a la IA (SSE al cliente).
7. Si es sesión por código, descuenta 1 consulta (y la devuelve si falla la IA).

Archivos clave:

- `src/lib/chat/` — cerebro, riesgo, motor
- `src/lib/knowledge/` — índice y retrieval
- `src/components/chat/chat-app.tsx` — UI del chat

---

## 8. Panel de administración (`/admin`)

Protegido con `ADMIN_PASSWORD` (sesión 8 h).

Puedes:

- Crear / regenerar / activar-desactivar **códigos**
- Crear **invitaciones** y copiar el enlace
- **Aprobar / rechazar** registros
- Revisar **valoraciones** (útil / incorrecta)
- Gestionar **solicitudes** (informe / acompañamiento) si están activas
- Si ERP activo: crear **asesorías**

API: `POST /api/admin` con `{ accion: "..." }`.

Acciones relevantes de registro:

- `invitar` → `{ email, rol }`
- `aprobar_usuario` / `rechazar_usuario` → `{ id, nota? }`

---

## 9. Cómo añadir una funcionalidad nueva

### Nueva página

1. Crea `src/routes/mi-ruta.tsx` con `createFileRoute("/mi-ruta")`.
2. Arranca `npm run dev` para regenerar `routeTree.gen.ts`.

### Nueva API

1. Crea `src/routes/api/mi-api.ts` con handlers GET/POST en `server.handlers`.
2. Usa `getSql()` / funciones de `piloto` o `erp` para datos.

### Nueva tabla

- Preferible: lógica en `asegurarEsquema` / `asegurarEsquemaRegistro` de `db.server.ts` (como el piloto), **o**
- Migración SQL ordenada en `migrations/` (el build ejecuta `db:migrate`).

### Cambiar el comportamiento de Nara

1. Edita `instrucciones/cerebro.md` o `estilo.md`.
2. O añade documentos en `conocimiento/`.
3. Opcional: amplía `src/lib/chat/` si necesitas lógica nueva (riesgo, formato, herramientas).

---

## 10. Despliegue en Vercel

1. Repo conectado a Vercel (proyecto Nara).
2. Variables de entorno configuradas (ver §3).
3. Base Postgres: Vercel Storage → Neon → copia `DATABASE_URL`.
4. Cada `git push` a `main` despliega.
5. Dominio propio: Settings → Domains → DNS según indique Vercel (HTTPS automático).

Build usa: `npm run build` (incluye migraciones y knowledge build).

---

## 11. Seguridad (checklist breve)

- [ ] `.env` fuera de Git
- [ ] `SESSION_SECRET` ≥ 32 caracteres, único
- [ ] `ADMIN_PASSWORD` fuerte
- [ ] `DATABASE_URL` real en producción (no solo PGLite)
- [ ] Repo **privado** cuando publiques
- [ ] Renovación automática del dominio
- [ ] Backups de Neon/Postgres activados
- [ ] Sin datos reales de pacientes en planes gratuitos de IA

(El detalle de dominio, backups y endurecimiento se trata en una fase aparte.)

---

## 12. Roadmap de producto (referencia)

| Fase | Contenido |
|------|-----------|
| **1** | Códigos piloto + registro por invitación + aprobación ✅ (en código) |
| **2** | Gestión para titulares: ticket medio, stock, márgenes, cooperativas/labs |
| **3** | Actualización normativa (BOE, AEAT, colegios) + búsqueda web controlada |

---

## 13. Errores frecuentes

| Problema | Causa probable |
|----------|----------------|
| Chat abierto sin código | Falta `PILOTO_ACCESO=activo` o no hay `DATABASE_URL` |
| Admin 503 | Falta `ADMIN_PASSWORD` o `SESSION_SECRET` |
| Invitaciones no se guardan | Sin Postgres real en producción |
| “Código no válido” | Código regenerado o desactivado |
| Usuario no puede entrar | Sigue en **pendiente** o fue **rechazado** |
| IA no responde | `AI_API_KEY` / modelo / cuota |

---

## 14. Contacto con el código del registro (archivos)

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/lib/piloto/db.server.ts` | Tablas y queries códigos + registro |
| `src/lib/piloto/sesion.server.ts` | JWT, cookies, sesiones |
| `src/lib/piloto/password.server.ts` | Hash / verificar contraseña |
| `src/lib/piloto/config.server.ts` | Flags de entorno |
| `src/routes/api/registro.ts` | API registro y login |
| `src/routes/api/admin.ts` | API panel (incl. invitar / aprobar) |
| `src/routes/api/acceso.ts` | Estado de sesión (código o usuario) |
| `src/routes/api/chat.ts` | Chat + límites |
| `src/routes/admin.tsx` | UI panel |
| `src/routes/registro.tsx` | UI registro |
| `src/routes/login.tsx` | UI login |

---

*Documento orientado a desarrollo. Para puesta en marcha rápida ver `LEEME.md`.*

## 15. Documentos, PDF y números de la farmacia

### Archivos en el chat (`/consulta`)
Con `ARCHIVOS_ACTIVOS=si` el usuario puede adjuntar:
- PDF, Word (.docx), Excel (.xlsx), CSV, TXT
- Imágenes PNG/JPEG/WebP

Nara extrae el texto (o ve la imagen) y responde en contexto. Máx. 3 MB por archivo.

**Privacidad:** solo activar con un motor de IA que no use los datos para entrenar.

### Números de la farmacia (sin conector ERP)
El camino recomendado (fase actual):
1. Exportar desde Farmatic/Unycop/etc. un Excel o CSV de ventas, stock o compras.
2. Adjuntarlo en el chat.
3. Preguntar: ticket medio, rotación, stock muerto, márgenes, qué dejar de comprar…

Nara analiza **los datos del archivo**, no se conecta en vivo al programa de la farmacia.
Un conector ERP opcional puede llegar más adelante; no es el primer paso.

