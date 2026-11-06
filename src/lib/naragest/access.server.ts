import { getSql } from "@/lib/db";
import { getSessionUser, DEV_USER_ID } from "@/lib/auth/verify.server";
import type { NgRole } from "./permissions";

export type { NgRole } from "./permissions";
export { canWrite, canDelete, canExport } from "./permissions";

export type NgAccess = {
  userId: string;
  organizationId: string;
  roleId: NgRole;
  orgName: string;
};

const DEMO_ORG_ID = "00000000-0000-4000-8000-000000000001";

/**
 * Resuelve actor + organización + rol.
 * 1) Sesión Better Auth si existe
 * 2) Cabeceras x-ng-* (dev/tests)
 * 3) Usuario dev + org demo con membership titular (preview sin auth)
 */
export async function resolveNgAccess(request: Request): Promise<
  { ok: true; access: NgAccess } | { ok: false; status: number; error: string }
> {
  const headerOrg = request.headers.get("x-ng-org-id")?.trim();
  const headerUser = request.headers.get("x-ng-user-id")?.trim();

  let userId: string | null = null;
  try {
    const session = await getSessionUser();
    userId = session?.id ?? null;
  } catch {
    userId = null;
  }

  if (!userId) userId = headerUser ?? DEV_USER_ID;

  await ensureDemoOrg(userId);

  const sql = await getSql();

  if (headerOrg) {
    const rows = await sql<{ organization_id: string; role_id: string; name: string }>`
      select m.organization_id, m.role_id, o.name
      from ng_memberships m
      join ng_organizations o on o.id = m.organization_id
      where m.user_id = ${userId}
        and m.organization_id = ${headerOrg}
        and m.active = true
        and o.deleted_at is null
      limit 1
    `;
    if (!rows[0]) {
      const org = await sql<{ id: string; name: string }>`
        select id, name from ng_organizations where id = ${headerOrg} and deleted_at is null
      `;
      if (!org[0]) return { ok: false, status: 403, error: "Organización no encontrada" };
      await sql`
        insert into ng_memberships (organization_id, user_id, role_id)
        values (${headerOrg}, ${userId}, 'titular')
        on conflict (organization_id, user_id) do update set active = true, role_id = excluded.role_id
      `;
      return {
        ok: true,
        access: {
          userId,
          organizationId: headerOrg,
          roleId: "titular",
          orgName: org[0].name,
        },
      };
    }
    return {
      ok: true,
      access: {
        userId,
        organizationId: rows[0].organization_id,
        roleId: rows[0].role_id as NgRole,
        orgName: rows[0].name,
      },
    };
  }

  const memberships = await sql<{ organization_id: string; role_id: string; name: string }>`
    select m.organization_id, m.role_id, o.name
    from ng_memberships m
    join ng_organizations o on o.id = m.organization_id
    where m.user_id = ${userId} and m.active = true and o.deleted_at is null
    order by m.created_at asc
    limit 1
  `;

  if (!memberships[0]) {
    return { ok: false, status: 403, error: "Sin membresía en ninguna farmacia" };
  }

  return {
    ok: true,
    access: {
      userId,
      organizationId: memberships[0].organization_id,
      roleId: memberships[0].role_id as NgRole,
      orgName: memberships[0].name,
    },
  };
}

async function ensureDemoOrg(userId: string) {
  const sql = await getSql();
  await sql`
    insert into ng_organizations (id, name, slug, ccaa)
    values (${DEMO_ORG_ID}, 'Farmacia Demo', 'farmacia-demo', 'Madrid')
    on conflict (id) do nothing
  `;
  await sql`
    insert into ng_memberships (organization_id, user_id, role_id)
    values (${DEMO_ORG_ID}, ${userId}, 'titular')
    on conflict (organization_id, user_id) do update set active = true
  `;
}
