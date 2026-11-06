import { getSql } from "@/lib/db";
import type {
  CreateCaseInput,
  CreateClientInput,
  UpdateCaseInput,
  UpdateClientInput,
} from "./schema";

export type NgClient = {
  id: string;
  organization_id: string;
  code: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  program: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type NgCase = {
  id: string;
  organization_id: string;
  client_id: string;
  number: string;
  type: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  assignee_user_id: string | null;
  due_at: string | null;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  client_name?: string;
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

function nextCode(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

export async function listClients(organizationId: string): Promise<NgClient[]> {
  const sql = await getSql();
  return sql<NgClient>`
    select id, organization_id, code, full_name, phone, email, program, status,
           created_at::text, updated_at::text
    from ng_clients
    where organization_id = ${organizationId} and deleted_at is null
    order by full_name asc
  `;
}

export async function createClient(
  organizationId: string,
  actorUserId: string | null,
  input: CreateClientInput,
): Promise<NgClient> {
  const sql = await getSql();
  const [{ c }] = await sql<{ c: number }>`
    select count(*)::int as c from ng_clients where organization_id = ${organizationId}
  `;
  const code = nextCode("C", (c ?? 0) + 1);
  const rows = await sql<NgClient>`
    insert into ng_clients (
      organization_id, code, full_name, phone, email, program, status, notes_internal
    ) values (
      ${organizationId},
      ${code},
      ${input.fullName},
      ${input.phone || null},
      ${input.email || null},
      ${input.program},
      ${input.status},
      ${input.notesInternal ?? null}
    )
    returning id, organization_id, code, full_name, phone, email, program, status,
              created_at::text, updated_at::text
  `;
  const client = rows[0]!;
  await audit(organizationId, actorUserId, "create", "client", client.id, { code });
  return client;
}

export async function updateClient(
  organizationId: string,
  actorUserId: string | null,
  clientId: string,
  input: UpdateClientInput,
): Promise<NgClient | null> {
  const sql = await getSql();
  const rows = await sql<NgClient>`
    update ng_clients set
      full_name = coalesce(${input.fullName ?? null}, full_name),
      phone = case when ${input.phone !== undefined} then ${input.phone || null} else phone end,
      email = case when ${input.email !== undefined} then ${input.email || null} else email end,
      program = coalesce(${input.program ?? null}, program),
      status = coalesce(${input.status ?? null}, status),
      notes_internal = case when ${input.notesInternal !== undefined} then ${input.notesInternal ?? null} else notes_internal end,
      updated_at = now()
    where id = ${clientId} and organization_id = ${organizationId} and deleted_at is null
    returning id, organization_id, code, full_name, phone, email, program, status,
              created_at::text, updated_at::text
  `;
  const client = rows[0] ?? null;
  if (client) await audit(organizationId, actorUserId, "update", "client", clientId, {});
  return client;
}

export async function softDeleteClient(
  organizationId: string,
  actorUserId: string | null,
  clientId: string,
): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql`
    update ng_clients set deleted_at = now(), updated_at = now()
    where id = ${clientId} and organization_id = ${organizationId} and deleted_at is null
    returning id
  `;
  if (rows[0]) {
    await audit(organizationId, actorUserId, "delete", "client", clientId, {});
    return true;
  }
  return false;
}

export async function listCases(organizationId: string, clientId?: string): Promise<NgCase[]> {
  const sql = await getSql();
  if (clientId) {
    return sql<NgCase>`
      select c.id, c.organization_id, c.client_id, c.number, c.type, c.title, c.description,
             c.priority, c.status, c.assignee_user_id, c.due_at::text, c.opened_at::text,
             c.closed_at::text, c.created_at::text, c.updated_at::text,
             cl.full_name as client_name
      from ng_cases c
      join ng_clients cl on cl.id = c.client_id
      where c.organization_id = ${organizationId}
        and c.client_id = ${clientId}
        and c.deleted_at is null
      order by c.opened_at desc
    `;
  }
  return sql<NgCase>`
    select c.id, c.organization_id, c.client_id, c.number, c.type, c.title, c.description,
           c.priority, c.status, c.assignee_user_id, c.due_at::text, c.opened_at::text,
           c.closed_at::text, c.created_at::text, c.updated_at::text,
           cl.full_name as client_name
    from ng_cases c
    join ng_clients cl on cl.id = c.client_id
    where c.organization_id = ${organizationId} and c.deleted_at is null
    order by c.opened_at desc
    limit 200
  `;
}

export async function createCase(
  organizationId: string,
  actorUserId: string | null,
  input: CreateCaseInput,
): Promise<NgCase> {
  const sql = await getSql();
  // Asegurar que el cliente pertenece a la misma org
  const owners = await sql`
    select id from ng_clients
    where id = ${input.clientId} and organization_id = ${organizationId} and deleted_at is null
  `;
  if (!owners[0]) throw new Error("Cliente no encontrado en esta organización");

  const [{ c }] = await sql<{ c: number }>`
    select count(*)::int as c from ng_cases where organization_id = ${organizationId}
  `;
  const number = nextCode("E", (c ?? 0) + 1);

  const rows = await sql<NgCase>`
    insert into ng_cases (
      organization_id, client_id, number, type, title, description,
      priority, status, assignee_user_id, due_at
    ) values (
      ${organizationId},
      ${input.clientId},
      ${number},
      ${input.type},
      ${input.title},
      ${input.description ?? null},
      ${input.priority},
      ${input.status},
      ${input.assigneeUserId ?? null},
      ${input.dueAt ?? null}
    )
    returning id, organization_id, client_id, number, type, title, description,
              priority, status, assignee_user_id, due_at::text, opened_at::text,
              closed_at::text, created_at::text, updated_at::text
  `;
  const item = rows[0]!;
  await audit(organizationId, actorUserId, "create", "case", item.id, { number });
  return item;
}

export async function updateCase(
  organizationId: string,
  actorUserId: string | null,
  caseId: string,
  input: UpdateCaseInput,
): Promise<NgCase | null> {
  const sql = await getSql();
  const rows = await sql<NgCase>`
    update ng_cases set
      type = coalesce(${input.type ?? null}, type),
      title = coalesce(${input.title ?? null}, title),
      description = case when ${input.description !== undefined} then ${input.description ?? null} else description end,
      priority = coalesce(${input.priority ?? null}, priority),
      status = coalesce(${input.status ?? null}, status),
      assignee_user_id = case when ${input.assigneeUserId !== undefined} then ${input.assigneeUserId ?? null} else assignee_user_id end,
      due_at = case when ${input.dueAt !== undefined} then ${input.dueAt ?? null} else due_at end,
      closed_at = case when ${input.status === "cerrado"} then now() else closed_at end,
      updated_at = now()
    where id = ${caseId} and organization_id = ${organizationId} and deleted_at is null
    returning id, organization_id, client_id, number, type, title, description,
              priority, status, assignee_user_id, due_at::text, opened_at::text,
              closed_at::text, created_at::text, updated_at::text
  `;
  const item = rows[0] ?? null;
  if (item) await audit(organizationId, actorUserId, "update", "case", caseId, {});
  return item;
}

export async function exportClientsCsv(
  organizationId: string,
  actorUserId: string | null,
): Promise<string> {
  const clients = await listClients(organizationId);
  // Minimización: no incluir notes_internal ni emails si política lo exige más adelante
  const header = ["code", "full_name", "phone", "email", "program", "status"];
  const lines = [header.join(",")];
  for (const c of clients) {
    lines.push(
      [c.code, c.full_name, c.phone ?? "", c.email ?? "", c.program ?? "", c.status]
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(","),
    );
  }
  await audit(organizationId, actorUserId, "export", "client", null, { count: clients.length });
  return lines.join("\n");
}
