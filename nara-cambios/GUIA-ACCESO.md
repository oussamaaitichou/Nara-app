# Nara — Guía rápida de acceso

## Dos formas de entrar al chat

### A) Código de prueba (limitado)

1. Admin crea código en `/admin` (nombre + consultas/día).
2. Usuario pone el código cuando la app lo pide.
3. Cada consulta descuenta 1 del límite diario (se reinicia a medianoche hora de Madrid).

### B) Cuenta registrada (aprobada, sin límite de código)

1. Admin crea **invitación** (correo + rol) en `/admin`.
2. Copia el enlace: `https://TU-DOMINIO/registro?token=...`
3. La persona se registra (nombre + contraseña).
4. Estado: **Pendiente**.
5. Admin pulsa **Aceptar** o **Rechazar**.
6. Si aceptada → entra en `/login` con correo y contraseña.

## Roles al invitar

| Valor interno | Significado |
|---------------|-------------|
| estudiante | Estudiante de farmacia |
| tecnico | Técnico de farmacia |
| adjunto | Adjunto |
| farmaceutico | Farmacéutico |
| titular | Titular de farmacia |

Los titulares, en fases posteriores, podrán solicitar acceso de gestión completa (stock, márgenes, etc.).

## Activar el cierre de la app

En Vercel (o `.env` local):

```env
PILOTO_ACCESO=activo
SESSION_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ADMIN_PASSWORD=tu_password_seguro
DATABASE_URL=postgresql://...
```

- Sin esto → la app sigue abierta.
- Con esto → hace falta código **o** cuenta aprobada.

## URLs útiles

| URL | Quién |
|-----|--------|
| `/admin` | Solo tú (contraseña admin) |
| `/registro?token=...` | Invitado |
| `/login` | Usuario aprobado |
| `/consulta` | Chat |

## Buenas prácticas

- Envía el enlace de invitación por un canal seguro (no en público).
- Cada invitación es de un solo uso.
- Si regeneras un código de piloto, el anterior deja de valer.
- Cambia `ADMIN_PASSWORD` si alguien más la ha visto.
