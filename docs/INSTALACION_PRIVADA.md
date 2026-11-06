# Instalación NaraGest — SaaS y privada

## SaaS (Vercel + Neon)

1. Conectar el repo a Vercel.
2. Variables:
   - `DATABASE_URL` — connection string Neon (pooler)
   - `BETTER_AUTH_SECRET` — secreto fuerte
   - `BETTER_AUTH_URL` — URL pública de la app
   - `VITE_AUTH_ENABLED=true` cuando el login esté listo
   - Credenciales Grok Auth si se usa federación (`GROK_AUTH_*`)
3. En cada deploy, `npm run build` ejecuta `db:migrate` y aplica `migrations/*.sql`.

## Privada / on‑prem (Docker Postgres)

```bash
docker compose up -d
export DATABASE_URL="postgresql://nara:nara_dev_change_me@localhost:5432/naragest"
npm install
npm run db:migrate   # o npm run build
npm run dev
```

Cambia la contraseña en `docker-compose.yml` antes de producción.

### Notas de seguridad

- No exponer Postgres a Internet sin TLS y firewall.
- Rotar `BETTER_AUTH_SECRET` y contraseñas de BD.
- Auth desactivado + `DATABASE_URL` se rechaza (fail closed).
- Backup periódico del volumen `nara_pg_data` o del proveedor managed.

## Tauri (escritorio)

No incluido. La app es web; un shell Tauri podría cargar la misma URL o empaquetar el front más adelante sin cambiar el modelo de datos.
