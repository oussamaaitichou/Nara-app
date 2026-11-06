# NaraGest — Backend profesional (fase actual)

## Contexto de producto

| Marca | Alcance |
|-------|---------|
| **Nara** | Producto completo: asesora de mostrador + gestión |
| **NaraGest** | Módulo de **gestión de oficina de farmacia** |

No se conecta a AEAT, Seguridad Social ni organismos públicos. Ninguna presentación telemática automática.

---

## Ya existía en el repo (reutilizado)

- `src/lib/db.ts`: Neon (`DATABASE_URL`) o PGLite embebido
- `scripts/migrate.mjs` + `migrations/*.sql`
- Better Auth en `src/lib/auth/*` (opt-in)
- UI NaraGest (shell, dashboard, módulos demo)

---

## Implementado en esta fase

### 1. Migración SQL
`migrations/001_naragest_core.sql`

Tablas:
- `ng_organizations` — farmacia / grupo
- `ng_roles` + `ng_memberships` — usuarios por org y rol
- `ng_clients` — clientes (1)
- `ng_cases` — expedientes (N) FK → cliente
- `ng_audit_log` — trazabilidad create/update/delete/export

Soft-delete en clientes y expedientes (`deleted_at`).

### 2. Dominio
- `src/lib/naragest/schema.ts` — Zod
- `src/lib/naragest/repo.server.ts` — SQL parametrizado + auditoría

### 3. API
- `GET/POST/PATCH/DELETE /api/naragest/clientes`
- `GET ?export=csv` → CSV (sin `notes_internal`)
- `GET/POST/PATCH /api/naragest/expedientes` (+ `?clientId=`)

**Auth temporal de desarrollo:** cabeceras
- `x-ng-org-id` (uuid de organización)
- `x-ng-user-id` (opcional, para auditoría)

En producción deben sustituirse por sesión Better Auth + fila en `ng_memberships`.

---

## Decisiones técnicas

1. **Postgres** vía stack ya presente (Neon/PGLite), sin segundo ORM.
2. **Kysely/pg** solo donde ya se usa; repositorio con SQL etiquetado de `getSql()`.
3. **Multi-tenant** por `organization_id` en todas las filas de negocio.
4. **Minimización RGPD**: export CSV sin notas internas; sin campos clínicos por defecto.
5. **Auditoría** en cada mutación y export.
6. **Sin duplicar** clientes entre módulos UI: una sola tabla `ng_clients`.

---

## Arranque

```bash
# Local / preview: PGLite aplica migrations/*.sql al arrancar
npm run dev

# Producción: definir DATABASE_URL (Neon)
# npm run build  → incluye db:migrate
```

Semilla mínima (ejemplo, tras migrar):

```sql
insert into ng_organizations (id, name, slug)
values ('00000000-0000-4000-8000-000000000001', 'Farmacia Demo', 'farmacia-demo');
```

Prueba API:

```bash
curl -H "x-ng-org-id: 00000000-0000-4000-8000-000000000001" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"María López","program":"spd"}' \
  https://TU_HOST/api/naragest/clientes
```

---

## Propuesto (siguiente sprint, no implementado aún)

- Resolver org/usuario desde Better Auth + `ng_memberships`
- Middleware de permisos por rol (titular/adjunto/técnico/auxiliar)
- UI Clientes/Expedientes conectada a esta API (sustituir datos demo)
- Paginación, búsqueda full-text, rate limit
- Almacenamiento de documentos (S3/R2) con ACL por org
- Jobs de retención / derecho de borrado RGPD

## Integraciones futuras (explícitamente fuera de alcance ahora)

- AEAT, Seguridad Social, Veri*Factu, firma cualificada, pasarelas bancarias, TPV real

---

## Pruebas recomendadas

1. Crear cliente → listar → export CSV → soft-delete → no aparece en listado
2. Crear expediente con `clientId` de otra org → 400
3. Auditoría: filas en `ng_audit_log` tras cada acción
4. Validación Zod: email inválido → 422
