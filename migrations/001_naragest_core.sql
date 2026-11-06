-- NaraGest core schema
-- Multi-organización (farmacia o grupo), membresías, clientes 1:N expedientes, auditoría.
-- Sin integraciones AEAT/SS. Datos minimizados (RGPD/LOPDGDD).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Organización = farmacia o grupo de farmacias
CREATE TABLE IF NOT EXISTS ng_organizations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  cif           text,
  ccaa          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

-- Roles de aplicación (no confundir con auth user de Better Auth)
CREATE TABLE IF NOT EXISTS ng_roles (
  id            text PRIMARY KEY, -- titular | adjunto | tecnico | auxiliar | admin_org
  label         text NOT NULL,
  description   text
);

INSERT INTO ng_roles (id, label, description) VALUES
  ('admin_org', 'Administrador', 'Gestión de usuarios, permisos y configuración'),
  ('titular', 'Titular', 'Acceso completo operativo de la farmacia'),
  ('adjunto', 'Farmacéutico adjunto', 'Operativa clínica y de gestión'),
  ('tecnico', 'Técnico', 'Stock, caja y tareas asignadas'),
  ('auxiliar', 'Auxiliar', 'Tareas y consulta limitada')
ON CONFLICT (id) DO NOTHING;

-- Membresía usuario ↔ organización (user_id = id de Better Auth cuando esté activo)
CREATE TABLE IF NOT EXISTS ng_memberships (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES ng_organizations(id),
  user_id         text NOT NULL,
  role_id         text NOT NULL REFERENCES ng_roles(id),
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS ng_memberships_user_idx ON ng_memberships (user_id) WHERE active;

-- Clientes de la farmacia (sin datos clínicos sensibles por defecto)
CREATE TABLE IF NOT EXISTS ng_clients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES ng_organizations(id),
  code            text NOT NULL,
  full_name       text NOT NULL,
  phone           text,
  email           text,
  program         text, -- fidelizacion | spd | ninguno
  status          text NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo', 'bloqueado')),
  notes_internal  text, -- solo personal autorizado; no exportar por defecto
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  UNIQUE (organization_id, code)
);

CREATE INDEX IF NOT EXISTS ng_clients_org_idx ON ng_clients (organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ng_clients_name_idx ON ng_clients (organization_id, full_name);

-- Expedientes / casos de trabajo 1:N por cliente
CREATE TABLE IF NOT EXISTS ng_cases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES ng_organizations(id),
  client_id       uuid NOT NULL REFERENCES ng_clients(id),
  number          text NOT NULL,
  type            text NOT NULL, -- spd | reclamacion | inspeccion_prep | servicio | otro
  title           text NOT NULL,
  description     text,
  priority        text NOT NULL DEFAULT 'media' CHECK (priority IN ('urgente', 'alta', 'media', 'baja')),
  status          text NOT NULL DEFAULT 'abierto' CHECK (status IN ('abierto', 'en_curso', 'en_revision', 'bloqueado', 'cerrado')),
  assignee_user_id text,
  due_at          timestamptz,
  opened_at       timestamptz NOT NULL DEFAULT now(),
  closed_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  UNIQUE (organization_id, number)
);

CREATE INDEX IF NOT EXISTS ng_cases_client_idx ON ng_cases (client_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ng_cases_org_status_idx ON ng_cases (organization_id, status) WHERE deleted_at IS NULL;

-- Auditoría de operaciones (quién, qué, cuándo, org)
CREATE TABLE IF NOT EXISTS ng_audit_log (
  id              bigserial PRIMARY KEY,
  organization_id uuid,
  actor_user_id   text,
  action          text NOT NULL, -- create | update | delete | export | login_org
  entity          text NOT NULL, -- client | case | membership | org
  entity_id       text,
  meta            jsonb NOT NULL DEFAULT '{}',
  ip              text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ng_audit_org_idx ON ng_audit_log (organization_id, created_at DESC);
