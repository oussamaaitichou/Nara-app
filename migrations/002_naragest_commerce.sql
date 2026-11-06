-- NaraGest commerce / rentabilidad
create table if not exists ng_purchases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references ng_organizations(id),
  number text not null,
  supplier text not null,
  purchase_date date not null default current_date,
  lines_count int not null default 1 check (lines_count >= 1),
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'Pendiente'
    check (status in ('Pendiente', 'Parcial', 'Recibido')),
  family text not null default 'Otros',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, number)
);

create index if not exists ng_purchases_org_idx
  on ng_purchases (organization_id) where deleted_at is null;

create table if not exists ng_sales (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references ng_organizations(id),
  ticket text not null,
  sale_date date not null default current_date,
  sale_time text not null default '12:00',
  amount numeric(12,2) not null,
  payment text not null default 'Tarjeta'
    check (payment in ('Tarjeta', 'Efectivo')),
  lines_count int not null default 1 check (lines_count >= 1),
  kind text not null default 'venta'
    check (kind in ('venta', 'devolucion')),
  category text not null default 'Otros',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, ticket)
);

create index if not exists ng_sales_org_idx
  on ng_sales (organization_id) where deleted_at is null;

create table if not exists ng_margin_lines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references ng_organizations(id),
  product_name text not null,
  category text not null default 'Otros',
  units int not null default 1 check (units >= 1),
  pvp numeric(12,4) not null check (pvp >= 0),
  unit_cost numeric(12,4) not null default 0 check (unit_cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists ng_margin_lines_org_idx
  on ng_margin_lines (organization_id) where deleted_at is null;
