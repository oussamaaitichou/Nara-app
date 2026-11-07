-- Nara: planes, suscripciones, uso, solicitudes de demo e invitaciones.
-- Migración aditiva. No toca tablas existentes. No hay DROP ni recreación.
-- Referencias a erp_* son por id numérico (sin FK formal) porque esas tablas
-- se crean en runtime; la integridad se aplica en el código de aplicación.

-- Catálogo de planes (límites editables en JSON, no hardcodeados en código)
CREATE TABLE IF NOT EXISTS nara_planes (
  id            text PRIMARY KEY,           -- demo | gratis | premium | medida
  nombre        text NOT NULL,
  descripcion   text,
  config        jsonb NOT NULL DEFAULT '{}', -- { mensajes_dia, archivos_12h, duracion_default_dias, ... }
  activo        boolean NOT NULL DEFAULT true,
  orden         integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

INSERT INTO nara_planes (id, nombre, descripcion, config, orden) VALUES
  ('demo',    'Demo',     'Prueba temporal con límites diarios', '{"mensajes_dia": 50,  "archivos_12h": 3,   "duracion_default_dias": 7}'::jsonb, 1),
  ('gratis',  'Gratis',   'Uso básico de chat y archivos',       '{"mensajes_dia": 300, "archivos_12h": 5}'::jsonb, 2),
  ('premium', 'Premium',  'Uso ampliado y más archivos',         '{"mensajes_dia": 3000,"archivos_12h": 200}'::jsonb, 3),
  ('medida',  'A medida', 'Límites personalizados por usuario',  '{}'::jsonb, 4)
ON CONFLICT (id) DO NOTHING;

-- Suscripciones (usuario ERP o asesoría). Estructura lista para Stripe.
CREATE TABLE IF NOT EXISTS nara_suscripciones (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_usuario_id         integer,          -- erp_usuarios.id (sin FK formal)
  erp_asesoria_id        integer,          -- erp_asesorias.id (sin FK formal)
  plan_id                text NOT NULL REFERENCES nara_planes(id),
  starts_at              timestamptz NOT NULL DEFAULT now(),
  ends_at                timestamptz,      -- NULL = sin caducidad
  status                 text NOT NULL DEFAULT 'activa'
                           CHECK (status IN ('activa', 'caducada', 'pausada', 'cancelada')),
  stripe_customer_id     text,
  stripe_subscription_id text,
  meta                   jsonb NOT NULL DEFAULT '{}',
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nara_suscripcion_sujeto CHECK (
    erp_usuario_id IS NOT NULL OR erp_asesoria_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS nara_suscripciones_usuario_idx
  ON nara_suscripciones (erp_usuario_id) WHERE status = 'activa';
CREATE INDEX IF NOT EXISTS nara_suscripciones_asesoria_idx
  ON nara_suscripciones (erp_asesoria_id) WHERE status = 'activa';
CREATE INDEX IF NOT EXISTS nara_suscripciones_ends_idx
  ON nara_suscripciones (ends_at) WHERE status = 'activa' AND ends_at IS NOT NULL;

-- Contadores de uso por usuario y ventana temporal
CREATE TABLE IF NOT EXISTS nara_uso (
  id               bigserial PRIMARY KEY,
  erp_usuario_id   integer NOT NULL,       -- erp_usuarios.id
  tipo             text NOT NULL CHECK (tipo IN ('mensaje', 'archivo')),
  cantidad         integer NOT NULL DEFAULT 1,
  periodo_inicio   timestamptz NOT NULL,   -- inicio de la ventana (día o bloque 12h)
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nara_uso_usuario_periodo_idx
  ON nara_uso (erp_usuario_id, tipo, periodo_inicio);

-- Solicitudes de demo / plan (formulario público)
CREATE TABLE IF NOT EXISTS nara_solicitudes (
  id            serial PRIMARY KEY,
  created_at    timestamptz NOT NULL DEFAULT now(),
  nombre        text NOT NULL,
  email         text NOT NULL,
  telefono      text,
  entidad       text NOT NULL,             -- nombre de la farmacia o asesoría
  tipo_entidad  text NOT NULL DEFAULT 'farmacia'
                  CHECK (tipo_entidad IN ('farmacia', 'asesoria')),
  plan_interes  text REFERENCES nara_planes(id),
  mensaje       text,
  estado        text NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente', 'aprobada', 'rechazada', 'convertida')),
  ip            text,
  user_agent    text,
  nota_admin    text,
  procesada_por text,
  procesada_at  timestamptz
);

CREATE INDEX IF NOT EXISTS nara_solicitudes_estado_idx
  ON nara_solicitudes (estado, created_at DESC);
CREATE INDEX IF NOT EXISTS nara_solicitudes_email_idx
  ON nara_solicitudes (lower(email));

-- Invitaciones de un solo uso para establecer contraseña
CREATE TABLE IF NOT EXISTS nara_invitaciones (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash       text NOT NULL UNIQUE,
  erp_usuario_id   integer NOT NULL,       -- erp_usuarios.id
  expires_at       timestamptz NOT NULL,
  used_at          timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nara_invitaciones_token_idx
  ON nara_invitaciones (token_hash) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS nara_invitaciones_usuario_idx
  ON nara_invitaciones (erp_usuario_id);
