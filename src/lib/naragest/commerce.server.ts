import { getSql } from "@/lib/db";

export type NgPurchase = {
  id: string;
  organization_id: string;
  number: string;
  supplier: string;
  purchase_date: string;
  lines_count: number;
  amount: string | number;
  status: string;
  family: string;
};

export type NgSale = {
  id: string;
  organization_id: string;
  ticket: string;
  sale_date: string;
  sale_time: string;
  amount: string | number;
  payment: string;
  lines_count: number;
  kind: string;
  category: string;
};

export type NgMarginLine = {
  id: string;
  organization_id: string;
  product_name: string;
  category: string;
  units: number;
  pvp: string | number;
  unit_cost: string | number;
};

async function audit(
  organizationId: string | null,
  actorUserId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  meta: Record<string, unknown> = {},
) {
  const sql = await getSql();
  await sql`
    insert into ng_audit_log (organization_id, actor_user_id, action, entity, entity_id, meta)
    values (
      ${organizationId},
      ${actorUserId},
      ${action},
      ${entity},
      ${entityId},
      ${JSON.stringify(meta)}::jsonb
    )
  `;
}

export async function listPurchases(organizationId: string) {
  const sql = await getSql();
  return sql<NgPurchase>`
    select id, organization_id, number, supplier, purchase_date::text, lines_count,
           amount, status, family
    from ng_purchases
    where organization_id = ${organizationId} and deleted_at is null
    order by purchase_date desc, created_at desc
  `;
}

export async function createPurchase(
  organizationId: string,
  actorUserId: string | null,
  input: {
    supplier: string;
    purchaseDate: string;
    linesCount: number;
    amount: number;
    status: string;
    family: string;
    number?: string;
  },
) {
  const sql = await getSql();
  const [{ c }] = await sql<{ c: number }>`
    select count(*)::int as c from ng_purchases where organization_id = ${organizationId}
  `;
  const number = input.number?.trim() || `P-${new Date().getFullYear()}-${String((c ?? 0) + 100).padStart(3, "0")}`;
  const rows = await sql<NgPurchase>`
    insert into ng_purchases (
      organization_id, number, supplier, purchase_date, lines_count, amount, status, family
    ) values (
      ${organizationId}, ${number}, ${input.supplier}, ${input.purchaseDate}::date,
      ${input.linesCount}, ${input.amount}, ${input.status}, ${input.family}
    )
    returning id, organization_id, number, supplier, purchase_date::text, lines_count,
              amount, status, family
  `;
  const row = rows[0]!;
  await audit(organizationId, actorUserId, "create", "purchase", row.id, { number });
  return row;
}

export async function updatePurchaseStatus(
  organizationId: string,
  actorUserId: string | null,
  id: string,
  status: string,
) {
  const sql = await getSql();
  const rows = await sql<NgPurchase>`
    update ng_purchases set status = ${status}, updated_at = now()
    where id = ${id} and organization_id = ${organizationId} and deleted_at is null
    returning id, organization_id, number, supplier, purchase_date::text, lines_count,
              amount, status, family
  `;
  if (rows[0]) await audit(organizationId, actorUserId, "update", "purchase", id, { status });
  return rows[0] ?? null;
}

export async function softDeletePurchase(
  organizationId: string,
  actorUserId: string | null,
  id: string,
) {
  const sql = await getSql();
  const rows = await sql`
    update ng_purchases set deleted_at = now(), updated_at = now()
    where id = ${id} and organization_id = ${organizationId} and deleted_at is null
    returning id
  `;
  if (rows[0]) await audit(organizationId, actorUserId, "delete", "purchase", id, {});
  return Boolean(rows[0]);
}

export async function listSales(organizationId: string) {
  const sql = await getSql();
  return sql<NgSale>`
    select id, organization_id, ticket, sale_date::text, sale_time, amount, payment,
           lines_count, kind, category
    from ng_sales
    where organization_id = ${organizationId} and deleted_at is null
    order by sale_date desc, sale_time desc
  `;
}

export async function createSale(
  organizationId: string,
  actorUserId: string | null,
  input: {
    saleDate: string;
    saleTime: string;
    amount: number;
    payment: string;
    linesCount: number;
    kind: string;
    category: string;
    ticket?: string;
  },
) {
  const sql = await getSql();
  const [{ c }] = await sql<{ c: number }>`
    select count(*)::int as c from ng_sales where organization_id = ${organizationId}
  `;
  const ticket = input.ticket?.trim() || `T-${10400 + (c ?? 0)}`;
  const amount = input.kind === "devolucion" ? -Math.abs(input.amount) : Math.abs(input.amount);
  const rows = await sql<NgSale>`
    insert into ng_sales (
      organization_id, ticket, sale_date, sale_time, amount, payment, lines_count, kind, category
    ) values (
      ${organizationId}, ${ticket}, ${input.saleDate}::date, ${input.saleTime}, ${amount},
      ${input.payment}, ${input.linesCount}, ${input.kind}, ${input.category}
    )
    returning id, organization_id, ticket, sale_date::text, sale_time, amount, payment,
              lines_count, kind, category
  `;
  const row = rows[0]!;
  await audit(organizationId, actorUserId, "create", "sale", row.id, { ticket });
  return row;
}

export async function softDeleteSale(
  organizationId: string,
  actorUserId: string | null,
  id: string,
) {
  const sql = await getSql();
  const rows = await sql`
    update ng_sales set deleted_at = now(), updated_at = now()
    where id = ${id} and organization_id = ${organizationId} and deleted_at is null
    returning id
  `;
  if (rows[0]) await audit(organizationId, actorUserId, "delete", "sale", id, {});
  return Boolean(rows[0]);
}

export async function listMarginLines(organizationId: string) {
  const sql = await getSql();
  return sql<NgMarginLine>`
    select id, organization_id, product_name, category, units, pvp, unit_cost
    from ng_margin_lines
    where organization_id = ${organizationId} and deleted_at is null
    order by created_at desc
  `;
}

export async function createMarginLine(
  organizationId: string,
  actorUserId: string | null,
  input: {
    productName: string;
    category: string;
    units: number;
    pvp: number;
    unitCost: number;
  },
) {
  const sql = await getSql();
  const rows = await sql<NgMarginLine>`
    insert into ng_margin_lines (
      organization_id, product_name, category, units, pvp, unit_cost
    ) values (
      ${organizationId}, ${input.productName}, ${input.category},
      ${input.units}, ${input.pvp}, ${input.unitCost}
    )
    returning id, organization_id, product_name, category, units, pvp, unit_cost
  `;
  const row = rows[0]!;
  await audit(organizationId, actorUserId, "create", "margin_line", row.id, {});
  return row;
}

export async function softDeleteMarginLine(
  organizationId: string,
  actorUserId: string | null,
  id: string,
) {
  const sql = await getSql();
  const rows = await sql`
    update ng_margin_lines set deleted_at = now(), updated_at = now()
    where id = ${id} and organization_id = ${organizationId} and deleted_at is null
    returning id
  `;
  if (rows[0]) await audit(organizationId, actorUserId, "delete", "margin_line", id, {});
  return Boolean(rows[0]);
}
